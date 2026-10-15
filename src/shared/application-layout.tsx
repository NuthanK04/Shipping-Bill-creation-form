import { routes } from '@/shared/route-paths'
import { navigate, useRouterStore } from 'core/routing'
import { useEffect, useState } from 'react'
import { Button } from 'ui/basic/button'
import { DarkModeToggle } from 'ui/basic/dark-mode'

interface ApplicationLayoutProps {
  children?: React.ReactNode
  maxWidth?: string
}

export function ApplicationLayout({ children, maxWidth }: ApplicationLayoutProps) {
  const currentPath = useRouterStore ? useRouterStore((s) => s.currentPath) : window.location.pathname
  const isDashboard = currentPath === '/' || currentPath === ''
  const isNewBill = currentPath.includes('/shipping-bills/new')

  // Live IST / Customs Clock
  const [currentTime, setCurrentTime] = useState('')
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata'
        }) + ' IST'
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="foreground relative isolate flex min-h-svh w-full flex-col font-sans text-gray-900 antialiased dark:text-gray-100">
      {/* Top Professional Portal Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md transition-colors print:hidden dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left: Brand Identity & Live Status */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(routes.dashboard)}
              className="group flex items-center gap-2.5 text-left transition-opacity hover:opacity-90">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gray-950 text-white shadow-sm ring-1 ring-gray-900/10 transition-transform group-hover:scale-105 dark:bg-white dark:text-gray-950">
                <svg
                  className="size-4.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.3 7 8.7 5 8.7-5" />
                  <path d="M12 22V12" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-sm font-bold tracking-tight text-gray-950 dark:text-white">
                    ICEGATE
                  </span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    SB-EDI
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">Customs Export Gateway</span>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden items-center gap-1 md:flex">
              <button
                onClick={() => navigate(routes.dashboard)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  isDashboard
                    ? 'bg-gray-100 text-gray-950 font-semibold shadow-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100'
                }`}>
                Dashboard
              </button>
              <button
                onClick={() => navigate(routes.shippingBillNew)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  isNewBill
                    ? 'bg-gray-100 text-gray-950 font-semibold shadow-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100'
                }`}>
                + New Shipping Bill
              </button>
            </nav>
          </div>

          {/* Right: Operational Status & Controls */}
          <div className="flex items-center gap-3">
            {/* Live Gateway Indicator */}
            <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50/70 px-2.5 py-1 text-xs text-gray-600 sm:flex dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-medium tracking-tight">EDI 1.0 Live</span>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
                {currentTime || '00:00:00 IST'}
              </span>
            </div>

            {/* CHA Badge */}
            <div className="hidden items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 lg:flex dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              <span className="text-gray-400">CHA:</span>
              <span className="font-semibold text-gray-900 dark:text-white">1000</span>
              <span className="text-gray-400">·</span>
              <span className="truncate max-w-[110px]">Amit Logistics</span>
            </div>

            {/* New Bill Quick Action */}
            {!isNewBill && (
              <Button
                size="sm"
                className="h-8 rounded-lg bg-gray-950 px-3 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-100"
                onClick={() => navigate(routes.shippingBillNew)}>
                + New bill
              </Button>
            )}

            <div className="border-l border-gray-200 pl-2 dark:border-gray-800">
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="grow bg-[#fafafa] print:m-0 print:p-0 dark:bg-gray-950">
        <div className="mx-auto h-full p-4 sm:p-6 lg:p-8" style={{ maxWidth: maxWidth ?? '76rem' }}>
          {children}
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-gray-200 bg-white py-3 text-center text-xs text-gray-400 print:hidden dark:border-gray-900 dark:bg-gray-950 dark:text-gray-600">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between px-4 sm:px-6">
          <span>Indian Customs Electronic Gateway (ICEGATE) EDI SB 1.0 Compatible</span>
          <span>Validated against DGFT Foreign Trade Policy & Customs Act, 1962</span>
        </div>
      </footer>
    </div>
  )
}
