import fs from 'node:fs'
import path from 'node:path'
import {
  TAGS,
  byPublishedDesc,
  salaryValue,
  type Category,
  type Job,
  type JobType,
  type JobsData,
  type Source,
} from './job-utils'

const DATA_FILE = path.join(process.cwd(), 'data', 'jobs.json')
const CATEGORIES: Category[] = ['high_value', 'quick_win', 'normal']
const JOB_TYPES: JobType[] = ['full_remote', 'parttime', 'project', 'unknown']
const DAY = 86400_000

const str = (v: unknown) => (typeof v === 'string' ? v : '')

function normalize(raw: unknown): Job | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = str(r.id)
  const title = str(r.title).trim()
  const url = str(r.url).trim()
  const publishedAt = str(r.publishedAt)
  // 缺关键字段、非 http(s) 链接、时间无法解析的条目直接丢弃，避免一条脏数据拖垮整站
  if (!id || !title || !/^https?:\/\//i.test(url) || Number.isNaN(Date.parse(publishedAt))) return null
  const source: Source = r.source === 'easynomad' ? 'easynomad' : 'jike'
  return {
    id,
    source,
    sourceName: str(r.sourceName) || (source === 'jike' ? '即刻·招聘发布市场' : '轻松游牧'),
    title,
    company: str(r.company),
    description: str(r.description),
    url,
    category: CATEGORIES.includes(r.category as Category) ? (r.category as Category) : 'normal',
    tags: Array.isArray(r.tags)
      ? [...new Set(r.tags.filter((t): t is string => (TAGS as readonly string[]).includes(t as string)))]
      : [],
    jobType: JOB_TYPES.includes(r.jobType as JobType) ? (r.jobType as JobType) : 'unknown',
    salaryText: str(r.salaryText),
    publishedAt,
    status: r.status === 'expired' ? 'expired' : 'active',
  }
}

let cache: JobsData | null = null

export function getJobsData(): JobsData {
  if (cache) return cache
  let parsed: unknown
  try {
    parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch (e) {
    throw new Error(`data/jobs.json 读取或解析失败，请用 python3 -m json.tool data/jobs.json 校验：${(e as Error).message}`)
  }
  const obj = (parsed ?? {}) as { updatedAt?: unknown; jobs?: unknown }
  const seen = new Set<string>()
  const jobs: Job[] = []
  for (const raw of Array.isArray(obj.jobs) ? obj.jobs : []) {
    const job = normalize(raw)
    if (job && !seen.has(job.id)) {
      seen.add(job.id)
      jobs.push(job)
    }
  }
  jobs.sort(byPublishedDesc)
  const updatedAt = str(obj.updatedAt)
  cache = { updatedAt: Number.isNaN(Date.parse(updatedAt)) ? new Date().toISOString() : updatedAt, jobs }
  return cache
}

export function getActiveJobs(): Job[] {
  return getJobsData().jobs.filter((j) => j.status === 'active')
}

// 首页头部的三个数字；"今日新增"指数据更新时间前 24 小时内发布的在招职位
export function getHomeStats() {
  const ref = Date.parse(getJobsData().updatedAt)
  const active = getActiveJobs()
  return {
    active: active.length,
    newToday: active.filter((j) => Date.parse(j.publishedAt) > ref - DAY).length,
    highValue: active.filter((j) => j.category === 'high_value').length,
  }
}

// 以数据更新时间为基准取最近 7 天，避免构建时间与数据时间不一致导致榜单清空
export function getWeeklyHighValue(): Job[] {
  const { updatedAt, jobs } = getJobsData()
  const ref = Date.parse(updatedAt)
  return jobs
    .filter((j) => {
      const t = Date.parse(j.publishedAt)
      return j.category === 'high_value' && j.status === 'active' && t >= ref - 7 * DAY && t <= ref + DAY
    })
    .sort((a, b) => salaryValue(b.salaryText) - salaryValue(a.salaryText) || byPublishedDesc(a, b))
}

// 首页下发给客户端的数据：截断描述以控制页面体积
export function toFeedJob(job: Job): Job {
  return job.description.length > 300 ? { ...job, description: job.description.slice(0, 300) + '…' } : job
}
