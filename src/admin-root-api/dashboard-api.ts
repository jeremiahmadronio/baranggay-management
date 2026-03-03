// dashboard-api.ts
// Root Admin Dashboard API Service

// ✅ Inalis ang process.env para maiwasan ang "Cannot find name 'process'" error.
// Palitan ng iyong actual API base URL kung kailangan.
const BASE_URL = "/api"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalStaff: number
  activeSessions: number
  securityAlerts: number
  totalAuditEntries: number
}

export type ActivityType = "info" | "success" | "warning" | "danger"

export interface ActivityLog {
  id: string
  user: string
  action: string
  time: string
  type: ActivityType
}

export type AlertSeverity = "High" | "Medium" | "Low"

export interface SecurityAlert {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  createdAt: string
  resolved: boolean
}

export interface StaffUser {
  id: string
  email: string
  name: string
  role: string
  isOnline: boolean
  lastSeen: string
}

export interface SystemAction {
  timestamp: string
  user: string
  action: string
  module: string
}

export interface DepartmentStat {
  code: string
  count: number
  percent: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${getToken()}`,
    },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message ?? "API request failed")
  }

  return res.json() as Promise<T>
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/admin/dashboard/stats")
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export async function getRecentActivity(limit = 20): Promise<ActivityLog[]> {
  return apiFetch<ActivityLog[]>(`/admin/dashboard/activity?limit=${limit}`)
}

// ─── Security Alerts ──────────────────────────────────────────────────────────

export async function getSecurityAlerts(): Promise<SecurityAlert[]> {
  return apiFetch<SecurityAlert[]>("/admin/dashboard/alerts")
}

export async function resolveAlert(alertId: string): Promise<SecurityAlert> {
  return apiFetch<SecurityAlert>(`/admin/dashboard/alerts/${alertId}/resolve`, {
    method: "PATCH",
  })
}


// ─── Staff / Users ────────────────────────────────────────────────────────────

export async function getStaffUsers(): Promise<StaffUser[]> {
  return apiFetch<StaffUser[]>("/admin/users")
}

export async function getStaffUserById(userId: string): Promise<StaffUser> {
  return apiFetch<StaffUser>(`/admin/users/${userId}`)
}

export async function createStaffUser(
  data: Omit<StaffUser, "id" | "isOnline" | "lastSeen">
): Promise<StaffUser> {
  return apiFetch<StaffUser>("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateStaffUser(
  userId: string,
  data: Partial<Omit<StaffUser, "id">>
): Promise<StaffUser> {
  return apiFetch<StaffUser>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteStaffUser(userId: string): Promise<void> {
  return apiFetch<void>(`/admin/users/${userId}`, { method: "DELETE" })
}

export async function getRecentActions(): Promise<SystemAction[]> {
  return apiFetch<SystemAction[]>("/admin/dashboard/recent-actions")
}

export async function getDepartmentStats(): Promise<DepartmentStat[]> {
  return apiFetch<DepartmentStat[]>("/admin/dashboard/departments")
}