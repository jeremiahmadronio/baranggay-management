import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getNavItemsByRole, type UserRole } from "./Nav-Items";
import ugongLogo from "../../assets/ugong-logo.png";

interface SidebarProps {
  userRole: UserRole;
  userName?: string;
  userRoleDisplay?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const navItems = getNavItemsByRole(userRole);
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isPathActive = (targetPath: string) => {
    const [targetPathname, targetQuery = ""] = targetPath.split("?");
    if (location.pathname !== targetPathname) return false;
    if (!targetQuery) return true;

    const currentParams = new URLSearchParams(location.search);
    const targetParams = new URLSearchParams(targetQuery);

    for (const [key, value] of targetParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }

    return true;
  };

  useEffect(() => {
    const initialOpenGroups: Record<string, boolean> = {};

    navItems.forEach((item) => {
      if (!item.children || item.children.length === 0) return;
      const hasActiveChild = item.children.some((child) =>
        isPathActive(child.path),
      );

      if (hasActiveChild) {
        initialOpenGroups[item.label] = true;
      }
    });

    if (Object.keys(initialOpenGroups).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenGroups((prev) => ({ ...initialOpenGroups, ...prev }));
    }
  }, [location.pathname, location.search, navItems]);

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
    dcpc: { displayName: "BCPC", brand: "BCPC", brandColor: "text-teal-600" },
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
      displayName: "System Admin",
      brand: "System Admin",
      brandColor: "text-black-600",
    },
  }[userRole];

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
                <span className={`ml-1 ${roleConfig.brandColor}`}></span>
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
            {navItems.map((item) => {
              const hasChildren = !!item.children?.length;

              if (hasChildren) {
                const groupOpen =
                  openGroups[item.label] ??
                  item.children!.some((child) => isPathActive(child.path));

                const hasActiveChild = item.children!.some((child) =>
                  isPathActive(child.path),
                );

                return (
                  <div key={item.path} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((prev) => ({
                          ...prev,
                          [item.label]: !groupOpen,
                        }))
                      }
                      className={`relative flex items-center w-full transition-all duration-200 group px-2.5 py-2 rounded-lg ${
                        hasActiveChild
                          ? "text-blue-700 bg-blue-50"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`relative z-10 flex items-center justify-center ${
                          hasActiveChild
                            ? "text-blue-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      >
                        <item.icon
                          size={20}
                          strokeWidth={hasActiveChild ? 2.5 : 2}
                        />
                      </div>

                      <span className="relative z-10 ml-2.5 text-sm font-medium whitespace-nowrap truncate flex-1 text-left">
                        {item.label}
                      </span>

                      <ChevronDown
                        size={16}
                        className={`transition-transform ${groupOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {groupOpen && (
                      <div className="ml-7 mr-1 space-y-0.5 border-l border-slate-200 pl-2">
                        {item.children!.map((child) => {
                          const isChildActive = isPathActive(child.path);
                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                isChildActive
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                              }`}
                            >
                              <child.icon size={14} />
                              <span>{child.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
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
              );
            })}
          </div>
        </div>

        {/* User Section */}
        <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-lg">
            {roleConfig.brand[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-800 truncate text-sm">
              {/* Show userName if available, else fallback */}
              {(typeof window !== "undefined" &&
                window.localStorage.getItem("userEmail")) ||
                "User"}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold leading-tight">
              {roleConfig.displayName}
            </span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
