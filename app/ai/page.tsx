'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { ControlsIntelligence } from '@/components/ai/controls-intelligence'
import { DeliveryIntelligence } from '@/components/ai/delivery-intelligence'
import { ExecutiveIntelligence } from '@/components/ai/executive-intelligence'
import { cn } from '@/lib/utils'
import { Brain, HardHat, LineChart, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type Tab = 'executive' | 'delivery' | 'controls'

const tabs: { id: Tab; label: string; sub: string; icon: React.ElementType; href: string }[] = [
  { id: 'executive', label: 'Executive Intelligence', sub: 'Board-level portfolio insight', icon: LineChart, href: '/ai/executive' },
  { id: 'delivery', label: 'Delivery Intelligence', sub: 'Gate readiness & deliverables', icon: HardHat, href: '/ai/delivery' },
  { id: 'controls', label: 'Controls Intelligence', sub: 'EVM, cost & commercial', icon: Brain, href: '/ai/controls' },
]

export default function AICommandCenterPage() {
  const [active, setActive] = useState<Tab>('executive')

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">AI Command Center</h1>
              <p className="text-sm text-muted-foreground">Three intelligence systems across the EPC portfolio</p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-accent text-amber-400 font-semibold self-start sm:self-auto">
            Mock AI · Demo data
          </span>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tabs.map((t) => {
            const Icon = t.icon
            const isActive = active === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  'text-left rounded-xl border p-4 transition-all duration-150',
                  isActive ? 'border-primary bg-secondary/60 shadow-sm' : 'border-border bg-card hover:border-primary/40'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isActive ? 'bg-primary text-white' : 'bg-secondary/60 text-primary')}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{t.sub}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Deep-link hint */}
        <div className="flex items-center justify-end -mt-2">
          <Link href={tabs.find((t) => t.id === active)!.href} className="text-xs font-medium text-primary hover:underline">
            Open {tabs.find((t) => t.id === active)!.label} full view →
          </Link>
        </div>

        {/* Active workspace */}
        {active === 'executive' && <ExecutiveIntelligence />}
        {active === 'delivery' && <DeliveryIntelligence />}
        {active === 'controls' && <ControlsIntelligence />}
      </div>
    </AppLayout>
  )
}
