const CHIP_WIDTHS = [64, 56, 48, 104, 60, 48, 48]

export default function FeedSkeleton() {
  return (
    <div aria-busy="true" aria-label="加载中">
      <div className="-mx-4 bg-surface px-4 pb-3 pt-1 sm:mx-0">
        <div className="shimmer h-11 rounded-full" />
      </div>
      <div className="-mx-4 border-b border-line bg-surface px-4 pb-3 sm:mx-0 sm:rounded-b-2xl sm:border-b-0">
        <div className="flex h-11 items-center gap-6">
          <div className="shimmer h-5 w-10 rounded" />
          <div className="shimmer h-5 w-14 rounded" />
          <div className="shimmer h-5 w-16 rounded" />
        </div>
        <div className="mt-1 flex gap-2 overflow-hidden">
          {CHIP_WIDTHS.map((w, i) => (
            <div key={i} className="shimmer h-[30px] shrink-0 rounded-full" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="mt-11 space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl bg-surface px-4 py-3.5">
            <div className="shimmer h-4 w-24 rounded" />
            <div className="shimmer mt-3 h-4 w-11/12 rounded" />
            <div className="shimmer mt-2 h-3 w-3/4 rounded" />
            <div className="mt-4 flex items-center justify-between">
              <div className="shimmer h-4 w-16 rounded" />
              <div className="shimmer h-5 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
