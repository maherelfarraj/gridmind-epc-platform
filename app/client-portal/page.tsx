'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { fmtProjectValue, useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Globe,
  MessageSquare,
  Send,
  Shield,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo, useState } from 'react'

const progressTrendData = [
  { month: 'Jan', neom: 5, riyadh: 0, yanbu: 60 },
  { month: 'Feb', neom: 12, riyadh: 10, yanbu: 68 },
  { month: 'Mar', neom: 20, riyadh: 22, yanbu: 77 },
  { month: 'Apr', neom: 28, riyadh: 38, yanbu: 84 },
  { month: 'May', neom: 34, riyadh: 51, yanbu: 89 },
  { month: 'Jun', neom: 39, riyadh: 62, yanbu: 92 },
  { month: 'Jul', neom: 42, riyadh: 68, yanbu: 94 },
]

const clientMessages = [
  {
    id: 1,
    from: 'Khalid Al-Harbi (NEOM)',
    project: 'NEOM Solar Farm',
    message: 'Please confirm the revised foundation schedule for Zone B. We need to align with our site access plan.',
    time: '2h ago',
    unread: true,
    avatar: 'KH',
  },
  {
    id: 2,
    from: 'Mohammed Al-Dossary (Saudi Aramco)',
    project: 'Riyadh EPC-07',
    message: 'The IFC drawing package — Rev 2 needs consultant approval before we can proceed. Can you expedite?',
    time: '5h ago',
    unread: true,
    avatar: 'MD',
  },
  {
    id: 3,
    from: 'Fatima Al-Zahrani (SABIC)',
    project: 'Yanbu Industrial',
    message: 'We have reviewed the T&C plan. Our team will be available for PAC walkthrough from August 1st.',
    time: 'Yesterday',
    unread: false,
    avatar: 'FZ',
  },
  {
    id: 4,
    from: 'Omar Al-Saud (NEOM)',
    project: 'NEOM Solar Farm',
    message: 'Variation order VO-002 has been reviewed by our commercial team. Awaiting final sign-off.',
    time: '2 days ago',
    unread: false,
    avatar: 'OS',
  },
]

const sharedDocuments = [
  { id: 'DOC-C001', name: 'Monthly Progress Report — July 2024', project: 'NEOM Solar Farm', date: 'Jul 5', type: 'Report', size: '3.2 MB' },
  { id: 'DOC-C002', name: 'Invoice #INV-2024-009', project: 'NEOM Solar Farm', date: 'Jul 1', type: 'Finance', size: '0.5 MB' },
  { id: 'DOC-C003', name: 'Revised Construction Schedule v3', project: 'NEOM Solar Farm', date: 'Jun 28', type: 'Schedule', size: '1.1 MB' },
  { id: 'DOC-C004', name: 'T&C Readiness Report', project: 'Yanbu Industrial', date: 'Jun 25', type: 'Report', size: '2.4 MB' },
  { id: 'DOC-C005', name: 'Progress Certificate #7', project: 'Riyadh EPC-07', date: 'Jul 5', type: 'Finance', size: '0.4 MB' },
]

const pendingActions = [
  { id: 'PA-001', project: 'NEOM Solar Farm', action: 'Approve Variation Order VO-002', type: 'approval', due: 'Aug 5', priority: 'high' },
  { id: 'PA-002', project: 'NEOM Solar Farm', action: 'Review & sign Revised Construction Schedule', type: 'sign-off', due: 'Jul 20', priority: 'medium' },
  { id: 'PA-003', project: 'Riyadh EPC-07', action: 'Confirm consultant assignment for IFC review', type: 'confirmation', due: 'Jul 18', priority: 'high' },
  { id: 'PA-004', project: 'NEOM Solar Farm', action: 'Payment confirmation — Invoice INV-2024-009', type: 'payment', due: 'Jul 31', priority: 'medium' },
]

const stageColors: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-secondary/60', text: 'text-foreground', label: 'Pre-Contract' },
  2: { bg: 'bg-secondary/60', text: 'text-primary', label: 'Contract Setup' },
  3: { bg: 'bg-secondary/60', text: 'text-teal-400', label: 'Engineering' },
  4: { bg: 'bg-accent', text: 'text-primary', label: 'Procurement' },
  5: { bg: 'bg-accent', text: 'text-amber-400', label: 'Construction' },
  6: { bg: 'bg-emerald-950/20', text: 'text-emerald-400', label: 'Finance' },
  7: { bg: 'bg-purple-950/20', text: 'text-purple-400', label: 'T&C Handover' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'on-track': { label: 'On Track', color: 'text-emerald-400', bg: 'bg-emerald-950/20', border: 'border-emerald-800/30' },
  'delayed': { label: 'Delayed', color: 'text-red-400', bg: 'bg-red-950/20', border: 'border-red-800/30' },
  'at-risk': { label: 'At Risk', color: 'text-amber-400', bg: 'bg-accent', border: 'border-amber-500/20' },
  'completed': { label: 'Completed', color: 'text-primary', bg: 'bg-secondary/60', border: 'border-primary/20' },
}

const priorityConfig: Record<string, string> = {
  high: 'text-red-600 bg-red-950/20 border-red-800/30',
  medium: 'text-amber-400 bg-accent border-amber-500/20',
  low: 'text-muted-foreground bg-muted border-border',
}

const typeColors: Record<string, string> = {
  Report: 'text-primary bg-secondary/60',
  Finance: 'text-emerald-400 bg-emerald-950/20',
  Schedule: 'text-amber-400 bg-accent',
}

export default function ClientPortalPage() {
  const { projects, approvals, pendingApprovalCount, settings } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'documents' | 'actions'>('overview')
  const [replyText, setReplyText] = useState('')
  const [selectedMsg, setSelectedMsg] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)

  // Client-visible projects derived from the live workspace store
  const clientProjects = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        client: p.client,
        contractValue: fmtProjectValue(p.valueSAR, p.currency),
        stage: p.phaseId,
        progress: p.progress,
        startDate: p.startDate,
        endDate: p.targetDate,
        status: p.alert ? 'delayed' : p.progress >= 95 ? 'completed' : 'on-track',
        pm: p.pm,
        nextMilestone: p.activeStep,
        nextMilestoneDate: p.targetDate,
        pendingApprovals: approvals.filter(
          (a) => a.projectId === p.id && (a.status === 'pending' || a.status === 'under-review'),
        ).length,
        openIssues: p.alert ? 4 : 1,
      })),
    [projects, approvals],
  )
  const [threads, setThreads] = useState<Record<number, { text: string; time: string; from: 'me' | 'client' }[]>>({
    1: [{ text: 'Please confirm the revised foundation schedule for Zone B. We need to align with our site access plan.', time: '2h ago', from: 'client' }],
    2: [{ text: 'The IFC drawing package — Rev 2 needs consultant approval before we can proceed. Can you expedite?', time: '5h ago', from: 'client' }],
    3: [{ text: 'We have reviewed the T&C plan. Our team will be available for PAC walkthrough from August 1st.', time: 'Yesterday', from: 'client' }],
    4: [{ text: 'Variation order VO-002 has been reviewed by our commercial team. Awaiting final sign-off.', time: '2 days ago', from: 'client' }],
  })

  const sendReply = (msgId: number) => {
    if (!replyText.trim()) return
    setThreads(prev => ({
      ...prev,
      [msgId]: [...(prev[msgId] || []), { text: replyText.trim(), time: 'Just now', from: 'me' }],
    }))
    setReplyText('')
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const unreadCount = clientMessages.filter(m => m.unread).length
  const totalPendingActions = pendingActions.length
  const highPriorityActions = pendingActions.filter(a => a.priority === 'high').length

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
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Client Portal</h1>
            </div>
            <p className="text-muted-foreground text-sm">Shared project visibility, approvals, documents, and communication for clients</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs bg-red-950/20 text-red-600 border border-red-800/30 px-3 py-1.5 rounded-lg font-medium">
                <MessageSquare className="w-3.5 h-3.5" />
                {unreadCount} unread
              </div>
            )}
            <button
              onClick={() => showToast('Client portal invite sent')}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4" />
              Invite Client
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Active Projects" value={clientProjects.length.toString()} subtitle="Client-visible" icon={Globe} accent="navy" />
          <KPICard title="Pending Actions" value={(totalPendingActions + pendingApprovalCount).toString()} subtitle={`${pendingApprovalCount} awaiting approval`} icon={AlertTriangle} accent="orange" />
          <KPICard title="Unread Messages" value={unreadCount.toString()} subtitle="From clients" icon={MessageSquare} accent="indigo" />
          <KPICard title="Shared Docs" value={sharedDocuments.length.toString()} subtitle="This month" icon={FileText} accent="green" />
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center border-b border-border px-5">
            {([
              { key: 'overview', label: 'Project Overview' },
              { key: 'messages', label: 'Messages', badge: unreadCount },
              { key: 'documents', label: 'Shared Documents' },
              { key: 'actions', label: 'Pending Actions', badge: highPriorityActions },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {'badge' in tab && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="divide-y divide-border">
              {clientProjects.map(project => {
                const sc = stageColors[project.stage]
                const st = statusConfig[project.status]
                const isExpanded = expandedProject === project.id

                return (
                  <div key={project.id}>
                    <button
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors text-left"
                      onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
                        <span className={`text-sm font-bold ${sc.text}`}>{project.stage}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{project.name}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${st.color} ${st.bg} ${st.border}`}>
                            {st.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">{project.client}</span>
                          <span className="text-xs text-muted-foreground">{project.contractValue}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>
                            Stage {project.stage}: {sc.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <p className="text-sm font-bold text-foreground">{project.progress}%</p>
                        </div>
                        <div className="w-24 hidden md:block">
                          <div className="bg-muted rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${project.status === 'on-track' ? 'bg-primary' : 'bg-destructive'}`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 bg-muted/10 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          {/* Key details */}
                          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Project Details</p>
                            {[
                              { label: 'Project ID', value: project.id },
                              { label: 'Project Manager', value: project.pm },
                              { label: 'Start Date', value: project.startDate },
                              { label: 'End Date', value: project.endDate },
                              { label: 'Contract Value', value: project.contractValue },
                            ].map(d => (
                              <div key={d.label} className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{d.label}</span>
                                <span className="text-xs font-medium text-foreground">{d.value}</span>
                              </div>
                            ))}
                          </div>

                          {/* Next milestone */}
                          <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Next Milestone</p>
                            <div className="flex items-start gap-3 p-3 bg-secondary/60 rounded-lg">
                              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground">{project.nextMilestone}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Due: {project.nextMilestoneDate}</p>
                              </div>
                            </div>
                            <div className="mt-3 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">Open Issues</span>
                                <span className={`text-xs font-bold ${project.openIssues > 3 ? 'text-red-600' : 'text-amber-400'}`}>{project.openIssues}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">Pending Approvals</span>
                                <span className={`text-xs font-bold ${project.pendingApprovals > 0 ? 'text-primary' : 'text-emerald-400'}`}>{project.pendingApprovals}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Quick Actions</p>
                            <div className="space-y-2">
                              {[
                                { label: 'View Full Timeline', icon: BarChart3 },
                                { label: 'Download Progress Report', icon: Download },
                                { label: 'Send Message to PM', icon: MessageSquare },
                                { label: 'View Shared Documents', icon: FileText },
                              ].map(action => (
                                <button
                                  key={action.label}
                                  onClick={() => showToast(`${action.label} — ${project.name}`)}
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
                )
              })}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="flex h-[500px]">
              {/* Message list */}
              <div className="w-72 border-r border-border overflow-y-auto flex-shrink-0">
                {clientMessages.map(msg => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMsg(msg.id)}
                    className={`w-full text-left px-4 py-4 border-b border-border hover:bg-muted/20 transition-colors ${
                      selectedMsg === msg.id ? 'bg-secondary/60/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {msg.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-foreground truncate">{msg.from.split(' (')[0]}</p>
                          {msg.unread && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-primary font-medium truncate">{msg.project}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{msg.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{msg.time}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Message detail */}
              <div className="flex-1 flex flex-col">
                {selectedMsg ? (
                  (() => {
                    const msg = clientMessages.find(m => m.id === selectedMsg)!
                    return (
                      <>
                        <div className="px-5 py-4 border-b border-border bg-muted/20">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                              {msg.avatar}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{msg.from}</p>
                              <p className="text-xs text-muted-foreground">{msg.project} · {msg.time}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 p-5 overflow-y-auto space-y-3">
                          {(threads[msg.id] || []).map((entry, i) => (
                            <div key={i} className={`flex ${entry.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] ${entry.from === 'me' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                  entry.from === 'me'
                                    ? 'bg-secondary text-foreground rounded-br-sm'
                                    : 'bg-muted/40 text-foreground rounded-tl-sm'
                                }`}>
                                  {entry.text}
                                </div>
                                <p className="text-[10px] text-muted-foreground px-1">{entry.time}{entry.from === 'me' ? ' · You' : ` · ${msg.from.split(' (')[0]}`}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-5 py-4 border-t border-border">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-3 bg-muted/30 border border-border rounded-xl px-4 py-2">
                              <input
                                type="text"
                                placeholder="Type your reply..."
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) sendReply(msg.id)
                                }}
                                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                              />
                            </div>
                            <button
                              onClick={() => sendReply(msg.id)}
                              disabled={!replyText.trim()}
                              className="w-9 h-9 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-white transition-colors flex-shrink-0 disabled:opacity-40"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )
                  })()
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium text-foreground">Select a message</p>
                      <p className="text-xs text-muted-foreground mt-1">Choose a conversation from the list</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Document', 'Project', 'Type', 'Shared Date', 'File Size', 'Actions'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sharedDocuments.map(doc => (
                      <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-foreground" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{doc.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{doc.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{doc.project}</td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColors[doc.type] || 'text-muted-foreground bg-muted'}`}>
                            {doc.type}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{doc.date}</td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{doc.size}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => showToast(`Viewing ${doc.name}`)}
                              className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => showToast(`Downloading ${doc.name}`)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pending Actions Tab */}
          {activeTab === 'actions' && (
            <div className="divide-y divide-border">
              {pendingActions.map(action => (
                <div key={action.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    action.priority === 'high' ? 'bg-red-950/20' : 'bg-accent'
                  }`}>
                    {action.type === 'approval' ? (
                      <Shield className={`w-4 h-4 ${action.priority === 'high' ? 'text-red-500' : 'text-amber-400'}`} />
                    ) : action.type === 'payment' ? (
                      <TrendingUp className={`w-4 h-4 ${action.priority === 'high' ? 'text-red-500' : 'text-amber-400'}`} />
                    ) : (
                      <Clock className={`w-4 h-4 ${action.priority === 'high' ? 'text-red-500' : 'text-amber-400'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{action.action}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{action.project}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">Due: {action.due}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${priorityConfig[action.priority]}`}>
                      {action.priority}
                    </span>
                    <button
                      onClick={() => showToast(`Action "${action.action}" submitted`)}
                      className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Take Action
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress trend chart */}
        {activeTab === 'overview' && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Portfolio Progress Trend — All Active Projects (%)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Monthly cumulative construction progress by project</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />NEOM Solar</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Riyadh EPC</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Yanbu Ind.</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={progressTrendData}>
                <defs>
                  <linearGradient id="neomGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A55A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#C9A55A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="riyadhGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A7FA5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4A7FA5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="yanbuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${v}%`]} />
                <Area type="monotone" dataKey="neom" name="NEOM Solar" stroke="#8B6F3A" strokeWidth={2} fill="url(#neomGrad)" />
                <Area type="monotone" dataKey="riyadh" name="Riyadh EPC" stroke="#C9A55A" strokeWidth={2} fill="url(#riyadhGrad)" />
                <Area type="monotone" dataKey="yanbu" name="Yanbu Ind." stroke="#10B981" strokeWidth={2} fill="url(#yanbuGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
