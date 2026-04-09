import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import type { UserRole } from "./Nav-Items";
import { getNavItemsByRole } from "./Nav-Items";
import { Hexagon, ChevronDown, Calendar, Clock } from "lucide-react";
import { useUser } from "../context/UserContext";

interface LayoutProps {
  userRole: UserRole;
}

export function Layout({ userRole }: LayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const { user } = useUser();

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
  const isLuponCaseDetailRoute =
    location.pathname.startsWith("/lupongtagapamayapa/cases/") &&
    location.pathname.split("/").length === 4;

  const fallbackTitle = isLuponCaseDetailRoute
    ? "Case Details"
    : location.pathname.split("/").pop()?.replace(/-/g, " ");

  const pageTitle = currentNavItem?.label || fallbackTitle || "Dashboard";

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

          <button className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
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
            <ChevronDown size={16} className="hidden md:block text-slate-400" />
          </button>
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

export function DcpcLayout() {
  return <Layout userRole="dcpc" />;
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
