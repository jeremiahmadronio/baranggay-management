import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Hexagon } from "lucide-react";
import { getNavItemsByRole, type UserRole } from "./Nav-Items";
import { authService } from "../login-api/login";

interface SidebarProps {
  userRole: UserRole;
  userName?: string;
  userRoleDisplay?: string;
}

export function Sidebar({
  userRole,
  userName = "User",
  userRoleDisplay,
}: SidebarProps) {
  const navItems = getNavItemsByRole(userRole);

  // Handle logout
  const handleLogout = () => {
    authService.logout();
  };

  // Get role display name and brand
  const roleConfig = {
    admin: {
      displayName: "Administrator",
      brand: "Admin",
      brandColor: "text-blue-600",
    },
    blotter: {
      displayName: "Blotter",
      brand: "Blotter",
      brandColor: "text-emerald-600",
    },
    user: {
      displayName: "Resident",
      brand: "User",
      brandColor: "text-violet-600",
    },
    lupongtagapamayapa: {
      displayName: "Lupong Tagapamayapa",
      brand: "Lupon",
      brandColor: "text-orange-600",
    },
    dcpc: { displayName: "DCPC", brand: "DCPC", brandColor: "text-teal-600" },
    clearance: {
      displayName: "Clearance Officer",
      brand: "Clearance",
      brandColor: "text-cyan-600",
    },
    vawc: {
      displayName: "VAWC Officer",
      brand: "VAWC",
      brandColor: "text-pink-600",
    },
    firstTimeJobSeeker: {
      displayName: "First Time Job Seeker",
      brand: "JobSeeker",
      brandColor: "text-green-600",
    },
    official: {
      displayName: "Barangay Official",
      brand: "Official",
      brandColor: "text-yellow-600",
    },
    rootadmin: {
      displayName: "Root Admin",
      brand: "rootadmin",
      brandColor: "text-black-600",
    },
  }[userRole];

  // Use the passed role display name or fall back to roleConfig
  const displayedRole = userRoleDisplay || roleConfig?.displayName || "User";

  return (
    <motion.aside
      initial={false}
      animate={{ width: 280 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col h-screen z-40 sticky top-0 bg-white border-r border-slate-200"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header: Logo + Brand */}
        <div className="flex items-center h-16 flex-shrink-0 border-b border-slate-100 px-5">
          {/* Logo Icon */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-md text-white flex-shrink-0">
            <Hexagon
              size={20}
              fill="currentColor"
              className="text-white/20 absolute"
            />
            <span className="font-bold text-lg relative z-10">B</span>
          </div>
          <div className="flex items-center flex-1 min-w-0 ml-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                Barangay
                <span className={roleConfig.brandColor}>
                  {roleConfig.brand}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-3 px-3">
          <p className="px-3 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
            Menu
          </p>
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center w-full transition-all duration-200 group px-3 py-2.5
                  ${isActive ? "text-blue-700" : "text-slate-500 hover:text-slate-900"}`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavBackground"
                        className="absolute inset-0 bg-blue-50 rounded-lg"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Active Border Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavBorder"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-500 rounded-r-full"
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={`relative z-10 flex items-center justify-center ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}
                    >
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    </div>

                    {/* Label */}
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative z-10 ml-3 text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 border-2 border-white shadow-md flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0 flex items-center gap-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {userName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {displayedRole}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
