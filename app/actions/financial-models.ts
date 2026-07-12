'use server'

import { createHash } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { financialModelAudit, financialModels, financialModelVersions } from '@/lib/db/schema'
import { calculateFinancialModel } from '@/lib/finance/calculate'
import { assertCan, grantModelRole, listModelRoles, revokeModelRole } from '@/lib/finance/permissions'
import type { FinancialModelAssumptions } from '@/lib/finance/types'
import type { ModelRole } from '@/lib/finance/role-capabilities'

async function getUserId() {
  const { data: session } = await auth.getSession()
  if (!session?.user?.id) throw new Error('Unauthorized')
  return session.user.id
}

function hash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function validateAssumptions(value: FinancialModelAssumptions) {
  const serialized = JSON.stringify(value)
  if (serialized.length > 100_000) throw new Error('Model payload is too large')
  if (!value || !['solar-ipp', 'epc'].includes(value.template) || !value.name?.trim()) throw new Error('Invalid model assumptions')
  if (!Number.isFinite(value.capex) || value.capex < 0 || !Number.isFinite(value.operatingYears) || value.operatingYears < 1 || value.operatingYears > 60) throw new Error('Invalid model values')
}

export async function loadFinancialModel(slug: string) {
  const userId = await getUserId()
  const rows = await db.select({ model: financialModels, version: financialModelVersions })
    .from(financialModels)
    .innerJoin(financialModelVersions, and(eq(financialModelVersions.modelId, financialModels.id), eq(financialModelVersions.version, financialModels.currentVersion)))
    .where(and(eq(financialModels.userId, userId), eq(financialModels.slug, slug)))
    .limit(1)
  return rows[0] ?? null
}

export async function saveFinancialModel(slug: string, projectId: string | null, assumptions: FinancialModelAssumptions, changeNote = 'Saved draft') {
  const userId = await getUserId()
  validateAssumptions(assumptions)
  const result = calculateFinancialModel(assumptions)

  const saved = await db.transaction(async (tx) => {
    const existing = await tx.select().from(financialModels).where(and(eq(financialModels.userId, userId), eq(financialModels.slug, slug))).limit(1)

    // Role gate — if the model exists and is locked (approved), only owners can save
    if (existing[0]) {
      if (existing[0].lockedAt && existing[0].userId !== userId) {
        throw new Error('This model is locked. Only the model owner can create new versions after approval.')
      }
      // Non-owner editors must have the 'edit' capability
      if (existing[0].userId !== userId) {
        await assertCan(existing[0].id, userId, 'edit')
      }
    }
    const nextVersion = existing[0] ? existing[0].currentVersion + 1 : 1
    const [model] = existing[0]
      ? await tx.update(financialModels).set({ name: assumptions.name, projectId, template: assumptions.template, currency: assumptions.currency, currentVersion: nextVersion, updatedAt: new Date() }).where(and(eq(financialModels.id, existing[0].id), eq(financialModels.userId, userId))).returning()
      : await tx.insert(financialModels).values({ userId, slug, projectId, name: assumptions.name, template: assumptions.template, currency: assumptions.currency, currentVersion: nextVersion }).returning()

    await tx.insert(financialModelVersions).values({
      modelId: model.id,
      userId,
      version: nextVersion,
      assumptions,
      results: result,
      validations: result.validations,
      engineVersion: result.engineVersion,
      inputHash: hash(assumptions),
      outputHash: hash(result),
      changeNote: changeNote.slice(0, 500),
    })
    await tx.insert(financialModelAudit).values({ modelId: model.id, userId, action: 'model.version.saved', metadata: { version: nextVersion, status: model.status } })
    return { id: model.id, version: nextVersion, savedAt: new Date().toISOString() }
  })

  revalidatePath(`/finance/models/${slug}`)
  return saved
}

export async function submitFinancialModel(slug: string) {
  const userId = await getUserId()
  const [model] = await db.update(financialModels).set({ status: 'in_review', updatedAt: new Date() }).where(and(eq(financialModels.userId, userId), eq(financialModels.slug, slug))).returning()
  if (!model) throw new Error('Save the model before submitting it')
  await db.insert(financialModelAudit).values({ modelId: model.id, userId, action: 'model.submitted', metadata: { version: model.currentVersion } })
  revalidatePath(`/finance/models/${slug}`)
  return { status: model.status }
}

export async function listFinancialModelVersions(slug: string) {
  const userId = await getUserId()
  const [model] = await db.select().from(financialModels).where(and(eq(financialModels.userId, userId), eq(financialModels.slug, slug))).limit(1)
  if (!model) return []
  return db.select({ version: financialModelVersions.version, changeNote: financialModelVersions.changeNote, engineVersion: financialModelVersions.engineVersion, createdAt: financialModelVersions.createdAt })
    .from(financialModelVersions)
    .where(and(eq(financialModelVersions.modelId, model.id), eq(financialModelVersions.userId, userId)))
    .orderBy(desc(financialModelVersions.version))
}

// ─── Governance actions ───────────────────────────────────────────────────────

/** Approve a model — locks it and records approver metadata. Requires 'approve' capability. */
export async function approveFinancialModel(slug: string, comment = '') {
  const userId = await getUserId()
  const [model] = await db.select().from(financialModels).where(eq(financialModels.slug, slug)).limit(1)
  if (!model) throw new Error('Model not found')
  if (model.status !== 'in_review') throw new Error('Only models in review can be approved')
  await assertCan(model.id, userId, 'approve')

  const [updated] = await db.update(financialModels)
    .set({ status: 'approved', approvedBy: userId, lockedAt: new Date(), reviewComment: comment || null, updatedAt: new Date() })
    .where(eq(financialModels.id, model.id))
    .returning()
  await db.insert(financialModelAudit).values({
    modelId: model.id, userId, action: 'model.approved',
    metadata: { version: model.currentVersion, comment: comment.slice(0, 500) },
  })
  revalidatePath(`/finance/models/${slug}`)
  return { status: updated.status, lockedAt: updated.lockedAt }
}

/** Reject a model — returns it to draft with a mandatory comment. Requires 'reject' capability. */
export async function rejectFinancialModel(slug: string, comment: string) {
  if (!comment?.trim()) throw new Error('A rejection comment is required')
  const userId = await getUserId()
  const [model] = await db.select().from(financialModels).where(eq(financialModels.slug, slug)).limit(1)
  if (!model) throw new Error('Model not found')
  if (model.status !== 'in_review') throw new Error('Only models in review can be rejected')
  await assertCan(model.id, userId, 'reject')

  const [updated] = await db.update(financialModels)
    .set({ status: 'draft', rejectedBy: userId, lockedAt: null, reviewComment: comment.slice(0, 1000), updatedAt: new Date() })
    .where(eq(financialModels.id, model.id))
    .returning()
  await db.insert(financialModelAudit).values({
    modelId: model.id, userId, action: 'model.rejected',
    metadata: { version: model.currentVersion, comment: comment.slice(0, 500) },
  })
  revalidatePath(`/finance/models/${slug}`)
  return { status: updated.status }
}

/** Load the immutable approved snapshot for a model — returns the version pinned at approval time. */
export async function loadApprovedSnapshot(slug: string) {
  const userId = await getUserId()
  const [model] = await db.select().from(financialModels).where(eq(financialModels.slug, slug)).limit(1)
  if (!model) return null
  if (model.status !== 'approved') return null
  await assertCan(model.id, userId, 'read')
  const [snap] = await db.select()
    .from(financialModelVersions)
    .where(and(eq(financialModelVersions.modelId, model.id), eq(financialModelVersions.version, model.currentVersion)))
    .limit(1)
  return snap ?? null
}

/** Load the full audit log for a model (most recent first). */
export async function listModelAuditLog(slug: string) {
  const userId = await getUserId()
  const [model] = await db.select().from(financialModels).where(eq(financialModels.slug, slug)).limit(1)
  if (!model) return []
  await assertCan(model.id, userId, 'read')
  return db.select()
    .from(financialModelAudit)
    .where(eq(financialModelAudit.modelId, model.id))
    .orderBy(desc(financialModelAudit.createdAt))
    .limit(200)
}

/** Role management — grant or revoke a role for a collaborator. */
export async function updateModelCollaborator(slug: string, targetUserId: string, role: ModelRole | 'remove') {
  const userId = await getUserId()
  const [model] = await db.select().from(financialModels).where(and(eq(financialModels.userId, userId), eq(financialModels.slug, slug))).limit(1)
  if (!model) throw new Error('Model not found')
  if (role === 'remove') {
    await revokeModelRole(model.id, userId, targetUserId)
  } else {
    await grantModelRole(model.id, userId, targetUserId, role)
  }
  revalidatePath(`/finance/models/${slug}`)
}

/** List collaborators for a model. */
export async function listModelCollaborators(slug: string) {
  const userId = await getUserId()
  const [model] = await db.select().from(financialModels).where(and(eq(financialModels.userId, userId), eq(financialModels.slug, slug))).limit(1)
  if (!model) return []
  return listModelRoles(model.id)
}
