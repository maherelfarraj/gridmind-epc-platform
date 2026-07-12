'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { ActivityLog } from '@/components/shared/activity-log'
import { PhaseBanner } from '@/components/shared/phase-banner'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Filter,
  HardHat,
  Info,
  Plus,
  X,
  Search,
  Shield,
  ShieldAlert,
  TrendingDown,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
} from 'recharts'

// ─── Data ─────────────────────────────────────────────────────────────────────

const incidents = [
  { id: 'INC-2024-031', project: 'NEOM Solar Farm', type: 'Near Miss', description: 'Worker slipped near cable trench — no injury. Soil stabilisation required.', date: 'Jul 7, 2024', severity: 'medium', status: 'open', reportedBy: 'Site Supervisor Hassan', investigator: 'HSE Manager', daysOpen: 2 },
  { id: 'INC-2024-028', project: 'Jeddah Substation', type: 'First Aid', description: 'Minor laceration during steel structure erection — first aid applied on site.', date: 'Jul 3, 2024', severity: 'low', status: 'closed', reportedBy: 'Foreman Ali', investigator: 'HSE Officer', daysOpen: 0 },
  { id: 'INC-2024-025', project: 'Riyadh EPC-07', type: 'Unsafe Act', description: 'Electrical worker observed without PPE (arc-flash suit) during LV panel work.', date: 'Jun 28, 2024', severity: 'high', status: 'under-review', reportedBy: 'QA/QC Manager', investigator: 'HSE Manager', daysOpen: 11 },
  { id: 'INC-2024-022', project: 'NEOM Solar Farm', type: 'Property Damage', description: 'Forklift struck temporary fencing — SAR 4,200 estimated damage.', date: 'Jun 20, 2024', severity: 'medium', status: 'closed', reportedBy: 'Site Manager', investigator: 'HSE Manager', daysOpen: 0 },
  { id: 'INC-2024-018', project: 'Tabuk Solar', type: 'Environmental', description: 'Minor diesel spill near storage area — contained and reported to EPD.', date: 'Jun 15, 2024', severity: 'medium', status: 'closed', reportedBy: 'Environmental Officer', investigator: 'HSE Manager', daysOpen: 0 },
]

const hseObservations = [
  { id: 'OBS-144', category: 'Positive', description: 'Full PPE compliance observed on Zone A — 100% crew', project: 'NEOM Solar Farm', date: 'Jul 8, 2024', observer: 'HSE Officer Nora' },
  { id: 'OBS-143', category: 'Unsafe Condition', description: 'Unguarded excavation edge near inverter room — barrier required', project: 'Riyadh EPC-07', date: 'Jul 7, 2024', observer: 'HSE Manager' },
  { id: 'OBS-142', category: 'Unsafe Act', description: 'Crane operator not using spotter during blind lift operation', project: 'Jeddah Substation', date: 'Jul 6, 2024', observer: 'QA/QC Manager' },
  { id: 'OBS-141', category: 'Improvement', description: 'Emergency muster point signage unclear — reprinting ordered', project: 'NEOM Solar Farm', date: 'Jul 5, 2024', observer: 'HSE Officer Nora' },
]

const toolboxTopics = [
  { id: 'TBT-2024-28', topic: 'Working at Heights — Harness Inspection', date: 'Jul 8, 2024', project: 'NEOM Solar Farm', attendance: 34, trainer: 'HSE Manager', status: 'completed' },
  { id: 'TBT-2024-27', topic: 'Electrical Hazards & Lockout/Tagout (LOTO)', date: 'Jul 6, 2024', project: 'Riyadh EPC-07', attendance: 18, trainer: 'HSE Officer', status: 'completed' },
  { id: 'TBT-2024-26', topic: 'Heat Stress Prevention — Summer 2024', date: 'Jul 4, 2024', project: 'NEOM Solar Farm', attendance: 52, trainer: 'HSE Manager', status: 'completed' },
  { id: 'TBT-2024-29', topic: 'Confined Space Entry Permit System', date: 'Jul 10, 2024', project: 'Jeddah Substation', attendance: 0, trainer: 'HSE Manager', status: 'scheduled' },
]

const hsePlanRequirements = [
  { id: 'HSE-REQ-001', section: 'Emergency Response Plan', required: true, submitted: true, approved: true, revision: 'Rev 2' },
  { id: 'HSE-REQ-002', section: 'HSE Management Plan', required: true, submitted: true, approved: true, revision: 'Rev 1' },
  { id: 'HSE-REQ-003', section: 'Traffic Management Plan', required: true, submitted: true, approved: false, revision: 'Rev 1' },
  { id: 'HSE-REQ-004', section: 'Environmental Management Plan', required: true, submitted: true, approved: false, revision: 'Rev 0' },
  { id: 'HSE-REQ-005', section: 'Waste Management Plan', required: true, submitted: false, approved: false, revision: '—' },
  { id: 'HSE-REQ-006', section: 'Chemical/Hazardous Materials Register', required: true, submitted: false, approved: false, revision: '—' },
  { id: 'HSE-REQ-007', section: 'Fire Prevention & Protection Plan', required: true, submitted: true, approved: true, revision: 'Rev 1' },
  { id: 'HSE-REQ-008', section: 'Personal Protective Equipment Register', required: true, submitted: true, approved: true, revision: 'Rev 2' },
]

const incidentTrend = [
  { month: 'Jan', incidents: 3, nearMiss: 5, observations: 22 },
  { month: 'Feb', incidents: 2, nearMiss: 4, observations: 28 },
  { month: 'Mar', incidents: 4, nearMiss: 6, observations: 31 },
  { month: 'Apr', incidents: 1, nearMiss: 3, observations: 35 },
  { month: 'May', incidents: 2, nearMiss: 5, observations: 42 },
  { month: 'Jun', incidents: 3, nearMiss: 4, observations: 38 },
  { month: 'Jul', incidents: 2, nearMiss: 2, observations: 18 },
]

const safetyPerformance = [
  { name: 'LTIIR', value: 0.38, target: 0.50, unit: '', label: 'LTI Incidence Rate' },
  { name: 'TRIR', value: 1.12, target: 1.50, unit: '', label: 'Total Recordable IR' },
  { name: 'LTIFR', value: 0.21, target: 0.30, unit: '', label: 'LTI Frequency Rate' },
  { name: 'PPE Compliance', value: 96.4, target: 95, unit: '%', label: 'PPE Compliance Rate' },
  { name: 'Training Complete', value: 87, target: 90, unit: '%', label: 'HSE Training Completion' },
]

const sevColors: Record<string, { bg: string; text: string; border: string }> = {
  high:   { bg: 'bg-red-950/20',      text: 'text-red-600',       border: 'border-red-800/30' },
  medium: { bg: 'bg-accent',   text: 'text-amber-400',     border: 'border-amber-500/30' },
  low:    { bg: 'bg-emerald-950/20',   text: 'text-emerald-400',     border: 'border-emerald-800/30' },
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  open:           { bg: 'bg-red-950/20',      text: 'text-red-600',       border: 'border-red-800/30' },
  'under-review': { bg: 'bg-accent',  text: 'text-amber-400',     border: 'border-amber-500/30' },
  closed:         { bg: 'bg-emerald-950/20',  text: 'text-emerald-400',     border: 'border-emerald-800/30' },
}

const obsColors: Record<string, { bg: string; text: string; border: string }> = {
  Positive:          { bg: 'bg-emerald-950/20', text: 'text-emerald-400',  border: 'border-emerald-800/30' },
  'Unsafe Condition':{ bg: 'bg-red-950/20',    text: 'text-red-600',    border: 'border-red-800/30' },
  'Unsafe Act':      { bg: 'bg-accent', text: 'text-amber-400', border: 'border-amber-500/30' },
  Improvement:       { bg: 'bg-secondary/60', text: 'text-primary', border: 'border-primary/30' },
}

const hseActivities = [
  { id: 'h1', type: 'approval' as const, user: 'HSE Manager', userInitials: 'HM', userColor: '#4A7FA5', action: 'approved', target: 'Emergency Response Plan Rev 2', time: '1 hour ago', isNew: true },
  { id: 'h2', type: 'upload' as const, user: 'HSE Officer Nora', userInitials: 'HN', userColor: '#0D9488', action: 'uploaded', target: 'Toolbox Talk Record #TBT-28', time: '3 hours ago', isNew: true },
  { id: 'h3', type: 'status' as const, user: 'Site Supervisor Hassan', userInitials: 'SH', userColor: '#C9A55A', action: 'opened incident report', target: 'INC-2024-031', time: '5 hours ago' },
  { id: 'h4', type: 'comment' as const, user: 'HSE Manager', userInitials: 'HM', userColor: '#4A7FA5', action: 'commented on', target: 'INC-2024-025 investigation', time: 'Yesterday' },
]

export default function HSEPage() {
  const { pushNotification, pushActivity } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'plans' | 'training'>('overview')
  const [search, setSearch] = useState('')
  const [incidentSeq, setIncidentSeq] = useState(14)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'under-review').length

  const logIncident = () => {
    const ref = `INC-2024-0${incidentSeq}`
    setIncidentSeq((n) => n + 1)
    pushActivity({ actor: 'You', action: 'logged HSE incident', target: `${ref} — Jeddah Substation site`, tone: 'warning' })
    pushNotification({
      title: `HSE Incident Logged: ${ref}`,
      body: `A near-miss incident was reported at the Jeddah Substation site. Investigation assigned to the HSE Manager; corrective action required within 24 hours.`,
      category: 'hse',
      link: '/hse',
      urgent: true,
      icon: AlertTriangle,
      project: 'Jeddah Substation Upgrade',
    })
    setToastMessage(`${ref} logged and escalated to the HSE Manager.`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">

        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-secondary text-foreground text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-auto text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">HSE Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Cross-phase — Step 29 (HSE / QA-QC Plan), Step 33 (Inspection), Steps 44–47 (T&amp;C) — Health, Safety, and Environment tracking across all active projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 border border-border hover:bg-muted text-sm px-3 py-2 rounded-lg transition-colors text-foreground">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button
              onClick={logIncident}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Log Incident
            </button>
          </div>
        </div>

        <PhaseBanner phase={5} phaseName="HSE Management" steps="29, 33, 44–47" activeStep={29} activeStepLabel="HSE / QA-QC / T&C Plans" status="on-track" />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Days Without LTI" value="47" subtitle="Last LTI: May 22, 2024" trend={{ value: 12, label: 'vs last period' }} icon={HardHat} accent="green" />
          <KPICard title="Open Incidents" value={openIncidents} subtitle={`${incidents.filter(i => i.severity === 'high' && i.status !== 'closed').length} high severity`} icon={ShieldAlert} accent="red" />
          <KPICard title="HSE Observations" value="144" subtitle="This month across all sites" trend={{ value: 6, label: 'vs last month' }} icon={Eye} accent="indigo" />
          <KPICard title="Toolbox Talks" value="28" subtitle="July YTD — 1,204 man-hrs" icon={Users} accent="gold" />
        </div>

        {/* Warning banner if open high-severity incidents */}
        {incidents.some(i => i.severity === 'high' && i.status !== 'closed') && (
          <div className="flex items-start gap-3 bg-red-950/20 border border-red-800/30 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">1 High-Severity Incident Requires Immediate Action</p>
              <p className="text-xs text-red-600 mt-0.5">INC-2024-025 (Riyadh EPC-07) — Unsafe electrical work without PPE — open for 11 days. Assign investigator and issue corrective action.</p>
            </div>
            <button className="ml-auto flex items-center gap-1 text-xs font-semibold text-red-400 border border-red-800/40 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0">
              Review Now <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          {(['overview', 'incidents', 'plans', 'training'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'plans' ? 'HSE Plans (Step 29)' : t === 'training' ? 'Toolbox Talks' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">

              {/* Safety performance table */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Safety Performance Metrics — YTD</h2>
                <div className="space-y-3">
                  {safetyPerformance.map(m => (
                    <div key={m.name} className="flex items-center gap-4">
                      <div className="w-40 flex-shrink-0">
                        <div className="text-xs font-medium text-foreground">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground">{m.label}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {m.value}{m.unit} / Target: {m.target}{m.unit}
                          </span>
                          <span className={`text-[10px] font-semibold ${m.value <= m.target ? 'text-emerald-400' : 'text-red-600'}`}>
                            {m.value <= m.target ? 'ON TARGET' : 'ABOVE TARGET'}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${m.value <= m.target ? 'bg-emerald-600' : 'bg-red-500'}`}
                            style={{ width: `${Math.min((m.value / (m.target * 1.5)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incident trend chart */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Incident & Observation Trend — 2024</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={incidentTrend}>
                    <defs>
                      <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="nearGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A55A" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#C9A55A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="incidents" stroke="#DC2626" fill="url(#incGrad)" strokeWidth={2} name="Incidents" />
                    <Area type="monotone" dataKey="nearMiss" stroke="#8B6F3A" fill="url(#nearGrad)" strokeWidth={2} name="Near Miss" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Observations */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Recent HSE Observations</h2>
                  <button className="text-xs text-primary hover:underline">View all</button>
                </div>
                <div className="space-y-2">
                  {hseObservations.map(obs => {
                    const colors = obsColors[obs.category] || obsColors['Improvement']
                    return (
                      <div key={obs.id} className={`flex items-start gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {obs.category}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{obs.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{obs.id} · {obs.project} · {obs.date} · {obs.observer}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right col */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Open Incidents Summary</h2>
                {incidents.filter(i => i.status !== 'closed').map(inc => {
                  const sc = sevColors[inc.severity]
                  return (
                    <div key={inc.id} className={`mb-2 p-3 rounded-lg border ${sc.bg} ${sc.border}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-[10px] text-muted-foreground">{inc.id}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                          {inc.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-foreground">{inc.type} — {inc.project}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{inc.description.slice(0, 80)}...</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{inc.daysOpen}d open · Investigator: {inc.investigator}</p>
                    </div>
                  )
                })}
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">HSE Activity Log</h2>
                <ActivityLog activities={hseActivities} />
              </div>
            </div>
          </div>
        )}

        {/* Incidents tab */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents..." className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:border-primary" />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['ID', 'Project', 'Type', 'Description', 'Date', 'Severity', 'Status', 'Investigator', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.filter(i => !search || i.description.toLowerCase().includes(search.toLowerCase()) || i.project.toLowerCase().includes(search.toLowerCase())).map(inc => {
                      const sc = sevColors[inc.severity]
                      const stc = statusColors[inc.status]
                      return (
                        <tr key={inc.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-primary whitespace-nowrap">{inc.id}</td>
                          <td className="px-4 py-3 text-xs text-foreground whitespace-nowrap">{inc.project}</td>
                          <td className="px-4 py-3 text-xs text-foreground">{inc.type}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{inc.description}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{inc.date}</td>
                          <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${sc.bg} ${sc.text} ${sc.border}`}>{inc.severity}</span></td>
                          <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${stc.bg} ${stc.text} ${stc.border}`}>{inc.status.replace('-', ' ')}</span></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{inc.investigator}</td>
                          <td className="px-4 py-3">
                            <button className="text-xs text-primary hover:underline flex items-center gap-1"><Eye className="w-3.5 h-3.5" />View</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* HSE Plans (Step 29) tab */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">HSE Plan Compliance — Step 29: Execution / HSE / QA-QC Plans</h2>
                <p className="text-xs text-muted-foreground mt-0.5">All plans must be submitted and approved by the HSE Manager before construction begins (Step 32).</p>
              </div>
              <button className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 text-white text-sm px-3 py-2 rounded-lg transition-colors">
                <Plus className="w-4 h-4" /> Upload Plan
              </button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Ref', 'HSE Plan Section', 'Required', 'Submitted', 'Approved', 'Revision', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hsePlanRequirements.map(req => (
                      <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{req.id}</td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium">{req.section}</td>
                        <td className="px-4 py-3">{req.required ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}</td>
                        <td className="px-4 py-3">{req.submitted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-500" />}</td>
                        <td className="px-4 py-3">{req.approved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : req.submitted ? <div className="w-4 h-4 rounded-full border-2 border-amber-500 bg-accent" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}</td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{req.revision}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {req.submitted && <button className="text-xs text-primary hover:underline flex items-center gap-1"><Eye className="w-3.5 h-3.5" />View</button>}
                            {!req.submitted && <button className="text-xs text-amber-400 hover:underline flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Upload</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-accent border border-primary/30 rounded-xl p-4">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">2 required plans not yet submitted — Environmental Management Plan and Chemical/Hazardous Materials Register. Both are required before next consultant review (Step 33). Assign HSE Officer to complete by Jul 14, 2024.</p>
            </div>
          </div>
        )}

        {/* Training / Toolbox Talks tab */}
        {activeTab === 'training' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Toolbox Talks & Safety Training</h2>
                <p className="text-xs text-muted-foreground mt-0.5">28 sessions delivered YTD — 1,204 man-hours of safety training</p>
              </div>
              <button className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-sm px-3 py-2 rounded-lg transition-colors">
                <Plus className="w-4 h-4" /> Schedule Talk
              </button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Ref', 'Topic', 'Project', 'Date', 'Attendance', 'Trainer', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {toolboxTopics.map(tb => (
                      <tr key={tb.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{tb.id}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{tb.topic}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{tb.project}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{tb.date}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">{tb.attendance > 0 ? tb.attendance : '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{tb.trainer}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tb.status === 'completed' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30' : 'bg-secondary/60 text-primary border-primary/30'}`}>
                            {tb.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />{tb.status === 'completed' ? 'View Record' : 'Manage'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
