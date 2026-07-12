'use server'

import { and, asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { financialModelActuals, financialModelAudit, financialModels } from '@/lib/db/schema'
import { assertCan } from '@/lib/finance/permissions'
import { ACTUAL_METRICS, type ActualLineItems, type ActualPeriodInput } from '@/lib/finance/actuals'

async function getUserId() {
  const { data: session } = await auth.getSession()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

async function resolveModel(slug: string) {
  const [model] = await db.select().from(financialModels).where(eq(financialModels.slug, slug)).limit(1)
  return model ?? null
}

/** Sanitize an actuals payload down to the known numeric metric keys. */
function cleanActuals(input: Record<string, unknown>): ActualLineItems {
  const out: ActualLineItems = {}
  for (const def of ACTUAL_METRICS) {
    const raw = input[def.key]
    if (typeof raw === 'number' && Number.isFinite(raw)) out[def.key] = raw
  }
  return out
}

/** List all actuals rows for a model, ordered by period. */
export async function listModelActuals(slug: string): Promise<ActualPeriodInput[]> {
  const userId = await getUserId()
  const model = await resolveModel(slug)
  if (!model) return []
  await assertCan(model.id, userId, 'read')
  const rows = await db
    .select()
    .from(financialModelActuals)
    .where(eq(financialModelActuals.modelId, model.id))
    .orderBy(asc(financialModelActuals.periodIndex))
  return rows.map((r) => ({
    periodIndex: r.periodIndex,
    periodLabel: r.periodLabel,
    actuals: (r.actuals ?? {}) as ActualLineItems,
    locked: r.locked === 'locked',
  }))
}

/** Upsert actuals for a single period. Locked periods cannot be edited. */
export async function saveModelActual(
  slug: string,
  periodIndex: number,
  periodLabel: string,
  baselineVersion: number,
  actuals: Record<string, unknown>,
  note = '',
) {
  const userId = await getUserId()
  const model = await resolveModel(slug)
  if (!model) throw new Error('Model not found')
  await assertCan(model.id, userId, 'edit')

  const cleaned = cleanActuals(actuals)

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(financialModelActuals)
      .where(and(eq(financialModelActuals.modelId, model.id), eq(financialModelActuals.periodIndex, periodIndex)))
      .limit(1)

    if (existing?.locked === 'locked') {
      throw new Error('This period is locked. Unlock it before editing actuals.')
    }

    if (existing) {
      await tx
        .update(financialModelActuals)
        .set({ actuals: cleaned, note: note.slice(0, 500) || null, periodLabel, baselineVersion, updatedAt: new Date() })
        .where(eq(financialModelActuals.id, existing.id))
    } else {
      await tx.insert(financialModelActuals).values({
        modelId: model.id,
        userId,
        baselineVersion,
        periodIndex,
        periodLabel,
        actuals: cleaned,
        note: note.slice(0, 500) || null,
      })
    }
    await tx.insert(financialModelAudit).values({
      modelId: model.id,
      userId,
      action: 'model.actuals.saved',
      metadata: { periodIndex, periodLabel, baselineVersion },
    })
  })

  revalidatePath(`/finance/models/${slug}`)
  return { periodIndex, saved: true }
}

/** Lock a period's actuals — makes them immutable historical fact. Requires 'approve'. */
export async function lockModelActual(slug: string, periodIndex: number) {
  const userId = await getUserId()
  const model = await resolveModel(slug)
  if (!model) throw new Error('Model not found')
  await assertCan(model.id, userId, 'approve')

  const [row] = await db
    .select()
    .from(financialModelActuals)
    .where(and(eq(financialModelActuals.modelId, model.id), eq(financialModelActuals.periodIndex, periodIndex)))
    .limit(1)
  if (!row) throw new Error('Enter actuals for this period before locking it')

  await db
    .update(financialModelActuals)
    .set({ locked: 'locked', lockedBy: userId, lockedAt: new Date(), updatedAt: new Date() })
    .where(eq(financialModelActuals.id, row.id))
  await db.insert(financialModelAudit).values({
    modelId: model.id,
    userId,
    action: 'model.actuals.locked',
    metadata: { periodIndex, periodLabel: row.periodLabel },
  })
  revalidatePath(`/finance/models/${slug}`)
  return { periodIndex, locked: true }
}

/** Unlock a previously locked period. Requires 'approve'. */
export async function unlockModelActual(slug: string, periodIndex: number) {
  const userId = await getUserId()
  const model = await resolveModel(slug)
  if (!model) throw new Error('Model not found')
  await assertCan(model.id, userId, 'approve')

  const [row] = await db
    .select()
    .from(financialModelActuals)
    .where(and(eq(financialModelActuals.modelId, model.id), eq(financialModelActuals.periodIndex, periodIndex)))
    .limit(1)
  if (!row) throw new Error('No actuals found for this period')

  await db
    .update(financialModelActuals)
    .set({ locked: 'open', lockedBy: null, lockedAt: null, updatedAt: new Date() })
    .where(eq(financialModelActuals.id, row.id))
  await db.insert(financialModelAudit).values({
    modelId: model.id,
    userId,
    action: 'model.actuals.unlocked',
    metadata: { periodIndex, periodLabel: row.periodLabel },
  })
  revalidatePath(`/finance/models/${slug}`)
  return { periodIndex, locked: false }
}
