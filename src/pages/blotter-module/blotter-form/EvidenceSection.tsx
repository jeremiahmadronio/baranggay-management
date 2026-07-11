import { useState } from "react";
import { SectionCard, FormInput } from "../reusable/FormComponents";
import { Upload, LockIcon } from "lucide-react";
import { type EvidenceOptionDTO } from "../../../service/blotter-api/BlotterFormComplaint";

const MAX_CUSTOM_EVIDENCE_LENGTH = 200;
interface EvidenceSectionProps {
  optionsLoading: boolean;
  evidenceOptions: EvidenceOptionDTO[];
  selectedEvidence: Set<number>;
  evidenceFiles: Record<number, File | null>;
  toggleEvidence: (id: number) => void;
  setEvidenceFile: (id: number, file: File | null) => void;
  customEvidence: string;
  setCustomEvidence: (val: string) => void;
  customEvidenceFile: File | null;
  setCustomEvidenceFile: (file: File | null) => void;
  errors?: Record<string, string>;
  lockedEvidence?: Set<number>;
}
export const EvidenceSection = ({
  optionsLoading,
  evidenceOptions,
  selectedEvidence,
  evidenceFiles,
  toggleEvidence,
  setEvidenceFile,
  customEvidence,
  setCustomEvidence,
  customEvidenceFile,
  setCustomEvidenceFile,
  errors,
  clearErr,
  lockedEvidence = new Set(),
}: EvidenceSectionProps) => {
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const availableOptions = evidenceOptions.filter(ev => !lockedEvidence.has(ev.id));
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
              ? availableOptions
              : availableOptions.slice(0, 8)
            ).map((ev) => {
              const isSelected = selectedEvidence.has(ev.id);
              return (
              <div key={ev.id} className="flex flex-col gap-1">
                <div
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-all ${isSelected ? "border-blue-400 bg-blue-50/50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <label className={`flex items-center gap-3 w-full text-sm font-medium cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        toggleEvidence(ev.id);
                        clearErr?.();
                      }}
                      className="accent-blue-600 shrink-0 w-4 h-4 rounded border-gray-300"
                      value={ev.id}
                    />
                    <span className={isSelected ? "text-blue-900" : "text-gray-700"}>{ev.typName}</span>
                  </label>
                  {isSelected && (
                    <div className="relative shrink-0 flex items-center">
                      <input
                        type="file"
                        accept=".pdf,image/*,video/*,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file && file.type.startsWith("video/")) {
                            if (file.size > 5 * 1024 * 1024) {
                              alert("Video files must be 5MB or less.");
                              e.target.value = "";
                              return;
                            }
                          }
                          setEvidenceFile(ev.id, file);
                          clearErr?.();
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        title=""
                      />
                      <button
                        type="button"
                        className={`flex items-center gap-2 text-sm border rounded px-3 py-1.5 transition-colors ${errors?.[`evidenceFile_${ev.id}`] ? "border-red-300 text-red-600 bg-red-50" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                      >
                        <Upload size={14} className={errors?.[`evidenceFile_${ev.id}`] ? "text-red-500" : "text-gray-500"} />
                        <span className="truncate max-w-[150px]">
                          {evidenceFiles[ev.id] ? evidenceFiles[ev.id]?.name : "Upload File"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
                {errors?.[`evidenceFile_${ev.id}`] && (
                  <p className="text-red-500 text-xs font-medium pl-1">{errors[`evidenceFile_${ev.id}`]}</p>
                )}
              </div>
            )})}
          </div>
          {availableOptions.length > 8 && (
            <button
              type="button"
              className="mt-2 text-blue-600 hover:underline text-xs font-medium"
              onClick={() => setShowAllEvidence((s) => !s)}
            >
              {showAllEvidence
                ? "Show less"
                : `Show ${availableOptions.length - 8} more...`}
            </button>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400 italic">
          No evidence types available.
        </p>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-slate-700 tracking-wide">
          Other / Specify
        </label>
        <div
          className={`w-full rounded-lg border transition-all flex items-center justify-between overflow-hidden px-1 py-1 ${
            errors?.customEvidence || errors?.customEvidenceFile
              ? "border-red-400 bg-red-50/30"
              : customEvidence.trim().length > 0
                ? "border-blue-400 bg-blue-50/50"
                : "border-slate-300 bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200"
          }`}
        >
          <input
            id="field-customEvidence"
            placeholder="e.g. Medical certificate, CCTV footage, etc."
            maxLength={MAX_CUSTOM_EVIDENCE_LENGTH}
            value={customEvidence}
            onChange={(e) => {
              let sanitized = e.target.value.replace(/[^a-zA-Z0-9\s.,ñÑ/-]/g, "");
              setCustomEvidence(sanitized);
              clearErr?.();
            }}
            className="w-full bg-transparent px-2.5 py-1.5 text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-none"
          />
          {customEvidence.trim().length > 0 && (
            <div className="relative shrink-0 flex items-center mr-1">
              <input
                type="file"
                accept=".pdf,image/*,video/*,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.type.startsWith("video/")) {
                    if (file.size > 5 * 1024 * 1024) {
                      alert("Video files must be 5MB or less.");
                      e.target.value = "";
                      return;
                    }
                  }
                  setCustomEvidenceFile(file);
                  clearErr?.();
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title=""
              />
              <button
                type="button"
                className={`flex items-center gap-2 text-sm border rounded px-3 py-1.5 transition-colors ${errors?.customEvidenceFile ? "border-red-300 text-red-600 bg-red-50" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
              >
                <Upload size={14} className={errors?.customEvidenceFile ? "text-red-500" : "text-gray-500"} />
                <span className="truncate max-w-[150px]">
                  {customEvidenceFile ? customEvidenceFile.name : "Upload File"}
                </span>
              </button>
            </div>
          )}
        </div>
        
        {errors?.customEvidence && (
          <p className="text-xs text-red-500 font-medium mt-0.5 pl-1">{errors.customEvidence}</p>
        )}
        {errors?.customEvidenceFile && (
          <p className="text-xs text-red-500 font-medium mt-0.5 pl-1">{errors.customEvidenceFile}</p>
        )}
      </div>
    </SectionCard>
  );
};
