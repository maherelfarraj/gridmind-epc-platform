// ─── Role hierarchy ───────────────────────────────────────────────────────────
// Pure module — no DB imports, safe to use in tests and client code.

export type ModelRole = 'owner' | 'editor' | 'reviewer' | 'approver' | 'read_only'
export type ModelCapability = 'read' | 'edit' | 'submit' | 'approve' | 'reject' | 'lock' | 'grant_roles' | 'delete' | 'comment'

/** Capabilities granted at each role level. */
const ROLE_CAPS: Record<ModelRole, ReadonlySet<ModelCapability>> = {
  owner:     new Set(['read', 'edit', 'submit', 'approve', 'reject', 'lock', 'grant_roles', 'delete', 'comment']),
  approver:  new Set(['read', 'approve', 'reject', 'comment']),
  reviewer:  new Set(['read', 'comment']),
  editor:    new Set(['read', 'edit', 'submit', 'comment']),
  read_only: new Set(['read']),
}

export function roleHasCapability(role: ModelRole, cap: ModelCapability): boolean {
  return ROLE_CAPS[role]?.has(cap) ?? false
}
