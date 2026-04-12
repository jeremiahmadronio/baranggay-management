import type { ReactNode } from "react";

export function SectionCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-5 ${className}`}
    >
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {subtitle ? (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle ? (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function FieldShell({
  label,
  required,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required ? <span className="text-red-500 ml-1">*</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-red-500 mt-1">{error}</p> : null}
    </div>
  );
}

export function InfoItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
        {label}
      </p>
      <div className="text-sm text-gray-900 font-medium break-words">
        {value || "—"}
      </div>
    </div>
  );
}

export function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatStatusLabel(value?: string | null) {
  return String(value || "UNKNOWN")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function getStatusBadgeClass(statusRaw?: string | null) {
  const status = String(statusRaw || "")
    .toUpperCase()
    .trim();

  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "FOR_REVIEW":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "APPROVED":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "ISSUED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "RE_ISSUANCE":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "REISSUANCE":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "ARCHIVED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
}

export function StatusPill({ status }: { status?: string | null }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 6);
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  };
}

export function getMaxEndDate(startDateInput?: string) {
  if (!startDateInput) return toDateInputValue(new Date());
  const max = new Date(startDateInput);
  max.setFullYear(max.getFullYear() + 1);
  const today = new Date();
  return toDateInputValue(max > today ? today : max);
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const start = Math.max(0, page) * pageSize;
  return items.slice(start, start + pageSize);
}

export async function fileToByteArray(file?: File | null): Promise<number[]> {
  if (!file) return [];
  const buffer = await file.arrayBuffer();
  return Array.from(new Uint8Array(buffer));
}

export function splitPurposeDocuments(value?: string | null) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const GENDER_OPTIONS = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Prefer not to say", value: "PREFER_NOT_TO_SAY" },
];

export const EDUCATIONAL_ATTAINMENT_OPTIONS = [
  "Elementary",
  "Junior High School",
  "Senior High School",
  "Vocational",
  "College Undergraduate",
  "College Graduate",
  "Postgraduate",
];

export const VALID_ID_OPTIONS = [
  "PhilSys ID",
  "UMID",
  "Passport",
  "Driver's License",
  "Postal ID",
  "National ID",
  "School ID",
  "Voter's ID",
  "Barangay ID",
];

export const PURPOSE_OPTIONS = [
  { label: "NBI Clearance", value: "NBI_CLEARANCE" },
  { label: "Police Clearance", value: "POLICE_CLEARANCE" },
  { label: "Barangay Clearance", value: "BARANGAY_CLEARANCE" },
  { label: "Passport Application", value: "PASSPORT_APPLICATION" },
  { label: "Employment Requirement", value: "EMPLOYMENT_REQUIREMENT" },
  { label: "SSS Requirement", value: "SSS_REQUIREMENT" },
  { label: "PhilHealth Requirement", value: "PHILHEALTH_REQUIREMENT" },
  { label: "Other Purpose", value: "OTHER" },
];

export const CHART_COLORS = [
  "#2563EB",
  "#0EA5E9",
  "#14B8A6",
  "#8B5CF6",
  "#F59E0B",
  "#64748B",
];

export function getStatusDescription(raw?: string | null) {
  const key = String(raw || "")
    .toUpperCase()
    .trim();
  const map: Record<string, string> = {
    PENDING: "Awaiting processing or validation",
    FOR_REVIEW: "Being reviewed by FTJS personnel",
    APPROVED: "Approved and ready for issuance",
    ISSUED: "Certificate already released",
    RE_ISSUANCE: "Replacement or reissuance request",
    ARCHIVED: "Moved to archive records",
    REJECTED: "Did not pass validation requirements",
  };
  return map[key] ?? "FTJS processing status";
}

export function isEditableFtjsStatus(status?: string | null) {
  const normalized = String(status || "")
    .toUpperCase()
    .replace(/\s+/g, "_");
  return normalized === "ISSUED" || normalized === "RE_ISSUANCE";
}

export function isResidentText(value?: boolean | null) {
  if (value == null) return "—";
  return value ? "Registered Resident" : "Walk-in / Non-resident";
}
