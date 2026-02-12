import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Hexagon, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { getNavItemsByRole, type UserRole } from './Nav-Items'

interface SidebarProps {
  isExpanded: boolean
  toggleSidebar: () => void
  userRole: UserRole
  userName?: string
}

export function Sidebar({
  isExpanded,
  toggleSidebar,
  userRole,
  userName = 'User',
}: SidebarProps) {
  const navItems = getNavItemsByRole(userRole)

  // Get role display name and brand
  const roleConfig = {
    admin: { displayName: 'Administrator', brand: 'Admin', brandColor: 'text-blue-600' },
    staff: { displayName: 'Staff', brand: 'Staff', brandColor: 'text-emerald-600' },
    user: { displayName: 'Resident', brand: 'User', brandColor: 'text-violet-600' },
  }[userRole]

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 280 : 84 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col h-screen z-40 sticky top-0 bg-white border-r border-slate-200"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header: Logo + Toggle */}
        <div className={`flex items-center h-16 flex-shrink-0 border-b border-slate-100 ${isExpanded ? 'px-5' : 'justify-center px-2'}`}>
          {/* Logo Icon */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-md text-white flex-shrink-0">
            <Hexagon size={20} fill="currentColor" className="text-white/20 absolute" />
            <span className="font-bold text-lg relative z-10">B</span>
          </div>

          {/* Expanded: show brand text + collapse button */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center flex-1 min-w-0 ml-3"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-slate-800 leading-tight">
                  Barangay<span className={roleConfig.brandColor}>{roleConfig.brand}</span>
                </h1>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={18} />
              </button>
            </motion.div>
          )}
        </div>

        {/* Collapsed: Expand button right below header */}
        {!isExpanded && (
          <div className="flex justify-center py-2 flex-shrink-0">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className={`flex-1 overflow-y-auto scrollbar-hide py-3 ${isExpanded ? 'px-3' : 'px-2'}`}>
          {isExpanded && (
            <p className="px-3 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              Menu
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center w-full transition-all duration-200 group
                  ${isExpanded ? 'px-3 py-2.5' : 'justify-center px-2 py-3'}
                  ${isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavBackground"
                        className={`absolute inset-0 bg-blue-50 rounded-lg ${!isExpanded ? 'mx-1' : ''}`}
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}

                    {/* Active Border Indicator */}
                    {isActive && isExpanded && (
                      <motion.div
                        layoutId="activeNavBorder"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-500 rounded-r-full"
                      />
                    )}

                    {/* Icon */}
                    <div className={`relative z-10 flex items-center justify-center ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </div>

                    {/* Label */}
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative z-10 ml-3 text-sm font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}

                    {/* Tooltip for Collapsed */}
                    {!isExpanded && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 border-2 border-white shadow-md flex-shrink-0" />
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0 flex items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-xs text-slate-400 truncate">{roleConfig.displayName}</p>
                </div>
                <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut size={18} />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  )
}
