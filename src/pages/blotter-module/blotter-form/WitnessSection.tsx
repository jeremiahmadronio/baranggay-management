import {
  SectionCard,
  FormRow,
  FormInput,
  FormTextarea,
} from "../reusable/FormComponents";
import { PersonSearchInput } from "../reusable/PersonSearchInput";
import {
  type WitnessEntry,
  
} from "../../../service/blotter-api/BlotterFormComplaint";

import {
  
  type PersonSearchResponseDTO,
} from "../../../service/blotter-api/Resident";


const MAX_WITNESS_FULL_NAME_LENGTH = 80;
const MAX_WITNESS_ADDRESS_LENGTH = 180;
const MAX_WITNESS_TESTIMONY_LENGTH = 500;

interface WitnessSectionProps {
  witnesses: WitnessEntry[];
  addWitness: () => void;
  removeWitness: (i: number) => void;
  updateWitness: (i: number, field: keyof WitnessEntry, value: any) => void;
  errors: Record<string, string>;
  clearErr: (key: string) => void;
}

export const WitnessSection = ({
  witnesses,
  addWitness,
  removeWitness,
  updateWitness,
  errors,
  clearErr,
}: WitnessSectionProps) => {
  return (
    <SectionCard letter="G" title="Witnesses">
      <div className="flex flex-col gap-4">
        {witnesses.map((w, i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 bg-gray-50/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Witness {i + 1}
              </span>
              {witnesses.length > 1 && (
                <button
                  onClick={() => removeWitness(i)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Remove
                </button>
              )}
            </div>

            <PersonSearchInput
              label="Search Witness (Auto-fill)"
              placeholder="Search by name..."
              onSelect={(person: PersonSearchResponseDTO) => {
                updateWitness(i, "personId", person.id);
                updateWitness(
                  i,
                  "fullName",
                  `${person.firstName} ${person.lastName}`
                    .trim()
                    .slice(0, MAX_WITNESS_FULL_NAME_LENGTH),
                );
                updateWitness(i, "contactNumber", person.contactNumber || "");
                updateWitness(
                  i,
                  "address",
                  (person.completeAddress || "").slice(
                    0,
                    MAX_WITNESS_ADDRESS_LENGTH,
                  ),
                );
              }}
            />

            <FormRow cols={3}>
              <FormInput
                id={`field-witnessFullName${i}`}
                label="Full Name"
                placeholder="Full name"
                value={w.fullName}
                maxLength={MAX_WITNESS_FULL_NAME_LENGTH}
                showCounter
                error={errors[`witnessFullName${i}`]}
                onChange={(e) => {
                  updateWitness(i, "fullName", e.target.value);
                  clearErr(`witnessFullName${i}`);
                }}
              />
              <FormInput
                id={`field-witnessContact${i}`}
                label="Contact Number"
                placeholder="09XX XXX XXXX"
                inputMode="numeric"
                maxLength={11}
                value={w.contactNumber ?? ""}
                error={errors[`witnessContact${i}`]}
                onChange={(e) => {
                  updateWitness(
                    i,
                    "contactNumber",
                    e.target.value.replace(/\D/g, ""),
                  );
                  clearErr(`witnessContact${i}`);
                }}
              />
            </FormRow>

            <FormInput
              id={`field-witnessAddress${i}`}
              label="Address"
              placeholder="Complete address"
              value={w.address ?? ""}
              maxLength={MAX_WITNESS_ADDRESS_LENGTH}
              showCounter
              error={errors[`witnessAddress${i}`]}
              onChange={(e) => {
                updateWitness(i, "address", e.target.value);
                clearErr(`witnessAddress${i}`);
              }}
            />

            <FormTextarea
              id={`field-witnessTestimony${i}`}
              label="Testimony"
              placeholder="Enter witness testimony / statement..."
              value={w.testimony ?? ""}
              rows={3}
              maxLength={MAX_WITNESS_TESTIMONY_LENGTH}
              error={errors[`witnessTestimony${i}`]}
              hint={`Max ${MAX_WITNESS_TESTIMONY_LENGTH} characters`}
              onChange={(e) => {
                updateWitness(i, "testimony", e.target.value);
                clearErr(`witnessTestimony${i}`);
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={addWitness}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors self-start"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        + Add Witness
      </button>
    </SectionCard>
  );
};
