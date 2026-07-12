interface PhaseBannerProps {
  phase: number
  phaseName: string
  steps: string
  activeStep: number
  activeStepLabel: string
  projectName?: string
  status?: 'on-track' | 'behind' | 'at-risk' | 'completed'
}

const statusConfig = {
  'on-track':  { label: 'On Track',  color: 'text-green-700',  bg: 'bg-green-50',    border: 'border-green-200' },
  'behind':    { label: 'Behind',    color: 'text-[#FF8C00]',  bg: 'bg-[#FFF3E0]',   border: 'border-[#FF8C00]/30' },
  'at-risk':   { label: 'At Risk',   color: 'text-red-700',    bg: 'bg-red-50',       border: 'border-red-200' },
  'completed': { label: 'Completed', color: 'text-[#3944AC]',  bg: 'bg-[#EEF0FB]',   border: 'border-[#3944AC]/20' },
}

export function PhaseBanner({
  phase,
  phaseName,
  steps,
  activeStep,
  activeStepLabel,
  projectName = 'NEOM Solar Farm 400MW',
  status = 'on-track',
}: PhaseBannerProps) {
  const cfg = statusConfig[status]

  return (
    <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-3 flex-wrap">
      {/* Phase badge */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#002B49] flex items-center justify-center text-white text-sm font-bold">
          P{phase}
        </div>
        <div>
          <p className="text-xs font-bold text-foreground leading-tight">{phaseName}</p>
          <p className="text-[10px] text-muted-foreground">Steps {steps}</p>
        </div>
      </div>

      <div className="w-px h-8 bg-border hidden sm:block" />

      {/* Active step */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-6 h-6 rounded-full bg-[#FF8C00] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[10px] font-bold">{activeStep}</span>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Active Step</p>
          <p className="text-xs font-semibold text-foreground leading-tight">{activeStepLabel}</p>
        </div>
      </div>

      <div className="w-px h-8 bg-border hidden sm:block" />

      {/* Project */}
      <div className="flex-shrink-0 hidden sm:block">
        <p className="text-[10px] text-muted-foreground">Project</p>
        <p className="text-xs font-semibold text-foreground">{projectName}</p>
      </div>

      {/* Status */}
      <div className="ml-auto flex-shrink-0">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
          {cfg.label}
        </span>
      </div>
    </div>
  )
}
