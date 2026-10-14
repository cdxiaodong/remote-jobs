import Link from 'next/link'
import XhsCta from './XhsCta'
import { siteConfig } from '@/lib/config'

export default function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-12 pt-4">
      {siteConfig.xhsAccount && <XhsCta account={siteConfig.xhsAccount} note={siteConfig.contactNote} />}
      <div className="text-center text-xs leading-relaxed text-faint">
        <p>数据来源：即刻·招聘发布市场、轻松游牧。均为公开信息聚合，版权归原作者。</p>
        <p className="mt-0.5">
          投递前请自行核实，先交钱的都是骗局 ·{' '}
          <Link href="/about" className="underline underline-offset-2">
            免责声明
          </Link>
        </p>
      </div>
    </footer>
  )
}
