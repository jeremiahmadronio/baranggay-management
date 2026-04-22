import {
  LayoutDashboard,
  Users,
  Settings,
  MapPinHouse,
  Leaf,
  FileText,
  FilePlus2,
  ScrollText,
  ChartNoAxesCombined,
  Archive,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItemType {
  label: string;
  path: string;
  icon: LucideIcon;
  children?: NavItemType[];
}

// User type nav items
export type UserRole =
  | "admin"
  | "blotter"
  | "official"
  | "lupongtagapamayapa"
  | "dcpc"
  | "clearance"
  | "vawc"
  | "firstTimeJobSeeker"
  | "rootadmin";

// Admin navigation items
export const adminNavItems: NavItemType[] = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "User Management", path: "/admin/user-management", icon: Users },
  { label: "Residents", path: "/admin/residents", icon: Users },
  { label: "Officers", path: "/admin/officers", icon: Users },
  { label: "Archive", path: "/admin/archive", icon: Archive },
];

// Root Admin navigation items
export const rootAdminNavItems: NavItemType[] = [
  { label: "Dashboard", path: "/rootadmin/dashboard", icon: LayoutDashboard },
  {label: "Admin Management", path: "/rootadmin/admin-management",icon: Users,},
    { label: "User Management", path: "/rootadmin/user-management", icon: Users },
  { label: "Resident Management", path: "/rootadmin/residents", icon: Users },
  { label: "Officer Management", path: "/rootadmin/officers", icon: Users },
  {label: "Backup Management", path: "/rootadmin/backup-management", icon: Users},
  { label: "Audit Logs", path: "/rootadmin/audit-logs", icon: ScrollText },
    { label: "Archive", path: "/rootadmin/archive", icon: Archive },

];

// Blotter navigation items
export const blotterNavItems: NavItemType[] = [
  { label: "Dashboard", path: "/blotter/dashboard", icon: LayoutDashboard },
  { label: "Residents", path: "/blotter/residents", icon: Users },
  { label: "Docket Books", path: "/blotter/docket", icon: ScrollText },
  { label: "Archive Cases", path: "/blotter/archive", icon: Archive },
  { label: "New Complaints", path: "/blotter/entry-form", icon: FilePlus2 },
  { label: "Records", path: "/blotter/records", icon: FileText },
  { label: "Reports", path: "/blotter/reports", icon: ChartNoAxesCombined },
];

// Lupong Tagapamayapa navigation items
export const lupongTagapamayapaNavItems: NavItemType[] = [
  {
    label: "Dashboard",
    path: "/lupongtagapamayapa/dashboard",
    icon: LayoutDashboard,
  },
  { label: "Residents", path: "/lupongtagapamayapa/residents", icon: Users },
  { label: "Cases", path: "/lupongtagapamayapa/cases", icon: FileText },
  {
    label: "Archive Cases",
    path: "/lupongtagapamayapa/archive",
    icon: Archive,
  },

  {
    label: "Reports",
    path: "/lupongtagapamayapa/reports",
    icon: ChartNoAxesCombined,
  },
  {
    label: "settings",
    path: "/lupongtagapamayapa/account-settings",
    icon: Settings,
  },
];

// DCPC navigation items
export const DcpcNavItems: NavItemType[] = [
  { label: "Dashboard", path: "/dcpc/dashboard", icon: LayoutDashboard },
  { label: "Reports", path: "/dcpc/reports", icon: Settings },
];

//Clearance navigation items
export const clearanceNavItems: NavItemType[] = [
  { label: "Dashboard", path: "/clearance/dashboard", icon: LayoutDashboard },
  {
    label: "Issue Certificate",
    path: "/clearance/issue-certificate",
    icon: MapPinHouse,
  },
  {
    label: "Issued Certificates",
    path: "/clearance/issued-certificates",
    icon: FileText,
  },
  {
    label: "Revenue & Collection",
    path: "/clearance/revenue-and-collection",
    icon: Leaf,
  },
  { label: "Create Template", path: "/clearance/template", icon: Users },
  {
    label: "Archived",
    path: "/clearance/settings",
    icon: Archive,
    children: [
      {
        label: "Archived Certificates",
        path: "/clearance/settings?view=certificates",
        icon: FileText,
      },
      {
        label: "Archived Templates",
        path: "/clearance/settings?view=templates",
        icon: Archive,
      },
    ],
  },
];

// VAWC navigation items
export const vawcNavItems: NavItemType[] = [
  { label: "Dashboard", path: "/vawc/dashboard", icon: LayoutDashboard },
  { label: "Residents", path: "/vawc/residents", icon: Users },
  { label: "New Complaint", path: "/vawc/newcomplaint", icon: FilePlus2 },
  { label: "Cases", path: "/vawc/cases", icon: FileText },
  { label: "Reports", path: "/vawc/reports", icon: ChartNoAxesCombined },
];

// First Time Job Seeker navigation items
export const firstTimeJobSeekerNavItems: NavItemType[] = [
  {
    label: "Dashboard",
    path: "/first-time-job-seeker/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "FTJS Entry",
    path: "/first-time-job-seeker/entry",
    icon: FilePlus2,
  },
  {
    label: "Management",
    path: "/first-time-job-seeker/management",
    icon: FileText,
  },
  {
    label: "Archive",
    path: "/first-time-job-seeker/archive",
    icon: Archive,
  },
  {
    label: "Reports",
    path: "/first-time-job-seeker/reports",
    icon: ChartNoAxesCombined,
  },
];

// Regular officials navigation items
export const officialNavItems: NavItemType[] = [
  { label: "Dashboard", path: "/officials/dashboard", icon: LayoutDashboard },
  { label: "Settings", path: "/officials/settings", icon: Settings },
];

export function getNavItemsByRole(role: UserRole): NavItemType[] {
  switch (role) {
    case "admin":
      return adminNavItems;
    case "blotter":
      return blotterNavItems;
    case "official":
      return officialNavItems;
    case "lupongtagapamayapa":
      return lupongTagapamayapaNavItems;
    case "dcpc":
      return DcpcNavItems;
    case "clearance":
      return clearanceNavItems;

    case "vawc":
      return vawcNavItems;

    case "firstTimeJobSeeker":
      return firstTimeJobSeekerNavItems;

    case "rootadmin":
      return rootAdminNavItems;

    default:
      return officialNavItems;
  }
}
