'use client'

import { CheckCircle, Clock, Lock, MessageSquare, Shield, XCircle } from 'lucide-react'
import { useTransition, useState } from 'react'
import { approveFinancialModel, rejectFinancialModel } from '@/app/actions/financial-models'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GovernanceStatus = 'draft' | 'in_review' | 'approved' | 'rejected' | 'archived'

interface ApprovalWorkflowProps {
  slug: string
  status: GovernanceStatus
  version: number
  lockedAt?: string | null
  reviewComment?: string | null
  approvedBy?: string | null
  rejectedBy?: string | null
  /** Whether the current user has the 'approve' capability */
  canApprove?: boolean
  /** Whether the current user has the 'reject' capability */
  canReject?: boolean
  onStatusChange?: (status: GovernanceStatus) => void
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<GovernanceStatus, { label: string; icon: React.ElementType; chip: string; description: string }> = {
  draft: {
    label: 'Draft',
    icon: Clock,
    chip: 'bg-muted text-muted-foreground border-border',
    description: 'Work in progress. Save and submit for review when ready.',
  },
  in_review: {
    label: 'In Review',
    icon: Shield,
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Submitted for Finance and Commercial review. No further edits until reviewed.',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    chip: 'bg-green-50 text-green-700 border-green-200',
    description: 'Approved and locked. This version is immutable.',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    chip: 'bg-red-50 text-red-700 border-red-200',
    description: 'Returned to draft. Address reviewer comments and re-submit.',
  },
  archived: {
    label: 'Archived',
    icon: Lock,
    chip: 'bg-muted text-muted-foreground border-border',
    description: 'This model version has been archived.',
  },
}

// ─── Workflow steps ───────────────────────────────────────────────────────────

const STEPS: Array<{ id: GovernanceStatus; label: string }> = [
  { id: 'draft',     label: 'Draft' },
  { id: 'in_review', label: 'In Review' },
  { id: 'approved',  label: 'Approved' },
]

function StepTrack({ status }: { status: GovernanceStatus }) {
  const activeIndex = STEPS.findIndex((s) => s.id === status)
  const effectiveIndex = status === 'rejected' ? 1 : activeIndex

  return (
    <div className="flex items-center gap-0" role="list" aria-label="Approval workflow steps">
      {STEPS.map((step, i) => {
        const done = i < effectiveIndex
        const active = i === effectiveIndex && status !== 'rejected'
        const rejected = status === 'rejected' && i === 1

        return (
          <div key={step.id} className="flex items-center" role="listitem">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors ${
              rejected     ? 'border-red-400 bg-red-50 text-red-600' :
              done         ? 'border-green-500 bg-green-500 text-white' :
              active       ? 'border-[#002B49] bg-[#002B49] text-white' :
                             'border-border bg-card text-muted-foreground'
            }`}>
              {done ? '✓' : rejected ? '✕' : i + 1}
            </div>
            <span className={`ml-1.5 text-[10px] font-semibold ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-px w-10 ${done ? 'bg-green-500' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ApprovalWorkflow({
  slug, status, version, lockedAt, reviewComment, canApprove = false, canReject = false, onStatusChange,
}: ApprovalWorkflowProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  const Icon = config.icon
  const [isPending, startTransition] = useTransition()
  const [comment, setComment] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [localStatus, setLocalStatus] = useState<GovernanceStatus>(status)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleApprove = () => {
    setError('')
    startTransition(async () => {
      try {
        const result = await approveFinancialModel(slug, comment)
        setLocalStatus(result.status as GovernanceStatus)
        setSuccessMsg(`Model v${version} approved and locked.`)
        setComment('')
        onStatusChange?.(result.status as GovernanceStatus)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to approve model')
      }
    })
  }

  const handleReject = () => {
    if (!comment.trim()) { setError('A rejection comment is required.'); return }
    setError('')
    startTransition(async () => {
      try {
        const result = await rejectFinancialModel(slug, comment)
        setLocalStatus(result.status as GovernanceStatus)
        setSuccessMsg('Model returned to draft with your comments.')
        setComment('')
        setShowRejectForm(false)
        onStatusChange?.(result.status as GovernanceStatus)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to reject model')
      }
    })
  }

  const currentConfig = STATUS_CONFIG[localStatus] ?? STATUS_CONFIG.draft
  const CurrentIcon = currentConfig.icon

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Approval status</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{currentConfig.description}</p>
        </div>
        <span className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${currentConfig.chip}`}>
          <CurrentIcon className="h-3 w-3" />
          {currentConfig.label}
        </span>
      </div>

      {/* Step track */}
      <StepTrack status={localStatus} />

      {/* Lock notice */}
      {lockedAt && localStatus === 'approved' && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
          <Lock className="h-3.5 w-3.5 text-green-700 flex-shrink-0" />
          <p className="text-xs text-green-700 font-medium">
            Locked at {new Date(lockedAt).toLocaleString()} — this version is immutable.
          </p>
        </div>
      )}

      {/* Review comment from previous rejection */}
      {reviewComment && localStatus === 'draft' && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 text-amber-700 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Reviewer comments</p>
            <p className="mt-0.5 text-xs text-amber-800">{reviewComment}</p>
          </div>
        </div>
      )}

      {/* Approver actions — shown only in_review */}
      {localStatus === 'in_review' && (canApprove || canReject) && (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs font-semibold text-foreground">Reviewer decision</p>

          {/* Optional comment field */}
          {!showRejectForm && (
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional approval comment…"
              rows={2}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          )}

          {/* Reject form */}
          {showRejectForm && (
            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => { setComment(e.target.value); setError('') }}
                placeholder="Rejection reason (required)…"
                rows={3}
                className="w-full rounded-lg border border-red-300 bg-red-50/30 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button onClick={handleReject} disabled={isPending} className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                  {isPending ? 'Rejecting…' : 'Confirm rejection'}
                </button>
                <button onClick={() => { setShowRejectForm(false); setComment(''); setError('') }} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!showRejectForm && (
            <div className="flex items-center gap-2">
              {canApprove && (
                <button onClick={handleApprove} disabled={isPending} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {isPending ? 'Approving…' : 'Approve'}
                </button>
              )}
              {canReject && (
                <button onClick={() => setShowRejectForm(true)} disabled={isPending} className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 transition-colors">
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Feedback messages */}
      {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
      {successMsg && <p role="status" className="text-xs font-medium text-green-700">{successMsg}</p>}
    </div>
  )
}
