import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config'
import { SOURCE_AVATAR } from '@/lib/job-utils'

export const metadata: Metadata = {
  title: '关于',
  description: `关于${siteConfig.name}：数据来源、更新方式与免责声明。`,
  alternates: { canonical: '/about' },
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-3 rounded-xl bg-surface p-4">
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  )
}

export default function AboutPage() {
  return (
    <div>
      <section className="-mx-4 bg-surface px-4 pb-5 pt-6 sm:mx-0 sm:mt-4 sm:rounded-2xl">
        <h1 className="text-[26px] font-semibold leading-tight text-ink">关于{siteConfig.name}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          给中文程序员的「远程好单选单」：聚合公开渠道发布的远程兼职、副业外包和全职远程岗位，按技术方向和单子价值分好类，方便在手机上快速挑单。数据每天自动更新。
        </p>
      </section>

      <Section title="单子怎么分">
        <div className="flex items-baseline gap-3">
          <span className="sticker sticker-hot">高价值</span>
          <p>预算 ≥¥8000，或长期 / 全职远程。</p>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="sticker sticker-quick">快速变现</span>
          <p>预算 &lt;¥3000 的小单，适合周末接活练手。</p>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="sticker sticker-off">已过期</span>
          <p>发布超过 30 天，默认隐藏，可在首页打开「显示已过期」查看。</p>
        </div>
      </Section>

      <Section title="数据来源">
        <ul className="space-y-2 text-ink">
          {(['jike', 'easynomad'] as const).map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${SOURCE_AVATAR[s].className}`}
              >
                {SOURCE_AVATAR[s].char}
              </span>
              {s === 'jike' ? '即刻 · 招聘发布市场' : '轻松游牧'}
            </li>
          ))}
        </ul>
        <p>
          本站只做公开信息的聚合与分类，所有职位信息版权归原发布者所有，点击卡片即跳转原文查看详情和联系方式。原作者如需下架，
          {siteConfig.xhsAccount ? `请在小红书私信「${siteConfig.xhsAccount}」，` : ''}我们会尽快处理。
        </p>
      </Section>

      <Section title="免责声明">
        <ul className="list-disc space-y-1.5 pl-5 marker:text-faint">
          <li>本站不参与招聘、交易或撮合，不对信息的真实性和后续合作结果负责。</li>
          <li>沟通前请核实对方身份；要求先交押金、培训费、保证金，或索要身份证、银行卡验证码的，一律视为骗局。</li>
          <li>分类和标签由程序自动生成，可能有偏差，以原文为准。</li>
        </ul>
      </Section>
    </div>
  )
}
