'use client'

import { useMemo, useState, useTransition } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Lock, LockOpen, Save, TrendingDown, TrendingUp } from 'lucide-react'
import {
  ACTUAL_METRICS,
  buildVarianceSummary,
  type ActualLineItems,
  type ActualMetricKey,
  type ActualPeriodInput,
} from '@/lib/finance/actuals'
import { lockModelActual, saveModelActual, unlockModelActual } from '@/app/actions/model-actuals'
import type { ModelPeriod } from '@/lib/finance/types'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 })
const signed = (v: number | null) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${compact.format(v)}`)
const signedPct = (v: number | null) => (v === null ? '—' : `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`)

export function ActualsPanel({
  slug,
  baselineVersion,
  forecastPeriods,
  initialActuals,
  currency,
  canEdit,
  canLock,
}: {
  slug: string
  baselineVersion: number
  forecastPeriods: ModelPeriod[]
  initialActuals: ActualPeriodInput[]
  currency: string
  canEdit: boolean
  canLock: boolean
}) {
  const [rows, setRows] = useState<ActualPeriodInput[]>(initialActuals)
  const [drafts, setDrafts] = useState<Record<number, ActualLineItems>>({})
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [activePeriod, setActivePeriod] = useState<number | null>(null)

  const summary = useMemo(() => buildVarianceSummary(forecastPeriods, rows), [forecastPeriods, rows])
  const rowByIndex = useMemo(() => new Map(rows.map((r) => [r.periodIndex, r])), [rows])

  const getDraftValue = (periodIndex: number, key: ActualMetricKey): number | '' => {
    const draft = drafts[periodIndex]
    if (draft && draft[key] !== undefined) return draft[key] as number
    const existing = rowByIndex.get(periodIndex)
    return existing?.actuals[key] ?? ''
  }

  const setDraftValue = (periodIndex: number, key: ActualMetricKey, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [periodIndex]: { ...prev[periodIndex], [key]: value === '' ? undefined : Number(value) },
    }))
  }

  const savePeriod = (period: ModelPeriod) => {
    setMessage('')
    const existing = rowByIndex.get(period.index)
    const merged: ActualLineItems = { ...existing?.actuals, ...drafts[period.index] }
    // strip undefined keys
    const payload: Record<string, number> = {}
    for (const def of ACTUAL_METRICS) {
      const v = merged[def.key]
      if (typeof v === 'number' && Number.isFinite(v)) payload[def.key] = v
    }
    startTransition(async () => {
      try {
        await saveModelActual(slug, period.index, period.label, baselineVersion, payload)
        setRows((prev) => {
          const next = prev.filter((r) => r.periodIndex !== period.index)
          next.push({ periodIndex: period.index, periodLabel: period.label, actuals: payload, locked: existing?.locked ?? false })
          return next.sort((a, b) => a.periodIndex - b.periodIndex)
        })
        setDrafts((prev) => { const n = { ...prev }; delete n[period.index]; return n })
        setMessage(`Saved actuals for ${period.label}`)
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Failed to save actuals')
      }
    })
  }

  const toggleLock = (period: ModelPeriod, lock: boolean) => {
    setMessage('')
    startTransition(async () => {
      try {
        if (lock) await lockModelActual(slug, period.index)
        else await unlockModelActual(slug, period.index)
        setRows((prev) => prev.map((r) => (r.periodIndex === period.index ? { ...r, locked: lock } : r)))
        setMessage(`${lock ? 'Locked' : 'Unlocked'} ${period.label}`)
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Failed to update lock')
      }
    })
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Actual vs forecast</h2>
          <p className="text-xs text-muted-foreground">
            Capture period actuals against baseline v{baselineVersion}. Locked periods become immutable historical fact.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-[#002B49]/10 px-2.5 py-1 text-[10px] font-semibold text-[#002B49]">
            {summary.periodsWithActuals} periods with actuals
          </span>
          <span className="rounded-full bg-[#FFF3E0] px-2.5 py-1 text-[10px] font-semibold text-[#B45309]">
            {summary.lockedPeriods} locked
          </span>
        </div>
      </div>

      {/* Variance summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.totals.map((t) => {
          const tone = t.favourable === null ? 'neutral' : t.favourable ? 'good' : 'bad'
          const styles =
            tone === 'good' ? 'border-green-200 bg-green-50' : tone === 'bad' ? 'border-red-200 bg-red-50' : 'border-border bg-card'
          return (
            <div key={t.key} className={`rounded-xl border p-3 ${styles}`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.label}</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-foreground">
                {t.actual === null ? '—' : `${currency} ${compact.format(t.actual)}`}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                {t.variance !== null && (t.favourable ? <TrendingUp className="h-3 w-3 text-green-600" /> : <TrendingDown className="h-3 w-3 text-red-600" />)}
                {signed(t.variance)} ({signedPct(t.variancePercent)}) vs fcst
              </p>
            </div>
          )
        })}
      </div>

      {/* Blended cash flow: forecast line vs actual bars */}
      <div className="mt-5 rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold text-foreground">Forecast vs actual net cash flow ({currency})</h3>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={summary.blendedCashFlow}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="periodLabel" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => compact.format(Number(v))} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => `${currency} ${compact.format(Number(v))}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="actual" name="Actual" fill="#FF8C00" radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#002B49" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {message && (
        <p className="mt-3 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground">{message}</p>
      )}

      {/* Editable period grid */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[820px] text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-2.5 py-2 font-semibold">Period</th>
              {ACTUAL_METRICS.map((m) => (
                <th key={m.key} className="px-2.5 py-2 font-semibold whitespace-nowrap">{m.label}</th>
              ))}
              <th className="px-2.5 py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {forecastPeriods.map((period) => {
              const row = rowByIndex.get(period.index)
              const locked = !!row?.locked
              const pv = summary.periods.find((p) => p.periodIndex === period.index)
              const isEditing = activePeriod === period.index
              const hasDraft = !!drafts[period.index]
              return (
                <tr key={period.index} className={`border-b border-border/70 ${locked ? 'bg-muted/40' : ''}`}>
                  <td className="px-2.5 py-2 font-semibold whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      {locked && <Lock className="h-3 w-3 text-[#B45309]" />}
                      {period.label}
                    </span>
                  </td>
                  {ACTUAL_METRICS.map((m) => {
                    const mv = pv?.metrics.find((x) => x.key === m.key)
                    return (
                      <td key={m.key} className="px-2.5 py-2">
                        {isEditing && canEdit && !locked ? (
                          <input
                            type="number"
                            value={getDraftValue(period.index, m.key)}
                            onChange={(e) => setDraftValue(period.index, m.key, e.target.value)}
                            placeholder={compact.format(mv?.forecast ?? 0)}
                            className="w-24 rounded border border-border bg-background px-2 py-1 text-xs tabular-nums outline-none focus:border-[#002B49]"
                          />
                        ) : (
                          <span className="flex flex-col">
                            <span className="tabular-nums text-foreground">{mv?.actual === null || mv?.actual === undefined ? '—' : compact.format(mv.actual)}</span>
                            {mv && mv.actual !== null && (
                              <span className={`text-[10px] ${mv.favourable ? 'text-green-600' : 'text-red-600'}`}>
                                {signedPct(mv.variancePercent)}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-2.5 py-2">
                    <div className="flex items-center justify-end gap-1.5">
                      {canEdit && !locked && (isEditing ? (
                        <button
                          onClick={() => savePeriod(period)}
                          disabled={isPending || !hasDraft}
                          className="flex items-center gap-1 rounded-md bg-[#002B49] px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                        >
                          <Save className="h-3 w-3" /> Save
                        </button>
                      ) : (
                        <button
                          onClick={() => setActivePeriod(period.index)}
                          className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-muted"
                        >
                          Enter
                        </button>
                      ))}
                      {canLock && row && (
                        <button
                          onClick={() => toggleLock(period, !locked)}
                          disabled={isPending}
                          className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                        >
                          {locked ? <><LockOpen className="h-3 w-3" /> Unlock</> : <><Lock className="h-3 w-3" /> Lock</>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!canEdit && (
        <p className="mt-3 text-xs text-muted-foreground">You have read-only access — actuals entry is disabled.</p>
      )}
    </div>
  )
}
