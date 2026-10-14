'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import JobCard from './JobCard'
import TicketMark from './TicketMark'
import { CheckIcon, SearchIcon, XIcon } from './icons'
import {
  TAGS,
  buildSearchText,
  filtersToQuery,
  matchJob,
  parseFilters,
  type CategoryFilter,
  type Filters,
  type Job,
} from '@/lib/job-utils'

const PAGE_SIZE = 20
const HEADER_H = 56
const CAT_TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'high_value', label: '高价值' },
  { value: 'quick_win', label: '快速变现' },
]

export default function JobFeed({ jobs }: { jobs: Job[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseFilters((k) => searchParams.get(k)), [searchParams])
  const inputRef = useRef<HTMLInputElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)

  const [input, setInput] = useState(filters.q)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const update = (patch: Partial<Filters>) => {
    const qs = filtersToQuery({ ...filters, ...patch })
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    setLimit(PAGE_SIZE)
    // 分类条吸顶时切换条件，把列表拉回开头
    const el = anchorRef.current
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_H
      if (window.scrollY > top) window.scrollTo({ top })
    }
  }

  // 关键词输入防抖后写入 URL
  useEffect(() => {
    if (input.trim() === filters.q.trim()) return
    const t = setTimeout(() => update({ q: input }), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, filters])

  // 桌面端按 / 聚焦搜索框
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable="true"]')) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const indexed = useMemo(() => jobs.map((job) => ({ job, text: buildSearchText(job) })), [jobs])
  const base = useMemo(() => indexed.filter(({ job, text }) => matchJob(job, text, filters, true)), [indexed, filters])

  const counts: Record<CategoryFilter, number> = {
    all: base.length,
    high_value: base.filter(({ job }) => job.category === 'high_value').length,
    quick_win: base.filter(({ job }) => job.category === 'quick_win').length,
  }
  const results = filters.cat === 'all' ? base : base.filter(({ job }) => job.category === filters.cat)
  const visible = results.slice(0, limit)
  const hasFilters = filters.cat !== 'all' || filters.tags.length > 0 || filters.q.trim() !== ''

  // 滚到底部附近自动加载下一页
  useEffect(() => {
    const el = moreRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setLimit((l) => l + PAGE_SIZE)
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [limit, results.length])

  const toggleTag = (tag: string) =>
    update({ tags: filters.tags.includes(tag) ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag] })

  const clearAll = () => {
    setInput('')
    update({ cat: 'all', tags: [], q: '' })
  }

  return (
    <section>
      <div className="-mx-4 bg-surface px-4 pb-3 pt-1 sm:mx-0">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint" />
          <input
            ref={inputRef}
            id="job-search"
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            placeholder="搜索职位、技术栈、公司"
            enterKeyHint="search"
            aria-label="搜索职位"
            className="h-11 w-full rounded-full bg-sunken pl-11 pr-11 text-[15px] text-ink outline-none transition placeholder:text-faint focus:ring-2 focus:ring-brand/30"
          />
          {input ? (
            <button
              type="button"
              onClick={() => setInput('')}
              aria-label="清空搜索"
              className="absolute right-3.5 top-1/2 flex h-[18px] w-[18px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-faint text-surface"
            >
              <XIcon className="h-3 w-3" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-xs text-faint sm:block">
              /
            </kbd>
          )}
        </div>
      </div>

      <div ref={anchorRef} aria-hidden="true" />
      <div className="filter-bar sticky z-20 -mx-4 border-b border-line bg-surface px-4 sm:mx-0 sm:rounded-b-2xl sm:border-b-0">
        <div className="flex h-11 items-center gap-6">
          {CAT_TABS.map((tab) => {
            const active = filters.cat === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => update({ cat: tab.value })}
                aria-pressed={active}
                className={`relative flex h-11 cursor-pointer items-center gap-0.5 transition-colors ${
                  active ? 'text-base font-semibold text-ink' : 'text-[15px] text-muted'
                }`}
              >
                {tab.label}
                <span className="text-[11px] font-normal tabular-nums text-faint">{counts[tab.value]}</span>
                <span
                  className={`absolute bottom-1 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-brand transition duration-200 ${
                    active ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                  }`}
                />
              </button>
            )
          })}
        </div>

        <div className="chip-scroller -mx-4 flex gap-2 overflow-x-auto px-4 pb-3 pt-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {TAGS.map((tag) => {
            const active = filters.tags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                className={`flex shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-[13px] transition-colors ${
                  active ? 'bg-brand-soft font-medium text-brand-text' : 'bg-sunken text-ink'
                }`}
              >
                {active && <CheckIcon className="h-3 w-3" />}
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-[13px] text-muted">
        <p>
          共 <b className="font-semibold tabular-nums text-ink">{results.length}</b> 个职位
          {hasFilters && (
            <button type="button" onClick={clearAll} className="ml-2 cursor-pointer text-brand-text">
              清除筛选
            </button>
          )}
        </p>
        <label htmlFor="show-expired" className="flex cursor-pointer select-none items-center gap-2">
          显示已过期
          <input
            id="show-expired"
            type="checkbox"
            className="switch"
            checked={filters.showExpired}
            onChange={(e) => update({ showExpired: e.target.checked })}
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <TicketMark className="h-12 w-12 opacity-20" />
          <p className="mt-4 text-[15px] text-ink">暂无符合条件的职位</p>
          <p className="mt-1 text-[13px] text-faint">
            {hasFilters ? '换个关键词，或者少选几个技术方向' : '数据每天更新，晚点再来看看'}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-5 cursor-pointer rounded-full border border-brand px-5 py-1.5 text-sm text-brand-text transition active:opacity-70"
            >
              清除筛选
            </button>
          )}
        </div>
      ) : (
        <ul key={filtersToQuery(filters) || 'all'} className="mt-2.5 space-y-2">
          {visible.map(({ job }, i) => (
            <li key={job.id} className="rise" style={{ '--i': i % PAGE_SIZE } as CSSProperties}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      )}

      {results.length > limit ? (
        <button
          ref={moreRef}
          type="button"
          onClick={() => setLimit((l) => l + PAGE_SIZE)}
          className="mx-auto mt-4 flex cursor-pointer items-center rounded-full bg-surface px-5 py-2 text-[13px] text-muted transition-colors active:bg-sunken"
        >
          加载更多 · 还有 {results.length - limit} 条
        </button>
      ) : (
        results.length > 0 && (
          <p className="mt-6 flex items-center justify-center gap-3 text-xs text-faint">
            <span className="h-px w-8 bg-line" />
            已经到底了
            <span className="h-px w-8 bg-line" />
          </p>
        )
      )}
    </section>
  )
}
