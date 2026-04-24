import type { ResidentProfileViewDTO } from "../../../service/admin-module-api/ResidentsManagement";

function toDisplay(value?: string | number | boolean | null): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-800">{toDisplay(value)}</p>
    </div>
  );
}

interface ResidentsOverviewTabProps {
  profile: ResidentProfileViewDTO;
  fullDisplayName: string;
  formatDate: (date?: string) => string;
}

export function ResidentsOverviewTab({
  profile,
  fullDisplayName,
  formatDate,
}: ResidentsOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-2 border border-gray-200 rounded-xl p-5 bg-white">
        <h2 className="text-sm font-semibold text-gray-900">
          Client Information
        </h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
          <DetailField label="Full Name" value={fullDisplayName} />
          <DetailField label="Contact Number" value={profile.contactNumber} />
          <DetailField
            label="Age"
            value={profile.age ? `${profile.age}` : "—"}
          />
          <DetailField label="Gender" value={profile.gender} />
          <DetailField label="Civil Status" value={profile.civilStatus} />
          <DetailField label="Email" value={profile.email} />
          <DetailField
            label="Date of Birth"
            value={formatDate(profile.birthDate)}
          />
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
          Case / Record Information
        </h2>
        <div className="mt-4 space-y-5">
          <DetailField label="Barangay ID" value={profile.barangayIdNumber} />
          <DetailField label="Status" value={profile.status} />
          <DetailField label="Precinct Number" value={profile.precinctNumber} />
          <DetailField
            label="Household Number"
            value={profile.householdNumber}
          />
          <DetailField
            label="Date of Residency"
            value={formatDate(profile.dateOfResidency)}
          />
          <DetailField label="Registered Voter" value={profile.isVoter} />
          <DetailField label="Head of Family" value={profile.isHeadOfFamily} />
          <DetailField label="Occupation" value={profile.occupation} />
        </div>
      </div>
    </div>
  );
}
