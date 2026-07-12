'use server'

import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export type AuthState = { error: string } | null

export async function signInWithEmail(_state: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Enter your email and password.' }
  const { error } = await auth.signIn.email({ email, password })
  if (error) return { error: error.message || 'Unable to sign in.' }
  redirect('/finance')
}

export async function signUpWithEmail(_state: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!name || !email || password.length < 8) return { error: 'Enter your name, email, and a password of at least 8 characters.' }
  const { error } = await auth.signUp.email({ name, email, password })
  if (error) return { error: error.message || 'Unable to create the account.' }
  redirect('/finance')
}

export async function signOut() {
  await auth.signOut()
  redirect('/auth/sign-in')
}
