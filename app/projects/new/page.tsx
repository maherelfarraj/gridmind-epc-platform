'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { useWorkspace } from '@/lib/workspace-store'
import { CheckCircle, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const steps = [
  { id: 1, label: 'Project Info', description: 'Basic project details' },
  { id: 2, label: 'Contract & Team', description: 'Contract details & team assignment' },
  { id: 3, label: 'Scope & BOQ', description: 'Scope of work & bill of quantities' },
  { id: 4, label: 'Schedule', description: 'Timeline & milestones' },
  { id: 5, label: 'Review & Submit', description: 'Final review & submission' },
]

export default function NewProjectPage() {
  const { addProject } = useWorkspace()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  // Auto-redirect to the new project detail page after 2.5 s
  useEffect(() => {
    if (!submitted || !createdId) return
    const t = setTimeout(() => router.push(`/projects/${createdId}`), 2500)
    return () => clearTimeout(t)
  }, [submitted, createdId, router])

  const [form, setForm] = useState({
    // Step 1
    projectName: '',
    projectId: '',
    client: '',
    type: '',
    location: '',
    region: '',
    description: '',
    // Step 2
    contractType: '',
    contractValue: '',
    currency: '',
    pm: '',
    engineeringMgr: '',
    procurementMgr: '',
    constructionMgr: '',
    // Step 3
    scope: '',
    capacity: '',
    boqItems: '',
    // Step 4
    startDate: '',
    targetDate: '',
    contractSignDate: '',
    // Step 5 handled on submit
  })

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    const created = addProject({
      name: form.projectName || 'Untitled Project',
      code: form.projectId || undefined,
      client: form.client || 'Unspecified Client',
      valueSAR: form.contractValue ? parseFloat(form.contractValue.replace(/,/g, '')) || 0 : 0,
      currency: form.currency || undefined,   // undefined → addProject falls back to workspace settings.currency
      pm: form.pm || undefined,
      description: form.description || undefined,
      contractType: form.contractType || undefined,
      capacity: form.capacity || undefined,
      location: form.location || undefined,
      startDate: form.startDate || undefined,
      targetDate: form.targetDate || undefined,
    })
    setCreatedId(created.id)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-emerald-950/20 border-4 border-emerald-800/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Project Submitted</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your new project has been submitted for review. The approval workflow has been initiated and stakeholders will be notified.
            </p>
            <div className="bg-secondary/60 border border-primary/20 rounded-xl p-4 text-left mb-6">
              <p className="text-xs text-muted-foreground">Project Reference</p>
              <p className="text-sm font-bold text-primary mt-0.5">{createdId || form.projectId || 'PRJ-2024-019'}</p>
              <p className="text-xs text-muted-foreground mt-2">Status</p>
              <p className="text-sm font-medium text-foreground mt-0.5">Pending Approval — Stage 1: Pre-Contract &amp; Tender</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setSubmitted(false); setStep(1); setCreatedId(null) }}
                className="border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Create Another
              </button>
              <a href={createdId ? `/projects/${createdId}` : '/projects'} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                View Project
              </a>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Project</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Create a new EPC project and initiate the Stage 1 workflow</p>
        </div>

        {/* Step indicator */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start gap-0">
            {steps.map((s, i) => {
              const isDone = s.id < step
              const isActive = s.id === step
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                        isDone
                          ? 'bg-secondary border-primary text-white'
                          : isActive
                          ? 'bg-primary border-amber-500 text-white'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}
                      onClick={() => isDone && setStep(s.id)}
                    >
                      {isDone ? <CheckCircle className="w-4 h-4" /> : s.id}
                    </div>
                    <p className={`text-[10px] font-medium mt-1.5 text-center max-w-[70px] leading-tight ${isActive ? 'text-amber-400' : isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {s.label}
                    </p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 mb-5 transition-colors ${isDone ? 'bg-secondary' : 'bg-border'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form content */}
        <div className="bg-card border border-border rounded-xl">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">
              Step {step}: {steps[step - 1].label}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{steps[step - 1].description}</p>
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Project Name *" required>
                  <input className="form-input" placeholder="e.g. NEOM Solar Farm Phase 2" value={form.projectName} onChange={e => update('projectName', e.target.value)} />
                </FormField>
                <FormField label="Project ID *" required>
                  <input className="form-input" placeholder="e.g. NEOM-SOL-005" value={form.projectId} onChange={e => update('projectId', e.target.value)} />
                </FormField>
                <FormField label="Client / Owner *" required>
                  <input className="form-input" placeholder="e.g. NEOM Company" value={form.client} onChange={e => update('client', e.target.value)} />
                </FormField>
                <FormField label="Project Type *" required>
                  <select className="form-input" value={form.type} onChange={e => update('type', e.target.value)}>
                    <option value="">Select type</option>
                    <option>Solar PV — Utility Scale</option>
                    <option>Solar PV — C&I</option>
                    <option>HV Substation</option>
                    <option>O&M Contract</option>
                    <option>Battery Storage</option>
                    <option>Hybrid Solar + Storage</option>
                  </select>
                </FormField>
                <FormField label="Location">
                  <input className="form-input" placeholder="e.g. Tabuk, Saudi Arabia" value={form.location} onChange={e => update('location', e.target.value)} />
                </FormField>
                <FormField label="Region">
                  <select className="form-input" value={form.region} onChange={e => update('region', e.target.value)}>
                    <option value="">Select region</option>
                    <option>Riyadh Region</option>
                    <option>Makkah Region</option>
                    <option>Madinah Region</option>
                    <option>Tabuk Region</option>
                    <option>Eastern Province</option>
                    <option>NEOM</option>
                    <option>Jizan Region</option>
                  </select>
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Project Description">
                    <textarea className="form-input resize-none" rows={3} placeholder="Brief description of the project scope and objectives..." value={form.description} onChange={e => update('description', e.target.value)} />
                  </FormField>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Contract Type *" required>
                  <select className="form-input" value={form.contractType} onChange={e => update('contractType', e.target.value)}>
                    <option value="">Select contract type</option>
                    <option>Lump Sum Turnkey (LSTK)</option>
                    <option>Engineering Procurement Construction (EPC)</option>
                    <option>Cost Plus</option>
                    <option>Unit Rate</option>
                    <option>Frame Agreement</option>
                  </select>
                </FormField>
                <FormField label="Contract Value *" required>
                  <div className="flex">
                    <select className="form-input rounded-r-none border-r-0 w-24 flex-shrink-0" value={form.currency} onChange={e => update('currency', e.target.value)}>
                      <option value="">Currency</option>
                      <option value="SAR">SAR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="AED">AED</option>
                      <option value="GBP">GBP</option>
                    </select>
                    <input className="form-input rounded-l-none flex-1" placeholder="e.g. 48,000,000" value={form.contractValue} onChange={e => update('contractValue', e.target.value)} />
                  </div>
                </FormField>
                <FormField label="Project Manager *" required>
                  <select className="form-input" value={form.pm} onChange={e => update('pm', e.target.value)}>
                    <option value="">Assign PM</option>
                    <option>Ahmed Al-Rashidi</option>
                    <option>Sara Al-Otaibi</option>
                    <option>Mohammed Hassan</option>
                    <option>Fatima Al-Zahra</option>
                    <option>Omar Abdullah</option>
                  </select>
                </FormField>
                <FormField label="Engineering Manager">
                  <select className="form-input" value={form.engineeringMgr} onChange={e => update('engineeringMgr', e.target.value)}>
                    <option value="">Assign Engineering Manager</option>
                    <option>Dr. Khaled Hassan</option>
                    <option>Eng. Tariq Al-Ghamdi</option>
                    <option>Eng. Nora Al-Qahtani</option>
                  </select>
                </FormField>
                <FormField label="Procurement Manager">
                  <select className="form-input" value={form.procurementMgr} onChange={e => update('procurementMgr', e.target.value)}>
                    <option value="">Assign Procurement Manager</option>
                    <option>Walid Al-Saud</option>
                    <option>Rania Abdullah</option>
                  </select>
                </FormField>
                <FormField label="Construction Manager">
                  <select className="form-input" value={form.constructionMgr} onChange={e => update('constructionMgr', e.target.value)}>
                    <option value="">Assign Construction Manager</option>
                    <option>Hassan Al-Yami</option>
                    <option>Ibrahim Al-Dossari</option>
                  </select>
                </FormField>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormField label="Scope of Work *" required>
                    <textarea className="form-input resize-none" rows={4} placeholder="Describe the full scope of work including deliverables, exclusions, and interfaces..." value={form.scope} onChange={e => update('scope', e.target.value)} />
                  </FormField>
                </div>
                <FormField label="Installed Capacity (MW)">
                  <input className="form-input" type="number" placeholder="e.g. 400" value={form.capacity} onChange={e => update('capacity', e.target.value)} />
                </FormField>
                <FormField label="BOQ Summary">
                  <input className="form-input" placeholder="e.g. 1,200 panels, 4 inverters..." value={form.boqItems} onChange={e => update('boqItems', e.target.value)} />
                </FormField>
                <div className="md:col-span-2">
                  <div className="bg-secondary/60 border border-primary/20 rounded-lg p-4">
                    <p className="text-xs font-semibold text-primary mb-2">Required Documents at Stage 1</p>
                    <ul className="space-y-1">
                      {['RFP Package', 'Scope Review Matrix', 'Bid / No-Bid Checklist', 'Preliminary BOQ', 'Cost Estimate Sheet', 'Proposal Cover Letter'].map(d => (
                        <li key={d} className="flex items-center gap-2 text-xs text-primary">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Contract Sign Date *" required>
                  <input className="form-input" type="date" value={form.contractSignDate} onChange={e => update('contractSignDate', e.target.value)} />
                </FormField>
                <FormField label="Project Start Date *" required>
                  <input className="form-input" type="date" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
                </FormField>
                <FormField label="Target Completion Date *" required>
                  <input className="form-input" type="date" value={form.targetDate} onChange={e => update('targetDate', e.target.value)} />
                </FormField>
                <div className="md:col-span-2">
                  <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <p className="text-xs font-semibold text-foreground mb-3">Key Milestones</p>
                    <div className="space-y-2">
                      {[
                        'Stage 1: Pre-Contract Approved',
                        'Stage 2: Contract Signed & Team Assigned',
                        'Stage 3: IFC Drawings Issued',
                        'Stage 4: All Materials Procured',
                        'Stage 5: Construction Complete',
                        'Stage 6: Final Payment Certificate Issued',
                        'Stage 7: PAC Issued & Handover',
                      ].map((m, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-secondary text-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="text-xs text-foreground">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="bg-secondary/60 border border-primary/20 rounded-xl p-5">
                  <p className="text-sm font-semibold text-foreground mb-4">Review Project Details</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Project Name', value: form.projectName || '—' },
                      { label: 'Project ID', value: form.projectId || '—' },
                      { label: 'Client', value: form.client || '—' },
                      { label: 'Type', value: form.type || '—' },
                      { label: 'Contract Value', value: form.contractValue ? `${form.currency} ${form.contractValue}` : '—' },
                      { label: 'Project Manager', value: form.pm || '—' },
                      { label: 'Location', value: form.location || '—' },
                      { label: 'Start Date', value: form.startDate || '—' },
                      { label: 'Target Date', value: form.targetDate || '—' },
                    ].map((field) => (
                      <div key={field.label}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{field.label}</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-accent border border-amber-500/20 rounded-lg p-4">
                  <p className="text-xs font-semibold text-amber-400 mb-1">Approval workflow will be initiated</p>
                  <p className="text-xs text-muted-foreground">
                    Submitting this project will notify: Proposal Manager, Engineering Manager, Finance Manager, and Commercial Director for Stage 1 approval.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="confirm" className="w-4 h-4 accent-primary" />
                  <label htmlFor="confirm" className="text-sm text-foreground">
                    I confirm all project details are accurate and ready for review.
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <div className="flex items-center gap-1.5">
              {steps.map(s => (
                <div key={s.id} className={`w-2 h-2 rounded-full transition-colors ${s.id === step ? 'bg-primary' : s.id < step ? 'bg-secondary' : 'bg-border'}`} />
              ))}
            </div>
            {step < 5 ? (
              <button
                onClick={() => setStep(s => Math.min(5, s + 1))}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="bg-secondary hover:bg-secondary/80 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Submit Project
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: var(--background);
          color: var(--foreground);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-input:focus {
          border-color: var(--ring);
          box-shadow: 0 0 0 3px rgba(57,68,172,0.12);
        }
        select.form-input {
          cursor: pointer;
        }
      `}</style>
    </AppLayout>
  )
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">
        {label}
        {required && <span className="text-amber-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
