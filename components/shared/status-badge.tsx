import { cn } from '@/lib/utils'

type Status =
  | 'draft'
  | 'submitted'
  | 'under-review'
  | 'approved'
  | 'rejected'
  | 'closed'
  | 'in-progress'
  | 'pending'
  | 'overdue'
  | 'completed'
  | 'on-hold'
  | 'active'

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md'
  className?: string
}

const statusConfig: Record<Status, { label: string; className: string; dot: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-white/[0.04] text-white/35 border-white/[0.08]',
    dot: 'bg-white/25',
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-[#4A7FA5]/12 text-[#7EB8D9] border-[#4A7FA5]/25',
    dot: 'bg-[#7EB8D9]',
  },
  'under-review': {
    label: 'Under Review',
    className: 'bg-[#C9A55A]/10 text-[#C9A55A] border-[#C9A55A]/20',
    dot: 'bg-[#C9A55A]',
  },
  approved: {
    label: 'Approved',
    className: 'bg-[#5A8A6A]/12 text-[#7EC99A] border-[#5A8A6A]/25',
    dot: 'bg-[#7EC99A]',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    dot: 'bg-red-400',
  },
  closed: {
    label: 'Closed',
    className: 'bg-white/[0.04] text-white/30 border-white/[0.07]',
    dot: 'bg-white/20',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-[#4A7FA5]/12 text-[#7EB8D9] border-[#4A7FA5]/25',
    dot: 'bg-[#7EB8D9]',
  },
  pending: {
    label: 'Pending',
    className: 'bg-[#C9A55A]/10 text-[#C9A55A] border-[#C9A55A]/20',
    dot: 'bg-[#C9A55A]',
  },
  overdue: {
    label: 'Overdue',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    dot: 'bg-red-400 animate-pulse',
  },
  completed: {
    label: 'Completed',
    className: 'bg-[#5A8A6A]/12 text-[#7EC99A] border-[#5A8A6A]/25',
    dot: 'bg-[#7EC99A]',
  },
  'on-hold': {
    label: 'On Hold',
    className: 'bg-[#8B6F3A]/12 text-[#D4A85A] border-[#8B6F3A]/25',
    dot: 'bg-[#D4A85A]',
  },
  active: {
    label: 'Active',
    className: 'bg-[#5A8A6A]/12 text-[#7EC99A] border-[#5A8A6A]/25',
    dot: 'bg-[#7EC99A]',
  },
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        config.className,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      {config.label}
    </span>
  )
}
