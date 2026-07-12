import { put } from '@vercel/blob'
import { generateText, Output } from 'ai'
import * as XLSX from 'xlsx'
import { NextResponse, type NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { financeExtractionSchema } from '@/lib/finance/import-schema'
import { getRouteSession } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { financialImports } from '@/lib/db/schema'
import { checkRateLimit as checkRateLimitDb, validateMagicBytes, detectZipBomb, UPLOAD_LIMITS } from '@/lib/finance/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

// ─── Constants ────────────────────────────────────────────────────────────────

const ENGINE_VERSION = '2.0.0'

// Accepted MIME types by declared content-type (superset of UPLOAD_LIMITS for CSV)
const ACCEPTED_TYPES: Set<string> = new Set(UPLOAD_LIMITS.ALLOWED_MIME_TYPES)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120)
}



function workbookEvidence(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: true, cellDates: true })
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name]
    const range = sheet['!ref'] ?? 'A1'
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false }).slice(0, 45_000)
    return `SHEET: ${name} (${range})\n${csv}`
  }).join('\n\n').slice(0, 120_000)
}

const extractionInstructions = `You are a senior project-finance model reviewer. Extract assumptions and schedules from the supplied source without inventing values.
Map values to canonical keys where possible: capex, operatingYears, discountRate, inflationRate, taxRate, debtShare, debtInterestRate, debtTenorYears, debtGraceYears, capacityMwp, specificYieldMwhPerMwp, degradationRate, availability, tariffPerMwh, tariffEscalationRate, opexPerMwp, opexEscalationRate, adminCost, adminEscalationRate, contractValue, constructionYears, grossMarginRate, retentionRate, advancePaymentRate, variationOrderRate, overheadRate, contingencyRate.
Rates must be normalized as decimals (8% => 0.08). Preserve a short evidence quote and exact page or sheet/cell location. Mark uncertain mappings ambiguous and contradictory values conflict. Never calculate missing assumptions.`



// ─── POST — Upload and extract ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const jobStartMs = Date.now()

  // 1. Auth guard
  const session = await getRouteSession(request)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }
  const userId = session.user.id

  // 2. Idempotency key — client may resend the same key to avoid duplicate jobs
  const idempotencyKey = request.headers.get('x-idempotency-key')
  if (idempotencyKey) {
    const existing = await db
      .select()
      .from(financialImports)
      .where(eq(financialImports.idempotencyKey, idempotencyKey))
      .limit(1)
    if (existing.length > 0) {
      return NextResponse.json({ importId: existing[0].id, status: existing[0].status, cached: true })
    }
  }

  // 3. Rate limit (DB-backed sliding window via module)
  const rlResult = await checkRateLimitDb(userId)
  if (!rlResult.allowed) {
    return NextResponse.json(
      { error: rlResult.reason },
      { status: 429, headers: { 'Retry-After': String(rlResult.retryAfterSeconds ?? 3600), 'X-RateLimit-Remaining': '0' } },
    )
  }

  // 4. Parse form data
  const formData = await request.formData()
  const file = formData.get('file')
  const modelId = formData.get('modelId') as string | null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Choose a PDF or Excel file.' }, { status: 400 })
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only PDF, XLSX, XLS, or CSV files are supported.' }, { status: 415 })
  }
  if (file.size === 0 || file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: `File must be between 1 byte and ${UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.` }, { status: 413 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  // 5. Magic-byte MIME verification (module)
  const magicOk = validateMagicBytes(new Uint8Array(bytes))
  if (!magicOk) {
    return NextResponse.json({ error: 'File type could not be verified. Ensure the file is a valid PDF, Excel workbook, or CSV.' }, { status: 415 })
  }

  // 6. Zip-bomb guard (module)
  const isXlsx = file.type.includes('spreadsheetml') || file.type.includes('ms-excel')
  const isPdf  = file.type === 'application/pdf'
  if (isXlsx && detectZipBomb(new Uint8Array(bytes))) {
    return NextResponse.json({ error: 'File rejected: decompression ratio indicates a potentially malicious archive.' }, { status: 422 })
  }

  // 7. Persist import job as 'processing' before AI call
  const importId = crypto.randomUUID()
  const pathname = `finance-imports/${importId}-${safeName(file.name)}`

  const [importRow] = await db.insert(financialImports).values({
    id: importId as `${string}-${string}-${string}-${string}-${string}`,
    userId: userId as `${string}-${string}-${string}-${string}-${string}`,
    modelId: (modelId ?? null) as `${string}-${string}-${string}-${string}-${string}` | null,
    pathname,
    filename: file.name,
    contentType: file.type,
    status: 'processing',
    idempotencyKey: idempotencyKey ?? null,
    startedAt: new Date(),
  }).returning()

  // 8. Upload to private Blob
  let blobPathname: string
  try {
    const blob = await put(pathname, bytes, { access: 'private', contentType: file.type })
    blobPathname = blob.pathname
  } catch (err) {
    await db.update(financialImports)
      .set({ status: 'failed', errorMessage: 'Blob upload failed', updatedAt: new Date() })
      .where(eq(financialImports.id, importId as `${string}-${string}-${string}-${string}-${string}`))
    console.error('[v0] Blob upload failed:', err)
    return NextResponse.json({ error: 'File storage failed. Please try again.' }, { status: 503 })
  }

  // 9. AI extraction
  let extraction: unknown
  let usage: Record<string, unknown> = {}
  let aiDurationMs = 0
  let retryCount = 0

  const sourceContent = isPdf
    ? [
        { type: 'text' as const, text: `${extractionInstructions}\nReturn evidence-based structured data for this financial source.` },
        { type: 'file' as const, mediaType: 'application/pdf' as const, data: bytes, filename: file.name },
      ]
    : [
        { type: 'text' as const, text: `${extractionInstructions}\n\nWorkbook structural extraction:\n${workbookEvidence(bytes)}` },
      ]

  // Retry up to 2 times on transient AI errors
  for (let attempt = 0; attempt < 3; attempt++) {
    retryCount = attempt
    const aiStart = Date.now()
    try {
      const result = await generateText({
        model: 'google/gemini-3.1-pro-preview',
        output: Output.object({ schema: financeExtractionSchema, name: 'financialModelExtraction' }),
        messages: [{ role: 'user', content: sourceContent }],
      })
      extraction = result.output
      usage = {
        model: 'google/gemini-3.1-pro-preview',
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
        totalTokens: (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0),
        attemptNumber: attempt + 1,
      }
      aiDurationMs = Date.now() - aiStart
      break
    } catch (err) {
      aiDurationMs = Date.now() - aiStart
      if (attempt === 2) {
        await db.update(financialImports)
          .set({
            status: 'failed',
            errorMessage: `AI extraction failed after ${attempt + 1} attempts: ${err instanceof Error ? err.message : String(err)}`,
            updatedAt: new Date(),
          })
          .where(eq(financialImports.id, importId as `${string}-${string}-${string}-${string}-${string}`))
        console.error('[v0] AI extraction failed:', err)
        return NextResponse.json({ error: 'Extraction failed. Please try again or use a different file.' }, { status: 500 })
      }
      // Brief backoff before retry
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
    }
  }

  // 10. Compute observability metadata
  const extractionData = extraction as { fields?: Array<{ confidence?: number; status?: string }> } | null
  const fields = extractionData?.fields ?? []
  const confidenceScores = fields.map((f) => f.confidence ?? 0).filter((c) => c > 0)
  const avgConfidence = confidenceScores.length > 0
    ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
    : null
  const unresolvedCount = fields.filter((f) => f.status === 'ambiguous' || f.status === 'conflict').length
  const totalDurationMs = Date.now() - jobStartMs

  const observability = {
    engineVersion: ENGINE_VERSION,
    extractedFieldCount: fields.length,
    avgConfidence,
    unresolvedCount,
    retryCount,
    aiDurationMs,
    totalDurationMs,
    fileSizeBytes: file.size,
    fileType: file.type,
    uploadDate: new Date().toISOString(),
  }

  // 11. Persist final result
  await db.update(financialImports)
    .set({
      status: 'needs_review',
      extraction: extraction as Record<string, unknown>,
      usageMetadata: { ...usage as Record<string, unknown>, ...observability },
      updatedAt: new Date(),
      completedAt: new Date(),
    })
    .where(eq(financialImports.id, importId as `${string}-${string}-${string}-${string}-${string}`))

  return NextResponse.json({
    importId,
    pathname: blobPathname,
    filename: file.name,
    mediaType: file.type,
    status: 'needs_review',
    extraction,
    usage: { ...usage as Record<string, unknown>, ...observability },
  }, {
    headers: { 'X-RateLimit-Remaining': String(UPLOAD_LIMITS.MAX_IMPORTS_PER_HOUR - 1) },
  })
}

// ─── GET — Job status poll ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await getRouteSession(request)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const importId = request.nextUrl.searchParams.get('id')
  if (!importId) {
    return NextResponse.json({ error: 'Missing import id' }, { status: 400 })
  }

  const rows = await db
    .select({
      id: financialImports.id,
      status: financialImports.status,
      filename: financialImports.filename,
      errorMessage: financialImports.errorMessage,
      usageMetadata: financialImports.usageMetadata,
      createdAt: financialImports.createdAt,
      updatedAt: financialImports.updatedAt,
    })
    .from(financialImports)
    .where(eq(financialImports.id, importId as `${string}-${string}-${string}-${string}-${string}`))
    .limit(1)

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Scope: only the owning user may poll their own job
  const fullRow = await db
    .select()
    .from(financialImports)
    .where(eq(financialImports.id, importId as `${string}-${string}-${string}-${string}-${string}`))
    .limit(1)

  if (fullRow[0]?.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(rows[0])
}
