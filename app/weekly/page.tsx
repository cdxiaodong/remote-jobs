import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import JobCard from '@/components/JobCard'
import TicketMark from '@/components/TicketMark'
import { getJobsData, getWeeklyHighValue } from '@/lib/jobs'
import { formatDate } from '@/lib/job-utils'

export const metadata: Metadata = {
  title: '本周精选',
  description: '最近 7 天的高价值远程好单：预算 ≥¥8000 或长期 / 全职远程，每日更新。',
  alternates: { canonical: '/weekly' },
}

const DAY = 86400_000

export default function WeeklyPage() {
  const jobs = getWeeklyHighValue()
  const { updatedAt } = getJobsData()
  const start = new Date(Date.parse(updatedAt) - 7 * DAY).toISOString()

  return (
    <div>
      <section className="-mx-4 bg-surface px-4 pb-5 pt-6 sm:mx-0 sm:mt-4 sm:rounded-2xl">
        <p className="text-xs font-medium text-brand-text">
          {formatDate(start)} – {formatDate(updatedAt)}
        </p>
        <h1 className="mt-1.5 text-[26px] font-semibold leading-tight text-ink">本周精选</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          本周 <b className="font-semibold tabular-nums text-brand-text">{jobs.length}</b> 个高价值好单，每日更新
        </p>
        <p className="mt-1 text-xs text-faint">近 7 天发布 · 预算 ≥¥8000 或长期 / 全职远程 · 按薪资排序</p>
      </section>

      {jobs.length === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <TicketMark className="h-12 w-12 opacity-20" />
          <p className="mt-4 text-[15px] text-ink">本周暂无高价值好单</p>
          <Link href="/" className="mt-5 rounded-full border border-brand px-5 py-1.5 text-sm text-brand-text">
            去看全部职位
          </Link>
        </div>
      ) : (
        <ol className="mt-3 space-y-2">
          {jobs.map((job, i) => (
            <li key={job.id} className="rise flex gap-1.5" style={{ '--i': i } as CSSProperties}>
              <span
                className={`w-7 shrink-0 pt-3 text-center text-lg font-semibold italic tabular-nums ${
                  i < 3 ? 'text-brand-text' : 'text-faint'
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <JobCard job={job} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
