import { Suspense } from 'react'
import type { Metadata } from 'next'
import JobFeed from '@/components/JobFeed'
import FeedSkeleton from '@/components/FeedSkeleton'
import { getHomeStats, getJobsData, toFeedJob } from '@/lib/jobs'
import { formatDateTime } from '@/lib/job-utils'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function HomePage() {
  const { updatedAt, jobs } = getJobsData()
  const stats = getHomeStats()
  const items: [string, number, boolean][] = [
    ['在招', stats.active, false],
    ['今日新增', stats.newToday, false],
    ['高价值', stats.highValue, true],
  ]

  return (
    <>
      <section className="-mx-4 bg-surface px-4 pb-4 pt-6 sm:mx-0 sm:mt-4 sm:rounded-t-2xl">
        <p className="flex items-center gap-2 text-xs text-faint">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-50 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
          </span>
          更新于 {formatDateTime(updatedAt)}
        </p>
        <h1 className="mt-2.5 text-[26px] font-semibold leading-tight text-ink">远程好单选单</h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">给程序员的远程兼职、副业外包和全职远程机会，每天更新。</p>
        <dl className="mt-4 flex gap-7">
          {items.map(([label, value, hot]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="mt-1 text-xs text-faint">{label}</dt>
              <dd className={`text-[22px] font-semibold leading-none tabular-nums ${hot ? 'text-brand-text' : 'text-ink'}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      {/* useSearchParams 需要 Suspense 边界，fallback 即首次加载骨架 */}
      <Suspense fallback={<FeedSkeleton />}>
        <JobFeed jobs={jobs.map(toFeedJob)} />
      </Suspense>
    </>
  )
}
