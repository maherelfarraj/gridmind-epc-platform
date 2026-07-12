'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { PhaseBanner } from '@/components/shared/phase-banner'
import { StatusBadge } from '@/components/shared/status-badge'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Truck,
  X,
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

// Steps 24-26 = Issue PO → Shipping → Site Inspection
// PO values scaled to NEOM Solar Farm Package 4 (SAR 1.24B EPC contract)
const purchaseOrders = [
  { id: 'PO-2024-101', vendor: 'JA Solar Technology', item: 'Solar PV Modules — 600Wp Bifacial', qty: '160,000 pcs', value: 184000000, status: 'delivered', issueDate: 'May 15', deliveryDate: 'Jul 2', progress: 100, step: 26 },
  { id: 'PO-2024-102', vendor: 'Sungrow Power', item: 'String Inverters 100kW', qty: '1,600 pcs', value: 48200000, status: 'in-transit', issueDate: 'May 22', deliveryDate: 'Jul 20', progress: 80, step: 25 },
  { id: 'PO-2024-103', vendor: 'ABB Ltd.', item: 'HV Power Transformer 100MVA', qty: '4 pcs', value: 86400000, status: 'manufacturing', issueDate: 'Jun 1', deliveryDate: 'Aug 30', progress: 45, step: 25 },
  { id: 'PO-2024-104', vendor: 'Nexans Middle East', item: 'MV Cable 33kV XLPE', qty: '84,000 m', value: 122400000, status: 'approved', issueDate: 'Jun 15', deliveryDate: 'Sep 10', progress: 15, step: 24 },
  { id: 'PO-2024-105', vendor: 'Schneider Electric', item: 'SCADA & Energy Management System', qty: '1 lot', value: 28600000, status: 'pending', issueDate: '—', deliveryDate: '—', progress: 0, step: 23 },
  { id: 'PO-2024-106', vendor: 'Al-Arrab Steel', item: 'Galvanised Steel Structure — All Zones', qty: '18,400 ton', value: 96800000, status: 'delivered', issueDate: 'Apr 10', deliveryDate: 'Jun 25', progress: 100, step: 27 },
]

const vendorComparisons = [
  {
    item: 'HV Transformer 4MVA',
    vendors: [
      { name: 'ABB Ltd.', price: 1360000, delivery: '12 weeks', compliance: 'Full', recommended: true },
      { name: 'Siemens', price: 1480000, delivery: '14 weeks', compliance: 'Full', recommended: false },
      { name: 'GE Grid', price: 1290000, delivery: '18 weeks', compliance: 'Partial', recommended: false },
    ],
  },
]

const deliveryTimeline = [
  { month: 'May', planned: 2, delivered: 2 },
  { month: 'Jun', planned: 3, delivered: 3 },
  { month: 'Jul', planned: 4, delivered: 2 },
  { month: 'Aug', planned: 2, delivered: 0 },
  { month: 'Sep', planned: 3, delivered: 0 },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  delivered: { label: 'Delivered', color: 'text-emerald-400', bg: 'bg-emerald-950/20', border: 'border-emerald-800/30' },
  'in-transit': { label: 'In Transit', color: 'text-primary', bg: 'bg-secondary/60', border: 'border-primary/20' },
  manufacturing: { label: 'Manufacturing', color: 'text-amber-400', bg: 'bg-accent', border: 'border-amber-500/20' },
  approved: { label: 'PO Approved', color: 'text-primary', bg: 'bg-accent', border: 'border-primary/30' },
  pending: { label: 'Pending', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-950/20', border: 'border-red-800/30' },
}

export default function ProcurementPage() {
  const { createApproval, pushActivity, settings } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'prequalification' | 'pos' | 'vendors' | 'delivery'>('prequalification')
  const [search, setSearch] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const approveVendorSelection = () => {
    createApproval({
      title: 'PO Issue — HV Transformer 4MVA (ABB Ltd.)',
      description: 'Vendor selection approved for ABB Ltd. (SAR 1.36M). Purchase order requires committee sign-off before issue.',
      project: 'NEOM Solar Farm — Package 4',
      projectId: 'NEOM-SOL-004',
      type: 'Procurement',
      stage: 'Procurement & Supply Chain — Step 24: Issue PO',
      stageNum: 4,
      submittedBy: 'Walid Al-Saud',
      priority: 'high',
    })
    pushActivity({ actor: 'You', action: 'approved vendor selection for', target: 'HV Transformer 4MVA (ABB Ltd.)', tone: 'success' })
    showToast('Vendor selection approved — PO submitted for committee approval.')
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const totalPOValue = purchaseOrders.reduce((s, p) => s + p.value, 0)
  const deliveredValue = purchaseOrders.filter(p => p.status === 'delivered').reduce((s, p) => s + p.value, 0)
  const inProgressPOs = purchaseOrders.filter(p => !['delivered', 'pending'].includes(p.status)).length

  function fmtSAR(n: number, currency = 'SAR'): string {
    const ccy = currency || 'SAR'
    if (n >= 1_000_000_000) return `${ccy} ${(n / 1_000_000_000).toFixed(2)}B`
    if (n >= 1_000_000) return `${ccy} ${Math.round(n / 1_000_000)}M`
    return `${ccy} ${(n / 1000).toFixed(0)}K`
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px]">
        {/* Toast */}
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
            <h1 className="text-2xl font-bold text-foreground">Procurement & Supply Chain</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Phase 4 · Steps 21–27 — Vendor RFQ, quotations, committee approval (Step 23), PO issue, shipping, site inspection, and material classification</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 border border-border text-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => showToast('New Purchase Order form opened')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Issue PO
            </button>
          </div>
        </div>

        <PhaseBanner phase={4} phaseName="Procurement & Supply Chain" steps="21–27" activeStep={25} activeStepLabel="Shipping & Material Delivery" status="on-track" />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          <KPICard title="Total PO Value" value={fmtSAR(totalPOValue, settings.currency)} subtitle={`${purchaseOrders.length} purchase orders`} icon={ShoppingCart} accent="gold" />
          <KPICard title="Delivered" value={`${Math.round((deliveredValue / totalPOValue) * 100)}%`} subtitle="By value" icon={CheckCircle} accent="green" />
          <KPICard title="In Progress" value={inProgressPOs.toString()} subtitle="POs active" icon={Truck} accent="indigo" />
          <KPICard title="Overdue Items" value="1" subtitle="Delivery delayed" icon={AlertTriangle} accent="red" />
          <KPICard title="Pending POs" value="2" subtitle="Awaiting issue" icon={Clock} accent="orange" />
        </div>

        {/* Spend breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Delivery Timeline — Planned vs Actual</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deliveryTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="planned" name="Planned" fill="#1E2230" radius={[4, 4, 0, 0]} opacity={0.4} />
                <Bar dataKey="delivered" name="Delivered" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* PO Status breakdown */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">PO Status Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(
                purchaseOrders.reduce((acc, po) => {
                  acc[po.status] = (acc[po.status] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([status, count]) => {
                const cfg = statusConfig[status]
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border} w-28 text-center flex-shrink-0`}>
                      {cfg.label}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${(count / purchaseOrders.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-5 text-right">{count}</span>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total PO Value</span>
                <span className="font-bold text-foreground">{fmtSAR(totalPOValue, settings.currency)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">Delivered Value</span>
                <span className="font-bold text-emerald-400">{fmtSAR(deliveredValue, settings.currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-0">
            <div className="flex">
              {(['prequalification', 'pos', 'vendors', 'delivery'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'prequalification' ? 'Vendor Prequalification' : tab === 'pos' ? 'Purchase Orders' : tab === 'vendors' ? 'Vendor Comparison' : 'Delivery Tracker'}
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

          {activeTab === 'prequalification' && (
            <div className="p-5 space-y-6">
              {/* Step reference strip */}
              <div className="flex items-center gap-3 bg-secondary/60 border border-primary/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <span className="font-mono font-bold bg-primary text-white px-2 py-0.5 rounded">Step 21</span>
                  <span>Vendor RFQ & Prequalification</span>
                </div>
                <div className="w-px h-4 bg-primary/20" />
                <div className="flex items-center gap-2 text-xs text-primary">
                  <span className="font-mono font-bold bg-primary/20 text-primary px-2 py-0.5 rounded">Step 22</span>
                  <span>Quotation Comparison & Evaluation</span>
                </div>
                <div className="w-px h-4 bg-primary/20" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono bg-muted px-2 py-0.5 rounded">Step 23</span>
                  <span>Committee Approval (next gate)</span>
                </div>
              </div>

              {/* Vendor register */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Vendor Prequalification Register</h3>
                  <button
                    onClick={() => showToast('New vendor prequalification form opened')}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Vendor
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {['Vendor', 'Category', 'Financial', 'Technical', 'HSE', 'References', 'Local Content', 'Total Score', 'Status', 'RFQ Sent'].map(h => (
                          <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        { vendor: 'JA Solar Technology',  category: 'PV Modules',       financial: 95, technical: 98, hse: 92, refs: 90, localContent: 18, status: 'approved',  rfqSent: 'May 10' },
                        { vendor: 'Sungrow Power',         category: 'Inverters',        financial: 90, technical: 95, hse: 94, refs: 88, localContent: 22, status: 'approved',  rfqSent: 'May 10' },
                        { vendor: 'ABB Ltd.',              category: 'Transformers',     financial: 98, technical: 96, hse: 97, refs: 95, localContent: 35, status: 'approved',  rfqSent: 'May 22' },
                        { vendor: 'Siemens',               category: 'Transformers',     financial: 97, technical: 94, hse: 96, refs: 93, localContent: 30, status: 'approved',  rfqSent: 'May 22' },
                        { vendor: 'Nexans Middle East',    category: 'MV Cable',         financial: 85, technical: 90, hse: 88, refs: 82, localContent: 68, status: 'approved',  rfqSent: 'Jun 2'  },
                        { vendor: 'Saudi Cable Co.',       category: 'MV Cable',         financial: 78, technical: 82, hse: 85, refs: 75, localContent: 100, status: 'conditional', rfqSent: 'Jun 2' },
                        { vendor: 'Al-Zamil Steel',        category: 'Steel Structure',  financial: 72, technical: 74, hse: 68, refs: 70, localContent: 100, status: 'rejected', rfqSent: '—'     },
                        { vendor: 'Schneider Electric',    category: 'SCADA',            financial: 93, technical: 97, hse: 95, refs: 91, localContent: 20, status: 'approved',  rfqSent: 'Jun 10' },
                      ].map(v => {
                        const total = Math.round((v.financial + v.technical + v.hse + v.refs + (v.localContent > 50 ? 95 : 70)) / 5)
                        const statusCfg: Record<string, string> = {
                          approved:    'text-emerald-400 bg-emerald-950/20 border-emerald-800/30',
                          conditional: 'text-amber-400 bg-accent border-amber-500/20',
                          rejected:    'text-red-400 bg-red-950/20 border-red-800/30',
                        }
                        return (
                          <tr key={v.vendor} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 text-xs font-semibold text-foreground">{v.vendor}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{v.category}</td>
                            {[v.financial, v.technical, v.hse, v.refs].map((score, i) => (
                              <td key={i} className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-12 bg-muted rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-primary' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
                                  </div>
                                  <span className={`text-[10px] font-semibold ${score >= 90 ? 'text-emerald-400' : score >= 75 ? 'text-amber-400' : 'text-red-600'}`}>{score}</span>
                                </div>
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${v.localContent >= 50 ? 'text-emerald-400 bg-emerald-950/20' : 'text-muted-foreground bg-muted'}`}>
                                {v.localContent}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-bold ${total >= 90 ? 'text-emerald-400' : total >= 75 ? 'text-amber-400' : 'text-red-600'}`}>{total}</span>
                              <span className="text-[10px] text-muted-foreground">/100</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusCfg[v.status]}`}>{v.status}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{v.rfqSent}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Scoring legend */}
              <div className="flex items-center gap-6 text-[10px] text-muted-foreground px-1">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />90–100: Approved</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />75–89: Conditional</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Below 75: Rejected</span>
                <span className="ml-auto">Criteria: Financial capacity 20% · Technical competence 30% · HSE record 20% · References 20% · Local content 10%</span>
              </div>
            </div>
          )}

          {activeTab === 'pos' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['PO Number', 'Vendor', 'Item', 'Qty', `Value (${settings.currency})`, 'Issue Date', 'Delivery Date', 'Progress', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchaseOrders.filter(p =>
                    p.item.toLowerCase().includes(search.toLowerCase()) ||
                    p.vendor.toLowerCase().includes(search.toLowerCase())
                  ).map(po => {
                    const cfg = statusConfig[po.status]
                    return (
                      <tr key={po.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-primary font-medium">{po.id}</td>
                        <td className="px-4 py-3 text-xs font-medium text-foreground">{po.vendor}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{po.item}</td>
                        <td className="px-4 py-3 text-xs text-foreground">{po.qty}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-foreground">{fmtSAR(po.value, settings.currency)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{po.issueDate}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{po.deliveryDate}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${po.progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                                style={{ width: `${po.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{po.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => showToast(`Viewing PO details for ${po.id}`)}
                            className="text-xs text-primary hover:underline font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'vendors' && (
            <div className="p-5 space-y-6">
              {vendorComparisons.map(comp => (
                <div key={comp.item}>
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-4 h-4 text-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Vendor Comparison: {comp.item}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          {['Vendor', `Price (${settings.currency})`, 'Delivery Lead Time', 'Technical Compliance', 'Recommendation'].map(h => (
                            <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {comp.vendors.map(v => (
                          <tr key={v.name} className={`transition-colors ${v.recommended ? 'bg-emerald-950/20/50' : 'hover:bg-muted/20'}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{v.name}</span>
                                {v.recommended && (
                                  <span className="text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-full">Recommended</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-foreground">{v.price.toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs text-foreground">{v.delivery}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium ${v.compliance === 'Full' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {v.compliance}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {v.recommended ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={approveVendorSelection}
                      className="bg-secondary hover:bg-secondary/80 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      Approve Selected Vendor
                    </button>
                    <button className="border border-border text-foreground text-xs font-medium px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                      Export Comparison
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="divide-y divide-border">
              {purchaseOrders.map(po => {
                const cfg = statusConfig[po.status]
                return (
                  <div key={po.id} className="flex items-center gap-4 px-5 py-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      {po.progress === 100 ? (
                        <CheckCircle className={`w-5 h-5 ${cfg.color}`} />
                      ) : po.status === 'in-transit' ? (
                        <Truck className={`w-5 h-5 ${cfg.color}`} />
                      ) : (
                        <Package className={`w-5 h-5 ${cfg.color}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{po.item}</p>
                      <p className="text-xs text-muted-foreground">{po.vendor} · {po.id}</p>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-muted-foreground flex-shrink-0">
                      <div className="text-right">
                        <p className="text-muted-foreground">Issued</p>
                        <p className="font-medium text-foreground">{po.issueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Expected</p>
                        <p className="font-medium text-foreground">{po.deliveryDate}</p>
                      </div>
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${po.progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${po.progress}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-medium text-foreground">{po.progress}%</span>
                      </div>
                      <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                        {cfg.label}
                      </span>
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
