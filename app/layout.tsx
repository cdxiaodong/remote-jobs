import type { CSSProperties, ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import BackToTop from '@/components/BackToTop'
import { siteConfig } from '@/lib/config'
import { getWeeklyHighValue } from '@/lib/jobs'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · 程序员远程兼职精选`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} · 程序员远程兼职精选`,
    description: siteConfig.description,
    locale: 'zh_CN',
  },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1b1b1d' },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" style={{ '--primary': siteConfig.primaryColor } as CSSProperties}>
      <body className="flex min-h-dvh flex-col bg-canvas font-sans text-ink antialiased">
        <SiteHeader siteName={siteConfig.name} weeklyCount={getWeeklyHighValue().length} />
        <main className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 pb-6">{children}</main>
        <SiteFooter />
        <BackToTop />
      </body>
    </html>
  )
}
