'use client'

import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle,
  ClipboardCheck,
  DollarSign,
  FileDiff,
  FileText,
  GitBranch,
  HardHat,
  Layers,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Package,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useWorkspace } from '@/lib/workspace-store'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

// ─── Static search index (pages, approvals, documents, actions) ──────────────
// Project entries are derived at render time from the workspace store — see useSearchIndex().

const STATIC_INDEX = [
  // Pages / navigation
  { type: 'page', label: 'Dashboard',                href: '/dashboard',         icon: LayoutDashboard, description: 'Portfolio overview, KPIs, alerts'                  },
  { type: 'page', label: 'Opportunities & RFP',      href: '/opportunities',     icon: TrendingUp,      description: 'Phase 1 — RFP intake, bid/no-bid, proposal'         },
  { type: 'page', label: 'Projects List',            href: '/projects',          icon: Layers,          description: 'All active and archived projects'                   },
  { type: 'page', label: 'Approval Queue',           href: '/approvals',         icon: CheckCircle,     description: 'Pending approvals requiring action'                  },
  { type: 'page', label: 'Engineering',              href: '/engineering',       icon: MessageSquare,   description: 'RFIs, design register, IFC drawings'                 },
  { type: 'page', label: 'Procurement',              href: '/procurement',       icon: Package,         description: 'Vendor list, POs, material delivery tracking'        },
  { type: 'page', label: 'Construction',             href: '/construction',      icon: HardHat,         description: 'Site execution, variation orders, daily reports'     },
  { type: 'page', label: 'HSE',                      href: '/hse',               icon: Shield,          description: 'Incidents, observations, toolbox talks'              },
  { type: 'page', label: 'Finance',                  href: '/finance',           icon: DollarSign,      description: 'Payment certificates, cashflow, invoices'            },
  { type: 'page', label: 'QA/QC',                    href: '/qaqc',              icon: ClipboardCheck,  description: 'NCRs, inspection test plans, checklists'             },
  { type: 'page', label: 'Testing & Handover',       href: '/testing',           icon: Zap,             description: 'Phase 7 — T&C, punch list, PAC certificate'          },
  { type: 'page', label: 'Risk Register',            href: '/risk',              icon: AlertTriangle,   description: 'Project and portfolio risk register'                 },
  { type: 'page', label: 'Document Center',          href: '/documents',         icon: FileText,        description: 'Upload, review, and track documents'                 },
  { type: 'page', label: 'Reports & Analytics',      href: '/reports',           icon: BarChart3,       description: 'Portfolio KPIs, project reports'                     },
  { type: 'page', label: 'Schedule',                 href: '/schedule',          icon: TrendingUp,      description: 'Gantt view, milestone tracker'                       },
  { type: 'page', label: 'SCADA Dashboard',          href: '/scada',             icon: Zap,             description: 'Real-time inverter and grid monitoring'              },
  { type: 'page', label: 'Solar Analytics',          href: '/solar-analytics',   icon: Sun,             description: 'Energy generation, performance ratio'                },
  { type: 'page', label: 'Client Portal',            href: '/client-portal',     icon: Users,           description: 'Client-facing project status view'                   },
  { type: 'page', label: 'Settings',                 href: '/settings',          icon: Settings,        description: 'Account, notifications, preferences'                 },
  { type: 'page', label: 'AI Command Center',         href: '/ai',                icon: Sparkles,        description: 'Unified access to all three AI intelligence systems'  },
  { type: 'page', label: 'Executive Intelligence',    href: '/ai/executive',      icon: LineChart,       description: 'Business & portfolio AI — briefings, decisions'        },
  { type: 'page', label: 'Delivery Intelligence',     href: '/ai/delivery',       icon: HardHat,         description: 'Project execution & gate readiness AI'                 },
  { type: 'page', label: 'Controls Intelligence',     href: '/ai/controls',       icon: Brain,           description: 'Schedule, cost, EVM, and commercial AI'               },
  { type: 'page', label: 'Stage Gates',               href: '/stage-gates',       icon: GitBranch,       description: 'G0–G8 lifecycle stepper, readiness scoring, gate packs' },
  { type: 'page', label: 'Changes & Claims',          href: '/changes-claims',    icon: FileDiff,        description: 'Change register, claims exposure, AI narrative'        },
  { type: 'page', label: 'Knowledge Base',            href: '/knowledge-base',    icon: BookOpen,        description: 'GSI manuals, templates, procedures, AI Q&A'            },

  // Pending approvals
  { type: 'approval', label: 'BOQ Final Revision — NEOM Solar Farm',    href: '/approvals', icon: CheckCircle, description: 'Due Today · HIGH · Engineering'    },
  { type: 'approval', label: 'Subcontractor Contract — Al-Qurayyah EPC',href: '/approvals', icon: CheckCircle, description: 'Due Tomorrow · HIGH · Procurement'  },
  { type: 'approval', label: 'Payment Certificate #7 — Riyadh EPC-07',  href: '/approvals', icon: CheckCircle, description: 'Due in 2 days · MEDIUM · Finance'    },

  // Documents
  { type: 'document', label: 'RFP Package v2.1 — NEOM Solar',     href: '/documents', icon: FileText, description: 'Approved · Uploaded Jan 10'    },
  { type: 'document', label: 'IFC Drawing Package v2 — NEOM Solar',href: '/documents', icon: FileText, description: 'Pending review · Jul 1'          },
  { type: 'document', label: 'Main BOQ Revision 4 — NEOM Solar',   href: '/documents', icon: FileText, description: 'Approved · Apr 12'               },
  { type: 'document', label: 'HSE Plan v1.0 — NEOM Solar',         href: '/documents', icon: ShieldAlert, description: 'Missing — action required'     },

  // Quick actions
  { type: 'action', label: 'Submit RFI',          href: '/engineering',  icon: MessageSquare, description: 'Log a new Request for Information'  },
  { type: 'action', label: 'Log NCR',             href: '/qaqc',         icon: ShieldAlert,   description: 'Create a Non-Conformance Report'     },
  { type: 'action', label: 'Request Approval',    href: '/approvals',    icon: CheckCircle,   description: 'Submit item to approval queue'        },
  { type: 'action', label: 'New Opportunity',     href: '/opportunities',icon: TrendingUp,    description: 'Register a new RFP or tender'         },
  { type: 'action', label: 'Upload Document',     href: '/documents',    icon: FileText,      description: 'Upload to document center'            },
]

const TYPE_LABELS: Record<string, string> = {
  page:     'Pages',
  project:  'Projects',
  approval: 'Approvals',
  document: 'Documents',
  action:   'Quick Actions',
}

const TYPE_COLORS: Record<string, string> = {
  page:     'text-[#3944AC] bg-[#EEF0FB]',
  project:  'text-[#002B49] bg-[#E8F4FD]',
  approval: 'text-[#FF8C00] bg-[#FFF3E0]',
  document: 'text-[#0D9488] bg-[#F0FDFA]',
  action:   'text-[#C9A84C] bg-[#FFF8E1]',
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { projects } = useWorkspace()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Build the full search index by merging static entries with live project entries.
  // Project descriptions are derived from store fields — never stored as strings.
  const searchIndex = useMemo(() => {
    const projectEntries = projects.map((p) => {
      const ccy = p.currency || 'SAR'
      const valLabel =
        p.valueSAR === 0 ? 'TBD'
        : p.valueSAR >= 1_000_000_000 ? `${ccy} ${(p.valueSAR / 1_000_000_000).toFixed(2)}B`
        : `${ccy} ${Math.round(p.valueSAR / 1_000_000)}M`
      return {
        type: 'project',
        label: p.name,
        href: `/projects/${p.id}`,
        icon: Sun,
        description: `${valLabel} · ${p.progress}% complete`,
      }
    })
    return [...STATIC_INDEX, ...projectEntries]
  }, [projects])

  // Focus input when opened
  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => {
      setQuery('')
      setActiveIndex(0)
      inputRef.current?.focus()
    }, 50)
    return () => clearTimeout(id)
  }, [open])

  // Filter
  const results = query.trim()
    ? searchIndex.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : searchIndex.filter(i => i.type === 'page').slice(0, 8)

  // Group by type
  const grouped = results.reduce<Record<string, typeof searchIndex>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {})

  const flatResults = results

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, flatResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        const item = flatResults[activeIndex]
        if (item) {
          // Navigate handled by the Link click
          const el = listRef.current?.querySelector<HTMLAnchorElement>(`[data-idx="${activeIndex}"]`)
          el?.click()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, flatResults, activeIndex, onClose])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4.5 h-4.5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0) }}
            placeholder="Search projects, pages, documents, approvals..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
            <kbd className="bg-muted border border-border rounded px-1.5 py-0.5 font-mono">ESC</kbd>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {flatResults.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Search className="w-8 h-8 opacity-30" />
              <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-4 py-2">
                  {TYPE_LABELS[type] ?? type}
                </p>
                {items.map(item => {
                  const globalIdx = flatResults.indexOf(item)
                  const Icon = item.icon
                  return (
                    <Link
                      key={`${item.type}-${item.label}`}
                      href={item.href}
                      data-idx={globalIdx}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-colors cursor-pointer',
                        globalIdx === activeIndex
                          ? 'bg-[#FF8C00]/10 text-foreground'
                          : 'hover:bg-muted text-foreground'
                      )}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', TYPE_COLORS[item.type])}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0', TYPE_COLORS[item.type])}>
                        {type.toUpperCase()}
                      </span>
                    </Link>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><kbd className="bg-card border border-border rounded px-1.5 py-0.5 font-mono">↑↓</kbd> Navigate</span>
          <span className="flex items-center gap-1.5"><kbd className="bg-card border border-border rounded px-1.5 py-0.5 font-mono">↵</kbd> Open</span>
          <span className="flex items-center gap-1.5"><kbd className="bg-card border border-border rounded px-1.5 py-0.5 font-mono">ESC</kbd> Close</span>
          <span className="ml-auto">{flatResults.length} result{flatResults.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
