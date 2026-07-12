'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { useWorkspace } from '@/lib/workspace-store'
import { KPICard } from '@/components/shared/kpi-card'
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Filter,
  Plus,
  Shield,
  TrendingDown,
  X,
} from 'lucide-react'
import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Probability = 1 | 2 | 3 | 4 | 5
type Impact      = 1 | 2 | 3 | 4 | 5
type RiskStatus  = 'open' | 'mitigated' | 'closed' | 'escalated'
type RiskCategory = 'commercial' | 'technical' | 'schedule' | 'hse' | 'procurement' | 'regulatory' | 'financial'

interface Risk {
  id: string
  title: string
  description: string
  category: RiskCategory
  project: string
  phase: string
  probability: Probability
  impact: Impact
  owner: string
  dateRaised: string
  dueDate: string
  status: RiskStatus
  mitigation: string
  residualProbability: Probability
  residualImpact: Impact
}

// ─── Data ────────────────────────────────────────────────────────────────────

const risks: Risk[] = [
  {
    id: 'RSK-001', title: 'Transformer delivery delay — long lead item',
    description: 'HV transformer from ABB has 18-week lead time. Any manufacturing delays will push construction start beyond planned date.',
    category: 'procurement', project: 'NEOM Solar Farm', phase: 'P4 Procurement', probability: 3, impact: 5,
    owner: 'Mohammed Al-Qahtani', dateRaised: 'Jun 1', dueDate: 'Jul 30', status: 'open',
    mitigation: 'Back-up order placed with Siemens; weekly factory audit scheduled. Expediting agent appointed at manufacturing site.',
    residualProbability: 2, residualImpact: 5,
  },
  {
    id: 'RSK-002', title: 'Ground conditions — unexpected rock formation in Zone B',
    description: 'Geotechnical report for Zone B shows potential hard rock at 2m depth which was not in the preliminary survey.',
    category: 'technical', project: 'Jeddah Substation', phase: 'P5 Construction', probability: 4, impact: 4,
    owner: 'Khalid Al-Dosari', dateRaised: 'Jun 15', dueDate: 'Jul 20', status: 'escalated',
    mitigation: 'Additional geotechnical investigation underway. Variation order VO-003 submitted. Foundation design being revised by consultant.',
    residualProbability: 3, residualImpact: 3,
  },
  {
    id: 'RSK-003', title: 'SEC grid connection approval — regulatory delay',
    description: 'Saudi Electricity Company (SEC) grid connection approval has been outstanding for 8 weeks. Approval is on the critical path.',
    category: 'regulatory', project: 'NEOM Solar Farm', phase: 'P3 Engineering', probability: 3, impact: 5,
    owner: 'Ahmad Al-Harbi', dateRaised: 'May 20', dueDate: 'Aug 1', status: 'open',
    mitigation: 'Executive escalation to SEC conducted. NEOM Co. client relationship leveraged. Alternative temporary connection permit being explored.',
    residualProbability: 2, residualImpact: 5,
  },
  {
    id: 'RSK-004', title: 'Subcontractor financial instability',
    description: 'Main civil subcontractor showing signs of financial stress — delayed payroll to workers. Risk of abandonment mid-works.',
    category: 'commercial', project: 'Jeddah Substation', phase: 'P5 Construction', probability: 3, impact: 4,
    owner: 'Faisal Al-Ghamdi', dateRaised: 'Jul 1', dueDate: 'Jul 15', status: 'escalated',
    mitigation: 'Financial audit of subcontractor ordered. Retention bond reviewed. Replacement subcontractor shortlist prepared (Al-Arrab, BNCC).',
    residualProbability: 2, residualImpact: 3,
  },
  {
    id: 'RSK-005', title: 'PV module price escalation — commodity risk',
    description: 'Global polysilicon prices increased 12% since contract signing. BOQ unit rates may be insufficient to cover current market prices.',
    category: 'financial', project: 'NEOM Solar Farm', phase: 'P4 Procurement', probability: 2, impact: 3,
    owner: 'Mohammed Al-Qahtani', dateRaised: 'May 5', dueDate: 'Jun 30', status: 'mitigated',
    mitigation: 'Price escalation clause invoked under Section 9.3 of contract. Client agreed to 6% price adjustment. Fixed-price frame agreement executed with JA Solar.',
    residualProbability: 1, residualImpact: 2,
  },
  {
    id: 'RSK-006', title: 'HSE — working at height risk during steel structure erection',
    description: 'Steel structure erection requires workers at heights above 8m. Risk of fall incidents during peak construction activity in Zone A.',
    category: 'hse', project: 'NEOM Solar Farm', phase: 'P5 Construction', probability: 2, impact: 5,
    owner: 'Sami Al-Yami', dateRaised: 'Jun 28', dueDate: 'Ongoing', status: 'open',
    mitigation: 'Full body harness mandatory. Daily toolbox talks conducted. Third-party safety auditor on site weekly. Scaffold inspection completed.',
    residualProbability: 1, residualImpact: 5,
  },
  {
    id: 'RSK-007', title: 'Design drawing revision loop — IFC delays',
    description: 'Consultant review cycle for IFC drawings has required 3 revision rounds, each adding 2-week delay to the drawing approval schedule.',
    category: 'schedule', project: 'Riyadh EPC-07', phase: 'P3 Engineering', probability: 4, impact: 3,
    owner: 'Omar Al-Zahrani', dateRaised: 'May 28', dueDate: 'Jul 25', status: 'open',
    mitigation: 'Design review workshops introduced. Checklist pre-review mandatory before submission. Additional draftsman hired to accelerate revisions.',
    residualProbability: 2, residualImpact: 3,
  },
  {
    id: 'RSK-008', title: 'Client invoice payment delay — cashflow risk',
    description: 'NEOM Co. payment terms are 60 days but actuals are running at 85 days average, creating a SAR 8M cashflow gap in Q3.',
    category: 'financial', project: 'NEOM Solar Farm', phase: 'P6 Finance', probability: 3, impact: 3,
    owner: 'Nasser Al-Rashid', dateRaised: 'Jun 10', dueDate: 'Aug 15', status: 'open',
    mitigation: 'Finance team escalated to NEOM Co. CFO. Invoice factoring facility of SAR 10M secured with NCB Capital as contingency.',
    residualProbability: 2, residualImpact: 2,
  },
  {
    id: 'RSK-009', title: 'Customs clearance delay for imported equipment',
    description: 'SABER and SFDA product certification for imported inverters and monitoring equipment may cause customs hold of 3-4 weeks.',
    category: 'procurement', project: 'NEOM Solar Farm', phase: 'P4 Procurement', probability: 2, impact: 3,
    owner: 'Mohammed Al-Qahtani', dateRaised: 'May 15', dueDate: 'Jul 10', status: 'mitigated',
    mitigation: 'SABER registration completed for all equipment. Certified customs broker engaged. Pre-clearance documentation submitted 6 weeks ahead.',
    residualProbability: 1, residualImpact: 2,
  },
  {
    id: 'RSK-010', title: 'Scope creep — client change orders exceeding contingency',
    description: 'Client has issued 4 change requests in 8 weeks adding 7% to contract value. Contingency budget at 85% consumption.',
    category: 'commercial', project: 'Riyadh EPC-07', phase: 'P5 Construction', probability: 3, impact: 3,
    owner: 'Faisal Al-Ghamdi', dateRaised: 'Jun 20', dueDate: 'Ongoing', status: 'open',
    mitigation: 'Change control register enforced. Client presented with impact analysis before approval of any new change. Commercial director review required for any VO above SAR 200K.',
    residualProbability: 2, residualImpact: 2,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const riskScore = (p: number, i: number) => p * i

const scoreColor = (score: number) => {
  if (score >= 15) return { bg: 'bg-red-500',    text: 'text-red-400',    light: 'bg-red-950/20 border-red-800/30',    label: 'Critical' }
  if (score >= 9)  return { bg: 'bg-primary',  text: 'text-amber-400', light: 'bg-accent border-amber-500/30', label: 'High' }
  if (score >= 5)  return { bg: 'bg-primary',  text: 'text-primary', light: 'bg-accent border-primary/30', label: 'Medium' }
  return            { bg: 'bg-emerald-700', text: 'text-emerald-400', light: 'bg-emerald-950/20 border-emerald-800/30', label: 'Low' }
}

const categoryLabel: Record<RiskCategory, string> = {
  commercial: 'Commercial', technical: 'Technical', schedule: 'Schedule',
  hse: 'HSE', procurement: 'Procurement', regulatory: 'Regulatory', financial: 'Financial',
}

const statusConfig: Record<RiskStatus, { label: string; color: string }> = {
  open:      { label: 'Open',      color: 'text-amber-400 bg-accent border-amber-500/20' },
  mitigated: { label: 'Mitigated', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30' },
  closed:    { label: 'Closed',    color: 'text-muted-foreground bg-muted border-border' },
  escalated: { label: 'Escalated', color: 'text-red-400 bg-red-950/20 border-red-800/30' },
}

// ─── 5x5 Risk Matrix ─────────────────────────────────────────────────────────

function RiskMatrix({ risks, selected, onSelect }: { risks: Risk[]; selected: Risk | null; onSelect: (r: Risk | null) => void }) {
  const probLabels  = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain']
  const impactLabels = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic']

  const cellRisks = (p: number, i: number) =>
    risks.filter(r => r.probability === p && r.impact === i && r.status !== 'closed')

  const cellColor = (score: number) => {
    if (score >= 15) return 'bg-red-950/40 border-red-800/50'
    if (score >= 9)  return 'bg-amber-950/30 border-amber-800/40'
    if (score >= 5)  return 'bg-amber-950/15 border-amber-800/20'
    return 'bg-emerald-950/20 border-emerald-800/25'
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">Risk Heat Map — Probability vs Impact</h2>
      <div className="overflow-x-auto">
        <div className="min-w-[480px]">
          {/* Impact axis label */}
          <div className="flex items-end mb-1 pl-16">
            {impactLabels.map((l, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground font-medium">{l}</div>
            ))}
          </div>
          {/* Grid rows — probability high to low */}
          {[5, 4, 3, 2, 1].map((p) => (
            <div key={p} className="flex items-center gap-1 mb-1">
              <div className="w-16 text-right pr-2 text-[9px] text-muted-foreground font-medium leading-tight flex-shrink-0">
                {probLabels[p - 1]}
              </div>
              {[1, 2, 3, 4, 5].map((impact) => {
                const score = p * impact
                const cellItems = cellRisks(p as Probability, impact as Impact)
                return (
                  <div
                    key={impact}
                    className={`flex-1 aspect-square min-h-[48px] rounded-lg border ${cellColor(score)} flex flex-col items-center justify-center gap-0.5 cursor-default p-1`}
                  >
                    <span className="text-[9px] font-mono text-muted-foreground/60">{score}</span>
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {cellItems.map(r => {
                        const sc = scoreColor(riskScore(r.probability, r.impact))
                        return (
                          <button
                            key={r.id}
                            onClick={() => onSelect(selected?.id === r.id ? null : r)}
                            className={`w-5 h-5 rounded-full ${sc.bg} text-white text-[7px] font-bold flex items-center justify-center hover:scale-110 transition-transform`}
                            title={r.title}
                          >
                            {r.id.split('-')[1]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          {/* Impact axis bottom */}
          <div className="flex pl-16 mt-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground/50">{i}</div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground text-center mt-1">Impact →</p>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiskPage() {
  const { pushActivity, pushNotification } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'register' | 'matrix' | 'mitigations'>('matrix')
  const [filterStatus, setFilterStatus] = useState<RiskStatus | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<RiskCategory | 'all'>('all')
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null)
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3000) }

  const escalateRisk = (risk: Risk) => {
    pushActivity({ actor: 'You', action: 'escalated risk', target: `${risk.id} — ${risk.title}`, tone: 'warning' })
    pushNotification({
      title: `Risk Escalated: ${risk.id}`,
      body: `"${risk.title}" was escalated to executive attention. Owner and mitigation plan require immediate review.`,
      category: 'system',
      link: '/risk',
      urgent: true,
      icon: AlertTriangle,
      project: risk.project,
    })
    showToast(`Risk ${risk.id} escalated to executives.`)
  }

  const filtered = risks.filter(r =>
    (filterStatus === 'all' || r.status === filterStatus) &&
    (filterCategory === 'all' || r.category === filterCategory)
  )

  const critical = risks.filter(r => riskScore(r.probability, r.impact) >= 15).length
  const high     = risks.filter(r => { const s = riskScore(r.probability, r.impact); return s >= 9 && s < 15 }).length
  const open     = risks.filter(r => r.status === 'open' || r.status === 'escalated').length
  const escalated = risks.filter(r => r.status === 'escalated').length

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px]">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-secondary text-foreground text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-auto text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Risk Register</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Steps 3–4 deliverable — risk identification, scoring, mitigation planning, and residual risk tracking across all active EPC projects
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 border border-border text-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" />
              Export Register
            </button>
            <button
              onClick={() => showToast('New risk entry form opened')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Risk
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Risks" value={risks.length.toString()} subtitle="Portfolio-wide" icon={Shield} accent="navy" />
          <KPICard title="Critical / High" value={`${critical} / ${high}`} subtitle="Requiring immediate action" icon={AlertTriangle} accent="red" />
          <KPICard title="Open Risks" value={open.toString()} subtitle={`${escalated} escalated`} icon={TrendingDown} accent="orange" />
          <KPICard title="Mitigated" value={risks.filter(r => r.status === 'mitigated').length.toString()} subtitle="Residual risk accepted" icon={CheckCircle} accent="green" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 border border-border rounded-xl p-1 w-fit">
          {(['matrix', 'register', 'mitigations'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'matrix' ? 'Risk Heat Map' : t === 'register' ? 'Risk Register' : 'Mitigations'}
            </button>
          ))}
        </div>

        {/* Risk Heat Map */}
        {activeTab === 'matrix' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <RiskMatrix risks={risks} selected={selectedRisk} onSelect={setSelectedRisk} />
            </div>

            {/* Detail panel */}
            <div className="space-y-4">
              {selectedRisk ? (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-primary">{selectedRisk.id}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusConfig[selectedRisk.status].color}`}>
                        {statusConfig[selectedRisk.status].label}
                      </span>
                    </div>
                    <button onClick={() => setSelectedRisk(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{selectedRisk.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{selectedRisk.description}</p>

                    {/* Score */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground mb-1">Inherent Risk Score</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-bold ${scoreColor(riskScore(selectedRisk.probability, selectedRisk.impact)).text}`}>
                            {riskScore(selectedRisk.probability, selectedRisk.impact)}
                          </span>
                          <span className="text-xs text-muted-foreground">/25</span>
                        </div>
                        <p className={`text-[10px] font-semibold mt-0.5 ${scoreColor(riskScore(selectedRisk.probability, selectedRisk.impact)).text}`}>
                          {scoreColor(riskScore(selectedRisk.probability, selectedRisk.impact)).label}
                        </p>
                        <div className="text-[10px] text-muted-foreground mt-1">P{selectedRisk.probability} × I{selectedRisk.impact}</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground mb-1">Residual Risk Score</p>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-bold ${scoreColor(riskScore(selectedRisk.residualProbability, selectedRisk.residualImpact)).text}`}>
                            {riskScore(selectedRisk.residualProbability, selectedRisk.residualImpact)}
                          </span>
                          <span className="text-xs text-muted-foreground">/25</span>
                        </div>
                        <p className={`text-[10px] font-semibold mt-0.5 ${scoreColor(riskScore(selectedRisk.residualProbability, selectedRisk.residualImpact)).text}`}>
                          {scoreColor(riskScore(selectedRisk.residualProbability, selectedRisk.residualImpact)).label}
                        </p>
                        <div className="text-[10px] text-muted-foreground mt-1">P{selectedRisk.residualProbability} × I{selectedRisk.residualImpact}</div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="space-y-2 text-xs">
                      {[
                        { label: 'Project',   value: selectedRisk.project },
                        { label: 'Phase',     value: selectedRisk.phase },
                        { label: 'Category',  value: categoryLabel[selectedRisk.category] },
                        { label: 'Owner',     value: selectedRisk.owner },
                        { label: 'Due Date',  value: selectedRisk.dueDate },
                      ].map(m => (
                        <div key={m.label} className="flex justify-between gap-3">
                          <span className="text-muted-foreground">{m.label}</span>
                          <span className="font-medium text-foreground text-right">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Mitigation */}
                    <div className="border-t border-border pt-3">
                      <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Mitigation Plan</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{selectedRisk.mitigation}</p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => showToast(`Risk ${selectedRisk.id} updated`)} className="flex-1 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-white py-2 rounded-lg transition-colors">
                        Update Status
                      </button>
                      <button onClick={() => escalateRisk(selectedRisk)} className="flex-1 text-xs font-semibold bg-red-950/20 hover:bg-red-100 text-red-400 border border-red-800/30 py-2 rounded-lg transition-colors">
                        Escalate
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
                  <Shield className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Click any risk bubble on the heat map to view its full detail, scoring, and mitigation plan.</p>
                </div>
              )}

              {/* Legend */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">Risk Score Legend</p>
                {[
                  { range: '15–25', label: 'Critical', bg: 'bg-red-500' },
                  { range: '9–14',  label: 'High',     bg: 'bg-primary' },
                  { range: '5–8',   label: 'Medium',   bg: 'bg-primary' },
                  { range: '1–4',   label: 'Low',      bg: 'bg-emerald-700' },
                ].map(l => (
                  <div key={l.range} className="flex items-center gap-2 text-xs">
                    <span className={`w-3 h-3 rounded-sm ${l.bg} flex-shrink-0`} />
                    <span className="text-muted-foreground">{l.range}</span>
                    <span className="font-medium text-foreground">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Risk Register tab */}
        {activeTab === 'register' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Filters */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/20 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Filter:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as RiskStatus | 'all')}
                className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card text-foreground outline-none"
              >
                <option value="all">All Statuses</option>
                {(['open', 'mitigated', 'escalated', 'closed'] as const).map(s => (
                  <option key={s} value={s}>{statusConfig[s].label}</option>
                ))}
              </select>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value as RiskCategory | 'all')}
                className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card text-foreground outline-none"
              >
                <option value="all">All Categories</option>
                {(Object.keys(categoryLabel) as RiskCategory[]).map(c => (
                  <option key={c} value={c}>{categoryLabel[c]}</option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground ml-auto">{filtered.length} risks</span>
            </div>

            <div className="divide-y divide-border">
              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium text-foreground">No risks match your filter</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
                </div>
              )}
              {filtered.map(risk => {
                const score = riskScore(risk.probability, risk.impact)
                const residual = riskScore(risk.residualProbability, risk.residualImpact)
                const sc = scoreColor(score)
                const isExpanded = expandedRisk === risk.id

                return (
                  <div key={risk.id}>
                    <button
                      onClick={() => setExpandedRisk(isExpanded ? null : risk.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors text-left"
                    >
                      {/* Score pill */}
                      <div className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-sm font-bold text-white">{score}</span>
                      </div>
                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{risk.id}</span>
                          <span className="text-sm font-semibold text-foreground truncate">{risk.title}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">{risk.project}</span>
                          <span className="text-[10px] text-muted-foreground">{risk.phase}</span>
                          <span className="text-[10px] font-medium text-foreground bg-muted px-1.5 py-0.5 rounded capitalize">{categoryLabel[risk.category]}</span>
                        </div>
                      </div>
                      {/* Scores */}
                      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Inherent</p>
                          <p className={`text-sm font-bold ${sc.text}`}>{score}</p>
                        </div>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground">Residual</p>
                          <p className={`text-sm font-bold ${scoreColor(residual).text}`}>{residual}</p>
                        </div>
                      </div>
                      {/* Status */}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${statusConfig[risk.status].color}`}>
                        {statusConfig[risk.status].label}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 bg-muted/10 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1.5">Description</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{risk.description}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1.5">Mitigation Plan</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{risk.mitigation}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1.5">Details</p>
                            <div className="space-y-1">
                              {[
                                { l: 'Owner',     v: risk.owner },
                                { l: 'Date Raised',v: risk.dateRaised },
                                { l: 'Due Date',  v: risk.dueDate },
                              ].map(d => (
                                <div key={d.l} className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">{d.l}</span>
                                  <span className="font-medium text-foreground">{d.v}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-end gap-2">
                            <button onClick={() => showToast(`Risk ${risk.id} updated`)} className="flex-1 text-xs font-semibold bg-secondary text-foreground py-2 rounded-lg hover:bg-secondary/80 transition-colors">Update</button>
                            <button onClick={() => showToast(`Risk ${risk.id} closed`)} className="flex-1 text-xs font-semibold border border-border text-foreground py-2 rounded-lg hover:bg-muted transition-colors">Close Risk</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Mitigations tab */}
        {activeTab === 'mitigations' && (
          <div className="space-y-3">
            {risks.filter(r => r.status !== 'closed').map(risk => {
              const score = riskScore(risk.probability, risk.impact)
              const residual = riskScore(risk.residualProbability, risk.residualImpact)
              const reduction = score - residual
              const sc = scoreColor(score)
              return (
                <div key={risk.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl ${sc.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-sm font-bold text-white">{score}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono text-primary">{risk.id}</span>
                        <span className="text-sm font-semibold text-foreground">{risk.title}</span>
                        <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusConfig[risk.status].color}`}>
                          {statusConfig[risk.status].label}
                        </span>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 mt-2">
                        <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1">Mitigation Actions</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{risk.mitigation}</p>
                      </div>
                      <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                        <span>Owner: <strong className="text-foreground">{risk.owner}</strong></span>
                        <span>Due: <strong className="text-foreground">{risk.dueDate}</strong></span>
                        <span className="flex items-center gap-1">
                          Risk reduction:
                          <strong className={`ml-1 ${reduction > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                            {score} → {residual} {reduction > 0 ? `(−${reduction})` : '(no change)'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
