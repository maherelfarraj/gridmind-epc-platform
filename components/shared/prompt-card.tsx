'use client'

import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

interface PromptCardProps {
  prompt: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export function PromptCard({ prompt, active, disabled, onClick, className }: PromptCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left rounded-lg border p-3 transition-all duration-150 group',
        'flex items-start gap-2.5',
        active
          ? 'border-primary bg-accent shadow-sm'
          : 'border-border bg-card hover:border-primary/40 hover:bg-accent/40',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors',
          active ? 'bg-primary text-primary-foreground' : 'bg-accent text-primary group-hover:bg-primary group-hover:text-primary-foreground'
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
      </span>
      <span className="text-sm font-medium text-foreground leading-snug">{prompt}</span>
    </button>
  )
}
