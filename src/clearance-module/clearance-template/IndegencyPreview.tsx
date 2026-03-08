import React from 'react'
import { type TemplateData } from './template'
import { renderTextWithVariables } from './PreviewUtils'
import {
  Header,
  Watermark,
  Footer,
  Signatories,
  PaymentDetails,
} from './SharedComponents'

interface PreviewProps {
  template: TemplateData;
  customData?: Record<string, string>;
}

export function IndigencyPreview({ template, customData }: PreviewProps) {
  // --- MOCK DATA LOGIC ---
  const today = new Date();
  const date = today.getDate();

  // Helper function para sa ordinal suffix (st, nd, rd, th)
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const mockDay = getOrdinal(date);
  const mockMonthYear = today.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  // ------------------------

  return (
    <div
      className="bg-white w-full max-w-[210mm] mx-auto shadow-xl relative flex flex-col border border-gray-200"
      style={{
        fontFamily: "'Times New Roman', 'Georgia', serif",
        minHeight: '297mm',
        aspectRatio: '210 / 297',
      }}
    >
      <Header />
      <Watermark />
      
      <div className="px-10 pt-6 pb-4 flex-1 relative z-10 flex flex-col">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1 text-center">
            <h2 className="text-[22px] font-bold text-gray-900 uppercase tracking-wide inline-block border-b-[2.5px] border-gray-900 pb-0.5">
              {template.title}
            </h2>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-8 py-2">
            {template.bodySections.map((section) => (
              <div
                key={section.id}
                className="text-[15px] leading-[1.8] text-gray-800 text-justify mb-8 break-words whitespace-pre-wrap"
                style={{
                  textIndent: '4em',
                }}
              >
                {renderTextWithVariables(section.text, customData)}
              </div>
            ))}

          

            {/* AUTOMATED MOCK DATE SECTION */}
            <div className="mt-12 text-[15px] text-gray-900">
              Signed this{' '}
              <span className="text-blue-700 font-bold border-b border-gray-800 px-2 min-w-[40px] inline-block text-center">
                {mockDay}
              </span>{' '}
              Day of{' '}
              <span className="text-blue-700 font-bold border-b border-gray-800 px-4 min-w-[120px] inline-block text-center">
                {mockMonthYear}
              </span>
            </div>
          </div>
        </div>

        
        <PaymentDetails hasFee={template.settings.hasFee} customData={customData} />
        
        <div className="flex justify-end mt-4">
            <Signatories template={template} />
        </div>
      </div>
      <Footer text={template.footerText} />
    </div>
  )
}

