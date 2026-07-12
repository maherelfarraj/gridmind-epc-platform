'use server'

import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { financialModelRoles, financialModels } from '@/lib/db/schema'
import { roleHasCapability } from './role-capabilities'
import type { ModelCapability, ModelRole } from './role-capabilities'

export type { ModelCapability, ModelRole } from './role-capabilities'

// ─── DB lookups ──────────────────────────────────────────────────────────────

/** Returns the role a user holds on a model row, or null if none. */
export async function getUserModelRole(modelId: string, userId: string): Promise<ModelRole | null> {
  // Check if user is the model owner (their userId matches the model row)
  const [model] = await db
    .select({ userId: financialModels.userId })
    .from(financialModels)
    .where(eq(financialModels.id, modelId))
    .limit(1)
  if (model?.userId === userId) return 'owner'

  // Check explicit role grant
  const [grant] = await db
    .select({ role: financialModelRoles.role })
    .from(financialModelRoles)
    .where(and(eq(financialModelRoles.modelId, modelId), eq(financialModelRoles.userId, userId)))
    .limit(1)
  return (grant?.role as ModelRole | undefined) ?? null
}

/** Throws if the user does not have the required capability on the model. */
export async function assertCan(modelId: string, userId: string, cap: ModelCapability): Promise<void> {
  const role = await getUserModelRole(modelId, userId)
  if (!role || !roleHasCapability(role, cap)) {
    throw new Error(`Forbidden: you need the '${cap}' capability to perform this action.`)
  }
}

/** Grant or update a role for a user on a model. Only owners can grant. */
export async function grantModelRole(modelId: string, grantorId: string, targetUserId: string, role: ModelRole): Promise<void> {
  await assertCan(modelId, grantorId, 'grant_roles')
  await db
    .insert(financialModelRoles)
    .values({ modelId, userId: targetUserId, role, grantedBy: grantorId })
    .onConflictDoUpdate({
      target: [financialModelRoles.modelId, financialModelRoles.userId],
      set: { role, grantedBy: grantorId, createdAt: new Date() },
    })
}

/** Revoke a role grant from a user. Only owners can revoke. */
export async function revokeModelRole(modelId: string, grantorId: string, targetUserId: string): Promise<void> {
  await assertCan(modelId, grantorId, 'grant_roles')
  await db
    .delete(financialModelRoles)
    .where(and(eq(financialModelRoles.modelId, modelId), eq(financialModelRoles.userId, targetUserId)))
}

/** List all explicit role grants for a model. */
export async function listModelRoles(modelId: string) {
  return db
    .select()
    .from(financialModelRoles)
    .where(eq(financialModelRoles.modelId, modelId))
    .orderBy(financialModelRoles.createdAt)
}
