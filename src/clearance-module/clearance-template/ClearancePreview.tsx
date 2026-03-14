import { type TemplateData } from "./template";
import { renderTextWithVariables, DataValue } from "./PreviewUtils";
import { Header, Watermark, Footer } from "./SharedComponents";

interface PreviewProps {
  template: TemplateData;
  customData?: Record<string, string>;
}

export function ClearancePreview({ template, customData }: PreviewProps) {
  const hasPhoto = template.settings.requiresPhoto;
  const hasThumbmark = template.settings.requiresThumbmark;
  const hasFee = template.settings.hasFee;
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
                {renderTextWithVariables(template.bodySections[0].text, customData)}
              </div>
            )}

            {/* Fixed Data Fields - Always present for clearance */}
            <div className="text-[12px] leading-[2] text-gray-800 mb-5 ml-6">
              <div className="space-y-0">
                <div className="flex">
                  <span className="w-[130px] uppercase font-semibold text-gray-700 flex-shrink-0">
                    Name
                  </span>
                  <span className="mr-2 flex-shrink-0">:</span>
                  <DataValue fieldKey="FULL_NAME" customData={customData} />
                </div>
                <div className="flex">
                  <span className="w-[130px] uppercase font-semibold text-gray-700 flex-shrink-0">
                    Address
                  </span>
                  <span className="mr-2 flex-shrink-0">:</span>
                  <DataValue fieldKey="ADDRESS" customData={customData} />
                </div>
                <div className="flex">
                  <span className="w-[130px] uppercase font-semibold text-gray-700 flex-shrink-0">
                    Date of Birth
                  </span>
                  <span className="mr-2 flex-shrink-0">:</span>
                  <DataValue fieldKey="DATE_OF_BIRTH" customData={customData} />
                </div>
                <div className="flex">
                  <span className="w-[130px] uppercase font-semibold text-gray-700 flex-shrink-0">
                    Place of Birth
                  </span>
                  <span className="mr-2 flex-shrink-0">:</span>
                  <DataValue fieldKey="PLACE_OF_BIRTH" customData={customData} />
                </div>
                <div className="flex">
                  <span className="w-[130px] uppercase font-semibold text-gray-700 flex-shrink-0">
                    Purpose
                  </span>
                  <span className="mr-2 flex-shrink-0">:</span>
                  <DataValue fieldKey="PURPOSE" customData={customData} />
                </div>
                <div className="flex">
                  <span className="w-[130px] uppercase font-semibold text-gray-700 flex-shrink-0">
                    Residency Date
                  </span>
                  <span className="mr-2 flex-shrink-0">:</span>
                  <DataValue fieldKey="RESIDENCY_SINCE" customData={customData} />
                </div>
              </div>
            </div>

         

            {/* Body Text 2 - NO DEROGATORY RECORD section */}
            {template.bodySections[1] && (
              <div
                className="text-[12px] leading-[1.7] text-gray-800 text-justify mb-5 whitespace-pre-wrap"
                style={{
                  textIndent: "2em",
                }}
              >
                {renderTextWithVariables(template.bodySections[1].text, customData)}
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

            {/* Payment Details + Thumbmark Row */}
            {hasFee && (
              <div className="flex items-end justify-between mt-5">
                <div className="text-[11px] space-y-0.5 text-gray-800">
                  <div className="flex">
                    <span className="w-[100px] font-medium">Com. Tax No.</span>
                    <span className="mr-2">:</span>
                    <DataValue fieldKey="COM_TAX_NO" customData={customData} />
                  </div>
                  <div className="flex">
                    <span className="w-[100px] font-medium">Issued At</span>
                    <span className="mr-2">:</span>
                    <DataValue fieldKey="ISSUED_AT" customData={customData} />
                  </div>
                  <div className="flex">
                    <span className="w-[100px] font-medium">Issued On</span>
                    <span className="mr-2">:</span>
                    <DataValue fieldKey="DATE_ISSUED" customData={customData} />
                  </div>
                  <div className="flex">
                    <span className="w-[100px] font-medium">O.R. No.</span>
                    <span className="mr-2">:</span>
                    <DataValue fieldKey="OR_NUMBER" customData={customData} />
                  </div>
                  <div className="flex">
                    <span className="w-[100px] font-medium">O.R. Date</span>
                    <span className="mr-2">:</span>
                    <DataValue fieldKey="OR_DATE" customData={customData} />
                  </div>
                  <div className="flex">
                    <span className="w-[100px] font-medium">Valid Until</span>
                    <span className="mr-2">:</span>
                    <DataValue fieldKey="VALID_UNTIL" customData={customData} />
                  </div>
                </div>

                {/* Thumbmark next to payment */}
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

            {/* Thumbmark alone if no fee but has thumbmark */}
            {!hasFee && hasThumbmark && (
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
