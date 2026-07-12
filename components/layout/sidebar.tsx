'use client'

import { signOut } from '@/app/auth/actions'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  Building2,
  Calendar,
  ChevronDown,
  ClipboardCheck,
  DollarSign,
  FileBarChart,
  FileDiff,
  FileText,
  Flame,
  FlaskConical,
  Gauge,
  GitBranch,
  Globe,
  HardHat,
  Layers,
  LayoutDashboard,
  LineChart,
  LogOut,
  Package,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TestTube2,
  Wrench,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeColor?: string
  exact?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
  collapsible?: boolean
}

const navGroups: NavGroup[] = [
  {
    label: 'Core',
    items: [
      { label: 'GSI Dashboard',      href: '/dashboard',    icon: LayoutDashboard },
      { label: 'Opportunities',      href: '/opportunities', icon: Target },
      { label: 'Projects',           href: '/projects',     icon: Layers, badge: '12', badgeColor: 'gold' },
      { label: 'Approval Queue',     href: '/approvals',    icon: ClipboardCheck, badge: '5', badgeColor: 'red' },
      { label: 'Risk Register',      href: '/risk',          icon: ShieldAlert },
      { label: 'Portfolio Schedule', href: '/schedule',      icon: Calendar },
      { label: 'Workflow Simulator', href: '/simulator',     icon: FlaskConical, badge: 'TEST', badgeColor: 'indigo' },
    ],
  },
  {
    label: 'AI Intelligence',
    items: [
      { label: 'AI Command Center', href: '/ai',           icon: Sparkles, badge: 'AI', badgeColor: 'indigo', exact: true },
      { label: 'Executive',         href: '/ai/executive', icon: LineChart },
      { label: 'Delivery',          href: '/ai/delivery',  icon: HardHat },
      { label: 'Controls',          href: '/ai/controls',  icon: Brain },
    ],
  },
  {
    label: 'Governance',
    collapsible: true,
    items: [
      { label: 'Stage Gates',      href: '/stage-gates',    icon: GitBranch },
      { label: 'Changes & Claims', href: '/changes-claims', icon: FileDiff },
    ],
  },
  {
    label: 'EPC Phases',
    collapsible: true,
    items: [
      { label: 'Engineering',        href: '/engineering',  icon: Wrench },
      { label: 'Procurement',        href: '/procurement',  icon: Package },
      { label: 'Construction',       href: '/construction', icon: HardHat },
      { label: 'HSE',                href: '/hse',          icon: Flame },
      { label: 'Finance',            href: '/finance',      icon: DollarSign },
      { label: 'QA / QC',            href: '/qaqc',         icon: ShieldCheck },
      { label: 'Testing & Handover', href: '/testing',      icon: TestTube2 },
    ],
  },
  {
    label: 'Operations',
    collapsible: true,
    items: [
      { label: 'SCADA',           href: '/scada',           icon: Gauge },
      { label: 'Solar Analytics', href: '/solar-analytics', icon: Sun },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Documents',      href: '/documents',    icon: FileText },
      { label: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen },
      { label: 'Reports',        href: '/reports',      icon: FileBarChart },
      { label: 'Client Portal',  href: '/client-portal', icon: Globe },
    ],
  },
]

const adminItems: NavItem[] = [
  { label: 'Super Admin',       href: '/admin',             icon: BarChart3 },
  { label: 'Tenant Management', href: '/tenant-management', icon: Building2 },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const toggleGroup = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-60 z-50 flex flex-col',
          'bg-[#080A0E] transition-transform duration-300',
          'border-r border-white/[0.05]',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Wordmark */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-[#C9A55A]/10 border border-[#C9A55A]/30">
              <Sun className="w-4 h-4 text-[#C9A55A]" />
            </div>
            <div>
              <div className="text-white font-semibold text-[13px] leading-tight tracking-wide">GSI Holding</div>
              <div className="text-[#C9A55A]/70 text-[9px] font-medium tracking-[0.2em] uppercase mt-0.5">EPC Platform</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/30 hover:text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User identity */}
        <div className="px-4 py-3.5 border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-[#C9A55A]/10 border border-[#C9A55A]/25 flex items-center justify-center text-[#C9A55A] text-[10px] font-bold flex-shrink-0">
              AR
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white/90 text-[11px] font-semibold truncate">Ahmed Al-Rashidi</div>
              <div className="text-white/35 text-[9px] tracking-wide truncate mt-0.5">Project Manager</div>
            </div>
            <Link href="/notifications" aria-label="Notifications" className="flex-shrink-0 relative">
              <Bell className="w-3.5 h-3.5 text-white/30 hover:text-[#C9A55A] transition-colors" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-[7px] font-bold text-white">5</span>
            </Link>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 sidebar-scroll">
          {navGroups.map((group) => {
            const effectiveCollapsed = group.collapsible
              ? (collapsed[group.label] !== undefined ? collapsed[group.label] : false)
              : false

            return (
              <div key={group.label} className="px-3 mb-0.5">
                <button
                  onClick={() => group.collapsible && toggleGroup(group.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-2 py-1.5 mb-0.5',
                    group.collapsible ? 'cursor-pointer' : 'cursor-default'
                  )}
                >
                  <p className="text-white/20 text-[9px] font-semibold uppercase tracking-[0.18em]">{group.label}</p>
                  {group.collapsible && (
                    <ChevronDown
                      className={cn('w-3 h-3 text-white/20 transition-transform duration-200', effectiveCollapsed ? '-rotate-90' : '')}
                    />
                  )}
                </button>

                {!effectiveCollapsed && group.items.map((item) => (
                  <NavLink key={item.href} item={item} isActive={isActive} />
                ))}
              </div>
            )
          })}

          {/* Administration */}
          <div className="px-3 mt-1">
            <p className="text-white/20 text-[9px] font-semibold uppercase tracking-[0.18em] px-2 mb-1.5">Administration</p>
            {adminItems.map((item) => (
              <NavLink key={item.href} item={item} isActive={isActive} />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-white/[0.05] space-y-0.5">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded text-white/35 hover:bg-white/[0.04] hover:text-white/70 transition-all text-[12px]"
          >
            <Settings className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Settings</span>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded text-white/35 hover:bg-red-500/8 hover:text-red-400/80 transition-all text-[12px]"
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}

function NavLink({
  item,
  isActive,
}: {
  item: NavItem
  isActive: (href: string, exact?: boolean) => boolean
}) {
  const active = isActive(item.href, item.exact)

  const badgeClasses: Record<string, string> = {
    gold:   'bg-[#C9A55A]/15 text-[#C9A55A]',
    red:    'bg-red-500/15 text-red-400',
    indigo: 'bg-[#4A7FA5]/15 text-[#7EB8D9]',
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-[7px] rounded text-[12px] transition-all duration-150 group',
        active
          ? 'bg-[#C9A55A]/10 text-[#C9A55A] border border-[#C9A55A]/20'
          : 'text-white/40 hover:bg-white/[0.04] hover:text-white/75 border border-transparent'
      )}
    >
      <item.icon className={cn('w-3.5 h-3.5 flex-shrink-0', active ? 'text-[#C9A55A]' : 'text-white/25 group-hover:text-white/55')} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className={cn(
          'text-[9px] font-bold px-1.5 py-0.5 rounded-sm min-w-[18px] text-center',
          active
            ? 'bg-[#C9A55A]/20 text-[#C9A55A]'
            : (item.badgeColor && badgeClasses[item.badgeColor]) || 'bg-white/8 text-white/40'
        )}>
          {item.badge}
        </span>
      )}
    </Link>
  )
}
