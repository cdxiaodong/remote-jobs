'use client'

import { useEffect, useState } from 'react'
import { formatDate, formatDateTime, relativeTime } from '@/lib/job-utils'

// 静态页构建时间早于访问时间，相对时间必须在浏览器端计算；首屏先显示绝对日期，避免水合不一致
export default function RelativeTime({ iso }: { iso: string }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => setNow(Date.now()), [])
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className="shrink-0 tabular-nums">
      {now === null ? formatDate(iso) : relativeTime(iso, now)}
    </time>
  )
}
