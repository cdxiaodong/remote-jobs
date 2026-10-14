import Link from 'next/link'
import TicketMark from '@/components/TicketMark'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <TicketMark className="h-12 w-12 opacity-20" />
      <p className="mt-5 text-sm text-faint">404</p>
      <p className="mt-1 text-lg font-semibold text-ink">这张单子不存在</p>
      <Link href="/" className="mt-6 rounded-full bg-brand px-5 py-2 text-sm font-medium text-white">
        回到首页
      </Link>
    </div>
  )
}
