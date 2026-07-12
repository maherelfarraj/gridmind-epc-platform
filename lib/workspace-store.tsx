'use client'

import {
  CheckCircle,
  DollarSign,
  FileText,
  Flame,
  FlaskConical,
  HardHat,
  Layers,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'under-review'
export type ApprovalDecision = 'approve' | 'reject' | 'delegate'

export interface Approver {
  name: string
  role: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface ApprovalItem {
  id: string
  title: string
  description: string
  project: string
  projectId: string
  type: string
  stage: string
  stageNum: number
  submittedBy: string
  submittedDate: string
  due: string
  priority: 'high' | 'medium' | 'low'
  status: ApprovalStatus
  attachments: number
  comments: number
  approvers: Approver[]
}

export type NotificationCategory =
  | 'approvals'
  | 'hse'
  | 'documents'
  | 'milestones'
  | 'finance'
  | 'system'

export interface Notification {
  id: number
  title: string
  body: string
  category: NotificationCategory
  link: string
  time: string
  timeMs: number
  read: boolean
  urgent: boolean
  icon: React.ElementType
  project?: string
}

export type ProjectStatus = 'submitted' | 'in-progress' | 'approved'

/** Workspace-level settings — persisted in context, written by Settings page. */
export interface WorkspaceSettings {
  currency:        string   // e.g. 'SAR', 'USD', 'EUR'
  dateFormat:      string   // e.g. 'DD/MM/YYYY'
  timezone:        string   // e.g. 'Asia/Riyadh'
  fiscalYearStart: string   // month number as string e.g. '01'
}

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  currency:        'SAR',
  dateFormat:      'DD/MM/YYYY',
  timezone:        'Asia/Riyadh',
  fiscalYearStart: '01',
}

/**
 * Format a monetary number for display using the workspace currency.
 * e.g. fmtProjectValue(1_240_000_000, 'SAR') → 'SAR 1.24B'
 *      fmtProjectValue(420_000_000,   'USD') → 'USD 420M'
 */
export function fmtProjectValue(valueNum: number, currency = 'SAR'): string {
  if (valueNum === 0) return 'TBD'
  const ccy = currency || 'SAR'
  if (valueNum >= 1_000_000_000) return `${ccy} ${(valueNum / 1_000_000_000).toFixed(2)}B`
  if (valueNum >= 1_000_000)     return `${ccy} ${Math.round(valueNum / 1_000_000)}M`
  return `${ccy} ${Math.round(valueNum / 1_000)}K`
}

export interface PaymentCertificate {
  id: string          // e.g. 'PC-001'
  amountSAR: number   // plain number — display formatted at render time via fmtSAR
  date: string        // issue date string
  status: 'paid' | 'pending' | 'overdue'
  method: string      // e.g. '30-day LC', 'Bank Transfer'
}

export interface Project {
  id: string
  name: string
  stage: string
  phaseId: number
  phaseName: string
  phaseSteps: string
  activeStep: string
  progress: number
  currentStep: number
  valueSAR: number   // plain contract value number — display formatted at render time, never stored as a string
  currency: string   // currency code chosen at project creation, e.g. 'SAR', 'USD', 'EUR'
  status: ProjectStatus
  alert: boolean
  client: string
  pm: string
  documents: number
  pendingApprovals: number
  description: string
  startDate: string
  targetDate: string
  contractType?: string
  capacity?: string
  location?: string
  paymentCertificates?: PaymentCertificate[]  // starts empty; user adds certs via the form
}

export interface ActivityEntry {
  id: number
  actor: string
  action: string
  target: string
  time: string
  tone: 'default' | 'success' | 'warning' | 'danger'
}

export interface SimIssue {
  stepId: number
  severity: 'warning' | 'error'
  message: string
}

export interface SimRun {
  id: number
  scenario: string
  finishedAt: string
  outcome: 'passed' | 'halted' | 'warnings'
  stepsRun: number
  passed: number
  warnings: number
  errors: number
  issues: SimIssue[]
}

interface WorkspaceState {
  projects:  Project[]
  approvals: ApprovalItem[]
  notifications: Notification[]
  activity:  ActivityEntry[]
  simRuns:   SimRun[]
  settings:  WorkspaceSettings
}

interface WorkspaceContextValue extends WorkspaceState {
  updateSettings: (patch: Partial<WorkspaceSettings>) => void
  // projects
  addProject: (p: NewProjectInput) => Project
  getProject: (id: string) => Project | undefined
  addPaymentCertificate: (projectId: string, cert: Omit<PaymentCertificate, 'id'>) => void
  // approvals
  decideApproval: (id: string, decision: ApprovalDecision, comment?: string) => void
  createApproval: (input: CreateApprovalInput) => void
  // notifications
  markNotificationRead: (id: number) => void
  markAllNotificationsRead: () => void
  dismissNotification: (id: number) => void
  // generic event raising (used by lifecycle / governance modules)
  pushNotification: (n: PushNotificationInput) => void
  pushActivity: (a: Omit<ActivityEntry, 'id' | 'time'>) => void
  // simulator
  recordSimRun: (run: Omit<SimRun, 'id' | 'finishedAt'>) => void
  // derived
  pendingApprovalCount: number
  unreadNotificationCount: number
}

export interface NewProjectInput {
  name: string
  code?: string
  client: string
  valueSAR: number   // contract value number — 0 if not yet known
  currency?: string  // if omitted, defaults to workspace settings.currency
  pm?: string
  description?: string
  contractType?: string
  capacity?: string
  location?: string
  startDate?: string
  targetDate?: string
}

export interface CreateApprovalInput {
  title: string
  description: string
  project: string
  projectId: string
  type: string
  stage: string
  stageNum: number
  submittedBy: string
  priority: 'high' | 'medium' | 'low'
  approvers?: Approver[]
}

export type PushNotificationInput = Omit<Notification, 'id' | 'time' | 'timeMs' | 'read'>

// ─── Seed data ──────────────────────────────────────────────────────────────

const seedProjects: Project[] = [
  {
    id: 'NEOM-SOL-004', name: 'NEOM Solar Farm — Package 4', stage: 'Procurement & Supply Chain', phaseId: 4,
    phaseName: 'Procurement & Supply Chain', phaseSteps: 'Steps 21–27', activeStep: 'Step 23: Committee Approval',
    progress: 62, currentStep: 23, valueSAR: 1_240_000_000, currency: 'SAR', status: 'in-progress', alert: false,
    client: 'NEOM Company', pm: 'Ahmed Al-Rashidi', documents: 34, pendingApprovals: 2,
    description: '400 MW utility-scale solar PV installation in NEOM region.', startDate: 'Jan 2024', targetDate: 'Dec 2024',
    contractType: 'LSTK EPC', capacity: '400 MW', location: 'NEOM Region',
  },
  {
    id: 'RYD-EPC-007', name: 'Riyadh EPC Package 07', stage: 'Engineering & Design', phaseId: 3,
    phaseName: 'Engineering & Design', phaseSteps: 'Steps 14–20', activeStep: 'Step 18: Update BOQ',
    progress: 81, currentStep: 18, valueSAR: 420_000_000, currency: 'SAR', status: 'in-progress', alert: false,
    client: 'Saudi Aramco', pm: 'Sara Al-Otaibi', documents: 18, pendingApprovals: 1,
    description: 'Substation and electrical infrastructure EPC package.', startDate: 'Oct 2023', targetDate: 'Sep 2024',
    contractType: 'EPC', capacity: '—', location: 'Riyadh Region',
  },
  {
    id: 'JED-SUB-002', name: 'Jeddah Substation Upgrade', stage: 'Construction Planning & Execution', phaseId: 5,
    phaseName: 'Construction Planning & Execution', phaseSteps: 'Steps 28–36', activeStep: 'Step 33: Inspection / NCR',
    progress: 35, currentStep: 33, valueSAR: 558_000_000, currency: 'SAR', status: 'in-progress', alert: true,
    client: 'SEC', pm: 'Mohammed Hassan', documents: 52, pendingApprovals: 4,
    description: 'HV substation upgrade and capacity expansion project.', startDate: 'Mar 2024', targetDate: 'Feb 2025',
    contractType: 'EPC', capacity: '—', location: 'Jeddah',
  },
  {
    id: 'KAEC-SOL-400', name: 'KAEC Solar 400MW IPP', stage: 'Pre-Contract & Tender', phaseId: 1,
    phaseName: 'Pre-Contract & Tender', phaseSteps: 'Steps 1–6', activeStep: 'Step 4: Bid / No-Bid Decision',
    progress: 12, currentStep: 4, valueSAR: 1_640_000_000, currency: 'SAR', status: 'submitted', alert: false,
    client: 'ACWA Power', pm: 'Fatima Al-Zahra', documents: 6, pendingApprovals: 1,
    description: 'Large-scale IPP solar development at King Abdullah Economic City.', startDate: 'Jun 2024', targetDate: 'Jun 2026',
    contractType: 'IPP', capacity: '400 MW', location: 'KAEC',
  },
  {
    id: 'YNB-IND-001', name: 'Yanbu Industrial EPC', stage: 'Finance & Commercial Control', phaseId: 6,
    phaseName: 'Finance & Commercial Control', phaseSteps: 'Steps 37–43', activeStep: 'Step 43: Payment Proceed',
    progress: 95, currentStep: 43, valueSAR: 448_000_000, currency: 'SAR', status: 'approved', alert: false,
    client: 'SABIC', pm: 'Omar Abdullah', documents: 71, pendingApprovals: 0,
    description: 'Industrial EPC package — electrical & instrumentation.', startDate: 'Jun 2023', targetDate: 'Jul 2024',
    contractType: 'EPC', capacity: '—', location: 'Yanbu',
  },
  {
    id: 'TAB-SOL-010', name: 'Tabuk Solar Project', stage: 'Contract & Project Setup', phaseId: 2,
    phaseName: 'Contract & Project Setup', phaseSteps: 'Steps 7–13', activeStep: 'Step 9: Contract Signing',
    progress: 28, currentStep: 9, valueSAR: 360_000_000, currency: 'SAR', status: 'in-progress', alert: false,
    client: 'NEOM Company', pm: 'Khalid Al-Faisal', documents: 12, pendingApprovals: 3,
    description: '200 MW solar farm with battery storage system, Tabuk region.', startDate: 'May 2024', targetDate: 'Apr 2026',
    contractType: 'LSTK', capacity: '200 MW', location: 'Tabuk Region',
  },
]

const seedApprovals: ApprovalItem[] = [
  {
    id: 'APR-2024-041',
    title: 'BOQ Final Revision — NEOM Solar Farm',
    description: 'Revised Bill of Quantities incorporating engineering changes from consultant review round 3. Requires approval before procurement can proceed.',
    project: 'NEOM Solar Farm — Package 4',
    projectId: 'NEOM-SOL-004',
    type: 'Engineering Document',
    stage: 'Engineering & Design — Step 18: Update BOQ',
    stageNum: 3,
    submittedBy: 'Dr. Khaled Hassan',
    submittedDate: 'Jul 7, 2024',
    due: 'Jul 9, 2024',
    priority: 'high',
    status: 'pending',
    attachments: 3,
    comments: 5,
    approvers: [
      { name: 'Ahmed Al-Rashidi', role: 'Project Manager', status: 'approved' },
      { name: 'Eng. Tariq Al-Ghamdi', role: 'Engineering Manager', status: 'pending' },
      { name: 'Walid Al-Saud', role: 'Procurement Manager', status: 'pending' },
    ],
  },
  {
    id: 'APR-2024-040',
    title: 'Subcontractor Contract — Al-Qurayyah EPC',
    description: 'Subcontractor agreement for civil works package. Includes T&Cs, performance bonds, and milestone payment schedule.',
    project: 'NEOM Solar Farm — Package 4',
    projectId: 'NEOM-SOL-004',
    type: 'Contract',
    stage: 'Procurement & Supply Chain — Step 23: Committee Approval',
    stageNum: 4,
    submittedBy: 'Walid Al-Saud',
    submittedDate: 'Jul 6, 2024',
    due: 'Jul 10, 2024',
    priority: 'high',
    status: 'under-review',
    attachments: 5,
    comments: 2,
    approvers: [
      { name: 'Ahmed Al-Rashidi', role: 'Project Manager', status: 'approved' },
      { name: 'Legal Reviewer', role: 'Legal Team', status: 'pending' },
      { name: 'Finance Manager', role: 'Finance Manager', status: 'pending' },
    ],
  },
  {
    id: 'APR-2024-039',
    title: 'Payment Certificate #7 — Riyadh EPC-07',
    description: 'Progress payment certificate for July 2024. Covers milestones M14 through M17 with supporting inspection records.',
    project: 'Riyadh EPC Package 07',
    projectId: 'RYD-EPC-007',
    type: 'Finance',
    stage: 'Finance & Commercial Control — Step 38: Issue Invoice',
    stageNum: 6,
    submittedBy: 'Sara Al-Otaibi',
    submittedDate: 'Jul 5, 2024',
    due: 'Jul 12, 2024',
    priority: 'medium',
    status: 'pending',
    attachments: 8,
    comments: 1,
    approvers: [
      { name: 'Project Manager', role: 'PM', status: 'approved' },
      { name: 'Finance Manager', role: 'Finance', status: 'pending' },
      { name: 'Commercial Controller', role: 'Commercial', status: 'pending' },
    ],
  },
  {
    id: 'APR-2024-038',
    title: 'IFC Drawing Package v3 Review',
    description: 'Issued-for-Construction drawings package version 3 for the solar field and substation. 47 sheets total.',
    project: 'Tabuk Solar Project',
    projectId: 'TAB-SOL-010',
    type: 'Engineering Document',
    stage: 'Engineering & Design — Step 20: IFC Issue',
    stageNum: 3,
    submittedBy: 'Eng. Nora Al-Qahtani',
    submittedDate: 'Jul 4, 2024',
    due: 'Jul 14, 2024',
    priority: 'medium',
    status: 'under-review',
    attachments: 12,
    comments: 7,
    approvers: [
      { name: 'Engineering Manager', role: 'Eng. Manager', status: 'pending' },
      { name: 'QA/QC Manager', role: 'QA/QC', status: 'pending' },
      { name: 'Consultant Reviewer', role: 'Consultant', status: 'pending' },
    ],
  },
  {
    id: 'APR-2024-037',
    title: 'Vendor Quotation Comparison Sheet',
    description: 'Technical and commercial comparison of 5 transformer vendors. Recommends Siemens based on price, delivery, and technical compliance.',
    project: 'Jeddah Substation Upgrade',
    projectId: 'JED-SUB-002',
    type: 'Procurement',
    stage: 'Procurement & Supply Chain — Step 22: Quotations',
    stageNum: 4,
    submittedBy: 'Rania Abdullah',
    submittedDate: 'Jul 3, 2024',
    due: 'Jul 16, 2024',
    priority: 'low',
    status: 'approved',
    attachments: 2,
    comments: 3,
    approvers: [
      { name: 'Supply Chain Manager', role: 'Supply Chain', status: 'approved' },
      { name: 'Engineering Manager', role: 'Engineering', status: 'approved' },
      { name: 'Finance Manager', role: 'Finance', status: 'approved' },
    ],
  },
  {
    id: 'APR-2024-036',
    title: 'HSE Plan — Jeddah Substation',
    description: 'Health, Safety & Environment plan for construction phase. Includes risk register, emergency response, and site access controls.',
    project: 'Jeddah Substation Upgrade',
    projectId: 'JED-SUB-002',
    type: 'HSE',
    stage: 'Construction Planning & Execution — Step 29: Execution / HSE / QA-QC Plans',
    stageNum: 5,
    submittedBy: 'HSE Manager',
    submittedDate: 'Jun 28, 2024',
    due: 'Jul 5, 2024',
    priority: 'high',
    status: 'rejected',
    attachments: 4,
    comments: 9,
    approvers: [
      { name: 'Construction Manager', role: 'Construction', status: 'rejected' },
      { name: 'HSE Manager', role: 'HSE', status: 'approved' },
      { name: 'Consultant Reviewer', role: 'Consultant', status: 'pending' },
    ],
  },
]

const seedNotifications: Notification[] = [
  { id: 1,  title: 'Approval Required: BOQ Final Revision', body: 'NEOM Solar Farm BOQ Revision 4 has been submitted for your review and approval. Due by Aug 5.', category: 'approvals', link: '/approvals', time: '5 minutes ago', timeMs: 5, read: false, urgent: true, icon: CheckCircle, project: 'NEOM Solar Farm' },
  { id: 2,  title: 'HSE Incident Reported — Severity: High', body: 'A hand injury (LTI) was reported at the Jeddah Substation site. Immediate corrective action required.', category: 'hse', link: '/hse', time: '22 minutes ago', timeMs: 22, read: false, urgent: true, icon: Flame, project: 'Jeddah Substation' },
  { id: 3,  title: 'Approval Required: Subcontractor Contract', body: 'Al-Qurayyah EPC subcontractor contract (SAR 8.4M) is pending your signature. Due today.', category: 'approvals', link: '/approvals', time: '1 hour ago', timeMs: 60, read: false, urgent: true, icon: CheckCircle, project: 'Al-Qurayyah EPC' },
  { id: 4,  title: 'Milestone Due: Zone A Structure Complete', body: 'The "Zone A Structure Complete" milestone for NEOM Solar Farm is due in 3 days (Nov 5).', category: 'milestones', link: '/projects', time: '2 hours ago', timeMs: 120, read: false, urgent: false, icon: Layers, project: 'NEOM Solar Farm' },
  { id: 5,  title: 'Document Uploaded: IFC Drawing Package — Electrical', body: 'Eng. Nora Al-Qahtani uploaded IFC Drawing Package v2.0 (18.4 MB) — pending your review.', category: 'documents', link: '/documents', time: '4 hours ago', timeMs: 240, read: false, urgent: false, icon: FileText, project: 'NEOM Solar Farm' },
  { id: 6,  title: 'Approval Delegated to You: NCR Close-Out', body: 'Sara Al-Otaibi delegated NCR-042 close-out approval to you. Review by Aug 12.', category: 'approvals', link: '/approvals', time: '5 hours ago', timeMs: 300, read: true, urgent: false, icon: CheckCircle, project: 'Riyadh EPC-07' },
  { id: 7,  title: 'Payment Certificate #7 Submitted', body: 'Progress Certificate #7 for 68% physical completion has been submitted for finance review.', category: 'finance', link: '/finance', time: 'Yesterday, 3:12 PM', timeMs: 1440, read: true, urgent: false, icon: DollarSign, project: 'Riyadh EPC-07' },
  { id: 8,  title: 'QA/QC: NCR-041 Raised — Concrete Works', body: 'A Non-Conformance Report was raised on concrete mix design for Zone B foundations. Response required within 48 hours.', category: 'hse', link: '/qaqc', time: 'Yesterday, 10:45 AM', timeMs: 1600, read: true, urgent: false, icon: ShieldCheck, project: 'NEOM Solar Farm' },
  { id: 9,  title: 'Project Stage Transition: Yanbu Industrial', body: 'Yanbu Industrial Utilities has progressed to Stage 7 — T&C and Handover. T&C manager has been notified.', category: 'system', link: '/testing', time: '2 days ago', timeMs: 2880, read: true, urgent: false, icon: HardHat, project: 'Yanbu Industrial' },
  { id: 10, title: 'Client Message: NEOM — Foundation Schedule', body: 'Khalid Al-Harbi (NEOM) is requesting confirmation on the revised foundation schedule for Zone B.', category: 'system', link: '/client-portal', time: '2 days ago', timeMs: 3000, read: true, urgent: false, icon: MessageSquare, project: 'NEOM Solar Farm' },
  { id: 11, title: 'Vendor Quotation Received: Sungrow Power', body: 'Sungrow Power has submitted their inverter quotation (SAR 12.4M). Technical evaluation is now required.', category: 'documents', link: '/procurement', time: '3 days ago', timeMs: 4320, read: true, urgent: false, icon: FileText, project: 'NEOM Solar Farm' },
  { id: 12, title: 'Approval Decision: Contract Agreement Approved', body: 'The Contract Agreement for NEOM Solar Farm (SAR 285M) has been fully executed and approved by all parties.', category: 'approvals', link: '/approvals', time: '5 days ago', timeMs: 7200, read: true, urgent: false, icon: CheckCircle, project: 'NEOM Solar Farm' },
]

const seedActivity: ActivityEntry[] = [
  { id: 1, actor: 'Dr. Khaled Hassan', action: 'submitted', target: 'BOQ Final Revision — NEOM Solar Farm', time: '5m ago', tone: 'default' },
  { id: 2, actor: 'HSE Team', action: 'reported an incident on', target: 'Jeddah Substation', time: '22m ago', tone: 'danger' },
  { id: 3, actor: 'Rania Abdullah', action: 'approved', target: 'Vendor Quotation Comparison Sheet', time: '3h ago', tone: 'success' },
  { id: 4, actor: 'Eng. Nora Al-Qahtani', action: 'uploaded', target: 'IFC Drawing Package v2.0', time: '4h ago', tone: 'default' },
]

// ─── Context ──────────────────────────────────────────────────────────────────

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [projects,      setProjects]      = useState<Project[]>(seedProjects)
  const [approvals,     setApprovals]     = useState<ApprovalItem[]>(seedApprovals)
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications)
  const [activity,      setActivity]      = useState<ActivityEntry[]>(seedActivity)
  const [simRuns,       setSimRuns]       = useState<SimRun[]>([])
  const [settings,      setSettings]      = useState<WorkspaceSettings>(DEFAULT_SETTINGS)

  const updateSettings = useCallback((patch: Partial<WorkspaceSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const notifId = useRef(1000)
  const activityId = useRef(1000)
  const simId = useRef(1)
  const apprId = useRef(2000)

  const pushNotification = useCallback(
    (n: Omit<Notification, 'id' | 'time' | 'timeMs' | 'read'>) => {
      notifId.current += 1
      setNotifications((prev) => [
        { ...n, id: notifId.current, time: 'Just now', timeMs: 0, read: false },
        ...prev,
      ])
    },
    [],
  )

  const pushActivity = useCallback((a: Omit<ActivityEntry, 'id' | 'time'>) => {
    activityId.current += 1
    setActivity((prev) => [{ ...a, id: activityId.current, time: 'Just now' }, ...prev])
  }, [])

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects])

  const addProject = useCallback(
    (input: NewProjectInput): Project => {
      const id = input.code?.trim() || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`
      const project: Project = {
        id,
        name: input.name,
        stage: 'Pre-Contract & Tender',
        phaseId: 1,
        phaseName: 'Pre-Contract & Tender',
        phaseSteps: 'Steps 1–6',
        activeStep: 'Step 1: Project Intake',
        progress: 2,
        currentStep: 1,
        valueSAR: input.valueSAR ?? 0,
        currency: input.currency || settings.currency,
        status: 'submitted',
        alert: false,
        client: input.client,
        pm: input.pm || 'Unassigned',
        documents: 0,
        pendingApprovals: 1,
        description: input.description || '',
        startDate: input.startDate || '—',
        targetDate: input.targetDate || '—',
        contractType: input.contractType,
        capacity: input.capacity,
        location: input.location,
      }
      setProjects((prev) => [project, ...prev])
      pushActivity({ actor: 'You', action: 'created project', target: project.name, tone: 'default' })
      pushNotification({
        title: `New Project Submitted: ${project.name}`,
        body: `${project.name} (${id}) has been submitted for Stage 1 approval. Stakeholders have been notified.`,
        category: 'system',
        link: `/projects/${id}`,
        urgent: false,
        icon: HardHat,
        project: project.name,
      })
      return project
    },
    [pushActivity, pushNotification, settings],
  )

  const createApproval = useCallback(
    (input: CreateApprovalInput) => {
      apprId.current += 1
      const item: ApprovalItem = {
        id: `APR-NEW-${apprId.current}`,
        title: input.title,
        description: input.description,
        project: input.project,
        projectId: input.projectId,
        type: input.type,
        stage: input.stage,
        stageNum: input.stageNum,
        submittedBy: input.submittedBy,
        submittedDate: 'Just now',
        due: 'TBD',
        priority: input.priority,
        status: 'pending',
        attachments: 0,
        comments: 0,
        approvers: input.approvers ?? [{ name: 'Project Manager', role: 'PM', status: 'pending' }],
      }
      setApprovals((prev) => [item, ...prev])
      pushActivity({ actor: input.submittedBy, action: 'submitted for approval', target: input.title, tone: 'default' })
      pushNotification({
        title: `Approval Required: ${input.title}`,
        body: `${input.description}`,
        category: 'approvals',
        link: '/approvals',
        urgent: input.priority === 'high',
        icon: CheckCircle,
        project: input.project,
      })
    },
    [pushActivity, pushNotification],
  )

  const decideApproval = useCallback(
    (id: string, decision: ApprovalDecision, _comment?: string) => {
      let title = ''
      setApprovals((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a
          title = a.title
          const status: ApprovalStatus =
            decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'under-review'
          const approverStatus = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'pending'
          return {
            ...a,
            status,
            approvers: a.approvers.map((ap, i) =>
              i === a.approvers.findIndex((x) => x.status === 'pending')
                ? { ...ap, status: approverStatus as Approver['status'] }
                : ap,
            ),
          }
        }),
      )
      const verb = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'delegated'
      pushActivity({ actor: 'You', action: verb, target: title, tone: decision === 'reject' ? 'danger' : decision === 'approve' ? 'success' : 'default' })
      pushNotification({
        title: `Approval ${verb}: ${title}`,
        body: `You ${verb} "${title}".${_comment ? ` Comment: ${_comment}` : ''}`,
        category: 'approvals',
        link: '/approvals',
        urgent: false,
        icon: CheckCircle,
      })
    },
    [pushActivity, pushNotification],
  )

  const markNotificationRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const dismissNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const addPaymentCertificate = useCallback(
    (projectId: string, cert: Omit<PaymentCertificate, 'id'>) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p
          const existing = p.paymentCertificates ?? []
          const id = `PC-${String(existing.length + 1).padStart(3, '0')}`
          return { ...p, paymentCertificates: [...existing, { ...cert, id }] }
        }),
      )
    },
    [],
  )

  const recordSimRun = useCallback(
    (run: Omit<SimRun, 'id' | 'finishedAt'>) => {
      simId.current += 1
      const finishedAt = new Date().toLocaleTimeString('en-GB', { hour12: false })
      setSimRuns((prev) => [{ ...run, id: simId.current, finishedAt }, ...prev].slice(0, 20))
      const hasErrors = run.errors > 0
      pushActivity({
        actor: 'Workflow Simulator',
        action: `finished a "${run.scenario}" run —`,
        target: `${run.passed} passed, ${run.errors} error(s)`,
        tone: hasErrors ? 'danger' : run.warnings > 0 ? 'warning' : 'success',
      })
      pushNotification({
        title: `Simulation ${run.outcome === 'passed' ? 'passed' : run.outcome === 'halted' ? 'halted' : 'completed with warnings'}: ${run.scenario}`,
        body:
          run.outcome === 'halted'
            ? `The workflow halted after ${run.stepsRun} step(s). ${run.errors} blocking error(s) detected — review required.`
            : run.warnings > 0
              ? `Completed all ${run.stepsRun} steps with ${run.warnings} warning(s).`
              : `All ${run.stepsRun} steps validated cleanly with no issues.`,
        category: 'system',
        link: '/simulator',
        urgent: hasErrors,
        icon: FlaskConical,
        project: 'Workflow Integrity',
      })
    },
    [pushActivity, pushNotification],
  )

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      projects,
      approvals,
      notifications,
      activity,
      simRuns,
      settings,
      updateSettings,
      addProject,
      getProject,
      addPaymentCertificate,
      decideApproval,
      createApproval,
      markNotificationRead,
      markAllNotificationsRead,
      dismissNotification,
      pushNotification,
      pushActivity,
      recordSimRun,
      pendingApprovalCount: approvals.filter((a) => a.status === 'pending').length,
      unreadNotificationCount: notifications.filter((n) => !n.read).length,
    }),
    [
      projects,
      approvals,
      notifications,
      activity,
      simRuns,
      settings,
      updateSettings,
      addProject,
      getProject,
      addPaymentCertificate,
      decideApproval,
      createApproval,
      markNotificationRead,
      markAllNotificationsRead,
      dismissNotification,
      pushNotification,
      pushActivity,
      recordSimRun,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider')
  return ctx
}
