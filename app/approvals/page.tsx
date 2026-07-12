'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { ApprovalDrawer } from '@/components/shared/approval-drawer'
import { KPICard } from '@/components/shared/kpi-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { useWorkspace, type ApprovalItem } from '@/lib/workspace-store'
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock,
  Filter,
  MessageSquare,
  RotateCcw,
  Search,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from 'lucide-react'
import { useState } from 'react'

const priorityColors = {
  high: 'bg-red-950/20 text-red-400 border-red-800/30',
  medium: 'bg-accent text-amber-400 border-amber-500/20',
  low: 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30',
}

const stageColors: Record<number, string> = {
  1: 'bg-secondary/60 text-foreground',
  2: 'bg-secondary/60 text-primary',
  3: 'bg-secondary/60 text-teal-400',
  4: 'bg-accent text-primary',
  5: 'bg-accent text-amber-400',
  6: 'bg-emerald-950/20 text-emerald-400',
  7: 'bg-purple-950/20 text-purple-400',
}

export default function ApprovalsPage() {
  const { approvals, decideApproval } = useWorkspace()
  const [selected, setSelected] = useState<ApprovalItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const openItem = (item: ApprovalItem) => {
    setSelected(item)
    setDrawerOpen(true)
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleAction = (action: 'approve' | 'reject' | 'delegate', item: ApprovalItem) => {
    const msgs = {
      approve: `"${item.title}" has been approved and next approver notified.`,
      reject: `"${item.title}" has been rejected with comments.`,
      delegate: `"${item.title}" has been delegated for review.`,
    }
    decideApproval(item.id, action)
    showToast(msgs[action])
    setSelected(null)
    setDrawerOpen(false)
  }

  const filtered = approvals.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.project.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const counts = {
    pending: approvals.filter(a => a.status === 'pending').length,
    'under-review': approvals.filter(a => a.status === 'under-review').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px]">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-secondary text-foreground text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-auto text-foreground/50 hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Approval Queue</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Review, approve, reject, or delegate workflow items</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-red-950/20 text-red-400 border border-red-800/30 px-3 py-1.5 rounded-lg font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {counts.pending} Pending Action
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Pending" value={counts.pending} subtitle="Requires your action" accent="orange" icon={Clock} />
          <KPICard title="Under Review" value={counts['under-review']} subtitle="Being reviewed" accent="indigo" icon={RotateCcw} />
          <KPICard title="Approved" value={counts.approved} subtitle="This month" accent="green" icon={CheckCircle} />
          <KPICard title="Rejected" value={counts.rejected} subtitle="Needs revision" accent="red" icon={X} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search approvals or projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'pending', 'under-review', 'approved', 'rejected'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                  statusFilter === s
                    ? 'bg-secondary text-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {s === 'all' ? `All (${approvals.length})` : s === 'under-review' ? `Under Review (${counts['under-review']})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s as keyof typeof counts] ?? 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* Approvals list + detail panel */}
        <div className="flex gap-6">
          {/* List */}
          <div className={`space-y-3 ${selected ? 'hidden lg:block lg:w-[420px] flex-shrink-0' : 'flex-1'}`}>
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => openItem(item)}
                className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                  selected?.id === item.id ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-mono text-muted-foreground">{item.id}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityColors[item.priority]}`}>
                        {item.priority.toUpperCase()}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${stageColors[item.stageNum]}`}>
                        S{item.stageNum}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.project}</p>
                  </div>
                  <StatusBadge status={item.status as any} size="sm" />
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.submittedBy}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Due: {item.due}</span>
                  <span className="flex items-center gap-1 ml-auto"><MessageSquare className="w-3 h-3" />{item.comments}</span>
                </div>

                {/* Approver chips */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {item.approvers.map((a, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        a.status === 'approved' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30' :
                        a.status === 'rejected' ? 'bg-red-950/20 text-red-400 border-red-800/30' :
                        'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'approved' ? 'bg-emerald-500' : a.status === 'rejected' ? 'bg-red-500' : 'bg-muted-foreground'}`} />
                      {a.role}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium text-foreground">No items found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden h-fit">
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary">
                <div>
                  <p className="text-white text-xs font-mono opacity-70">{selected.id}</p>
                  <p className="text-white font-semibold text-sm mt-0.5">{selected.title}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Meta */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Project', value: selected.project },
                    { label: 'Type', value: selected.type },
                    { label: 'Stage', value: selected.stage },
                    { label: 'Submitted By', value: selected.submittedBy },
                    { label: 'Submitted', value: selected.submittedDate },
                    { label: 'Due Date', value: selected.due },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                      <p className="text-xs font-medium text-foreground mt-0.5">{f.value}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                  <p className="text-xs text-foreground leading-relaxed">{selected.description}</p>
                </div>

                {/* Approver chain */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Approval Chain</p>
                  <div className="space-y-2">
                    {selected.approvers.map((a, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          a.status === 'approved' ? 'bg-emerald-950/20 text-emerald-400' :
                          a.status === 'rejected' ? 'bg-red-950/20 text-red-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {a.status === 'approved' ? <CheckCircle className="w-3.5 h-3.5" /> :
                           a.status === 'rejected' ? <X className="w-3.5 h-3.5" /> :
                           <Clock className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">{a.name}</p>
                          <p className="text-[10px] text-muted-foreground">{a.role}</p>
                        </div>
                        <span className={`text-[10px] font-medium capitalize ${
                          a.status === 'approved' ? 'text-emerald-400' :
                          a.status === 'rejected' ? 'text-red-600' :
                          'text-muted-foreground'
                        }`}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment box */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Add Decision Comment</p>
                  <textarea
                    rows={3}
                    className="w-full border border-border rounded-lg px-3 py-2 text-xs text-foreground bg-background outline-none focus:border-primary resize-none placeholder:text-muted-foreground"
                    placeholder="Add reason for approval, rejection, or delegation..."
                  />
                </div>

                {/* Action buttons */}
                {(selected.status === 'pending' || selected.status === 'under-review') && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => handleAction('approve', selected)}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction('reject', selected)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction('delegate', selected)}
                      className="flex items-center justify-center gap-2 border border-border text-foreground text-sm font-medium py-2.5 px-4 rounded-lg hover:bg-muted transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Delegate
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile slide-over drawer — visible on small screens where inline panel is hidden */}
      <div className="lg:hidden">
        <ApprovalDrawer
          isOpen={drawerOpen}
          onClose={() => { setDrawerOpen(false); setSelected(null) }}
          item={selected ? {
            id: selected.id,
            title: selected.title,
            type: selected.type,
            project: selected.project,
            stage: selected.stage,
            submittedBy: selected.submittedBy,
            submittedDate: selected.submittedDate,
            dueDate: selected.due,
            priority: selected.priority,
            status: selected.status === 'approved' || selected.status === 'rejected' ? 'pending' : selected.status,
            description: selected.description,
          } : null}
          onApprove={(id, comment) => {
            const item = approvals.find(a => a.id === id)
            if (item) handleAction('approve', item)
          }}
          onReject={(id, comment) => {
            const item = approvals.find(a => a.id === id)
            if (item) handleAction('reject', item)
          }}
          onDelegate={(id) => {
            const item = approvals.find(a => a.id === id)
            if (item) handleAction('delegate', item)
          }}
        />
      </div>
    </AppLayout>
  )
}
