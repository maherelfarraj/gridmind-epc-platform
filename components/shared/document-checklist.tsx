import { cn } from '@/lib/utils'
import { CheckCircle, Clock, Download, Eye, FileText, Lock, XCircle } from 'lucide-react'

type DocStatus = 'approved' | 'pending' | 'missing' | 'rejected' | 'locked'

interface Document {
  id: string
  name: string
  version?: string
  status: DocStatus
  size?: string
  uploadedBy?: string
  date?: string
}

interface DocumentChecklistProps {
  documents: Document[]
  title?: string
  className?: string
}

const statusConfig: Record<DocStatus, { icon: React.ElementType; color: string; label: string }> = {
  approved: { icon: CheckCircle, color: 'text-green-600', label: 'Approved' },
  pending: { icon: Clock, color: 'text-[#FF8C00]', label: 'Pending' },
  missing: { icon: XCircle, color: 'text-red-500', label: 'Missing' },
  rejected: { icon: XCircle, color: 'text-red-600', label: 'Rejected' },
  locked: { icon: Lock, color: 'text-muted-foreground', label: 'Locked' },
}

export function DocumentChecklist({ documents, title, className }: DocumentChecklistProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-[#002B49]" />
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <span className="ml-auto text-xs text-muted-foreground">
            {documents.filter((d) => d.status === 'approved').length}/{documents.length} approved
          </span>
        </div>
      )}
      <div className="space-y-1">
        {documents.map((doc) => {
          const { icon: Icon, color, label } = statusConfig[doc.status]
          return (
            <div
              key={doc.id}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-lg transition-colors',
                doc.status === 'missing' ? 'bg-red-50/50 border border-red-100' : 'hover:bg-muted/50'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', color)} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {doc.version && (
                    <span className="text-[10px] text-muted-foreground">v{doc.version}</span>
                  )}
                  {doc.uploadedBy && (
                    <span className="text-[10px] text-muted-foreground">by {doc.uploadedBy}</span>
                  )}
                  {doc.date && (
                    <span className="text-[10px] text-muted-foreground">{doc.date}</span>
                  )}
                </div>
              </div>
              <span className={cn('text-[10px] font-medium flex-shrink-0', color)}>{label}</span>
              {doc.status !== 'missing' && doc.status !== 'locked' && (
                <div className="flex items-center gap-1">
                  <button className="p-1 text-muted-foreground hover:text-[#3944AC] transition-colors" title="Preview">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 text-muted-foreground hover:text-[#002B49] transition-colors" title="Download">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
