import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import type { UserRole } from "./Nav-Items";
import { getNavItemsByRole } from "./Nav-Items";
import {
  Hexagon,
  ChevronDown,
  Calendar,
  Clock,
  User,
  Shield,
  LogOut,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { authService } from "../service/login-api/login";

interface LayoutProps {
  userRole: UserRole;
}

export function Layout({ userRole }: LayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  // Get the display name from the backend user data, with localStorage fallback
  const getDisplayName = () => {
    // Try from UserContext first
    if (user) {
      if (user.firstName && user.lastName)
        return `${user.firstName} ${user.lastName}`;
      if (user.firstName) return user.firstName;
      if (user.username) return user.username;
    }
    // Fallback to localStorage
    const storedFirstName = localStorage.getItem("firstName");
    const storedLastName = localStorage.getItem("lastName");
    const storedUsername = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("userEmail");
    if (storedFirstName && storedLastName)
      return `${storedFirstName} ${storedLastName}`;
    if (storedFirstName) return storedFirstName;
    if (storedUsername) return storedUsername;
    // Use email (before @) as last resort
    if (storedEmail) return storedEmail.split("@")[0];
    return "User";
  };
  const userName = getDisplayName();

  // Get role display name from user context (or localStorage fallback)
  const userRoleDisplay =
    user?.role || localStorage.getItem("userRole") || undefined;

  const navItems = getNavItemsByRole(userRole);
  const currentNavItem = navItems.find(
    (item) => item.path === location.pathname,
  );
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] ?? "";
  const isLuponCaseDetailRoute =
    location.pathname.startsWith("/lupongtagapamayapa/cases/") &&
    location.pathname.split("/").length === 4;
  const isFtjsDetailRoute = /^\/first-time-job-seeker\/management\/\d+$/.test(
    location.pathname,
  );
  const isRootAdminProfileRoute =
    /^\/rootadmin\/admin-management\/view\/[^/]+$/.test(location.pathname);
  const isLikelyIdSegment =
    /^\d+$/.test(lastSegment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      lastSegment,
    );

  const fallbackTitle = isLuponCaseDetailRoute
    ? "Case Details"
    : isFtjsDetailRoute
      ? "FTJS Details"
      : isRootAdminProfileRoute
        ? "Admin Profile"
        : isLikelyIdSegment
          ? "Details"
          : location.pathname.split("/").pop()?.replace(/-/g, " ");

  const pageTitle = currentNavItem?.label || fallbackTitle || "Dashboard";

  const accountSettingsPath =
    userRole === "rootadmin"
      ? "/rootadmin/account-settings"
      : userRole === "admin"
        ? "/admin/account-settings"
        : userRole === "lupongtagapamayapa"
          ? "/lupongtagapamayapa/account-settings"
          : userRole === "clearance"
            ? "/clearance/settings"
            : "/";
  const myProfilePath = `${accountSettingsPath}?tab=profile`;
  const securityMfaPath = `${accountSettingsPath}?tab=security`;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsUserMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isUserMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  // Format date and time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-900">
      <Sidebar
        userRole={userRole}
        userName={userName}
        userRoleDisplay={userRoleDisplay}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-5 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            {isMobile && (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-sm">
                  <Hexagon
                    size={16}
                    fill="currentColor"
                    className="text-white/20 absolute"
                  />
                  <span className="font-bold text-sm relative z-10">B</span>
                </div>
                <span className="font-bold text-slate-800">Barangay</span>
              </div>
            )}
            {!isMobile && (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 capitalize">
                  {pageTitle}
                </h2>
                <p className="text-slate-500 text-xs font-medium">
                  Welcome back, {userName}
                </p>
              </div>
            )}
          </div>

          {/* Live Date & Time - Center */}
          {!isMobile && (
            <div className="flex items-center gap-4 px-5 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={16} className="text-blue-500" />
                <span className="text-sm font-medium">
                  {formatDate(currentTime)}
                </span>
              </div>
              <div className="w-px h-5 bg-slate-200" />
              <div className="flex items-center gap-2 text-slate-600">
                <Clock size={16} className="text-blue-500" />
                <span className="text-sm font-semibold tabular-nums">
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
                {userName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-700 leading-tight">
                  {userName}
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {userRoleDisplay || userRole}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`hidden md:block text-slate-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[300px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-lg">
                      {userName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-slate-800 leading-tight truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-slate-500 leading-tight truncate">
                        {localStorage.getItem("userEmail") || ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2.5">
                  <button
                    type="button"
                    onClick={() => navigate(myProfilePath)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-base">My Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(securityMfaPath)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-base">Security &amp; MFA</span>
                  </button>
                </div>

                <div className="p-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => authService.logout()}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-base">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </header>

        <div className="flex-1 h-full overflow-y-auto p-3 md:px-5 md:py-4 pt-0 md:pt-1.5">
          <div className="w-full max-w-none mr-auto pb-24 md:pb-8">
            <Outlet />
          </div>
        </div>
      </main>

      <MobileNav userRole={userRole} />
    </div>
  );
}

export function AdminLayout() {
  return <Layout userRole="admin" />;
}

export function RootAdminLayout() {
  return <Layout userRole="rootadmin" />;
}

export function BlotterLayout() {
  return <Layout userRole="blotter" />;
}

export function OfficialLayout() {
  return <Layout userRole="official" />;
}
export function LupongTagapamayapaLayout() {
  return <Layout userRole="lupongtagapamayapa" />;
}

export function BcpcLayout() {
  return <Layout userRole="dcpc" />;
}

export function DcpcLayout() {
  return <BcpcLayout />;
}

export function ClearanceLayout() {
  return <Layout userRole="clearance" />;
}

export function VawcLayout() {
  return <Layout userRole="vawc" />;
}

export function FirstTimeJobSeekerLayout() {
  return <Layout userRole="firstTimeJobSeeker" />;
}
