import { useState } from "react";
import { SectionCard, FormInput } from "../reusable/FormComponents";
import { type EvidenceOptionDTO } from "../../../service/blotter-api/blotter-api";

const MAX_CUSTOM_EVIDENCE_LENGTH = 200;
interface EvidenceSectionProps {
  optionsLoading: boolean;
  evidenceOptions: EvidenceOptionDTO[];
  selectedEvidence: Set<number>;
  toggleEvidence: (id: number) => void;
  customEvidence: string;
  setCustomEvidence: (val: string) => void;
  error?: string;
  clearErr?: () => void;
}
export const EvidenceSection = ({
  optionsLoading,
  evidenceOptions,
  selectedEvidence,
  toggleEvidence,
  customEvidence,
  setCustomEvidence,
  error,
  clearErr,
}: EvidenceSectionProps) => {
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  return (
    <SectionCard letter="F" title="Other Documents or Evidence Provided">
      <p className="text-xs text-gray-500 -mt-1">
        Choose the relevant evidence types submitted by the complainant.
      </p>
      {optionsLoading ? (
        <p className="text-sm text-gray-400">Loading evidence types...</p>
      ) : evidenceOptions.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {(showAllEvidence
              ? evidenceOptions
              : evidenceOptions.slice(0, 8)
            ).map((ev) => (
              <label
                key={ev.id}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer text-sm transition-all ${selectedEvidence.has(ev.id) ? "border-blue-400 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
              >
                <input
                  type="checkbox"
                  checked={selectedEvidence.has(ev.id)}
                  onChange={() => toggleEvidence(ev.id)}
                  className="accent-blue-600 shrink-0"
                  value={ev.id}
                />
                {ev.typName}
              </label>
            ))}
          </div>
          {evidenceOptions.length > 8 && (
            <button
              type="button"
              className="mt-2 text-blue-600 hover:underline text-xs font-medium"
              onClick={() => setShowAllEvidence((s) => !s)}
            >
              {showAllEvidence
                ? "Show less"
                : `Show ${evidenceOptions.length - 8} more...`}
            </button>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400 italic">
          No evidence types available.
        </p>
      )}
      <FormInput
        id="field-customEvidence"
        label="Other / Specify"
        placeholder="e.g. Medical certificate, CCTV footage, etc."
        maxLength={MAX_CUSTOM_EVIDENCE_LENGTH}
        value={customEvidence}
        error={error}
        onChange={(e) => {
          setCustomEvidence(e.target.value);
          clearErr?.();
        }}
      />
    </SectionCard>
  );
};
