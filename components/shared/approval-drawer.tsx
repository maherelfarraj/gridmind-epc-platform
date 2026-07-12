'use client'

import { cn } from '@/lib/utils'
import { CheckCircle, ChevronRight, Clock, FileText, MessageSquare, X, XCircle } from 'lucide-react'
import { useState } from 'react'
import { StatusBadge } from './status-badge'

interface ApprovalItem {
  id: string
  title: string
  type: string
  project: string
  stage: string
  submittedBy: string
  submittedDate: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'under-review'
  description?: string
}

interface ApprovalDrawerProps {
  isOpen: boolean
  onClose: () => void
  item?: ApprovalItem | null
  onApprove?: (id: string, comment: string) => void
  onReject?: (id: string, comment: string) => void
  onDelegate?: (id: string) => void
}

export function ApprovalDrawer({
  isOpen,
  onClose,
  item,
  onApprove,
  onReject,
  onDelegate,
}: ApprovalDrawerProps) {
  const [comment, setComment] = useState('')
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  const handleAction = (type: 'approve' | 'reject') => {
    if (!item) return
    if (type === 'approve') onApprove?.(item.id, comment)
    else onReject?.(item.id, comment)
    setComment('')
    setAction(null)
    onClose()
  }

  const priorityColors = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-[#FF8C00] bg-[#FFF3E0] border-[#FF8C00]/20',
    low: 'text-green-600 bg-green-50 border-green-200',
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl z-50 flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#002B49]">
          <div>
            <p className="text-white font-semibold">Approval Review</p>
            <p className="text-[#B8C8D8] text-xs mt-0.5">Review and take action</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#B8C8D8] hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {item ? (
          <div className="flex-1 overflow-y-auto">
            {/* Item details */}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-foreground text-sm leading-tight">{item.title}</h3>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0', priorityColors[item.priority])}>
                    {item.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={item.status} size="sm" />
                  <span className="text-[10px] bg-[#EEF0FB] text-[#3944AC] px-2 py-0.5 rounded-full border border-[#3944AC]/20 font-medium">
                    {item.type}
                  </span>
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                    {item.stage}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Project', value: item.project },
                  { label: 'Submitted by', value: item.submittedBy },
                  { label: 'Submitted', value: item.submittedDate },
                  { label: 'Due date', value: item.dueDate },
                ].map((field) => (
                  <div key={field.label} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{field.label}</p>
                    <p className="text-xs font-medium text-foreground mt-0.5">{field.value}</p>
                  </div>
                ))}
              </div>

              {item.description && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Decision History</p>
                <div className="space-y-2">
                  {[
                    { user: 'Engineering Manager', action: 'Approved', date: '2 days ago', color: 'text-green-600' },
                    { user: 'QA/QC Manager', action: 'Reviewed', date: '3 days ago', color: 'text-[#3944AC]' },
                  ].map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <CheckCircle className={cn('w-3.5 h-3.5 flex-shrink-0', h.color)} />
                      <span className="font-medium text-foreground">{h.user}</span>
                      <span className={cn('ml-auto', h.color)}>{h.action}</span>
                      <span className="text-muted-foreground">{h.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Add Comment</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter your review comments..."
                  rows={3}
                  className="w-full text-sm border border-border rounded-lg p-3 bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-[#3944AC]/30 resize-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select an approval item to review</p>
            </div>
          </div>
        )}

        {/* Actions */}
        {item && (
          <div className="p-4 border-t border-border bg-muted/30 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('approve')}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleAction('reject')}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
            <button
              onClick={() => onDelegate?.(item.id)}
              className="w-full flex items-center justify-center gap-2 border border-border bg-card hover:bg-muted text-foreground text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              Delegate
            </button>
          </div>
        )}
      </div>
    </>
  )
}
