'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { BarChart3, FileCheck, Loader2, LockKeyhole, ShieldCheck, TrendingUp } from 'lucide-react'
import { signInWithEmail, signUpWithEmail } from '@/app/auth/actions'

const FEATURES = [
  { icon: BarChart3,  label: 'Portfolio Intelligence',  desc: 'Real-time EVM, IRR, and DSCR across all projects'  },
  { icon: FileCheck,  label: 'Stage Gate Governance',   desc: 'G0–G8 gate pack automation with AI readiness scores' },
  { icon: TrendingUp, label: 'Finance Control',         desc: 'Bankable cash-flow models with evidence traceability' },
]

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const action = mode === 'sign-in' ? signInWithEmail : signUpWithEmail
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <main className="flex min-h-screen bg-background">

      {/* ── Left brand panel ── */}
      <aside className="hidden lg:flex lg:w-[52%] flex-col justify-between bg-[#080A0E] p-12 relative overflow-hidden">

        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(201,165,90,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,165,90,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Top: wordmark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-primary/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">GSI Holding Company</p>
              <p className="text-sm font-semibold tracking-wide text-foreground">GridMind EPC</p>
            </div>
          </div>
        </div>

        {/* Middle: headline + features */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <p className="text-[10px] tracking-[0.25em] uppercase text-primary font-semibold">
              Project Finance Control Platform
            </p>
            <h1 className="text-4xl font-bold leading-tight text-balance text-foreground">
              Intelligence for every<br />
              stage of the project.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
              From bid to handover — unified controls, AI-assisted decisions, and bankable financial models.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="mt-0.5 w-8 h-8 rounded border border-primary/25 bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: classification bar */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">Restricted Access</p>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/50">
            © 2025 GSI Holding Company. All information is commercially sensitive and confidential.
          </p>
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <section className="flex flex-1 flex-col items-center justify-center p-6 lg:p-12" style={{ backgroundColor: '#0D0F14' }}>

        {/* Mobile wordmark */}
        <div className="flex lg:hidden items-center gap-2 mb-8 self-start">
          <div className="w-7 h-7 rounded border border-primary/40 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground tracking-wide">GridMind EPC</p>
        </div>

        <div className="w-full max-w-sm space-y-8">

          {/* Header */}
          <div className="space-y-1">
            <p className="text-[10px] tracking-[0.2em] uppercase text-primary font-semibold">
              {mode === 'sign-in' ? 'Secure Access' : 'Register Account'}
            </p>
            <h2 className="text-2xl font-bold text-foreground">
              {mode === 'sign-in' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === 'sign-in'
                ? 'Sign in to access your project portfolio.'
                : 'Secure access to financial models and approvals.'}
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-4">

            {mode === 'sign-up' && (
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-[10px] tracking-[0.15em] uppercase font-semibold text-muted-foreground">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Ahmed Al-Rashid"
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] tracking-[0.15em] uppercase font-semibold text-muted-foreground">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@gsi-holding.com"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[10px] tracking-[0.15em] uppercase font-semibold text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                placeholder={mode === 'sign-in' ? '••••••••' : 'Min. 8 characters'}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>

            {state?.error && (
              <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                {state.error}
              </p>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={pending}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold tracking-wide text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {pending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <LockKeyhole className="h-4 w-4" />}
                {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-muted-foreground">
            {mode === 'sign-in' ? 'Need an account?' : 'Already registered?'}{' '}
            <Link
              href={mode === 'sign-in' ? '/auth/sign-up' : '/auth/sign-in'}
              className="font-semibold text-primary hover:underline underline-offset-4"
            >
              {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
