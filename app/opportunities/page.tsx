'use client'

import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { ActivityLog, sampleActivities } from '@/components/shared/activity-log'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardList,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  MapPin,
  Plus,
  Search,
  Send,
  Target,
  Trophy,
  TrendingUp,
  Upload,
  XCircle,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// ─── Data ────────────────────────────────────────────────────────────────────

const opportunities = [
  {
    id: 'OPP-2024-018',
    name: 'Al-Jouf Solar IPP — 300 MW',
    client: 'ACWA Power',
    country: 'Saudi Arabia',
    sector: 'Solar PV',
    valueSAR: 850000000,
    received: 'Jul 1, 2024',
    deadline: 'Jul 25, 2024',
    daysLeft: 16,
    stage: 'costing',
    stageStep: '#3 Costing',
    bidDecision: 'bid',
    pm: 'Ahmed Al-Rashidi',
    probability: 65,
    priority: 'high',
    notes: 'Strong relationship with client. Competing with 3 other EPC firms.',
  },
  {
    id: 'OPP-2024-019',
    name: 'Madinah Battery Storage — 500 MWh',
    client: 'Saudi Aramco',
    country: 'Saudi Arabia',
    sector: 'BESS',
    valueSAR: 420000000,
    received: 'Jun 25, 2024',
    deadline: 'Jul 30, 2024',
    daysLeft: 21,
    stage: 'bid-decision',
    stageStep: '#4 Bid/No-Bid Decision',
    bidDecision: 'reviewing',
    pm: 'Sara Al-Otaibi',
    probability: 40,
    priority: 'medium',
    notes: 'New sector — BESS experience required. Checking subcontractor availability.',
  },
  {
    id: 'OPP-2024-020',
    name: 'Tabuk Wind Farm — 500 MW',
    client: 'NEOM Company',
    country: 'Saudi Arabia',
    sector: 'Wind',
    valueSAR: 1420000000,
    received: 'Jul 5, 2024',
    deadline: 'Aug 15, 2024',
    daysLeft: 37,
    stage: 'rfp-review',
    stageStep: '#1 RFP / Opportunity Review',
    bidDecision: 'reviewing',
    pm: 'Khalid Al-Faisal',
    probability: 30,
    priority: 'high',
    notes: 'Large flagship NEOM project. Preliminary scope review in progress.',
  },
  {
    id: 'OPP-2024-015',
    name: 'Riyadh HV Substation Package 12',
    client: 'SEC',
    country: 'Saudi Arabia',
    sector: 'T&D',
    valueSAR: 185000000,
    received: 'Jun 10, 2024',
    deadline: 'Jul 10, 2024',
    daysLeft: 1,
    stage: 'submitted',
    stageStep: '#5 Submit Proposal',
    bidDecision: 'bid',
    pm: 'Mohammed Hassan',
    probability: 75,
    priority: 'high',
    notes: 'Proposal submitted. Awaiting client evaluation and award decision.',
  },
  {
    id: 'OPP-2024-012',
    name: 'Aseer Solar Farm — 400 MW',
    client: 'ACWA Power',
    country: 'Saudi Arabia',
    sector: 'Solar PV',
    valueSAR: 620000000,
    received: 'May 20, 2024',
    deadline: 'Jun 20, 2024',
    daysLeft: 0,
    stage: 'awarded',
    stageStep: '#6 Award',
    bidDecision: 'bid',
    pm: 'Fatima Al-Zahra',
    probability: 100,
    priority: 'high',
    notes: 'AWARDED — Contract review starting. Moving to Phase 2.',
  },
  {
    id: 'OPP-2024-010',
    name: 'Dammam Industrial EPC — Package 5',
    client: 'SABIC',
    country: 'Saudi Arabia',
    sector: 'Industrial',
    valueSAR: 280000000,
    received: 'Apr 15, 2024',
    deadline: 'May 15, 2024',
    daysLeft: 0,
    stage: 'dropped',
    stageStep: '#4 Bid/No-Bid Decision',
    bidDecision: 'no-bid',
    pm: 'Omar Abdullah',
    probability: 0,
    priority: 'low',
    notes: 'No-bid decision — insufficient margin and timeline overlap with NEOM project.',
  },
]

// BOQ structure: qty and unitRate are plain numbers.
// totalSAR is NEVER stored — always computed as qty × unitRate at render time.
// To reset to blank: replace all qty/unitRate with 0; the totals become 0 automatically.
interface BoqItem {
  code: string
  description: string
  unit: string
  qty: number        // user-entered quantity — 0 means not yet filled
  unitRate: number   // user-entered unit rate (SAR) — 0 means not yet filled
}

const boqItems: BoqItem[] = [
  { code: 'BOQ-001', description: 'Solar PV Modules — 600Wp Bifacial', unit: 'pcs', qty: 0, unitRate: 0 },
  { code: 'BOQ-002', description: 'String Inverters — 100 kW',          unit: 'pcs', qty: 0, unitRate: 0 },
  { code: 'BOQ-003', description: 'HV Transformer — 100 MVA',           unit: 'pcs', qty: 0, unitRate: 0 },
  { code: 'BOQ-004', description: 'MV Cable — 33kV XLPE 240mm²',        unit: 'm',   qty: 0, unitRate: 0 },
  { code: 'BOQ-005', description: 'Galvanised Steel Structure',          unit: 'ton', qty: 0, unitRate: 0 },
  { code: 'BOQ-006', description: 'Civil Foundation & Earthworks',       unit: 'lot', qty: 0, unitRate: 0 },
  { code: 'BOQ-007', description: 'SCADA & Energy Management System',    unit: 'lot', qty: 0, unitRate: 0 },
  { code: 'BOQ-008', description: 'HSE, Temp Facilities & Mobilisation', unit: 'lot', qty: 0, unitRate: 0 },
]

function fmtBoqSAR(n: number, currency = 'SAR'): string {
  const c = currency || 'SAR'
  if (n === 0) return '—'
  if (n >= 1_000_000) return `${c} ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${c} ${(n / 1_000).toFixed(0)}K`
  return `${c} ${n.toFixed(0)}`
}

const pipelineByMonth = [
  { month: 'Feb', submitted: 1, awarded: 1, dropped: 0 },
  { month: 'Mar', submitted: 2, awarded: 1, dropped: 1 },
  { month: 'Apr', submitted: 3, awarded: 2, dropped: 1 },
  { month: 'May', submitted: 2, awarded: 1, dropped: 1 },
  { month: 'Jun', submitted: 4, awarded: 2, dropped: 1 },
  { month: 'Jul', submitted: 3, awarded: 0, dropped: 0 },
]

const winRateData = [
  { name: 'Awarded', value: 62, color: '#5A8A6A' },
  { name: 'Dropped', value: 14, color: '#8A5A5A' },
  { name: 'In Progress', value: 24, color: '#C9A55A' },
]

const stageLabels: Record<string, string> = {
  'rfp-review': 'RFP Review',
  'boq-preparation': 'Preliminary BOQ',
  'costing': 'Costing',
  'bid-decision': 'Bid/No-Bid',
  'submitted': 'Submitted',
  'awarded': 'Awarded',
  'dropped': 'Dropped',
}

const stageColors: Record<string, string> = {
  'rfp-review':    'bg-secondary/60 text-foreground border-primary',
  'boq-preparation':'bg-secondary/60 text-primary border-primary',
  'costing':       'bg-accent text-primary border-primary',
  'bid-decision':  'bg-accent text-amber-400 border-amber-500',
  'submitted':     'bg-secondary/60 text-[#0D9488] border-[#0D9488]',
  'awarded':       'bg-emerald-950/20 text-emerald-400 border-emerald-800/30',
  'dropped':       'bg-red-950/20 text-red-600 border-red-800/40',
}

const priorityDot: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-primary',
  low: 'bg-[#94A3B8]',
}

export default function OpportunitiesPage() {
  const router = useRouter()
  const { addProject, pushActivity, settings } = useWorkspace()
  const ccy = settings.currency
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [selectedOpp, setSelectedOpp] = useState<typeof opportunities[0] | null>(null)
  const [activeTab, setActiveTab] = useState<'pipeline' | 'boq' | 'submission'>('pipeline')
  const [bidToast, setBidToast] = useState<string | null>(null)
  const [submittedOpps, setSubmittedOpps] = useState<string[]>(['OPP-2024-011'])
  const [bidForm, setBidForm] = useState({ opp: 'OPP-2024-018', proposalRef: '', submittedBy: '', submissionDate: '', price: '', technicalScore: '', notes: '' })

  const showBidToast = (msg: string) => { setBidToast(msg); setTimeout(() => setBidToast(null), 3500) }

  const convertToProject = (opp: typeof opportunities[0]) => {
    const project = addProject({
      name: opp.name,
      client: opp.client,
      valueSAR: opp.valueSAR,
      description: `Converted from awarded opportunity ${opp.id}. ${opp.sector} project in ${opp.country}.`,
      contractType: 'EPC',
      capacity: opp.sector.includes('MW') ? opp.sector : '—',
      location: opp.country,
    })
    pushActivity({ actor: 'You', action: 'converted opportunity to project', target: opp.name, tone: 'success' })
    showBidToast(`${opp.name} converted to project — moving to Contract Setup.`)
    setTimeout(() => router.push(`/projects/${project.id}`), 900)
  }
  const handleSubmitBid = () => {
    if (!bidForm.proposalRef || !bidForm.submittedBy || !bidForm.submissionDate || !bidForm.price) return
    setSubmittedOpps(prev => [...prev, bidForm.opp])
    showBidToast(`Proposal submitted for ${opportunities.find(o => o.id === bidForm.opp)?.name ?? bidForm.opp}`)
    setBidForm(f => ({ ...f, proposalRef: '', submittedBy: '', submissionDate: '', price: '', technicalScore: '', notes: '' }))
  }

  const filtered = opportunities.filter(o => {
    const matchSearch = o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.client.toLowerCase().includes(search.toLowerCase()) ||
      o.sector.toLowerCase().includes(search.toLowerCase())
    const matchStage = stageFilter === 'all' || o.stage === stageFilter
    return matchSearch && matchStage
  })

  const totalPipeline = opportunities.reduce((s, o) => s + o.valueSAR, 0)
  const awarded = opportunities.filter(o => o.stage === 'awarded').length
  const active = opportunities.filter(o => !['awarded', 'dropped'].includes(o.stage)).length
  const awardedValue = opportunities.filter(o => o.stage === 'awarded').reduce((s, o) => s + o.valueSAR, 0)

  function fmtValue(n: number): string {
    if (n >= 1_000_000_000) return `${ccy} ${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000) return `${ccy} ${Math.round(n / 1_000_000)}M`
    return `${ccy} ${n.toLocaleString()}`
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Opportunities & RFP</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Phase 1 · Steps 1–6 — RFP intake, preliminary BOQ, costing, bid/no-bid decision, proposal submission, and award
            </p>
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Opportunity
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Pipeline Value" value={fmtValue(totalPipeline)} subtitle={`${opportunities.length} tracked opportunities`} trend={{ value: 18, label: 'vs last quarter' }} icon={DollarSign} accent="navy" />
          <KPICard title="Active Opportunities" value={active} subtitle="Under evaluation" icon={Target} accent="orange" />
          <KPICard title="Win Rate" value="62%" subtitle="YTD awarded vs submitted" trend={{ value: 8, label: 'vs last year' }} icon={TrendingUp} accent="green" />
          <KPICard title="Awarded This Quarter" value={awarded} subtitle={`Total value: ${fmtValue(awardedValue)}`} icon={CheckCircle2} accent="gold" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          {(['pipeline', 'boq', 'submission'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'boq' ? 'Preliminary BOQ' : t === 'submission' ? 'Bid Submission' : 'Opportunity Pipeline'}
            </button>
          ))}
        </div>

        {activeTab === 'pipeline' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left: Pipeline table */}
            <div className="xl:col-span-2 space-y-4">

              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search opportunities..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg outline-none focus:border-primary"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={stageFilter}
                    onChange={e => setStageFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 text-sm bg-card border border-border rounded-lg outline-none cursor-pointer appearance-none"
                  >
                    <option value="all">All Stages</option>
                    <option value="rfp-review">Step 1: RFP Review</option>
                    <option value="boq-preparation">Step 2: Preliminary BOQ</option>
                    <option value="costing">Step 3: Costing</option>
                    <option value="bid-decision">Step 4: Bid/No-Bid</option>
                    <option value="submitted">Step 5: Submitted</option>
                    <option value="awarded">Step 6: Awarded</option>
                    <option value="dropped">Dropped</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {filtered.map(opp => (
                  <div
                    key={opp.id}
                    onClick={() => setSelectedOpp(selectedOpp?.id === opp.id ? null : opp)}
                    className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedOpp?.id === opp.id ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[opp.priority]}`} />
                          <span className="text-xs font-mono text-muted-foreground">{opp.id}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stageColors[opp.stage]}`}>
                            {opp.stageStep}
                          </span>
                          {opp.bidDecision === 'no-bid' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-950/20 text-red-600 border border-red-800/30">
                              NO-BID
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-foreground truncate">{opp.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{opp.client}</span>
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{opp.sector}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{fmtValue(opp.valueSAR)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="text-right">
                          <div className={`text-xs font-bold ${opp.daysLeft <= 3 && opp.stage !== 'awarded' && opp.stage !== 'dropped' ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {opp.stage === 'awarded' ? 'Awarded' : opp.stage === 'dropped' ? 'Dropped' : `${opp.daysLeft}d left`}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Due {opp.deadline}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${opp.probability}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{opp.probability}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {selectedOpp?.id === opp.id && (
                      <div className="mt-3 pt-3 border-t border-border space-y-3">
                        <p className="text-sm text-muted-foreground">{opp.notes}</p>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-muted rounded-lg p-2">
                            <div className="text-muted-foreground">PM Assigned</div>
                            <div className="font-semibold text-foreground mt-0.5">{opp.pm}</div>
                          </div>
                          <div className="bg-muted rounded-lg p-2">
                            <div className="text-muted-foreground">RFP Received</div>
                            <div className="font-semibold text-foreground mt-0.5">{opp.received}</div>
                          </div>
                          <div className="bg-muted rounded-lg p-2">
                            <div className="text-muted-foreground">Win Probability</div>
                            <div className="font-semibold text-foreground mt-0.5">{opp.probability}%</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {opp.stage !== 'awarded' && opp.stage !== 'dropped' && (
                            <>
                              <button className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                                <ArrowRight className="w-3.5 h-3.5" />
                                Advance Stage
                              </button>
                              <button className="flex items-center gap-1.5 border border-border hover:bg-muted text-xs px-3 py-1.5 rounded-lg transition-colors text-foreground">
                                <FileText className="w-3.5 h-3.5" />
                                Open Scope Review
                              </button>
                              <button className="flex items-center gap-1.5 border border-red-800/30 hover:bg-red-950/20 text-red-600 text-xs px-3 py-1.5 rounded-lg transition-colors">
                                <XCircle className="w-3.5 h-3.5" />
                                Mark No-Bid
                              </button>
                            </>
                          )}
                          {opp.stage === 'awarded' && (
                            <button
                              onClick={() => convertToProject(opp)}
                              className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              Convert to Project
                            </button>
                          )}
                          <button className="flex items-center gap-1.5 border border-border hover:bg-muted text-xs px-3 py-1.5 rounded-lg transition-colors text-foreground">
                            <Eye className="w-3.5 h-3.5" />
                            View Documents
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Charts + Activity */}
            <div className="space-y-4">

              {/* Win rate pie */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Pipeline Outcome Distribution</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={winRateData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {winRateData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 mt-2">
                  {winRateData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly pipeline bar */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Monthly Pipeline Activity</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={pipelineByMonth} barSize={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="submitted" fill="#C9A55A" radius={[2, 2, 0, 0]} name="Submitted" />
                    <Bar dataKey="awarded" fill="#10B981" radius={[2, 2, 0, 0]} name="Awarded" />
                    <Bar dataKey="dropped" fill="#DC2626" radius={[2, 2, 0, 0]} name="Dropped" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Step guide */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Phase 1 Step Flow</h2>
                <div className="space-y-2">
                  {[
                    { n: 1, label: 'RFP / Opportunity Review', done: true },
                    { n: 2, label: 'Preliminary BOQ Preparation', done: true },
                    { n: 3, label: 'Costing & Estimation', active: true },
                    { n: 4, label: 'Bid / No-Bid Decision', done: false },
                    { n: 5, label: 'Submit Proposal', done: false },
                    { n: 6, label: 'Award', done: false },
                  ].map(s => (
                    <div key={s.n} className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        s.done ? 'bg-[#10B981] text-white' : s.active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        {s.done ? <CheckCircle2 className="w-3 h-3" /> : s.n}
                      </div>
                      <span className={`text-xs ${s.active ? 'text-foreground font-semibold' : s.done ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h2>
                <ActivityLog activities={sampleActivities.slice(0, 4)} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'boq' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Preliminary BOQ — Al-Jouf Solar IPP (Step 2)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Estimate for proposal costing. Subject to revision at Step 18 (Update BOQ) in Engineering phase.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 border border-border hover:bg-muted text-sm px-3 py-2 rounded-lg transition-colors text-foreground">
                  <Plus className="w-4 h-4" /> Add Line
                </button>
                <button className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 text-white text-sm px-3 py-2 rounded-lg transition-colors">
                  <Download className="w-4 h-4" /> Export BOQ
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Code', 'Description', 'Unit', 'Quantity', `Unit Rate (${ccy})`, `Total (${ccy})`].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {boqItems.map((row, i) => {
                      const lineTotalSAR = row.qty * row.unitRate  // formula — never stored
                      return (
                        <tr key={row.code} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                          <td className="px-4 py-3 font-mono text-xs text-primary">{row.code}</td>
                          <td className="px-4 py-3 text-foreground text-sm">{row.description}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{row.unit}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {row.qty === 0 ? <span className="text-muted-foreground italic">—</span> : row.qty.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{fmtBoqSAR(row.unitRate, ccy)}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{fmtBoqSAR(lineTotalSAR, ccy)}</td>
                        </tr>
                      )
                    })}
                    <tr className="bg-secondary/5 border-t-2 border-primary/20">
                      <td colSpan={5} className="px-4 py-3 font-bold text-foreground text-sm">TOTAL PRELIMINARY ESTIMATE</td>
                      <td className="px-4 py-3 font-bold text-foreground text-sm">
                        {fmtBoqSAR(boqItems.reduce((s, r) => s + r.qty * r.unitRate, 0), ccy)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-accent border border-primary/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">Costing Note</span>
                </div>
                <p className="text-xs text-muted-foreground">This BOQ is preliminary for bid/no-bid decision and proposal submission. Final BOQ will be prepared in Step 15 (Main BOQ) after award.</p>
              </div>
              <div className="bg-secondary/60 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-4 h-4 text-foreground" />
                  <span className="text-xs font-semibold text-foreground">Margin Target</span>
                </div>
                <p className="text-xs text-muted-foreground">Minimum gross margin: <strong>18%</strong>. Current estimate allows up to <strong>21.4%</strong> at the submitted price of SAR 135M.</p>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">Required Documents</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  <li>• RFP Package</li>
                  <li>• Scope Review Matrix</li>
                  <li>• Bid/No-Bid Checklist</li>
                  <li>• Proposal Cover Letter</li>
                  <li>• Cost Estimate Sheet</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Bid Submission tab — Steps 5 & 6 */}
        {activeTab === 'submission' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left: proposal submission form */}
            <div className="xl:col-span-2 space-y-5">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-white" />
                    <p className="text-white font-semibold text-sm">Submit Proposal — Step 5</p>
                  </div>
                  <p className="text-white/60 text-[11px] mt-0.5">Log a formal proposal submission for a bid-decision opportunity</p>
                </div>
                <div className="p-5 space-y-4">
                  {/* Opportunity selector */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Opportunity *</label>
                    <select
                      value={bidForm.opp}
                      onChange={e => setBidForm(f => ({ ...f, opp: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {opportunities.filter(o => o.bidDecision === 'bid').map(o => (
                        <option key={o.id} value={o.id}>{o.name} ({o.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Proposal Reference No. *</label>
                      <input
                        value={bidForm.proposalRef}
                        onChange={e => setBidForm(f => ({ ...f, proposalRef: e.target.value }))}
                        placeholder="e.g. PROP-2024-018-v1"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500 placeholder:text-muted-foreground/60"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Submitted By *</label>
                      <input
                        value={bidForm.submittedBy}
                        onChange={e => setBidForm(f => ({ ...f, submittedBy: e.target.value }))}
                        placeholder="e.g. Ahmed Al-Rashidi"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500 placeholder:text-muted-foreground/60"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Submission Date *</label>
                      <input
                        type="date"
                        value={bidForm.submissionDate}
                        onChange={e => setBidForm(f => ({ ...f, submissionDate: e.target.value }))}
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Submitted Price (SAR) *</label>
                      <input
                        value={bidForm.price}
                        onChange={e => setBidForm(f => ({ ...f, price: e.target.value }))}
                        placeholder="e.g. 135,000,000"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500 placeholder:text-muted-foreground/60"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Technical Score (if known)</label>
                      <input
                        value={bidForm.technicalScore}
                        onChange={e => setBidForm(f => ({ ...f, technicalScore: e.target.value }))}
                        placeholder="e.g. 87/100"
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500 placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* Proposal document upload */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Upload Proposal Documents</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-2 text-center hover:border-amber-500/40 transition-colors cursor-pointer">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Technical + Commercial proposals</p>
                      <p className="text-[10px] text-muted-foreground/60">PDF / ZIP, max 50 MB</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Submission Notes</label>
                    <textarea
                      rows={3}
                      value={bidForm.notes}
                      onChange={e => setBidForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="e.g. Submitted via client portal. Following up with commercial team on bond requirement..."
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500 placeholder:text-muted-foreground/60 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSubmitBid}
                    disabled={!bidForm.proposalRef || !bidForm.submittedBy || !bidForm.submissionDate || !bidForm.price}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Submit Proposal
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Award tracking + submission log */}
            <div className="space-y-5">

              {/* Award tracker */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-muted/20">
                  <Trophy className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Award Tracker — Step 6</h2>
                </div>
                <div className="divide-y divide-border">
                  {opportunities.filter(o => o.bidDecision === 'bid').map(o => {
                    const submitted = submittedOpps.includes(o.id) || o.stage === 'proposal-submitted' || o.stage === 'awarded'
                    return (
                      <div key={o.id} className="px-5 py-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground leading-snug">{o.name}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            o.stage === 'awarded' ? 'bg-emerald-950/20 text-emerald-400' :
                            submitted ? 'bg-secondary/60 text-primary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {o.stage === 'awarded' ? 'AWARDED' : submitted ? 'SUBMITTED' : 'PENDING'}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{o.client} · {fmtValue(o.valueSAR)}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="flex-1 bg-muted rounded-full h-1">
                            <div className={`h-1 rounded-full ${o.stage === 'awarded' ? 'bg-green-500' : submitted ? 'bg-primary' : 'bg-primary'}`}
                              style={{ width: o.stage === 'awarded' ? '100%' : submitted ? '80%' : `${o.probability}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{o.probability}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Step checklist */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Submission Checklist</h2>
                <div className="space-y-2">
                  {[
                    { label: 'Technical Proposal prepared',        done: true  },
                    { label: 'Commercial Proposal & BOQ finalised', done: true  },
                    { label: 'Bid bond / tender security obtained',  done: true  },
                    { label: 'Proposal submitted to client portal',  done: false },
                    { label: 'Submission receipt acknowledged',      done: false },
                    { label: 'Follow-up call with client scheduled', done: false },
                    { label: 'Award decision received (Step 6)',     done: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs">
                      <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${item.done ? 'text-green-500' : 'text-muted-foreground/40'}`} />
                      <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Bid toast */}
        {bidToast && (
          <div className="fixed top-4 right-4 z-50 bg-secondary text-foreground text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{bidToast}</span>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
