const env = (key: string) => process.env[key]?.trim() || ''

function resolveSiteUrl(): string {
  const raw = env('SITE_URL') || (env('VERCEL_PROJECT_PRODUCTION_URL') && `https://${env('VERCEL_PROJECT_PRODUCTION_URL')}`)
  if (!raw) return 'http://localhost:3000'
  const withProto = /^https?:\/\//.test(raw) ? raw : `https://${raw}`
  return withProto.replace(/\/+$/, '')
}

function resolveColor(): string {
  const c = env('PRIMARY_COLOR')
  return /^#[0-9a-fA-F]{6}$/.test(c) ? c : '#ff2442'
}

export const siteConfig = {
  name: env('SITE_NAME') || '远程好单',
  url: resolveSiteUrl(),
  xhsAccount: env('XHS_ACCOUNT'),
  contactNote: env('CONTACT_NOTE'),
  primaryColor: resolveColor(),
  description: '面向中文程序员的远程兼职 / 副业职位精选，聚合公开招聘信息，每日更新。',
}
