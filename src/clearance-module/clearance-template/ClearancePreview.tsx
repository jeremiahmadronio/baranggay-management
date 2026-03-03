import React, { Component } from "react";
import { type TemplateData } from "./template";
import { renderTextWithVariables } from "./PreviewUtils";
import { SAMPLE_DATA } from "../../clearance-api/MockApi";
import { Header, Watermark, Footer, Signatories } from "./SharedComponents";
export function ClearancePreview({ template }: { template: TemplateData }) {
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
                {renderTextWithVariables(template.bodySections[0].text)}
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
                  <span className="font-bold text-blue-700">
                    {SAMPLE_DATA.FULL_NAME}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-[130px] uppercase font-semibold text-gray-700 flex-shrink-0">
                    Address
                  </span>
                  <span className="mr-2 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {SAMPLE_DATA.ADDRESS}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-[130px] uppercase font-semibold text-gray-700 flex-shrink-0">
                    Date of Birth
                  </span>
                  <span className="mr-2 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {SAMPLE_DATA.DATE_OF_BIRTH}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-[130px] uppercase font-semibold text-gray-700 flex-shrink-0">
                    Place of Birth
                  </span>
                  <span className="mr-2 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {SAMPLE_DATA.PLACE_OF_BIRTH}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-[130px] uppercase font-semibold text-gray-700 flex-shrink-0">
                    Purpose
                  </span>
                  <span className="mr-2 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {SAMPLE_DATA.PURPOSE}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-[130px] uppercase font-semibold text-gray-700 flex-shrink-0">
                    Residency Date
                  </span>
                  <span className="mr-2 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {SAMPLE_DATA.RESIDENCY_DATE}
                  </span>
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
                {renderTextWithVariables(template.bodySections[1].text)}
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
                {renderTextWithVariables(section.text)}
              </div>
            ))}

            {/* Payment Details + Thumbmark Row */}
            {hasFee && (
              <div className="flex items-end justify-between mt-5">
                <div className="text-[11px] space-y-0.5 text-gray-800">
                  <div className="flex">
                    <span className="w-[100px] font-medium">Com. Tax No.</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-blue-700">
                      {SAMPLE_DATA.COM_TAX_NO || "___________"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-[100px] font-medium">Issued At</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-blue-700">
                      {SAMPLE_DATA.ISSUED_AT || "___________"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-[100px] font-medium">Issued On</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-blue-700">
                      {SAMPLE_DATA.DATE_ISSUED}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-[100px] font-medium">O.R. No.</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-blue-700">
                      {SAMPLE_DATA.OR_NUMBER}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-[100px] font-medium">O.R. Date</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-blue-700">
                      {SAMPLE_DATA.OR_DATE || "___________"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-[100px] font-medium">Valid Until</span>
                    <span className="mr-2">:</span>
                    <span className="font-bold text-blue-700">
                      {SAMPLE_DATA.VALID_UNTIL || "___________"}
                    </span>
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
