'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { useWorkspace, type NotificationCategory } from '@/lib/workspace-store'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Filter,
  Flame,
  Layers,
  Trash2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type FilterCategory = 'all' | NotificationCategory

const categories: { key: FilterCategory; label: string; icon: React.ElementType }[] = [
  { key: 'all',        label: 'All',         icon: Bell },
  { key: 'approvals',  label: 'Approvals',   icon: CheckCircle },
  { key: 'hse',        label: 'HSE / QA',    icon: Flame },
  { key: 'documents',  label: 'Documents',   icon: FileText },
  { key: 'milestones', label: 'Milestones',  icon: Clock },
  { key: 'finance',    label: 'Finance',     icon: DollarSign },
  { key: 'system',     label: 'System',      icon: Layers },
]

const iconBg: Record<NotificationCategory, string> = {
  approvals:  'bg-emerald-950/20',
  hse:        'bg-red-950/20',
  documents:  'bg-secondary/60',
  milestones: 'bg-accent',
  finance:    'bg-emerald-950/20',
  system:     'bg-muted',
}

const iconColor: Record<NotificationCategory, string> = {
  approvals:  'text-emerald-400',
  hse:        'text-red-600',
  documents:  'text-primary',
  milestones: 'text-amber-400',
  finance:    'text-emerald-400',
  system:     'text-muted-foreground',
}

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, dismissNotification } = useWorkspace()
  const [category, setCategory] = useState<FilterCategory>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = notifications.filter(n => {
    const matchCat = category === 'all' || n.category === category
    const matchRead = !showUnreadOnly || !n.read
    return matchCat && matchRead
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const urgentCount = notifications.filter(n => n.urgent && !n.read).length

  const markAllRead = () => {
    markAllNotificationsRead()
    showToast('All notifications marked as read')
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[900px]">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <span className="text-sm font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {urgentCount > 0
                ? `${urgentCount} urgent action${urgentCount > 1 ? 's' : ''} require your attention`
                : 'All urgent items resolved'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUnreadOnly(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                showUnreadOnly
                  ? 'bg-secondary text-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Unread only
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 px-3 py-2 rounded-lg hover:bg-secondary/60 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Urgent banner */}
        {urgentCount > 0 && (
          <div className="bg-red-950/20 border border-red-800/30 rounded-xl px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-400">
                {urgentCount} urgent notification{urgentCount > 1 ? 's' : ''} require immediate action
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {notifications.filter(n => n.urgent && !n.read).map(n => n.project).filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Category tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => {
            const count = notifications.filter(n => (cat.key === 'all' || n.category === cat.key) && !n.read).length
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  category === cat.key
                    ? 'bg-secondary text-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
                {count > 0 && (
                  <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center ${
                    category === cat.key ? 'bg-card/20 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Notification list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                {showUnreadOnly ? 'All caught up — no unread notifications' : 'Nothing in this category yet'}
              </p>
            </div>
          ) : (
            filtered.map(n => {
              const bg = iconBg[n.category]
              const fg = iconColor[n.category]
              const Icon = n.icon
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group ${
                    !n.read ? 'bg-secondary/60/20' : ''
                  } ${n.urgent && !n.read ? 'bg-red-950/20/30 border-l-2 border-l-red-500' : ''}`}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-2 h-2 rounded-full mt-1 ${!n.read ? (n.urgent ? 'bg-red-500' : 'bg-primary') : 'bg-transparent'}`} />
                  </div>

                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                    <Icon className={`w-4 h-4 ${fg}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                            {n.title}
                          </p>
                          {n.urgent && !n.read && (
                            <span className="text-[9px] font-bold text-red-600 bg-red-950/20 border border-red-800/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              URGENT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-muted-foreground">{n.time}</span>
                          {n.project && (
                            <>
                              <span className="text-[10px] text-muted-foreground">·</span>
                              <span className="text-[10px] text-primary font-medium">{n.project}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button
                            onClick={() => markNotificationRead(n.id)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Mark as read"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => dismissNotification(n.id)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-red-600"
                          title="Dismiss"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Action link */}
                    <Link
                      href={n.link}
                      onClick={() => markNotificationRead(n.id)}
                      className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-primary hover:underline"
                    >
                      View in {n.link.replace('/', '').replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Showing {filtered.length} of {notifications.length} notifications
          </p>
        )}
      </div>
    </AppLayout>
  )
}
