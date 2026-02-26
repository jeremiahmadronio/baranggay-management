import React, { Component } from "react";
import { type TemplateData } from "./template";
import { renderTextWithVariables } from "./PreviewUtils";
import {
  Header,
  Watermark,
  Footer,
  Signatories,
  PaymentDetails,
} from "./SharedComponents";
export function ResidencyPreview({ template }: { template: TemplateData }) {
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
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 max-h-[500px] overflow-hidden px-8 py-6">
            {template.bodySections.map((section) => (
              <div
                key={section.id}
                className="text-[12.5px] leading-[1.6] text-gray-800 text-left mb-6 break-words whitespace-pre-wrap"
                style={{
                  textIndent: "2em",
                }}
              >
                {renderTextWithVariables(section.text)}
              </div>
            ))}
          </div>
        </div>

        <PaymentDetails hasFee={template.settings.hasFee} />
        <Signatories template={template} />
      </div>

      <Footer text={template.footerText} />
    </div>
  );
}
