'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { Button } from '@/components/ui/button'
import {
  EPC_PHASES,
  deriveStepStatuses,
  stepRequiredDocs,
  WorkflowTimeline,
} from '@/components/shared/workflow-timeline'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Gauge,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  SkipForward,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

type Severity = 'info' | 'success' | 'warning' | 'error'
type ScenarioKey = 'happy' | 'missing-docs' | 'rejection' | 'faults'
type FaultType = 'no-gate' | 'missing-doc' | 'reject' | 'schedule-slip'

interface LogEntry {
  id: number
  stepId: number
  time: string
  severity: Severity
  check: string
  message: string
}

interface Scenario {
  key: ScenarioKey
  label: string
  description: string
  faults: Record<number, FaultType>
}

// ─── Scenarios (deterministic fault injection) ────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    key: 'happy',
    label: 'Happy Path',
    description: 'Every step passes all validation gates. Baseline integrity run.',
    faults: {},
  },
  {
    key: 'missing-docs',
    label: 'Missing Documents',
    description: 'Required deliverables are absent at Drawings and Inspection steps.',
    faults: { 16: 'missing-doc', 33: 'missing-doc' },
  },
  {
    key: 'rejection',
    label: 'Gate Rejection',
    description: 'Procurement Committee rejects at step 23 — workflow must halt.',
    faults: { 23: 'reject' },
  },
  {
    key: 'faults',
    label: 'Mixed Faults',
    description: 'Combined defects: missing approver, missing docs, slip and a rejection.',
    faults: { 4: 'no-gate', 22: 'missing-doc', 34: 'schedule-slip', 45: 'reject' },
  },
]

const SPEEDS = [
  { label: '0.5x', ms: 1400 },
  { label: '1x', ms: 800 },
  { label: '2x', ms: 400 },
  { label: '4x', ms: 150 },
]

const TOTAL_STEPS = 50
const ALL_STEPS = EPC_PHASES.flatMap((p) => p.steps.map((s) => ({ ...s, phaseId: p.id, phaseLabel: p.label })))

const severityStyles: Record<Severity, { row: string; dot: string; icon: React.ElementType; label: string }> = {
  info: { row: 'text-muted-foreground', dot: 'bg-primary', icon: ListChecks, label: 'INFO' },
  success: { row: 'text-emerald-400', dot: 'bg-emerald-600', icon: CheckCircle2, label: 'PASS' },
  warning: { row: 'text-amber-400', dot: 'bg-primary', icon: AlertTriangle, label: 'WARN' },
  error: { row: 'text-red-400', dot: 'bg-red-500', icon: XCircle, label: 'FAIL' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SimulatorPage() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('happy')
  const [speedMs, setSpeedMs] = useState(800)
  const [running, setRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0 = not started
  const [rejectedStep, setRejectedStep] = useState<number | undefined>(undefined)
  const [log, setLog] = useState<LogEntry[]>([])
  const [halted, setHalted] = useState(false)

  const logIdRef = useRef(0)
  const stepRef = useRef(0)
  const recordedRef = useRef(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  const { recordSimRun } = useWorkspace()

  const scenario = useMemo(() => SCENARIOS.find((s) => s.key === scenarioKey)!, [scenarioKey])

  const phases = useMemo(
    () => deriveStepStatuses(EPC_PHASES, currentStep === 0 ? 1 : currentStep, rejectedStep),
    [currentStep, rejectedStep],
  )

  const pushLog = useCallback(
    (stepId: number, severity: Severity, check: string, message: string) => {
      logIdRef.current += 1
      const time = new Date().toLocaleTimeString('en-GB', { hour12: false })
      setLog((prev) => [...prev, { id: logIdRef.current, stepId, time, severity, check, message }])
    },
    [],
  )

  // Validate a single step as the project enters it
  const validateStep = useCallback(
    (stepId: number): boolean => {
      const step = ALL_STEPS.find((s) => s.id === stepId)
      if (!step) return true
      const fault = scenario.faults[stepId]
      let stepFailed = false

      // Phase-boundary announcement
      const phase = EPC_PHASES.find((p) => p.id === step.phaseId)!
      if (phase.steps[0].id === stepId) {
        pushLog(stepId, 'info', 'Phase Transition', `Entering Phase ${phase.id}: ${phase.label}`)
      }

      pushLog(stepId, 'info', 'Step Entered', `Step ${stepId} — ${step.label}`)

      // 1. Approval gate assigned
      if (fault === 'no-gate' || !step.gate) {
        pushLog(stepId, 'error', 'Approval Gate', `No approver assigned — cannot route "${step.label}"`)
        stepFailed = true
      } else {
        pushLog(stepId, 'success', 'Approval Gate', `Gate "${step.gate}" resolved`)
      }

      // 2. Required documents present
      const docs = stepRequiredDocs[stepId] || []
      if (fault === 'missing-doc') {
        pushLog(stepId, 'error', 'Documents', `Missing required deliverable: ${docs[0] ?? 'unspecified document'}`)
        stepFailed = true
      } else if (docs.length === 0) {
        pushLog(stepId, 'warning', 'Documents', 'No document checklist defined for this step')
      } else {
        pushLog(stepId, 'success', 'Documents', `${docs.length} deliverable(s) verified`)
      }

      // 3. Schedule integrity
      if (fault === 'schedule-slip') {
        pushLog(stepId, 'warning', 'Schedule', 'Step forecast exceeds baseline — milestone slip detected')
      }

      // 4. Gate rejection (blocking)
      if (fault === 'reject') {
        pushLog(stepId, 'error', 'Gate Decision', `Gate "${step.gate}" REJECTED — workflow halted for rework`)
        stepFailed = true
        return false // signal halt
      }

      if (!stepFailed) {
        pushLog(stepId, 'success', 'Step Cleared', `Step ${stepId} passed all checks`)
      }
      return true
    },
    [scenario, pushLog],
  )

  // Advance exactly one step; returns whether the run may continue.
  // Validation side-effects run here (not inside a setState updater) so they
  // fire exactly once per step even under React StrictMode.
  const advance = useCallback((): boolean => {
    const next = stepRef.current + 1
    if (next > TOTAL_STEPS) return false

    const ok = validateStep(next)
    stepRef.current = next
    setCurrentStep(next)

    if (!ok) {
      setRejectedStep(next)
      setHalted(true)
      return false
    }
    if (next === TOTAL_STEPS) {
      pushLog(next, 'success', 'Closeout', 'Project reached step 50 — workflow completed')
      return false
    }
    return true
  }, [validateStep, pushLog])

  // Auto-run clock
  useEffect(() => {
    if (!running) return
    if (currentStep >= TOTAL_STEPS || halted) {
      const id = setTimeout(() => setRunning(false), 0)
      return () => clearTimeout(id)
    }
    const t = setTimeout(() => {
      const cont = advance()
      if (!cont) setRunning(false)
    }, speedMs)
    return () => clearTimeout(t)
  }, [running, currentStep, speedMs, halted, advance])

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [log])

  // Record the run into the shared workspace once it finishes (halt or completion)
  useEffect(() => {
    const finished = halted || currentStep >= TOTAL_STEPS
    if (!finished || currentStep === 0 || recordedRef.current) return
    recordedRef.current = true
    const runErrors = log.filter((l) => l.severity === 'error').length
    const runWarnings = log.filter((l) => l.severity === 'warning').length
    const runPassed = log.filter((l) => l.severity === 'success').length
    const issues = log
      .filter((l) => l.severity === 'error' || l.severity === 'warning')
      .map((l) => ({ stepId: l.stepId, severity: l.severity as 'warning' | 'error', message: `${l.check}: ${l.message}` }))
    recordSimRun({
      scenario: scenario.label,
      outcome: halted ? 'halted' : runErrors > 0 || runWarnings > 0 ? 'warnings' : 'passed',
      stepsRun: currentStep,
      passed: runPassed,
      warnings: runWarnings,
      errors: runErrors,
      issues,
    })
  }, [halted, currentStep, log, scenario, recordSimRun])

  const reset = useCallback(() => {
    setRunning(false)
    setHalted(false)
    setCurrentStep(0)
    setRejectedStep(undefined)
    setLog([])
    logIdRef.current = 0
    stepRef.current = 0
    recordedRef.current = false
  }, [])

  const handleScenarioChange = (key: ScenarioKey) => {
    setScenarioKey(key)
    reset()
  }

  const toggleRun = () => {
    if (currentStep >= TOTAL_STEPS || halted) return
    setRunning((r) => !r)
  }

  const stepOnce = () => {
    if (running || currentStep >= TOTAL_STEPS || halted) return
    advance()
  }

  // Derived metrics
  const errors = log.filter((l) => l.severity === 'error').length
  const warnings = log.filter((l) => l.severity === 'warning').length
  const passed = log.filter((l) => l.severity === 'success').length
  const progress = Math.round((currentStep / TOTAL_STEPS) * 100)
  const activeStep = ALL_STEPS.find((s) => s.id === currentStep)

  const runState = halted
    ? { label: 'HALTED', className: 'bg-red-950/20 text-red-400 border-red-800/30', dot: 'bg-red-500 animate-pulse' }
    : running
      ? { label: 'RUNNING', className: 'bg-accent text-amber-400 border-amber-500/30', dot: 'bg-primary animate-pulse' }
      : currentStep >= TOTAL_STEPS
        ? { label: 'COMPLETE', className: 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30', dot: 'bg-emerald-600' }
        : currentStep === 0
          ? { label: 'READY', className: 'bg-secondary/60 text-foreground border-primary/20', dot: 'bg-secondary' }
          : { label: 'PAUSED', className: 'bg-muted text-muted-foreground border-border', dot: 'bg-slate-400' }

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
              <FlaskConical className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight text-balance">
                Workflow Simulator
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl text-pretty">
                Dry-run a project through the full 50-step EPC lifecycle. Every step is validated for approval
                gates, required deliverables, schedule integrity and phase transitions.
              </p>
            </div>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold flex-shrink-0',
              runState.className,
            )}
          >
            <span className={cn('w-2 h-2 rounded-full', runState.dot)} />
            {runState.label}
          </span>
        </div>

        {/* Control bar */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
          {/* Scenario */}
          <div className="flex flex-col gap-1 min-w-[180px] flex-1">
            <label htmlFor="scenario" className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Test Scenario
            </label>
            <select
              id="scenario"
              value={scenarioKey}
              onChange={(e) => handleScenarioChange(e.target.value as ScenarioKey)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {SCENARIOS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Speed */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Speed</span>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {SPEEDS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSpeedMs(s.ms)}
                  className={cn(
                    'px-2.5 h-7 rounded-md text-xs font-medium transition-colors',
                    speedMs === s.ms ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Controls</span>
            <div className="flex items-center gap-2">
              <Button onClick={toggleRun} disabled={halted || currentStep >= TOTAL_STEPS} size="sm">
                {running ? <Pause /> : <Play />}
                {running ? 'Pause' : currentStep === 0 ? 'Run' : 'Resume'}
              </Button>
              <Button onClick={stepOnce} variant="outline" size="sm" disabled={running || halted || currentStep >= TOTAL_STEPS}>
                <SkipForward />
                Step
              </Button>
              <Button onClick={reset} variant="ghost" size="sm">
                <RotateCcw />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Scenario description */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground -mt-2">
          <ShieldAlert className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-foreground">{scenario.label}:</span>
          {scenario.description}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Current Step"
            value={`${currentStep} / ${TOTAL_STEPS}`}
            subtitle={activeStep ? activeStep.label : 'Not started'}
            icon={Gauge}
            accent="navy"
          />
          <KPICard title="Progress" value={`${progress}%`} subtitle={`Phase ${activeStep?.phaseId ?? '—'} of 7`} icon={ListChecks} accent="indigo" />
          <KPICard title="Checks Passed" value={passed} subtitle="Validation gates cleared" icon={CheckCircle2} accent="green" />
          <KPICard
            title="Issues Found"
            value={errors + warnings}
            subtitle={`${errors} error(s) · ${warnings} warning(s)`}
            icon={AlertTriangle}
            accent={errors > 0 ? 'red' : warnings > 0 ? 'orange' : 'green'}
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live workflow */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-foreground">Lifecycle Progression</h2>
              <span className="text-[10px] font-mono text-muted-foreground">50-step EPC workflow</span>
            </div>
            <WorkflowTimeline variant="phased" phases={phases} />
          </div>

          {/* Validation log + report */}
          <div className="space-y-6">
            {/* Report summary */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-4">Test Report</h2>
              <div className="grid grid-cols-3 gap-3">
                <ReportStat label="Passed" value={passed} tone="green" icon={CheckCircle2} />
                <ReportStat label="Warnings" value={warnings} tone="orange" icon={AlertTriangle} />
                <ReportStat label="Failures" value={errors} tone="red" icon={XCircle} />
              </div>
              {halted && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-800/30 bg-red-950/20 px-3 py-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-400">
                    Workflow halted at step {rejectedStep}. A blocking gate decision requires rework before the
                    lifecycle can continue. Fix the issue and reset to re-run.
                  </p>
                </div>
              )}
              {currentStep >= TOTAL_STEPS && errors === 0 && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-800/30 bg-emerald-950/20 px-3 py-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-400">
                    All 50 steps validated with no blocking errors. Workflow integrity confirmed.
                  </p>
                </div>
              )}
            </div>

            {/* Event log */}
            <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h2 className="text-sm font-bold text-foreground">Validation Log</h2>
                <span className="text-[10px] font-mono text-muted-foreground">{log.length} events</span>
              </div>
              <div className="h-[360px] overflow-y-auto px-2 py-2 sidebar-scroll">
                {log.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <FlaskConical className="w-8 h-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Select a scenario and press Run to simulate the workflow.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-0.5">
                    {log.map((entry) => {
                      const cfg = severityStyles[entry.severity]
                      const Icon = cfg.icon
                      return (
                        <li
                          key={entry.id}
                          className={cn(
                            'flex items-start gap-2.5 rounded-lg px-3 py-1.5 text-xs',
                            entry.severity === 'error' && 'bg-red-950/20',
                            entry.severity === 'warning' && 'bg-accent',
                          )}
                        >
                          <Icon className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', cfg.row)} />
                          <span className="font-mono text-[10px] text-muted-foreground/70 mt-0.5 w-16 flex-shrink-0">
                            {entry.time}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground/70 mt-0.5 w-8 flex-shrink-0">
                            #{entry.stepId}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className={cn('font-semibold mr-1.5', cfg.row)}>[{cfg.label}]</span>
                            <span className="text-foreground/80">{entry.check}:</span>{' '}
                            <span className="text-muted-foreground">{entry.message}</span>
                          </div>
                        </li>
                      )
                    })}
                    <div ref={logEndRef} />
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function ReportStat({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string
  value: number
  tone: 'green' | 'orange' | 'red'
  icon: React.ElementType
}) {
  const tones = {
    green: 'border-emerald-800/30 bg-emerald-950/20 text-emerald-400',
    orange: 'border-amber-500/20 bg-accent text-amber-400',
    red: 'border-red-800/30 bg-red-950/20 text-red-400',
  }
  return (
    <div className={cn('rounded-lg border p-3 flex flex-col items-center justify-center gap-1', tones[tone])}>
      <Icon className="w-4 h-4" />
      <span className="text-xl font-bold leading-none">{value}</span>
      <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </div>
  )
}
