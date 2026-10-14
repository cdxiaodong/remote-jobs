export type Source = 'jike' | 'easynomad'
export type Category = 'high_value' | 'quick_win' | 'normal'
export type JobType = 'full_remote' | 'parttime' | 'project' | 'unknown'
export type JobStatus = 'active' | 'expired'

export interface Job {
  id: string
  source: Source
  sourceName: string
  title: string
  company: string
  description: string
  url: string
  category: Category
  tags: string[]
  jobType: JobType
  salaryText: string
  publishedAt: string
  status: JobStatus
}

export interface JobsData {
  updatedAt: string
  jobs: Job[]
}

export const TAGS = [
  'AI/LLM',
  'Agent',
  'RAG',
  '爬虫/数据采集',
  '自动化',
  '全栈',
  '前端',
  '后端',
  'DevOps/云',
  '移动端',
  '数据/分析',
  '安全',
  '其他',
] as const

export const SOURCE_SHORT: Record<Source, string> = {
  jike: '即刻',
  easynomad: '轻松游牧',
}

// 来源头像：一个字的圆形头像，颜色取自来源平台
export const SOURCE_AVATAR: Record<Source, { char: string; className: string }> = {
  jike: { char: '即', className: 'bg-[#ffe411] text-[#222]' },
  easynomad: { char: '游', className: 'bg-[#16a87f] text-white' },
}

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  full_remote: '全职远程',
  parttime: '兼职',
  project: '项目制',
  unknown: '',
}

export type CategoryFilter = 'all' | 'high_value' | 'quick_win'

export interface Filters {
  cat: CategoryFilter
  tags: string[]
  q: string
  showExpired: boolean
}

export function parseFilters(get: (key: string) => string | null): Filters {
  const c = get('cat')
  const cat: CategoryFilter = c === 'high_value' || c === 'quick_win' ? c : 'all'
  const tags = (get('tags') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => (TAGS as readonly string[]).includes(t))
  return { cat, tags: [...new Set(tags)], q: get('q') ?? '', showExpired: get('expired') === '1' }
}

export function filtersToQuery(f: Filters): string {
  const p = new URLSearchParams()
  if (f.cat !== 'all') p.set('cat', f.cat)
  if (f.tags.length) p.set('tags', f.tags.join(','))
  if (f.q.trim()) p.set('q', f.q.trim())
  if (f.showExpired) p.set('expired', '1')
  return p.toString()
}

export function buildSearchText(job: Job): string {
  return [job.title, job.company, job.description, job.salaryText, job.sourceName, ...job.tags]
    .join(' ')
    .toLowerCase()
}

// tags 为"任一命中"；关键词按空格拆分后需全部命中
export function matchJob(job: Job, text: string, f: Filters, ignoreCategory = false): boolean {
  if (!f.showExpired && job.status === 'expired') return false
  if (!ignoreCategory && f.cat !== 'all' && job.category !== f.cat) return false
  if (f.tags.length && !f.tags.some((t) => job.tags.includes(t))) return false
  const words = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  return words.every((w) => text.includes(w))
}

const TZ = 'Asia/Shanghai'

// 手动拼接中文日期，不依赖运行环境的 ICU 语言数据，保证服务端与浏览器输出一致
function partsOf(iso: string) {
  const t = Date.parse(iso)
  const d = Number.isNaN(t) ? new Date() : new Date(t)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { y: get('year'), m: get('month'), d: get('day'), hh: get('hour'), mm: get('minute') }
}

export function formatDate(iso: string): string {
  if (Number.isNaN(Date.parse(iso))) return ''
  const p = partsOf(iso)
  return `${p.m}月${p.d}日`
}

export function formatDateTime(iso: string): string {
  if (Number.isNaN(Date.parse(iso))) return ''
  const p = partsOf(iso)
  return `${p.m}月${p.d}日 ${p.hh}:${p.mm}`
}

export function formatYmd(iso: string): string {
  const p = partsOf(iso)
  return `${p.y}-${p.m.padStart(2, '0')}-${p.d.padStart(2, '0')}`
}

export function relativeTime(iso: string, now: number): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const sec = Math.floor((now - t) / 1000)
  if (sec < 60) return '刚刚'
  if (sec < 3600) return `${Math.floor(sec / 60)}分钟前`
  if (sec < 86400) return `${Math.floor(sec / 3600)}小时前`
  const days = Math.floor(sec / 86400)
  if (days < 30) return `${days}天前`
  return formatDate(iso)
}

// 把 salaryText 粗略折算成"月度等价人民币"，只用于本周精选排序
export function salaryValue(text: string): number {
  if (!text) return 0
  const s = text.replace(/[,，]/g, '').toLowerCase()
  let max = 0
  for (const m of s.matchAll(/(\d+(?:\.\d+)?)\s*(万|w|k|千)?/g)) {
    let v = parseFloat(m[1])
    if (m[2] === '万' || m[2] === 'w') v *= 10000
    else if (m[2] === 'k' || m[2] === '千') v *= 1000
    if (v > max) max = v
  }
  if (!max) return 0
  if (/\$|usd|美元|美金/.test(s)) max *= 7
  if (/时|hour|\/h\b/.test(s)) max *= 160
  else if (/天|日薪|day/.test(s)) max *= 21.75
  else if (/年|year/.test(s)) max /= 12
  return max
}

export function byPublishedDesc(a: Job, b: Job): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
}
