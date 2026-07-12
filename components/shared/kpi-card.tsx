import { cn } from '@/lib/utils'
import { TrendingDown, TrendingUp } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; label: string }
  icon?: React.ElementType
  accent?: 'navy' | 'orange' | 'gold' | 'indigo' | 'green' | 'red'
  className?: string
}

const accentStyles = {
  navy:   { bar: 'bg-[#4A7FA5]',  icon: 'text-[#7EB8D9]',  value: 'text-white/90' },
  orange: { bar: 'bg-[#C9A55A]',  icon: 'text-[#C9A55A]',  value: 'text-white/90' },
  gold:   { bar: 'bg-[#C9A55A]',  icon: 'text-[#C9A55A]',  value: 'text-[#C9A55A]' },
  indigo: { bar: 'bg-[#4A7FA5]',  icon: 'text-[#7EB8D9]',  value: 'text-white/90' },
  green:  { bar: 'bg-[#5A8A6A]',  icon: 'text-[#7EC99A]',  value: 'text-white/90' },
  red:    { bar: 'bg-[#8A5A5A]',  icon: 'text-[#E07070]',  value: 'text-white/90' },
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  accent = 'navy',
  className,
}: KPICardProps) {
  const styles = accentStyles[accent]
  const isPositive = trend && trend.value >= 0

  return (
    <div
      className={cn(
        'relative bg-[#131620] border border-white/[0.07] rounded-lg p-5 overflow-hidden luxury-card',
        className
      )}
    >
      {/* Top accent bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-[2px]', styles.bar, 'opacity-60')} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white/30 text-[9px] font-semibold uppercase tracking-[0.18em] truncate">
            {title}
          </p>
          <p className={cn('text-2xl font-bold mt-2 leading-none tracking-tight', styles.value)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-white/30 text-[10px] mt-1.5 leading-snug">{subtitle}</p>
          )}
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2.5 text-[10px] font-medium', isPositive ? 'text-[#5A8A6A]' : 'text-[#8A5A5A]')}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>
                {isPositive ? '+' : ''}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded bg-white/[0.04] border border-white/[0.07] flex items-center justify-center flex-shrink-0">
            <Icon className={cn('w-4 h-4', styles.icon)} />
          </div>
        )}
      </div>
    </div>
  )
}
