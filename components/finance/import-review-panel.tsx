'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, BadgeCheck, CheckCircle2, FileSpreadsheet, LoaderCircle, Sparkles, Upload } from 'lucide-react'
import type { FinanceExtraction, ExtractedField } from '@/lib/finance/import-schema'
import { referenceEvidenceRecords } from '@/lib/finance/reference-evidence'

interface ImportResponse {
  importId: string
  filename: string
  status: 'needs_review'
  extraction: FinanceExtraction
}

export function ImportReviewPanel() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<ImportResponse | null>(null)
  const [selected, setSelected] = useState<Record<string, 'accepted' | 'rejected'>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showStarter, setShowStarter] = useState(false)

  async function upload(file?: File) {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/finance/import', { method: 'POST', body })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Import failed')
      setResult(payload)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Import failed')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function decide(field: ExtractedField, status: 'accepted' | 'rejected') {
    setSelected((current) => ({ ...current, [`${field.key}:${field.location}`]: status }))
  }

  const accepted = Object.values(selected).filter((status) => status === 'accepted').length
  const blocking = result?.extraction.fields.filter((field) => field.status !== 'mapped' || field.confidence < 0.75).length ?? 0

  if (!result) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-dashed border-[#002B49]/30 bg-muted/30 p-8 text-center">
          {loading ? <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#FF8C00]" /> : <Sparkles className="mx-auto h-8 w-8 text-[#FF8C00]" />}
          <h2 className="mt-3 text-sm font-semibold text-foreground">{loading ? 'Extracting and validating source' : 'AI-assisted extraction with human validation'}</h2>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-muted-foreground">PDF and Excel files are stored privately. AI maps financial assumptions while preserving page or sheet evidence; no extracted value changes the model until a reviewer accepts it.</p>
          <input ref={inputRef} type="file" accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="sr-only" onChange={(event) => upload(event.target.files?.[0])} />
          <button disabled={loading} onClick={() => inputRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#002B49] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"><Upload className="h-4 w-4" />Choose PDF or Excel</button>
          {error && <p role="alert" className="mt-3 text-xs font-medium text-red-700">{error}</p>}
        </div>
        <div className="mt-4 rounded-xl border border-border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Reference 50 MWp v2.pdf</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700">Starter source — APPROVED</span>
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{referenceEvidenceRecords.length} evidence records</span>
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">Reviewed 2026-07-11</span>
              </div>
            </div>
            <button onClick={() => setShowStarter((v) => !v)} className="mt-2 shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted sm:mt-0">
              {showStarter ? 'Hide evidence' : 'View evidence'}
            </button>
          </div>
          {showStarter && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[760px] text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                    {['Assumption', 'Reviewed value', 'Confidence', 'Source evidence', 'Decision'].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referenceEvidenceRecords.map((record) => (
                    <tr key={record.key} className="border-b border-border/70 align-top">
                      <td className="px-3 py-3"><p className="font-semibold text-foreground">{record.label}</p><p className="text-[10px] text-muted-foreground">{record.key}</p></td>
                      <td className="px-3 py-3 font-semibold tabular-nums">{record.reviewedValue > 0 ? record.reviewedValue.toLocaleString() : '—'} <span className="text-muted-foreground">{record.unit}</span></td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${record.confidence >= 0.95 ? 'bg-green-50 text-green-700' : record.confidence >= 0.85 ? 'bg-[#FFF3E0] text-[#9A5300]' : 'bg-red-50 text-red-700'}`}>{Math.round(record.confidence * 100)}%</span></td>
                      <td className="max-w-xs px-3 py-3"><p className="text-foreground">{record.sourceEvidence}</p><p className="mt-1 text-[10px] text-muted-foreground">{record.sourceLocation}</p><p className="mt-0.5 text-[10px] italic text-muted-foreground">{record.normalisationNote}</p></td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${record.decision === 'accepted' ? 'bg-green-50 text-green-700' : record.decision === 'overridden' ? 'bg-[#FFF3E0] text-[#9A5300]' : 'bg-red-50 text-red-700'}`}>
                          {record.decision === 'accepted' && <CheckCircle2 className="h-3 w-3" />}
                          {record.decision === 'overridden' && <AlertTriangle className="h-3 w-3" />}
                          {record.decision.charAt(0).toUpperCase() + record.decision.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3"><FileSpreadsheet className="mt-0.5 h-5 w-5 text-[#FF8C00]" /><div><p className="text-sm font-semibold text-foreground">{result.filename}</p><p className="mt-1 text-xs text-muted-foreground">{result.extraction.detectedTemplate} · {result.extraction.currency} · {result.extraction.fields.length} mapped candidates</p></div></div>
        <div className="flex items-center gap-2"><span className="rounded-full bg-[#FFF3E0] px-2 py-1 text-[10px] font-semibold text-[#9A5300]">{blocking} need attention</span><span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700">{accepted} accepted</span></div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4"><p className="text-xs font-semibold text-foreground">Extraction summary</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{result.extraction.summary}</p></div>

      {result.extraction.warnings.map((warning) => <div key={warning} className="flex gap-2 rounded-lg border border-[#FF8C00]/30 bg-[#FFF3E0] p-3 text-xs text-foreground"><AlertTriangle className="h-4 w-4 shrink-0" />{warning}</div>)}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] text-xs"><thead><tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">{['Field', 'Extracted value', 'Confidence', 'Evidence', 'Decision'].map((heading) => <th key={heading} className="px-3 py-2.5 font-semibold">{heading}</th>)}</tr></thead>
          <tbody>{result.extraction.fields.map((field) => {
            const id = `${field.key}:${field.location}`
            return <tr key={id} className="border-b border-border/70 align-top"><td className="px-3 py-3"><p className="font-semibold text-foreground">{field.label}</p><p className="text-[10px] text-muted-foreground">{field.key}</p></td><td className="px-3 py-3 font-semibold tabular-nums">{field.value.toLocaleString()} {field.unit}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${field.confidence >= 0.85 ? 'bg-green-50 text-green-700' : 'bg-[#FFF3E0] text-[#9A5300]'}`}>{Math.round(field.confidence * 100)}%</span></td><td className="max-w-sm px-3 py-3"><p className="text-foreground">{field.evidence}</p><p className="mt-1 text-[10px] text-muted-foreground">{field.location} · {field.transformation}</p></td><td className="px-3 py-3"><div className="flex gap-1"><button onClick={() => decide(field, 'accepted')} className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${selected[id] === 'accepted' ? 'border-green-300 bg-green-50 text-green-700' : 'border-border'}`}>Accept</button><button onClick={() => decide(field, 'rejected')} className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${selected[id] === 'rejected' ? 'border-red-300 bg-red-50 text-red-700' : 'border-border'}`}>Reject</button></div></td></tr>
          })}</tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-xs text-muted-foreground"><BadgeCheck className="h-4 w-4 text-green-700" />Accepted values remain a review draft until authentication and persistence are enabled.</div><button onClick={() => { setResult(null); setSelected({}) }} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground">Import another source</button></div>
    </div>
  )
}
