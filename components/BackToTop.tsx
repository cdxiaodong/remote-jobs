'use client'

import { useEffect, useState } from 'react'
import { ArrowUpIcon } from './icons'

export default function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      aria-label="回到顶部"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed right-4 z-30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-surface text-ink shadow-[0_2px_12px_rgb(0_0_0/0.12)] transition duration-300 ${
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <ArrowUpIcon className="h-5 w-5" />
    </button>
  )
}
