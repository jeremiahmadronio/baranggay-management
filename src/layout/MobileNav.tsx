import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid, X } from 'lucide-react'
import { getNavItemsByRole, type UserRole } from './Nav-Items'

interface MobileNavProps {
  userRole: UserRole
}

export function MobileNav({ userRole }: MobileNavProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const location = useLocation()
  const navItems = getNavItemsByRole(userRole)
  
  // Show max 4 items in bottom bar
  const visibleItems = navItems.slice(0, 4)
  const hasMore = navItems.length > 4

  return (
    <>
      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden flex justify-center pointer-events-none">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-full shadow-2xl shadow-blue-900/10 p-2 flex items-center gap-1 pointer-events-auto border border-slate-100/50 backdrop-blur-xl"
        >
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActive"
                    className="absolute inset-0 bg-blue-600 rounded-full shadow-lg shadow-blue-600/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon size={22} className="relative z-10" strokeWidth={isActive ? 2.5 : 2} />
              </NavLink>
            )
          })}

          {hasMore && (
            <>
              <div className="w-px h-8 bg-slate-100 mx-1" />
              <button
                onClick={() => setIsSheetOpen(true)}
                className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-sm border border-slate-200"
              >
                <Grid size={22} />
              </button>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom Sheet for More Items */}
      <AnimatePresence>
        {isSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSheetOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] md:hidden"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[70] md:hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1" onClick={() => setIsSheetOpen(false)}>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">All Navigation</h2>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid Content */}
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-3 gap-4">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsSheetOpen(false)}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-50 text-blue-600 shadow-sm ring-2 ring-blue-100'
                              : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                          }`}
                        >
                          <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span
                          className={`text-xs font-medium text-center leading-tight ${
                            isActive ? 'text-blue-700' : 'text-slate-500'
                          }`}
                        >
                          {item.label}
                        </span>
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
