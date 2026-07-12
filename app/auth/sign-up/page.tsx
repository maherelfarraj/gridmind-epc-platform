import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth/auth-form'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function SignUpPage() {
  const { data: session } = await auth.getSession()
  if (session?.user) redirect('/finance')
  return <AuthForm mode="sign-up" />
}
