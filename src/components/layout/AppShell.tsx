'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

const FULLSCREEN_PATHS = ['/login', '/account/change-password']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const fullscreen = FULLSCREEN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (fullscreen) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  )
}
