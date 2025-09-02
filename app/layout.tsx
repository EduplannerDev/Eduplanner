import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import FeedbackClient from '@/components/feedback-client'
import AuthErrorBoundary from '@/components/auth-error-boundary'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ClarityAnalytics from '@/components/clarity-analytics'

export const metadata: Metadata = {
  title: "Eduplanner",
  description: "Planeaciones con IA",
  icons: {
    icon: [
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    shortcut: '/favicon-32x32.png',
    apple: {
      url: '/favicon.png',
      sizes: '192x192',
      type: 'image/png',
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthErrorBoundary>
            {children}
          </AuthErrorBoundary>
          <Toaster />
          <FeedbackClient />
          <Analytics />
          <SpeedInsights />
          <ClarityAnalytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
