import { useRef, useEffect, useState } from "react";
import { Header, Footer } from "./SharedComponents";
import { SAMPLE_DATA } from "../../../clearance-api/template-api";

// Helper: resolve key trying as-is, UPPER_SNAKE, and lower_snake
const resolveSampleValue = (key: string): string => {
  if (SAMPLE_DATA[key]) return SAMPLE_DATA[key];
  const upper = key.toUpperCase();
  if (SAMPLE_DATA[upper]) return SAMPLE_DATA[upper];
  const lower = key.toLowerCase();
  if (SAMPLE_DATA[lower]) return SAMPLE_DATA[lower];
  return "___________";
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PreviewField {
  name: string;
  label: string;
}

export interface PreviewSignatory {
  name: string;
  position: string;
}

export type DesignFormat = "clearance" | "inline";

export interface NewTemplatePreviewData {
  designFormat: DesignFormat;
  title: string;
  bodySections: string[];
  issueFields: PreviewField[];
  requiresPhoto: boolean;
  requiresThumbmark: boolean;
  hasFee: boolean;
  fee: number;
  footerText: string;
  signatories: PreviewSignatory[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function NewTemplatePreview({ data }: { data: NewTemplatePreviewData }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Auto-scale content to fit within A4 bounds
  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const ro = new ResizeObserver(() => {
      const outerH = outer.clientHeight;
      const innerH = inner.scrollHeight;
      if (innerH > outerH && outerH > 0) {
        setScale(Math.max(0.7, outerH / innerH));
      } else {
        setScale(1);
      }
    });
    ro.observe(inner);
    return () => ro.disconnect();
  }, [data]);

  return (
    <>
      {/* Print-safe styles */}
      <style>{`
        @media print {
          .certificate-page {
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            page-break-after: always;
            page-break-inside: avoid;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .certificate-page * {
            break-inside: avoid;
          }
        }
      `}</style>
      <div
        ref={outerRef}
        className="certificate-page bg-white w-full max-w-[210mm] mx-auto shadow-xl relative flex flex-col border border-gray-200 overflow-hidden"
        style={{
          fontFamily: "'Times New Roman', 'Georgia', serif",
          minHeight: "297mm",
          maxHeight: "297mm",
          aspectRatio: "210 / 297",
        }}
      >
        <div
          ref={innerRef}
          className="flex flex-col flex-1"
          style={{
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top center",
          }}
        >
          <Header />

          {data.designFormat === "clearance" ? (
            <ClearanceLayout data={data} />
          ) : (
            <InlineLayout data={data} />
          )}

          <Footer text={data.footerText || ""} />
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT 1: CLEARANCE-STYLE (tabular fields, photo, payment + thumbmark)
// Matches: Barangay Clearance screenshot
// ═══════════════════════════════════════════════════════════════════════════════

function ClearanceLayout({ data }: { data: NewTemplatePreviewData }) {
  const hasPhoto = data.requiresPhoto;
  const hasThumbmark = data.requiresThumbmark;
  const hasFee = data.hasFee;

  // Auto-shrink text when many fields to prevent overflow
  const fieldCount = data.issueFields.length;
  const bodyFontSize =
    fieldCount > 10 ? "10px" : fieldCount > 7 ? "11px" : "12px";
  const fieldLineHeight =
    fieldCount > 10 ? "1.5" : fieldCount > 7 ? "1.7" : "2";
  // Use 2 columns when more than 6 fields to save space
  const useTwoColumns = fieldCount > 6;

  return (
    <div className="px-10 pt-6 pb-4 flex-1 relative z-10 flex flex-col">
      {/* Title + 1x1 Photo */}
      <div className="relative mb-6">
        <div className="text-center">
          <h2 className="text-[20px] font-bold text-gray-900 uppercase tracking-wide inline-block border-b-[2.5px] border-gray-900 pb-0.5 italic">
            {data.title || "CERTIFICATE TITLE"}
          </h2>
        </div>
        {hasPhoto && (
          <div className="absolute right-0 top-0">
            <div className="w-[72px] h-[72px] border border-gray-300 bg-blue-50/40 flex flex-col items-center justify-center">
              <span className="text-[8px] text-gray-400 font-medium">1x1</span>
              <span className="text-[8px] text-gray-400 font-medium">
                PHOTO
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-hidden px-6 py-4">
          {/* Body Text 1 */}
          {data.bodySections[0] && (
            <div
              className="leading-[1.7] text-gray-800 text-justify mb-5 whitespace-pre-wrap"
              style={{ textIndent: "2em", fontSize: bodyFontSize }}
            >
              <RenderBodyText text={data.bodySections[0]} />
            </div>
          )}

          {/* Tabular Issue Fields */}
          {data.issueFields.length > 0 && (
            <div
              className="text-gray-800 mb-5 ml-4"
              style={{ fontSize: bodyFontSize, lineHeight: fieldLineHeight }}
            >
              <div
                className={
                  useTwoColumns
                    ? "grid grid-cols-2 gap-x-4 gap-y-0"
                    : "space-y-0"
                }
              >
                {data.issueFields.map((field) => (
                  <div key={field.name} className="flex items-start">
                    <span
                      className={`${useTwoColumns ? "w-[120px]" : "w-[150px]"} uppercase font-semibold text-gray-700 flex-shrink-0`}
                    >
                      {field.label}
                    </span>
                    <span className="mr-1.5 flex-shrink-0">:</span>
                    <span className="font-bold text-blue-700">
                      {resolveSampleValue(field.name)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remaining body sections */}
          {data.bodySections.slice(1).map((text, idx) => (
            <div
              key={idx}
              className="leading-[1.7] text-gray-800 text-justify mb-5 whitespace-pre-wrap"
              style={{ textIndent: "2em", fontSize: bodyFontSize }}
            >
              <RenderBodyText text={text} />
            </div>
          ))}

          {/* Issuance Details — bottom section (OR, CTN, validity) */}
          {hasFee && (
            <div className="flex items-end justify-between mt-6">
              <div className="text-[10px] leading-[1.9] text-gray-800">
                <div className="flex">
                  <span className="w-[100px] font-medium flex-shrink-0">
                    Com. Tax No.
                  </span>
                  <span className="mr-1.5 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {resolveSampleValue("COM_TAX_NO")}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-[100px] font-medium flex-shrink-0">
                    Issued At
                  </span>
                  <span className="mr-1.5 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {resolveSampleValue("ISSUED_AT")}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-[100px] font-medium flex-shrink-0">
                    Issued On
                  </span>
                  <span className="mr-1.5 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {resolveSampleValue("DATE_ISSUED")}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-[100px] font-medium flex-shrink-0">
                    O.R. No.
                  </span>
                  <span className="mr-1.5 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {resolveSampleValue("OR_NUMBER")}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-[100px] font-medium flex-shrink-0">
                    O.R. Date
                  </span>
                  <span className="mr-1.5 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {resolveSampleValue("OR_DATE")}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-[100px] font-medium flex-shrink-0">
                    Amount
                  </span>
                  <span className="mr-1.5 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {data.fee > 0
                      ? `₱${data.fee.toFixed(2)}`
                      : resolveSampleValue("AMOUNT_PAID")}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-[100px] font-medium flex-shrink-0">
                    Valid Until
                  </span>
                  <span className="mr-1.5 flex-shrink-0">:</span>
                  <span className="font-bold text-blue-700">
                    {resolveSampleValue("VALID_UNTIL")}
                  </span>
                </div>
              </div>

              {/* Thumbmark beside payment */}
              {hasThumbmark && <ThumbmarkBox />}
            </div>
          )}

          {/* Thumbmark alone (no fee) */}
          {!hasFee && hasThumbmark && (
            <div className="flex justify-end mt-5">
              <ThumbmarkBox />
            </div>
          )}
        </div>
      </div>

      {/* "NOT VALID WITHOUT DRY SEAL" — inside body, above signatories */}
      <div className="px-6 pt-4 pb-1">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500 border-t border-gray-200 pt-2"
          style={{ letterSpacing: "0.2em" }}
        >
          ✦ Not valid without dry seal
        </p>
      </div>

      {/* Signatories — 2 left, 2 right grid, 5th centered */}
      <div className="mt-2">
        <SignatoryGrid signatories={data.signatories} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT 2: INLINE-STYLE (body with inline variables, "Signed this..." date)
// Matches: Certificate of Indigency screenshot
// ═══════════════════════════════════════════════════════════════════════════════

function InlineLayout({ data }: { data: NewTemplatePreviewData }) {
  const hasPhoto = data.requiresPhoto;
  const hasThumbmark = data.requiresThumbmark;
  const hasFee = data.hasFee;

  // Generate today's date for "Signed this..."
  const today = new Date();
  const date = today.getDate();
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const mockDay = getOrdinal(date);
  const mockMonthYear = today.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-10 pt-6 pb-4 flex-1 relative z-10 flex flex-col">
      {/* Title — centered, underlined, no italic */}
      <div className="relative mb-8">
        <div className="text-center">
          <h2 className="text-[22px] font-bold text-gray-900 uppercase tracking-wide inline-block border-b-[2.5px] border-gray-900 pb-0.5">
            {data.title || "CERTIFICATE TITLE"}
          </h2>
        </div>
        {hasPhoto && (
          <div className="absolute right-0 top-0">
            <div className="w-[72px] h-[72px] border border-gray-300 bg-blue-50/40 flex flex-col items-center justify-center">
              <span className="text-[8px] text-gray-400 font-medium">1x1</span>
              <span className="text-[8px] text-gray-400 font-medium">
                PHOTO
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Body with inline variables */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-8 py-2">
          {data.bodySections.map((text, idx) => (
            <div
              key={idx}
              className="text-[15px] leading-[1.8] text-gray-800 text-justify mb-8 break-words whitespace-pre-wrap"
              style={{ textIndent: "4em" }}
            >
              <RenderBodyText text={text} />
            </div>
          ))}

          {/* "Signed this ___ Day of ___" */}
          <div className="mt-12 text-[15px] text-gray-900">
            Signed this{" "}
            <span className="text-blue-700 font-bold border-b border-gray-800 px-2 min-w-[40px] inline-block text-center">
              {mockDay}
            </span>{" "}
            Day of{" "}
            <span className="text-blue-700 font-bold border-b border-gray-800 px-4 min-w-[120px] inline-block text-center">
              {mockMonthYear}
            </span>
          </div>
        </div>
      </div>

      {/* Payment details (if applicable) */}
      {hasFee && (
        <div className="mt-6 text-[11px] leading-[1.9] text-gray-800">
          <div className="flex">
            <span className="w-[130px] font-medium flex-shrink-0">
              PAID UNDER O.R. NO
            </span>
            <span className="mr-2 flex-shrink-0">:</span>
            <span className="font-bold text-blue-700">
              {SAMPLE_DATA.OR_NUMBER}
            </span>
          </div>
          <div className="flex">
            <span className="w-[130px] font-medium flex-shrink-0">
              Requested On
            </span>
            <span className="mr-2 flex-shrink-0">:</span>
            <span className="font-bold text-blue-700">
              {SAMPLE_DATA.DATE_ISSUED}
            </span>
          </div>
          <div className="flex">
            <span className="w-[130px] font-medium flex-shrink-0">Amount</span>
            <span className="mr-2 flex-shrink-0">:</span>
            <span className="font-bold text-blue-700">
              {data.fee > 0
                ? `₱${data.fee.toFixed(2)}`
                : SAMPLE_DATA.AMOUNT_PAID}
            </span>
          </div>
          <div className="flex">
            <span className="w-[130px] font-medium flex-shrink-0">
              Valid Until
            </span>
            <span className="mr-2 flex-shrink-0">:</span>
            <span className="font-bold text-blue-700">
              {SAMPLE_DATA.VALID_UNTIL}
            </span>
          </div>
        </div>
      )}

      {/* Signatories with optional thumbmark on left */}
      <div className="mt-8 flex items-end gap-6">
        {/* Thumbmark on left side */}
        {hasThumbmark && (
          <div className="flex-shrink-0">
            <ThumbmarkBox />
          </div>
        )}

        {/* Signatories — 2 left, 2 right grid, 5th centered */}
        <div className="flex-1">
          {/* "NOT VALID WITHOUT DRY SEAL" inside body, above signatories */}
          <p
            className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500 border-t border-gray-200 pt-2 mb-4"
            style={{ letterSpacing: "0.2em" }}
          >
            ✦ Not valid without dry seal
          </p>
          <SignatoryGrid signatories={data.signatories} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED PIECES
// ═══════════════════════════════════════════════════════════════════════════════

function SignatoryBlock({ sig }: { sig: { name: string; position: string } }) {
  return (
    <div className="text-center">
      <div className="border-b border-gray-800 pb-0.5 mb-0.5 min-w-[160px]">
        <span className="text-[12px] font-bold text-gray-900 uppercase tracking-wide">
          {sig.name || "___________________"}
        </span>
      </div>
      <span className="text-[11px] italic text-gray-600">
        {sig.position || "Position"}
      </span>
    </div>
  );
}

function SignatoryGrid({
  signatories,
}: {
  signatories: { name: string; position: string }[];
}) {
  if (signatories.length === 0) return null;

  // 1 signatory → centered
  if (signatories.length === 1) {
    return (
      <div className="flex justify-center">
        <SignatoryBlock sig={signatories[0]} />
      </div>
    );
  }

  // 2+ → grid: #1 left, #2 right, #3 left, #4 right, #5 centered
  const gridItems = signatories.slice(0, 4);
  const fifth = signatories[4];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          rowGap: "28px",
          columnGap: "20px",
        }}
      >
        {gridItems.map((sig, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <SignatoryBlock sig={sig} />
          </div>
        ))}
      </div>

      {/* 5th signatory centered below */}
      {fifth && (
        <div className="mt-7 flex justify-center">
          <SignatoryBlock sig={fifth} />
        </div>
      )}
    </div>
  );
}

function ThumbmarkBox() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-[60px] h-[70px] border border-gray-300 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-7 h-9 mx-auto mb-0.5 rounded-t-full border border-gray-300 bg-gray-100"></div>
          <span className="text-[7px] text-gray-400 font-medium uppercase">
            Thumbmark
          </span>
        </div>
      </div>
      <span className="text-[8px] text-gray-400 mt-0.5">Right Thumb</span>
    </div>
  );
}

function RenderBodyText({ text }: { text: string }) {
  if (!text) return null;

  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/\{\{([^}]+)\}\}/);
        if (match) {
          const varName = match[1];
          const value =
            resolveSampleValue(varName) !== "___________"
              ? resolveSampleValue(varName)
              : varName;
          return (
            <span key={i} className="font-bold text-blue-700">
              {value}
            </span>
          );
        }
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        if (boldParts.length > 1) {
          return boldParts.map((bp, j) => {
            const boldMatch = bp.match(/\*\*([^*]+)\*\*/);
            if (boldMatch)
              return (
                <strong key={`${i}-${j}`} className="font-bold">
                  {boldMatch[1]}
                </strong>
              );
            return <span key={`${i}-${j}`}>{bp}</span>;
          });
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
