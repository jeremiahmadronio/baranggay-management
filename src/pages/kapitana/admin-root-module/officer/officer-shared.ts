import { useEffect, useState } from "react";
import { EmployeeStatuses } from "../../../service/admin-root-api/officer";

export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export const GLOBAL_POSITIONS = [
  "Punong Barangay",
  "Barangay Tanod Chief",
  "Barangay Tanod Deputy Chief",
  "Barangay Tanod Group Leader",
  "Barangay Tanod Member",
  "Barangay Social Worker",
  "Barangay Health Worker (BHW)",
];

export const DEPARTMENT_POSITION_MAP: Record<string, string[]> = {
  vawc: ["VAWC Focal Person", "VAWC Desk Officer"],
  bcpc: [
    "BCPC Chairperson",
    "BCPC Vice Chairperson",
    "BCPC Secretary",
    "Day Care Worker",
    "NGO / Religious Sector Representative",
  ],
  lupon: ["Lupon Secretary", "Lupon Members", "Pangkat Chairman"],
  blotter: [
    "Barangay Desk Officer",
    
    "Barangay Tanod Chief",
    "Barangay Tanod Deputy Chief",
    "Barangay Tanod Group Leader",
    "Blotter Assigning Officer",
  ],
  ftjs: ["FTJS Focal Person / Processor"],
  clearance: ["Clearance Focal Person"],
};

export function resolveDeptKey(name?: string | null) {
  const value = String(name || "").toLowerCase();
  if (value.includes("vawc")) return "vawc";
  if (value.includes("bcpc")) return "bcpc";
  if (value.includes("lupon")) return "lupon";
  if (value.includes("blotter")) return "blotter";
  if (
    value.includes("first time job seeker") ||
    value.includes("first-time-job-seeker") ||
    value.includes("ftjs")
  ) {
    return "ftjs";
  }
  if (value.includes("clearance")) return "clearance";
  return "";
}

export const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-600",
  ARCHIVED: "bg-red-100 text-red-600",
};

export function normalizeStatusLabel(
  raw?: string | null,
): "ACTIVE" | "INACTIVE" | "ARCHIVED" {
  const value = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (value === "1" || value === "ACTIVE") return "ACTIVE";
  if (value === "0" || value === "INACTIVE") return "INACTIVE";
  if (value === "ARCHIVED") return "ARCHIVED";
  return "INACTIVE";
}

export function prettifyDepartmentName(raw?: string | null) {
  const value = String(raw ?? "").trim();
  if (!value) return "—";
  if (!value.includes("_")) return value;
  return value
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export const STATUS_OPTIONS = [
  { value: EmployeeStatuses.ACTIVE, label: "Active" },
  { value: EmployeeStatuses.INACTIVE, label: "Inactive" },
  { value: EmployeeStatuses.ARCHIVED, label: "Archived" },
];

export const STATUS_REASON_OPTIONS = [
  { value: "ADMIN_UPDATE", label: "Administrative update" },
  { value: "REASSIGNMENT", label: "Reassignment" },
  { value: "LEAVE", label: "On leave" },
  { value: "VIOLATION", label: "Violation / sanction" },
  { value: "OTHER", label: "Other" },
];

export type EmployeeModalMode = "add" | "edit";
