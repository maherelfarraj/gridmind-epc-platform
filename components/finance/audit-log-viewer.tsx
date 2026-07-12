'use client'

import { CheckCircle, Clock, FileEdit, Lock, LogIn, Send, ShieldCheck, UploadCloud, XCircle } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { listModelAuditLog } from '@/app/actions/financial-models'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string
  modelId: string
  userId: string
  action: string
  metadata: Record<string, unknown>
  createdAt: Date
}

// ─── Action config ────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  'model.version.saved':  { icon: FileEdit,   label: 'Version saved',    color: 'text-blue-600 bg-blue-50 border-blue-200' },
  'model.submitted':      { icon: Send,       label: 'Submitted',        color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'model.approved':       { icon: CheckCircle,label: 'Approved',         color: 'text-green-600 bg-green-50 border-green-200' },
  'model.rejected':       { icon: XCircle,    label: 'Rejected',         color: 'text-red-600 bg-red-50 border-red-200' },
  'model.locked':         { icon: Lock,       label: 'Locked',           color: 'text-green-700 bg-green-50 border-green-200' },
  'model.unlocked':       { icon: Lock,       label: 'Unlocked',         color: 'text-muted-foreground bg-muted border-border' },
  'model.import.started': { icon: UploadCloud,label: 'Import started',   color: 'text-[#3944AC] bg-blue-50 border-blue-200' },
  'model.import.done':    { icon: ShieldCheck,label: 'Import completed', color: 'text-green-600 bg-green-50 border-green-200' },
  'model.accessed':       { icon: LogIn,      label: 'Accessed',         color: 'text-muted-foreground bg-muted border-border' },
}

function fallbackConfig(action: string) {
  return { icon: Clock, label: action.replace(/\./g, ' '), color: 'text-muted-foreground bg-muted border-border' }
}

// ─── Single entry row ─────────────────────────────────────────────────────────

function AuditRow({ entry }: { entry: AuditEntry }) {
  const cfg = ACTION_CONFIG[entry.action] ?? fallbackConfig(entry.action)
  const Icon = cfg.icon
  const meta = entry.metadata
  const version = typeof meta.version === 'number' ? ` · v${meta.version}` : ''
  const comment = typeof meta.comment === 'string' && meta.comment ? meta.comment : null

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <span className={`flex-shrink-0 mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border ${cfg.color}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold text-foreground truncate">
            {cfg.label}{version}
          </p>
          <time className="flex-shrink-0 text-[10px] text-muted-foreground tabular-nums" dateTime={entry.createdAt.toString()}>
            {new Date(entry.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
          {entry.userId.slice(0, 8)}… · {entry.action}
        </p>
        {comment && (
          <p className="mt-1 text-[10px] text-foreground/70 italic line-clamp-2">&ldquo;{comment}&rdquo;</p>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AuditLogViewer({ slug }: { slug: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      try {
        const rows = await listModelAuditLog(slug)
        setEntries(rows as AuditEntry[])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load audit log')
      } finally {
        setLoaded(true)
      }
    })
  }, [slug])

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold text-foreground">Audit log</h3>
        {loaded && (
          <span className="text-[10px] text-muted-foreground">{entries.length} event{entries.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="px-5">
        {!loaded && (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
          </div>
        )}

        {loaded && error && (
          <p className="py-4 text-xs text-red-600">{error}</p>
        )}

        {loaded && !error && entries.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">No audit events yet. Events are recorded as the model progresses through the workflow.</p>
        )}

        {loaded && entries.map((e) => <AuditRow key={e.id} entry={e} />)}
      </div>
    </section>
  )
}
