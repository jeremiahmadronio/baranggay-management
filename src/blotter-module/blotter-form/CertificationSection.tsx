import { SectionCard } from "../reusable/FormComponents";
interface CertificationSectionProps {
  certified: boolean;
  onChange: (val: boolean) => void;
  error?: string;
  clearErr: () => void;
}
export const CertificationSection = ({
  certified,
  onChange,
  error,
  clearErr,
}: CertificationSectionProps) => {
  return (
    <SectionCard letter="H" title="Certification">
      <div id="field-certified">
        <label
          className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${certified ? "border-blue-400 bg-blue-50" : error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
        >
          <input
            type="checkbox"
            checked={certified}
            onChange={(e) => {
              onChange(e.target.checked);
              clearErr();
            }}
            className="mt-0.5 accent-blue-600 shrink-0"
          />
          <p className="text-sm text-gray-700 leading-relaxed">
            I hereby certify that the above information is true and correct to
            the best of my knowledge and belief. I understand that any false
            statement made herein may subject me to the penalties prescribed by
            law. I am voluntarily executing this complaint and authorize the
            Barangay to take appropriate action.
          </p>
        </label>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </SectionCard>
  );
};
