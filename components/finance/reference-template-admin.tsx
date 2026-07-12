'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  Info,
  Loader2,
  Lock,
} from 'lucide-react'
import type { ReferenceSeedResult } from '@/lib/finance/reference-seed'
import type { ReconciliationItem } from '@/lib/finance/reference-reconcile'

interface Props {
  /** Pass pre-fetched reconciliation data (GET /api/finance/seed-reference) to avoid re-running on client */
  initialData?: Pick<ReferenceSeedResult, 'reconciliation' | 'totalFields' | 'passed' | 'warned' | 'failed' | 'notMapped'>
}

const STATUS_STYLES = {
  pass:       { label: 'Pass',        text: 'text-green-700',      bg: 'bg-green-50',  border: 'border-green-200',  Icon: CheckCircle2  },
  warn:       { label: 'Warn',        text: 'text-amber-700',      bg: 'bg-amber-50',  border: 'border-amber-200',  Icon: AlertTriangle },
  fail:       { label: 'Fail',        text: 'text-red-700',        bg: 'bg-red-50',    border: 'border-red-200',    Icon: AlertTriangle },
  not_mapped: { label: 'Not mapped',  text: 'text-muted-foreground',bg: 'bg-muted',    border: 'border-border',     Icon: Info          },
}

export function ReferenceTemplateAdmin({ initialData }: Props) {
  const [data, setData] = useState(initialData ?? null)
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<{ skipped: boolean; modelId: string | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function fetchReconciliation() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/finance/seed-reference')
      if (!res.ok) throw new Error(await res.text())
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reconciliation')
    } finally {
      setLoading(false)
    }
  }

  async function publishToDb() {
    setSeeding(true)
    setError(null)
    try {
      const res = await fetch('/api/finance/seed-reference', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const result: ReferenceSeedResult = await res.json()
      setSeedResult({ skipped: result.skipped, modelId: result.modelId })
      setData({ reconciliation: result.reconciliation, totalFields: result.totalFields, passed: result.passed, warned: result.warned, failed: result.failed, notMapped: result.notMapped })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  const hasFailed = data && data.failed > 0
  const allClear = data && data.failed === 0

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-[#002B49]" />
          <span className="text-sm font-semibold text-foreground">Reference 50 MWp — Template Governance</span>
          {seedResult && !seedResult.skipped && (
            <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-semibold text-green-700">
              <Lock className="h-2.5 w-2.5" /> Published & Locked
            </span>
          )}
          {seedResult?.skipped && (
            <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Already in DB
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!data && (
            <button
              onClick={fetchReconciliation}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Check reconciliation
            </button>
          )}
          {allClear && !seedResult && (
            <button
              onClick={publishToDb}
              disabled={seeding}
              className="flex items-center gap-1.5 rounded-lg bg-[#002B49] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#003a63] transition-colors disabled:opacity-50"
            >
              {seeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
              Publish to DB
            </button>
          )}
          {data && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? 'Hide' : 'Details'}
            </button>
          )}
        </div>
      </div>

      {/* Summary bar */}
      {data && (
        <div className="flex items-center gap-4 px-4 py-2.5 text-xs border-b border-border">
          <span className="text-muted-foreground">{data.totalFields} fields</span>
          <span className="text-green-700 font-medium">{data.passed} pass</span>
          {data.warned > 0 && <span className="text-amber-700 font-medium">{data.warned} warn</span>}
          {data.failed > 0  && <span className="text-red-700 font-semibold">{data.failed} fail — cannot publish</span>}
          <span className="text-muted-foreground">{data.notMapped} not mapped</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-xs text-red-700 bg-red-50 border-b border-red-200">
          {error}
        </div>
      )}

      {/* Reconciliation table (expanded) */}
      {data && expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Field</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Evidence</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Engine</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Delta</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Note</th>
              </tr>
            </thead>
            <tbody>
              {data.reconciliation.map((row: ReconciliationItem) => {
                const style = STATUS_STYLES[row.status]
                return (
                  <tr key={row.key} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 font-mono text-[11px] text-foreground">{row.key}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {row.unit !== 'USD' && row.unit !== 'MWp' ? row.evidenceValue.toLocaleString() : row.evidenceValue.toLocaleString()} <span className="text-muted-foreground">{row.unit}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {row.engineValue != null ? row.engineValue.toLocaleString(undefined, { maximumFractionDigits: 4 }) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.relativeDelta != null ? (
                        <span className={style.text}>{(row.relativeDelta * 100).toFixed(2)}%</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-medium ${style.bg} ${style.text} ${style.border}`}>
                        <style.Icon className="h-2.5 w-2.5" />
                        {style.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground max-w-xs truncate" title={row.note}>{row.note}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
