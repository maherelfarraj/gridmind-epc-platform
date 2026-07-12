'use client'

import { cn } from '@/lib/utils'
import { CheckCircle, Circle, Clock, FileText, User, XCircle } from 'lucide-react'
import { useState } from 'react'

export type StepStatus = 'completed' | 'active' | 'pending' | 'rejected'

export interface WorkflowStep {
  id: number
  label: string
  status: StepStatus
  date?: string
  assignee?: string
  gate?: string // approval gate name
}

export interface WorkflowPhase {
  id: number
  label: string
  color: string
  bgColor: string
  borderColor: string
  steps: WorkflowStep[]
}

interface WorkflowTimelineProps {
  steps?: WorkflowStep[]
  phases?: WorkflowPhase[]
  orientation?: 'horizontal' | 'vertical'
  variant?: 'simple' | 'phased'
  className?: string
}

const statusIcons = {
  completed: CheckCircle,
  active: Clock,
  pending: Circle,
  rejected: XCircle,
}

const statusColors = {
  completed: 'text-green-600 bg-green-50 border-green-200',
  active: 'text-[#FF8C00] bg-[#FFF3E0] border-[#FF8C00]/30',
  pending: 'text-muted-foreground bg-muted border-border',
  rejected: 'text-red-600 bg-red-50 border-red-200',
}

const connectorColors = {
  completed: 'bg-green-400',
  active: 'bg-[#FF8C00]',
  pending: 'bg-border',
  rejected: 'bg-red-300',
}

// The canonical 39-stage EPC workflow grouped into 7 phases
export const EPC_PHASES: WorkflowPhase[] = [
  {
    id: 1,
    label: 'Pre-Contract & Tender',
    color: '#002B49',
    bgColor: '#E8F4FD',
    borderColor: '#002B4930',
    steps: [
      { id: 1,  label: 'RFP / Opportunity Review', status: 'pending', gate: 'Proposal Manager' },
      { id: 2,  label: 'Preliminary BOQ',          status: 'pending', gate: 'Engineering Manager' },
      { id: 3,  label: 'Costing',                  status: 'pending', gate: 'Finance Manager' },
      { id: 4,  label: 'Bid / No-Bid Decision',    status: 'pending', gate: 'Commercial Director' },
      { id: 5,  label: 'Submit Proposal',           status: 'pending', gate: 'Commercial Director' },
      { id: 6,  label: 'Award',                     status: 'pending', gate: 'Tenant Admin' },
    ],
  },
  {
    id: 2,
    label: 'Contract & Project Setup',
    color: '#3944AC',
    bgColor: '#EEF0FB',
    borderColor: '#3944AC30',
    steps: [
      { id: 7,  label: 'Contract Review',          status: 'pending', gate: 'Legal Reviewer' },
      { id: 8,  label: 'Client Discussion',         status: 'pending', gate: 'Legal Reviewer' },
      { id: 9,  label: 'Contract Signing',          status: 'pending', gate: 'Engineering Manager' },
      { id: 10, label: 'Assign PM & Team',          status: 'pending', gate: 'Finance Manager' },
      { id: 11, label: 'Confirm Budget',            status: 'pending', gate: 'Supply Chain Manager' },
      { id: 12, label: 'Prepare Deliverables',      status: 'pending', gate: 'Tenant Admin' },
      { id: 13, label: 'Consultant Review',         status: 'pending', gate: 'Consultant Reviewer' },
    ],
  },
  {
    id: 3,
    label: 'Engineering & Design',
    color: '#0D9488',
    bgColor: '#E8F8F5',
    borderColor: '#0D948830',
    steps: [
      { id: 14, label: 'Studies & Requirements',   status: 'pending', gate: 'Engineering Manager' },
      { id: 15, label: 'Prepare Main BOQ',          status: 'pending', gate: 'Engineering Manager' },
      { id: 16, label: 'Drawings & Submittals',     status: 'pending', gate: 'QA/QC Manager' },
      { id: 17, label: 'Consultant Review',         status: 'pending', gate: 'Consultant Reviewer' },
      { id: 18, label: 'Update BOQ',               status: 'pending', gate: 'Engineering Manager' },
      { id: 19, label: 'Construction Drawings',     status: 'pending', gate: 'Engineering Manager' },
      { id: 20, label: 'IFC Issue',                status: 'pending', gate: 'Consultant Reviewer' },
    ],
  },
  {
    id: 4,
    label: 'Procurement & Supply Chain',
    color: '#C9A84C',
    bgColor: '#FFF8E1',
    borderColor: '#C9A84C30',
    steps: [
      { id: 21, label: 'Vendor List / RFQ',         status: 'pending', gate: 'Supply Chain Manager' },
      { id: 22, label: 'Quotations',                status: 'pending', gate: 'Supply Chain Manager' },
      { id: 23, label: 'Committee Approval',        status: 'pending', gate: 'Procurement Committee' },
      { id: 24, label: 'Issue PO',                  status: 'pending', gate: 'Finance Manager' },
      { id: 25, label: 'Shipping',                  status: 'pending', gate: 'Supply Chain Manager' },
      { id: 26, label: 'Site Inspection',           status: 'pending', gate: 'Engineering Manager' },
      { id: 27, label: 'Material Classification',   status: 'pending', gate: 'Supply Chain Manager' },
    ],
  },
  {
    id: 5,
    label: 'Construction Planning & Execution',
    color: '#FF8C00',
    bgColor: '#FFF3E0',
    borderColor: '#FF8C0030',
    steps: [
      { id: 28, label: 'Identify SOW & Phases',    status: 'pending', gate: 'Construction Manager' },
      { id: 29, label: 'Execution / HSE / QA-QC Plans', status: 'pending', gate: 'HSE Manager' },
      { id: 30, label: 'Subcontractor RFQ',         status: 'pending', gate: 'Construction Manager' },
      { id: 31, label: 'Subcontractor Contract',    status: 'pending', gate: 'Legal Reviewer' },
      { id: 32, label: 'Start Construction',        status: 'pending', gate: 'Construction Manager' },
      { id: 33, label: 'Inspection / NCR',          status: 'pending', gate: 'QA/QC Manager' },
      { id: 34, label: 'Milestone Update',          status: 'pending', gate: 'Construction Manager' },
      { id: 35, label: 'Variation Order',           status: 'pending', gate: 'Tenant Admin' },
      { id: 36, label: 'Finish Construction',       status: 'pending', gate: 'Construction Manager' },
    ],
  },
  {
    id: 6,
    label: 'Finance & Commercial Control',
    color: '#16A34A',
    bgColor: '#F0FDF4',
    borderColor: '#16A34A30',
    steps: [
      { id: 37, label: 'Revenue Validation',        status: 'pending', gate: 'Finance Manager' },
      { id: 38, label: 'Issue Invoice',             status: 'pending', gate: 'Finance Manager' },
      { id: 39, label: 'Client Follow-Up',          status: 'pending', gate: 'Finance Manager' },
      { id: 40, label: 'Payment Check',             status: 'pending', gate: 'Finance Manager' },
      { id: 41, label: 'Vendor Payment Request',    status: 'pending', gate: 'Supply Chain Manager' },
      { id: 42, label: 'Payment Validation',        status: 'pending', gate: 'Finance Manager' },
      { id: 43, label: 'Payment Proceed',           status: 'pending', gate: 'Commercial Controller' },
    ],
  },
  {
    id: 7,
    label: 'Testing, Commissioning & Handover',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#7C3AED30',
    steps: [
      { id: 44, label: 'Submit T&C Plan',           status: 'pending', gate: 'T&C Manager' },
      { id: 45, label: 'Consultant Review',         status: 'pending', gate: 'Consultant Reviewer' },
      { id: 46, label: 'Start T&C',                status: 'pending', gate: 'T&C Manager' },
      { id: 47, label: 'Submit T&C Report',         status: 'pending', gate: 'QA/QC Manager' },
      { id: 48, label: 'Final Consultant Review',   status: 'pending', gate: 'Consultant Reviewer' },
      { id: 49, label: 'PAC Certificate',           status: 'pending', gate: 'Client Representative' },
      { id: 50, label: 'End / Closeout',            status: 'pending', gate: 'Tenant Admin' },
    ],
  },
]

// Given a current step ID (1-50), derive status for all steps
export function deriveStepStatuses(
  phases: WorkflowPhase[],
  currentStepId: number,
  rejectedStepId?: number
): WorkflowPhase[] {
  return phases.map(phase => ({
    ...phase,
    steps: phase.steps.map(step => {
      let status: StepStatus = 'pending'
      if (rejectedStepId && step.id === rejectedStepId) status = 'rejected'
      else if (step.id < currentStepId) status = 'completed'
      else if (step.id === currentStepId) status = 'active'
      return { ...step, status }
    }),
  }))
}

export function WorkflowTimeline({ steps, phases, orientation = 'horizontal', variant = 'simple', className }: WorkflowTimelineProps) {

  // Phased variant — shows all 7 phases with their sub-steps
  if (variant === 'phased' && phases) {
    return <PhasedTimeline phases={phases} className={className} />
  }

  // Simple vertical variant
  if (orientation === 'vertical' && steps) {
    return (
      <div className={cn('space-y-0', className)}>
        {steps.map((step, index) => {
          const Icon = statusIcons[step.status]
          const isLast = index === steps.length - 1
          return (
            <div key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn('w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10', statusColors[step.status])}>
                  <Icon className="w-4 h-4" />
                </div>
                {!isLast && <div className={cn('w-0.5 flex-1 min-h-[24px] my-1', connectorColors[step.status])} />}
              </div>
              <div className="pb-6 flex-1 min-w-0">
                <p className={cn('text-sm font-medium', step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground')}>{step.label}</p>
                {step.assignee && <p className="text-xs text-muted-foreground mt-0.5">{step.assignee}</p>}
                {step.date && <p className="text-xs text-muted-foreground mt-0.5">{step.date}</p>}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Simple horizontal variant (default)
  if (!steps) return null
  return (
    <div className={cn('flex items-start', className)}>
      {steps.map((step, index) => {
        const Icon = statusIcons[step.status]
        const isLast = index === steps.length - 1
        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn('w-8 h-8 rounded-full border-2 flex items-center justify-center', statusColors[step.status])}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1.5 text-center max-w-[80px] leading-tight">{step.label}</span>
            </div>
            {!isLast && <div className={cn('h-0.5 flex-1 mx-1 mt-[-16px]', connectorColors[step.status])} />}
          </div>
        )
      })}
    </div>
  )
}

// Required documents per step (representative subset)
export const stepRequiredDocs: Record<number, string[]> = {
  1:  ['RFP Package', 'Opportunity Assessment Form'],
  2:  ['Preliminary BOQ Template', 'Material Quantity Survey'],
  3:  ['Cost Estimation Sheet', 'Risk Contingency Matrix'],
  4:  ['Bid / No-Bid Decision Form', 'Commercial Risk Summary'],
  5:  ['Proposal Cover Letter', 'Technical Submission Pack'],
  6:  ['Letter of Award', 'Acceptance Notice'],
  7:  ['Draft Contract', 'Scope of Work Annex'],
  8:  ['Meeting Minutes', 'Client Correspondence Log'],
  9:  ['Signed Contract', 'Performance Bond'],
  10: ['Team Assignment Letter', 'Org Chart'],
  11: ['Approved Budget Sheet', 'Finance Memo'],
  12: ['Deliverables Register', 'Project Schedule'],
  13: ['Consultant Appointment Letter', 'Review Report'],
  14: ['Engineering Studies Report', 'Site Assessment'],
  15: ['Main BOQ', 'Material Takeoff Sheet'],
  16: ['Drawing Register', 'Submittal Log'],
  17: ['Consultant Review Response', 'Comment Register'],
  18: ['Updated BOQ', 'Change Log'],
  19: ['Construction Drawings Package', 'As-Built Baseline'],
  20: ['IFC Drawing Package', 'Transmittal Sheet'],
  21: ['Vendor Prequalification List', 'RFQ Package'],
  22: ['Quotation Comparison Matrix', 'Technical Evaluation'],
  23: ['Committee Meeting Minutes', 'Approval Form'],
  24: ['Purchase Orders', 'PO Register'],
  25: ['Shipping Manifest', 'Freight Documents'],
  26: ['Site Inspection Report', 'Inspection Checklist'],
  27: ['Material Classification Register', 'Site Storage Log'],
  28: ['SOW Register', 'Work Package Schedule'],
  29: ['HSE Plan', 'QA/QC Plan', 'Execution Plan'],
  30: ['Subcontractor RFQ', 'Pre-qualification Forms'],
  31: ['Subcontractor Contract', 'Performance Bond'],
  32: ['Construction Start Notice', 'Mobilisation Plan'],
  33: ['Inspection Reports', 'NCR Register'],
  34: ['Milestone Progress Report', 'S-Curve Update'],
  35: ['Variation Order Form', 'Cost Impact Assessment'],
  36: ['Construction Completion Certificate', 'Punch List'],
  37: ['Revenue Validation Report', 'Invoice Schedule'],
  38: ['Invoice', 'Supporting Documents'],
  39: ['Follow-Up Log', 'Correspondence Record'],
  40: ['Payment Confirmation', 'Bank Receipt'],
  41: ['Vendor Payment Request', 'Supporting Invoices'],
  42: ['Payment Validation Form', 'Audit Trail'],
  43: ['Payment Proceed Authorisation', 'Transfer Confirmation'],
  44: ['T&C Plan', 'Test Procedures'],
  45: ['Consultant Review Report', 'Comment Register'],
  46: ['T&C Start Notice', 'System Test Sheets'],
  47: ['T&C Report', 'Test Results Summary'],
  48: ['Final Review Report', 'Punch List Clearance'],
  49: ['PAC Certificate', 'Defects List'],
  50: ['Project Closeout Report', 'Final Account Statement'],
}

// ─── Phased 39-step timeline ────────────────────────────────────────────────
function PhasedTimeline({ phases, className }: { phases: WorkflowPhase[]; className?: string }) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)

  // Compute overall progress
  const allSteps = phases.flatMap(p => p.steps)
  const completedCount = allSteps.filter(s => s.status === 'completed').length
  const activeStep = allSteps.find(s => s.status === 'active')
  const totalSteps = allSteps.length

  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            Step {activeStep ? activeStep.id : completedCount} of {totalSteps}
          </span>
          {activeStep && (
            <span className="text-xs text-[#FF8C00] font-medium">
              — {activeStep.label}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {Math.round((completedCount / totalSteps) * 100)}% complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-1.5 mb-4">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-[#002B49] to-[#3944AC] transition-all duration-500"
          style={{ width: `${(completedCount / totalSteps) * 100}%` }}
        />
      </div>

      {/* Phase rows */}
      {phases.map(phase => {
        const phaseCompleted = phase.steps.filter(s => s.status === 'completed').length
        const phaseActive = phase.steps.find(s => s.status === 'active')
        const phaseStatus: StepStatus = phaseActive
          ? 'active'
          : phaseCompleted === phase.steps.length
          ? 'completed'
          : phaseCompleted > 0
          ? 'active'
          : 'pending'
        const isExpanded = expandedPhase === phase.id
        const Icon = statusIcons[phaseStatus]

        return (
          <div key={phase.id} className="border border-border rounded-xl overflow-hidden">
            {/* Phase header row */}
            <button
              onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
            >
              {/* Phase number badge */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{ background: phase.bgColor, color: phase.color, border: `1.5px solid ${phase.borderColor}` }}
              >
                {phase.id}
              </div>

              {/* Phase label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{phase.label}</span>
                  {phaseStatus === 'active' && (
                    <span className="text-[10px] font-bold bg-[#FFF3E0] text-[#FF8C00] border border-[#FF8C00]/20 px-1.5 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 max-w-[180px] bg-muted rounded-full h-1">
                    <div
                      className="h-1 rounded-full transition-all"
                      style={{
                        width: `${(phaseCompleted / phase.steps.length) * 100}%`,
                        background: phase.color,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {phaseCompleted}/{phase.steps.length} steps
                  </span>
                </div>
              </div>

              {/* Status icon */}
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={{ color: phaseStatus === 'completed' ? '#16A34A' : phaseStatus === 'active' ? '#FF8C00' : '#94A3B8' }}
              />
            </button>

            {/* Expanded steps */}
              {isExpanded && (
              <div className="border-t border-border divide-y divide-border bg-muted/20">
                {phase.steps.map((step, idx) => {
                  const StepIcon = statusIcons[step.status]
                  const isLast = idx === phase.steps.length - 1
                  const isStepSelected = selectedStep === step.id
                  const docs = stepRequiredDocs[step.id] || []
                  return (
                    <div key={step.id}>
                      {/* Step row — clickable */}
                      <button
                        onClick={() => setSelectedStep(isStepSelected ? null : step.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
                      >
                        <div className="flex flex-col items-center self-stretch">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                              statusColors[step.status]
                            )}
                          >
                            <StepIcon className="w-3 h-3" />
                          </div>
                          {!isLast && (
                            <div className={cn('w-0.5 flex-1 my-0.5', connectorColors[step.status])} style={{ minHeight: 8 }} />
                          )}
                        </div>
                        <div className="flex-1 py-0.5 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                'text-xs font-medium',
                                step.status === 'active'
                                  ? 'text-[#FF8C00]'
                                  : step.status === 'completed'
                                  ? 'text-foreground'
                                  : 'text-muted-foreground'
                              )}
                            >
                              <span className="font-mono text-[10px] mr-1.5 opacity-60">#{step.id}</span>
                              {step.label}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {step.gate && (
                                <span className="text-[10px] text-muted-foreground bg-background border border-border px-1.5 py-0.5 rounded hidden sm:inline">
                                  {step.gate}
                                </span>
                              )}
                              <span className={cn('text-[10px] transition-transform', isStepSelected ? 'rotate-180' : '')}>▾</span>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Step detail panel */}
                      {isStepSelected && (
                        <div className="mx-4 mb-3 border border-border rounded-xl bg-card overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
                            <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                              Step {step.id} — {step.label}
                            </span>
                            <span className={cn('text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full', {
                              'bg-green-50 text-green-700': step.status === 'completed',
                              'bg-[#FFF3E0] text-[#FF8C00]': step.status === 'active',
                              'bg-muted text-muted-foreground': step.status === 'pending',
                              'bg-red-50 text-red-600': step.status === 'rejected',
                            })}>
                              {step.status}
                            </span>
                          </div>
                          <div className="p-4 space-y-3">
                            {/* Gate / Approver */}
                            {step.gate && (
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Approval Gate</p>
                                  <p className="text-xs font-semibold text-foreground">{step.gate}</p>
                                </div>
                              </div>
                            )}
                            {/* Required documents */}
                            {docs.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                  <p className="text-[10px] font-semibold text-foreground">Required Documents</p>
                                </div>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {docs.map(d => (
                                    <li key={d} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                      <span className="w-1 h-1 rounded-full bg-[#3944AC] flex-shrink-0" />
                                      {d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {/* Action buttons for active/pending steps */}
                            {(step.status === 'active' || step.status === 'pending') && (
                              <div className="flex gap-2 pt-1 border-t border-border">
                                <button className="flex-1 text-[10px] font-semibold text-white bg-[#FF8C00] hover:bg-[#e07d00] py-1.5 rounded-lg transition-colors">
                                  {step.status === 'active' ? 'Mark Complete' : 'Set as Active'}
                                </button>
                                <button className="flex-1 text-[10px] font-semibold text-[#3944AC] bg-[#EEF0FB] hover:bg-[#dde1f8] border border-[#3944AC]/20 py-1.5 rounded-lg transition-colors">
                                  Request Approval
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
