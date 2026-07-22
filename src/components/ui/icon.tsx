import type { SVGProps } from 'react'

export type IconName = 'dashboard' | 'trip' | 'calendar' | 'user' | 'report' | 'catalog' | 'sync' | 'menu' | 'close' | 'camera' | 'upload' | 'arrow' | 'check' | 'warning' | 'location' | 'car' | 'logout' | 'download'

const paths: Record<IconName, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  trip: <><path d="M5 19h14"/><path d="M6 17V9l3-4h6l3 4v8"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/><path d="M7 10h10"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  report: <><path d="M5 3h10l4 4v14H5z"/><path d="M15 3v5h5M8 13h8M8 17h8"/></>,
  catalog: <><path d="M4 4h16v16H4zM4 9h16M9 4v16"/></>,
  sync: <><path d="M20 7h-5V2M4 17h5v5"/><path d="M6.1 8A7 7 0 0 1 18 5l2 2M17.9 16A7 7 0 0 1 6 19l-2-2"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  camera: <><path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="4"/></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/></>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  warning: <><path d="M12 3 2 21h20z"/><path d="M12 9v5M12 18h.01"/></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2"/></>,
  car: <><path d="M4 16V9l2-4h12l2 4v7"/><path d="M4 11h16"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/></>,
  logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"/></>,
  download: <><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></>,
}

export function Icon({ name, size = 18, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return <svg aria-hidden="true" fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width={size} {...props}>{paths[name]}</svg>
}
