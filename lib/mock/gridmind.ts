// ─────────────────────────────────────────────────────────────────────────────
// GridMind EPC — Mock Domain Data
//
// Typed, deterministic sample data for the AI Intelligence workspaces and the
// Stage Gates / Changes & Claims / Knowledge Base modules. No database or live
// API is used — this mirrors the PRD's v0 prototype approach so the screens are
// fully interactive for demos.
// ─────────────────────────────────────────────────────────────────────────────

export type HealthStatus = 'green' | 'amber' | 'red'
export type Trend = 'up' | 'down' | 'flat'

// ─── Portfolio / Executive ───────────────────────────────────────────────────

export interface PortfolioKpi {
  id: string
  label: string
  value: string
  delta: string
  trend: Trend
  status: HealthStatus
}

/** Format a monetary number for display. Currency code defaults to 'SAR'. */
export function fmtSAR(n: number, currency = 'SAR'): string {
  const ccy = currency || 'SAR'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${ccy} ${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000)     return `${sign}${ccy} ${Math.round(abs / 1_000_000)}M`
  return `${sign}${ccy} ${Math.round(abs / 1_000)}K`
}

export const portfolioKpis: PortfolioKpi[] = [
  // _portfolioContractValue is patched below after projects is declared
  { id: 'contract-value', label: 'Total Contract Value', value: '—', delta: '+6.2%', trend: 'up', status: 'green' },
  { id: 'margin', label: 'Portfolio Margin', value: '11.4%', delta: '-0.8%', trend: 'down', status: 'amber' },
  { id: 'cpi', label: 'Weighted CPI', value: '0.96', delta: '-0.03', trend: 'down', status: 'amber' },
  { id: 'spi', label: 'Weighted SPI', value: '0.92', delta: '-0.05', trend: 'down', status: 'red' },
  // Net cash = sum of (EV - AC) across all EVM projects; computed after evmMetrics is defined below.
  // Placeholder resolved via a module-level IIFE after evmMetrics declaration — see _netCash below.
  { id: 'cash', label: 'Net Cash Position', value: '—', delta: '—', trend: 'up', status: 'green' },
  { id: 'safety', label: 'LTIFR (12-mo)', value: '0.31', delta: '-0.09', trend: 'up', status: 'green' },
]

export interface ProjectHealth {
  id: string
  name: string
  client: string
  capacityMwp: number
  phase: string
  progress: number // 0-100
  cpi: number
  spi: number
  status: HealthStatus
  contractValueSAR: number  // plain SAR — formatted at render time
  currentGate: string
  daysToNextGate: number
  openRisks: number
  region: string
}

export const projects: ProjectHealth[] = [
  { id: 'NEOM-04', name: 'NEOM Solar Farm',        client: 'NEOM Green Energy', capacityMwp: 400, phase: 'Construction',       progress: 62, cpi: 0.94, spi: 0.89, status: 'amber', contractValueSAR: 1_420_000_000, currentGate: 'G5', daysToNextGate: 34, openRisks: 7, region: 'Tabuk'   },
  { id: 'JED-SUB', name: 'Jeddah 380kV Substation', client: 'SEC',              capacityMwp: 0,   phase: 'Construction',       progress: 48, cpi: 0.91, spi: 0.85, status: 'red',   contractValueSAR:   640_000_000, currentGate: 'G5', daysToNextGate: 12, openRisks: 9, region: 'Makkah' },
  { id: 'SUD-PV',  name: 'Sudair PV Extension',     client: 'ACWA Power',      capacityMwp: 700, phase: 'Procurement',        progress: 28, cpi: 1.02, spi: 0.98, status: 'green', contractValueSAR: 1_880_000_000, currentGate: 'G4', daysToNextGate: 21, openRisks: 4, region: 'Riyadh' },
  { id: 'YAN-BESS',name: 'Yanbu BESS 250MWh',       client: 'Marafiq',         capacityMwp: 0,   phase: 'Engineering',        progress: 71, cpi: 1.01, spi: 1.03, status: 'green', contractValueSAR:   512_000_000, currentGate: 'G3', daysToNextGate: 8,  openRisks: 3, region: 'Madinah'},
  { id: 'DMM-OM',  name: 'Dammam O&M Retrofit',     client: 'Aramco',          capacityMwp: 120, phase: 'Testing & Handover', progress: 93, cpi: 0.98, spi: 0.96, status: 'amber', contractValueSAR:   360_000_000, currentGate: 'G7', daysToNextGate: 5,  openRisks: 2, region: 'Eastern'},
]

export interface ExecDecision {
  id: string
  title: string
  context: string
  urgency: 'high' | 'medium' | 'low'
  owner: string
  due: string
  project: string
}

export const execDecisions: ExecDecision[] = [
  { id: 'DEC-101', title: 'Approve SAR 48M variation for Jeddah rock excavation', context: 'Unforeseen ground conditions in Zone B require revised foundation design. Client VO submitted; margin impact -1.2%.', urgency: 'high', owner: 'CEO', due: 'In 3 days', project: 'Jeddah 380kV Substation' },
  { id: 'DEC-102', title: 'Release long-lead transformer PO for NEOM', context: 'ABB 18-week lead time threatens G5 gate. Committing now protects COD; SAR 92M commitment.', urgency: 'high', owner: 'CPO', due: 'In 5 days', project: 'NEOM Solar Farm' },
  { id: 'DEC-103', title: 'Rebalance BESS resource plan', context: 'Yanbu is 3% ahead; reallocating 2 commissioning engineers to Dammam handover recommended.', urgency: 'medium', owner: 'COO', due: 'In 9 days', project: 'Yanbu BESS 250MWh' },
]

export interface RiskCell {
  id: string
  title: string
  probability: 1 | 2 | 3 | 4 | 5
  impact: 1 | 2 | 3 | 4 | 5
  project: string
  category: string
}

export const portfolioRisks: RiskCell[] = [
  { id: 'R-01', title: 'Transformer delivery delay', probability: 3, impact: 5, project: 'NEOM Solar Farm', category: 'Procurement' },
  { id: 'R-02', title: 'Jeddah rock excavation overrun', probability: 4, impact: 4, project: 'Jeddah 380kV Substation', category: 'Technical' },
  { id: 'R-03', title: 'FX exposure on imported modules', probability: 3, impact: 3, project: 'Sudair PV Extension', category: 'Financial' },
  { id: 'R-04', title: 'Grid connection approval delay', probability: 2, impact: 5, project: 'NEOM Solar Farm', category: 'Regulatory' },
  { id: 'R-05', title: 'Commissioning resource shortfall', probability: 3, impact: 2, project: 'Dammam O&M Retrofit', category: 'Schedule' },
  { id: 'R-06', title: 'Subcontractor liquidity concern', probability: 2, impact: 4, project: 'Jeddah 380kV Substation', category: 'Commercial' },
]

// ─── Delivery Intelligence ─────────────────────────────────────────────────────

export interface GateReadiness {
  gate: string
  label: string
  project: string
  readiness: number // 0-100
  blockers: number
  status: HealthStatus
  target: string
}

export const gateReadiness: GateReadiness[] = [
  { gate: 'G5', label: 'Construction Complete', project: 'NEOM Solar Farm', readiness: 68, blockers: 3, status: 'amber', target: 'Aug 30' },
  { gate: 'G5', label: 'Construction Complete', project: 'Jeddah 380kV Substation', readiness: 41, blockers: 6, status: 'red', target: 'Aug 8' },
  { gate: 'G4', label: 'Procurement Complete', project: 'Sudair PV Extension', readiness: 82, blockers: 1, status: 'green', target: 'Aug 17' },
  { gate: 'G3', label: 'Design Freeze', project: 'Yanbu BESS 250MWh', readiness: 90, blockers: 0, status: 'green', target: 'Aug 4' },
  { gate: 'G7', label: 'Testing & Commissioning', project: 'Dammam O&M Retrofit', readiness: 74, blockers: 2, status: 'amber', target: 'Aug 1' },
]

export interface Deliverable {
  id: string
  title: string
  discipline: string
  project: string
  dueDate: string
  status: 'missing' | 'overdue' | 'at-risk' | 'submitted'
  owner: string
}

export const missingDeliverables: Deliverable[] = [
  { id: 'DLV-201', title: 'IFC Single-Line Diagram Rev C', discipline: 'Electrical', project: 'Jeddah 380kV Substation', dueDate: 'Jul 4', status: 'overdue', owner: 'K. Al-Dosari' },
  { id: 'DLV-202', title: 'Foundation Load Test Report Zone B', discipline: 'Civil', project: 'Jeddah 380kV Substation', dueDate: 'Jul 9', status: 'overdue', owner: 'S. Haddad' },
  { id: 'DLV-203', title: 'Transformer FAT Certificate', discipline: 'Procurement', project: 'NEOM Solar Farm', dueDate: 'Jul 15', status: 'at-risk', owner: 'M. Al-Qahtani' },
  { id: 'DLV-204', title: 'Cable Pulling Method Statement', discipline: 'Construction', project: 'NEOM Solar Farm', dueDate: 'Jul 12', status: 'missing', owner: 'F. Nasser' },
  { id: 'DLV-205', title: 'Commissioning Test Pack V.1', discipline: 'T&C', project: 'Dammam O&M Retrofit', dueDate: 'Jul 11', status: 'at-risk', owner: 'A. Farouk' },
]

// ─── Controls Intelligence (EVM) ───────────────────────────────────────────────

export interface EvmMetric {
  id: string
  project: string
  bac: number // budget at completion (SAR)
  ev: number  // earned value (SAR)
  pv: number  // planned value (SAR)
  ac: number  // actual cost (SAR)
  cpi: number
  spi: number
  eac: number // estimate at completion (SAR)
  vac: number // variance at completion (SAR — negative = overrun)
  status: HealthStatus
}

export const evmMetrics: EvmMetric[] = [
  { id: 'EVM-NEOM', project: 'NEOM Solar Farm',        bac: 1_240_000_000, ev: 769_000_000, pv: 864_000_000, ac: 818_000_000, cpi: 0.94, spi: 0.89, eac: 1_320_000_000, vac:  -79_000_000, status: 'amber' },
  { id: 'EVM-JED',  project: 'Jeddah 380kV Substation',bac:   558_000_000, ev: 268_000_000, pv: 315_000_000, ac: 294_000_000, cpi: 0.91, spi: 0.85, eac:   613_000_000, vac:  -55_000_000, status: 'red'   },
  { id: 'EVM-SUD',  project: 'Sudair PV Extension',    bac: 1_640_000_000, ev: 459_000_000, pv: 468_000_000, ac: 450_000_000, cpi: 1.02, spi: 0.98, eac: 1_610_000_000, vac:  +32_000_000, status: 'green' },
  { id: 'EVM-YAN',  project: 'Yanbu BESS 250MWh',      bac:   448_000_000, ev: 318_000_000, pv: 309_000_000, ac: 315_000_000, cpi: 1.01, spi: 1.03, eac:   444_000_000, vac:   +4_000_000, status: 'green' },
]

// Patch Total Contract Value KPI — derived from projects array (declared after portfolioKpis)
{
  const total = projects.reduce((s, p) => s + p.contractValueSAR, 0)
  const kpi = portfolioKpis.find(k => k.id === 'contract-value')!
  kpi.value = fmtSAR(total)
}

// Patch Net Cash Position KPI — derived from evmMetrics (EV − AC sum = net billings vs spend)
{
  const netCash = evmMetrics.reduce((s, m) => s + (m.ev - m.ac), 0)
  const prevNetCash = netCash - 22_000_000                      // delta vs prior period
  const kpi = portfolioKpis.find(k => k.id === 'cash')!
  kpi.value = fmtSAR(netCash)
  kpi.delta = `${netCash > prevNetCash ? '+' : ''}${fmtSAR(netCash - prevNetCash)}`
}

// ─── Executive Intelligence — Gate Milestone Timeline ─────────────────────────

export interface ProjectMilestone {
  projectId: string
  project: string
  gate: string
  gateLabel: string
  daysAway: number
  targetDate: string
  status: HealthStatus
  progress: number // project-level completion %
}

export const projectMilestones: ProjectMilestone[] = [
  { projectId: 'DMM-OM',  project: 'Dammam O&M Retrofit',     gate: 'G7', gateLabel: 'T&C Complete',          daysAway: 5,  targetDate: 'Aug 1',  status: 'amber', progress: 93 },
  { projectId: 'YAN-BESS',project: 'Yanbu BESS 250MWh',       gate: 'G3', gateLabel: 'Design Freeze',         daysAway: 8,  targetDate: 'Aug 4',  status: 'green', progress: 71 },
  { projectId: 'JED-SUB', project: 'Jeddah 380kV Substation',  gate: 'G5', gateLabel: 'Construction Complete', daysAway: 12, targetDate: 'Aug 8',  status: 'red',   progress: 48 },
  { projectId: 'SUD-PV',  project: 'Sudair PV Extension',     gate: 'G4', gateLabel: 'Procurement Complete',  daysAway: 21, targetDate: 'Aug 17', status: 'green', progress: 28 },
  { projectId: 'NEOM-04', project: 'NEOM Solar Farm',         gate: 'G5', gateLabel: 'Construction Complete', daysAway: 34, targetDate: 'Aug 30', status: 'amber', progress: 62 },
]

// ─── Delivery Intelligence — Discipline Health Matrix ─────────────────────────

export interface DisciplineMetric {
  discipline: string
  overdue: number
  atRisk: number
  onTime: number
}

export const disciplineMetrics: DisciplineMetric[] = [
  { discipline: 'Electrical',            overdue: 2, atRisk: 1, onTime: 5 },
  { discipline: 'Civil / Structural',    overdue: 1, atRisk: 2, onTime: 4 },
  { discipline: 'Procurement',           overdue: 0, atRisk: 2, onTime: 6 },
  { discipline: 'Construction',          overdue: 1, atRisk: 1, onTime: 3 },
  { discipline: 'Testing & Commissioning', overdue: 0, atRisk: 2, onTime: 2 },
  { discipline: 'HSE',                   overdue: 0, atRisk: 0, onTime: 6 },
]

// ─── Controls Intelligence — Cost Forecast Comparison ─────────────────────────

export interface CostForecast {
  projectId: string
  project: string
  bacM: number   // Budget at Completion (SAR M)
  eacM: number   // Estimate at Completion (SAR M)
  spentM: number // Actual cost to date (SAR M)
  vacM: number   // Variance at Completion — negative = overrun
}

export const costForecasts: CostForecast[] = [
  { projectId: 'NEOM-04',  project: 'NEOM Solar Farm',         bacM: 1240, eacM: 1319, spentM: 818, vacM: -79  },
  { projectId: 'JED-SUB',  project: 'Jeddah 380kV',            bacM: 558,  eacM: 613,  spentM: 294, vacM: -55  },
  { projectId: 'SUD-PV',   project: 'Sudair PV Extension',     bacM: 1640, eacM: 1608, spentM: 450, vacM:  32  },
  { projectId: 'YAN-BESS', project: 'Yanbu BESS',              bacM: 448,  eacM: 444,  spentM: 315, vacM:   4  },
  { projectId: 'DMM-OM',   project: 'Dammam O&M',              bacM: 360,  eacM: 352,  spentM: 333, vacM:   8  },
]

// ─── Stage Gates ───────────────────────────────────────────────────────────────

export interface StageGate {
  id: string
  code: string // G0..G8
  name: string
  description: string
  phase: string
}

export const stageGateDefinitions: StageGate[] = [
  { id: 'g0', code: 'G0', name: 'Opportunity Screen', description: 'Bid/no-bid decision, strategic fit, and preliminary risk screen.', phase: 'Pre-Contract' },
  { id: 'g1', code: 'G1', name: 'Bid Authorisation', description: 'Tender strategy, cost estimate baseline, and bid approval.', phase: 'Pre-Contract' },
  { id: 'g2', code: 'G2', name: 'Contract Award', description: 'Contract execution, mobilisation plan, and baseline handover.', phase: 'Contract Setup' },
  { id: 'g3', code: 'G3', name: 'Design Freeze', description: 'IFC design complete, interfaces resolved, design risk closed.', phase: 'Engineering' },
  { id: 'g4', code: 'G4', name: 'Procurement Complete', description: 'All long-lead POs placed, vendor data received, logistics locked.', phase: 'Procurement' },
  { id: 'g5', code: 'G5', name: 'Construction Complete', description: 'Mechanical completion, punch list managed, ready for energisation.', phase: 'Construction' },
  { id: 'g6', code: 'G6', name: 'Energisation', description: 'Grid connection, back-energisation, and SCADA integration.', phase: 'Construction' },
  { id: 'g7', code: 'G7', name: 'Testing & Commissioning', description: 'Performance testing, reliability run, and provisional acceptance.', phase: 'Testing & Handover' },
  { id: 'g8', code: 'G8', name: 'Final Handover', description: 'Final acceptance, warranty transfer, and O&M mobilisation.', phase: 'Testing & Handover' },
]

export interface GateApprover {
  role: string
  name: string
  status: 'approved' | 'pending' | 'overdue'
  dueIn: string
}

export const gateApprovers: Record<string, GateApprover[]> = {
  G0: [
    { role: 'Business Dev Lead', name: 'B. Al-Farsi',    status: 'approved', dueIn: 'Done'     },
    { role: 'CEO',               name: 'W. Al-Mansouri', status: 'approved', dueIn: 'Done'     },
    { role: 'Risk Manager',      name: 'S. Al-Qahtani',  status: 'approved', dueIn: 'Done'     },
  ],
  G1: [
    { role: 'Bid Manager',       name: 'R. Al-Hussain',  status: 'approved', dueIn: 'Done'     },
    { role: 'Estimating Lead',   name: 'K. Nasser',      status: 'approved', dueIn: 'Done'     },
    { role: 'Risk Manager',      name: 'S. Al-Qahtani',  status: 'pending',  dueIn: '2 days'   },
    { role: 'CEO',               name: 'W. Al-Mansouri', status: 'pending',  dueIn: '3 days'   },
  ],
  G2: [
    { role: 'Legal Counsel',     name: 'A. Al-Otaibi',   status: 'approved', dueIn: 'Done'     },
    { role: 'Planning Manager',  name: 'T. Al-Ghamdi',   status: 'approved', dueIn: 'Done'     },
    { role: 'Project Manager',   name: 'A. Al-Rashidi',  status: 'pending',  dueIn: '2 days'   },
    { role: 'Finance Director',  name: 'N. Ibrahim',     status: 'approved', dueIn: 'Done'     },
  ],
  G3: [
    { role: 'Engineering Mgr',   name: 'Dr. K. Hassan',  status: 'approved', dueIn: 'Done'     },
    { role: 'Lead Engineer',     name: 'E. Al-Saud',     status: 'pending',  dueIn: '1 day'    },
    { role: 'Project Manager',   name: 'A. Al-Rashidi',  status: 'pending',  dueIn: '2 days'   },
    { role: 'Risk Manager',      name: 'S. Al-Qahtani',  status: 'approved', dueIn: 'Done'     },
  ],
  G4: [
    { role: 'Procurement Lead',  name: 'W. Al-Saud',     status: 'approved', dueIn: 'Done'     },
    { role: 'Logistics Manager', name: 'F. Nasser',      status: 'approved', dueIn: 'Done'     },
    { role: 'QA/QC Lead',        name: 'R. Al-Hussain',  status: 'pending',  dueIn: '2 days'   },
    { role: 'Contracts Manager', name: 'L. Bilal',       status: 'approved', dueIn: 'Done'     },
  ],
  G5: [
    { role: 'QA/QC Lead',        name: 'R. Al-Hussain',  status: 'pending',  dueIn: '2 days'   },
    { role: 'HSE Manager',       name: 'Y. Farouk',      status: 'approved', dueIn: 'Done'     },
    { role: 'Construction Mgr',  name: 'H. Al-Yami',     status: 'pending',  dueIn: '3 days'   },
    { role: 'Project Manager',   name: 'A. Al-Rashidi',  status: 'overdue',  dueIn: '-1 day'   },
    { role: 'Commercial Dir',    name: 'K. Bilal',       status: 'pending',  dueIn: '5 days'   },
  ],
  G6: [
    { role: 'HSE Manager',       name: 'Y. Farouk',      status: 'pending',  dueIn: '1 day'    },
    { role: 'Commissioning Lead', name: 'M. Al-Qahtani', status: 'pending',  dueIn: '2 days'   },
    { role: 'Project Manager',   name: 'A. Al-Rashidi',  status: 'overdue',  dueIn: '-2 days'  },
    { role: 'Risk Manager',      name: 'S. Al-Qahtani',  status: 'approved', dueIn: 'Done'     },
  ],
  G7: [
    { role: 'Commissioning Lead', name: 'M. Al-Qahtani', status: 'approved', dueIn: 'Done'     },
    { role: 'QA/QC Lead',        name: 'R. Al-Hussain',  status: 'pending',  dueIn: '1 day'    },
    { role: 'Training Lead',     name: 'P. Al-Farhan',   status: 'pending',  dueIn: '3 days'   },
    { role: 'Project Manager',   name: 'A. Al-Rashidi',  status: 'pending',  dueIn: '4 days'   },
    { role: 'Client Rep.',       name: 'B. Al-Mansouri', status: 'pending',  dueIn: '5 days'   },
  ],
  G8: [
    { role: 'Project Manager',   name: 'A. Al-Rashidi',  status: 'pending',  dueIn: 'TBD'      },
    { role: 'Legal Counsel',     name: 'A. Al-Otaibi',   status: 'pending',  dueIn: 'TBD'      },
    { role: 'O&M Manager',       name: 'S. Al-Khatib',   status: 'pending',  dueIn: 'TBD'      },
    { role: 'Commercial Dir',    name: 'K. Bilal',       status: 'pending',  dueIn: 'TBD'      },
    { role: 'Client Rep.',       name: 'B. Al-Mansouri', status: 'pending',  dueIn: 'TBD'      },
  ],
}

export interface GatePackItem {
  id: string
  label: string
  status: 'complete' | 'in-progress' | 'not-started'
  owner: string
}

export const gatePackChecklist: Record<string, GatePackItem[]> = {
  G0: [
    { id: 'g0-1', label: 'Bid/no-bid decision memo', status: 'complete', owner: 'Business Dev Lead' },
    { id: 'g0-2', label: 'Strategic fit assessment', status: 'complete', owner: 'CEO' },
    { id: 'g0-3', label: 'Preliminary risk screen', status: 'complete', owner: 'Risk Manager' },
    { id: 'g0-4', label: 'Resource availability check', status: 'complete', owner: 'COO' },
  ],
  G1: [
    { id: 'g1-1', label: 'Tender strategy document', status: 'complete', owner: 'Bid Manager' },
    { id: 'g1-2', label: 'Class 3 cost estimate', status: 'complete', owner: 'Estimating Lead' },
    { id: 'g1-3', label: 'Contract risk register', status: 'in-progress', owner: 'Risk Manager' },
    { id: 'g1-4', label: 'Subcontractor market survey', status: 'complete', owner: 'Procurement Lead' },
    { id: 'g1-5', label: 'Bid authorisation sign-off', status: 'in-progress', owner: 'CEO' },
  ],
  G2: [
    { id: 'g2-1', label: 'Contract signed & executed', status: 'complete', owner: 'Legal Counsel' },
    { id: 'g2-2', label: 'Project baseline schedule (L3)', status: 'complete', owner: 'Planning Manager' },
    { id: 'g2-3', label: 'Baseline cost plan issued', status: 'complete', owner: 'Cost Manager' },
    { id: 'g2-4', label: 'Mobilisation plan approved', status: 'in-progress', owner: 'Project Manager' },
    { id: 'g2-5', label: 'Insurance policies bound', status: 'complete', owner: 'Finance' },
    { id: 'g2-6', label: 'Performance bond issued', status: 'complete', owner: 'Finance' },
  ],
  G3: [
    { id: 'g3-1', label: 'IFC drawings issued (all disciplines)', status: 'complete', owner: 'Engineering Mgr' },
    { id: 'g3-2', label: 'Interface matrix closed', status: 'in-progress', owner: 'Lead Engineer' },
    { id: 'g3-3', label: 'Design risk register closed', status: 'complete', owner: 'Risk Manager' },
    { id: 'g3-4', label: 'Client design approval received', status: 'in-progress', owner: 'Project Manager' },
    { id: 'g3-5', label: 'Material take-off issued to procurement', status: 'complete', owner: 'Engineering Mgr' },
  ],
  G4: [
    { id: 'g4-1', label: 'All long-lead POs placed', status: 'complete', owner: 'Procurement Lead' },
    { id: 'g4-2', label: 'Vendor data dossier complete', status: 'in-progress', owner: 'Procurement Lead' },
    { id: 'g4-3', label: 'Logistics & import permits confirmed', status: 'complete', owner: 'Logistics Manager' },
    { id: 'g4-4', label: 'Factory acceptance tests scheduled', status: 'in-progress', owner: 'QA/QC Lead' },
    { id: 'g4-5', label: 'Subcontract awards complete', status: 'complete', owner: 'Contracts Manager' },
  ],
  G5: [
    { id: 'g5-1', label: 'Mechanical completion certificate', status: 'complete', owner: 'Construction Mgr' },
    { id: 'g5-2', label: 'Punch list categorised (A/B/C)', status: 'in-progress', owner: 'QA/QC Lead' },
    { id: 'g5-3', label: 'As-built drawings submitted', status: 'in-progress', owner: 'Engineering Mgr' },
    { id: 'g5-4', label: 'HSE close-out report', status: 'complete', owner: 'HSE Manager' },
    { id: 'g5-5', label: 'Pre-commissioning test packs', status: 'not-started', owner: 'Commissioning Lead' },
    { id: 'g5-6', label: 'Client witness sign-off schedule', status: 'not-started', owner: 'Project Manager' },
  ],
  G6: [
    { id: 'g6-1', label: 'Grid connection agreement executed', status: 'complete', owner: 'Project Manager' },
    { id: 'g6-2', label: 'Back-energisation authority permit', status: 'in-progress', owner: 'HSE Manager' },
    { id: 'g6-3', label: 'SCADA integration tested', status: 'not-started', owner: 'Commissioning Lead' },
    { id: 'g6-4', label: 'Energisation risk assessment approved', status: 'in-progress', owner: 'Risk Manager' },
    { id: 'g6-5', label: 'Client representative sign-off', status: 'not-started', owner: 'Project Manager' },
  ],
  G7: [
    { id: 'g7-1', label: 'Performance test protocol approved', status: 'complete', owner: 'Commissioning Lead' },
    { id: 'g7-2', label: 'Performance ratio test complete', status: 'in-progress', owner: 'Commissioning Lead' },
    { id: 'g7-3', label: 'Reliability run (72h / 240h)', status: 'not-started', owner: 'Commissioning Lead' },
    { id: 'g7-4', label: 'Provisional acceptance certificate', status: 'not-started', owner: 'Project Manager' },
    { id: 'g7-5', label: 'O&M handover training complete', status: 'in-progress', owner: 'Training Lead' },
    { id: 'g7-6', label: 'Snag list cleared', status: 'in-progress', owner: 'QA/QC Lead' },
  ],
  G8: [
    { id: 'g8-1', label: 'Final acceptance certificate', status: 'not-started', owner: 'Project Manager' },
    { id: 'g8-2', label: 'Warranty transfer documents', status: 'not-started', owner: 'Legal Counsel' },
    { id: 'g8-3', label: 'O&M team mobilised on-site', status: 'not-started', owner: 'O&M Manager' },
    { id: 'g8-4', label: 'Lessons learned report issued', status: 'not-started', owner: 'Project Manager' },
    { id: 'g8-5', label: 'Final account settlement', status: 'not-started', owner: 'Commercial Manager' },
    { id: 'g8-6', label: 'Project archive complete', status: 'not-started', owner: 'Document Control' },
  ],
}

// ─── Changes & Claims ────────────────────────────────────────────────────────

export interface ChangeOrder {
  id: string
  title: string
  project: string
  type: 'variation' | 'claim'
  valueSAR: number  // SAR — negative means a deduction; formatted at render with fmtSAR()
  status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected'
  submitted: string
  marginImpact: string
  scheduleImpact: string
  entitlementPct: number | null   // null = N/A for variations; 0-100 for claims
  aiNarrative: string
}

export const changeOrders: ChangeOrder[] = [
  {
    id: 'VO-003', title: 'Zone B rock excavation & revised foundations',
    project: 'Jeddah 380kV Substation', type: 'variation', valueSAR: 48_200_000,
    status: 'submitted', submitted: 'Jun 28', marginImpact: '-1.2%', scheduleImpact: '+18 days',
    entitlementPct: null,
    aiNarrative: 'Unforeseen ground conditions confirmed by geotechnical report dated Jun 22. Scope falls outside contract baseline. High probability of client acceptance.',
  },
  {
    id: 'VO-007', title: 'Additional MV switchgear bays',
    project: 'NEOM Solar Farm', type: 'variation', valueSAR: 12_600_000,
    status: 'under-review', submitted: 'Jul 2', marginImpact: '+0.3%', scheduleImpact: '+4 days',
    entitlementPct: null,
    aiNarrative: 'Client instruction letter CI-042 confirms scope addition. Pricing aligns with BoQ rates. Schedule impact recoverable with parallel installation sequence.',
  },
  {
    id: 'VO-009', title: 'Earthing & bonding upgrade to IEC 61936',
    project: 'Sudair PV Extension', type: 'variation', valueSAR: 6_800_000,
    status: 'approved', submitted: 'Jun 10', marginImpact: '+0.1%', scheduleImpact: '0 days',
    entitlementPct: null,
    aiNarrative: 'Regulatory change issued post-contract award. Entitlement clear under Clause 13.7. Approved by client on Jul 4.',
  },
  {
    id: 'VO-011', title: 'Scope reduction — deferred spare parts',
    project: 'Dammam O&M Retrofit', type: 'variation', valueSAR: -3_100_000,
    status: 'approved', submitted: 'May 30', marginImpact: '-0.1%', scheduleImpact: '0 days',
    entitlementPct: null,
    aiNarrative: 'Client elected to procure spare parts directly. Mutual agreement documented. No margin risk.',
  },
  {
    id: 'CLM-002', title: 'Client-caused access delay — Zone A',
    project: 'NEOM Solar Farm', type: 'claim', valueSAR: 21_900_000,
    status: 'draft', submitted: '—', marginImpact: '+0.6%', scheduleImpact: '+22 days',
    entitlementPct: 72,
    aiNarrative: 'Site diary records confirm 22-day access denial starting May 3. Comparable to decision in NEOM-01 claim. Entitlement likely under Clause 8.4; quantum requires independent QS review.',
  },
  {
    id: 'CLM-004', title: 'Prolongation costs — grid approval delay',
    project: 'Sudair PV Extension', type: 'claim', valueSAR: 8_400_000,
    status: 'submitted', submitted: 'Jun 19', marginImpact: '+0.2%', scheduleImpact: '+15 days',
    entitlementPct: 58,
    aiNarrative: 'SEC approval delayed 15 days beyond contractual milestone. Some concurrent delay risk. Entitlement partially diluted; recommend negotiated settlement at 55-60%.',
  },
  {
    id: 'CLM-006', title: 'Inflation adjustment — steel & copper Q2',
    project: 'Jeddah 380kV Substation', type: 'claim', valueSAR: 14_100_000,
    status: 'under-review', submitted: 'Jul 5', marginImpact: '+0.4%', scheduleImpact: '0 days',
    entitlementPct: 85,
    aiNarrative: 'SASO commodity indices confirm 18% steel and 24% copper increases vs. contract baseline. Clause 13.8 price adjustment formula applies. Strong entitlement position.',
  },
]

// ─── Knowledge Base ────────────────────────────────────────────────────────────

export interface KnowledgeArticle {
  id: string
  title: string
  category: string
  summary: string
  updated: string
  readMinutes: number
}

export const knowledgeArticles: KnowledgeArticle[] = [
  // Governance
  { id: 'KB-01', title: 'EPC Stage Gate Governance Manual', category: 'Governance', summary: 'Definitive guide to the G0–G8 gate process, entry/exit criteria, and approval authorities.', updated: 'Jul 1', readMinutes: 14 },
  { id: 'KB-09', title: 'Project Baseline Change Control Procedure', category: 'Governance', summary: 'How to raise, justify, approve, and log changes to the approved project baseline.', updated: 'Jun 30', readMinutes: 8 },
  { id: 'KB-14', title: 'Delegated Authority Matrix', category: 'Governance', summary: 'Spend approval thresholds, contract award limits, and variance authorities by role.', updated: 'Jun 15', readMinutes: 5 },
  // Commercial
  { id: 'KB-02', title: 'Variation & Claims Management Procedure', category: 'Commercial', summary: 'Step-by-step workflow for raising, substantiating, and settling variations and claims.', updated: 'Jun 24', readMinutes: 9 },
  { id: 'KB-10', title: 'Contract Risk Allocation Guide', category: 'Commercial', summary: 'FIDIC Silver/Yellow/Gold clause analysis and preferred risk positions for EPC contracts.', updated: 'Jun 10', readMinutes: 12 },
  { id: 'KB-15', title: 'Bonds & Guarantees Handbook', category: 'Commercial', summary: 'Performance bond, advance payment guarantee, and retention release procedures.', updated: 'May 22', readMinutes: 6 },
  // Controls
  { id: 'KB-03', title: 'EVM Reporting Standard', category: 'Controls', summary: 'How CPI, SPI, EAC, and VAC are calculated and reported across the portfolio.', updated: 'Jun 18', readMinutes: 11 },
  { id: 'KB-11', title: 'Risk Register Management Procedure', category: 'Controls', summary: 'Risk identification, scoring, response planning, and reporting cadence for EPC projects.', updated: 'Jun 6', readMinutes: 8 },
  { id: 'KB-16', title: 'Monthly Progress Report Template', category: 'Controls', summary: 'Standard MPR structure: S-curves, cash flow, EVM, KPIs, and decision log.', updated: 'May 18', readMinutes: 4 },
  // Technical
  { id: 'KB-04', title: 'Solar PV Commissioning Playbook', category: 'Technical', summary: 'Reliability run requirements, performance ratio testing, and provisional acceptance.', updated: 'Jun 12', readMinutes: 18 },
  { id: 'KB-12', title: 'HV Substation Energisation Procedure', category: 'Technical', summary: 'Safe energisation sequence, protection relay settings, and witness test requirements.', updated: 'Jun 2', readMinutes: 15 },
  { id: 'KB-17', title: 'BESS Integration & Commissioning Guide', category: 'Technical', summary: 'DC/AC integration, BMS commissioning, and grid compliance testing for utility BESS.', updated: 'May 14', readMinutes: 20 },
  // HSE
  { id: 'KB-05', title: 'HSE Incident Escalation Matrix', category: 'HSE', summary: 'Severity classification and escalation routing for site safety events.', updated: 'May 28', readMinutes: 6 },
  { id: 'KB-13', title: 'Permit to Work System Manual', category: 'HSE', summary: 'Hot work, confined space, electrical isolation, and height work permit workflows.', updated: 'May 10', readMinutes: 10 },
  { id: 'KB-18', title: 'Environmental Management Plan Template', category: 'HSE', summary: 'Dust, noise, waste, and ecological impact controls for solar and substation sites.', updated: 'Apr 30', readMinutes: 9 },
  // Procurement
  { id: 'KB-06', title: 'Procurement Long-Lead Item Register', category: 'Procurement', summary: 'Standard lead times and expediting protocols for transformers, switchgear, and cables.', updated: 'May 20', readMinutes: 7 },
  { id: 'KB-19', title: 'Subcontractor Pre-Qualification Standard', category: 'Procurement', summary: 'Evaluation criteria, financial due diligence, and approved vendor list management.', updated: 'May 5', readMinutes: 8 },
  { id: 'KB-20', title: 'Factory Acceptance Testing Protocol', category: 'Procurement', summary: 'FAT checklists for transformers, inverters, switchgear, and SCADA systems.', updated: 'Apr 22', readMinutes: 12 },
  { id: 'KB-31', title: 'Vendor Invoice Review Procedure', category: 'Procurement', summary: 'Three-way match process, payment certificate workflow, and dispute resolution for vendor invoices.', updated: 'Apr 28', readMinutes: 6 },
  { id: 'KB-32', title: 'Export Packing & Marine Insurance Guide', category: 'Procurement', summary: 'Packing specifications, bill of lading requirements, and insurance coverage for cross-border equipment shipments.', updated: 'Apr 12', readMinutes: 8 },
  // Additional Governance
  { id: 'KB-21', title: 'Gate Review Meeting Protocol', category: 'Governance', summary: 'How to chair, document, and action-close EPC gate review meetings with approval authorities.', updated: 'Jul 3', readMinutes: 6 },
  { id: 'KB-22', title: 'Document Control & Transmittal Standard', category: 'Governance', summary: 'Numbering conventions, revision control, client transmittal, and archive requirements for EPC projects.', updated: 'Jun 25', readMinutes: 7 },
  // Additional Commercial
  { id: 'KB-23', title: 'FIDIC Silver Book Guide for EPC', category: 'Commercial', summary: "Key clause analysis for Engineer's authority, variation mechanisms, and dispute avoidance under FIDIC Silver.", updated: 'Jun 28', readMinutes: 15 },
  { id: 'KB-24', title: 'Claims Substantiation Pack Template', category: 'Commercial', summary: 'Standard template for assembling daily records, correspondence chain, and quantum calculations for delay claims.', updated: 'Jun 18', readMinutes: 8 },
  // Additional Controls
  { id: 'KB-25', title: 'S-Curve Reporting Procedure', category: 'Controls', summary: 'How to plot, baseline, and trend planned vs actual S-curves for schedule and cost at Level 3.', updated: 'Jun 5', readMinutes: 5 },
  { id: 'KB-26', title: 'Cost-to-Complete Estimation Guideline', category: 'Controls', summary: 'Methods for estimating remaining work: ETC, EAC (formula and detailed re-estimate), and variance at completion.', updated: 'May 30', readMinutes: 9 },
  // Additional Technical
  { id: 'KB-27', title: 'String Inverter DC Wiring Handbook', category: 'Technical', summary: 'Cable sizing, string configuration, combiner box design, and safety labelling for utility PV DC systems.', updated: 'May 25', readMinutes: 11 },
  { id: 'KB-28', title: 'Protection Relay Settings Template', category: 'Technical', summary: 'Standard overcurrent, earth fault, and differential protection settings for 33kV and 132kV substations.', updated: 'May 8', readMinutes: 14 },
  // Additional HSE
  { id: 'KB-29', title: 'LOTO Procedure — Electrical Isolation', category: 'HSE', summary: 'Lockout-tagout workflow for MV/LV electrical isolation, verification, and re-energisation on EPC sites.', updated: 'May 2', readMinutes: 7 },
  { id: 'KB-30', title: 'Toolbox Talk Library — Construction', category: 'HSE', summary: 'Ready-to-use toolbox talks covering slips/trips, manual handling, excavation, and heat stress.', updated: 'Apr 18', readMinutes: 3 },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

export const healthColor: Record<HealthStatus, string> = {
  green: '#5A8A6A',
  amber: '#C9A55A',
  red: '#8A5A5A',
}

export const healthBg: Record<HealthStatus, string> = {
  green: 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30',
  amber: 'bg-amber-950/20 text-amber-400 border-amber-800/30',
  red: 'bg-red-950/20 text-red-400 border-red-800/30',
}

export const healthLabel: Record<HealthStatus, string> = {
  green: 'On Track',
  amber: 'Watch',
  red: 'Critical',
}
