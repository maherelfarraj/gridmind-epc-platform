'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { PhaseBanner } from '@/components/shared/phase-banner'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import {
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
import { useState } from 'react'

const ncrList = [
  { id: 'NCR-2024-018', title: 'Weld quality — insufficient penetration', area: 'Zone A Steel', raised: 'Oct 28', owner: 'QA/QC Manager', severity: 'major', status: 'open', dueDate: 'Nov 7' },
  { id: 'NCR-2024-017', title: 'Foundation dimensions out of tolerance', area: 'Zone B Civil', raised: 'Oct 22', owner: 'Site Engineer', severity: 'major', status: 'corrective-action', dueDate: 'Nov 1' },
  { id: 'NCR-2024-016', title: 'Cable tray missing fire barrier', area: 'Substation Building', raised: 'Oct 18', owner: 'Elec. QC', severity: 'minor', status: 'closed', dueDate: 'Oct 25' },
  { id: 'NCR-2024-015', title: 'Incorrect torque value on module clamps', area: 'Zone A Solar', raised: 'Oct 10', owner: 'QA/QC Inspector', severity: 'minor', status: 'closed', dueDate: 'Oct 14' },
  { id: 'NCR-2024-014', title: 'Material certificate missing for cable batch', area: 'Procurement', raised: 'Oct 5', owner: 'Procurement', severity: 'major', status: 'closed', dueDate: 'Oct 10' },
]

// Step 29 = HSE/QA-QC Plans; Step 33 = Inspection/NCR; Steps 44-47 = T&C phases
const itpItems = [
  { id: 'ITP-E-001', activity: 'Cable Installation & Termination',      discipline: 'Electrical',   hold: 'W', witness: 'C', review: 'C', status: 'pending',     workflowStep: '#33 Inspection' },
  { id: 'ITP-E-002', activity: 'FAT — HV Transformer (ABB)',            discipline: 'Electrical',   hold: 'H', witness: 'W', review: 'C', status: 'scheduled',   workflowStep: '#26 Site Inspection' },
  { id: 'ITP-C-001', activity: 'Concrete Pour — Zone B',                discipline: 'Civil',        hold: 'W', witness: 'C', review: 'C', status: 'completed',   workflowStep: '#33 Inspection' },
  { id: 'ITP-C-002', activity: 'Steel Structure Erection — Zone A',     discipline: 'Civil/Struct', hold: 'H', witness: 'W', review: 'C', status: 'in-progress', workflowStep: '#33 Inspection' },
  { id: 'ITP-S-001', activity: 'PV Module Installation — Zone A',       discipline: 'Solar',        hold: 'W', witness: 'W', review: 'C', status: 'pending',     workflowStep: '#34 Milestone Update' },
  { id: 'ITP-TC-001', activity: 'T&C Plan Review & Approval',           discipline: 'T&C',          hold: 'H', witness: 'W', review: 'C', status: 'pending',     workflowStep: '#45 Consultant Review' },
  { id: 'ITP-TC-002', activity: 'Start T&C — Pre-commissioning Tests',  discipline: 'T&C',          hold: 'H', witness: 'W', review: 'C', status: 'pending',     workflowStep: '#46 Start T&C' },
]

const ncrTrend = [
  { month: 'Aug', raised: 4, closed: 3 },
  { month: 'Sep', raised: 7, closed: 5 },
  { month: 'Oct', raised: 5, closed: 3 },
  { month: 'Nov', raised: 2, closed: 1 },
]

const ncrBySeverity = [
  { name: 'Critical', value: 0, color: '#8A5A5A' },
  { name: 'Major', value: 3, color: '#8B6F3A' },
  { name: 'Minor', value: 5, color: '#C9A55A' },
  { name: 'Observation', value: 8, color: '#C9A55A' },
]

const severityColors: Record<string, string> = {
  critical: 'text-red-400 bg-red-950/20 border-red-800/30',
  major: 'text-amber-400 bg-accent border-amber-500/20',
  minor: 'text-primary bg-accent border-primary/30',
  observation: 'text-primary bg-secondary/60 border-primary/20',
}

const ncrStatusColors: Record<string, string> = {
  open: 'text-red-400 bg-red-950/20 border-red-800/30',
  'corrective-action': 'text-amber-400 bg-accent border-amber-500/20',
  closed: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30',
}

const itpStatusColors: Record<string, string> = {
  pending: 'text-muted-foreground bg-muted border-border',
  scheduled: 'text-primary bg-secondary/60 border-primary/20',
  'in-progress': 'text-amber-400 bg-accent border-amber-500/20',
  completed: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30',
}

export default function QAQCPage() {
  const { pushNotification, pushActivity } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'ncr' | 'itp'>('ncr')
  const [ncrSeq, setNcrSeq] = useState(43)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [selectedNCR, setSelectedNCR] = useState<typeof ncrList[0] | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const raiseNCR = () => {
    const ref = `NCR-0${ncrSeq}`
    setNcrSeq((n) => n + 1)
    pushActivity({ actor: 'You', action: 'raised', target: `${ref} — Concrete Works, Zone B`, tone: 'warning' })
    pushNotification({
      title: `QA/QC: ${ref} Raised — Concrete Works`,
      body: `A Non-Conformance Report (${ref}) was raised on concrete mix design for Zone B foundations. Response required within 48 hours.`,
      category: 'hse',
      link: '/qaqc',
      urgent: true,
      icon: ShieldCheck,
      project: 'NEOM Solar Farm',
    })
    showToast(`${ref} raised and routed to the responsible engineer.`)
  }

  const openNCRs = ncrList.filter(n => n.status !== 'closed').length
  const closedNCRs = ncrList.filter(n => n.status === 'closed').length

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px]">
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-secondary text-foreground text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">QA / QC Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Cross-phase — Step 29 (HSE/QA-QC Plans), Step 33 (Inspection/NCR), Steps 44–47 (T&C Plan, Start T&C, T&C Report, Review)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('ITP inspection request opened')}
              className="flex items-center gap-2 border border-border text-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              New ITP
            </button>
            <button
              onClick={raiseNCR}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Raise NCR
            </button>
          </div>
        </div>

        <PhaseBanner phase={5} phaseName="Quality Assurance / QC" steps="33, 44–47" activeStep={33} activeStepLabel="Inspection & NCR Management" status="on-track" />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          <KPICard title="Open NCRs" value={openNCRs.toString()} subtitle="Requires action" icon={AlertTriangle} accent="red" />
          <KPICard title="Closed NCRs" value={closedNCRs.toString()} subtitle="This quarter" icon={CheckCircle} accent="green" />
          <KPICard title="Closure Rate" value={`${Math.round((closedNCRs / ncrList.length) * 100)}%`} subtitle="vs 80% target" icon={ShieldCheck} accent="indigo" />
          <KPICard title="ITP Activities" value="5" subtitle="2 awaiting" icon={ClipboardCheck} accent="navy" />
          <KPICard title="Quality Score" value="87%" subtitle="Audit result" icon={ShieldCheck} accent="gold" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">NCR Trend — Raised vs Closed</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ncrTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="raised" name="Raised" fill="#8B6F3A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="closed" name="Closed" fill="#5A8A6A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">NCRs by Severity</h2>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={ncrBySeverity} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                  {ncrBySeverity.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {ncrBySeverity.map(s => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-[10px] text-muted-foreground">{s.name}</span>
                  <span className="text-[10px] font-bold text-foreground ml-auto">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center border-b border-border px-5 py-0">
            {(['ncr', 'itp'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-4 text-sm font-medium uppercase transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'ncr' ? 'Non-Conformance Reports' : 'Inspection & Test Plan'}
              </button>
            ))}
          </div>

          {activeTab === 'ncr' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['NCR No.', 'Title', 'Area', 'Raised', 'Owner', 'Severity', 'Due', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ncrList.map(ncr => (
                    <tr key={ncr.id} className={`hover:bg-muted/20 transition-colors ${ncr.status === 'open' ? 'bg-red-950/20/20' : ''}`}>
                      <td className="px-4 py-3 text-xs font-mono text-primary font-medium">{ncr.id}</td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground max-w-[200px]">{ncr.title}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{ncr.area}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{ncr.raised}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{ncr.owner}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${severityColors[ncr.severity]}`}>
                          {ncr.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{ncr.dueDate}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${ncrStatusColors[ncr.status]}`}>
                          {ncr.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedNCR(ncr)}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          {ncr.status === 'closed' ? 'View' : 'Action'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'itp' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['ITP Ref', 'Activity', 'Discipline', 'GSI Hold (H)', 'GSI Witness (W)', 'Consult. Review (C)', 'Workflow Step', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {itpItems.map(itp => (
                    <tr key={itp.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{itp.id}</td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground">{itp.activity}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{itp.discipline}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${itp.hold === 'H' ? 'bg-red-950/20 text-red-400' : 'bg-muted text-muted-foreground'}`}>{itp.hold}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${itp.witness === 'W' ? 'bg-accent text-amber-400' : 'bg-muted text-muted-foreground'}`}>{itp.witness}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-secondary/60 text-primary">{itp.review}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono text-primary">{itp.workflowStep}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${itpStatusColors[itp.status]}`}>
                          {itp.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => showToast(`ITP ${itp.id} inspection record opened`)}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          {itp.status === 'completed' ? 'View Record' : 'Record Result'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">H</strong> = Hold Point (must stop) &nbsp;·&nbsp;
                  <strong className="text-foreground">W</strong> = Witness Point (should attend) &nbsp;·&nbsp;
                  <strong className="text-foreground">C</strong> = Review Document Only
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NCR Detail Drawer */}
      {selectedNCR && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelectedNCR(null)} />
          <div className="w-full max-w-lg bg-card border-l border-border flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-border">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-primary">{selectedNCR.id}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${ncrStatusColors[selectedNCR.status]}`}>
                    {selectedNCR.status.replace('-', ' ')}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${severityColors[selectedNCR.severity]}`}>
                    {selectedNCR.severity}
                  </span>
                </div>
                <h2 className="text-base font-bold text-foreground mt-1">{selectedNCR.title}</h2>
              </div>
              <button onClick={() => setSelectedNCR(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0 ml-4 mt-0.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-6 space-y-5">
              {/* Key fields */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Area / Location', value: selectedNCR.area, icon: ShieldCheck },
                  { label: 'Responsible Owner', value: selectedNCR.owner, icon: User },
                  { label: 'Date Raised', value: selectedNCR.raised, icon: Clock },
                  { label: 'Due Date', value: selectedNCR.dueDate, icon: Clock },
                ].map(f => (
                  <div key={f.label} className="bg-muted/30 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-1">{f.label}</p>
                    <p className="text-xs font-medium text-foreground">{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">Non-Conformance Description</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedNCR.status === 'open'
                    ? `This NCR was raised due to a deficiency identified during routine quality inspection in ${selectedNCR.area}. The issue requires immediate corrective action by the responsible engineer. Root cause analysis must be submitted within 48 hours of this report.`
                    : selectedNCR.status === 'corrective-action'
                    ? `Corrective action plan has been submitted and is currently under implementation. Site supervisor has acknowledged the deficiency. Progress verification inspection is scheduled before closure.`
                    : `NCR has been formally closed following satisfactory implementation of the corrective action. QA/QC Manager has verified the closure with physical inspection and documentation review.`
                  }
                </p>
              </div>

              {/* Corrective action */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">Corrective Action</p>
                </div>
                <textarea
                  rows={3}
                  defaultValue={selectedNCR.status === 'closed' ? 'Corrective action completed and verified. Site re-inspected on ' + selectedNCR.dueDate + ' — conforms to specification.' : ''}
                  placeholder="Describe the corrective action taken or planned..."
                  className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                />
              </div>

              {/* Workflow steps */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
                  <p className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Closure Workflow</p>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { step: 'NCR Raised', done: true,  actor: selectedNCR.owner,  date: selectedNCR.raised },
                    { step: 'Root Cause Analysis', done: selectedNCR.status !== 'open', actor: 'Site Engineer', date: selectedNCR.status !== 'open' ? selectedNCR.dueDate : '—' },
                    { step: 'Corrective Action Plan', done: selectedNCR.status === 'closed' || selectedNCR.status === 'corrective-action', actor: 'QA/QC Manager', date: '—' },
                    { step: 'NCR Closed', done: selectedNCR.status === 'closed', actor: 'QA/QC Manager', date: selectedNCR.status === 'closed' ? selectedNCR.dueDate : '—' },
                  ].map(w => (
                    <div key={w.step} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${w.done ? 'bg-emerald-950/30' : 'bg-muted'}`}>
                        <CheckCircle className={`w-3 h-3 ${w.done ? 'text-emerald-400' : 'text-muted-foreground/30'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${w.done ? 'text-foreground' : 'text-muted-foreground'}`}>{w.step}</p>
                        <p className="text-[10px] text-muted-foreground">{w.actor}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{w.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-border flex gap-3">
              {selectedNCR.status !== 'closed' && (
                <button
                  onClick={() => {
                    showToast(`NCR ${selectedNCR.id} updated — corrective action recorded.`)
                    setSelectedNCR(null)
                  }}
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {selectedNCR.status === 'open' ? 'Submit Corrective Action' : 'Close NCR'}
                </button>
              )}
              <button
                onClick={() => setSelectedNCR(null)}
                className="border border-border text-foreground text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-muted transition-colors"
              >
                {selectedNCR.status === 'closed' ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
