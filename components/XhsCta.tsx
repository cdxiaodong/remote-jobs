'use client'

import { useEffect, useState } from 'react'

const DEFAULT_NOTE = '每天整理远程好单，第一时间推送给你'

function legacyCopy(text: string): boolean {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  ta.remove()
  return ok
}

export default function XhsCta({ account, note }: { account: string; note: string }) {
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2000)
    return () => clearTimeout(t)
  }, [toast])

  const copy = async () => {
    let ok = false
    try {
      await navigator.clipboard.writeText(account)
      ok = true
    } catch {
      ok = legacyCopy(account)
    }
    setToast(ok ? '已复制，打开小红书搜索即可' : '复制失败，请手动输入账号')
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl bg-surface p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-semibold text-white">
          关注
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink [overflow-wrap:anywhere]">小红书搜「{account}」</p>
          <p className="mt-0.5 text-xs leading-relaxed text-faint">{note || DEFAULT_NOTE}</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 cursor-pointer rounded-full bg-brand px-4 py-1.5 text-[13px] font-medium text-white transition-opacity active:opacity-80"
        >
          复制账号
        </button>
      </div>
      <div role="status" aria-live="polite" className={`toast ${toast ? 'toast-show' : ''}`}>
        {toast}
      </div>
    </>
  )
}
