'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { saveFinancialModel, submitFinancialModel } from '@/app/actions/financial-models'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Calculator,
  Download,
  FileDown,
  FileSearch,
  FileText,
  Gauge,
  GitCompare,
  Save,
  ShieldCheck,
  ShieldHalf,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AppLayout } from '@/components/layout/app-layout'
import { ImportReviewPanel } from '@/components/finance/import-review-panel'
import { SensitivityPanel } from '@/components/finance/sensitivity-panel'
import { ActualsPanel } from '@/components/finance/actuals-panel'
import { DistributionWaterfall } from '@/components/finance/distribution-waterfall'
import { ModelDiff } from '@/components/finance/model-diff'
import { ApprovalWorkflow } from '@/components/finance/approval-workflow'
import { AuditLogViewer } from '@/components/finance/audit-log-viewer'
import { FormulaLineage } from '@/components/finance/formula-lineage'
import { exportModelXlsx, exportScheduleCsv } from '@/lib/finance/export-xlsx'
import { exportInvestmentMemorandum, exportApprovalPack, exportAssumptionsReport } from '@/lib/finance/export-pdf'
import { calculateFinancialModel } from '@/lib/finance/calculate'
import { referenceSolarIppTemplate, epcStarterTemplate } from '@/lib/finance/templates'
import { useWorkspace } from '@/lib/workspace-store'
import type { FinancialModelAssumptions, ModelTemplate } from '@/lib/finance/types'
import type { ActualPeriodInput } from '@/lib/finance/actuals'

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const percent = (value: number | null) => (value === null ? '—' : `${(value * 100).toFixed(1)}%`)
const multiple = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}x`)

function Field({ label, value, suffix, onChange, step = 1 }: { label: string; value: number; suffix?: string; onChange: (value: number) => void; step?: number }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center overflow-hidden rounded-lg border border-border bg-background focus-within:border-[#002B49]">
        <input
          type="number"
          value={value}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-semibold text-foreground outline-none"
        />
        {suffix && <span className="border-l border-border bg-muted px-2.5 py-2 text-[11px] text-muted-foreground">{suffix}</span>}
      </span>
    </label>
  )
}

function Metric({ label, value, note, tone = 'navy' }: { label: string; value: string; note: string; tone?: 'navy' | 'orange' | 'green' }) {
  const styles = tone === 'orange' ? 'border-[#FF8C00]/30 bg-[#FFF3E0]' : tone === 'green' ? 'border-green-200 bg-green-50' : 'border-[#002B49]/15 bg-card'
  return (
    <div className={`rounded-xl border p-4 ${styles}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  )
}

export function ModelWorkspace({ initialTemplate = 'solar-ipp', modelId = 'reference-solar-ipp', persistedModel, persistedStatus = 'draft', persistedVersion = 0, persistedActuals = [], isPersisted = false }: { initialTemplate?: ModelTemplate; modelId?: string; persistedModel?: FinancialModelAssumptions; persistedStatus?: string; persistedVersion?: number; persistedActuals?: ActualPeriodInput[]; isPersisted?: boolean }) {
  const { getProject, createApproval, pushNotification, pushActivity } = useWorkspace()
  const projectId = modelId.startsWith('project-') ? modelId.replace('project-', '') : modelId
  const linkedProject = getProject(projectId)
  const defaultModel = initialTemplate === 'solar-ipp' ? referenceSolarIppTemplate : { ...epcStarterTemplate, name: linkedProject ? `${linkedProject.name} Financial Model` : epcStarterTemplate.name }
  const [model, setModel] = useState<FinancialModelAssumptions>(persistedModel ?? defaultModel)
  const [activeTab, setActiveTab] = useState<'assumptions' | 'cashflow' | 'sensitivity' | 'actuals' | 'compare' | 'validation' | 'governance' | 'sources'>('assumptions')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [scenario, setScenario] = useState<'downside' | 'base' | 'upside'>('base')
  const [submitted, setSubmitted] = useState(persistedStatus === 'in_review')
  const [version, setVersion] = useState(persistedVersion)
  const [saveMessage, setSaveMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const result = useMemo(() => calculateFinancialModel(model), [model])
  const currency = model.currency

  const setTemplate = (template: ModelTemplate) => {
    setModel(template === 'solar-ipp' ? referenceSolarIppTemplate : epcStarterTemplate)
    setScenario('base')
  }

  const updateNumber = (key: string, value: number, rate = false) => {
    setModel((current) => ({ ...current, [key]: rate ? value / 100 : value } as FinancialModelAssumptions))
  }

  const applyScenario = (next: 'downside' | 'base' | 'upside') => {
    setScenario(next)
    const base = model.template === 'solar-ipp' ? referenceSolarIppTemplate : epcStarterTemplate
    if (next === 'base') return setModel(base)
    const direction = next === 'upside' ? 1 : -1
    if (base.template === 'solar-ipp') {
      setModel({ ...base, tariffPerMwh: base.tariffPerMwh * (1 + direction * 0.08), specificYieldMwhPerMwp: base.specificYieldMwhPerMwp * (1 + direction * 0.05), capex: base.capex * (1 - direction * 0.05) })
    } else {
      setModel({ ...base, grossMarginRate: base.grossMarginRate + direction * 0.03, variationOrderRate: Math.max(0, base.variationOrderRate + direction * 0.02), capex: base.capex * (1 - direction * 0.04) })
    }
  }

  const handleExport = (type: 'xlsx' | 'csv' | 'memo-pdf' | 'approval-pdf' | 'assumptions-pdf') => {
    setShowExportMenu(false)
    switch (type) {
      case 'xlsx':           exportModelXlsx(model, result); break
      case 'csv':            exportScheduleCsv(model, result); break
      case 'memo-pdf':       exportInvestmentMemorandum(result); break
      case 'approval-pdf':   exportApprovalPack(result, version ?? 1); break
      case 'assumptions-pdf':exportAssumptionsReport(result); break
    }
  }

  const saveDraft = () => {
    setSaveMessage('')
    startTransition(async () => {
      try {
        const saved = await saveFinancialModel(modelId, modelId.startsWith('project-') ? projectId : null, model)
        setVersion(saved.version)
        setSaveMessage(`Version ${saved.version} saved securely`)
      } catch (error) {
        setSaveMessage(error instanceof Error ? error.message : 'Unable to save the model')
      }
    })
  }

  const submitForReview = () => {
    if (submitted) return
    setSaveMessage('')
    startTransition(async () => {
      try {
        const saved = await saveFinancialModel(modelId, modelId.startsWith('project-') ? projectId : null, model, 'Submitted for review')
        await submitFinancialModel(modelId)
        const projectName = linkedProject?.name ?? model.name
        createApproval({
          title: `${model.name} — Draft v${saved.version}`,
          description: `Review deterministic ${model.template === 'solar-ipp' ? 'Solar IPP' : 'EPC'} model assumptions, validation findings, and calculated returns before approval.`,
          project: projectName,
          projectId,
          type: 'Financial Model',
          stage: 'Finance & Commercial Control — Model Review',
          stageNum: 6,
          submittedBy: 'Finance Modeler',
          priority: result.validations.some((item) => item.severity === 'error') ? 'high' : 'medium',
          approvers: [
            { name: 'Finance Manager', role: 'Finance', status: 'pending' },
            { name: 'Commercial Controller', role: 'Commercial', status: 'pending' },
            { name: linkedProject?.pm ?? 'Project Manager', role: 'Project Manager', status: 'pending' },
          ],
        })
        pushNotification({ title: 'Financial model submitted', body: `${model.name} is ready for Finance and Commercial review.`, category: 'finance', link: '/approvals', urgent: false, icon: ShieldCheck, project: projectName })
        pushActivity({ actor: 'Finance Modeler', action: 'submitted a financial model for review', target: projectName, tone: 'warning' })
        setVersion(saved.version)
        setSubmitted(true)
        setSaveMessage(`Version ${saved.version} submitted for review`)
      } catch (error) {
        setSaveMessage(error instanceof Error ? error.message : 'Unable to submit the model')
      }
    })
  }

  const chartData = result.periods.map((period) => ({
    period: period.label,
    revenue: period.revenue / 1_000_000,
    cashFlow: period.equityCashFlow / 1_000_000,
    debt: period.endingDebt / 1_000_000,
  }))

  return (
    <AppLayout>
      <main className="flex max-w-[1600px] flex-col gap-5">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/finance" className="mt-1 rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" aria-label="Back to finance">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-balance text-2xl font-bold text-foreground">{model.name}</h1>
                <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700">{submitted ? 'IN REVIEW' : 'DRAFT'} v{version || 1}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Deterministic model engine v{result.engineVersion} · Configurable periods and currency</p>
              {saveMessage && <p role="status" className="mt-1 text-xs font-medium text-primary">{saveMessage}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setActiveTab('sources')} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"><Upload className="h-4 w-4" />Import PDF / Excel</button>
            <button onClick={saveDraft} disabled={isPending} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"><Save className="h-4 w-4" />{isPending ? 'Saving…' : 'Save draft'}</button>
            <div className="relative">
              <button onClick={() => setShowExportMenu((v) => !v)} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">
                <Download className="h-4 w-4" />Export
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-border bg-card shadow-lg py-1">
                    {[
                      ['xlsx',            FileDown,   'Full workbook (XLSX)',        'Assumptions, schedule, metrics'],
                      ['csv',             FileDown,   'Period schedule (CSV)',       'Lightweight spreadsheet export'],
                      ['memo-pdf',        FileText,   'Investment memo (PDF)',       'Board & lender summary'],
                      ['approval-pdf',    FileText,   'Approval pack (PDF)',         'Version + validation findings'],
                      ['assumptions-pdf', FileText,   'Assumptions report (PDF)',    'Full assumption listing'],
                    ].map(([type, Icon, label, desc]) => (
                      <button key={type as string} onClick={() => handleExport(type as Parameters<typeof handleExport>[0])} className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors">
                        <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{label as string}</p>
                          <p className="text-[10px] text-muted-foreground">{desc as string}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button onClick={submitForReview} disabled={submitted || isPending} className="flex items-center gap-2 rounded-lg bg-[#002B49] px-3 py-2 text-xs font-semibold text-white hover:bg-[#003a63] disabled:cursor-not-allowed disabled:opacity-60"><ShieldCheck className="h-4 w-4" />{submitted ? 'Submitted' : isPending ? 'Submitting…' : 'Submit review'}</button>
          </div>
        </header>

        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-lg bg-muted p-1">
            {(['solar-ipp', 'epc'] as const).map((template) => (
              <button key={template} onClick={() => setTemplate(template)} className={`rounded-md px-3 py-2 text-xs font-semibold ${model.template === template ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                {template === 'solar-ipp' ? 'Solar IPP' : 'EPC Contract'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scenario</span>
            {(['downside', 'base', 'upside'] as const).map((item) => (
              <button key={item} onClick={() => applyScenario(item)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${scenario === item ? 'bg-[#FF8C00] text-white' : 'border border-border text-muted-foreground hover:bg-muted'}`}>{item}</button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Project IRR" value={percent(result.metrics.projectIrr)} note={`Hurdle ${percent(model.discountRate)}`} tone="green" />
          <Metric label="Equity IRR" value={percent(result.metrics.equityIrr)} note={`${Math.round(model.debtShare * 100)}% debt share`} tone="orange" />
          <Metric label="Project NPV" value={`${currency} ${compact.format(result.metrics.projectNpv)}`} note={`${model.operatingYears}-year model life`} />
          <Metric label="Min DSCR" value={multiple(result.metrics.minimumDscr)} note={`Avg ${multiple(result.metrics.averageDscr)}`} />
        </section>
        {model.template === 'solar-ipp' ? (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Min LLCR" value={multiple(result.metrics.minimumLlcr)} note="Loan life coverage" />
            <Metric label="Min PLCR" value={multiple(result.metrics.minimumPlcr)} note="Project life coverage" />
                    <Metric label="DSRA peak" value={`${currency} ${compact.format(result.metrics.dsraPeak)}`} note={`${(model as typeof model & { dsraMonths?: number }).dsraMonths ?? 6} month reserve`} />
                    {result.metrics.mraPeak > 0 && <Metric label="MRA peak" value={`${currency} ${compact.format(result.metrics.mraPeak)}`} note="Maintenance reserve" />}
            <Metric label="Eff. tax rate" value={percent(result.metrics.effectiveTaxRate)} note={`Total tax ${currency} ${compact.format(result.metrics.totalTaxPaid)}`} />
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Contract value" value={`${currency} ${compact.format(result.metrics.finalContractValue)}`} note={`${currency} ${compact.format(result.metrics.totalVariationOrders)} approved VOs`} />
            <Metric label="Peak retention" value={`${currency} ${compact.format(result.metrics.peakRetentionBalance)}`} note={`${currency} ${compact.format(result.metrics.peakAdvanceOutstanding)} adv. O/S`} />
            <Metric label="EAC" value={`${currency} ${compact.format(result.metrics.estimateAtCompletion ?? 0)}`} note={`CTC ${currency} ${compact.format(result.metrics.costToComplete ?? 0)}`} tone={result.metrics.marginAtCompletion !== null && result.metrics.marginAtCompletion > 0.05 ? 'green' : 'orange'} />
            <Metric label="Margin @ compl." value={percent(result.metrics.marginAtCompletion)} note={`Budget margin ${percent(model.grossMarginRate - model.overheadRate)}`} tone={result.metrics.marginAtCompletion !== null && result.metrics.marginAtCompletion > 0.05 ? 'green' : 'orange'} />
          </section>
        )}

        <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-2"><Calculator className="h-4 w-4 text-[#FF8C00]" /><h2 className="text-sm font-semibold text-foreground">Model assumptions</h2></div>
              <p className="mt-1 text-xs text-muted-foreground">Changes recalculate every statement instantly.</p>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-muted-foreground">Currency</span><select value={model.currency} onChange={(event) => setModel((current) => ({ ...current, currency: event.target.value }))} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"><option>USD</option><option>SAR</option><option>EUR</option><option>XAF</option></select></label>
                <Field label="Model life" value={model.operatingYears} suffix="years" onChange={(value) => updateNumber('operatingYears', value)} />
              </div>
              <Field label="CAPEX" value={model.capex} suffix={currency} onChange={(value) => updateNumber('capex', value)} step={100000} />
              <div className="grid grid-cols-2 gap-3"><Field label="Debt share" value={model.debtShare * 100} suffix="%" onChange={(value) => updateNumber('debtShare', value, true)} step={1} /><Field label="Interest rate" value={model.debtInterestRate * 100} suffix="%" onChange={(value) => updateNumber('debtInterestRate', value, true)} step={0.1} /></div>
              <div className="grid grid-cols-2 gap-3"><Field label="Discount rate" value={model.discountRate * 100} suffix="%" onChange={(value) => updateNumber('discountRate', value, true)} step={0.1} /><Field label="Tax rate" value={model.taxRate * 100} suffix="%" onChange={(value) => updateNumber('taxRate', value, true)} step={0.1} /></div>
              {model.template === 'solar-ipp' ? (
                <>
                  <div className="grid grid-cols-2 gap-3"><Field label="Capacity" value={model.capacityMwp} suffix="MWp" onChange={(value) => updateNumber('capacityMwp', value)} /><Field label="Specific yield" value={model.specificYieldMwhPerMwp} suffix="MWh/MWp" onChange={(value) => updateNumber('specificYieldMwhPerMwp', value)} /></div>
                  <div className="grid grid-cols-2 gap-3"><Field label="PPA tariff" value={model.tariffPerMwh} suffix={`${currency}/MWh`} onChange={(value) => updateNumber('tariffPerMwh', value)} /><Field label="Degradation" value={model.degradationRate * 100} suffix="%" onChange={(value) => updateNumber('degradationRate', value, true)} step={0.1} /></div>
                  <Field label="OPEX per MWp" value={model.opexPerMwp} suffix={currency} onChange={(value) => updateNumber('opexPerMwp', value)} step={100} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Constr. years" value={(model as typeof model & { constructionYears?: number }).constructionYears ?? 0} suffix="yrs" onChange={(value) => updateNumber('constructionYears', value)} step={0.5} />
                    <Field label="DSRA months" value={(model as typeof model & { dsraMonths?: number }).dsraMonths ?? 6} suffix="mo" onChange={(value) => updateNumber('dsraMonths', value)} step={1} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Lockup DSCR" value={Number((((model as typeof model & { distributionLockupMinDscr?: number }).distributionLockupMinDscr ?? 1.10) * 100).toFixed(2))} suffix="×" onChange={(value) => updateNumber('distributionLockupMinDscr', value / 100)} step={5} />
                    <Field label="MRA / MWp / yr" value={(model as typeof model & { mraContributionPerMwp?: number }).mraContributionPerMwp ?? 0} suffix={currency} onChange={(value) => updateNumber('mraContributionPerMwp', value)} step={1000} />
                    <Field label="MRA cycle" value={(model as typeof model & { mraReleaseYears?: number }).mraReleaseYears ?? 0} suffix="yrs" onChange={(value) => updateNumber('mraReleaseYears', value)} step={1} />
                    <Field label="VAT rate" value={Number(((((model as typeof model & { vatRate?: number }).vatRate ?? 0) * 100)).toFixed(2))} suffix="%" onChange={(value) => updateNumber('vatRate', value, true)} step={0.5} />
                  </div>
                </>
              ) : (
                <>
                  <Field label="Contract value" value={model.contractValue} suffix={currency} onChange={(value) => updateNumber('contractValue', value)} step={100000} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Gross margin" value={model.grossMarginRate * 100} suffix="%" onChange={(value) => updateNumber('grossMarginRate', value, true)} />
                    <Field label="Overhead rate" value={model.overheadRate * 100} suffix="%" onChange={(value) => updateNumber('overheadRate', value, true)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Retention" value={model.retentionRate * 100} suffix="%" onChange={(value) => updateNumber('retentionRate', value, true)} />
                    <Field label="PC release" value={model.retentionReleaseRate * 100} suffix="%" onChange={(value) => updateNumber('retentionReleaseRate', value, true)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Advance" value={model.advancePaymentRate * 100} suffix="%" onChange={(value) => updateNumber('advancePaymentRate', value, true)} />
                    <Field label="Adv. recovery" value={model.advancePaymentRecoveryRate * 100} suffix="%" onChange={(value) => updateNumber('advancePaymentRecoveryRate', value, true)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="VO allowance" value={model.variationOrderRate * 100} suffix="%" onChange={(value) => updateNumber('variationOrderRate', value, true)} />
                    <Field label="Contingency" value={model.contingencyRate * 100} suffix="%" onChange={(value) => updateNumber('contingencyRate', value, true)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Perf. bond" value={model.performanceBondRate * 100} suffix="%" onChange={(value) => updateNumber('performanceBondRate', value, true)} step={0.1} />
                    <Field label="AP bond" value={model.advancePaymentBondRate * 100} suffix="%" onChange={(value) => updateNumber('advancePaymentBondRate', value, true)} step={0.1} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="% complete" value={(model.percentCompleteToDate ?? 0) * 100} suffix="%" onChange={(value) => updateNumber('percentCompleteToDate', value, true)} />
                    <Field label="Actual cost" value={model.actualCostToDate ?? 0} suffix={currency} onChange={(value) => updateNumber('actualCostToDate', value)} step={100000} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Claims" value={model.claimsValue ?? 0} suffix={currency} onChange={(value) => updateNumber('claimsValue', value)} step={100000} />
                    <Field label="Claims p(success)" value={(model.claimsSuccessRate ?? 0.5) * 100} suffix="%" onChange={(value) => updateNumber('claimsSuccessRate', value, true)} />
                  </div>
                </>
              )}
            </div>
          </aside>

          <div className="min-w-0 rounded-xl border border-border bg-card">
            <div className="flex overflow-x-auto border-b border-border px-2">
              {[
                ['assumptions', 'Overview', BarChart3], ['cashflow', 'Cash flow', Calculator], ['sensitivity', 'Sensitivity', TrendingUp], ['actuals', 'Actuals', Gauge], ['compare', 'Compare', GitCompare], ['validation', 'Validation', BadgeCheck], ['governance', 'Governance', ShieldHalf], ['sources', 'Source evidence', FileSearch],
              ].map(([id, label, Icon]) => (
                <button key={id as string} onClick={() => setActiveTab(id as typeof activeTab)} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap ${activeTab === id ? 'border-[#FF8C00] text-foreground' : 'border-transparent text-muted-foreground'}`}><Icon className="h-4 w-4" />{label as string}</button>
              ))}
            </div>

            {activeTab === 'assumptions' && (
              <div className="p-4">
                <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-sm font-semibold text-foreground">Equity cash flow and debt profile</h2><p className="text-xs text-muted-foreground">Values shown in {currency} millions</p></div><span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700">CALCULATED</span></div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="period" tick={{ fontSize: 10 }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(value) => `${currency} ${Number(value).toFixed(2)}M`} /><Area type="monotone" dataKey="cashFlow" stroke="#FF8C00" fill="#FFF3E0" strokeWidth={2} /><Area type="monotone" dataKey="debt" stroke="#002B49" fill="#E8EDF1" strokeWidth={2} /></AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Revenue" value={`${currency} ${compact.format(result.metrics.totalRevenue)}`} note="Model life total" /><Metric label="OPEX / Cost" value={`${currency} ${compact.format(result.metrics.totalOperatingCost)}`} note="Model life total" /><Metric label="Debt" value={`${currency} ${compact.format(result.metrics.debtAmount)}`} note="At financial close" /><Metric label="Payback" value={result.metrics.paybackPeriod === null ? '—' : `${result.metrics.paybackPeriod.toFixed(1)} yrs`} note="Equity cash flow" /></div>
                {result.lineage && (
                  <div className="mt-5 border-t border-border pt-5">
                    <FormulaLineage lineage={result.lineage} currency={currency} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cashflow' && model.template === 'solar-ipp' && (
              <div className="space-y-5 p-4">
               <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      {['Period', 'Revenue', 'Op. cost', 'EBITDA', 'Tax', 'Debt svc', 'Equity CF', 'DSCR', 'LLCR', 'PLCR', 'DSRA bal', 'MRA bal', 'Distrib.'].map((h) => (
                        <th key={h} className="px-2.5 py-2 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.periods.map((period) => (
                      <tr key={period.index} className={`border-b border-border/70 ${period.distributionLocked ? 'bg-amber-50/40' : ''}`}>
                        <td className="px-2.5 py-2 font-semibold">{period.label}</td>
                        <td className="px-2.5 py-2 tabular-nums">{compact.format(period.revenue)}</td>
                        <td className="px-2.5 py-2 tabular-nums">{compact.format(period.operatingCost)}</td>
                        <td className="px-2.5 py-2 tabular-nums">{compact.format(period.ebitda)}</td>
                        <td className="px-2.5 py-2 tabular-nums">{compact.format(period.tax)}</td>
                        <td className="px-2.5 py-2 tabular-nums">{compact.format(period.debtService)}</td>
                        <td className={`px-2.5 py-2 font-semibold tabular-nums ${period.equityCashFlow < 0 ? 'text-red-600' : 'text-green-700'}`}>{compact.format(period.equityCashFlow)}</td>
                        <td className="px-2.5 py-2 tabular-nums">{multiple(period.dscr)}</td>
                        <td className="px-2.5 py-2 tabular-nums text-muted-foreground">{period.llcr != null ? `${period.llcr.toFixed(2)}x` : '—'}</td>
                        <td className="px-2.5 py-2 tabular-nums text-muted-foreground">{period.plcr != null ? `${period.plcr.toFixed(2)}x` : '—'}</td>
                        <td className="px-2.5 py-2 tabular-nums text-muted-foreground">{compact.format(period.dsraBalance ?? 0)}</td>
                        <td className={`px-2.5 py-2 tabular-nums text-muted-foreground ${(period.mraRelease ?? 0) > 0 ? 'text-[#C9A84C] font-semibold' : ''}`}>{(period.mraRelease ?? 0) > 0 ? `−${compact.format(period.mraRelease ?? 0)}` : compact.format(period.mraBalance ?? 0)}</td>
                        <td className={`px-2.5 py-2 tabular-nums ${period.distributionLocked ? 'text-amber-700 font-semibold' : ''}`}>{period.distributionLocked ? 'Locked' : compact.format(period.distribution ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
                <DistributionWaterfall result={result} currency={currency} />
              </div>
            )}

            {activeTab === 'cashflow' && model.template === 'epc' && (
              <div className="overflow-x-auto p-4">
                {/* EVM summary strip */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="EAC" value={`${currency} ${compact.format(result.metrics.estimateAtCompletion ?? 0)}`} note="Estimate at completion" />
                  <Metric label="CTC" value={`${currency} ${compact.format(result.metrics.costToComplete ?? 0)}`} note="Cost to complete" />
                  <Metric label="Margin @ comp." value={percent(result.metrics.marginAtCompletion)} note="vs budget margin" tone={result.metrics.marginAtCompletion !== null && result.metrics.marginAtCompletion > 0.05 ? 'green' : 'orange'} />
                  <Metric label="Peak retention" value={`${currency} ${compact.format(result.metrics.peakRetentionBalance)}`} note={`${currency} ${compact.format(result.metrics.totalRetentionReleased)} released`} />
                </div>
                {/* Cost-tracking table */}
                <table className="w-full min-w-[1200px] text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      {['Period', 'Certified', 'Invoiced', 'Paid', 'Retention held', 'Adv. O/S', 'Incurred', 'EV', 'CPI', 'SPI', 'CTC', 'Gross profit'].map((h) => (
                        <th key={h} className="px-2.5 py-2 font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.periods.map((period) => (
                      <tr key={period.index} className="border-b border-border/70">
                        <td className="px-2.5 py-2 font-semibold">{period.label}</td>
                        <td className="px-2.5 py-2 tabular-nums">{compact.format(period.certified ?? 0)}</td>
                        <td className="px-2.5 py-2 tabular-nums">{compact.format(period.invoiced ?? 0)}</td>
                        <td className="px-2.5 py-2 tabular-nums">{compact.format(period.paid ?? 0)}</td>
                        <td className="px-2.5 py-2 tabular-nums text-amber-700">{compact.format(period.retentionHeld ?? 0)}</td>
                        <td className="px-2.5 py-2 tabular-nums text-muted-foreground">{compact.format(period.advanceOutstanding ?? 0)}</td>
                        <td className="px-2.5 py-2 tabular-nums">{compact.format(period.incurred ?? 0)}</td>
                        <td className="px-2.5 py-2 tabular-nums text-muted-foreground">{compact.format(period.earnedValue ?? 0)}</td>
                        <td className={`px-2.5 py-2 tabular-nums font-semibold ${(period.costPerformanceIndex ?? 1) >= 1 ? 'text-green-700' : 'text-red-600'}`}>{period.costPerformanceIndex != null ? period.costPerformanceIndex.toFixed(2) : '—'}</td>
                        <td className={`px-2.5 py-2 tabular-nums ${(period.schedulePerformanceIndex ?? 1) >= 1 ? 'text-green-700' : 'text-amber-700'}`}>{period.schedulePerformanceIndex != null ? period.schedulePerformanceIndex.toFixed(2) : '—'}</td>
                        <td className="px-2.5 py-2 tabular-nums text-muted-foreground">{compact.format(period.costToComplete ?? 0)}</td>
                        <td className={`px-2.5 py-2 tabular-nums font-semibold ${(period.grossProfit ?? 0) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{compact.format(period.grossProfit ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'sensitivity' && (
              <SensitivityPanel assumptions={model} currency={currency} />
            )}

            {activeTab === 'actuals' && (
              isPersisted ? (
                <ActualsPanel
                  slug={modelId}
                  baselineVersion={version || 1}
                  forecastPeriods={result.periods}
                  initialActuals={persistedActuals}
                  currency={currency}
                  canEdit={persistedStatus !== 'approved'}
                  canLock
                />
              ) : (
                <div className="p-8 text-center">
                  <Gauge className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Save the model to track actuals</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                    Actual-vs-forecast capture requires a persisted model version. Save a draft first, then return here to enter period actuals.
                  </p>
                </div>
              )
            )}

            {activeTab === 'compare' && (
              <ModelDiff baseAssumptions={model} baseResult={result} currency={currency} />
            )}

            {activeTab === 'validation' && (
              <div className="flex flex-col gap-3 p-4">{result.validations.length === 0 ? <div className="rounded-xl border border-green-200 bg-green-50 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-green-800"><BadgeCheck className="h-5 w-5" />All deterministic checks passed</div><p className="mt-1 text-xs text-green-700">No model integrity, covenant, or hurdle-rate findings were detected.</p></div> : result.validations.map((finding) => <div key={finding.code} className={`rounded-xl border p-4 ${finding.severity === 'error' ? 'border-red-200 bg-red-50' : 'border-[#FF8C00]/30 bg-[#FFF3E0]'}`}><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-4 w-4" /><div><p className="text-sm font-semibold text-foreground">{finding.code.replaceAll('_', ' ')}</p><p className="mt-1 text-xs text-muted-foreground">{finding.message}</p></div></div></div>)}</div>
            )}

            {activeTab === 'governance' && (
              <div className="grid gap-5 p-4 md:grid-cols-2">
                <ApprovalWorkflow
                  slug={modelId}
                  status={(submitted ? 'in_review' : 'draft') as 'draft' | 'in_review' | 'approved' | 'rejected' | 'archived'}
                  version={version || 1}
                  canApprove={false}
                  canReject={false}
                  onStatusChange={(s) => { if (s === 'approved' || s === 'rejected') setSubmitted(false) }}
                />
                <AuditLogViewer slug={modelId} />
              </div>
            )}

            {activeTab === 'sources' && <ImportReviewPanel />}
          </div>
        </section>
      </main>
    </AppLayout>
  )
}
