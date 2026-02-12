import { Bell, Search, Menu } from 'lucide-react'

interface HeaderProps {
  sidebarExpanded?: boolean
  onMenuClick?: () => void
}

export function Header({ sidebarExpanded = true, onMenuClick }: HeaderProps) {
  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-100 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="text-gray-600">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <span className="font-semibold text-gray-800 text-sm">Barangay</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative text-gray-500">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">3</span>
          </button>
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
            alt="User"
            className="w-8 h-8 rounded-full"
          />
        </div>
      </header>

      {/* Desktop Header */}
      <header
        className={`hidden md:flex fixed top-0 right-0 z-30 h-14 bg-white border-b border-gray-100 items-center justify-between px-6 transition-all duration-300 ${
          sidebarExpanded ? 'left-56' : 'left-[70px]'
        }`}
      >
      
        {/* Right */}
        <div className="flex items-center gap-4">
         
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-2">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop"
              alt="User"
              className="w-8 h-8 rounded-full"
            />
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-gray-800">Admin</p>
              <p className="text-[11px] text-gray-400">Administrator</p>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
