import { integer, jsonb, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import type { FinancialModelAssumptions, FinancialModelResult, ModelValidation } from '@/lib/finance/types'

export const financialModels = pgTable('financial_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  organizationId: uuid('organization_id'),
  slug: text('slug').notNull(),
  projectId: text('project_id'),
  name: text('name').notNull(),
  template: text('template').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status').notNull().default('draft'),
  currentVersion: integer('current_version').notNull().default(1),
  // Governance — set by approval/rejection actions
  approvedBy: uuid('approved_by'),
  rejectedBy: uuid('rejected_by'),
  reviewComment: text('review_comment'),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique('financial_models_user_slug_unique').on(table.userId, table.slug)])

export const financialModelVersions = pgTable('financial_model_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id').notNull(),
  userId: uuid('user_id').notNull(),
  version: integer('version').notNull(),
  assumptions: jsonb('assumptions').$type<FinancialModelAssumptions>().notNull(),
  results: jsonb('results').$type<FinancialModelResult>().notNull(),
  validations: jsonb('validations').$type<ModelValidation[]>().notNull().default([]),
  engineVersion: text('engine_version').notNull(),
  inputHash: text('input_hash').notNull(),
  outputHash: text('output_hash').notNull(),
  changeNote: text('change_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique('financial_model_versions_model_version_unique').on(table.modelId, table.version)])

export const financialModelAudit = pgTable('financial_model_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id').notNull(),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const financialModelRoles = pgTable('financial_model_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: text('role').notNull(), // 'owner' | 'editor' | 'reviewer' | 'approver' | 'read_only'
  grantedBy: uuid('granted_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique('financial_model_roles_model_user_unique').on(table.modelId, table.userId)])

export const financialModelActuals = pgTable('financial_model_actuals', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id').notNull(),
  userId: uuid('user_id').notNull(),
  // Which model version the actuals are being compared against
  baselineVersion: integer('baseline_version').notNull(),
  periodIndex: integer('period_index').notNull(),
  periodLabel: text('period_label').notNull(),
  // Captured actual line items for the period (revenue, cost, cash, etc.)
  actuals: jsonb('actuals').$type<Record<string, number>>().notNull().default({}),
  note: text('note'),
  // Once locked, actuals become immutable historical fact
  locked: text('locked').notNull().default('open'), // 'open' | 'locked'
  lockedBy: uuid('locked_by'),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique('financial_model_actuals_model_period_unique').on(table.modelId, table.periodIndex)])

export const financialImports = pgTable('financial_imports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  modelId: uuid('model_id'),
  pathname: text('pathname').notNull(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  status: text('status').notNull().default('pending'),
  extraction: jsonb('extraction').$type<Record<string, unknown>>(),
  reviewDecisions: jsonb('review_decisions').$type<Record<string, unknown>>(),
  // AI usage and observability metadata
  usageMetadata: jsonb('usage_metadata').$type<Record<string, unknown>>(),
  // Idempotency key — client-supplied to prevent duplicate jobs on retry
  idempotencyKey: text('idempotency_key'),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
