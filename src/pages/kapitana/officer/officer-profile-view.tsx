import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, PencilIcon } from "lucide-react";
import {
  employeeApi,
  type EmployeeTable,
  type EmployeeView,
} from "../../../service/admin-module-api/officer";
import {
  normalizeStatusLabel,
  prettifyDepartmentName,
  STATUS_STYLES,
} from "./officer-shared";

function textValue(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-800">{textValue(value)}</p>
    </div>
  );
}

interface OfficerProfileViewProps {
  employeeId: number;
  onBack: () => void;
  onEdit: (employee: EmployeeTable) => void;
  onArchive: (employee: EmployeeTable) => void;
  onStatusChange: (employee: EmployeeTable) => void;
  readOnly?: boolean;
}

export function OfficerProfileView({
  employeeId,
  onBack,

  onStatusChange,
  readOnly = false,
}: OfficerProfileViewProps) {
  const [profile, setProfile] = useState<EmployeeView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "cases">("overview");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await employeeApi.getEmployeeView(employeeId);
      setProfile(data);
    } catch (e: unknown) {
      setError("Failed to load employee profile.");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const initials = useMemo(() => {
    const source = profile?.full_name?.trim() || "Officer";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }, [profile?.full_name]);

  const tableSnapshot: EmployeeTable | null = profile
    ? {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        departmentName: profile.assignDepartment,
        position: profile.position,
        status: profile.status,
        statusRemarks: "",
        activeCases: profile.assignCase?.length ?? 0,
      }
    : null;

  const profileStatus = normalizeStatusLabel(profile?.status);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors w-fit"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Officer Management
        </button>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="h-6 w-44 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-red-600 text-sm">
            {error}
          </div>
        ) : profile ? (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                {profile.photo ? (
                  <img
                    src={
                      profile.photo.startsWith("data:") ||
                      profile.photo.startsWith("http")
                        ? profile.photo
                        : `data:image/jpeg;base64,${profile.photo}`
                    }
                    alt={profile.full_name}
                    className="w-16 h-16 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {initials}
                  </div>
                )}

                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                    {profile.full_name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {profile.email || "No email"}
                  </p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[profileStatus]}`}
                    >
                      {profileStatus}
                    </span>
                  </div>
                </div>
              </div>

              {tableSnapshot && !readOnly && (
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  <button
                    onClick={() => onStatusChange(tableSnapshot)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors w-full sm:w-auto"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Update Status
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
              <div className="flex border-b border-gray-200 px-6 bg-white overflow-x-auto whitespace-nowrap">
                {(["overview", "cases"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    disabled={loading}
                    className={`py-4 px-1 mr-8 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
                  >
                    {tab === "cases"
                      ? `Case History (${profile.assignCase?.length ?? 0})`
                      : "Overview"}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 border border-gray-200 rounded-xl p-5 bg-white">
                      <h2 className="text-sm font-semibold text-gray-900">
                        Client Information
                      </h2>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                        <DetailField
                          label="Full Name"
                          value={profile.full_name}
                        />
                        <DetailField
                          label="Contact Number"
                          value={profile.contactNumber}
                        />
                        <DetailField
                          label="Age"
                          value={profile.age ? `${profile.age}` : "—"}
                        />
                        <DetailField label="Gender" value={profile.gender} />
                        <DetailField
                          label="Civil Status"
                          value={profile.civilStatus}
                        />
                        <DetailField label="Email" value={profile.email} />
                        <div className="md:col-span-2">
                          <DetailField
                            label="Current Address"
                            value={profile.completeAddress}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-5 bg-white">
                      <h2 className="text-sm font-semibold text-gray-900">
                        Case Information
                      </h2>
                      <div className="mt-4 space-y-5">
                        <DetailField
                          label="Department"
                          value={prettifyDepartmentName(
                            profile.assignDepartment,
                          )}
                        />
                        <DetailField
                          label="Position"
                          value={profile.position}
                        />
                        <DetailField label="Status" value={profileStatus} />
                        <DetailField
                          label="Assigned Cases"
                          value={profile.assignCase?.length ?? 0}
                        />
                        <DetailField
                          label="Birth Date"
                          value={profile.birthDate}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "cases" && (
                  <div className="space-y-2">
                    {!profile.assignCase || profile.assignCase.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No active or assigned cases.
                      </p>
                    ) : (
                      profile.assignCase.map((item) => (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50/70"
                        >
                          <p className="text-sm font-medium text-gray-800">
                            {item.caseNumber}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {item.natureOfComplaint}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-gray-500">
                              Complainant: {item.complainantFullName || "—"}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
