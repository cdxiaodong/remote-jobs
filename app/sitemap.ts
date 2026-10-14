import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config'
import { getJobsData } from '@/lib/jobs'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(getJobsData().updatedAt)
  return ['/', '/weekly', '/about'].map((p) => ({
    url: `${siteConfig.url}${p === '/' ? '' : p}`,
    lastModified,
    changeFrequency: 'daily',
    priority: p === '/' ? 1 : 0.6,
  }))
}
