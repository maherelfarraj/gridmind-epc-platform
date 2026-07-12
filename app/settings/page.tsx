'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { useWorkspace } from '@/lib/workspace-store'
import {
  Bell,
  Building2,
  CheckCircle,
  ChevronRight,
  Globe,
  Key,
  Lock,
  Mail,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

type SettingsTab = 'profile' | 'system' | 'notifications' | 'security' | 'roles' | 'integrations'

const tabs: { key: SettingsTab; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'profile',       label: 'Profile',        icon: User,     description: 'Your personal details and preferences' },
  { key: 'system',        label: 'System Defaults', icon: Globe,    description: 'Currency, language, fiscal year settings' },
  { key: 'notifications', label: 'Notifications',   icon: Bell,     description: 'Alert preferences and delivery channels' },
  { key: 'security',      label: 'Security',        icon: Shield,   description: 'Password, 2FA, and session management' },
  { key: 'roles',         label: 'Roles & Access',  icon: Users,    description: 'User roles, permissions, and access levels' },
  { key: 'integrations',  label: 'Integrations',    icon: Zap,      description: 'Connected services and API tokens' },
]

export default function SettingsPage() {
  const { settings, updateSettings } = useWorkspace()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [toast, setToast] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')

  // Profile form state (local only — not yet persisted to store)
  const [profile, setProfile] = useState({
    firstName: 'Ahmed',
    lastName: 'Al-Rashidi',
    email: 'ahmed.alrashidi@gsi.com.sa',
    phone: '+966 55 123 4567',
    title: 'Project Manager',
    department: 'Engineering',
    language: 'en',
  })

  // System defaults: local draft so changes don't apply until Save is clicked
  const [systemDraft, setSystemDraft] = useState({
    defaultStage: '1',
    approvalTimeout: '72',
  })

  // Notifications state
  const [notifications, setNotifications] = useState({
    approvalRequests: true,
    approvalDecisions: true,
    stageChanges: true,
    documentUploads: false,
    hseIncidents: true,
    milestonesDue: true,
    paymentCertificates: true,
    emailDigest: 'daily',
    pushEnabled: true,
    smsEnabled: false,
  })

  // Security state
  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '8',
    loginAlerts: true,
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1200px]">
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-secondary text-foreground text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-foreground/50 hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your account, system defaults, notifications, and access controls</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <nav className="w-56 flex-shrink-0 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  activeTab === tab.key
                    ? 'bg-secondary text-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <tab.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === tab.key ? 'text-amber-400' : 'text-muted-foreground'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{tab.label}</p>
                </div>
                {activeTab === tab.key && <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-60" />}
              </button>
            ))}
          </nav>

          {/* Content panel */}
          <div className="flex-1 min-w-0">

            {/* ── Profile ── */}
            {activeTab === 'profile' && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-base font-semibold text-foreground">Profile Settings</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Update your personal information and display preferences</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      AR
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Ahmed Al-Rashidi</p>
                      <p className="text-xs text-muted-foreground">Project Manager · Engineering</p>
                      <button className="mt-1.5 text-xs text-primary font-semibold hover:underline">Change avatar</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingsField label="First Name">
                      <input className="settings-input" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
                    </SettingsField>
                    <SettingsField label="Last Name">
                      <input className="settings-input" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
                    </SettingsField>
                    <SettingsField label="Email Address">
                      <div className="flex items-center gap-2 settings-input bg-muted/50 cursor-not-allowed">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{profile.email}</span>
                      </div>
                    </SettingsField>
                    <SettingsField label="Phone Number">
                      <input className="settings-input" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                    </SettingsField>
                    <SettingsField label="Job Title">
                      <input className="settings-input" value={profile.title} onChange={e => setProfile(p => ({ ...p, title: e.target.value }))} />
                    </SettingsField>
                    <SettingsField label="Department">
                      <select className="settings-input" value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))}>
                        <option>Engineering</option>
                        <option>Procurement</option>
                        <option>Construction</option>
                        <option>Finance</option>
                        <option>HSE</option>
                        <option>Commercial</option>
                        <option>Management</option>
                      </select>
                    </SettingsField>
                    <SettingsField label="Display Language">
                      <select className="settings-input" value={profile.language} onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}>
                        <option value="en">English</option>
                        <option value="ar">Arabic (العربية)</option>
                      </select>
                    </SettingsField>
                  </div>

                  {/* Theme selector */}
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Appearance</p>
                    <div className="flex gap-2">
                      {([
                        { key: 'light', label: 'Light', icon: Sun },
                        { key: 'dark',  label: 'Dark',  icon: Moon },
                        { key: 'system', label: 'System', icon: Palette },
                      ] as const).map(t => (
                        <button
                          key={t.key}
                          onClick={() => setTheme(t.key)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-colors ${
                            theme === t.key
                              ? 'bg-secondary text-foreground border-primary'
                              : 'bg-card text-muted-foreground border-border hover:bg-muted'
                          }`}
                        >
                          <t.icon className="w-3.5 h-3.5" />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Currency and date format changes apply immediately across all modules.</p>
                    <button
                      onClick={() => showToast(`System defaults saved — currency: ${settings.currency}`)}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── System Defaults ── */}
            {activeTab === 'system' && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-base font-semibold text-foreground">System Defaults</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Global configuration applied across all projects and modules</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SettingsField label="Default Currency">
                      <select className="settings-input" value={settings.currency} onChange={e => updateSettings({ currency: e.target.value })}>
                        <option value="SAR">SAR — Saudi Riyal</option>
                        <option value="USD">USD — US Dollar</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="AED">AED — UAE Dirham</option>
                        <option value="GBP">GBP — British Pound</option>
                      </select>
                    </SettingsField>
                    <SettingsField label="Date Format">
                      <select className="settings-input" value={settings.dateFormat} onChange={e => updateSettings({ dateFormat: e.target.value })}>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (Saudi Standard)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                      </select>
                    </SettingsField>
                    <SettingsField label="Timezone">
                      <select className="settings-input" value={settings.timezone} onChange={e => updateSettings({ timezone: e.target.value })}>
                        <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                        <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                        <option value="UTC">UTC</option>
                        <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                      </select>
                    </SettingsField>
                    <SettingsField label="Fiscal Year Start Month">
                      <select className="settings-input" value={settings.fiscalYearStart} onChange={e => updateSettings({ fiscalYearStart: e.target.value })}>
                        <option value="01">January</option>
                        <option value="04">April</option>
                        <option value="07">July</option>
                        <option value="10">October</option>
                      </select>
                    </SettingsField>
                    <SettingsField label="Default Starting EPC Stage">
                      <select className="settings-input" value={systemDraft.defaultStage} onChange={e => setSystemDraft(s => ({ ...s, defaultStage: e.target.value }))}>
                        <option value="1">Stage 1 — Pre-Contract & Tender</option>
                        <option value="2">Stage 2 — Contract Setup</option>
                      </select>
                    </SettingsField>
                    <SettingsField label="Approval Timeout (hours)">
                      <input className="settings-input" type="number" min="24" max="168" value={systemDraft.approvalTimeout} onChange={e => setSystemDraft(s => ({ ...s, approvalTimeout: e.target.value }))} />
                    </SettingsField>
                  </div>

                  <div className="bg-secondary/60 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Globe className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-primary">Saudi Vision 2030 Compliance</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Localization settings comply with SAUDI ARAMCO, SEC, and NEOM procurement standards. Currency and date formats follow GAZT/ZATCA reporting requirements.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border">
                    <button
                      onClick={() => showToast('System defaults saved')}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Defaults
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === 'notifications' && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-base font-semibold text-foreground">Notification Preferences</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Choose which events trigger notifications and how you receive them</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Event toggles */}
                  <div>
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Event Alerts</p>
                    <div className="space-y-3">
                      {[
                        { key: 'approvalRequests',     label: 'Approval requests assigned to me',      description: 'Notify when an approval is routed to you' },
                        { key: 'approvalDecisions',    label: 'Approval decisions made',               description: 'Approved, rejected, or delegated on items you submitted' },
                        { key: 'stageChanges',         label: 'Project stage transitions',              description: 'When a project moves to a new EPC phase' },
                        { key: 'documentUploads',      label: 'New document uploads',                  description: 'When documents are uploaded to projects you manage' },
                        { key: 'hseIncidents',         label: 'HSE incidents reported',                description: 'High and medium severity incidents' },
                        { key: 'milestonesDue',        label: 'Milestones due within 7 days',          description: 'Advance warning on upcoming deadline milestones' },
                        { key: 'paymentCertificates',  label: 'Payment certificates pending',          description: 'Finance events requiring your review or action' },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between gap-4 py-2.5 border-b border-border last:border-0">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>
                          </div>
                          <Toggle
                            checked={notifications[item.key as keyof typeof notifications] as boolean}
                            onChange={v => setNotifications(n => ({ ...n, [item.key]: v }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery channels */}
                  <div>
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Delivery Channels</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center justify-between border border-border rounded-xl px-4 py-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground">In-App</p>
                          <p className="text-[10px] text-muted-foreground">Always on</p>
                        </div>
                        <Toggle checked={true} onChange={() => {}} disabled />
                      </div>
                      <div className="flex items-center justify-between border border-border rounded-xl px-4 py-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground">Push</p>
                          <p className="text-[10px] text-muted-foreground">Browser & mobile</p>
                        </div>
                        <Toggle checked={notifications.pushEnabled} onChange={v => setNotifications(n => ({ ...n, pushEnabled: v }))} />
                      </div>
                      <div className="flex items-center justify-between border border-border rounded-xl px-4 py-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground">SMS</p>
                          <p className="text-[10px] text-muted-foreground">+966 55 123 4567</p>
                        </div>
                        <Toggle checked={notifications.smsEnabled} onChange={v => setNotifications(n => ({ ...n, smsEnabled: v }))} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Email Digest Frequency</p>
                    <div className="flex gap-2">
                      {['realtime', 'daily', 'weekly', 'none'].map(f => (
                        <button
                          key={f}
                          onClick={() => setNotifications(n => ({ ...n, emailDigest: f }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                            notifications.emailDigest === f
                              ? 'bg-secondary text-foreground border-primary'
                              : 'bg-card text-muted-foreground border-border hover:bg-muted'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border">
                    <button
                      onClick={() => showToast('Notification preferences saved')}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Security ── */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Security Settings</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage your password, two-factor authentication, and active sessions</p>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Change password */}
                    <div>
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Change Password</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SettingsField label="Current Password">
                          <div className="relative">
                            <input type="password" className="settings-input pr-10" placeholder="Enter current password" />
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </SettingsField>
                        <SettingsField label="New Password">
                          <div className="relative">
                            <input type="password" className="settings-input pr-10" placeholder="Min. 8 characters" />
                            <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </SettingsField>
                      </div>
                      <button
                        onClick={() => showToast('Password updated successfully')}
                        className="mt-3 bg-secondary hover:bg-secondary/80 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        Update Password
                      </button>
                    </div>

                    <div className="border-t border-border pt-5 space-y-4">
                      {/* 2FA */}
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-foreground">Two-Factor Authentication</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Add an extra layer of security using an authenticator app or SMS code</p>
                        </div>
                        <Toggle checked={security.twoFactor} onChange={v => { setSecurity(s => ({ ...s, twoFactor: v })); showToast(v ? '2FA enabled' : '2FA disabled') }} />
                      </div>

                      {/* Session timeout */}
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-foreground">Session Timeout</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Automatically log out after inactivity</p>
                        </div>
                        <select
                          className="settings-input w-36"
                          value={security.sessionTimeout}
                          onChange={e => setSecurity(s => ({ ...s, sessionTimeout: e.target.value }))}
                        >
                          <option value="1">1 hour</option>
                          <option value="4">4 hours</option>
                          <option value="8">8 hours</option>
                          <option value="24">24 hours</option>
                        </select>
                      </div>

                      {/* Login alerts */}
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-foreground">Login Alerts</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Send email when a new sign-in is detected from an unrecognised device</p>
                        </div>
                        <Toggle checked={security.loginAlerts} onChange={v => setSecurity(s => ({ ...s, loginAlerts: v }))} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active sessions */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Active Sessions</p>
                    <button onClick={() => showToast('All other sessions revoked')} className="text-xs text-red-600 font-semibold hover:underline">
                      Revoke all others
                    </button>
                  </div>
                  <div className="divide-y divide-border">
                    {[
                      { device: 'MacBook Pro 16" — Chrome 126', location: 'Riyadh, Saudi Arabia', time: 'Active now', current: true },
                      { device: 'iPhone 15 Pro — Safari', location: 'Riyadh, Saudi Arabia', time: '2 hours ago', current: false },
                      { device: 'Windows PC — Edge', location: 'Jeddah, Saudi Arabia', time: '1 day ago', current: false },
                    ].map(session => (
                      <div key={session.device} className="flex items-center justify-between gap-4 px-6 py-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-foreground truncate">{session.device}</p>
                            {session.current && (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-800/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{session.location} · {session.time}</p>
                        </div>
                        {!session.current && (
                          <button onClick={() => showToast(`Session revoked: ${session.device}`)} className="text-xs text-red-600 font-semibold hover:underline flex-shrink-0">
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Roles & Access ── */}
            {activeTab === 'roles' && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Roles & Access</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Define what each role can view, edit, and approve in the system</p>
                  </div>
                  <button onClick={() => showToast('New role created')} className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
                    + New Role
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { role: 'Super Admin',          users: 2,  modules: 'All modules — full access',                    color: 'text-foreground bg-secondary/60' },
                    { role: 'Project Manager',      users: 8,  modules: 'Projects, Engineering, Procurement, Finance',   color: 'text-amber-400 bg-accent' },
                    { role: 'Engineering Manager',  users: 5,  modules: 'Engineering, Documents, QA/QC (edit)',          color: 'text-teal-400 bg-secondary/60' },
                    { role: 'Procurement Manager',  users: 4,  modules: 'Procurement, Documents (read), Finance (read)', color: 'text-primary bg-accent' },
                    { role: 'HSE Manager',          users: 3,  modules: 'HSE (full), Documents, Construction (read)',     color: 'text-red-400 bg-red-950/20' },
                    { role: 'Finance Director',     users: 2,  modules: 'Finance (full), Reports, Approvals',             color: 'text-emerald-400 bg-emerald-950/20' },
                    { role: 'Commercial Director',  users: 1,  modules: 'Opportunities, Approvals, Finance (read)',       color: 'text-primary bg-secondary/60' },
                    { role: 'Client Viewer',        users: 12, modules: 'Client Portal only — read',                     color: 'text-muted-foreground bg-muted' },
                  ].map(r => (
                    <div key={r.role} className="flex items-center gap-4 px-6 py-3.5">
                      <div className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${r.color}`}>
                        {r.role.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{r.role}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{r.modules}</p>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-foreground">{r.users}</p>
                          <p className="text-[10px] text-muted-foreground">users</p>
                        </div>
                        <button onClick={() => showToast(`Editing ${r.role} role`)} className="text-xs text-primary font-semibold hover:underline">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Integrations ── */}
            {activeTab === 'integrations' && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-base font-semibold text-foreground">Integrations</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Connect external services and manage API access tokens</p>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { name: 'Microsoft Outlook',   desc: 'Sync approvals and notifications with Outlook calendar',  status: 'connected',    color: 'bg-[#0078D4] text-white' },
                    { name: 'SAP ERP',             desc: 'Finance data sync — invoices, cost codes, GL entries',     status: 'connected',    color: 'bg-[#003366] text-white' },
                    { name: 'AutoCAD / BIM 360',   desc: 'Drawing register sync and revision tracking',              status: 'disconnected', color: 'bg-muted text-muted-foreground' },
                    { name: 'Primavera P6',        desc: 'Import project baselines and milestone schedules',          status: 'disconnected', color: 'bg-muted text-muted-foreground' },
                    { name: 'Oracle Aconex',       desc: 'Document management and correspondence integration',        status: 'connected',    color: 'bg-[#C74B37] text-white' },
                    { name: 'WhatsApp Business',   desc: 'SMS/WhatsApp notifications for approvals and alerts',      status: 'disconnected', color: 'bg-muted text-muted-foreground' },
                  ].map(integration => (
                    <div key={integration.name} className="flex items-center gap-4 px-6 py-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${integration.color}`}>
                        {integration.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{integration.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{integration.desc}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          integration.status === 'connected'
                            ? 'text-emerald-400 bg-emerald-950/20 border border-emerald-800/30'
                            : 'text-muted-foreground bg-muted border border-border'
                        }`}>
                          {integration.status === 'connected' ? 'Connected' : 'Not connected'}
                        </span>
                        <button
                          onClick={() => showToast(`${integration.status === 'connected' ? 'Disconnecting' : 'Connecting'} ${integration.name}`)}
                          className={`text-xs font-semibold hover:underline ${integration.status === 'connected' ? 'text-red-600' : 'text-primary'}`}
                        >
                          {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-input {
          display: flex;
          align-items: center;
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: var(--background);
          color: var(--foreground);
          outline: none;
          transition: border-color 0.15s;
        }
        .settings-input:focus { border-color: var(--ring); box-shadow: 0 0 0 3px rgba(57,68,172,0.1); }
        select.settings-input { cursor: pointer; }
      `}</style>
    </AppLayout>
  )
}

function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-secondary' : 'bg-border'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
