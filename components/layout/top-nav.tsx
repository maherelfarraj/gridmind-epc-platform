'use client'

import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/workspace-store'
import { Bell, ChevronRight, Menu, Plus, Search, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface TopNavProps {
  onMenuClick: () => void
  onSearchClick?: () => void
}

const routeLabels: Record<string, { crumbs: string[]; role?: string }> = {
  '/dashboard':          { crumbs: ['GSI Dashboard'],                                   role: 'Project Manager'      },
  '/admin':              { crumbs: ['Administration', 'Super Admin'],                   role: 'Platform Super Admin' },
  '/opportunities':      { crumbs: ['Pre-Contract', 'Opportunities & RFP'],             role: 'Commercial Director'  },
  '/projects':           { crumbs: ['Projects', 'Projects List'],                       role: 'Project Manager'      },
  '/projects/new':       { crumbs: ['Projects', 'New Project'],                         role: 'Project Manager'      },
  '/approvals':          { crumbs: ['Workflow', 'Approval Queue'],                      role: 'Approver'             },
  '/risk':               { crumbs: ['Core', 'Risk Register'],                           role: 'Risk Manager'         },
  '/schedule':           { crumbs: ['Core', 'Portfolio Schedule'],                      role: 'Project Manager'      },
  '/engineering':        { crumbs: ['Engineering', 'Engineering Dashboard'],            role: 'Engineering Manager'  },
  '/procurement':        { crumbs: ['Procurement', 'Procurement Dashboard'],            role: 'Procurement Manager'  },
  '/construction':       { crumbs: ['Construction', 'Construction Dashboard'],          role: 'Construction Manager' },
  '/hse':                { crumbs: ['HSE', 'HSE Dashboard'],                            role: 'HSE Manager'          },
  '/finance':            { crumbs: ['Finance', 'Finance Dashboard'],                    role: 'Finance Manager'      },
  '/qaqc':               { crumbs: ['Quality', 'QA/QC Dashboard'],                     role: 'QA/QC Manager'        },
  '/testing':            { crumbs: ['T&C', 'Testing & Handover'],                       role: 'T&C Manager'          },
  '/scada':              { crumbs: ['Operations', 'SCADA Dashboard'],                   role: 'SCADA Operator'       },
  '/solar-analytics':    { crumbs: ['Analytics', 'Solar Analytics'],                    role: 'Engineering Manager'  },
  '/documents':          { crumbs: ['Documents', 'Document Center'],                    role: 'Project Manager'      },
  '/reports':            { crumbs: ['Reports', 'Reports & Analytics'],                  role: 'Project Manager'      },
  '/client-portal':      { crumbs: ['Client', 'Client Portal'],                         role: 'Client Viewer'        },
  '/tenant-management':  { crumbs: ['Admin', 'Tenant Management'],                      role: 'Tenant Admin'         },
  '/settings':           { crumbs: ['Account', 'Settings'],                             role: 'Project Manager'      },
  '/notifications':      { crumbs: ['Account', 'Notifications'],                        role: 'Project Manager'      },
  '/ai/executive':       { crumbs: ['AI Intelligence', 'Executive Intelligence'],        role: 'Executive'            },
  '/ai/delivery':        { crumbs: ['AI Intelligence', 'Delivery Intelligence'],         role: 'Project Manager'      },
  '/ai/controls':        { crumbs: ['AI Intelligence', 'Controls Intelligence'],         role: 'Controls Manager'     },
  '/ai':                 { crumbs: ['AI Intelligence', 'AI Command Center'],             role: 'Project Manager'      },
  '/stage-gates':        { crumbs: ['Governance', 'Stage Gates'],                        role: 'Project Manager'      },
  '/changes-claims':     { crumbs: ['Governance', 'Changes & Claims'],                   role: 'Commercial Manager'   },
  '/knowledge-base':     { crumbs: ['Governance', 'Knowledge Base'],                     role: 'Project Manager'      },
  '/simulator':          { crumbs: ['Workflow', 'Workflow Simulator'],                   role: 'Project Manager'      },
}

export function TopNav({ onMenuClick, onSearchClick }: TopNavProps) {
  const pathname = usePathname()
  const { notifications: allNotifications, unreadNotificationCount, getProject } = useWorkspace()

  const routeKey = Object.keys(routeLabels).find(k =>
    pathname === k || (k.length > 1 && pathname.startsWith(k + '/'))
  ) || '/dashboard'
  const { crumbs: baseCrumbs, role } = routeLabels[routeKey]

  // Dynamic breadcrumb for project detail pages (e.g. /projects/NEOM-SOL-004)
  const projectDetailMatch = pathname.match(/^\/projects\/([^/]+)$/)
  const projectId = projectDetailMatch ? projectDetailMatch[1] : null
  const dynamicProject = projectId && projectId !== 'new' ? getProject(projectId) : null

  // Dynamic breadcrumb for finance model detail pages (e.g. /finance/models/utility-epc-base)
  const modelDetailMatch = pathname.match(/^\/finance\/models\/([^/]+)$/)
  const modelId = modelDetailMatch ? modelDetailMatch[1] : null
  const modelLabel = modelId
    ? modelId
        .replace(/^project-/, '')
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : null

  const segments = dynamicProject
    ? ['Projects', dynamicProject.name]
    : modelLabel
      ? ['Finance', 'Models', modelLabel]
      : baseCrumbs

  const [notifOpen, setNotifOpen] = useState(false)
  const notifications = allNotifications.slice(0, 6)
  const urgentCount = unreadNotificationCount

  return (
    <header className="sticky top-0 z-30 bg-[#0D0F14]/95 backdrop-blur-md border-b border-white/[0.05] h-12 flex items-center px-4 lg:px-5 gap-3">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-4.5 h-4.5" />
      </button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 flex-1 min-w-0">
        <Link href="/dashboard" className="text-white/25 hover:text-white/50 transition-colors text-[11px] font-medium tracking-wide">
          GSI
        </Link>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-white/15 flex-shrink-0" />
            <span className={cn(
              'truncate text-[11px]',
              i === segments.length - 1
                ? 'text-white/75 font-medium'
                : 'text-white/30'
            )}>
              {seg}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex-1 sm:flex-none" />

      {/* Search */}
      <button
        onClick={onSearchClick}
        className="hidden md:flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] rounded px-3 py-1.5 w-48 xl:w-60 transition-colors text-left"
        aria-label="Open search (Cmd+K)"
      >
        <Search className="w-3 h-3 text-white/25 flex-shrink-0" />
        <span className="text-[11px] text-white/25 flex-1">Search...</span>
        <kbd className="hidden xl:flex items-center text-[8px] text-white/20 border border-white/[0.08] rounded px-1 py-0.5 font-mono gap-0.5 flex-shrink-0">
          <span>⌘K</span>
        </kbd>
      </button>

      {/* New Project CTA */}
      <Link
        href="/projects/new"
        className="hidden sm:flex items-center gap-1.5 bg-[#C9A55A] hover:bg-[#B8943A] text-[#0A0B0D] text-[11px] font-semibold px-3 py-1.5 rounded transition-colors"
      >
        <Plus className="w-3 h-3" />
        New Project
      </Link>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(o => !o)}
          className="relative p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
          aria-label={`${urgentCount} unread notifications`}
        >
          <Bell className="w-4 h-4" />
          {urgentCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
              {urgentCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#131620] border border-white/[0.08] rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <p className="text-white/80 text-[11px] font-semibold tracking-wide">Notifications</p>
                <span className="text-[9px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-sm border border-red-500/25">
                  {urgentCount} unread
                </span>
              </div>
              <div className="divide-y divide-white/[0.05] max-h-72 overflow-y-auto sidebar-scroll">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[11px] text-white/30">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setNotifOpen(false)}
                      className={cn('flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors', n.urgent && !n.read && 'bg-red-500/5')}
                    >
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', !n.read ? (n.urgent ? 'bg-red-400' : 'bg-[#C9A55A]') : 'bg-transparent')} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[11px] leading-snug', n.read ? 'text-white/30' : 'text-white/75 font-medium')}>{n.title}</p>
                        <p className="text-[9px] text-white/25 mt-0.5">{n.time}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-white/[0.05] flex items-center justify-between">
                <Link href="/notifications" className="text-[11px] text-[#C9A55A] font-medium hover:text-[#C9A55A]/80 transition-colors" onClick={() => setNotifOpen(false)}>
                  View all
                </Link>
                <Link href="/approvals" className="text-[11px] text-white/30 hover:text-white/55 transition-colors" onClick={() => setNotifOpen(false)}>
                  Approval queue
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/[0.07] hidden sm:block" />

      {/* Role pill + avatar */}
      <div className="hidden sm:flex items-center gap-2">
        {role && (
          <span className="text-[9px] font-semibold text-[#C9A55A]/80 bg-[#C9A55A]/8 border border-[#C9A55A]/15 px-2 py-0.5 rounded-sm whitespace-nowrap tracking-wide uppercase">
            {role}
          </span>
        )}
        <div className="flex items-center gap-1.5 group">
          <div className="w-6 h-6 rounded bg-[#C9A55A]/10 border border-[#C9A55A]/25 flex items-center justify-center text-[#C9A55A] text-[9px] font-bold cursor-default">
            AR
          </div>
          <Link href="/settings" aria-label="Settings">
            <Settings className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Mobile avatar */}
      <div className="sm:hidden w-6 h-6 rounded bg-[#C9A55A]/10 border border-[#C9A55A]/25 flex items-center justify-center text-[#C9A55A] text-[9px] font-bold">
        AR
      </div>
    </header>
  )
}
