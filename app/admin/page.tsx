'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Check,
  CheckCircle,
  Clock,
  Globe,
  HardDrive,
  Lock,
  LogIn,
  Plus,
  Server,
  Shield,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo, useState } from 'react'

// Single source of truth for plan pricing (SAR / year).
// Changing a value here updates every derived metric automatically.
const PLAN_PRICING: Record<string, number> = {
  Enterprise:   180_000,
  Professional:  72_000,
  Starter:       24_000,
  Trial:              0,
}

// Revenue is stored as annualRevenueSAR (number) — derived from PLAN_PRICING at definition time.
// Monthly (MRR) = annualRevenueSAR / 12, computed in the KPI block below.
const tenants = [
  { id: '1', name: 'GSI Holding Company',   plan: 'Enterprise',   users: 42, projects: 18, storage: '84%', status: 'active',  annualRevenueSAR: PLAN_PRICING['Enterprise'],   created: 'Jan 2023' },
  { id: '2', name: 'AlMansoori EPC Group',  plan: 'Professional', users: 18, projects: 9,  storage: '61%', status: 'active',  annualRevenueSAR: PLAN_PRICING['Professional'], created: 'Mar 2023' },
  { id: '3', name: 'Riyadh Solar Ventures', plan: 'Professional', users: 12, projects: 5,  storage: '45%', status: 'active',  annualRevenueSAR: PLAN_PRICING['Professional'], created: 'Jun 2023' },
  { id: '4', name: 'Gulf Construction Co.', plan: 'Starter',      users: 6,  projects: 3,  storage: '28%', status: 'on-hold', annualRevenueSAR: PLAN_PRICING['Starter'],      created: 'Aug 2023' },
  { id: '5', name: 'ACWA Power Projects',   plan: 'Enterprise',   users: 55, projects: 24, storage: '91%', status: 'active',  annualRevenueSAR: PLAN_PRICING['Enterprise'],   created: 'Oct 2022' },
  { id: '6', name: 'Tabuk Energy Partners', plan: 'Starter',      users: 4,  projects: 2,  storage: '12%', status: 'trial',   annualRevenueSAR: PLAN_PRICING['Trial'],        created: 'Jul 2024' },
]

const usageData = [
  { month: 'Jan', logins: 1240, api: 45 },
  { month: 'Feb', logins: 1580, api: 62 },
  { month: 'Mar', logins: 2100, api: 88 },
  { month: 'Apr', logins: 1890, api: 75 },
  { month: 'May', logins: 2450, api: 102 },
  { month: 'Jun', logins: 2880, api: 118 },
]

const systemStatus = [
  { name: 'API Gateway',        status: 'Operational', latency: '42ms',  uptime: '99.97%', color: 'bg-green-500' },
  { name: 'Database Cluster',   status: 'Operational', latency: '8ms',   uptime: '99.99%', color: 'bg-green-500' },
  { name: 'Document Storage',   status: 'Operational', latency: '120ms', uptime: '99.95%', color: 'bg-green-500' },
  { name: 'SCADA Integration',  status: 'Degraded',    latency: '380ms', uptime: '98.20%', color: 'bg-amber-500' },
  { name: 'Email Service',      status: 'Operational', latency: '65ms',  uptime: '99.90%', color: 'bg-green-500' },
  { name: 'AI Inference',       status: 'Operational', latency: '210ms', uptime: '99.82%', color: 'bg-green-500' },
]

const auditLog = [
  { id: 'AUD-001', action: 'Tenant Created',       actor: 'Super Admin',      target: 'Tabuk Energy Partners', timestamp: '2024-07-09 14:22:10', severity: 'info' },
  { id: 'AUD-002', action: 'Plan Upgraded',        actor: 'Super Admin',      target: 'Riyadh Solar → Professional', timestamp: '2024-07-08 11:05:34', severity: 'info' },
  { id: 'AUD-003', action: 'User Suspended',       actor: 'Super Admin',      target: 'Gulf Construction Co. — user #14', timestamp: '2024-07-07 09:18:22', severity: 'warning' },
  { id: 'AUD-004', action: 'Data Export Triggered',actor: 'AlMansoori Admin', target: 'All Projects (CSV)',     timestamp: '2024-07-06 16:44:01', severity: 'warning' },
  { id: 'AUD-005', action: 'SCADA Integration Down',actor: 'System',          target: 'NEOM Solar Farm feed',   timestamp: '2024-07-05 07:11:55', severity: 'critical' },
  { id: 'AUD-006', action: 'Login — New Device',   actor: 'Ahmed Al-Rashidi', target: 'iOS Safari / Riyadh',    timestamp: '2024-07-05 06:58:30', severity: 'info' },
  { id: 'AUD-007', action: 'Approval Override',    actor: 'Super Admin',      target: 'INV-2024-011 Force Approve', timestamp: '2024-07-04 14:30:00', severity: 'warning' },
  { id: 'AUD-008', action: 'Storage Threshold Hit',actor: 'System',           target: 'ACWA Power Projects — 91%', timestamp: '2024-07-03 12:00:00', severity: 'warning' },
]

const planColors: Record<string, string> = {
  Enterprise:   'bg-secondary text-foreground',
  Professional: 'bg-primary text-white',
  Starter:      'bg-muted text-muted-foreground',
}

const statusDot: Record<string, string> = {
  active:   'bg-green-500',
  'on-hold': 'bg-amber-500',
  trial:    'bg-primary',
  inactive: 'bg-muted-foreground',
}

const auditColors: Record<string, string> = {
  info:     'text-primary bg-secondary/60 border-primary/20',
  warning:  'text-amber-400 bg-accent border-amber-500/20',
  critical: 'text-red-400 bg-red-950/20 border-red-800/30',
}

type Tenant = (typeof tenants)[0]

export default function AdminPage() {
  const { projects, activity, pendingApprovalCount, settings } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'tenants' | 'usage' | 'audit' | 'system'>('tenants')
  const [showAddTenant, setShowAddTenant] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [tenantSearch, setTenantSearch] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  // Live platform-wide project total (owner tenant "GSI Holding" reflects the live workspace)
  const totalProjects = useMemo(
    () => tenants.reduce((sum, t) => sum + (t.id === '1' ? projects.length : t.projects), 0),
    [projects],
  )

  // Merge live workspace activity into the platform audit log
  const combinedAudit = useMemo(() => {
    const toneToSeverity: Record<string, string> = { default: 'info', success: 'info', warning: 'warning', danger: 'critical' }
    const liveRows = activity.slice(0, 6).map((a) => ({
      id: `LIVE-${a.id}`,
      action: `${a.action.charAt(0).toUpperCase()}${a.action.slice(1)}`,
      actor: a.actor,
      target: a.target,
      timestamp: a.time,
      severity: toneToSeverity[a.tone] ?? 'info',
    }))
    return [...liveRows, ...auditLog]
  }, [activity])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(tenantSearch.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px]">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-secondary text-foreground text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-auto text-foreground/50 hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Add Tenant Drawer */}
        {showAddTenant && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={() => setShowAddTenant(false)} />
            <div className="w-full max-w-md bg-card border-l border-border flex flex-col h-full overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h2 className="text-base font-bold text-foreground">Add New Tenant</h2>
                <button onClick={() => setShowAddTenant(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5 flex-1">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Company Name</label>
                  <input className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring/20" placeholder="e.g. Saudi Energy Holdings" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Admin Email</label>
                  <input type="email" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring/20" placeholder="admin@company.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Subscription Plan</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring/20">
                    <option>{`Starter — ${settings.currency} 24K/yr`}</option>
                    <option>{`Professional — ${settings.currency} 72K/yr`}</option>
                    <option>{`Enterprise — ${settings.currency} 180K/yr`}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Max Users</label>
                  <input type="number" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring/20" placeholder="10" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Enabled Modules</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Engineering','Procurement','Construction','HSE','Finance','QA/QC','Testing','SCADA','Solar Analytics','Documents'].map(m => (
                      <label key={m} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded" />
                        {m}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">Notes</label>
                  <textarea rows={3} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring/20 resize-none" placeholder="Onboarding notes..." />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border flex gap-3">
                <button
                  onClick={() => { setShowAddTenant(false); showToast('Tenant created — welcome email sent') }}
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Create Tenant
                </button>
                <button onClick={() => setShowAddTenant(false)} className="border border-border text-foreground text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-muted transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-bold text-foreground">Platform Super Admin</h1>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">GrindMindEPC Multi-Tenant Control Center</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-950/20 text-emerald-400 border border-emerald-800/30 rounded-lg px-3 py-1.5 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Platform Healthy
            </div>
            <button
              onClick={() => setShowAddTenant(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Tenant
            </button>
          </div>
        </div>

        {/* KPIs — derived from tenants array */}
        {(() => {
          const activeTenants     = tenants.filter(t => t.status === 'active').length
          const enterpriseTenants = tenants.filter(t => t.plan === 'Enterprise').length
          const totalUsers        = tenants.reduce((s, t) => s + t.users, 0)
          // MRR = sum of (annualRevenueSAR / 12) — pure arithmetic, no string parsing
          const mrrSAR  = tenants.reduce((s, t) => s + t.annualRevenueSAR / 12, 0)
          const ccy = settings.currency
          const mrrLabel = mrrSAR >= 1_000_000
            ? `${ccy} ${(mrrSAR / 1_000_000).toFixed(1)}M`
            : `${ccy} ${Math.round(mrrSAR / 1_000)}K`
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <KPICard title="Total Tenants"  value={tenants.length.toString()}  subtitle={`${enterpriseTenants} enterprise`}    icon={Building2}  accent="navy"   trend={{ value: 25, label: 'MoM' }} />
              <KPICard title="Active Users"   value={totalUsers.toString()}        subtitle="Across all tenants"                  icon={Users}      accent="indigo" trend={{ value: 18, label: 'MoM' }} />
              <KPICard title="Total Projects" value={totalProjects.toString()}     subtitle={`${pendingApprovalCount} approvals pending`} icon={Globe} accent="orange" />
              <KPICard title="MRR"            value={mrrLabel}                     subtitle="Monthly recurring"                   icon={TrendingUp} accent="gold"   trend={{ value: 14, label: 'MoM' }} />
              <KPICard title="Active Tenants" value={activeTenants.toString()}     subtitle={`${tenants.length - activeTenants} on-hold`} icon={Zap} accent="navy" />
              <KPICard title="Storage Used"   value="2.4 TB"                       subtitle="of 10 TB capacity"                  icon={Server}     accent="green" />
            </div>
          )
        })()}

        {/* Main tabbed panel */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-0">
            <div className="flex">
              {([
                { id: 'tenants', label: 'Tenant Workspaces' },
                { id: 'system',  label: 'System Status' },
                { id: 'usage',   label: 'Usage & Analytics' },
                { id: 'audit',   label: 'Audit Log' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab === 'tenants' && (
              <input
                value={tenantSearch}
                onChange={e => setTenantSearch(e.target.value)}
                className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background text-foreground placeholder:text-muted-foreground outline-none w-44"
                placeholder="Search tenants..."
              />
            )}
          </div>

          {/* Tenants tab */}
          {activeTab === 'tenants' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Tenant', 'Plan', 'Users', 'Projects', 'Storage', 'Revenue', 'Created', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {t.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground text-xs truncate max-w-[160px]">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${planColors[t.plan]}`}>{t.plan}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground">{t.users}</td>
                      <td className="px-4 py-3 text-xs text-foreground">{t.projects}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${parseInt(t.storage) > 85 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: t.storage }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{t.storage}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-foreground">
                        {t.annualRevenueSAR > 0
                          ? `${settings.currency} ${(t.annualRevenueSAR / 1_000).toFixed(0)}K/yr`
                          : <span className="text-muted-foreground italic">Trial</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{t.created}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[t.status]}`} />
                          <span className="text-xs capitalize text-foreground">{t.status.replace('-', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedTenant(t)} className="text-[10px] text-primary hover:underline font-medium">View</button>
                          <span className="text-muted-foreground/50">·</span>
                          <button onClick={() => showToast(`Impersonating ${t.name}`)} className="text-[10px] text-primary hover:underline font-medium flex items-center gap-0.5">
                            <LogIn className="w-3 h-3" />Login As
                          </button>
                          <span className="text-muted-foreground/50">·</span>
                          <button onClick={() => setSelectedTenant(t)} className="text-[10px] text-muted-foreground hover:text-foreground font-medium">Manage</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* System Status tab */}
          {activeTab === 'system' && (
            <div className="divide-y divide-border">
              {/* Degraded banner */}
              <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border-b border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs font-medium text-amber-700">1 service is degraded — SCADA Integration latency elevated. Investigation in progress.</p>
                <button onClick={() => showToast('Incident ticket INC-0042 opened')} className="ml-auto text-xs font-semibold text-amber-700 border border-amber-300 px-3 py-1 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap">
                  Open Incident
                </button>
              </div>
              {systemStatus.map((s) => (
                <div key={s.name} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color} ${s.status === 'Degraded' ? 'animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Latency: {s.latency} &nbsp;&middot;&nbsp; Uptime: {s.uptime}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.status === 'Operational' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-800/30' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {s.status}
                  </span>
                  <button onClick={() => showToast(`Viewing metrics for ${s.name}`)} className="text-xs text-primary hover:underline font-medium">
                    Metrics
                  </button>
                </div>
              ))}
              <div className="px-5 py-4 bg-muted/20 grid grid-cols-3 gap-4">
                {[
                  { icon: Lock,         title: 'Security Events', value: '0',    sub: 'No threats in 30 days', color: 'text-emerald-400' },
                  { icon: CheckCircle,  title: 'Compliance Score', value: '96%', sub: 'ISO 27001 aligned',     color: 'text-primary' },
                  { icon: Clock,        title: 'Avg Response',    value: '142ms', sub: 'Platform-wide',        color: 'text-amber-400' },
                ].map(item => (
                  <div key={item.title} className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                    <div>
                      <p className="text-[10px] text-muted-foreground">{item.title}</p>
                      <p className="text-lg font-bold text-foreground">{item.value}</p>
                      <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage & Analytics tab */}
          {activeTab === 'usage' && (
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Platform Usage — Monthly Logins &amp; API Calls</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={usageData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid rgba(232,228,220,0.12)' }} />
                  <Bar yAxisId="left"  dataKey="logins" fill="#1E2230" radius={[4, 4, 0, 0]} name="Logins" />
                  <Bar yAxisId="right" dataKey="api"    fill="#8B6F3A" radius={[4, 4, 0, 0]} name="API (K)" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                {[
                  { label: 'Peak Day Logins', value: '342', sub: 'Jun 15' },
                  { label: 'Avg Session Time', value: '28 min', sub: 'Platform-wide' },
                  { label: 'Mobile Users', value: '34%', sub: 'of total sessions' },
                  { label: 'API Error Rate', value: '0.08%', sub: 'Last 30 days' },
                ].map(stat => (
                  <div key={stat.label} className="bg-muted/30 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log tab */}
          {activeTab === 'audit' && (
            <div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
                <p className="text-xs text-muted-foreground">{combinedAudit.length} events — last 7 days</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => showToast('Audit log exported as CSV')} className="text-xs text-primary hover:underline font-medium">Export CSV</button>
                </div>
              </div>
              <div className="divide-y divide-border">
                {combinedAudit.map(log => (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize flex-shrink-0 mt-0.5 ${auditColors[log.severity]}`}>
                      {log.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-foreground">{log.action}</p>
                        <span className="text-[10px] text-muted-foreground">by {log.actor}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.target}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tenant Detail Drawer */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelectedTenant(null)} />
          <div className="w-full max-w-md bg-card border-l border-border flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {selectedTenant.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">{selectedTenant.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${planColors[selectedTenant.plan]}`}>{selectedTenant.plan}</span>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[selectedTenant.status]}`} />
                      <span className="text-[10px] text-muted-foreground capitalize">{selectedTenant.status.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 space-y-5">
              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Users',    value: selectedTenant.users },
                  { label: 'Projects', value: selectedTenant.projects },
                  { label: 'Revenue',  value: selectedTenant.annualRevenueSAR > 0 ? `SAR ${(selectedTenant.annualRevenueSAR / 1_000).toFixed(0)}K/yr` : 'Trial' },
                ].map(s => (
                  <div key={s.label} className="bg-muted/30 rounded-xl p-3 text-center">
                    <p className="text-base font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Storage bar */}
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-foreground">Storage Usage</p>
                  <span className={`text-xs font-bold ${parseInt(selectedTenant.storage) > 85 ? 'text-red-400' : 'text-foreground'}`}>{selectedTenant.storage}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${parseInt(selectedTenant.storage) > 85 ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: selectedTenant.storage }}
                  />
                </div>
              </div>

              {/* Tenant info */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
                  <p className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Tenant Details</p>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { label: 'Created', value: selectedTenant.created },
                    { label: 'Plan', value: selectedTenant.plan },
                    { label: 'Status', value: selectedTenant.status.replace('-', ' ') },
                    { label: 'Annual Revenue', value: selectedTenant.annualRevenueSAR > 0 ? `SAR ${(selectedTenant.annualRevenueSAR / 1_000).toFixed(0)}K` : 'Trial' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[10px] text-muted-foreground">{f.label}</span>
                      <span className="text-xs font-medium text-foreground capitalize">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin actions */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Admin Actions</p>
                <div className="space-y-2">
                  {[
                    { label: 'Impersonate Admin User', icon: Users },
                    { label: 'Change Subscription Plan', icon: TrendingUp },
                    { label: 'Manage Storage Quota', icon: HardDrive },
                    { label: 'View Full Audit Log', icon: Shield },
                    { label: 'Send Platform Notification', icon: Bell },
                  ].map(action => (
                    <button
                      key={action.label}
                      onClick={() => showToast(`${action.label} ��� ${selectedTenant.name}`)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-xs text-foreground font-medium transition-colors"
                    >
                      <action.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex gap-3">
              <button
                onClick={() => { showToast(`${selectedTenant.name} settings saved`); setSelectedTenant(null) }}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setSelectedTenant(null)}
                className="border border-border text-foreground text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
