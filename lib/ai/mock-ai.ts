// ─────────────────────────────────────────────────────────────────────────────
// GridMind EPC — Mock AI Engine
//
// Deterministic, hand-authored AI responses used across the three Intelligence
// systems (Executive, Delivery, Controls) and the Knowledge Base. These simulate
// generated narratives WITHOUT any live model call, so demos are instant and
// repeatable. Every response is clearly labelled as AI-generated in the UI.
// ─────────────────────────────────────────────────────────────────────────────

export type AISystem = 'executive' | 'delivery' | 'controls'

export interface AIBullet {
  text: string
  tone?: 'positive' | 'negative' | 'neutral'
}

export interface AIRecommendation {
  title: string
  rationale: string
  impact: string
  confidence: number // 0-1
}

export interface AISection {
  heading: string
  body?: string
  bullets?: AIBullet[]
}

export interface AIResponse {
  id: string
  system: AISystem
  prompt: string
  headline: string
  confidence: number // 0-1
  generatedAt: string
  sections: AISection[]
  recommendations: AIRecommendation[]
  sources: string[]
}

// ─── Executive Intelligence ─────────────────────────────────────────────────

const executiveResponses: Record<string, AIResponse> = {
  'portfolio-health': {
    id: 'ai-exec-1',
    system: 'executive',
    prompt: 'Summarise portfolio health for the board',
    headline: 'Portfolio is broadly on track, but two projects are pulling margin and schedule below target.',
    confidence: 0.88,
    generatedAt: 'Just now',
    sections: [
      {
        heading: 'Overall Position',
        body: 'Across 5 active projects (SAR 4.82B contract value), the weighted CPI is 0.96 and SPI is 0.92. Portfolio margin has slipped 0.8 points to 11.4%, driven almost entirely by the Jeddah substation and NEOM solar farm.',
      },
      {
        heading: 'What Is Driving the Variance',
        bullets: [
          { text: 'Jeddah 380kV is the primary drag: SPI 0.85, CPI 0.91, with a SAR 48M rock-excavation variation pending.', tone: 'negative' },
          { text: 'NEOM Solar is schedule-exposed on a long-lead transformer (18-week ABB lead time).', tone: 'negative' },
          { text: 'Sudair and Yanbu are both at or above plan and partly offset the portfolio position.', tone: 'positive' },
        ],
      },
    ],
    recommendations: [
      { title: 'Approve the Jeddah VO-003 this week', rationale: 'Delay compounds prolongation exposure at ~SAR 1.1M/week.', impact: 'Protects SAR 12M of downstream cost', confidence: 0.83 },
      { title: 'Commit the NEOM transformer PO now', rationale: 'Lead time already threatens the G5 gate date.', impact: 'Protects COD and avoids LD exposure', confidence: 0.79 },
    ],
    sources: ['EVM baseline (Jul)', 'Risk register', 'Procurement lead-time tracker'],
  },
  'cash-outlook': {
    id: 'ai-exec-2',
    system: 'executive',
    prompt: 'What is the 90-day cash outlook?',
    headline: 'Net cash stays positive across the next 90 days, with a tight window in week 6.',
    confidence: 0.81,
    generatedAt: 'Just now',
    sections: [
      { heading: 'Cash Trajectory', body: 'Net cash position of SAR 318M is projected to dip to SAR 264M in week 6 as NEOM procurement milestones and Jeddah subcontractor certifications land in the same window, before recovering on the Sudair advance payment.' },
      {
        heading: 'Sensitivities',
        bullets: [
          { text: 'A 2-week slip in the Sudair advance would reduce the week-6 trough to ~SAR 210M.', tone: 'negative' },
          { text: 'Approving CLM-002 (SAR 21.9M) would improve the trough materially.', tone: 'positive' },
        ],
      },
    ],
    recommendations: [
      { title: 'Accelerate the Sudair advance payment application', rationale: 'It is the single largest inflow in the window.', impact: 'Lifts week-6 trough by ~SAR 54M', confidence: 0.76 },
    ],
    sources: ['Treasury forecast', 'Milestone billing schedule'],
  },

  'margin-bridge': {
    id: 'ai-exec-3',
    system: 'executive',
    prompt: 'What is driving the margin shortfall?',
    headline: 'The 0.8-point margin erosion traces to Jeddah rock excavation and NEOM extended preliminaries.',
    confidence: 0.83,
    generatedAt: 'Just now',
    sections: [
      { heading: 'Margin Bridge', body: 'Portfolio margin has declined from 12.2% to 11.4%. The two primary drivers are: (1) the Jeddah VO-003 cost base growing without matching revenue recognition, and (2) NEOM\'s transformer delay extending site preliminaries.' },
      {
        heading: 'Offsetting Items',
        bullets: [
          { text: 'Sudair productivity gain (+0.2pp): CPI 1.02 generating SAR 32M favourable EAC.', tone: 'positive' },
          { text: 'Yanbu BESS running slightly ahead (+0.1pp): strong commissioning performance.', tone: 'positive' },
          { text: 'Jeddah unforeseen ground conditions (−0.8pp): the dominant margin drag.', tone: 'negative' },
          { text: 'NEOM extended preliminaries (−0.3pp): linked to transformer lead time.', tone: 'negative' },
        ],
      },
    ],
    recommendations: [
      { title: 'Submit and fast-track VO-003 approval', rationale: 'Recovers ~0.6pp of the margin erosion once approved and recognised.', impact: 'SAR 40M of recoverable margin', confidence: 0.81 },
      { title: 'Implement prelims reduction plan on NEOM', rationale: 'Reduce site overhead while transformer is in transit.', impact: 'Saves ~SAR 8M in monthly burn rate', confidence: 0.68 },
    ],
    sources: ['Cost ledger', 'EVM engine (Jul)', 'Change register'],
  },
}

// ─── Delivery Intelligence ────────────────────────────────────────────────────

const deliveryResponses: Record<string, AIResponse> = {
  'gate-readiness': {
    id: 'ai-del-1',
    system: 'delivery',
    prompt: 'Which gates are at risk and why?',
    headline: 'Jeddah G5 is the critical gate at 41% readiness with 6 open blockers.',
    confidence: 0.85,
    generatedAt: 'Just now',
    sections: [
      { heading: 'Gate Readiness Snapshot', body: 'Of the 5 upcoming gates, one is red (Jeddah G5, 41%), two are amber (NEOM G5 68%, Dammam G7 74%), and two are green (Sudair G4 82%, Yanbu G3 90%).' },
      {
        heading: 'Jeddah G5 Blockers',
        bullets: [
          { text: 'IFC Single-Line Diagram Rev C is overdue (due Jul 4).', tone: 'negative' },
          { text: 'Foundation load test report for Zone B is overdue (due Jul 9).', tone: 'negative' },
          { text: 'Punch list categorisation is still in progress.', tone: 'neutral' },
        ],
      },
    ],
    recommendations: [
      { title: 'Escalate the two overdue Jeddah deliverables', rationale: 'Both are on the G5 critical path and gate the client witness schedule.', impact: 'Unblocks ~60% of remaining gate criteria', confidence: 0.82 },
      { title: 'Pre-stage the client witness sign-off schedule', rationale: 'Currently not started; long client lead time.', impact: 'Saves ~1 week on the gate close-out', confidence: 0.7 },
    ],
    sources: ['Gate pack tracker', 'Deliverables register', 'Punch list system'],
  },
  'missing-deliverables': {
    id: 'ai-del-2',
    system: 'delivery',
    prompt: 'Summarise missing and overdue deliverables',
    headline: '5 deliverables need attention; 2 are overdue and both are on the Jeddah critical path.',
    confidence: 0.87,
    generatedAt: 'Just now',
    sections: [
      {
        heading: 'By Status',
        bullets: [
          { text: '2 overdue: IFC SLD Rev C and Zone B load test report (both Jeddah).', tone: 'negative' },
          { text: '2 at-risk: Transformer FAT certificate (NEOM) and commissioning test pack (Dammam).', tone: 'neutral' },
          { text: '1 missing: Cable pulling method statement (NEOM).', tone: 'negative' },
        ],
      },
    ],
    recommendations: [
      { title: 'Daily stand-up on Jeddah engineering deliverables', rationale: 'Two overdue items share the same discipline owner.', impact: 'Recovers ~5 days of gate slack', confidence: 0.75 },
    ],
    sources: ['Deliverables register', 'Discipline schedules'],
  },

  'schedule-recovery': {
    id: 'ai-del-3',
    system: 'delivery',
    prompt: 'How do we recover the Jeddah schedule?',
    headline: 'Jeddah can recover 10–14 days via night-shift escalation and parallel client witness scheduling.',
    confidence: 0.77,
    generatedAt: 'Just now',
    sections: [
      { heading: 'Root Cause', body: 'The 22-day schedule slip traces to Zone B foundation redesign (14 days) and two overdue engineering deliverables that are blocking the client witness sequence (8 days).' },
      {
        heading: 'Recovery Options',
        bullets: [
          { text: 'Night-shift escalation for Zone B rebar and form-work: recovers 7–10 days at +SAR 1.2M cost.', tone: 'neutral' },
          { text: 'Expedite IFC SLD Rev C and Zone B load test report to unblock client witness schedule.', tone: 'neutral' },
          { text: 'Request 5-day contractual extension via VO-003 time extension provision (entitlement clear).', tone: 'positive' },
        ],
      },
    ],
    recommendations: [
      { title: 'Escalate IFC SLD Rev C to daily stand-up', rationale: 'The single deliverable gating the client witness sign-off and 60% of G5 criteria.', impact: 'Unblocks ~60% of remaining gate criteria', confidence: 0.82 },
      { title: 'Authorise Zone B night-shift uplift', rationale: 'Fastest physical works recovery path; cost is recoverable through VO-003.', impact: 'Recovers 7–10 days of float', confidence: 0.71 },
    ],
    sources: ['Site diary', 'Critical path schedule (L3)', 'Deliverables register'],
  },
}

// ─── Controls Intelligence ────────────────────────────────────────────────────

const controlsResponses: Record<string, AIResponse> = {
  'evm-narrative': {
    id: 'ai-ctrl-1',
    system: 'controls',
    prompt: 'Explain the portfolio EVM position',
    headline: 'Cost and schedule variance are concentrated in two projects; the rest are at or above plan.',
    confidence: 0.86,
    generatedAt: 'Just now',
    sections: [
      { heading: 'Cost Performance', body: 'Weighted CPI is 0.96. Jeddah (0.91) and NEOM (0.94) are eroding value; Sudair (1.02) and Yanbu (1.01) are favourable. Portfolio VAC is roughly -SAR 98M, dominated by Jeddah at -SAR 55M.' },
      { heading: 'Schedule Performance', body: 'Weighted SPI is 0.92. Jeddah at 0.85 is the outlier and correlates directly with the two overdue engineering deliverables.' },
      {
        heading: 'Forecast',
        bullets: [
          { text: 'Jeddah EAC has grown to SAR 613M against a SAR 558M BAC.', tone: 'negative' },
          { text: 'If the VO-003 variation is approved, ~SAR 40M of the Jeddah VAC is recoverable.', tone: 'positive' },
        ],
      },
    ],
    recommendations: [
      { title: 'Re-baseline Jeddah after VO-003 approval', rationale: 'Current baseline no longer reflects the agreed scope.', impact: 'Restores meaningful CPI/SPI tracking', confidence: 0.8 },
      { title: 'Lock a cost-to-complete review on NEOM', rationale: 'CPI trend is drifting for three consecutive periods.', impact: 'Early detection of a further ~SAR 20M exposure', confidence: 0.72 },
    ],
    sources: ['EVM engine (Jul baseline)', 'Change register', 'Cost ledger'],
  },
  'commercial-exposure': {
    id: 'ai-ctrl-2',
    system: 'controls',
    prompt: 'What is our net commercial exposure?',
    headline: 'Net claims-and-variations position is favourable at roughly +SAR 39M if pending items settle as forecast.',
    confidence: 0.78,
    generatedAt: 'Just now',
    sections: [
      { heading: 'Position', body: 'Outstanding variations total SAR 57.7M and claims SAR 30.3M. Netting the Jeddah cost variation against the recoverable client-caused claims yields a favourable net position, but it depends on CLM-002 being formally submitted.' },
      {
        heading: 'Watch Items',
        bullets: [
          { text: 'CLM-002 (SAR 21.9M) is still in draft — the largest unrealised recovery.', tone: 'negative' },
          { text: 'VO-003 (SAR 48.2M) is submitted but not yet approved.', tone: 'neutral' },
        ],
      },
    ],
    recommendations: [
      { title: 'Finalise and submit CLM-002 this week', rationale: 'It is the biggest lever on net exposure and is still in draft.', impact: 'Converts SAR 21.9M from unrealised to submitted', confidence: 0.74 },
    ],
    sources: ['Change & claims register', 'Contract correspondence log'],
  },

  'cost-to-complete': {
    id: 'ai-ctrl-3',
    system: 'controls',
    prompt: 'Where is cost-to-complete risk concentrated?',
    headline: 'Jeddah and NEOM carry 93% of portfolio CTC risk; SAR 120M of EAC growth is recoverable through commercial actions.',
    confidence: 0.80,
    generatedAt: 'Just now',
    sections: [
      { heading: 'EAC Growth Decomposition', body: 'Total EAC has grown SAR 134M above portfolio BAC (SAR 4.25B → SAR 4.34B). Jeddah accounts for SAR 55M and NEOM SAR 79M. Sudair and Yanbu are running under BAC.' },
      {
        heading: 'Recoverability',
        bullets: [
          { text: 'SAR 48M of Jeddah overrun is recoverable via VO-003 (unforeseen ground conditions — strong entitlement).', tone: 'positive' },
          { text: 'SAR 21.9M of NEOM overrun is recoverable via CLM-002 (client-caused access delay — 72% entitlement).', tone: 'positive' },
          { text: 'Residual ~SAR 64M is unrecoverable productivity loss requiring active cost management to completion.', tone: 'negative' },
        ],
      },
    ],
    recommendations: [
      { title: 'Weekly CTC reviews on Jeddah', rationale: 'EAC has grown for three consecutive periods; early detection prevents further drift.', impact: 'Prevents ~SAR 15M additional overrun', confidence: 0.73 },
      { title: 'Formally submit CLM-002 before month-end', rationale: 'The largest unrealised recovery in the portfolio; currently in draft status.', impact: 'Converts SAR 21.9M to submitted recovery position', confidence: 0.79 },
    ],
    sources: ['EVM engine (Jul)', 'CTC worksheets', 'Change register'],
  },
}

// ─── Knowledge Base Q&A ────────────────────────────────────────────────────────

const knowledgeAnswers: Record<string, AIResponse> = {
  variation: {
    id: 'ai-kb-1',
    system: 'delivery',
    prompt: 'How do I raise a variation order?',
    headline: 'Raising a variation follows a 5-step substantiation workflow defined in the Commercial procedure.',
    confidence: 0.90,
    generatedAt: 'Just now',
    sections: [
      {
        heading: 'Steps',
        bullets: [
          { text: '1. Log the change event with cause, contract clause, and supporting evidence.', tone: 'neutral' },
          { text: '2. Quantify cost and schedule impact with the controls team.', tone: 'neutral' },
          { text: '3. Obtain internal approval at the delegated authority level for the value band.', tone: 'neutral' },
          { text: '4. Submit the formal variation notice to the client within the contractual window.', tone: 'neutral' },
          { text: '5. Track to settlement and update the change register and EVM baseline.', tone: 'neutral' },
        ],
      },
    ],
    recommendations: [
      { title: 'Open the Variation & Claims Management Procedure', rationale: 'It contains the authority matrix, notice templates, and time-bar calendar.', impact: 'Ensures contractual time bars are met', confidence: 0.88 },
    ],
    sources: ['KB-02 Variation & Claims Management Procedure', 'KB-14 Delegated Authority Matrix'],
  },
  g5: {
    id: 'ai-kb-2',
    system: 'delivery',
    prompt: 'What are the G5 gate exit criteria?',
    headline: 'G5 (Construction Complete) requires mechanical completion, punch list categorisation, as-built drawings, and HSE close-out.',
    confidence: 0.93,
    generatedAt: 'Just now',
    sections: [
      {
        heading: 'Mandatory Exit Criteria',
        bullets: [
          { text: 'Mechanical completion certificate signed by Construction Manager and client witness.', tone: 'neutral' },
          { text: 'Punch list categorised: all Cat-A items cleared; Cat-B items have agreed close-out schedule.', tone: 'neutral' },
          { text: 'As-built drawings submitted in IFC format for all disciplines.', tone: 'neutral' },
          { text: 'HSE close-out report — no open critical observations.', tone: 'neutral' },
          { text: 'Pre-commissioning test packs completed and signed off by commissioning lead.', tone: 'neutral' },
        ],
      },
      { heading: 'Current Portfolio Status', body: 'NEOM Solar Farm is 68% ready (3 blockers); Jeddah 380kV is at 41% ready with 6 blockers — both are targeting G5.' },
    ],
    recommendations: [
      { title: 'Review the Stage Gate Governance Manual for full G5 checklist', rationale: 'Contains client-specific addenda and authority sign-off requirements.', impact: 'Prevents gate rejection due to missing evidence', confidence: 0.91 },
    ],
    sources: ['KB-01 EPC Stage Gate Governance Manual', 'Gate pack tracker'],
  },
  eac: {
    id: 'ai-kb-3',
    system: 'controls',
    prompt: 'How is EAC calculated?',
    headline: 'EAC is the forecast total project cost. The primary formula is EAC = BAC ÷ CPI, but a re-estimate method is used when performance is not expected to continue.',
    confidence: 0.95,
    generatedAt: 'Just now',
    sections: [
      {
        heading: 'Calculation Methods',
        bullets: [
          { text: 'Formula method: EAC = BAC ÷ CPI. Used when current productivity rate is expected to continue.', tone: 'neutral' },
          { text: 'Re-estimate method: EAC = AC + ETC. Used when the root cause of variance has been resolved.', tone: 'neutral' },
          { text: 'Composite method: EAC = AC + (BAC − EV) ÷ (CPI × SPI). Used for schedule-constrained projects.', tone: 'neutral' },
        ],
      },
      { heading: 'Portfolio Application', body: 'GridMind uses the formula method (BAC ÷ CPI) for all 5 active projects. Jeddah EAC = SAR 613M vs BAC SAR 558M. This means every SAR spent on Jeddah today is only returning SAR 0.91 of earned value.' },
    ],
    recommendations: [
      { title: 'Read the EVM Reporting Standard for full calculation guidance', rationale: 'Covers ETC, VAC, TCPI, and the monthly reconciliation process.', impact: 'Consistent EVM reporting across all disciplines', confidence: 0.93 },
    ],
    sources: ['KB-03 EVM Reporting Standard', 'KB-26 Cost-to-Complete Estimation Guideline'],
  },
  'hot work': {
    id: 'ai-kb-4',
    system: 'delivery',
    prompt: 'What permits are required for hot work?',
    headline: 'Hot work requires a Hot Work Permit, Permit to Work (PTW), and fire watch assignment — all renewed every 24 hours.',
    confidence: 0.91,
    generatedAt: 'Just now',
    sections: [
      {
        heading: 'Required Permits',
        bullets: [
          { text: 'Permit to Work (PTW): issued by the site HSE officer; area must be isolated and inspected.', tone: 'neutral' },
          { text: 'Hot Work Permit: counter-signed by Construction Manager and HSE Manager; valid 24 hours only.', tone: 'neutral' },
          { text: 'Fire Watch Assignment: a designated fire watch must be present during and 30 min after hot work.', tone: 'neutral' },
          { text: 'Atmosphere test: if work is within 3 metres of flammables, gas test every 2 hours.', tone: 'neutral' },
        ],
      },
    ],
    recommendations: [
      { title: 'Reference the Permit to Work System Manual', rationale: 'Contains the full hot work checklist, PTW form templates, and authority sign-off matrix.', impact: 'Ensures regulatory compliance and safe systems of work', confidence: 0.89 },
    ],
    sources: ['KB-13 Permit to Work System Manual', 'KB-05 HSE Incident Escalation Matrix'],
  },
  default: {
    id: 'ai-kb-5',
    system: 'delivery',
    prompt: 'Knowledge base query',
    headline: 'I found relevant procedures and guidance in the GridMind Knowledge Base.',
    confidence: 0.82,
    generatedAt: 'Just now',
    sections: [
      { heading: 'Guidance', body: 'Based on your question, I recommend reviewing the relevant procedure in the Knowledge Base. The EPC governance documentation covers this topic under the applicable category.' },
      {
        heading: 'Most Relevant Articles',
        bullets: [
          { text: 'KB-01 EPC Stage Gate Governance Manual — covers lifecycle process from G0 to G8.', tone: 'neutral' },
          { text: 'KB-02 Variation & Claims Management Procedure — commercial workflow and time bars.', tone: 'neutral' },
          { text: 'KB-03 EVM Reporting Standard — cost and schedule performance tracking.', tone: 'neutral' },
        ],
      },
    ],
    recommendations: [
      { title: 'Browse the Knowledge Base by category', rationale: 'The 6 categories (Governance, Commercial, Controls, Technical, HSE, Procurement) cover the full EPC lifecycle.', impact: 'Faster access to the right procedure', confidence: 0.80 },
    ],
    sources: ['GridMind Knowledge Base'],
  },
}

// ─── Public API ─────────────────────────────────────────────────────────────

const registry: Record<AISystem, Record<string, AIResponse>> = {
  executive: executiveResponses,
  delivery: deliveryResponses,
  controls: controlsResponses,
}

/** Return every canned prompt for a system as { key, prompt } pairs. */
export function getPrompts(system: AISystem): { key: string; prompt: string }[] {
  return Object.entries(registry[system]).map(([key, r]) => ({ key, prompt: r.prompt }))
}

/**
 * Simulate an AI generation. Resolves after a short, deterministic delay so the
 * UI can show a "generating" state. Falls back to the first response for the
 * system if the key is unknown.
 */
export function generateAIResponse(system: AISystem, key: string): Promise<AIResponse> {
  const bucket = registry[system]
  const response = bucket[key] ?? Object.values(bucket)[0]
  return new Promise((resolve) => setTimeout(() => resolve(response), 900))
}

/** Knowledge base Q&A — matches question text to a relevant canned response. */
export function askKnowledgeBase(question: string): Promise<AIResponse> {
  const q = question.toLowerCase()
  let key = 'default'
  if (q.includes('variation') || q.includes('variation order') || q.includes('raise a vo') || q.includes('change order')) key = 'variation'
  else if (q.includes('g5') || q.includes('gate exit') || q.includes('gate criteria') || q.includes('exit criteria')) key = 'g5'
  else if (q.includes('eac') || q.includes('estimate at completion') || q.includes('earned value') || q.includes('evm')) key = 'eac'
  else if (q.includes('hot work') || q.includes('permit') || q.includes('ptw') || q.includes('fire watch')) key = 'hot work'
  const response = knowledgeAnswers[key] ?? knowledgeAnswers.default
  return new Promise((resolve) => setTimeout(() => resolve(response), 900))
}
