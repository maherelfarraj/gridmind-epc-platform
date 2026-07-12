'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { PhaseBanner } from '@/components/shared/phase-banner'
import { StatusBadge } from '@/components/shared/status-badge'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Layers,
  Plus,
  Search,
  Upload,
  X,
  Wrench,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useState } from 'react'

// BOQ sized for a 400 MWp ground-mount solar plant (NEOM Solar Farm Package 4)
const boqItems = [
  { id: 'BOQ-001', description: 'Solar PV Modules — 600Wp Bifacial', unit: 'pcs', qty: 160000, rate: 1850, total: 296000000, status: 'approved' },
  { id: 'BOQ-002', description: 'String Inverters — 100kW', unit: 'pcs', qty: 1600, rate: 28000, total: 44800000, status: 'approved' },
  { id: 'BOQ-003', description: 'HV Transformer — 100MVA (Grid Connection)', unit: 'pcs', qty: 4, rate: 21600000, total: 86400000, status: 'under-review' },
  { id: 'BOQ-004', description: 'DC Combiner Boxes (16 string)', unit: 'pcs', qty: 3200, rate: 4200, total: 13440000, status: 'approved' },
  { id: 'BOQ-005', description: 'Galvanised Steel Structure', unit: 'ton', qty: 18400, rate: 3800, total: 69920000, status: 'approved' },
  { id: 'BOQ-006', description: 'Medium Voltage Cable — 33kV XLPE', unit: 'm', qty: 84000, rate: 1460, total: 122640000, status: 'pending' },
  { id: 'BOQ-007', description: 'Control & Protection Panels', unit: 'lot', qty: 12, rate: 4800000, total: 57600000, status: 'pending' },
  { id: 'BOQ-008', description: 'SCADA & Energy Management System', unit: 'lot', qty: 1, rate: 28600000, total: 28600000, status: 'draft' },
]

const drawings = [
  { id: 'DWG-E-001', title: 'Site Layout & Grid Connection', discipline: 'Electrical', rev: 'C', status: 'approved', date: 'Apr 20', sheets: 8 },
  { id: 'DWG-E-002', title: 'Solar Field Single Line Diagram', discipline: 'Electrical', rev: 'D', status: 'approved', date: 'May 5', sheets: 4 },
  { id: 'DWG-E-003', title: 'HV Substation Layout', discipline: 'Electrical', rev: 'B', status: 'under-review', date: 'Jun 10', sheets: 12 },
  { id: 'DWG-C-001', title: 'Foundation & Civil Works', discipline: 'Civil', rev: 'A', status: 'approved', date: 'Mar 15', sheets: 22 },
  { id: 'DWG-C-002', title: 'Cable Trench & Road Layout', discipline: 'Civil', rev: 'B', status: 'approved', date: 'Apr 8', sheets: 6 },
  { id: 'DWG-I-001', title: 'SCADA & Instrumentation', discipline: 'Instrument', rev: '—', status: 'pending', date: '—', sheets: 0 },
]

const submittals = [
  { id: 'SUB-001', description: 'Solar Module Technical Datasheet', vendor: 'JA Solar', status: 'approved', reviewDate: 'May 12', comments: 0 },
  { id: 'SUB-002', description: 'Inverter Performance Test Report', vendor: 'Sungrow', status: 'approved', reviewDate: 'May 28', comments: 2 },
  { id: 'SUB-003', description: 'Transformer FAT Protocol', vendor: 'ABB', status: 'under-review', reviewDate: 'Jul 5', comments: 4 },
  { id: 'SUB-004', description: 'Cable Type Test Certificate', vendor: 'Nexans', status: 'pending', reviewDate: '—', comments: 0 },
  { id: 'SUB-005', description: 'SCADA Architecture Document', vendor: 'Schneider', status: 'pending', reviewDate: '—', comments: 0 },
]

const revProgress = [
  { stage: '#14 Studies & Req.', percent: 100 },
  { stage: '#15 Main BOQ',       percent: 100 },
  { stage: '#16 Drawings',       percent: 87 },
  { stage: '#17 Consult. Review',percent: 75 },
  { stage: '#18 Update BOQ',     percent: 64 },
  { stage: '#19 Const. Drawings',percent: 40 },
  { stage: '#20 IFC Issue',      percent: 0 },
]

const disciplineStatus = [
  { name: 'Electrical', total: 24, issued: 20, approved: 18, color: '#4A7FA5' },
  { name: 'Civil', total: 16, issued: 16, approved: 14, color: '#C9A55A' },
  { name: 'Mechanical', total: 8, issued: 5, approved: 4, color: '#8B6F3A' },
  { name: 'Instrument', total: 6, issued: 2, approved: 1, color: '#C9A55A' },
]

const statusColors: Record<string, string> = {
  approved: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30',
  'under-review': 'text-amber-400 bg-accent border-amber-500/20',
  pending: 'text-primary bg-secondary/60 border-primary/20',
  draft: 'text-muted-foreground bg-muted border-border',
  missing: 'text-red-400 bg-red-950/20 border-red-800/30',
}

export default function EngineeringPage() {
  const { createApproval, pushActivity, settings } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'boq' | 'drawings' | 'submittals' | 'comments'>('boq')
  const [search, setSearch] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const submitDrawingForReview = () => {
    createApproval({
      title: 'IFC Drawing Package v4 — Riyadh EPC-07',
      description: 'Issued-for-Construction drawing package (v4) uploaded for consultant and QA/QC review before release to site.',
      project: 'Riyadh EPC Package 07',
      projectId: 'RYD-EPC-007',
      type: 'Engineering Document',
      stage: 'Engineering & Design — Step 20: IFC Issue',
      stageNum: 3,
      submittedBy: 'Eng. Nora Al-Qahtani',
      priority: 'medium',
      approvers: [
        { name: 'Engineering Manager', role: 'Eng. Manager', status: 'pending' },
        { name: 'QA/QC Manager', role: 'QA/QC', status: 'pending' },
        { name: 'Consultant Reviewer', role: 'Consultant', status: 'pending' },
      ],
    })
    pushActivity({ actor: 'You', action: 'uploaded for review', target: 'IFC Drawing Package v4', tone: 'default' })
    showToast('Drawing package uploaded — submitted for consultant review.')
  }

  const boqTotal = boqItems.reduce((s, i) => s + i.total, 0)

  function fmtSAR(n: number, currency = 'SAR'): string {
    const ccy = currency || 'SAR'
    if (n >= 1_000_000_000) return `${ccy} ${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000) return `${ccy} ${Math.round(n / 1_000_000)}M`
    return `${ccy} ${(n / 1000).toFixed(0)}K`
  }

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
            <h1 className="text-2xl font-bold text-foreground">Engineering & Design</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Phase 3 · Steps 14–20 — Studies, BOQ, drawings, submittals, consultant review, and IFC issue</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={submitDrawingForReview}
              className="flex items-center gap-2 border border-border text-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Drawing
            </button>
            <button
              onClick={() => showToast('New BOQ line item added to the working revision.')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New BOQ Item
            </button>
          </div>
        </div>

        <PhaseBanner phase={3} phaseName="Engineering & Design" steps="14–20" activeStep={16} activeStepLabel="Drawing Register & Submittals" status="on-track" />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          <KPICard title="BOQ Total" value={fmtSAR(boqTotal, settings.currency)} subtitle="Current revision" icon={BookOpen} accent="gold" />
          <KPICard title="Drawings Issued" value="43/54" subtitle="IFC target" icon={FileText} accent="navy" />
          <KPICard title="Approved" value="37" subtitle="of 43 issued" icon={CheckCircle} accent="green" />
          <KPICard title="Submittals Pending" value="3" subtitle="Awaiting review" icon={Clock} accent="orange" />
          <KPICard title="Design Complete" value="82%" subtitle="vs schedule 87%" icon={Wrench} accent="indigo" />
        </div>

        {/* Progress bars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engineering progress */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Engineering Stage Progress — Steps 14–20</h2>
            <div className="space-y-3">
              {revProgress.map(r => (
                <div key={r.stage} className="flex items-center gap-3">
                  <span className="text-xs text-foreground w-20 flex-shrink-0">{r.stage}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${r.percent === 100 ? 'bg-emerald-600' : r.percent > 0 ? 'bg-primary' : 'bg-transparent'}`}
                      style={{ width: `${r.percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right">{r.percent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Drawing status by discipline */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Drawing Status by Discipline</h2>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={disciplineStatus} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(232,228,220,0.08)" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="issued" name="Issued" fill="#1E2230" radius={[0, 4, 4, 0]} />
                <Bar dataKey="approved" name="Approved" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-0">
            <div className="flex">
              {(['boq', 'drawings', 'submittals', 'comments'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'boq' ? 'Bill of Quantities' : tab === 'drawings' ? 'Drawing Register' : tab === 'submittals' ? 'Submittals' : 'Consultant Comments'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-36"
              />
            </div>
          </div>

          {/* BOQ Table */}
          {activeTab === 'boq' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Item', 'Description', 'Unit', 'Qty', `Rate (${settings.currency})`, `Total (${settings.currency})`, 'Status', ''].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {boqItems.filter(b => b.description.toLowerCase().includes(search.toLowerCase())).map(item => (
                    <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{item.id}</td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground max-w-[240px]">{item.description}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.unit}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{item.qty.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{fmtSAR(item.rate, settings.currency)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-foreground">{fmtSAR(item.total, settings.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusColors[item.status]}`}>
                          {item.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-primary hover:underline text-xs font-medium">Edit</button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-secondary/5 border-t-2 border-primary/20">
                    <td colSpan={5} className="px-4 py-3 text-xs font-bold text-foreground">TOTAL</td>
                    <td className="px-4 py-3 text-xs font-bold text-foreground">{fmtSAR(boqTotal)}</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Drawings Table */}
          {activeTab === 'drawings' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Drawing No.', 'Title', 'Discipline', 'Rev', 'Status', 'Date', 'Sheets', 'Actions'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {drawings.filter(d => d.title.toLowerCase().includes(search.toLowerCase())).map(d => (
                    <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-primary font-medium">{d.id}</td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground">{d.title}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{d.discipline}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono font-bold text-foreground">{d.rev}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusColors[d.status]}`}>
                          {d.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{d.date}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{d.sheets || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="text-muted-foreground hover:text-primary transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Submittals Table */}
          {activeTab === 'submittals' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Submittal No.', 'Description', 'Vendor', 'Status', 'Review Date', 'Comments', 'Action'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submittals.filter(s => s.description.toLowerCase().includes(search.toLowerCase())).map(s => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{s.id}</td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground">{s.description}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{s.vendor}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusColors[s.status]}`}>
                          {s.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{s.reviewDate}</td>
                      <td className="px-4 py-3">
                        {s.comments > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            {s.comments}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-xs text-primary hover:underline font-medium">
                          {s.status === 'approved' ? 'View' : 'Review'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Consultant Comments — Step 17 */}
          {activeTab === 'comments' && (
            <div className="divide-y divide-border">
              {[
                { id: 'CMT-001', ref: 'DWG-E-003', comment: 'Protection relay coordination study required before approval. Please provide calculation sheets.', from: 'Electricity & Cogeneration Authority (ECA)', status: 'open', date: 'Jun 20', priority: 'critical' },
                { id: 'CMT-002', ref: 'SUB-003',   comment: 'Transformer FAT protocol needs to include temperature rise test at 110% rated load. Revise Section 4.2.', from: 'Technical Consultant', status: 'open', date: 'Jul 2', priority: 'major' },
                { id: 'CMT-003', ref: 'DWG-E-001', comment: 'Cable schedule updated correctly. Approved with minor note: confirm tray sizes in Zone B cable routing.', from: 'Technical Consultant', status: 'resolved', date: 'May 28', priority: 'minor' },
                { id: 'CMT-004', ref: 'DWG-C-001', comment: 'Foundation reinforcement schedule accepted. Ensure galvanisation specification matches ASTM A123.', from: 'Civil Reviewer', status: 'resolved', date: 'May 10', priority: 'minor' },
                { id: 'CMT-005', ref: 'BOQ-003',   comment: 'Transformer cost rate is 8% above approved benchmark. Submit revised quotation comparison before BOQ approval.', from: 'Commercial Reviewer', status: 'open', date: 'Jul 5', priority: 'major' },
              ].map(c => {
                const priorityColor: Record<string, string> = {
                  critical: 'text-red-400 bg-red-950/20 border-red-800/30',
                  major:    'text-amber-400 bg-accent border-amber-500/20',
                  minor:    'text-primary bg-secondary/60 border-primary/20',
                }
                return (
                  <div key={c.id} className={`flex items-start gap-4 px-5 py-5 hover:bg-muted/20 transition-colors ${c.status === 'resolved' ? 'opacity-60' : ''}`}>
                    <div className="flex-shrink-0 w-16 text-center">
                      <p className="text-[10px] font-mono text-muted-foreground">{c.id}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-1 inline-block ${priorityColor[c.priority]}`}>{c.priority}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono text-primary font-semibold">{c.ref}</span>
                        <span className="text-[10px] text-muted-foreground">{c.date}</span>
                        <span className="text-[10px] text-muted-foreground">by {c.from}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{c.comment}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${c.status === 'resolved' ? 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30' : 'text-amber-400 bg-accent border-amber-500/20'}`}>
                        {c.status}
                      </span>
                      {c.status === 'open' && (
                        <button className="text-xs text-primary hover:underline font-medium">Respond</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
