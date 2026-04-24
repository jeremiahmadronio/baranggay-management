import { FileTextIcon } from "lucide-react";
import type { ResidentProfileViewDTO } from "../../../service/admin-module-api/ResidentsManagement";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border border-amber-200",
  SETTLED: "bg-green-100 text-green-700 border border-green-200",
  DISMISSED: "bg-gray-100 text-gray-600 border border-gray-200",
  REFERRED: "bg-purple-100 text-purple-700 border border-purple-200",
  ONGOING: "bg-blue-100 text-blue-700 border border-blue-200",
};

const ROLE_COLORS: Record<string, string> = {
  COMPLAINANT: "text-red-600 bg-red-50 border border-red-200",
  RESPONDENT: "text-orange-600 bg-orange-50 border border-orange-200",
  WITNESS: "text-blue-600 bg-blue-50 border border-blue-200",
};

interface ResidentsCaseHistoryTabProps {
  profile: ResidentProfileViewDTO;
  formatDate: (date?: string) => string;
}

export function ResidentsCaseHistoryTab({
  profile,
  formatDate,
}: ResidentsCaseHistoryTabProps) {
  if (!profile.cases || profile.cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <FileTextIcon className="w-11 h-11 mb-3 stroke-1" />
        <p className="text-sm font-medium text-gray-500">
          No case history found
        </p>
        <p className="text-xs mt-1 text-gray-400">
          This resident has no recorded blotter entries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {profile.cases.map((c, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-lg p-4 bg-gray-50/60"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <p className="text-sm font-semibold text-gray-800 font-mono">
              {c.blotterNumber}
            </p>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-600"}`}
            >
              {c.status}
            </span>
          </div>

          <p className="text-sm text-gray-700">{c.incidentNature}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>Date Filed: {formatDate(c.dateFiled)}</span>
            <span>•</span>
            <span
              className={`px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[c.role?.toUpperCase()] ?? "bg-gray-100 text-gray-600"}`}
            >
              {c.role}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
