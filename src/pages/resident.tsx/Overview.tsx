import { UserIcon, PhoneIcon, FileTextIcon, PaperclipIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { ResidentProfileViewDTO } from "../../service/resident-api/ResidentsManagement";

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
  icon: ReactNode;
  children: ReactNode;
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
    <>
      <SectionCard
        title="Personal Information"
        icon={<UserIcon className="w-4 h-4" />}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-5">
          <InfoField label="Full Name" value={fullDisplayName} />
          <InfoField label="Suffix" value={profile.suffix} />
          <InfoField label="Gender" value={profile.gender} />
          <InfoField
            label="Date of Birth"
            value={formatDate(profile.birthDate)}
          />
          <InfoField
            label="Age"
            value={profile.age ? `${profile.age} years old` : 0}
          />
          <InfoField label="Civil Status" value={profile.civilStatus} />
          <InfoField label="Blood Type" value={profile.bloodType} />
          <InfoField label="Citizenship" value={profile.citizenship} />
          <InfoField label="Religion" value={profile.religion} />
          <InfoField label="Occupation" value={profile.occupation} />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SectionCard
          title="Contact & Address"
          icon={<PhoneIcon className="w-4 h-4" />}
        >
          <div className="flex flex-col gap-5">
            <InfoField label="Contact Number" value={profile.contactNumber} />
            <InfoField label="Email" value={profile.email} />
            <InfoField
              label="Complete Address"
              value={profile.completeAddress}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Barangay Records"
          icon={<FileTextIcon className="w-4 h-4" />}
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <InfoField label="Barangay ID" value={profile.barangayIdNumber} />
            <InfoField label="Household No." value={profile.householdNumber} />
            <InfoField label="Precinct No." value={profile.precinctNumber} />
            <InfoField
              label="Date of Residency"
              value={formatDate(profile.dateOfResidency)}
            />
            <InfoField label="Registered Voter" value={profile.isVoter} />
            <InfoField label="Head of Family" value={profile.isHeadOfFamily} />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Social & Program Details"
        icon={<PaperclipIcon className="w-4 h-4" />}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-5">
          <InfoField
            label="Educational Attainment"
            value={profile.educationalAttainment}
          />
          <InfoField label="4Ps Beneficiary" value={profile.is4ps} />
          <InfoField label="PWD" value={profile.isPwd} />
          <InfoField
            label="PWD ID Number"
            value={profile.isPwd ? profile.pwdIdNumber : "—"}
          />
          <InfoField label="Indigent" value={profile.isIndigent} />
          <InfoField label="Resident Status" value={profile.status} />
        </div>
      </SectionCard>
    </>
  );
}
