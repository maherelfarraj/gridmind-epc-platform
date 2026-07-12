'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Crown,
  Edit2,
  Globe,
  HardDrive,
  Lock,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Zap,
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
import { useMemo, useState } from 'react'

interface Tenant {
  id: string
  name: string
  domain: string
  industry: string
  plan: 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'suspended' | 'trial' | 'expired'
  users: number
  maxUsers: number
  projects: number
  storage: number
  maxStorage: number
  admin: string
  country: string
  joinDate: string
  renewalDate: string
  mrr: number   // derived at render from PLAN_MRR[plan] — never stored as a literal
  modules: string[]
}

// Single source of truth for plan monthly pricing (USD/month).
// mrr is NEVER stored on the tenant — always derived at render time via PLAN_MRR[t.plan].
const PLAN_MRR: Record<Tenant['plan'], number> = {
  starter:      499,
  professional: 1599,
  enterprise:   4250,
}

const baseTenants: Omit<Tenant, 'mrr'>[] = [
  {
    id: 'T-001',
    name: 'GSI Holding Company',
    domain: 'gsi-holding.grindmindepc.com',
    industry: 'Solar EPC',
    plan: 'enterprise',
    status: 'active',
    users: 47,
    maxUsers: 100,
    projects: 12,
    storage: 68,
    maxStorage: 500,
    admin: 'Ahmed Al-Rashidi',
    country: 'Saudi Arabia',
    joinDate: 'Jan 1, 2024',
    renewalDate: 'Jan 1, 2025',
    modules: ['Engineering', 'Procurement', 'Construction', 'Finance', 'SCADA', 'QA/QC', 'Documents', 'Client Portal'],
  },
  {
    id: 'T-002',
    name: 'AlNafis Engineering Group',
    domain: 'alnafis.grindmindepc.com',
    industry: 'Power EPC',
    plan: 'professional',
    status: 'active',
    users: 22,
    maxUsers: 50,
    projects: 5,
    storage: 32,
    maxStorage: 200,
    admin: 'Saud Al-Nafis',
    country: 'UAE',
    joinDate: 'Mar 15, 2024',
    renewalDate: 'Mar 15, 2025',
    modules: ['Engineering', 'Procurement', 'Construction', 'Finance', 'Documents'],
  },
  {
    id: 'T-003',
    name: 'Horizon Solar Solutions',
    domain: 'horizon.grindmindepc.com',
    industry: 'Solar EPC',
    plan: 'starter',
    status: 'trial',
    users: 6,
    maxUsers: 15,
    projects: 2,
    storage: 4,
    maxStorage: 50,
    admin: 'Mohammed Darwish',
    country: 'Egypt',
    joinDate: 'Jul 1, 2024',
    renewalDate: 'Jul 31, 2024',
    modules: ['Engineering', 'Procurement', 'Documents'],
  },
  {
    id: 'T-004',
    name: 'Meridian Infrastructure Co.',
    domain: 'meridian.grindmindepc.com',
    industry: 'Industrial EPC',
    plan: 'professional',
    status: 'suspended',
    users: 18,
    maxUsers: 50,
    projects: 3,
    storage: 21,
    maxStorage: 200,
    admin: 'Rania Al-Khalidi',
    country: 'Kuwait',
    joinDate: 'Nov 10, 2023',
    renewalDate: 'Nov 10, 2024',
    modules: ['Engineering', 'Construction', 'Finance'],
  },
  {
    id: 'T-005',
    name: 'SunPath EPC & O&M',
    domain: 'sunpath.grindmindepc.com',
    industry: 'Solar EPC',
    plan: 'enterprise',
    status: 'active',
    users: 63,
    maxUsers: 100,
    projects: 8,
    storage: 142,
    maxStorage: 500,
    admin: 'Tariq Al-Mansour',
    country: 'Qatar',
    joinDate: 'Feb 1, 2024',
    renewalDate: 'Feb 1, 2025',
    modules: ['Engineering', 'Procurement', 'Construction', 'Finance', 'SCADA', 'QA/QC', 'Documents', 'Client Portal'],
  },
]

const plans = [
  {
    key: 'starter',
    name: 'Starter',
    price: 499,
    color: '#5A6278',
    icon: Zap,
    features: ['15 Users', '50 GB Storage', '5 Projects', 'Core Modules Only', 'Email Support'],
    modules: ['Engineering', 'Procurement', 'Documents'],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: 1599,
    color: '#C9A55A',
    icon: Star,
    features: ['50 Users', '200 GB Storage', '20 Projects', 'Advanced Modules', 'Priority Support', 'API Access'],
    modules: ['Engineering', 'Procurement', 'Construction', 'Finance', 'Documents', 'Client Portal'],
    popular: true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 4250,
    color: '#C9A55A',
    icon: Crown,
    features: ['Unlimited Users', '500 GB Storage', 'Unlimited Projects', 'All Modules + SCADA', 'Dedicated Support', 'Custom Integrations', 'SLA 99.9%'],
    modules: ['All Modules', 'SCADA', 'Solar Analytics', 'Custom Modules'],
  },
]

// Historical MRR growth — last point = sum of PLAN_MRR for all 5 paying tenants
// enterprise×2 (4250×2) + professional×2 (1599×2) + starter×1 (0 trial) = 8500+3198 = 11698 ≈ 11700
// Growth series reflects tenant onboarding history, not per-tenant rates
const CURRENT_MRR = PLAN_MRR.enterprise * 2 + PLAN_MRR.professional * 2  // trial tenant excluded
const mrrData = [
  { month: 'Feb', mrr: Math.round(CURRENT_MRR * 0.365) },
  { month: 'Mar', mrr: Math.round(CURRENT_MRR * 0.503) },
  { month: 'Apr', mrr: Math.round(CURRENT_MRR * 0.503) },
  { month: 'May', mrr: Math.round(CURRENT_MRR * 0.645) },
  { month: 'Jun', mrr: Math.round(CURRENT_MRR * 0.818) },
  { month: 'Jul', mrr: CURRENT_MRR },
]

const tenantsByPlan = [
  { name: 'Enterprise', value: 2, color: '#C9A55A' },
  { name: 'Professional', value: 2, color: '#C9A55A' },
  { name: 'Starter (Trial)', value: 1, color: '#5A6278' },
]

const moduleUsage = [
  { module: 'Engineering', tenants: 5 },
  { module: 'Documents', tenants: 5 },
  { module: 'Procurement', tenants: 4 },
  { module: 'Construction', tenants: 4 },
  { module: 'Finance', tenants: 4 },
  { module: 'Client Portal', tenants: 3 },
  { module: 'QA/QC', tenants: 2 },
  { module: 'SCADA', tenants: 2 },
]

const planColors: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  starter: { label: 'Starter', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', icon: '⬡' },
  professional: { label: 'Professional', color: 'text-primary', bg: 'bg-secondary/60', border: 'border-primary/20', icon: '★' },
  enterprise: { label: 'Enterprise', color: 'text-primary', bg: 'bg-accent', border: 'border-primary/30', icon: '♛' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-950/20', border: 'border-emerald-800/30' },
  suspended: { label: 'Suspended', color: 'text-red-400', bg: 'bg-red-950/20', border: 'border-red-800/30' },
  trial: { label: 'Trial', color: 'text-amber-400', bg: 'bg-accent', border: 'border-amber-500/20' },
  expired: { label: 'Expired', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
}

export default function TenantManagementPage() {
  const { projects, settings } = useWorkspace()
  // Derive mrr from PLAN_MRR (single source of truth) and sync T-001 project count from store
  const tenants = useMemo(
    () => baseTenants.map((t) => ({
      ...t,
      mrr: t.status === 'trial' ? 0 : PLAN_MRR[t.plan],
      projects: t.id === 'T-001' ? projects.length : t.projects,
    })),
    [projects],
  )
  const [activeTab, setActiveTab] = useState<'tenants' | 'plans' | 'usage' | 'billing'>('tenants')
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const filtered = tenants.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.domain.toLowerCase().includes(search.toLowerCase()) ||
      t.admin.toLowerCase().includes(search.toLowerCase())
    const matchPlan = planFilter === 'all' || t.plan === planFilter
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    return matchSearch && matchPlan && matchStatus
  })

  const totalMRR = tenants.filter(t => t.status === 'active').reduce((s, t) => s + t.mrr, 0)
  const activeTenants = tenants.filter(t => t.status === 'active').length
  const totalUsers = tenants.reduce((s, t) => s + t.users, 0)

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
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Tenant Management</h1>
            </div>
            <p className="text-muted-foreground text-sm">Platform administration — tenants, subscriptions, usage, and billing</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs bg-accent text-primary border border-primary/30 px-3 py-1.5 rounded-lg font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Platform Super Admin
            </div>
            <button
              onClick={() => showToast('New tenant onboarding wizard opened')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Tenant
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Tenants" value={tenants.length.toString()} subtitle={`${activeTenants} active`} icon={Building2} accent="navy" />
          <KPICard title="Monthly Revenue" value={`${settings.currency} ${(totalMRR / 1000).toFixed(1)}K`} subtitle="Active tenants MRR" icon={TrendingUp} accent="gold" trend={{ value: 18, label: 'vs last month' }} />
          <KPICard title="Total Users" value={totalUsers.toString()} subtitle="Across all tenants" icon={Users} accent="indigo" />
          <KPICard title="Enterprise Plans" value={tenants.filter(t => t.plan === 'enterprise').length.toString()} subtitle="Highest tier" icon={Crown} accent="orange" />
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center border-b border-border px-5 overflow-x-auto">
            {([
              { key: 'tenants', label: 'All Tenants' },
              { key: 'plans', label: 'Subscription Plans' },
              { key: 'usage', label: 'Platform Usage' },
              { key: 'billing', label: 'Billing Overview' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 w-full sm:w-72">
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search tenants, domains, admins..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
                  />
                </div>
                <select
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value)}
                  className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
                >
                  <option value="all">All Plans</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                </select>
                <span className="text-xs text-muted-foreground ml-auto hidden sm:block">{filtered.length} of {tenants.length} tenants</span>
              </div>

              {/* Tenant table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Tenant', 'Plan', 'Status', 'Users', 'Storage', 'Projects', 'MRR', 'Renewal', 'Actions'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map(tenant => {
                      const pc = planColors[tenant.plan]
                      const sc = statusConfig[tenant.status]
                      const storagePercent = Math.round((tenant.storage / tenant.maxStorage) * 100)
                      const userPercent = Math.round((tenant.users / tenant.maxUsers) * 100)

                      return (
                        <tr
                          key={tenant.id}
                          className={`hover:bg-muted/20 transition-colors cursor-pointer ${
                            tenant.status === 'suspended' ? 'opacity-70' : ''
                          }`}
                          onClick={() => setSelectedTenant(selectedTenant?.id === tenant.id ? null : tenant)}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                                tenant.plan === 'enterprise' ? 'bg-accent text-primary' :
                                tenant.plan === 'professional' ? 'bg-secondary/60 text-primary' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {tenant.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-semibold text-foreground truncate">{tenant.name}</p>
                                  {tenant.plan === 'enterprise' && <Crown className="w-3 h-3 text-primary flex-shrink-0" />}
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate">{tenant.domain}</p>
                                <p className="text-[10px] text-muted-foreground">{tenant.country} · {tenant.industry}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${pc.color} ${pc.bg} ${pc.border}`}>
                              {pc.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${sc.color} ${sc.bg} ${sc.border}`}>
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-xs font-medium text-foreground">{tenant.users}/{tenant.maxUsers}</p>
                              <div className="w-16 bg-muted rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${userPercent > 85 ? 'bg-red-500' : userPercent > 70 ? 'bg-primary' : 'bg-primary'}`}
                                  style={{ width: `${Math.min(userPercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-xs font-medium text-foreground">{tenant.storage}/{tenant.maxStorage} GB</p>
                              <div className="w-16 bg-muted rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${storagePercent > 80 ? 'bg-red-500' : storagePercent > 60 ? 'bg-primary' : 'bg-emerald-600'}`}
                                  style={{ width: `${Math.min(storagePercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs font-medium text-foreground">{tenant.projects}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs font-bold text-foreground">
                              {tenant.mrr > 0 ? `${settings.currency} ${tenant.mrr.toLocaleString()}` : <span className="text-muted-foreground font-normal">Trial</span>}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">{tenant.renewalDate}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={e => { e.stopPropagation(); showToast(`Opening settings for ${tenant.name}`) }}
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Settings className="w-3.5 h-3.5" />
                              </button>
                              {tenant.status === 'suspended' ? (
                                <button
                                  onClick={e => { e.stopPropagation(); showToast(`${tenant.name} reactivated`) }}
                                  className="text-green-500 hover:text-emerald-400 transition-colors"
                                  title="Reactivate"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={e => { e.stopPropagation(); showToast(`${tenant.name} suspension dialog opened`) }}
                                  className="text-muted-foreground hover:text-red-500 transition-colors"
                                  title="Suspend"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Expanded tenant detail */}
              {selectedTenant && (
                <div className="border-t border-border bg-muted/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">{selectedTenant.name} — Tenant Detail</h3>
                    <button onClick={() => setSelectedTenant(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Admin info */}
                    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Tenant Info</p>
                      {[
                        { label: 'Tenant ID', value: selectedTenant.id },
                        { label: 'Admin', value: selectedTenant.admin },
                        { label: 'Country', value: selectedTenant.country },
                        { label: 'Industry', value: selectedTenant.industry },
                        { label: 'Joined', value: selectedTenant.joinDate },
                        { label: 'Renewal', value: selectedTenant.renewalDate },
                      ].map(f => (
                        <div key={f.label} className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{f.label}</span>
                          <span className="text-xs font-medium text-foreground">{f.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Active modules */}
                    <div className="bg-card border border-border rounded-xl p-4">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Active Modules</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTenant.modules.map(mod => (
                          <span key={mod} className="flex items-center gap-1 text-[10px] bg-secondary/60 text-primary px-2 py-1 rounded-lg font-medium">
                            <Check className="w-2.5 h-2.5" />
                            {mod}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <button
                          onClick={() => showToast(`Module configuration opened for ${selectedTenant.name}`)}
                          className="w-full text-xs text-primary font-medium hover:underline text-center"
                        >
                          Configure Modules
                        </button>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="bg-card border border-border rounded-xl p-4">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Admin Actions</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Edit Tenant Settings', icon: Edit2 },
                          { label: 'Upgrade / Change Plan', icon: Crown },
                          { label: 'Impersonate Admin', icon: Users },
                          { label: 'View Audit Log', icon: Shield },
                          { label: 'Manage Storage', icon: HardDrive },
                          { label: 'Send Notification', icon: Globe },
                        ].map(action => (
                          <button
                            key={action.label}
                            onClick={() => showToast(`${action.label} — ${selectedTenant.name}`)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted text-xs text-foreground font-medium transition-colors"
                          >
                            <action.icon className="w-3.5 h-3.5 text-muted-foreground" />
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Subscription Plans</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Configure pricing, modules, and limits for each tier</p>
                </div>
                <button
                  onClick={() => showToast('Custom plan builder opened')}
                  className="flex items-center gap-2 border border-border text-foreground text-xs font-medium px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Plan
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(plan => {
                  const activeTenantCount = tenants.filter(t => t.plan === plan.key && t.status === 'active').length
                  return (
                    <div
                      key={plan.key}
                      className={`relative bg-card border-2 rounded-2xl overflow-hidden transition-all hover:shadow-lg ${
                        plan.popular ? 'border-primary shadow-md' : 'border-border'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                          MOST POPULAR
                        </div>
                      )}
                      <div className={`px-6 py-5 ${
                        plan.key === 'enterprise' ? 'bg-gradient-to-br from-[#FFF8E1] to-[#FFF3E0]' :
                        plan.key === 'professional' ? 'bg-gradient-to-br from-[#EEF0FB] to-[#E8F4FD]' :
                        'bg-muted/30'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: plan.color + '20' }}>
                            <plan.icon className="w-5 h-5" style={{ color: plan.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{plan.name}</p>
                            <p className="text-[10px] text-muted-foreground">{activeTenantCount} active tenant{activeTenantCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-foreground">{settings.currency} {plan.price.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                      </div>
                      <div className="px-6 py-5 space-y-3">
                        {plan.features.map(f => (
                          <div key={f} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: plan.color + '20' }}>
                              <Check className="w-2.5 h-2.5" style={{ color: plan.color }} />
                            </div>
                            <span className="text-xs text-foreground">{f}</span>
                          </div>
                        ))}
                        <div className="pt-3 border-t border-border">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Included Modules</p>
                          <div className="flex flex-wrap gap-1">
                            {plan.modules.map(mod => (
                              <span key={mod} className="text-[10px] bg-muted text-foreground px-1.5 py-0.5 rounded font-medium">{mod}</span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => showToast(`Editing ${plan.name} plan configuration`)}
                          className="w-full flex items-center justify-center gap-2 border border-border text-foreground text-xs font-medium py-2 rounded-lg hover:bg-muted transition-colors mt-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit Plan
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tenants by plan pie */}
                <div className="bg-muted/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Tenants by Plan</h3>
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie data={tenantsByPlan} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                          {tenantsByPlan.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {tenantsByPlan.map(p => (
                        <div key={p.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                          <span className="text-xs text-muted-foreground flex-1">{p.name}</span>
                          <span className="text-xs font-bold text-foreground">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Module adoption */}
                <div className="bg-muted/20 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Module Adoption (# Tenants)</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={moduleUsage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 5]} />
                      <YAxis type="category" dataKey="module" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Bar dataKey="tenants" name="Tenants" fill="#C9A55A" radius={[0, 4, 4, 0]}>
                        {moduleUsage.map((entry, index) => (
                          <Cell key={index} fill={entry.tenants >= 4 ? '#C9A55A' : entry.tenants >= 3 ? '#4A7FA5' : '#5A6278'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Per-tenant usage meters */}
              <div className="bg-muted/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Per-Tenant Resource Usage</h3>
                <div className="space-y-4">
                  {tenants.filter(t => t.status !== 'suspended').map(tenant => {
                    const userPct = Math.round((tenant.users / tenant.maxUsers) * 100)
                    const storagePct = Math.round((tenant.storage / tenant.maxStorage) * 100)
                    return (
                      <div key={tenant.id} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{tenant.name}</span>
                            {tenant.status === 'trial' && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent text-amber-400 border border-amber-500/20">Trial</span>
                            )}
                          </div>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${planColors[tenant.plan].color} ${planColors[tenant.plan].bg} ${planColors[tenant.plan].border}`}>
                            {planColors[tenant.plan].label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />Users</span>
                              <span className={`font-bold ${userPct > 85 ? 'text-red-600' : 'text-foreground'}`}>
                                {tenant.users}/{tenant.maxUsers} ({userPct}%)
                              </span>
                            </div>
                            <div className="bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${userPct > 85 ? 'bg-red-500' : userPct > 70 ? 'bg-primary' : 'bg-primary'}`}
                                style={{ width: `${Math.min(userPct, 100)}%` }}
                              />
                            </div>
                            {userPct > 85 && (
                              <p className="text-[9px] text-red-600 mt-0.5 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />Near limit
                              </p>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="text-muted-foreground flex items-center gap-1"><HardDrive className="w-3 h-3" />Storage</span>
                              <span className={`font-bold ${storagePct > 80 ? 'text-red-600' : 'text-foreground'}`}>
                                {tenant.storage}/{tenant.maxStorage} GB ({storagePct}%)
                              </span>
                            </div>
                            <div className="bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${storagePct > 80 ? 'bg-red-500' : storagePct > 60 ? 'bg-primary' : 'bg-emerald-600'}`}
                                style={{ width: `${Math.min(storagePct, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="p-5 space-y-6">
              {/* MRR trend chart */}
              <div className="bg-muted/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Monthly Recurring Revenue ({settings.currency})</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Platform MRR growth — active tenants only</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Current MRR</p>
                    <p className="text-lg font-bold text-primary">${totalMRR.toLocaleString()}</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={mrrData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${settings.currency} ${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${settings.currency} ${Number(v ?? 0).toLocaleString()}`]} />
                    <Bar dataKey="mrr" name="MRR" fill="#C9A55A" radius={[6, 6, 0, 0]}>
                      {mrrData.map((entry, index) => (
                        <Cell key={index} fill={index === mrrData.length - 1 ? '#C9A55A' : '#8B6F3A'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Billing table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Subscription Billing Register</h3>
                  <button
                    onClick={() => showToast('Billing export initiated')}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {['Tenant', 'Plan', `MRR (${settings.currency})`, 'Billing Cycle', 'Renewal Date', 'Payment Status', 'Action'].map(h => (
                          <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tenants.map(tenant => {
                        const pc = planColors[tenant.plan]
                        const isActive = tenant.status === 'active'
                        return (
                          <tr key={tenant.id} className={`hover:bg-muted/20 transition-colors ${tenant.status === 'suspended' ? 'opacity-60' : ''}`}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-xs font-semibold text-foreground">{tenant.name}</p>
                                <p className="text-[10px] text-muted-foreground">{tenant.country}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${pc.color} ${pc.bg} ${pc.border}`}>
                                {pc.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold text-foreground">
                                {tenant.mrr > 0 ? `${settings.currency} ${tenant.mrr.toLocaleString()}` : '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">Annual</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{tenant.renewalDate}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                tenant.status === 'active' ? 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30' :
                                tenant.status === 'trial' ? 'text-amber-400 bg-accent border-amber-500/20' :
                                'text-red-400 bg-red-950/20 border-red-800/30'
                              }`}>
                                {tenant.status === 'active' ? 'Paid' : tenant.status === 'trial' ? 'Trial' : 'Overdue'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => showToast(`Billing details for ${tenant.name}`)}
                                className="text-xs text-primary hover:underline font-medium"
                              >
                                {tenant.status === 'suspended' ? 'Reactivate' : 'View Invoice'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-muted/30">
                        <td colSpan={2} className="px-4 py-3 text-xs font-bold text-foreground">Total Active MRR</td>
                        <td className="px-4 py-3 text-sm font-black text-primary">${totalMRR.toLocaleString()}</td>
                        <td colSpan={4} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
