'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import TicketMark from './TicketMark'

const NAV = [
  { href: '/', label: '好单' },
  { href: '/weekly', label: '本周精选' },
  { href: '/about', label: '关于' },
]

export default function SiteHeader({ siteName, weeklyCount }: { siteName: string; weeklyCount: number }) {
  const pathname = usePathname()

  // 往下滚隐藏顶栏，往上滚出现，把屏幕留给列表
  useEffect(() => {
    const root = document.documentElement
    root.dataset.header = 'shown'
    let lastY = window.scrollY
    let ticking = false
    const update = () => {
      ticking = false
      const y = window.scrollY
      if (Math.abs(y - lastY) < 6) return
      root.dataset.header = y > lastY && y > 120 ? 'hidden' : 'shown'
      lastY = y
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  return (
    <header className="site-header sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <TicketMark className="h-7 w-7 shrink-0" />
          <span className="truncate text-[17px] font-semibold text-ink">{siteName}</span>
        </Link>
        <nav className="flex shrink-0 items-center text-[15px]">
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-14 items-center gap-1 px-2.5 transition-colors ${
                  active ? 'font-semibold text-ink' : 'text-muted hover:text-ink'
                }`}
              >
                {item.label}
                {item.href === '/weekly' && weeklyCount > 0 && (
                  <span className="min-w-[18px] rounded-full bg-brand px-1.5 text-center text-[11px] font-medium leading-[18px] text-white">
                    {weeklyCount}
                  </span>
                )}
                <span
                  className={`absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-brand transition duration-200 ${
                    active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                  }`}
                />
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
