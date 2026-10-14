'use client'

import type { MouseEvent } from 'react'
import RelativeTime from './RelativeTime'
import { JOB_TYPE_LABEL, SOURCE_AVATAR, SOURCE_SHORT, type Job } from '@/lib/job-utils'

function Label({ job }: { job: Job }) {
  if (job.status === 'expired') return <span className="sticker sticker-off">已过期</span>
  if (job.category === 'high_value') return <span className="sticker sticker-hot">高价值</span>
  if (job.category === 'quick_win') return <span className="sticker sticker-quick">快速变现</span>
  return null
}

export default function JobCard({ job }: { job: Job }) {
  const jobType = JOB_TYPE_LABEL[job.jobType]
  const avatar = SOURCE_AVATAR[job.source]

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // 保留 Cmd/Ctrl/中键等浏览器原生行为
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    window.open(job.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`block rounded-xl bg-surface px-4 py-3.5 transition-colors duration-150 active:bg-sunken ${
        job.status === 'expired' ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Label job={job} />
        {jobType && <span className="sticker sticker-plain">{jobType}</span>}
        <span className="ml-auto shrink-0 text-xs text-faint">
          <RelativeTime iso={job.publishedAt} />
        </span>
      </div>

      <h3 className="mt-2 text-base font-semibold leading-snug text-ink [overflow-wrap:anywhere] line-clamp-2">
        {job.title}
      </h3>

      {(job.company || job.description) && (
        <p className="mt-1 text-sm leading-relaxed text-muted [overflow-wrap:anywhere] line-clamp-2">
          {job.company && <span className="text-ink">{job.company}　</span>}
          {job.description}
        </p>
      )}

      {job.tags.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[13px] text-topic">
          {job.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${avatar.className}`}
        >
          {avatar.char}
        </span>
        <span className="min-w-0 truncate text-[13px] text-muted" title={job.sourceName}>
          {SOURCE_SHORT[job.source]}
        </span>
        {job.salaryText ? (
          <span className="ml-auto max-w-[60%] shrink-0 truncate text-[17px] font-semibold tabular-nums text-brand-text">
            {job.salaryText}
          </span>
        ) : (
          <span className="ml-auto shrink-0 text-[13px] text-faint">薪资面议</span>
        )}
      </div>
    </a>
  )
}
