'use client'

import Link from 'next/link'
import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { PhaseBanner } from '@/components/shared/phase-banner'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  Calculator,
  CheckCircle,
  DollarSign,
  FileText,
  Plus,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo, useState } from 'react'
import { PortfolioHub } from '@/components/finance/portfolio-hub'

// Progress certificates at EPC scale — each cert is 8–15% of contract value
const invoices = [
  { id: 'INV-2024-007', project: 'NEOM Solar Farm',    client: 'NEOM Company', amount: 124000000, status: 'paid',        issueDate: 'Jun 1',  dueDate: 'Jun 30', payDate: 'Jun 28', step: 43, stepLabel: 'Payment Proceed'          },
  { id: 'INV-2024-008', project: 'Riyadh EPC-07',      client: 'Saudi Aramco', amount: 68000000,  status: 'outstanding', issueDate: 'Jun 15', dueDate: 'Jul 14', payDate: '—',      step: 40, stepLabel: 'Payment Check'            },
  { id: 'INV-2024-009', project: 'NEOM Solar Farm',    client: 'NEOM Company', amount: 186000000, status: 'follow-up',   issueDate: 'Jul 1',  dueDate: 'Jul 31', payDate: '—',      step: 39, stepLabel: 'Client Follow-Up'          },
  { id: 'INV-2024-010', project: 'Yanbu BESS 250MWh',  client: 'Marafiq',      amount: 52000000,  status: 'paid',        issueDate: 'Jun 20', dueDate: 'Jul 20', payDate: 'Jul 5',  step: 43, stepLabel: 'Payment Proceed'          },
  { id: 'INV-2024-011', project: 'Jeddah Substation',  client: 'SEC',          amount: 94000000,  status: 'overdue',     issueDate: 'May 30', dueDate: 'Jun 29', payDate: '—',      step: 39, stepLabel: 'Client Follow-Up — OVERDUE' },
  { id: 'INV-2024-012', project: 'Tabuk Solar',        client: 'NEOM Company', amount: 38000000,  status: 'draft',       issueDate: '—',      dueDate: '—',      payDate: '—',      step: 37, stepLabel: 'Revenue Validation'        },
]

// cashflowData and budgetVariance are computed inside the component from the workspace store.

const costBreakdown = [
  { name: 'Materials & Procurement', value: 58, color: '#4A7FA5' },
  { name: 'Labour & Subcontract', value: 24, color: '#C9A55A' },
  { name: 'Engineering & Design', value: 8, color: '#C9A55A' },
  { name: 'Overheads & Admin', value: 6, color: '#8B6F3A' },
  { name: 'Contingency', value: 4, color: '#5A8A6A' },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  paid: { label: 'Paid', color: 'text-emerald-400', bg: 'bg-emerald-950/20', border: 'border-emerald-800/30' },
  outstanding: { label: 'Outstanding', color: 'text-primary', bg: 'bg-secondary/60', border: 'border-primary/20' },
  'follow-up': { label: 'Follow-Up', color: 'text-amber-400', bg: 'bg-accent', border: 'border-amber-500/20' },
  overdue: { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-950/20', border: 'border-red-800/30' },
  draft: { label: 'Draft', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
}

// Short label for chart x-axis
function shortLabel(name: string): string {
  return name.split(' ').slice(0, 2).join(' ').slice(0, 12)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
// EPC cost ratio: materials + labour + overheads ≈ 82% of revenue billed
const COST_RATIO = 0.82
// Forecast uplift: 6% contingency + scope creep buffer, standard EPC metric
const FORECAST_UPLIFT = 1.06

export default function FinancePage() {
  const { createApproval, pushActivity, projects, settings } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'models' | 'invoices' | 'cashflow' | 'budget'>('models')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const issueInvoice = () => {
    createApproval({
      title: 'Payment Certificate #8 — NEOM Solar Farm',
      description: 'Progress payment certificate covering milestones M18–M21. Requires PM, Finance, and Commercial sign-off before issue to client.',
      project: 'NEOM Solar Farm — Package 4',
      projectId: 'NEOM-SOL-004',
      type: 'Finance',
      stage: 'Finance & Commercial Control — Step 38: Issue Invoice',
      stageNum: 6,
      submittedBy: 'Sara Al-Otaibi',
      priority: 'medium',
      approvers: [
        { name: 'Project Manager', role: 'PM', status: 'pending' },
        { name: 'Finance Manager', role: 'Finance', status: 'pending' },
        { name: 'Commercial Controller', role: 'Commercial', status: 'pending' },
      ],
    })
    pushActivity({ actor: 'You', action: 'issued', target: 'Payment Certificate #8 for approval', tone: 'default' })
    showToast('Invoice drafted — Payment Certificate #8 submitted for approval.')
  }

  const totalInvoiced = invoices.filter(i => i.status !== 'draft').reduce((s, i) => s + i.amount, 0)
  const totalPaid     = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const outstanding   = invoices.filter(i => ['outstanding', 'follow-up', 'overdue'].includes(i.status)).reduce((s, i) => s + i.amount, 0)
  const overdue       = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)

  function fmtSAR(n: number, currency = 'SAR'): string {
    const ccy = currency || 'SAR'
    if (n >= 1_000_000_000) return `${ccy} ${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000)     return `${ccy} ${Math.round(n / 1_000_000)}M`
    return `${ccy} ${(n / 1_000).toFixed(0)}K`
  }

  // Cashflow: monthly income = total portfolio value × weighted average progress / 12
  // Each month is offset slightly (±5%) to simulate realistic billing lumps.
  // Expenses = income × COST_RATIO. Net = income − expenses.
  const cashflowData = useMemo(() => {
    const totalValue = projects.reduce((s, p) => s + p.valueSAR, 0)
    const avgProgress = projects.length
      ? projects.reduce((s, p) => s + p.progress, 0) / projects.length / 100
      : 0
    const baseMonthlyIncome = (totalValue * avgProgress) / 12
    const offsets = [0.88, 1.05, 0.92, 1.12, 0.96, 1.18, 1.08]
    return MONTHS.map((month, i) => {
      const income    = Math.round((baseMonthlyIncome * offsets[i]) / 1_000_000)
      const expenses  = Math.round(income * COST_RATIO)
      const net       = income - expenses
      return { month, income, expenses, net }
    })
  }, [projects])

  // Budget variance: one row per in-progress project derived from store values.
  // actual = budget × (progress / 100); forecast = budget × FORECAST_UPLIFT
  const budgetVariance = useMemo(() =>
    projects
      .filter(p => ['in-progress', 'approved'].includes(p.status))
      .map(p => {
        const budget   = Math.round(p.valueSAR / 1_000_000)
        const actual   = Math.round(budget * (p.progress / 100))
        const forecast = Math.round(budget * FORECAST_UPLIFT)
        return { project: shortLabel(p.name), budget, actual, forecast }
      }),
    [projects],
  )

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px]">
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
            <h1 className="text-2xl font-bold text-foreground">Finance & Commercial Control</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Phase 6 · Steps 37–43 — Revenue validation, invoice issue, client follow-up, payment check, vendor payment request, validation, and payment proceed</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/finance/models/new"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Calculator className="w-4 h-4" />
              New Model
            </Link>
            <button
              onClick={() => showToast('Invoice export initiated')}
              className="flex items-center gap-2 border border-border text-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <FileText className="w-4 h-4" />
              Export Report
            </button>
            <button
              onClick={issueInvoice}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Issue Invoice
            </button>
          </div>
        </div>

        <PhaseBanner phase={6} phaseName="Finance & Commercial" steps="37–43" activeStep={38} activeStepLabel="Invoice Submission & Collection" status="on-track" />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Invoiced"  value={fmtSAR(totalInvoiced, settings.currency)} subtitle="Portfolio YTD" icon={DollarSign} accent="gold" />
          <KPICard title="Total Received"  value={fmtSAR(totalPaid, settings.currency)} subtitle={`${Math.round((totalPaid / totalInvoiced) * 100)}% collection rate`} icon={TrendingUp} accent="green" trend={{ value: 5, label: 'this month' }} />
          <KPICard title="Outstanding"     value={fmtSAR(outstanding, settings.currency)} subtitle={`${invoices.filter(i => ['outstanding','follow-up','overdue'].includes(i.status)).length} invoices`} icon={AlertTriangle} accent="orange" />
          <KPICard title="Overdue"         value={fmtSAR(overdue, settings.currency)} subtitle="Past due date" icon={TrendingDown} accent="red" />
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-muted/40 border border-border rounded-xl p-1 w-fit">
          {([
            { id: 'models',   label: 'Financial Models' },
            { id: 'invoices', label: 'Invoice Register' },
            { id: 'cashflow', label: 'Cashflow' },
            { id: 'budget',   label: 'Budget & Cost' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Financial Models portfolio hub */}
        {activeTab === 'models' && (
          <PortfolioHub
            projects={projects}
            onNewModel={() => showToast('New model wizard coming soon — use an existing template to get started.')}
          />
        )}

        {/* Charts row */}
        {activeTab === 'cashflow' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cashflow chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Portfolio Cashflow (SAR M)</h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-secondary inline-block" />Income</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary inline-block" />Expenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={cashflowData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E2230" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1E2230" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A55A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#C9A55A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`SAR ${v}M`]} />
                <Area type="monotone" dataKey="income" stroke="#4A7FA5" strokeWidth={2} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expenses" stroke="#8B6F3A" strokeWidth={2} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Cost breakdown pie */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Cost Breakdown</h2>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {costBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {costBreakdown.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-[10px] text-muted-foreground flex-1 truncate">{c.name}</span>
                  <span className="text-[10px] font-bold text-foreground">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        }

        {/* Budget variance chart */}
        {activeTab === 'budget' && <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Budget vs Actual vs Forecast (SAR M)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={budgetVariance}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
              <XAxis dataKey="project" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`SAR ${v}M`]} />
              <Bar dataKey="budget" name="Budget" fill="#1E2230" opacity={0.5} radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#C9A55A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="forecast" name="Forecast" fill="#8B6F3A" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        }

        {/* Invoices table */}
        {activeTab === 'invoices' && <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Invoice Register</h2>
            </div>
            <div className="flex items-center gap-2">
              {[
                { status: 'overdue', count: 1, color: 'bg-red-500' },
                { status: 'follow-up', count: 1, color: 'bg-primary' },
              ].map(b => (
                <span key={b.status} className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${b.color}`}>
                  {b.count} {b.status}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                    {['Invoice No.', 'Project', 'Client', `Amount (${settings.currency})`, 'Issue Date', 'Due Date', 'Payment Date', 'Workflow Step', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map(inv => {
                  const cfg = statusConfig[inv.status]
                  return (
                    <tr key={inv.id} className={`hover:bg-muted/20 transition-colors ${inv.status === 'overdue' ? 'bg-red-950/20/30' : ''}`}>
                      <td className="px-4 py-3 text-xs font-mono text-primary font-medium">{inv.id}</td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground">{inv.project}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{inv.client}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-foreground">{fmtSAR(inv.amount, settings.currency)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{inv.issueDate}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <span className={inv.status === 'overdue' ? 'text-red-600 font-semibold' : ''}>{inv.dueDate}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{inv.payDate}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono text-primary">
                          #{inv.step} {inv.stepLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => showToast(`Invoice ${inv.id} action taken`)}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          {inv.status === 'draft' ? 'Issue' : inv.status === 'overdue' ? 'Follow Up' : 'View'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>}
      </div>
    </AppLayout>
  )
}
