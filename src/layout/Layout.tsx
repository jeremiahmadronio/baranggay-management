import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import type { UserRole } from './Nav-Items'
import { Hexagon, ChevronDown } from 'lucide-react'

interface LayoutProps {
  userRole: UserRole
  userName?: string
}

export function Layout({ userRole, userName }: LayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const location = useLocation()
  
  // Get current page title from path
  const pageTitle = location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <Sidebar
        isExpanded={sidebarExpanded}
        toggleSidebar={() => setSidebarExpanded(!sidebarExpanded)}
        userRole={userRole}
        userName={userName}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            {isMobile && (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-sm">
                  <Hexagon size={16} fill="currentColor" className="text-white/20 absolute" />
                  <span className="font-bold text-sm relative z-10">B</span>
                </div>
                <span className="font-bold text-slate-800">Barangay</span>
              </div>
            )}
            {!isMobile && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 capitalize">{pageTitle}</h2>
                <p className="text-slate-500 text-xs font-medium">Welcome back, {userName}</p>
              </div>
            )}
          </div>

          {/* Profile */}
          <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-700 leading-tight">{userName}</p>
              <p className="text-xs text-slate-400 capitalize">{userRole}</p>
            </div>
            <ChevronDown size={16} className="hidden md:block text-slate-400" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 pt-0 md:pt-2">
          <div className="max-w-6xl mx-auto pb-24 md:pb-8">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav userRole={userRole} />
    </div>
  )
}

// Pre-configured layouts for each role
export function AdminLayout() {
  return <Layout userRole="admin" userName="Admin User" />
}

export function StaffLayout() {
  return <Layout userRole="staff" userName="Staff User" />
}

export function UserLayout() {
  return <Layout userRole="user" userName="User" />
}
