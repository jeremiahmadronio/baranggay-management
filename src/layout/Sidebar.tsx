import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { getNavItemsByRole, type UserRole } from "./Nav-Items";
import { authService } from "../service/login-api/login";
import ugongLogo from "../../assets/ugong-logo.png";

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
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    navigate("/login", { replace: true });
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
      className="hidden md:flex flex-col h-screen z-40 sticky top-0 bg-white border-r border-slate-200 w-[clamp(190px,15vw,224px)]"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header: Logo + Brand */}
        <div className="flex items-center h-14 flex-shrink-0 border-b border-slate-100 px-4">
          {/* Logo Icon */}
          <img
            src={ugongLogo}
            alt="Barangay Ugong Logo"
            className="w-[clamp(2.35rem,2.8vw,2.95rem)] h-[clamp(2.35rem,2.8vw,2.95rem)] rounded-full object-cover flex-shrink-0 ring-1 ring-slate-300 shadow-sm"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <div className="flex items-center flex-1 min-w-0 ml-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 leading-none mb-0.5 truncate">
                Brgy. Ugong, Valenzuela
              </p>
              <h1 className="text-[15px] font-extrabold text-slate-800 leading-tight truncate">
                <span className="text-slate-800">{roleConfig.brand}</span>
                <span className={`ml-1 ${roleConfig.brandColor}`}>Portal</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2 px-2">
          <p className="px-2.5 mb-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Menu
          </p>
          <div className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center w-full transition-all duration-200 group px-2.5 py-2
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
                      className="relative z-10 ml-2.5 text-sm font-medium whitespace-nowrap truncate"
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
        <div className="p-2.5 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 border-2 border-white shadow-md flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">
              {userName.charAt(0).toUpperCase()}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0 flex items-center gap-1.5"
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
