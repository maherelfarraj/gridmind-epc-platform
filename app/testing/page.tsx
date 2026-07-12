'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { ActivityLog } from '@/components/shared/activity-log'
import { PhaseBanner } from '@/components/shared/phase-banner'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Plus,
  Shield,
  Upload,
  X,
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
} from 'recharts'

// ─── Data ─────────────────────────────────────────────────────────────────────

// Phase 7 steps: 44=Submit T&C Plan, 45=Consultant Review, 46=Start T&C,
//                47=Submit T&C Report, 48=Consultant Review, 49=PAC, 50=End/Closeout

const tcProjects = [
  {
    id: 'NEOM-SOL-004',
    name: 'NEOM Solar Farm — Package 4',
    client: 'NEOM Company',
    currentStep: 46,
    currentStepLabel: 'Start T&C',
    startDate: 'Mar 1, 2025',
    pacTarget: 'Apr 30, 2025',
    closeoutTarget: 'May 15, 2025',
    completion: 42,
    status: 'active',
    tcManager: 'Ahmed Al-Rashidi',
    consultant: 'Parsons International',
  },
  {
    id: 'YNB-IND-001',
    name: 'Yanbu Industrial EPC',
    client: 'SABIC',
    currentStep: 49,
    currentStepLabel: 'PAC Certificate',
    startDate: 'Dec 10, 2023',
    pacTarget: 'Jul 5, 2024',
    closeoutTarget: 'Jul 20, 2024',
    completion: 92,
    status: 'pac-pending',
    tcManager: 'Omar Abdullah',
    consultant: 'Wood Group PLC',
  },
]

const tcPlanRequirements = [
  { id: 'TC-DOC-001', name: 'Detailed T&C Plan & Schedule', step: 44, submitted: true, approved: true, revision: 'Rev 2' },
  { id: 'TC-DOC-002', name: 'Test Checklists — PV Modules & String Testing', step: 44, submitted: true, approved: true, revision: 'Rev 1' },
  { id: 'TC-DOC-003', name: 'Test Checklists — Inverter & DC Side', step: 44, submitted: true, approved: false, revision: 'Rev 1' },
  { id: 'TC-DOC-004', name: 'Test Checklists — MV/HV Switchgear', step: 44, submitted: true, approved: false, revision: 'Rev 0' },
  { id: 'TC-DOC-005', name: 'Pre-commissioning Test Procedures', step: 46, submitted: true, approved: true, revision: 'Rev 1' },
  { id: 'TC-DOC-006', name: 'T&C Report', step: 47, submitted: false, approved: false, revision: '—' },
  { id: 'TC-DOC-007', name: 'Punch List — Category A & B Items', step: 48, submitted: false, approved: false, revision: '—' },
  { id: 'TC-DOC-008', name: 'As-Built Drawings Package', step: 49, submitted: false, approved: false, revision: '—' },
  { id: 'TC-DOC-009', name: 'O&M Manuals — All Disciplines', step: 49, submitted: false, approved: false, revision: '—' },
  { id: 'TC-DOC-010', name: 'PAC Certificate (Provisional Acceptance)', step: 49, submitted: false, approved: false, revision: '—' },
  { id: 'TC-DOC-011', name: 'Handover Dossier', step: 50, submitted: false, approved: false, revision: '—' },
]

const testSystems = [
  {
    id: 'SYS-001', name: 'PV String Testing — Zone A', discipline: 'DC/Solar', steps: ['String IV Curve', 'Open Circuit Voltage', 'Insulation Resistance', 'Polarity Check'],
    status: 'completed', completedDate: 'Mar 15, 2025', result: 'Pass', comments: 'All 840 strings passed. 3 strings replaced due to shadow mismatch.',
  },
  {
    id: 'SYS-002', name: 'PV String Testing — Zone B', discipline: 'DC/Solar', steps: ['String IV Curve', 'Open Circuit Voltage', 'Insulation Resistance', 'Polarity Check'],
    status: 'in-progress', completedDate: '—', result: '—', comments: '68% complete — remaining 270 strings in progress.',
  },
  {
    id: 'SYS-003', name: 'Inverter Pre-commissioning', discipline: 'AC/Inverter', steps: ['Control Loop Test', 'Grid Synchronisation', 'Protection Relay Settings', 'Ramp Rate Test'],
    status: 'in-progress', completedDate: '—', result: '—', comments: '3 of 24 inverters commissioned. Awaiting Zone B string completion.',
  },
  {
    id: 'SYS-004', name: 'HV Transformer Testing', discipline: 'HV', steps: ['HV Dielectric Test', 'Ratio Test', 'Magnetising Current', 'Oil Analysis'],
    status: 'pending', completedDate: '—', result: '—', comments: 'Scheduled for Apr 5, 2025.',
  },
  {
    id: 'SYS-005', name: 'SCADA / Monitoring Commissioning', discipline: 'SCADA', steps: ['Point-to-Point Test', 'Data Logger Config', 'Alarm Setup', 'Remote Access Test'],
    status: 'pending', completedDate: '—', result: '—', comments: 'Waiting for all inverters to be commissioned first.',
  },
  {
    id: 'SYS-006', name: 'Earthing & Lightning Protection', discipline: 'Civil/Elec', steps: ['Earth Resistance Test', 'Touch/Step Voltage', 'Continuity Test', 'Visual Inspection'],
    status: 'completed', completedDate: 'Mar 10, 2025', result: 'Pass', comments: 'All earth resistance values below 1Ω.',
  },
]

const punchList = [
  { id: 'PL-A-001', cat: 'A', system: 'Inverter #07', description: 'Grid protection relay — incorrect trip setting. Must be corrected before energisation.', status: 'open', owner: 'Electrical Team', due: 'Apr 2, 2025' },
  { id: 'PL-A-002', cat: 'A', system: 'HV Substation', description: 'Missing arc flash label on Panel HV-003.', status: 'open', owner: 'HSE Officer', due: 'Apr 1, 2025' },
  { id: 'PL-B-001', cat: 'B', system: 'SCADA Room', description: 'HVAC unit not cooling to required setpoint — minor adjustment required.', status: 'in-progress', owner: 'HVAC Subcontractor', due: 'Apr 5, 2025' },
  { id: 'PL-B-002', cat: 'B', system: 'Access Road', description: 'Gate 3 locking mechanism stiff. Lubrication and adjustment required.', status: 'closed', owner: 'Civil Team', due: 'Mar 20, 2025' },
  { id: 'PL-B-003', cat: 'B', system: 'Zone A Fence', description: 'Missing reflective marker posts at 8 fence corners.', status: 'in-progress', owner: 'Civil Team', due: 'Apr 3, 2025' },
]

const testProgress = [
  { system: 'DC/Solar', completed: 68, total: 100 },
  { system: 'AC/Inverter', completed: 12, total: 100 },
  { system: 'HV', completed: 0, total: 100 },
  { system: 'SCADA', completed: 0, total: 100 },
  { system: 'Civil/Elec', completed: 100, total: 100 },
]

const stepFlow = [
  { n: 44, label: 'Submit Detailed T&C Plan', done: true },
  { n: 45, label: 'Consultant Review', done: true },
  { n: 46, label: 'Start T&C', active: true },
  { n: 47, label: 'Submit T&C Report', done: false },
  { n: 48, label: 'Consultant Review', done: false },
  { n: 49, label: 'Provisional Acceptance Certificate (PAC)', done: false },
  { n: 50, label: 'End / Closeout', done: false },
]

const tcActivities = [
  { id: 'tc1', type: 'approval' as const, user: 'Consultant Reviewer', userInitials: 'CR', userColor: '#0D9488', action: 'approved', target: 'T&C Plan Rev 2', time: '2 hours ago', isNew: true },
  { id: 'tc2', type: 'upload' as const, user: 'Ahmed Al-Rashidi', userInitials: 'AA', userColor: '#4A7FA5', action: 'uploaded', target: 'Pre-commissioning Checklist SYS-001', time: '4 hours ago', isNew: true },
  { id: 'tc3', type: 'status' as const, user: 'T&C Manager', userInitials: 'TM', userColor: '#C9A55A', action: 'started commissioning on', target: 'Inverter #01 — Zone A', time: 'Yesterday' },
  { id: 'tc4', type: 'comment' as const, user: 'Parsons International', userInitials: 'PI', userColor: '#4A7FA5', action: 'raised punch list item', target: 'PL-A-001 — Inverter #07 relay setting', time: 'Yesterday' },
]

const sysStatusColors: Record<string, { bg: string; text: string; border: string }> = {
  completed:   { bg: 'bg-emerald-950/20', text: 'text-emerald-400', border: 'border-emerald-800/30' },
  'in-progress':{ bg: 'bg-accent', text: 'text-amber-400', border: 'border-amber-500/30' },
  pending:     { bg: 'bg-muted',      text: 'text-muted-foreground', border: 'border-border' },
}

const catColors: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-red-950/20',      text: 'text-red-600',       border: 'border-red-800/30' },
  B: { bg: 'bg-accent',   text: 'text-primary',     border: 'border-primary/30' },
}

export default function TestingPage() {
  const { pushActivity, pushNotification } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'overview' | 'test-records' | 'punch-list' | 'documents'>('overview')
  const [selectedProject, setSelectedProject] = useState('NEOM-SOL-004')
  const [pacDrawerOpen, setPacDrawerOpen] = useState(false)
  const [pacIssued, setPacIssued] = useState(false)
  const [pacForm, setPacForm] = useState({ clientRep: '', gsiRep: '', issueDate: '', remarks: '', file: '' })
  const [pacToast, setPacToast] = useState<string | null>(null)

  const showPacToast = (msg: string) => { setPacToast(msg); setTimeout(() => setPacToast(null), 3500) }

  const project = tcProjects.find(p => p.id === selectedProject)!

  const handleIssuePAC = () => {
    if (!pacForm.clientRep || !pacForm.gsiRep || !pacForm.issueDate) return
    setPacIssued(true)
    setPacDrawerOpen(false)
    pushActivity({ actor: 'You', action: 'issued PAC Certificate for', target: project.name, tone: 'success' })
    pushNotification({
      title: `PAC Issued — ${project.name}`,
      body: `The Provisional Acceptance Certificate (Step 49) was issued for ${project.name}. The project can now proceed to closeout.`,
      category: 'system',
      link: '/testing',
      urgent: false,
      icon: Shield,
      project: project.name,
    })
    showPacToast('PAC Certificate issued successfully — Step 49 completed')
  }
  const openCatA = punchList.filter(p => p.cat === 'A' && p.status !== 'closed').length

  return (
    <AppLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Testing, Commissioning & Handover</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Phase 7 · Steps 44–50 — T&C Plan, consultant review, start T&C, report, PAC certificate, and project closeout
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
            >
              {tcProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              Log Test Result
            </button>
          </div>
        </div>

        <PhaseBanner phase={7} phaseName="Testing, Commissioning & Handover" steps="44–50" activeStep={46} activeStepLabel="Start T&C — System Testing" status="on-track" />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="T&C Completion" value={`${project.completion}%`} subtitle={`Current: Step ${project.currentStep} — ${project.currentStepLabel}`} trend={{ value: 12, label: 'this week' }} icon={ClipboardCheck} accent="orange" />
          <KPICard title="Systems Tested" value="2 / 6" subtitle="4 remaining" icon={Zap} accent="indigo" />
          <KPICard title="Open Punch List" value={punchList.filter(p => p.status !== 'closed').length} subtitle={`${openCatA} Category A (blocking)`} icon={AlertCircle} accent={openCatA > 0 ? 'red' : 'green'} />
          <KPICard title="PAC Target" value={project.pacTarget} subtitle={`Closeout: ${project.closeoutTarget}`} icon={Shield} accent="gold" />
        </div>

        {/* Step Flow */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Phase 7 — Step Progress (Steps 44–50)</h2>
            <span className="text-xs text-muted-foreground">Currently at Step {project.currentStep}: {project.currentStepLabel}</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {stepFlow.map((s, i) => (
              <div key={s.n} className="flex items-center gap-1 flex-shrink-0">
                <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all min-w-[110px] text-center ${
                  s.done ? 'bg-emerald-950/20 border-emerald-800/30' :
                  s.active ? 'bg-accent border-primary ring-2 ring-primary/20' :
                  'bg-muted border-border'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    s.done ? 'bg-emerald-700 text-white' :
                    s.active ? 'bg-primary text-white' :
                    'bg-border text-muted-foreground'
                  }`}>
                    {s.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
                  </div>
                  <span className={`text-[10px] leading-tight ${s.active ? 'text-amber-400 font-semibold' : s.done ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    #{s.n} {s.label}
                  </span>
                </div>
                {i < stepFlow.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Category A alert */}
        {openCatA > 0 && (
          <div className="flex items-start gap-3 bg-red-950/20 border border-red-800/30 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">{openCatA} Category A Punch List Item{openCatA > 1 ? 's' : ''} — Blocking PAC</p>
              <p className="text-xs text-red-600 mt-0.5">Category A items must be fully cleared before the Provisional Acceptance Certificate (Step 49) can be issued. Coordinate with contractor to resolve by PAC target date.</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          {(['overview', 'test-records', 'punch-list', 'documents'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'test-records' ? 'Test Records' : t === 'punch-list' ? 'Punch List' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">

              {/* Test system status */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">System Test Status</h2>
                <div className="space-y-3">
                  {testSystems.map(sys => {
                    const sc = sysStatusColors[sys.status]
                    return (
                      <div key={sys.id} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sys.status === 'completed' ? 'bg-emerald-600' : sys.status === 'in-progress' ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{sys.name}</span>
                            <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">{sys.discipline}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{sys.comments}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                            {sys.status.replace('-', ' ')}
                          </span>
                          {sys.result !== '—' && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sys.result === 'Pass' ? 'bg-emerald-950/20 text-emerald-400' : 'bg-red-950/20 text-red-400'}`}>
                              {sys.result}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Test progress by discipline */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-4">Test Progress by Discipline</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={testProgress} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <YAxis dataKey="system" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="completed" fill="#1E2230" radius={[0, 4, 4, 0]} name="Completed %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              {/* Project info */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Project Details</h2>
                <div className="space-y-2 text-xs">
                  {[
                    { label: 'T&C Manager', value: project.tcManager },
                    { label: 'Consultant', value: project.consultant },
                    { label: 'T&C Start', value: project.startDate },
                    { label: 'PAC Target', value: project.pacTarget },
                    { label: 'Closeout Target', value: project.closeoutTarget },
                    { label: 'Current Step', value: `#${project.currentStep}: ${project.currentStepLabel}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium text-foreground text-right">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Punch list summary */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">Punch List Summary</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Cat A Open', value: punchList.filter(p => p.cat === 'A' && p.status !== 'closed').length, color: 'text-red-600' },
                    { label: 'Cat B Open', value: punchList.filter(p => p.cat === 'B' && p.status !== 'closed').length, color: 'text-primary' },
                    { label: 'In Progress', value: punchList.filter(p => p.status === 'in-progress').length, color: 'text-amber-400' },
                    { label: 'Closed', value: punchList.filter(p => p.status === 'closed').length, color: 'text-emerald-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-muted rounded-lg p-3 text-center">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PAC Certificate card */}
              <div className={`border rounded-xl p-5 ${pacIssued ? 'bg-emerald-950/20 border-emerald-800/30' : openCatA > 0 ? 'bg-muted/30 border-border' : 'bg-accent border-amber-500/30'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className={`w-4 h-4 flex-shrink-0 ${pacIssued ? 'text-emerald-400' : openCatA > 0 ? 'text-muted-foreground' : 'text-amber-400'}`} />
                  <h2 className="text-sm font-semibold text-foreground">PAC Certificate — Step 49</h2>
                </div>

                {pacIssued ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-semibold">Issued</span>
                    </div>
                    <p className="text-xs text-emerald-400">PAC Certificate has been formally issued. Project can proceed to Step 50 — Closeout.</p>
                    <button className="flex items-center gap-1.5 text-xs text-emerald-400 border border-emerald-800/40 px-3 py-1.5 rounded-lg hover:bg-emerald-950/30 transition-colors mt-2">
                      <Download className="w-3.5 h-3.5" />
                      Download PAC Certificate
                    </button>
                  </div>
                ) : openCatA > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">PAC cannot be issued until all <span className="font-semibold text-red-600">{openCatA} Category A</span> punch list items are cleared.</p>
                    <div className="flex items-center gap-1.5 bg-red-950/20 border border-red-800/30 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span className="text-[11px] text-red-600">Resolve all Category A items first</span>
                    </div>
                    <button disabled className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground text-xs font-semibold py-2 rounded-lg cursor-not-allowed border border-border mt-1">
                      <Shield className="w-3.5 h-3.5" />
                      Issue PAC Certificate
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-[#b06000]">All Category A items cleared. The project is ready for Provisional Acceptance Certificate issuance.</p>
                    <div className="flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-800/30 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-[11px] text-emerald-400">PAC gate cleared — ready to issue</span>
                    </div>
                    <button
                      onClick={() => setPacDrawerOpen(true)}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors mt-1"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Issue PAC Certificate
                    </button>
                  </div>
                )}
              </div>

              {/* Activity */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-semibold text-foreground mb-3">T&C Activity</h2>
                <ActivityLog activities={tcActivities} />
              </div>
            </div>
          </div>
        )}

        {/* PAC Certificate Drawer */}
        {pacDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={() => setPacDrawerOpen(false)} />
            <div className="w-full max-w-md bg-card border-l border-border flex flex-col shadow-2xl">
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary">
                <div>
                  <p className="text-white font-semibold text-sm">Issue PAC Certificate</p>
                  <p className="text-white/60 text-[11px] mt-0.5">Step 49 — Provisional Acceptance Certificate</p>
                </div>
                <button onClick={() => setPacDrawerOpen(false)} className="text-white/60 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Pre-conditions checklist */}
                <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-400 mb-2">Pre-Conditions Verified</p>
                  <div className="space-y-1.5">
                    {[
                      'All Category A punch list items closed',
                      'T&C report submitted (Step 47)',
                      'Consultant review completed (Step 48)',
                      'Final system test results accepted',
                    ].map(c => (
                      <div key={c} className="flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Client Representative *</label>
                    <input
                      value={pacForm.clientRep}
                      onChange={e => setPacForm(f => ({ ...f, clientRep: e.target.value }))}
                      placeholder="e.g. Mohammed Al-Farsi, NEOM Company"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500 placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">GSI Representative *</label>
                    <input
                      value={pacForm.gsiRep}
                      onChange={e => setPacForm(f => ({ ...f, gsiRep: e.target.value }))}
                      placeholder="e.g. Ahmed Al-Rashidi, GSI Holding"
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500 placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">PAC Issue Date *</label>
                    <input
                      type="date"
                      value={pacForm.issueDate}
                      onChange={e => setPacForm(f => ({ ...f, issueDate: e.target.value }))}
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Upload Signed PAC Document</label>
                    <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 text-center hover:border-amber-500/50 transition-colors cursor-pointer">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload or drag &amp; drop</p>
                      <p className="text-[10px] text-muted-foreground/60">PDF, max 20 MB</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Remarks / Conditions</label>
                    <textarea
                      rows={3}
                      value={pacForm.remarks}
                      onChange={e => setPacForm(f => ({ ...f, remarks: e.target.value }))}
                      placeholder="Any outstanding Category B conditions attached to this PAC..."
                      className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-amber-500 placeholder:text-muted-foreground/60 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Drawer footer */}
              <div className="px-6 py-4 border-t border-border flex items-center gap-3">
                <button
                  onClick={handleIssuePAC}
                  disabled={!pacForm.clientRep || !pacForm.gsiRep || !pacForm.issueDate}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Issue PAC Certificate
                </button>
                <button onClick={() => setPacDrawerOpen(false)} className="px-4 py-2.5 border border-border text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAC Toast */}
        {pacToast && (
          <div className="fixed top-4 right-4 z-50 bg-secondary text-foreground text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{pacToast}</span>
          </div>
        )}

        {/* Test Records tab */}
        {activeTab === 'test-records' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Ref', 'System', 'Discipline', 'Test Steps', 'Completed Date', 'Result', 'Comments', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {testSystems.map(sys => {
                    const sc = sysStatusColors[sys.status]
                    return (
                      <tr key={sys.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{sys.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{sys.name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{sys.discipline}</td>
                        <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{sys.steps.map(s => <span key={s} className="text-[10px] bg-muted border border-border px-1.5 py-0.5 rounded">{s}</span>)}</div></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{sys.completedDate}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
                            {sys.result !== '—' ? sys.result : sys.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">{sys.comments}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button className="text-xs text-primary hover:underline flex items-center gap-1"><Eye className="w-3.5 h-3.5" />View</button>
                            {sys.status !== 'completed' && <button className="text-xs text-amber-400 hover:underline flex items-center gap-1 ml-2"><Upload className="w-3.5 h-3.5" />Upload</button>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Punch List tab */}
        {activeTab === 'punch-list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Category A items must be resolved before PAC (Step 49). Category B items must be resolved before Final Handover (Step 50).</p>
              <button className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 text-white text-sm px-3 py-2 rounded-lg transition-colors">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['ID', 'Cat', 'System', 'Description', 'Owner', 'Due Date', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {punchList.map(item => {
                      const cc = catColors[item.cat]
                      const stc = item.status === 'closed' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30' :
                                  item.status === 'in-progress' ? 'bg-accent text-amber-400 border-amber-500/30' :
                                  'bg-red-950/20 text-red-600 border-red-800/30'
                      return (
                        <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.id}</td>
                          <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded border ${cc.bg} ${cc.text} ${cc.border}`}>Cat {item.cat}</span></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{item.system}</td>
                          <td className="px-4 py-3 text-sm text-foreground max-w-xs">{item.description}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{item.owner}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{item.due}</td>
                          <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${stc}`}>{item.status.replace('-', ' ')}</span></td>
                          <td className="px-4 py-3"><button className="text-xs text-primary hover:underline flex items-center gap-1"><Eye className="w-3.5 h-3.5" />View</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Documents tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">T&C Document Register</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Steps 44–50 required documents. All must be approved before PAC and Closeout.</p>
              </div>
              <button className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 text-white text-sm px-3 py-2 rounded-lg transition-colors">
                <Upload className="w-4 h-4" /> Upload Document
              </button>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Ref', 'Document', 'Required at Step', 'Submitted', 'Approved by Consultant', 'Revision', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tcPlanRequirements.map(doc => (
                      <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{doc.id}</td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium">{doc.name}</td>
                        <td className="px-4 py-3"><span className="text-[10px] font-mono text-primary">Step {doc.step}</span></td>
                        <td className="px-4 py-3">{doc.submitted ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-border" />}</td>
                        <td className="px-4 py-3">{doc.approved ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : doc.submitted ? <div className="w-4 h-4 rounded-full border-2 border-amber-500 bg-accent" /> : <div className="w-4 h-4 rounded-full border-2 border-border" />}</td>
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{doc.revision}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {doc.submitted && <button className="text-xs text-primary hover:underline flex items-center gap-1"><Eye className="w-3.5 h-3.5" />View</button>}
                            {!doc.submitted && <button className="text-xs text-amber-400 hover:underline flex items-center gap-1"><Upload className="w-3.5 h-3.5" />Upload</button>}
                            {doc.submitted && <button className="text-xs text-muted-foreground hover:text-foreground ml-2 flex items-center gap-1"><Download className="w-3.5 h-3.5" />Download</button>}
                          </div>
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
