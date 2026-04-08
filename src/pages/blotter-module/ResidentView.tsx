import { useEffect, useState } from "react";
import type { ResidentProfileViewDTO } from "../../service/blotter-api/blotter-api";

interface ResidentProfilePageProps {
  residentId: number;
  onBack: () => void;
  fetchProfile: (id: number) => Promise<ResidentProfileViewDTO>;
}

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

function InfoField({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-800">{display}</p>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <span className="text-gray-500">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${className ?? ""}`} />
  );
}

export function ResidentProfilePage({
  residentId,
  onBack,
  fetchProfile,
}: ResidentProfilePageProps) {
  const [profile, setProfile] = useState<ResidentProfileViewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "cases">("overview");

  useEffect(() => {
    setLoading(true);
    setError(null);
    setProfile(null);
    fetchProfile(residentId)
      .then(setProfile)
      .catch((e) => setError(e.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [residentId]);

  const formatDate = (date?: string) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  const normalizeAsset = (value?: string | null, mimeHint = "image/jpeg") => {
    if (!value) return "";
    if (value.startsWith("data:") || value.startsWith("http")) return value;
    return `data:${mimeHint};base64,${value}`;
  };

  const profilePhotoSrc = profile?.photo
    ? normalizeAsset(profile.photo, "image/jpeg")
    : "";

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Back + Header */}
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Residents
          </button>

          {loading ? (
            <div className="flex flex-col gap-2">
              <SkeletonBlock className="h-8 w-56" />
              <SkeletonBlock className="h-4 w-80" />
            </div>
          ) : error ? null : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {profilePhotoSrc ? (
                  <img
                    src={profilePhotoSrc}
                    alt={profile?.fullName || "Resident"}
                    className="w-16 h-16 rounded-full object-cover border border-gray-200 shadow-sm cursor-zoom-in"
                    onClick={() => setIsPhotoModalOpen(true)}
                    title="Click to zoom"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-lg font-semibold text-gray-500">
                    {profile?.fullName
                      ?.split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "R"}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profile?.fullName}
                    </h1>

                    {profile?.isVoter && (
                      <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Registered Voter
                      </span>
                    )}
                    {profile?.isHeadOfFamily && (
                      <span className="text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full">
                        Head of Family
                      </span>
                    )}
                  </div>
                  <p className="text-m mt-1.5">
                    {profile?.barangayIdNumber && (
                      <span h-4 bg-gray-300 w-24>
                        {profile.barangayIdNumber}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-24 text-red-500 gap-3 bg-white rounded-xl border border-gray-200">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchProfile(residentId)
                  .then(setProfile)
                  .catch(() => setError("Failed to load"))
                  .finally(() => setLoading(false));
              }}
              className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Tabs */}
        {!error && (
          <div className="  rounded-xl overflow-hidden">
            <div className="flex border-b border-gray-200 px-6">
              {(["overview", "cases"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  disabled={loading}
                  className={`py-4 px-1 mr-8 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-800 disabled:pointer-events-none"
                  }`}
                >
                  {tab === "cases"
                    ? `Case History${profile ? ` (${profile.cases?.length ?? 0})` : ""}`
                    : "Overview"}
                </button>
              ))}
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Loading skeleton */}
              {loading && (
                <div className="flex flex-col gap-5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-xl p-6 flex flex-col gap-4"
                    >
                      <SkeletonBlock className="h-4 w-32" />
                      <div className="grid grid-cols-2 gap-4">
                        {[...Array(6)].map((_, j) => (
                          <div key={j} className="flex flex-col gap-1.5">
                            <SkeletonBlock className="h-3 w-20" />
                            <SkeletonBlock className="h-4 w-32" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && profile && activeTab === "overview" && (
                <>
                  {/* Personal Info */}
                  <SectionCard
                    title="Personal Information"
                    icon={
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    }
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-5">
                      <InfoField label="Full Name" value={profile.fullName} />
                      <InfoField label="Gender" value={profile.gender} />
                      <InfoField
                        label="Date of Birth"
                        value={formatDate(profile.birthDate)}
                      />
                      <InfoField
                        label="Age"
                        value={
                          profile.age ? `${profile.age} years old` : undefined
                        }
                      />
                      <InfoField
                        label="Civil Status"
                        value={profile.civilStatus}
                      />
                      <InfoField label="Blood Type" value={profile.bloodType} />
                      <InfoField
                        label="Citizenship"
                        value={profile.citizenship}
                      />
                      <InfoField label="Religion" value={profile.religion} />
                      <InfoField
                        label="Occupation"
                        value={profile.occupation}
                      />
                    </div>
                  </SectionCard>

                  {/* Two column layout for contact + barangay */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Contact Info */}
                    <SectionCard
                      title="Contact & Address"
                      icon={
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .99h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0121 15l-.08 1.92z" />
                        </svg>
                      }
                    >
                      <div className="flex flex-col gap-5">
                        <InfoField
                          label="Contact Number"
                          value={profile.contactNumber}
                        />
                        <InfoField label="Email" value={profile.email} />
                        <InfoField
                          label="Complete Address"
                          value={profile.completeAddress}
                        />
                      </div>
                    </SectionCard>

                    {/* Barangay Records */}
                    <SectionCard
                      title="Barangay Records"
                      icon={
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <path d="M8 21h8M12 17v4" />
                        </svg>
                      }
                    >
                      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                        <InfoField
                          label="Barangay ID"
                          value={profile.barangayIdNumber}
                        />
                        <InfoField
                          label="Household No."
                          value={profile.householdNumber}
                        />
                        <InfoField
                          label="Precinct No."
                          value={profile.precinctNumber}
                        />
                        <InfoField
                          label="Date of Residency"
                          value={formatDate(profile.dateOfResidency)}
                        />
                        <InfoField
                          label="Registered Voter"
                          value={profile.isVoter}
                        />
                        <InfoField
                          label="Head of Family"
                          value={profile.isHeadOfFamily}
                        />
                      </div>
                    </SectionCard>
                  </div>

                  <SectionCard
                    title="Social & Program Details"
                    icon={
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2v20" />
                        <path d="M2 12h20" />
                      </svg>
                    }
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-5">
                      <InfoField
                        label="Educational Attainment"
                        value={profile.educationalAttainment}
                      />
                      <InfoField
                        label="4Ps Beneficiary"
                        value={profile.is4ps}
                      />
                      <InfoField label="PWD" value={profile.isPwd} />
                      <InfoField
                        label="PWD ID Number"
                        value={profile.isPwd ? profile.pwdIdNumber : "—"}
                      />
                      <InfoField label="Indigent" value={profile.isIndigent} />
                      <InfoField
                        label="Resident Status"
                        value={profile.status}
                      />
                    </div>
                  </SectionCard>
                </>
              )}

              {!loading && profile && activeTab === "cases" && (
                <>
                  {!profile.cases || profile.cases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <svg
                        width="44"
                        height="44"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        className="mb-3"
                      >
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-500">
                        No case history found
                      </p>
                      <p className="text-xs mt-1 text-gray-400">
                        This resident has no recorded blotter entries.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Case list header */}
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
                              className={`text-xs px-5 py-1 rounded-full font-medium ${
                                STATUS_COLORS[c.status] ??
                                "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                ROLE_COLORS[c.role?.toUpperCase()] ??
                                "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {c.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {isPhotoModalOpen && profilePhotoSrc && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute -top-10 right-0 text-white/90 hover:text-white text-sm"
            >
              Close
            </button>
            <img
              src={profilePhotoSrc}
              alt={profile?.fullName || "Resident"}
              className="w-[70vw] max-w-[520px] aspect-square rounded-full object-cover border-4 border-white shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
