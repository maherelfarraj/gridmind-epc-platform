import { cn } from '@/lib/utils'
import {
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  Upload,
  UserCheck,
  XCircle,
} from 'lucide-react'

type ActivityType = 'approval' | 'comment' | 'upload' | 'status' | 'assign' | 'rejection'

interface Activity {
  id: string
  type: ActivityType
  user: string
  userInitials: string
  userColor: string
  action: string
  target?: string
  time: string
  isNew?: boolean
}

interface ActivityLogProps {
  activities: Activity[]
  className?: string
}

const activityIcons: Record<ActivityType, { icon: React.ElementType; color: string }> = {
  approval: { icon: CheckCircle, color: 'text-green-600' },
  comment: { icon: MessageSquare, color: 'text-[#3944AC]' },
  upload: { icon: Upload, color: 'text-[#002B49]' },
  status: { icon: Clock, color: 'text-[#FF8C00]' },
  assign: { icon: UserCheck, color: 'text-[#C9A84C]' },
  rejection: { icon: XCircle, color: 'text-red-500' },
}

export function ActivityLog({ activities, className }: ActivityLogProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {activities.map((activity) => {
        const { icon: Icon, color } = activityIcons[activity.type]
        return (
          <div
            key={activity.id}
            className={cn(
              'flex gap-3 p-3 rounded-lg transition-colors',
              activity.isNew ? 'bg-[#FFF3E0]/50 border border-[#FF8C00]/20' : 'hover:bg-muted/50'
            )}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
              style={{ backgroundColor: activity.userColor }}
            >
              {activity.userInitials}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground leading-snug">
                  <span className="font-medium">{activity.user}</span>
                  {' '}
                  <span className="text-muted-foreground">{activity.action}</span>
                  {activity.target && (
                    <>
                      {' '}
                      <span className="font-medium text-[#3944AC]">{activity.target}</span>
                    </>
                  )}
                </p>
                <Icon className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', color)} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Sample data export for reuse
export const sampleActivities: Activity[] = [
  {
    id: '1',
    type: 'approval',
    user: 'Sarah Chen',
    userInitials: 'SC',
    userColor: '#3944AC',
    action: 'approved',
    target: 'BOQ Revision 3',
    time: '2 minutes ago',
    isNew: true,
  },
  {
    id: '2',
    type: 'upload',
    user: 'Ahmed Al-Rashidi',
    userInitials: 'AA',
    userColor: '#002B49',
    action: 'uploaded',
    target: 'IFC Drawings Package v2',
    time: '18 minutes ago',
    isNew: true,
  },
  {
    id: '3',
    type: 'comment',
    user: 'Mohammed Hassan',
    userInitials: 'MH',
    userColor: '#C9A84C',
    action: 'commented on',
    target: 'Subcontractor RFQ',
    time: '1 hour ago',
  },
  {
    id: '4',
    type: 'status',
    user: 'Fatima Al-Zahra',
    userInitials: 'FZ',
    userColor: '#FF8C00',
    action: 'moved project to',
    target: 'Construction Phase',
    time: '3 hours ago',
  },
  {
    id: '5',
    type: 'rejection',
    user: 'Consultant Reviewer',
    userInitials: 'CR',
    userColor: '#DC2626',
    action: 'rejected',
    target: 'NCR #045 corrective action',
    time: 'Yesterday',
  },
  {
    id: '6',
    type: 'assign',
    user: 'Omar Abdullah',
    userInitials: 'OA',
    userColor: '#0D9488',
    action: 'assigned task to',
    target: 'HSE Manager',
    time: 'Yesterday',
  },
]
