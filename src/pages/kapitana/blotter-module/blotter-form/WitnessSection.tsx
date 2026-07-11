import {
  SectionCard,
  FormRow,
  FormInput,
} from "../reusable/FormComponents";
import { UploadCloudIcon, FileTextIcon, XCircleIcon } from "lucide-react";
import { PersonSearchInput } from "../reusable/PersonSearchInput";
import {
  type WitnessEntry,
  
} from "../../../../service/blotter-api/BlotterFormComplaint";

import {
  
  type PersonSearchResponseDTO,
} from "../../../../service/blotter-api/Resident";


const MAX_WITNESS_FULL_NAME_LENGTH = 80;
const MAX_WITNESS_ADDRESS_LENGTH = 180;
const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

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

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 tracking-wide mb-1 block">
                Witness Photo / Signature Image (Images Only)
              </label>

              {!w.testimonyFile ? (
                <div
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0] || null;
                    if (file) {
                      if (!file.type.startsWith("image/")) {
                        alert("Only image files are allowed (JPG, PNG, etc.).");
                        return;
                      }
                      if (file.size <= MAX_BYTES) {
                        updateWitness(i, "testimonyFile", file);
                        clearErr(`witnessTestimony${i}`);
                      }
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById(`field-witnessTestimony-kap-${i}`)?.click()}
                  className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-6 cursor-pointer transition-colors ${
                    errors?.[`witnessTestimony${i}`]
                      ? "border-red-300 bg-red-50/40"
                      : "border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/40"
                  }`}
                >
                  <UploadCloudIcon className="w-8 h-8 text-slate-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Drag &amp; drop witness image here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      or click to browse — .jpg, .jpeg, .png (images only)
                    </p>
                  </div>
                  <input
                    id={`field-witnessTestimony-kap-${i}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        if (!file.type.startsWith("image/")) {
                          alert("Only image files are allowed (JPG, PNG, etc.).");
                          e.target.value = "";
                          return;
                        }
                        if (file.size <= MAX_BYTES) {
                          updateWitness(i, "testimonyFile", file);
                          clearErr(`witnessTestimony${i}`);
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileTextIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {w.testimonyFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatSize(w.testimonyFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateWitness(i, "testimonyFile", undefined)}
                    className="flex-shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove file"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
              {errors[`witnessTestimony${i}`] && (
                <p className="text-xs text-red-500 mt-1">{errors[`witnessTestimony${i}`]}</p>
              )}
            </div>
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
