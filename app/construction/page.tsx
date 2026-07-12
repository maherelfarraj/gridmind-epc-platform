'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { PhaseBanner } from '@/components/shared/phase-banner'
import { StatusBadge } from '@/components/shared/status-badge'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  HardHat,
  Plus,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useState } from 'react'

// Steps 28-36: Identify SOW → Plans → Subcontract RFQ → Subcontract → Start → Inspect/NCR → Milestone → VO → Finish
const milestoneData = [
  { id: '#28', name: 'Identify SOW & Construction Phases',       owner: 'Hassan Al-Yami',     dueDate: 'Sep 1, 2024',  completion: 100, status: 'completed' },
  { id: '#29', name: 'Execution / HSE / QA-QC / T&C Plans',    owner: 'HSE Manager',         dueDate: 'Sep 10, 2024', completion: 100, status: 'completed' },
  { id: '#30', name: 'Subcontractor RFQ & Quotations',          owner: 'Construction Manager',dueDate: 'Sep 20, 2024', completion: 100, status: 'completed' },
  { id: '#31', name: 'Subcontractor Contract Signed',           owner: 'Legal Reviewer',      dueDate: 'Oct 1, 2024',  completion: 100, status: 'completed' },
  { id: '#32', name: 'Start Construction — Site Mobilization',  owner: 'Construction Team',   dueDate: 'Oct 10, 2024', completion: 78,  status: 'in-progress' },
  { id: '#33', name: 'Inspection / NCR — Zone A & B',           owner: 'QA/QC Manager',       dueDate: 'Nov 5, 2024',  completion: 55,  status: 'in-progress' },
  { id: '#34', name: 'Milestone Update & Revised Plans',        owner: 'PM',                  dueDate: 'Nov 30, 2024', completion: 12,  status: 'in-progress' },
  { id: '#35', name: 'Variation Orders',                        owner: 'Commercial Controller',dueDate: 'Dec 20, 2024', completion: 0,  status: 'pending' },
  { id: '#36', name: 'Finish Construction — Mech. Completion',  owner: 'Construction Manager',dueDate: 'Feb 28, 2025', completion: 0,   status: 'pending' },
]

const inspections = [
  { id: 'INS-001', type: 'Foundation Works', zone: 'Zone A', date: 'Oct 12', result: 'Passed', inspector: 'QA/QC Team', ncr: 0 },
  { id: 'INS-002', type: 'Steel Structure', zone: 'Zone A', date: 'Nov 2', result: 'Passed with Comments', inspector: 'Consultant', ncr: 2 },
  { id: 'INS-003', type: 'Civil Works', zone: 'Zone B', date: 'Oct 28', result: 'Pending', inspector: 'QA/QC Team', ncr: 0 },
  { id: 'INS-004', type: 'Earthing & Bonding', zone: 'Zone A', date: '—', result: 'Scheduled', inspector: 'Elec. QC', ncr: 0 },
]

// Variation order values scaled to NEOM Solar Farm Package 4 (SAR 1.24B EPC contract)
const variationOrders = [
  { id: 'VO-001', description: 'Additional cable routing — route change due to soil conditions', value: 14500000, status: 'approved', date: 'Oct 5' },
  { id: 'VO-002', description: 'Extra foundations for revised panel layout in Zone B', value: 28000000, status: 'under-review', date: 'Nov 1' },
  { id: 'VO-003', description: 'Emergency access road upgrade requirement', value: 6500000, status: 'pending', date: 'Nov 3' },
]

function fmtSAR(n: number, currency = 'SAR'): string {
  const ccy = currency || 'SAR'
  if (n >= 1_000_000_000) return `${ccy} ${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${ccy} ${Math.round(n / 1_000_000)}M`
  return `${ccy} ${(n / 1_000).toFixed(0)}K`
}

const progressTrend = [
  { week: 'W38', planned: 18, actual: 17 },
  { week: 'W39', planned: 24, actual: 22 },
  { week: 'W40', planned: 31, actual: 29 },
  { week: 'W41', planned: 38, actual: 35 },
  { week: 'W42', planned: 44, actual: 38 },
  { week: 'W43', planned: 51, actual: 42 },
]

const workforcePlan = [
  { discipline: 'Civil', planned: 45, actual: 42 },
  { discipline: 'Structural', planned: 30, actual: 28 },
  { discipline: 'Electrical', planned: 20, actual: 18 },
  { discipline: 'QA/QC', planned: 8, actual: 8 },
  { discipline: 'HSE', planned: 5, actual: 5 },
]

const statusColors: Record<string, string> = {
  completed: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30',
  'in-progress': 'text-primary bg-secondary/60 border-primary/20',
  pending: 'text-muted-foreground bg-muted border-border',
  overdue: 'text-red-400 bg-red-950/20 border-red-800/30',
  'Passed': 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30',
  'Passed with Comments': 'text-amber-400 bg-accent border-amber-500/20',
  'Pending': 'text-muted-foreground bg-muted border-border',
  'Scheduled': 'text-primary bg-secondary/60 border-primary/20',
  approved: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30',
  'under-review': 'text-amber-400 bg-accent border-amber-500/20',
}

export default function ConstructionPage() {
  const { createApproval, pushActivity, settings } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'milestones' | 'inspections' | 'variations' | 'workforce'>('milestones')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const requestInspection = () => {
    createApproval({
      title: 'Inspection Request — Foundation Works, Zone B',
      description: 'Site inspection requested for completed foundation works. Requires QA/QC and consultant sign-off before proceeding (Step 33).',
      project: 'Jeddah Substation Upgrade',
      projectId: 'JED-SUB-002',
      type: 'Inspection',
      stage: 'Construction Planning & Execution — Step 33: Inspection / NCR',
      stageNum: 5,
      submittedBy: 'Mohammed Hassan',
      priority: 'high',
      approvers: [
        { name: 'QA/QC Manager', role: 'QA/QC', status: 'pending' },
        { name: 'Consultant Reviewer', role: 'Consultant', status: 'pending' },
      ],
    })
    pushActivity({ actor: 'You', action: 'requested inspection for', target: 'Foundation Works, Zone B', tone: 'default' })
    showToast('Inspection requested — submitted for QA/QC and consultant sign-off.')
  }

  const overallProgress = Math.round(milestoneData.reduce((s, m) => s + m.completion, 0) / milestoneData.length)

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
            <h1 className="text-2xl font-bold text-foreground">Construction Planning & Execution</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Phase 5 · Steps 28–36 — SOW, execution/HSE/QA-QC plans, subcontractor, construction, inspection/NCR (Step 33), milestone updates, variation orders, and finish</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={requestInspection}
              className="flex items-center gap-2 border border-border text-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Request Inspection
            </button>
            <button
              onClick={() => showToast('Milestone update form opened')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Update Milestone
            </button>
          </div>
        </div>

        <PhaseBanner phase={5} phaseName="Construction & Execution" steps="28–36" activeStep={32} activeStepLabel="Start Construction — Site Mobilization" status="behind" />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard title="Overall Progress" value={`${overallProgress}%`} subtitle="vs 51% planned" icon={TrendingUp} accent="indigo" trend={{ value: -9, label: 'behind plan' }} />
          <KPICard
            title="Milestones Done"
            value={`${milestoneData.filter(m => m.status === 'completed').length}/${milestoneData.length}`}
            subtitle={`${milestoneData.filter(m => m.status !== 'completed').length} remaining`}
            icon={CheckCircle}
            accent="green"
          />
          <KPICard title="Active Workers" value="101" subtitle="vs 108 planned" icon={HardHat} accent="navy" />
          <KPICard title="Inspections" value="4" subtitle="2 passed" icon={ShieldCheck} accent="orange" />
          <KPICard title="Open NCRs" value="2" subtitle="Requires action" icon={AlertTriangle} accent="red" />
          <KPICard title="Variation Orders" value={variationOrders.length.toString()} subtitle={fmtSAR(variationOrders.reduce((s, v) => s + v.value, 0), settings.currency)} icon={Clock} accent="gold" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress trend */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Weekly Progress — Planned vs Actual (%)</h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-secondary inline-block" />Planned</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" />Actual</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={progressTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 60]} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${v}%`]} />
                <Line type="monotone" dataKey="planned" stroke="#4A7FA5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="actual" stroke="#8B6F3A" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Workforce */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Workforce — Planned vs Actual</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={workforcePlan}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                <XAxis dataKey="discipline" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="planned" name="Planned" fill="#1E2230" opacity={0.4} radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#C9A55A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center border-b border-border px-5 py-0">
            {(['milestones', 'inspections', 'variations', 'workforce'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-4 text-sm font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'variations' ? 'Variation Orders' : tab === 'workforce' ? 'Workforce & Lookahead' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'milestones' && (
            <div className="divide-y divide-border">
              {milestoneData.map(m => (
                <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                    m.status === 'completed' ? 'bg-emerald-950/20 text-emerald-400' :
                    m.status === 'in-progress' ? 'bg-secondary/60 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {m.completion === 100 ? <CheckCircle className="w-4 h-4" /> : m.id.replace('M0', '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${m.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {m.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.owner}</p>
                  </div>
                  <div className="flex items-center gap-2 w-32">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${m.completion === 100 ? 'bg-green-500' : m.completion > 0 ? 'bg-primary' : 'bg-transparent'}`}
                        style={{ width: `${m.completion}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{m.completion}%</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0 w-28">
                    <Calendar className="w-3.5 h-3.5" />
                    {m.dueDate}
                  </div>
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border capitalize flex-shrink-0 ${statusColors[m.status]}`}>
                    {m.status.replace('-', ' ')}
                  </span>
                  <button
                    onClick={() => showToast(`Milestone update submitted for ${m.name}`)}
                    className="text-xs text-primary hover:underline font-medium flex-shrink-0"
                  >
                    Update
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'inspections' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Inspection ID', 'Type', 'Zone', 'Date', 'Inspector', 'Result', 'NCRs', 'Action'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inspections.map(ins => (
                    <tr key={ins.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{ins.id}</td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground">{ins.type}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{ins.zone}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{ins.date}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{ins.inspector}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[ins.result] || 'text-muted-foreground bg-muted border-border'}`}>
                          {ins.result}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ins.ncr > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {ins.ncr} NCR
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => showToast(`Inspection ${ins.id} report opened`)}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'workforce' && (
            <div className="p-5 space-y-5">
              {/* Headcount summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { discipline: 'Civil',      planned: 45, actual: 42, color: '#4A7FA5' },
                  { discipline: 'Structural', planned: 30, actual: 28, color: '#C9A55A' },
                  { discipline: 'Electrical', planned: 20, actual: 18, color: '#8B6F3A' },
                  { discipline: 'QA/QC',      planned: 8,  actual: 8,  color: '#5A8A6A' },
                  { discipline: 'HSE',        planned: 5,  actual: 5,  color: '#C9A55A' },
                ].map(w => (
                  <div key={w.discipline} className="bg-muted/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: w.color }} />
                      <p className="text-xs font-semibold text-foreground">{w.discipline}</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{w.actual}</p>
                    <p className="text-[10px] text-muted-foreground">of {w.planned} planned</p>
                    <div className="mt-2 bg-muted rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${(w.actual / w.planned) * 100}%`, background: w.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* 3-week lookahead */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">3-Week Construction Lookahead</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {['Activity', 'Zone', 'Responsible', 'Crew', 'Week 1 (Jul 8–12)', 'Week 2 (Jul 15–19)', 'Week 3 (Jul 22–26)', 'Status'].map(h => (
                          <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        { activity: 'Pile cap concrete pour',        zone: 'Zone A', responsible: 'Civil Team',    crew: 12, w1: 80, w2: 100, w3: 0,   status: 'on-track' },
                        { activity: 'Steel structure erection',      zone: 'Zone A', responsible: 'Struct. Team', crew: 18, w1: 40, w2: 75,  w3: 100, status: 'on-track' },
                        { activity: 'Cable trench excavation',       zone: 'Zone B', responsible: 'Civil Team',   crew: 8,  w1: 20, w2: 60,  w3: 90,  status: 'on-track' },
                        { activity: 'Inverter room construction',    zone: 'Zone A', responsible: 'Civil Team',   crew: 10, w1: 60, w2: 100, w3: 0,   status: 'on-track' },
                        { activity: 'MV cable pulling',              zone: 'Zone A', responsible: 'Elec. Team',   crew: 6,  w1: 0,  w2: 30,  w3: 70,  status: 'scheduled' },
                        { activity: 'Foundation earthing installation', zone: 'Zone B', responsible: 'Elec. Team', crew: 4,  w1: 0,  w2: 20,  w3: 60,  status: 'scheduled' },
                      ].map(row => (
                        <tr key={row.activity} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-xs font-medium text-foreground max-w-[180px]">{row.activity}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{row.zone}</td>
                          <td className="px-4 py-3 text-xs text-foreground">{row.responsible}</td>
                          <td className="px-4 py-3 text-xs text-foreground">{row.crew}</td>
                          {[row.w1, row.w2, row.w3].map((pct, i) => (
                            <td key={i} className="px-4 py-3">
                              {pct > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-16 bg-muted rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">{pct}%</span>
                                </div>
                              ) : <span className="text-xs text-muted-foreground/40">—</span>}
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${row.status === 'on-track' ? 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30' : 'text-primary bg-secondary/60 border-primary/20'}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'variations' && (
            <div className="divide-y divide-border">
              {variationOrders.map(vo => (
                <div key={vo.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-mono text-muted-foreground">{vo.id}</p>
                          <span className="text-xs text-muted-foreground">{vo.date}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground mt-0.5">{vo.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-foreground">{fmtSAR(vo.value, settings.currency)}</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusColors[vo.status]}`}>
                          {vo.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast(`Variation order ${vo.id} action taken`)}
                    className="flex-shrink-0 text-xs text-primary hover:underline font-medium"
                  >
                    {vo.status === 'approved' ? 'View' : 'Review'}
                  </button>
                </div>
              ))}
              <div className="px-5 py-4 bg-muted/30 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Total Variation Value</span>
                <span className="text-sm font-bold text-amber-400">{fmtSAR(variationOrders.reduce((s, v) => s + v.value, 0), settings.currency)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
