'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import {
  BarChart3,
  Download,
  Sun,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { useState } from 'react'

const monthlyGeneration = [
  { month: 'Jan', generation: 28400, target: 30000, irradiance: 5.1 },
  { month: 'Feb', generation: 32100, target: 33000, irradiance: 5.6 },
  { month: 'Mar', generation: 38500, target: 39000, irradiance: 6.4 },
  { month: 'Apr', generation: 44200, target: 43000, irradiance: 7.2 },
  { month: 'May', generation: 49600, target: 48000, irradiance: 8.0 },
  { month: 'Jun', generation: 52400, target: 51000, irradiance: 8.6 },
  { month: 'Jul', generation: 51800, target: 52000, irradiance: 8.4 },
]

const performanceMetrics = [
  { week: 'W1', pr: 80.2, cf: 29.1, availability: 99.2 },
  { week: 'W2', pr: 78.9, cf: 28.6, availability: 99.0 },
  { week: 'W3', pr: 81.4, cf: 29.8, availability: 99.5 },
  { week: 'W4', pr: 79.7, cf: 28.9, availability: 98.8 },
  { week: 'W5', pr: 82.1, cf: 30.2, availability: 99.4 },
  { week: 'W6', pr: 79.3, cf: 28.7, availability: 99.1 },
]

const lossWaterfall = [
  { category: 'Theoretical Max',  value: 100,  type: 'start', fill: '#1E2230' },
  { category: 'Irradiance Loss',  value: -8.2, type: 'loss',  fill: '#C9A55A' },
  { category: 'Temperature Loss', value: -5.4, type: 'loss',  fill: '#C9A55A' },
  { category: 'Shading Loss',     value: -1.8, type: 'loss',  fill: '#9333EA' },
  { category: 'DC Wiring Loss',   value: -1.2, type: 'loss',  fill: '#C9A55A' },
  { category: 'Inverter Loss',    value: -2.1, type: 'loss',  fill: '#DC2626' },
  { category: 'Actual Output',    value: 81.3, type: 'end',   fill: '#10B981' },
]

const projectComparison = [
  { project: 'NEOM Solar',  generation: 52400, target: 52000, pr: 79.4 },
  { project: 'Riyadh EPC',  generation: 18200, target: 17800, pr: 81.2 },
  { project: 'Yanbu IND',   generation: 9400,  target: 9800,  pr: 76.8 },
]

// Irradiance vs power scatter (measured data points)
const irrVsPower = Array.from({ length: 40 }, (_, i) => {
  const irr = 100 + i * 23
  const power = irr * 0.395 + (Math.random() - 0.5) * 20
  return { irr: Math.round(irr), power: Math.round(power), z: 1 }
})

// String-level performance data
const stringPerformance = [
  { string: 'STR-A1-01', specificYield: 1842, pr: 80.1, availability: 99.8, degradation: 0.5,  status: 'normal' },
  { string: 'STR-A1-02', specificYield: 1831, pr: 79.4, availability: 99.6, degradation: 0.8,  status: 'normal' },
  { string: 'STR-A1-03', specificYield: 1698, pr: 73.8, availability: 99.0, degradation: 2.4,  status: 'degraded' },
  { string: 'STR-A1-04', specificYield: 1844, pr: 80.2, availability: 99.9, degradation: 0.4,  status: 'normal' },
  { string: 'STR-A2-01', specificYield: 1820, pr: 79.1, availability: 99.5, degradation: 0.7,  status: 'normal' },
  { string: 'STR-A2-02', specificYield: 1855, pr: 80.6, availability: 99.8, degradation: 0.3,  status: 'normal' },
  { string: 'STR-A3-01', specificYield: 1620, pr: 70.4, availability: 98.4, degradation: 3.8,  status: 'degraded' },
  { string: 'STR-A4-01', specificYield: 0,    pr: 0,    availability: 0,    degradation: 0,    status: 'fault' },
]

const stringStatusColor: Record<string, string> = {
  normal:   'text-emerald-400 bg-emerald-950/20 border-emerald-800/30',
  degraded: 'text-amber-400 bg-accent border-amber-500/20',
  fault:    'text-red-400 bg-red-950/20 border-red-800/30',
}

export default function SolarAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'strings' | 'irradiance'>('overview')
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly')

  const totalGenYTD     = monthlyGeneration.reduce((s, m) => s + m.generation, 0)
  const targetYTD       = monthlyGeneration.reduce((s, m) => s + m.target, 0)
  const achievementPct  = Math.round((totalGenYTD / targetYTD) * 100)

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Solar Analytics</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Performance ratio, generation yield, and string-level analysis across portfolio</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
              {(['daily', 'monthly', 'yearly'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                    period === p ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 border border-border text-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard title="YTD Generation"  value="297 GWh"          subtitle={`${achievementPct}% of target`}    icon={Zap}          accent="gold"   trend={{ value: achievementPct - 100, label: 'vs target' }} />
          <KPICard title="Portfolio PR"    value="79.4%"            subtitle="Avg performance ratio"             icon={Sun}          accent="orange" trend={{ value: -2.1, label: 'vs design' }} />
          <KPICard title="Capacity Factor" value="29.2%"            subtitle="Avg across portfolio"             icon={BarChart3}    accent="indigo" />
          <KPICard title="Availability"    value="99.1%"            subtitle="Technical availability"           icon={TrendingUp}   accent="green"  />
          <KPICard title="Specific Yield"  value="1,842 kWh/kWp"   subtitle="YTD specific yield"              icon={Sun}          accent="navy"   />
          <KPICard title="CO₂ Avoided"     value="148k ton"         subtitle="YTD carbon offset"               icon={TrendingDown} accent="green"  />
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex border-b border-border px-5 py-0">
            {([
              { id: 'overview',     label: 'Generation Overview' },
              { id: 'performance',  label: 'Performance Metrics' },
              { id: 'strings',      label: 'String Analysis' },
              { id: 'irradiance',   label: 'Irradiance vs Power' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-5 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Monthly Generation vs Target (MWh)</h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary inline-block" />Actual</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-secondary inline-block opacity-40" />Target</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyGeneration}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${Number(v ?? 0).toLocaleString()} MWh`]} />
                    <Bar dataKey="target"     name="Target" fill="#1E2230" opacity={0.3} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="generation" name="Actual" fill="#C9A55A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Project comparison */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">Project Performance Comparison</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {projectComparison.map(p => (
                    <div key={p.project} className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-foreground">{p.project}</p>
                        <span className={`text-xs font-bold ${p.pr >= 80 ? 'text-emerald-400' : p.pr >= 75 ? 'text-amber-400' : 'text-red-600'}`}>PR: {p.pr}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div><p className="text-muted-foreground">Actual</p><p className="font-bold text-foreground">{p.generation.toLocaleString()} MWh</p></div>
                        <div><p className="text-muted-foreground">Target</p><p className="font-bold text-foreground">{p.target.toLocaleString()} MWh</p></div>
                      </div>
                      <div className="bg-muted rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${p.generation >= p.target ? 'bg-emerald-600' : 'bg-primary'}`} style={{ width: `${Math.min((p.generation / p.target) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loss waterfall */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">Energy Loss Analysis — PR Waterfall (%)</h3>
                <div className="space-y-2">
                  {lossWaterfall.map(item => (
                    <div key={item.category} className="flex items-center gap-3">
                      <span className="text-xs text-foreground w-36 flex-shrink-0">{item.category}</span>
                      <div className="flex-1 flex items-center gap-2">
                        {item.type === 'loss' ? (
                          <>
                            <div className="flex-1 flex justify-end">
                              <div className="h-4 rounded opacity-80" style={{ width: `${Math.abs(item.value) * 5}%`, background: item.fill, minWidth: '8px' }} />
                            </div>
                            <span className="text-xs font-semibold w-14 text-right" style={{ color: item.fill }}>{item.value}%</span>
                          </>
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="h-4 rounded" style={{ width: `${Math.abs(item.value)}%`, background: item.fill }} />
                            </div>
                            <span className="text-xs font-bold w-14" style={{ color: item.fill }}>{item.value}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics Tab */}
          {activeTab === 'performance' && (
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">Weekly Performance Ratio & Availability (%)</h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" />PR</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#10B981] inline-block" />Availability</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis domain={[75, 102]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => [`${v}%`]} />
                  <Line type="monotone" dataKey="pr"           name="PR %"           stroke="#8B6F3A" strokeWidth={2} dot={{ r: 3, fill: '#C9A55A' }} />
                  <Line type="monotone" dataKey="availability" name="Availability %"  stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Week', 'PR (%)', 'Capacity Factor (%)', 'Availability (%)', 'Status'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {performanceMetrics.map(m => (
                      <tr key={m.week} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-xs font-semibold text-foreground">{m.week}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold ${m.pr >= 81 ? 'text-emerald-400' : m.pr >= 79 ? 'text-amber-400' : 'text-red-600'}`}>{m.pr}%</span></td>
                        <td className="px-4 py-3 text-xs text-foreground">{m.cf}%</td>
                        <td className="px-4 py-3 text-xs text-foreground">{m.availability}%</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${m.pr >= 80 ? 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30' : 'text-amber-400 bg-accent border-amber-500/20'}`}>
                            {m.pr >= 80 ? 'On Target' : 'Below Target'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* String Analysis Tab */}
          {activeTab === 'strings' && (
            <div>
              <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {stringPerformance.filter(s => s.status === 'normal').length} normal &nbsp;&middot;&nbsp;
                  <span className="text-amber-400 font-medium">{stringPerformance.filter(s => s.status === 'degraded').length} degraded</span> &nbsp;&middot;&nbsp;
                  <span className="text-red-600 font-medium">{stringPerformance.filter(s => s.status === 'fault').length} fault</span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['String ID', 'Specific Yield (kWh/kWp)', 'Performance Ratio', 'Availability', 'Degradation', 'Status', 'Action'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stringPerformance.map(s => (
                      <tr key={s.string} className={`hover:bg-muted/20 transition-colors ${s.status === 'fault' ? 'bg-red-950/20/30' : ''}`}>
                        <td className="px-5 py-3 text-xs font-mono text-primary font-medium">{s.string}</td>
                        <td className="px-5 py-3 text-xs font-semibold text-foreground">{s.specificYield > 0 ? s.specificYield.toLocaleString() : '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold ${s.pr >= 79 ? 'text-emerald-400' : s.pr >= 72 ? 'text-amber-400' : s.pr > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {s.pr > 0 ? `${s.pr}%` : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-foreground">{s.availability > 0 ? `${s.availability}%` : '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold ${s.degradation > 2 ? 'text-red-600' : s.degradation > 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {s.degradation > 0 ? `${s.degradation}%/yr` : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${stringStatusColor[s.status]}`}>{s.status}</span>
                        </td>
                        <td className="px-5 py-3">
                          <button className="text-xs text-primary hover:underline font-medium">
                            {s.status === 'fault' ? 'Diagnose' : 'Details'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Irradiance vs Power Scatter Tab */}
          {activeTab === 'irradiance' && (
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Irradiance vs Power Output — Measured Data Points</h3>
                <p className="text-xs text-muted-foreground mb-4">Each point represents a 15-min average. Deviation from linear indicates losses or soiling.</p>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                    <XAxis dataKey="irr" name="Irradiance (W/m²)" type="number" domain={[0, 1100]} tick={{ fontSize: 10 }} label={{ value: 'Irradiance (W/m²)', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                    <YAxis dataKey="power" name="Power (kW)" type="number" domain={[0, 420]} tick={{ fontSize: 10 }} label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <ZAxis range={[20, 20]} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} cursor={{ strokeDasharray: '3 3' }} formatter={(v, name) => [v, name]} />
                    <Scatter data={irrVsPower} fill="#C9A55A" opacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Max Irradiance', value: '980 W/m²', sub: 'Today at 13:00' },
                  { label: 'Peak Power', value: '399 kW', sub: 'Today at 13:00' },
                  { label: 'Correlation R²', value: '0.982', sub: 'Very strong fit' },
                  { label: 'Soiling Loss Est.', value: '1.8%', sub: 'vs clean baseline' },
                ].map(s => (
                  <div key={s.label} className="bg-muted/30 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
