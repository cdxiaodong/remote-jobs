import type { SVGProps } from 'react'

type IconProps = { className?: string }

const stroke: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const SearchIcon = ({ className }: IconProps) => (
  <svg {...stroke} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const XIcon = ({ className }: IconProps) => (
  <svg {...stroke} className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export const CheckIcon = ({ className }: IconProps) => (
  <svg {...stroke} strokeWidth={2.5} className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const ArrowUpIcon = ({ className }: IconProps) => (
  <svg {...stroke} className={className}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)
