import { type TemplateData } from "./template";
import { renderTextWithVariables, DataValue } from "./PreviewUtils";
import { Header, Watermark, Footer } from "./SharedComponents";
import { FORM_FIELDS_CONFIG } from "../../clearance-api/issue-certificate-api";

interface PreviewProps {
  template: TemplateData & {
    formFields?: {
      sections?: Array<{
        title: string;
        fields: Array<{
          name: string;
          label: string;
        }>;
      }>;
    };
  };
  customData?: Record<string, string>;
}

type PreviewSection = {
  title: string;
  fields: Array<{
    name: string;
    label: string;
  }>;
};

const PAYMENT_FIELD_KEYS = new Set([
  // UPPER_SNAKE (legacy mock templates)
  "OR_NUMBER",
  "OR_DATE",
  "AMOUNT_PAID",
  "COM_TAX_NO",
  "DATE_ISSUED",
  "ISSUED_AT",
  "VALID_UNTIL",
  // snake_case (API templates)
  "or_number",
  "or_date",
  "amount_paid",
  "ctc_number",
]);

const DEFAULT_CLEARANCE_FIELD_SECTIONS: PreviewSection[] = [
  {
    title: "Issue Fields",
    fields: [
      { name: "FULL_NAME", label: "Name" },
      { name: "ADDRESS", label: "Address" },
      { name: "DATE_OF_BIRTH", label: "Date of Birth" },
      { name: "PLACE_OF_BIRTH", label: "Place of Birth" },
      { name: "PURPOSE", label: "Purpose" },
      { name: "RESIDENCY_SINCE", label: "Residency Date" },
    ],
  },
];

function getDynamicFieldSections(
  template: PreviewProps["template"],
): PreviewSection[] {
  const configuredSections =
    template.formFields?.sections ??
    FORM_FIELDS_CONFIG[String(template.id)]?.sections ??
    DEFAULT_CLEARANCE_FIELD_SECTIONS;

  return configuredSections
    .map((section) => ({
      ...section,
      fields: section.fields.filter(
        (field) => !PAYMENT_FIELD_KEYS.has(field.name),
      ),
    }))
    .filter((section) => section.fields.length > 0);
}

function shouldShowSectionTitle(
  sections: PreviewSection[],
  title: string,
): boolean {
  // Hide generic section titles like "Personal Information" in certificate preview
  // Only show section titles for distinct requirement/supporting sections
  if (/personal|residency|purpose|payment|community/i.test(title)) return false;
  if (sections.length > 2) return true;
  return /requirement|requirements|supporting|vehicle|property/i.test(title);
}

/**
 * Tries multiple field keys (snake_case first, then UPPER_SNAKE) and displays the first found value.
 */
function MultiKeyValue({
  keys,
  customData,
}: {
  keys: string[];
  customData?: Record<string, string>;
}) {
  for (const key of keys) {
    if (customData && customData[key]) {
      return (
        <span className="font-bold text-green-700">{customData[key]}</span>
      );
    }
  }
  // Fallback: try SAMPLE_DATA via DataValue for the last key
  return <DataValue fieldKey={keys[keys.length - 1]} customData={customData} />;
}

export function ClearancePreview({ template, customData }: PreviewProps) {
  const hasPhoto = template.settings.requiresPhoto;
  const hasThumbmark = template.settings.requiresThumbmark;
  const hasFee = template.settings.hasFee;
  const hasCtn = template.settings.hasCtn;
  const showIssuanceDetails = hasFee || hasCtn;
  const dynamicFieldSections = getDynamicFieldSections(template);

  return (
    <div
      className="bg-white w-full max-w-[210mm] mx-auto shadow-xl relative flex flex-col border border-gray-200"
      style={{
        fontFamily: "'Times New Roman', 'Georgia', serif",
        minHeight: "297mm",
        aspectRatio: "210 / 297",
      }}
    >
      <Header />
      <Watermark />

      <div className="px-10 pt-6 pb-4 flex-1 relative z-10 flex flex-col">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 text-center">
            <h2 className="text-[20px] font-bold text-gray-900 uppercase tracking-wide inline-block border-b-[2.5px] border-gray-900 pb-0.5 italic">
              {template.title}
            </h2>
          </div>
          {hasPhoto && (
            <div className="flex-shrink-0 ml-4 absolute right-10 top-6">
              <div className="w-[72px] h-[72px] border border-gray-300 bg-blue-50/40 flex flex-col items-center justify-center">
                <span className="text-[8px] text-gray-400 font-medium">
                  1x1
                </span>
                <span className="text-[8px] text-gray-400 font-medium">
                  PHOTO
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden px-6 py-4">
            {template.bodySections[0] && (
              <div
                className="text-[12px] leading-[1.7] text-gray-800 text-justify mb-5 whitespace-pre-wrap"
                style={{
                  textIndent: "2em",
                }}
              >
                {renderTextWithVariables(
                  template.bodySections[0].text,
                  customData,
                )}
              </div>
            )}

            {/* Dynamic issue/requirement fields */}
            {dynamicFieldSections.length > 0 &&
              (() => {
                // Flatten all fields from all sections for clean layout
                const allFields = dynamicFieldSections.flatMap((s) => s.fields);
                const totalFields = allFields.length;
                const useTwoColumns = totalFields > 6;
                const fontSize = totalFields > 10 ? "10px" : "11px";
                const lineHeight = totalFields > 10 ? "1.6" : "1.8";

                // Check if any section title should be shown
                const hasVisibleSections = dynamicFieldSections.some((s) =>
                  shouldShowSectionTitle(dynamicFieldSections, s.title),
                );

                // If no section titles needed, render all fields as flat grid
                if (!hasVisibleSections) {
                  return (
                    <div className="mb-5 ml-4" style={{ fontSize, lineHeight }}>
                      <div
                        className={
                          useTwoColumns
                            ? "grid grid-cols-2 gap-x-6 gap-y-0"
                            : "space-y-0"
                        }
                      >
                        {allFields.map((field) => (
                          <div key={field.name} className="flex items-start">
                            <span
                              className={`${useTwoColumns ? "w-[130px]" : "w-[150px]"} uppercase font-semibold text-gray-700 flex-shrink-0`}
                            >
                              {field.label}
                            </span>
                            <span className="mr-1.5 flex-shrink-0">:</span>
                            <DataValue
                              fieldKey={field.name}
                              customData={customData}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // With section titles (e.g., Vehicle, Property sections)
                return (
                  <div className="mb-5 ml-4" style={{ fontSize, lineHeight }}>
                    {dynamicFieldSections.map((section) => (
                      <div key={section.title} className="mb-2">
                        {shouldShowSectionTitle(
                          dynamicFieldSections,
                          section.title,
                        ) && (
                          <p
                            className="mb-0.5 font-semibold uppercase tracking-[0.12em] text-gray-500"
                            style={{ fontSize: "9px" }}
                          >
                            {section.title}
                          </p>
                        )}
                        <div
                          className={
                            useTwoColumns
                              ? "grid grid-cols-2 gap-x-6 gap-y-0"
                              : "space-y-0"
                          }
                        >
                          {section.fields.map((field) => (
                            <div key={field.name} className="flex items-start">
                              <span
                                className={`${useTwoColumns ? "w-[130px]" : "w-[150px]"} uppercase font-semibold text-gray-700 flex-shrink-0`}
                              >
                                {field.label}
                              </span>
                              <span className="mr-1.5 flex-shrink-0">:</span>
                              <DataValue
                                fieldKey={field.name}
                                customData={customData}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

            {/* Body Text 2 - NO DEROGATORY RECORD section */}
            {template.bodySections[1] && (
              <div
                className="text-[12px] leading-[1.7] text-gray-800 text-justify mb-5 whitespace-pre-wrap"
                style={{
                  textIndent: "2em",
                }}
              >
                {renderTextWithVariables(
                  template.bodySections[1].text,
                  customData,
                )}
              </div>
            )}

            {/* Remaining body sections if any */}
            {template.bodySections.slice(2).map((section) => (
              <div
                key={section.id}
                className="text-[12px] leading-[1.7] text-gray-800 text-justify mb-3 whitespace-pre-wrap"
                style={{
                  textIndent: "2em",
                }}
              >
                {renderTextWithVariables(section.text, customData)}
              </div>
            ))}

            {/* Issuance Details — bottom section (OR, CTN, validity) */}
            {showIssuanceDetails && (
              <div className="flex items-end justify-between mt-6">
                <div className="text-[10px] leading-[1.9] text-gray-800">
                  {hasCtn && (
                    <div className="flex">
                      <span className="w-[100px] font-medium flex-shrink-0">
                        Com. Tax No.
                      </span>
                      <span className="mr-1.5 flex-shrink-0">:</span>
                      <MultiKeyValue
                        keys={["ctc_number", "COM_TAX_NO"]}
                        customData={customData}
                      />
                    </div>
                  )}
                  <div className="flex">
                    <span className="w-[100px] font-medium flex-shrink-0">
                      Issued At
                    </span>
                    <span className="mr-1.5 flex-shrink-0">:</span>
                    <DataValue fieldKey="ISSUED_AT" customData={customData} />
                  </div>
                  <div className="flex">
                    <span className="w-[100px] font-medium flex-shrink-0">
                      Issued On
                    </span>
                    <span className="mr-1.5 flex-shrink-0">:</span>
                    <DataValue fieldKey="DATE_ISSUED" customData={customData} />
                  </div>
                  {hasFee && (
                    <>
                      <div className="flex">
                        <span className="w-[100px] font-medium flex-shrink-0">
                          O.R. No.
                        </span>
                        <span className="mr-1.5 flex-shrink-0">:</span>
                        <MultiKeyValue
                          keys={["or_number", "OR_NUMBER"]}
                          customData={customData}
                        />
                      </div>
                      <div className="flex">
                        <span className="w-[100px] font-medium flex-shrink-0">
                          O.R. Date
                        </span>
                        <span className="mr-1.5 flex-shrink-0">:</span>
                        <MultiKeyValue
                          keys={["or_date", "OR_DATE"]}
                          customData={customData}
                        />
                      </div>
                      <div className="flex">
                        <span className="w-[100px] font-medium flex-shrink-0">
                          Amount
                        </span>
                        <span className="mr-1.5 flex-shrink-0">:</span>
                        <span className="font-bold text-green-700">
                          ₱{template.settings.fee.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex">
                    <span className="w-[100px] font-medium flex-shrink-0">
                      Valid Until
                    </span>
                    <span className="mr-1.5 flex-shrink-0">:</span>
                    <DataValue fieldKey="VALID_UNTIL" customData={customData} />
                  </div>
                </div>

                {/* Thumbmark next to issuance details */}
                {hasThumbmark && (
                  <div className="flex flex-col items-center ml-6">
                    <div className="w-[60px] h-[70px] border border-gray-300 bg-gray-50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-7 h-9 mx-auto mb-0.5 rounded-t-full border border-gray-300 bg-gray-100"></div>
                        <span className="text-[7px] text-gray-400 font-medium uppercase">
                          Thumbmark
                        </span>
                      </div>
                    </div>
                    <span className="text-[8px] text-gray-400 mt-0.5">
                      Right Thumb
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Thumbmark alone if no fee/ctn but has thumbmark */}
            {!showIssuanceDetails && hasThumbmark && (
              <div className="flex justify-start mt-5">
                <div className="flex flex-col items-center">
                  <div className="w-[60px] h-[70px] border border-gray-300 bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-7 h-9 mx-auto mb-0.5 rounded-t-full border border-gray-300 bg-gray-100"></div>
                      <span className="text-[7px] text-gray-400 font-medium uppercase">
                        Thumbmark
                      </span>
                    </div>
                  </div>
                  <span className="text-[8px] text-gray-400 mt-0.5">
                    Right Thumb
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Signatory - without thumbmark since we handle it above */}
        <ClearanceSignatories template={template} />
      </div>

      <Footer text={template.footerText} />
    </div>
  );
}
// Custom signatories for clearance (no thumbmark - handled in body)
function ClearanceSignatories({ template }: { template: TemplateData }) {
  return (
    <div className="mt-6 flex items-end justify-end">
      <div className="text-center">
        {template.signatories.map((sig, idx) => (
          <div key={idx} className={idx > 0 ? "mt-7" : "mt-0"}>
            <div className="border-b border-gray-800 pb-0.5 mb-0.5 min-w-[190px]">
              <span className="text-[12px] font-bold text-gray-900 uppercase tracking-wide">
                {sig.name || "___________________"}
              </span>
            </div>
            <span className="text-[11px] italic text-gray-600">
              {sig.position || "Position"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
