/**
 * export-pdf.ts
 * Generates branded PDF documents in-browser using jsPDF.
 *
 * Documents produced:
 *  - Investment Memorandum  (lender/board summary)
 *  - Approval Pack          (version, reviewers, validation findings)
 *  - Assumptions Report     (full assumption listing with evidence notes)
 */

// jsPDF is a browser-only library — lazy import on first call
async function getJsPDF() {
  const { jsPDF } = await import('jspdf')
  return jsPDF
}

type AnyResult = {
  assumptions: Record<string, unknown>
  metrics: Record<string, unknown>
  validations: Array<{ severity: string; code: string; message: string }>
  calculatedAt: string
  engineVersion: string
  periods: Array<Record<string, unknown>>
}

// ─── Brand colours ────────────────────────────────────────────────────────────
const BRAND_NAVY  = [0, 43, 73] as [number, number, number]     // #002B49
const BRAND_GOLD  = [201, 168, 76] as [number, number, number]  // #C9A84C
const BRAND_LIGHT = [238, 240, 251] as [number, number, number] // #EEF0FB
const WHITE       = [255, 255, 255] as [number, number, number]
const GREY_TEXT   = [100, 110, 120] as [number, number, number]
const TEXT_DARK   = [20, 30, 40] as [number, number, number]
const RED         = [220, 38, 38] as [number, number, number]
const AMBER       = [180, 100, 0] as [number, number, number]
const GREEN       = [22, 163, 74] as [number, number, number]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pct(v: unknown) { return typeof v === 'number' && Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : '—' }
function curr(v: unknown, ccy: string) { return typeof v === 'number' ? `${ccy} ${v.toLocaleString('en', { maximumFractionDigits: 0 })}` : '—' }
function x(v: unknown) { return typeof v === 'number' ? `${v.toFixed(2)}x` : '—' }

function headerBand(doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>, title: string, subtitle: string, y = 0) {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...BRAND_NAVY)
  doc.rect(0, y, W, 36, 'F')
  doc.setFillColor(...BRAND_GOLD)
  doc.rect(0, y + 33, W, 3, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, y + 15)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle, 14, y + 26)
  return y + 48
}

function sectionLabel(doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>, label: string, y: number) {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...BRAND_LIGHT)
  doc.rect(0, y, W, 8, 'F')
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND_NAVY)
  doc.text(label.toUpperCase(), 14, y + 5.5)
  return y + 13
}

function kpiGrid(
  doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>,
  items: Array<[string, string, string?]>,
  y: number,
  cols = 3,
) {
  const W = doc.internal.pageSize.getWidth()
  const cellW = (W - 28) / cols
  const cellH = 18
  items.forEach(([label, value, note], i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = 14 + col * cellW
    const cy = y + row * (cellH + 3)
    doc.setFillColor(248, 249, 252)
    doc.roundedRect(cx, cy, cellW - 3, cellH, 2, 2, 'F')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GREY_TEXT)
    doc.text(label, cx + 4, cy + 5.5)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...TEXT_DARK)
    doc.text(value, cx + 4, cy + 13)
    if (note) {
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GREY_TEXT)
      doc.text(note, cx + cellW - 4, cy + 13, { align: 'right' })
    }
  })
  return y + (Math.ceil(items.length / cols)) * (cellH + 3) + 4
}

function twoColTable(
  doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>,
  rows: Array<[string, string]>,
  y: number,
) {
  const W = doc.internal.pageSize.getWidth()
  const colW = (W - 28) / 2
  rows.forEach(([label, value], i) => {
    const cy = y + i * 7.5
    doc.setFillColor(i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255, i % 2 === 0 ? 255 : 255)
    doc.rect(14, cy, W - 28, 7, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GREY_TEXT)
    doc.text(label, 17, cy + 5)
    doc.setTextColor(...TEXT_DARK)
    doc.setFont('helvetica', 'bold')
    doc.text(value, 17 + colW, cy + 5)
  })
  return y + rows.length * 7.5 + 4
}

function addPageFooter(doc: InstanceType<Awaited<ReturnType<typeof getJsPDF>>>, modelName: string, page: number, total: number) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.setFillColor(...BRAND_NAVY)
  doc.rect(0, H - 10, W, 10, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.text(`SmartFlow EPC Finance  ·  ${modelName}  ·  CONFIDENTIAL`, 14, H - 3.5)
  doc.text(`${page} / ${total}`, W - 14, H - 3.5, { align: 'right' })
}

// ─── Investment Memorandum ─────────────────────────────────────────────────────
export async function exportInvestmentMemorandum(raw: unknown) {
  const result = raw as AnyResult
  const JsPDF = await getJsPDF()
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const a = result.assumptions
  const m = result.metrics
  const ccy = String(a.currency ?? 'SAR')
  const name = String(a.name ?? 'Financial Model')
  const template = a.template === 'solar-ipp' ? 'Solar IPP' : 'EPC Contract'
  const W = doc.internal.pageSize.getWidth()

  let y = headerBand(doc, name, `Investment Memorandum  ·  ${template}  ·  ${ccy}  ·  Engine v${result.engineVersion}`)

  // Cover watermark
  doc.setFontSize(48)
  doc.setTextColor(230, 234, 240)
  doc.setFont('helvetica', 'bold')
  doc.text('DRAFT', W / 2, 140, { align: 'center', angle: 45 })

  // Date
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GREY_TEXT)
  doc.text(`Prepared: ${new Date(result.calculatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, W - 14, y - 4, { align: 'right' })

  y = sectionLabel(doc, 'Key Return Metrics', y)
  y = kpiGrid(doc, [
    ['Project IRR', pct(m.projectIrr), `Hurdle ${pct(a.discountRate)}`],
    ['Equity IRR',  pct(m.equityIrr),  `${Math.round(Number(a.debtShare ?? 0) * 100)}% leverage`],
    ['Project NPV', curr(m.projectNpv, ccy), `${a.operatingYears}yr life`],
    ['Min DSCR',    x(m.minimumDscr),  `Avg ${x(m.averageDscr)}`],
    ['Total CAPEX', curr(m.totalCapex, ccy), ''],
    ['Payback',     m.paybackPeriod != null ? `${Number(m.paybackPeriod).toFixed(1)} yrs` : '—', ''],
  ], y)

  if (a.template === 'solar-ipp') {
    y = sectionLabel(doc, 'Debt & Reserve Metrics', y)
    y = kpiGrid(doc, [
      ['Min LLCR',        x(m.minimumLlcr),   ''],
      ['Min PLCR',        x(m.minimumPlcr),   ''],
      ['DSRA peak',       curr(m.dsraPeak, ccy), ''],
      ['IDC capitalised', curr(m.idcCapitalised, ccy), ''],
      ['Total tax paid',  curr(m.totalTaxPaid, ccy), pct(m.effectiveTaxRate)],
      ['Distributions',   curr(m.totalDistribution, ccy), ''],
    ], y)
  } else {
    y = sectionLabel(doc, 'EPC Contract Metrics', y)
    y = kpiGrid(doc, [
      ['Contract value',     curr(m.finalContractValue, ccy), ''],
      ['Margin @ compl.',    pct(m.marginAtCompletion), ''],
      ['EAC',               curr(m.estimateAtCompletion, ccy), ''],
      ['Peak retention',     curr(m.peakRetentionBalance, ccy), ''],
      ['Total advance',      curr(m.totalAdvanceDrawn, ccy), ''],
      ['Bond cost',          curr(m.bondCost, ccy), ''],
    ], y)
  }

  y = sectionLabel(doc, 'Model Parameters', y)
  y = twoColTable(doc, [
    ['Start year',        String(a.startYear ?? '—')],
    ['Operating years',   String(a.operatingYears ?? '—')],
    ['Periodicity',       String(a.periodicity ?? '—')],
    ['Inflation rate',    pct(a.inflationRate)],
    ['Discount rate',     pct(a.discountRate)],
    ['Tax rate',          pct(a.taxRate)],
    ['Debt share',        pct(a.debtShare)],
    ['Debt interest rate',pct(a.debtInterestRate)],
    ['Debt tenor (yrs)',  String(a.debtTenorYears ?? '—')],
  ], y)

  // Validation summary
  const errors   = result.validations.filter(v => v.severity === 'error')
  const warnings = result.validations.filter(v => v.severity === 'warning')
  y = sectionLabel(doc, 'Validation Summary', y + 4)
  const sevColour = errors.length > 0 ? RED : warnings.length > 0 ? AMBER : GREEN
  doc.setFillColor(...sevColour)
  doc.roundedRect(14, y, W - 28, 14, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...WHITE)
  doc.text(
    errors.length > 0
      ? `${errors.length} ERROR${errors.length > 1 ? 'S' : ''} — review before publishing`
      : warnings.length > 0
      ? `${warnings.length} WARNING${warnings.length > 1 ? 'S' : ''} — review recommended`
      : 'All checks passed — model is clean',
    W / 2, y + 8.5, { align: 'center' },
  )
  y += 20

  addPageFooter(doc, name, 1, 1)
  doc.save(`${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-investment-memo.pdf`)
}

// ─── Approval Pack ────────────────────────────────────────────────────────────
export async function exportApprovalPack(raw: unknown, version = 1, reviewer = 'Finance Manager') {
  const result = raw as AnyResult
  const JsPDF = await getJsPDF()
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const a = result.assumptions
  const m = result.metrics
  const ccy = String(a.currency ?? 'SAR')
  const name = String(a.name ?? 'Financial Model')
  const W = doc.internal.pageSize.getWidth()

  let y = headerBand(doc, `${name} — Approval Pack`, `Version ${version}  ·  ${new Date(result.calculatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}  ·  Reviewer: ${reviewer}`)

  y = sectionLabel(doc, 'Version Summary', y)
  y = twoColTable(doc, [
    ['Model name',       name],
    ['Version',          `v${version}`],
    ['Engine',           `v${result.engineVersion}`],
    ['Calculated at',    result.calculatedAt],
    ['Project IRR',      pct(m.projectIrr)],
    ['Equity IRR',       pct(m.equityIrr)],
    ['Min DSCR',         x(m.minimumDscr)],
    ['Project NPV',      curr(m.projectNpv, ccy)],
  ], y)

  y = sectionLabel(doc, 'Validation Findings', y + 4)
  const allFindings = result.validations.length
    ? result.validations
    : [{ severity: 'info', code: 'ALL_CHECKS_PASSED', message: 'All deterministic checks passed.' }]

  allFindings.forEach((v, i) => {
    const cy = y + i * 10
    const colour = v.severity === 'error' ? RED : v.severity === 'warning' ? AMBER : GREEN
    doc.setFillColor(i % 2 === 0 ? 248 : 255, i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 252 : 255)
    doc.rect(14, cy, W - 28, 9, 'F')
    doc.setFillColor(...colour)
    doc.rect(14, cy, 3, 9, 'F')
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colour)
    doc.text(v.severity.toUpperCase(), 20, cy + 5.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...TEXT_DARK)
    doc.text(`[${v.code}]  ${v.message}`, 42, cy + 5.5, { maxWidth: W - 60 })
  })
  y += allFindings.length * 10 + 8

  y = sectionLabel(doc, 'Approval Workflow', y)
  const approvers = [
    { name: reviewer,              role: 'Finance Manager',      status: 'PENDING' },
    { name: 'Commercial Controller', role: 'Commercial Control', status: 'PENDING' },
    { name: 'Project Manager',      role: 'Project Manager',     status: 'PENDING' },
  ]
  approvers.forEach((ap, i) => {
    const cy = y + i * 10
    doc.setFillColor(248, 249, 252)
    doc.roundedRect(14, cy, W - 28, 9, 1.5, 1.5, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...TEXT_DARK)
    doc.text(ap.name, 20, cy + 5.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GREY_TEXT)
    doc.text(ap.role, 80, cy + 5.5)
    doc.setFillColor(...AMBER)
    doc.roundedRect(W - 42, cy + 1.5, 26, 6, 1, 1, 'F')
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...WHITE)
    doc.text(ap.status, W - 29, cy + 5.5, { align: 'center' })
  })

  addPageFooter(doc, name, 1, 1)
  doc.save(`${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-v${version}-approval-pack.pdf`)
}

// ─── Assumptions Report ───────────────────────────────────────────────────────
export async function exportAssumptionsReport(raw: unknown) {
  const result = raw as AnyResult
  const JsPDF = await getJsPDF()
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const a = result.assumptions
  const name = String(a.name ?? 'Financial Model')
  const W = doc.internal.pageSize.getWidth()

  let y = headerBand(doc, `${name} — Assumptions Report`, `Engine v${result.engineVersion}  ·  ${result.calculatedAt}`)
  y = sectionLabel(doc, 'All Assumptions', y)

  const entries = Object.entries(a).filter(([, v]) => typeof v !== 'object')
  entries.forEach(([key, value], i) => {
    const cy = y + i * 7
    doc.setFillColor(i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255, i % 2 === 0 ? 255 : 255)
    doc.rect(14, cy, W - 28, 6.5, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GREY_TEXT)
    doc.text(key, 17, cy + 4.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...TEXT_DARK)
    const display = typeof value === 'number'
      ? (key.toLowerCase().includes('rate') || key.toLowerCase().includes('share') || key.toLowerCase().includes('margin'))
        ? pct(value as number)
        : value.toLocaleString('en', { maximumFractionDigits: 4 })
      : String(value)
    doc.text(display, W - 14, cy + 4.5, { align: 'right' })
  })

  addPageFooter(doc, name, 1, 1)
  doc.save(`${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-assumptions-report.pdf`)
}
