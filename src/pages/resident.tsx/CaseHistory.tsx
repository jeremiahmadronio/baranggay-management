import { FileTextIcon } from "lucide-react";
import type { ResidentProfileViewDTO } from "../../service/resident-api/ResidentsManagement";

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
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-12 gap-4 px-4 py-2">
        <p className="col-span-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Blotter No.
        </p>
        <p className="col-span-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Nature of Complaint
        </p>
        <p className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Date Filed
        </p>
        <p className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">
          Status
        </p>
        <p className="col-span-1 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">
          Role
        </p>
      </div>

      {profile.cases.map((c, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-4 items-center bg-white rounded-xl border border-gray-200 px-4 py-3.5 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <p className="col-span-3 text-sm font-semibold text-gray-800 font-mono truncate">
            {c.blotterNumber}
          </p>
          <p className="col-span-4 text-sm text-gray-600 truncate">
            {c.incidentNature}
          </p>
          <p className="col-span-2 text-xs text-gray-400">
            {formatDate(c.dateFiled)}
          </p>
          <div className="col-span-2 flex justify-end min-w-[130px]">
            <span
              className={`text-xs px-5 py-1 rounded-full font-medium ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-600"}`}
            >
              {c.status}
            </span>
          </div>
          <div className="col-span-1 flex justify-end">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[c.role?.toUpperCase()] ?? "bg-gray-100 text-gray-600"}`}
            >
              {c.role}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
