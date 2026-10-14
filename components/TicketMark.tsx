// 站点标志：一张带打孔和撕线的票根，呼应"接单"
export default function TicketMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" className={`text-brand ${className}`}>
      <path
        fill="currentColor"
        d="M5 5h18a2 2 0 0 1 2 2v4.5a2.5 2.5 0 0 0 0 5V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4.5a2.5 2.5 0 0 0 0-5V7a2 2 0 0 1 2-2z"
      />
      <path d="M18 8.5v11" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.01 3.2" />
    </svg>
  )
}
