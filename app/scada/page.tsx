'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { KPICard } from '@/components/shared/kpi-card'
import { useWorkspace } from '@/lib/workspace-store'
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  Gauge,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
  X,
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
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useState } from 'react'

const inverters = [
  { id: 'INV-01', name: 'Block A1', power: 98.4,  status: 'online',       efficiency: 98.2, temp: 42, alerts: 0 },
  { id: 'INV-02', name: 'Block A2', power: 97.1,  status: 'online',       efficiency: 97.8, temp: 44, alerts: 0 },
  { id: 'INV-03', name: 'Block A3', power: 95.8,  status: 'online',       efficiency: 96.9, temp: 46, alerts: 1 },
  { id: 'INV-04', name: 'Block A4', power: 0,     status: 'fault',        efficiency: 0,    temp: 38, alerts: 2 },
  { id: 'INV-05', name: 'Block B1', power: 99.2,  status: 'online',       efficiency: 99.0, temp: 41, alerts: 0 },
  { id: 'INV-06', name: 'Block B2', power: 96.5,  status: 'online',       efficiency: 97.1, temp: 43, alerts: 0 },
  { id: 'INV-07', name: 'Block B3', power: 0,     status: 'maintenance',  efficiency: 0,    temp: 35, alerts: 0 },
  { id: 'INV-08', name: 'Block B4', power: 98.0,  status: 'online',       efficiency: 98.4, temp: 42, alerts: 0 },
]

const powerGenHistory = [
  { time: '06:00', power: 0,   irradiance: 0   },
  { time: '07:00', power: 42,  irradiance: 180 },
  { time: '08:00', power: 185, irradiance: 420 },
  { time: '09:00', power: 312, irradiance: 650 },
  { time: '10:00', power: 358, irradiance: 780 },
  { time: '11:00', power: 388, irradiance: 870 },
  { time: '12:00', power: 395, irradiance: 950 },
  { time: '13:00', power: 399, irradiance: 980 },
  { time: '14:00', power: 390, irradiance: 940 },
  { time: '15:00', power: 364, irradiance: 810 },
  { time: '16:00', power: 304, irradiance: 650 },
  { time: '17:00', power: 198, irradiance: 420 },
  { time: '18:00', power: 62,  irradiance: 140 },
  { time: '19:00', power: 0,   irradiance: 0   },
]

const historicalData = [
  { date: 'Jul 3', energy: 2640, pr: 77.2, availability: 99.1 },
  { date: 'Jul 4', energy: 2820, pr: 79.8, availability: 99.5 },
  { date: 'Jul 5', energy: 2580, pr: 75.4, availability: 98.2 },
  { date: 'Jul 6', energy: 2900, pr: 81.1, availability: 99.8 },
  { date: 'Jul 7', energy: 2760, pr: 78.3, availability: 99.4 },
  { date: 'Jul 8', energy: 2810, pr: 79.0, availability: 99.2 },
  { date: 'Jul 9', energy: 2840, pr: 79.4, availability: 99.1 },
]

const stringData = [
  { string: 'STR-A1-01', voltage: 598, current: 8.2, power: 49.0, status: 'normal' },
  { string: 'STR-A1-02', voltage: 601, current: 8.1, power: 48.7, status: 'normal' },
  { string: 'STR-A1-03', voltage: 594, current: 7.8, power: 46.3, status: 'low' },
  { string: 'STR-A1-04', voltage: 600, current: 8.2, power: 49.2, status: 'normal' },
  { string: 'STR-A2-01', voltage: 599, current: 8.0, power: 47.9, status: 'normal' },
  { string: 'STR-A2-02', voltage: 602, current: 8.3, power: 50.0, status: 'normal' },
  { string: 'STR-A3-01', voltage: 585, current: 7.2, power: 42.1, status: 'low' },
  { string: 'STR-A4-01', voltage: 0,   current: 0,   power: 0,    status: 'fault' },
]

const initialAlarms = [
  { id: 'ALM-001', severity: 'fault',   device: 'Inverter Block A4', message: 'DC overcurrent fault — IGBT protection triggered', time: '14:22', status: 'active' },
  { id: 'ALM-002', severity: 'warning', device: 'Inverter Block A3', message: 'High temperature warning — cabinet cooling reduced', time: '13:45', status: 'active' },
  { id: 'ALM-003', severity: 'warning', device: 'MV Feeder 02',      message: 'Voltage imbalance detected — within tolerance',      time: '11:20', status: 'acknowledged' },
  { id: 'ALM-004', severity: 'info',    device: 'Meteo Station 01',  message: 'Wind speed above 10 m/s — monitoring',               time: '10:05', status: 'acknowledged' },
]

const statusColors = {
  online:      { dot: 'bg-emerald-600',                   text: 'text-emerald-400',          bg: 'bg-emerald-950/20'      },
  fault:       { dot: 'bg-red-500 animate-pulse',        text: 'text-red-400',            bg: 'bg-red-950/20'        },
  maintenance: { dot: 'bg-primary',                    text: 'text-amber-400',          bg: 'bg-accent'     },
  offline:     { dot: 'bg-gray-400',                     text: 'text-muted-foreground',   bg: 'bg-muted'         },
}

const alarmColors = {
  fault:   'text-red-400 bg-red-950/20 border-red-800/30',
  warning: 'text-amber-400 bg-accent border-amber-500/20',
  info:    'text-primary bg-secondary/60 border-primary/20',
}

const stringStatusColors: Record<string, string> = {
  normal: 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30',
  low:    'text-amber-400 bg-accent border-amber-500/20',
  fault:  'text-red-400 bg-red-950/20 border-red-800/30',
}

export default function SCADAPage() {
  const { projects } = useWorkspace()
  // Only solar plants (projects with a capacity) can be monitored via SCADA
  const plants = projects.filter((p) => p.capacity && p.capacity !== '—')
  const [activeTab, setActiveTab] = useState<'live' | 'historical' | 'strings' | 'alarms'>('live')
  const [alarms, setAlarms] = useState(initialAlarms)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [selectedPlantId, setSelectedPlantId] = useState(plants[0]?.id ?? '')

  const selectedPlant = plants.find((p) => p.id === selectedPlantId) ?? plants[0]

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const acknowledgeAlarm = (id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a))
    showToast(`Alarm ${id} acknowledged`)
  }

  const onlineCount  = inverters.filter(i => i.status === 'online').length
  const faultCount   = inverters.filter(i => i.status === 'fault').length
  const activeAlarms = alarms.filter(a => a.status === 'active').length

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1600px]">
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-secondary text-foreground text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-auto text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">SCADA Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Real-time plant monitoring — {selectedPlant ? `${selectedPlant.name} ${selectedPlant.capacity}` : 'No solar plant selected'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {plants.length > 0 && (
              <select
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                aria-label="Select plant to monitor"
                className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.capacity})
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-2 text-xs bg-emerald-950/20 text-emerald-400 border border-emerald-800/30 px-3 py-1.5 rounded-lg font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live — Jul 9, 2024 14:38
            </div>
            <button onClick={() => showToast('Data refreshed')} className="flex items-center gap-2 border border-border text-foreground text-sm font-medium px-3 py-2 rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard title="Current Power"   value="584 MW"    subtitle="vs 600 MW rated"    icon={Zap}          accent="gold"   />
          <KPICard title="Today's Energy"  value="2,840 MWh" subtitle="vs 3,120 MWh plan"  icon={Activity}     accent="indigo" />
          <KPICard title="Plant PR"        value="79.4%"     subtitle="Performance ratio"   icon={Gauge}        accent="green"  trend={{ value: -2, label: 'vs yesterday' }} />
          <KPICard title="Irradiance"      value="940 W/m²"  subtitle="Global horizontal"  icon={Sun}          accent="orange" />
          <KPICard title="Active Alarms"   value={String(activeAlarms)} subtitle={`${faultCount} faults`} icon={Bell} accent="red" />
          <KPICard title="Inverters Online" value={`${onlineCount}/${inverters.length}`} subtitle={`${faultCount} faults`} icon={CheckCircle} accent="navy" />
        </div>

        {/* Weather strip */}
        <div className="bg-card border border-border rounded-xl px-5 py-3">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2"><Sun className="w-4 h-4 text-primary" /><span className="text-xs font-medium text-foreground">GHI: 940 W/m²</span></div>
            <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-amber-400" /><span className="text-xs font-medium text-foreground">Ambient: 38°C</span></div>
            <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-primary" /><span className="text-xs font-medium text-foreground">Wind: 4.2 m/s NW</span></div>
            <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-foreground" /><span className="text-xs font-medium text-foreground">Module Temp: 62°C</span></div>
            <div className="ml-auto text-xs text-muted-foreground">Forecast: Clear sky &nbsp;&middot;&nbsp; <span className="text-primary font-medium">Cloud: 5%</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex border-b border-border px-5 py-0">
            {([
              { id: 'live',       label: 'Live Overview' },
              { id: 'strings',    label: 'String Monitor' },
              { id: 'historical', label: 'Historical' },
              { id: 'alarms',     label: `Alarms${activeAlarms > 0 ? ` (${activeAlarms})` : ''}` },
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

          {/* Live Overview */}
          {activeTab === 'live' && (
            <div className="p-5 space-y-5">
              <div className="bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Power Output & Irradiance — Today</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Real-time data, 15-min resolution</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" />Power (kW)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" />Irradiance</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={powerGenHistory}>
                    <defs>
                      <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A55A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C9A55A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Area yAxisId="left" type="monotone" dataKey="power" name="Power (kW)" stroke="#8B6F3A" strokeWidth={2} fill="url(#powerGrad)" />
                    <Line yAxisId="right" type="monotone" dataKey="irradiance" name="Irradiance" stroke="#C9A55A" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Inverter grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Inverter Status</h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />Online ({onlineCount})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Fault ({faultCount})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Maint. (1)</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
                  {inverters.map(inv => {
                    const sc = statusColors[inv.status as keyof typeof statusColors]
                    return (
                      <div key={inv.id} className={`rounded-xl border p-3 cursor-pointer hover:shadow-md transition-all ${
                        inv.status === 'fault' ? 'border-red-800/30 bg-red-950/20/50' :
                        inv.status === 'maintenance' ? 'border-amber-500/20 bg-accent/50' :
                        'border-border bg-muted/20'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-mono text-muted-foreground">{inv.id}</span>
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                            {inv.alerts > 0 && (
                              <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">{inv.alerts}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] font-semibold text-foreground mb-1.5 leading-tight">{inv.name}</p>
                        <div className="space-y-0.5 text-[9px]">
                          <div className="flex justify-between"><span className="text-muted-foreground">Power</span><span className="font-bold">{inv.power > 0 ? `${inv.power}kW` : '—'}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Eff</span><span className={`font-bold ${inv.efficiency > 97 ? 'text-emerald-400' : inv.efficiency > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}>{inv.efficiency > 0 ? `${inv.efficiency}%` : '—'}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Temp</span><span className={`font-bold ${inv.temp > 45 ? 'text-amber-400' : ''}`}>{inv.temp}°C</span></div>
                        </div>
                        <div className={`mt-1.5 text-[8px] font-semibold uppercase px-1 py-0.5 rounded text-center ${sc.text} ${sc.bg}`}>{inv.status}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* String Monitor */}
          {activeTab === 'strings' && (
            <div>
              <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{stringData.length} strings monitored &nbsp;&middot;&nbsp; <span className="text-red-600 font-medium">1 fault</span> &nbsp;&middot;&nbsp; <span className="text-amber-400 font-medium">2 low output</span></p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['String ID', 'Voltage (V)', 'Current (A)', 'Power (kW)', 'Status', 'Action'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stringData.map(s => (
                      <tr key={s.string} className={`hover:bg-muted/20 transition-colors ${s.status === 'fault' ? 'bg-red-950/20/30' : ''}`}>
                        <td className="px-5 py-3 text-xs font-mono text-primary font-medium">{s.string}</td>
                        <td className="px-5 py-3 text-xs text-foreground">{s.voltage > 0 ? s.voltage : '—'}</td>
                        <td className="px-5 py-3 text-xs text-foreground">{s.current > 0 ? s.current : '—'}</td>
                        <td className="px-5 py-3 text-xs font-semibold text-foreground">{s.power > 0 ? s.power : '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${stringStatusColors[s.status]}`}>{s.status}</span>
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={() => showToast(`String ${s.string} report opened`)} className="text-xs text-primary hover:underline font-medium">
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

          {/* Historical */}
          {activeTab === 'historical' && (
            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4">7-Day Energy & Performance Ratio</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(232,228,220,0.08)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[2400, 3000]} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[70, 85]} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar yAxisId="left" dataKey="energy" name="Energy (MWh)" fill="#C9A55A" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="pr" name="PR (%)" stroke="#8B6F3A" strokeWidth={2} dot={{ r: 3, fill: '#C9A55A' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Date', 'Energy (MWh)', 'Performance Ratio', 'Availability', 'vs Plan'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historicalData.map(d => (
                      <tr key={d.date} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3 text-xs font-semibold text-foreground">{d.date}</td>
                        <td className="px-5 py-3 text-xs text-foreground">{d.energy.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold ${d.pr >= 79 ? 'text-emerald-400' : d.pr >= 76 ? 'text-amber-400' : 'text-red-600'}`}>{d.pr}%</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-foreground">{d.availability}%</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${d.energy >= 2800 ? 'text-emerald-400 bg-emerald-950/20 border-emerald-800/30' : 'text-amber-400 bg-accent border-amber-500/20'}`}>
                            {d.energy >= 2800 ? 'On Target' : 'Below Target'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Alarms */}
          {activeTab === 'alarms' && (
            <div>
              {activeAlarms > 0 && (
                <div className="flex items-center gap-3 px-5 py-3 bg-red-950/20 border-b border-red-800/30">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs font-medium text-red-400">{activeAlarms} active alarm{activeAlarms > 1 ? 's' : ''} require acknowledgment.</p>
                </div>
              )}
              <div className="divide-y divide-border">
                {alarms.map(alm => (
                  <div key={alm.id} className={`p-5 ${alm.status !== 'active' ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase flex-shrink-0 mt-0.5 ${alarmColors[alm.severity as keyof typeof alarmColors]}`}>
                          {alm.severity}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{alm.device}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alm.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{alm.time} &nbsp;&middot;&nbsp; <span className={`font-medium capitalize ${alm.status === 'active' ? 'text-red-600' : 'text-muted-foreground'}`}>{alm.status}</span></p>
                        </div>
                      </div>
                      {alm.status === 'active' && (
                        <button
                          onClick={() => acknowledgeAlarm(alm.id)}
                          className="flex-shrink-0 text-xs font-semibold text-primary border border-primary/30 bg-secondary/60 hover:bg-[#dde1f8] px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
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
