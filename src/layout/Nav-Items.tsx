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

// User type for determining nav items
export type UserRole = 'admin' | 'staff' | 'user'

// Admin navigation items
export const adminNavItems: NavItemType[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Products', path: '/admin/products', icon: Package },
  { label: 'Market', path: '/admin/market', icon: MapPinHouse },
  { label: 'Predictions', path: '/admin/predictions', icon: BarChart3 },
  { label: 'Dietary Tags', path: '/admin/dietary-tags', icon: Leaf },
  { label: 'Archive', path: '/admin/archive-products', icon: Archive },
  { label: 'Reports', path: '/admin/reports', icon: FileText },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
]

// Staff navigation items
export const staffNavItems: NavItemType[] = [
  { label: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
  { label: 'Products', path: '/staff/products', icon: Package },
  { label: 'Market', path: '/staff/market', icon: MapPinHouse },
  { label: 'Reports', path: '/staff/reports', icon: FileText },
  { label: 'Settings', path: '/staff/settings', icon: Settings },
]

// Regular user navigation items
export const userNavItems: NavItemType[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Market', path: '/market', icon: MapPinHouse },
  { label: 'Settings', path: '/settings', icon: Settings },
]

// Helper to get nav items by role
export function getNavItemsByRole(role: UserRole): NavItemType[] {
  switch (role) {
    case 'admin':
      return adminNavItems
    case 'staff':
      return staffNavItems
    case 'user':
    default:
      return userNavItems
  }
}
