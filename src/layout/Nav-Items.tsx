import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  Settings,
  MapPinHouse,
  Archive,
  Leaf,
  FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItemType {
  label: string
  path: string
  icon: LucideIcon
}

// User type nav items
export type UserRole = 'admin' | 'blotter' | 'official' | 'lupongtagapamayapa' | 'dcpc' | 'clearance' | 'vawc' | 'firstTimeJobSeeker' 

// Admin navigation items
export const adminNavItems: NavItemType[] = [
  { label: 'Reusable Components', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'reusable inputform', path: '/admin/inputform', icon: BarChart3 },
  { label: 'Charts', path: '/admin/charts', icon: BarChart3 },
  { label: 'Archive', path: '/admin/archive', icon: Archive },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
]

// Blotter navigation items
export const blotterNavItems: NavItemType[] = [
  { label: 'Dashboard', path: '/blotter/dashboard', icon: LayoutDashboard },
  { label: 'Docket Books', path: '/blotter/docket', icon: Package },
  { label: 'New Complaints', path: '/blotter/new-complaints', icon: MapPinHouse },
  { label: 'All Complaints', path: '/blotter/all-complaints', icon: FileText },
  { label: 'Reports', path: '/blotter/reports', icon: Settings },
]


// Lupong Tagapamayapa navigation items
export const lupongTagapamayapaNavItems: NavItemType[] = [
  { label: 'Dashboard', path: '/lupongtagapamayapa/dashboard', icon: LayoutDashboard },
  { label: 'Reports', path: '/lupongtagapamayapa/reports', icon: Settings },
]

// DCPC navigation items
export const DcpcNavItems: NavItemType[] = [
  { label: 'Dashboard', path: '/dcpc/dashboard', icon: LayoutDashboard },
  { label: 'Reports', path: '/dcpc/reports', icon: Settings },
]

//Clearance navigation items
export const clearanceNavItems: NavItemType[] = [
  { label: 'Dashboard', path: '/clearance/dashboard', icon: LayoutDashboard },
  { label: 'Clearance Requests', path: '/clearance/requests', icon: FileText },
  {label: 'Clearance Template', path: '/clearance/template', icon: Users },
  { label: 'Reports', path: '/clearance/reports', icon: Settings },
]

// VAWC navigation items
export const vawcNavItems: NavItemType[] = [
  { label: 'Dashboard', path: '/vawc/dashboard', icon: LayoutDashboard },
  { label: 'Cases', path: '/vawc/cases', icon: FileText },
  { label: 'Reports', path: '/vawc/reports', icon: Settings },
]

export const firstTimeJobSeekerNavItems: NavItemType[] = [
  { label: 'Dashboard', path: '/first-time-job-seeker/dashboard', icon: LayoutDashboard },
  { label: 'Settings', path: '/first-time-job-seeker/settings', icon: Settings },
]


// Regular officials navigation items
export const officialNavItems: NavItemType[] = [
  { label: 'Dashboard', path: '/officials/dashboard', icon: LayoutDashboard },
  { label: 'Settings', path: '/officials/settings', icon: Settings },
]

// Helper nav items by role
export function getNavItemsByRole(role: UserRole): NavItemType[] {
  switch (role) {
    case 'admin':
      return adminNavItems
    case 'blotter':
      return blotterNavItems
    case 'official':
      return officialNavItems
    case 'lupongtagapamayapa':
      return lupongTagapamayapaNavItems
    case 'dcpc':
      return DcpcNavItems
    case 'clearance':
      return clearanceNavItems
     
    case 'vawc':
          return vawcNavItems

    case 'firstTimeJobSeeker':
      return firstTimeJobSeekerNavItems
            
    default:
      return officialNavItems
  }
}
