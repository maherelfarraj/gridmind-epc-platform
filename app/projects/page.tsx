'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { fmtProjectValue, useWorkspace } from '@/lib/workspace-store'
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Grid3X3,
  LayoutList,
  Layers,
  Plus,
  Search,
  Sun,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'



function formatPortfolioValue(totalM: number, currency = 'SAR'): string {
  const ccy = currency || 'SAR'
  if (totalM >= 1000) return `${ccy} ${(totalM / 1000).toFixed(2)}B`
  return `${ccy} ${Math.round(totalM).toLocaleString()}M`
}

const stageColors: Record<number, string> = {
  1: 'bg-secondary/60 text-foreground border-primary/20',
  2: 'bg-secondary/60 text-primary border-primary/20',
  3: 'bg-secondary/60 text-teal-400 border-teal-800/30',
  4: 'bg-accent text-primary border-primary/30',
  5: 'bg-accent text-amber-400 border-amber-500/30',
  6: 'bg-emerald-950/20 text-emerald-400 border-emerald-800/30',
  7: 'bg-purple-950/20 text-purple-400 border-purple-800/30',
}

export default function ProjectsPage() {
  const { projects, settings } = useWorkspace()
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase())
    const matchStage = stageFilter === 'all' || p.phaseName.toLowerCase() === stageFilter.toLowerCase()
    return matchSearch && matchStage
  })

  const portfolioValue = useMemo(() => projects.reduce((s, p) => s + p.valueSAR / 1_000_000, 0), [projects])
  const overdue = useMemo(() => projects.filter(p => p.alert).length, [projects])
  const avgCompletion = useMemo(
    () => (projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0),
    [projects],
  )

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage all EPC projects across 7 phases and 50 workflow steps</p>
          </div>
          <Link
            href="/projects/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-fit"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Total Projects" value={projects.length.toString()} subtitle="All stages" icon={Layers} accent="navy" />
          <KPICard title="Portfolio Value" value={formatPortfolioValue(portfolioValue, settings.currency)} subtitle="Active projects" icon={DollarSign} accent="gold" />
          <KPICard title="Overdue Milestones" value={overdue.toString()} subtitle="Need attention" icon={AlertTriangle} accent="red" />
          <KPICard title="Avg Completion" value={`${avgCompletion}%`} subtitle="Portfolio average" icon={Sun} accent="orange" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search projects or clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
          </div>
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Phases</option>
            <option value="pre-contract & tender">P1 · Pre-Contract & Tender (Steps 1–6)</option>
            <option value="contract & project setup">P2 · Contract & Project Setup (Steps 7–13)</option>
            <option value="engineering & design">P3 · Engineering & Design (Steps 14–20)</option>
            <option value="procurement & supply chain">P4 · Procurement & Supply Chain (Steps 21–27)</option>
            <option value="construction planning & execution">P5 · Construction Planning & Execution (Steps 28–36)</option>
            <option value="finance & commercial control">P6 · Finance & Commercial Control (Steps 37–43)</option>
            <option value="testing, commissioning & handover">P7 · Testing, Commissioning & Handover (Steps 44–50)</option>
          </select>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 ml-auto">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded transition-colors ${view === 'list' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 rounded transition-colors ${view === 'grid' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Project list */}
        {view === 'list' ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Project', 'Client', 'Stage', 'Progress', 'Value', 'Target Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0">
                            <Sun className="w-4 h-4 text-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground">{p.name}</p>
                              {p.alert && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-foreground">{p.client}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit ${stageColors[p.phaseId]}`}>
                            P{p.phaseId} · {p.phaseName}
                          </span>
                          <span className="text-[10px] text-muted-foreground pl-0.5">{p.activeStep}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 bg-muted rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-foreground">{fmtProjectValue(p.valueSAR, p.currency)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {p.targetDate}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/projects/${p.id}`} className="text-xs text-primary hover:underline font-medium">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all hover:border-primary/30 cursor-pointer group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0">
                        <Sun className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{p.name}</p>
                          {p.alert && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{p.id}</p>
                      </div>
                    </div>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div className="bg-muted rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className={`px-2 py-0.5 rounded-full border font-semibold text-[10px] w-fit ${stageColors[p.phaseId]}`}>
                        P{p.phaseId} · {p.phaseName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{p.activeStep}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                      <User className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{p.pm}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs">
                    <span className="font-bold text-foreground">{fmtProjectValue(p.valueSAR, p.currency)}</span>
                    <span className="text-muted-foreground">{p.targetDate}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
