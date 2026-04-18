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
      {/* no-print hides the sidebar when the user prints / saves as PDF */}
      <div className="no-print flex-shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  )
}
