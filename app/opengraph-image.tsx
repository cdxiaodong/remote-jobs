import { ImageResponse } from 'next/og'
import { siteConfig } from '@/lib/config'
import { getActiveJobs, getJobsData } from '@/lib/jobs'
import { formatYmd } from '@/lib/job-utils'

export const dynamic = 'force-static'
export const alt = `${siteConfig.name} · 程序员远程兼职精选`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Satori 默认字体不含中文。构建时按需拉取 Noto Sans SC 子集（仅包含用到的字），失败则降级为英文版式，保证 build 不挂
async function loadCjkFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&text=${encodeURIComponent(text)}`
    const css = await (await fetch(cssUrl)).text()
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1]
    if (!src) return null
    const res = await fetch(src)
    return res.ok ? await res.arrayBuffer() : null
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  const count = getActiveJobs().length
  const date = formatYmd(getJobsData().updatedAt)
  const lines = {
    name: siteConfig.name,
    count: `${count} 个远程职位在招`,
    sub: '程序员远程兼职 · 副业 · 每日更新',
    date: `更新于 ${date}`,
  }
  const font = await loadCjkFont(Object.values(lines).join('') + '0123456789')
  const t = font ? lines : { name: 'REMOTE JOBS', count: `${count} remote jobs`, sub: 'For developers · Updated daily', date }
  const primary = siteConfig.primaryColor

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#ffffff',
          color: '#222222',
          fontFamily: font ? 'NotoSansSC' : 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg width="72" height="72" viewBox="0 0 28 28">
            <path
              fill={primary}
              d="M5 5h18a2 2 0 0 1 2 2v4.5a2.5 2.5 0 0 0 0 5V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4.5a2.5 2.5 0 0 0 0-5V7a2 2 0 0 1 2-2z"
            />
            <path d="M18 8.5v11" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.01 3.2" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 700 }}>{t.name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.1 }}>{t.count}</div>
          <div style={{ fontSize: 36, color: '#999999' }}>{t.sub}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: '#999999' }}>
          <div style={{ display: 'flex' }}>{t.date}</div>
          <div style={{ display: 'flex', height: 8, width: 240, background: primary, borderRadius: 4, marginTop: 14 }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: 'NotoSansSC', data: font, weight: 700, style: 'normal' }] : undefined,
    },
  )
}
