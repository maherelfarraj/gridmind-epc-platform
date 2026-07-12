'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { AIResponsePanel } from '@/components/shared/ai-response-panel'
import { cn } from '@/lib/utils'
import { askKnowledgeBase, type AIResponse } from '@/lib/ai/mock-ai'
import { knowledgeArticles, type KnowledgeArticle } from '@/lib/mock/gridmind'
import {
  BookOpen,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const CATEGORIES = ['All', 'Governance', 'Commercial', 'Controls', 'Technical', 'HSE', 'Procurement'] as const
type Category = typeof CATEGORIES[number]

const categoryStyle: Record<string, { badge: string; dot: string; border: string }> = {
  Governance:  { badge: 'bg-secondary/60 text-foreground',     dot: 'bg-foreground/60', border: 'border-foreground/20'  },
  Commercial:  { badge: 'bg-amber-950/20 text-amber-400',      dot: 'bg-amber-400',     border: 'border-amber-500/20'   },
  Controls:    { badge: 'bg-secondary/60 text-primary',        dot: 'bg-primary',       border: 'border-primary/20'     },
  Technical:   { badge: 'bg-teal-950/20 text-teal-400',        dot: 'bg-teal-400',      border: 'border-teal-600/20'    },
  HSE:         { badge: 'bg-red-950/20 text-red-400',          dot: 'bg-red-400',       border: 'border-red-800/20'     },
  Procurement: { badge: 'bg-violet-950/20 text-violet-400',    dot: 'bg-violet-400',    border: 'border-violet-800/20'  },
}

const suggested = [
  'How do I raise a variation order?',
  'What are the G5 gate exit criteria?',
  'How is EAC calculated?',
  'What permits are required for hot work?',
]

// ─── Mock article content ────────────────────────────────────────────────────

interface ArticleSection { heading: string; body: string; bullets?: string[] }
interface ArticleContent { intro: string; sections: ArticleSection[]; seeAlso: string[] }

const articleContent: Record<string, ArticleContent> = {
  'KB-01': {
    intro: 'The GSI EPC Stage Gate Governance Manual defines the G0–G8 lifecycle gate framework applicable to all EPC projects above SAR 10M contract value. Each gate represents a formal decision point requiring specific exit criteria to be met before the project may proceed.',
    sections: [
      { heading: 'Gate Definitions', body: 'The GSI gate model comprises nine gates from G0 (Opportunity Screening) through G8 (Final Account Close-Out). Each gate has defined entry conditions, required documentation, an approval authority matrix, and specific exit sign-off levels based on contract value thresholds.' },
      { heading: 'Exit Criteria Framework', body: 'Exit criteria are categorised as Mandatory (must be 100% complete), Conditional (waiver requires written CEO or COO approval), and Advisory (documented in the Gate Pack for information). No gate may be passed with an outstanding Mandatory item.', bullets: ['G5 requires IFC drawings, approved BOQ Revision 3+, construction methodology, and full RAMS', 'G6 requires PAC certificate, as-built drawings Rev.0, punch list close-out ≥95%', 'G7 requires final O&M manuals, spare parts handover, FAC certificate issued'] },
      { heading: 'Approval Authorities', body: 'Gate approvals escalate by contract value. Projects under SAR 50M: approval by Project Director. SAR 50M–500M: COO sign-off. Above SAR 500M: Board Investment Committee. Emergency gate acceleration requests are submitted via the Delegated Authority Matrix procedure (KB-03).' },
    ],
    seeAlso: ['Project Baseline Change Control Procedure', 'Delegated Authority Matrix', 'Gate Pack Templates'],
  },
  'KB-02': {
    intro: 'This procedure governs how approved project baselines — scope, schedule, budget, and performance targets — may be formally revised. All baseline changes require a structured justification, impact assessment, and appropriate approval before the change is reflected in project controls systems.',
    sections: [
      { heading: 'When a Baseline Change is Required', body: 'A Baseline Change Request (BCR) is mandatory whenever any of the following occur: scope changes exceeding 2% of contract value; schedule revisions to any Level-1 milestone; budget reallocation between work packages exceeding SAR 500K; or any change affecting the critical path by more than 10 working days.', bullets: ['Client-originated changes are captured as Variation Orders first; BCR follows VO approval', 'Internal scope optimisations require BCR but not a VO', 'Force-majeure events require BCR with attached insurance notification'] },
      { heading: 'BCR Workflow', body: 'The Project Manager initiates the BCR form in the document management system, attaches supporting evidence, and routes it through the Controls Manager for impact assessment. The BCR then follows the standard approval chain as defined by the Delegated Authority Matrix. Approved BCRs are reflected in P6 and the project cost ledger within 5 working days.' },
      { heading: 'Version Control', body: 'Each approved BCR increments the project baseline version number. The Controls Manager maintains a baseline log (Rev A, B, C…) linked to each BCR. The current approved baseline is always the reference for EVM reporting.' },
    ],
    seeAlso: ['EPC Stage Gate Governance Manual', 'Delegated Authority Matrix', 'EVM Reporting Standard'],
  },
  'KB-03': {
    intro: 'The Delegated Authority Matrix (DAM) sets spend approval thresholds, contract award limits, variation approvals, and other financial authorities by role and contract value. All staff with procurement or commercial responsibilities must be familiar with their applicable DAM tier.',
    sections: [
      { heading: 'Authority Tiers', body: 'GSI operates a five-tier authority structure: Tier 1 Site Engineer (up to SAR 50K), Tier 2 Project Manager (up to SAR 500K), Tier 3 Commercial/Finance Manager (up to SAR 5M), Tier 4 COO/CFO (up to SAR 50M), Tier 5 CEO/Board (above SAR 50M or any VO above 10% contract value).', bullets: ['Subcontractor awards: Tier 3 and above', 'Emergency procurement (HSE risk): one tier above normal with ex-post ratification within 48 hours', 'Variation orders: same tiers, applied to cumulative VO value per project'] },
      { heading: 'Dual Signature Requirement', body: 'All commitments above SAR 5M require dual signature: one from the commercial authority (Tier 3+) and one from the finance authority of equal or higher tier. This applies to subcontract awards, major purchase orders, change orders, and settlement agreements.' },
    ],
    seeAlso: ['Variation & Claims Management Procedure', 'Contract Risk Allocation Guide', 'Project Baseline Change Control Procedure'],
  },
}

// Generic content generator for articles without specific content
function getArticleContent(article: KnowledgeArticle): ArticleContent {
  const specific = articleContent[article.id]
  if (specific) return specific

  // Category-based generic template
  const templates: Record<string, ArticleContent> = {
    Governance: {
      intro: `${article.summary} This procedure applies to all GSI EPC projects and forms part of the integrated project governance framework.`,
      sections: [
        { heading: 'Scope & Applicability', body: 'This document applies to all GSI EPC projects regardless of contract value, delivery model, or geographic location. Project Managers and their teams are responsible for implementing the requirements set out herein.' },
        { heading: 'Key Requirements', body: 'The key requirements of this procedure are documented in the following sections. Compliance is mandatory for all projects. Non-compliance must be formally registered as a governance deviation and approved by the COO.', bullets: ['Procedure owner: Project Director', 'Review cycle: Annual or following any significant project lesson-learned event', 'Reference standard: ISO 21502 Project Management'] },
        { heading: 'Implementation Guidance', body: 'Implementation templates, checklists, and worked examples are available in the GSI Project Management Toolkit. Teams are encouraged to adapt templates to project context while maintaining the mandatory control elements.' },
      ],
      seeAlso: ['EPC Stage Gate Governance Manual', 'Project Baseline Change Control Procedure'],
    },
    Commercial: {
      intro: `${article.summary} This procedure aligns with FIDIC Silver/Yellow/Gold contractual obligations and GSI commercial governance requirements.`,
      sections: [
        { heading: 'Commercial Framework', body: 'GSI operates under a tiered commercial approval framework. The Commercial Director is accountable for all commercial decisions and the integrity of contractual relationships with clients, subcontractors, and suppliers.' },
        { heading: 'Process Steps', body: 'The commercial process is initiated upon receipt of a client instruction, variation notice, or change event. The Commercial Manager prepares an impact assessment within 5 working days and routes it for approval per the Delegated Authority Matrix.', bullets: ['Time-bar notifications: issue within 28 days of the triggering event (FIDIC Sub-Clause 20.1)', 'Entitlement assessment: separate from quantum — establish entitlement first', 'Negotiation records: all communications logged in the commercial register'] },
        { heading: 'Documentation Requirements', body: 'All commercial events must be contemporaneously documented with site records, programme impacts, and cost substantiation. Failure to document in real time weakens the entitlement position and may result in claim disallowance.' },
      ],
      seeAlso: ['Variation & Claims Management Procedure', 'Contract Risk Allocation Guide', 'Delegated Authority Matrix'],
    },
    Controls: {
      intro: `${article.summary} EVM-based project controls are mandatory on all GSI projects with a baseline budget above SAR 20M.`,
      sections: [
        { heading: 'Earned Value Methodology', body: 'GSI applies the Earned Value Management methodology as defined in ANSI/EIA-748. The three core parameters — Planned Value (PV), Earned Value (EV), and Actual Cost (AC) — are reported monthly against the Performance Measurement Baseline (PMB).' },
        { heading: 'KPI Thresholds & Escalation', body: 'Performance index thresholds trigger mandatory escalation actions:', bullets: ['CPI < 0.90: Controls Manager prepares a corrective action plan within 5 working days', 'SPI < 0.85: Recovery schedule required, reviewed by Project Director', 'EAC variance > 5% of BAC: formal reforecast and board notification required'] },
        { heading: 'Reporting Cadence', body: 'Monthly cost reports are due by Working Day 5 of each month. The Controls Manager consolidates project-level data into the Portfolio Dashboard for PMO review by Working Day 7. Quarterly EVM audits are conducted by the Finance function.' },
      ],
      seeAlso: ['EVM Reporting Standard', 'Risk Register Management Procedure', 'Cash Flow Forecasting Guide'],
    },
    Technical: {
      intro: `${article.summary} Technical requirements conform to IEC, IEEE, and applicable Saudi national standards. All design deliverables require formal Issued for Construction (IFC) approval before site work commences.`,
      sections: [
        { heading: 'Design Review Process', body: 'All technical deliverables undergo a three-stage review: internal peer review by the Engineering Manager, client/consultant review and comment resolution, and final IFC sign-off. A design transmittal log is maintained for every document.' },
        { heading: 'Key Technical Standards', body: 'GSI projects follow the applicable standards hierarchy: project-specific specifications override, then client standards, then international standards (IEC/IEEE/ISO), then Saudi national standards (SASO), then GSI standard technical specifications.', bullets: ['Electrical: IEC 60364, IEC 61936, IEEE Std 80, SASO standards', 'Civil/Structural: ACI 318, BS 8110, site-specific geotechnical reports', 'Solar/PV: IEC 61215, IEC 62446, IEC 62716'] },
        { heading: 'Interface Management', body: 'Technical interfaces between engineering disciplines, subcontractors, and the client are managed through an Interface Register. Each interface has a defined owner, resolution deadline, and sign-off requirement. Open interfaces are reported at every Project Review Meeting.' },
      ],
      seeAlso: ['IFC Drawing Control Procedure', 'Design Review Checklist', 'Vendor Technical Review Procedure'],
    },
    HSE: {
      intro: `${article.summary} HSE compliance is non-negotiable on all GSI sites. This procedure is aligned with ISO 45001 and the GSI Zero Harm commitment.`,
      sections: [
        { heading: 'Risk Assessment Requirements', body: 'A formal RAMS (Risk Assessment & Method Statement) is required before commencing any construction activity. The RAMS must be reviewed by the HSE Officer, approved by the Construction Manager, and submitted to the client/consultant at least 72 hours before work commences.' },
        { heading: 'Permit-to-Work System', body: 'The GSI PTW system covers eight high-risk activity categories:', bullets: ['Hot Work (welding, cutting, grinding)', 'Confined Space Entry', 'Energised Electrical Work (LOTO required)', 'Working at Height above 1.8m', 'Excavation and trenching', 'Lifting Operations (crane/rigging)', 'Hazardous Substance Handling', 'Night Work and Adverse Conditions'] },
        { heading: 'Incident Reporting', body: 'All incidents — including near misses — must be reported within 4 hours of occurrence using the HSE Incident Report Form. LTIs (Lost Time Injuries) require immediate notification to the HSE Manager and client within 1 hour. A full investigation report is due within 5 working days.' },
      ],
      seeAlso: ['HSE Management Plan Template', 'Emergency Response Procedure', 'Toolbox Talk Library'],
    },
    Procurement: {
      intro: `${article.summary} GSI procurement activities follow a competitive, transparent process aligned with client requirements and local content targets.`,
      sections: [
        { heading: 'Procurement Strategy', body: 'The Procurement Manager develops a Procurement Strategy at Gate 3 (Engineering & Design entry) that identifies all major packages, preferred contracting strategies (lump sum, remeasurement, dayworks), and long-lead items requiring early action. The strategy is approved by the COO and client where required.' },
        { heading: 'Vendor Qualification', body: 'All new vendors must complete the GSI Vendor Pre-Qualification process before award. Existing approved vendors on the GSI Approved Vendor List (AVL) may proceed directly to RFQ. Vendor performance is scored after each contract and used to update AVL status.', bullets: ['Financial stability: audited accounts for last 2 years', 'Technical capability: evidence of similar works, ISO 9001 certification', 'HSE: TRIR below 1.0 for the preceding 12 months', 'Local content: IKTVA score or equivalent Saudi content commitment'] },
        { heading: 'Award Recommendation', body: 'Procurement awards are documented in an Award Recommendation Report (ARR), reviewed by the Contracts Committee, and approved per the Delegated Authority Matrix. All ARRs are retained in the Document Management System for a minimum of 7 years.' },
      ],
      seeAlso: ['Delegated Authority Matrix', 'Vendor Pre-Qualification Form', 'Subcontract Agreement Template'],
    },
  }

  return templates[article.category] ?? templates['Governance']
}

export default function KnowledgeBasePage() {
  const [query,           setQuery]           = useState('')
  const [category,        setCategory]        = useState<Category>('All')
  const [question,        setQuestion]        = useState('')
  const [loading,         setLoading]         = useState(false)
  const [answer,          setAnswer]          = useState<AIResponse | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)

  // Close slide-over on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setSelectedArticle(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase()
    return knowledgeArticles.filter((a) => {
      const matchesCat = category === 'All' || a.category === category
      const matchesQ   = !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
      return matchesCat && matchesQ
    })
  }, [query, category])

  const countByCategory = useMemo(
    () => Object.fromEntries(
      CATEGORIES.slice(1).map((c) => [c, knowledgeArticles.filter((a) => a.category === c).length])
    ),
    []
  )

  async function ask(q: string) {
    if (!q.trim()) return
    setQuestion(q)
    setLoading(true)
    setAnswer(null)
    const r = await askKnowledgeBase(q)
    setAnswer(r)
    setLoading(false)
  }

  const selectedContent = selectedArticle ? getArticleContent(selectedArticle) : null
  const relatedArticles = selectedArticle
    ? knowledgeArticles.filter((a) => a.id !== selectedArticle.id && a.category === selectedArticle.category).slice(0, 3)
    : []

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">Knowledge Base</h1>
              <p className="text-sm text-muted-foreground">EPC manuals, procedures, and AI-assisted answers</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            {(Object.entries(countByCategory) as [string, number][]).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span className={cn('w-1.5 h-1.5 rounded-full', categoryStyle[cat]?.dot ?? 'bg-muted-foreground')} />
                <span className="text-xs text-muted-foreground">{cat}</span>
                <span className="text-xs font-semibold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: article browser */}
          <div className="lg:col-span-2 space-y-4">

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search manuals and procedures…"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            {/* Category filter strip */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                    category === c
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                  )}
                >
                  {c}
                  {c !== 'All' && (
                    <span className="ml-1.5 opacity-60">{countByCategory[c]}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Article grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredArticles.map((a) => {
                const s = categoryStyle[a.category]
                const isSelected = selectedArticle?.id === a.id
                return (
                  <article
                    key={a.id}
                    onClick={() => setSelectedArticle(isSelected ? null : a)}
                    className={cn(
                      'group rounded-xl border bg-card p-4 cursor-pointer transition-all',
                      isSelected
                        ? `border-primary bg-secondary/40 ${s?.border ?? ''}`
                        : 'border-border hover:border-primary/30 hover:bg-secondary/20'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', s?.badge ?? 'bg-muted text-muted-foreground')}>
                        {a.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {a.readMinutes} min read
                      </span>
                    </div>
                    <h3 className={cn(
                      'text-sm font-semibold leading-snug mb-1.5 transition-colors',
                      isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                    )}>
                      {a.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{a.summary}</p>
                    <div className="flex items-center justify-between mt-2.5">
                      <p className="text-[10px] text-muted-foreground/50">Updated {a.updated}</p>
                      {isSelected && (
                        <span className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                          Reading <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </article>
                )
              })}
              {filteredArticles.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-2 py-14 text-muted-foreground">
                  <BookOpen className="w-8 h-8 opacity-20" />
                  <p className="text-sm">No articles match your search.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: article reader or AI Q&A panel */}
          <div className="space-y-4">
            {selectedArticle && selectedContent ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Article header */}
                <div className={cn('px-4 py-3 border-b border-border flex items-start justify-between gap-2',
                  categoryStyle[selectedArticle.category]?.border ? `border-b ${categoryStyle[selectedArticle.category].border}` : ''
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', categoryStyle[selectedArticle.category]?.badge ?? 'bg-muted text-muted-foreground')}>
                        {selectedArticle.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" /> {selectedArticle.readMinutes} min read
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-snug">{selectedArticle.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-1">Updated {selectedArticle.updated} · GSI Document ID: {selectedArticle.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    aria-label="Close article"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Article body */}
                <div className="px-4 py-4 space-y-4 max-h-[calc(100vh-320px)] overflow-y-auto">
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedContent.intro}</p>

                  {selectedContent.sections.map((sec, i) => (
                    <div key={i}>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">{sec.heading}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{sec.body}</p>
                      {sec.bullets && (
                        <ul className="mt-2 space-y-1">
                          {sec.bullets.map((b, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  {/* See Also */}
                  {selectedContent.seeAlso.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">See Also</h4>
                      <div className="flex flex-col gap-1">
                        {selectedContent.seeAlso.map((ref) => (
                          <span key={ref} className="flex items-center gap-1 text-xs text-primary cursor-pointer hover:underline">
                            <ExternalLink className="w-3 h-3 flex-shrink-0" /> {ref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related articles */}
                  {relatedArticles.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">Related in {selectedArticle.category}</h4>
                      <div className="flex flex-col gap-1.5">
                        {relatedArticles.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setSelectedArticle(r)}
                            className="text-left text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-border hover:border-primary/30 transition-colors"
                          >
                            <BookOpen className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                            <span className="truncate">{r.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="px-4 py-3 border-t border-border flex items-center gap-2">
                  <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:border-primary/30">
                    <Download className="w-3 h-3" /> Download PDF
                  </button>
                  <button
                    onClick={() => ask(`Summarise the key points of ${selectedArticle.title}`)}
                    className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/5 ml-auto"
                  >
                    <Sparkles className="w-3 h-3" /> Ask AI about this
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-bold text-foreground mb-0.5">Ask the Knowledge Base</h3>
                <p className="text-xs text-muted-foreground mb-3">GridMind cites the relevant manual in its answer.</p>

                {/* Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) ask(question)
                    }}
                    placeholder="Ask a question…"
                    className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  <button
                    onClick={() => ask(question)}
                    disabled={loading || !question.trim()}
                    aria-label="Ask"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Suggested prompts */}
                <div className="flex flex-col gap-1.5 mt-3">
                  {suggested.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      disabled={loading}
                      className="text-left text-[11px] px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AIResponsePanel response={answer} loading={loading} />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
