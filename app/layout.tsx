import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { WorkspaceProvider } from '@/lib/workspace-store'
import './globals.css'

export const metadata: Metadata = {
  title: 'GridMind EPC — GSI Holding Company',
  description: 'Premium enterprise EPC workflow management platform for GSI Holding Company. Manage solar projects from pre-contract through handover.',
  keywords: ['EPC', 'solar', 'engineering', 'procurement', 'construction', 'GSI'],
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#0D0F14',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background font-sans" style={{ colorScheme: 'dark' }}>
      <body className="antialiased font-sans">
        <WorkspaceProvider>{children}</WorkspaceProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
