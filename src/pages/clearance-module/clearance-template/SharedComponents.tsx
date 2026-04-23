import { type TemplateData } from "./template";
import { SAMPLE_DATA } from "../../../clearance-api/template-api";

// Helper to get value with priority: customData > SAMPLE_DATA > fallback
const getValue = (
  key: string,
  customData?: Record<string, string>,
  fallback: string = "",
) => {
  if (customData && customData[key]) return customData[key];
  return SAMPLE_DATA[key] || fallback;
};

// Helper to determine if value is from custom data
const isCustomValue = (key: string, customData?: Record<string, string>) => {
  return customData && customData[key];
};

export const Header = () => (
  <div className="relative">
    <div
      className="h-[3px] w-full"
      style={{
        background:
          "linear-gradient(90deg, #1e3a5f 0%, #2563eb 30%, #1e40af 70%, #1e3a5f 100%)",
      }}
    ></div>

    <div
      className="relative overflow-hidden shadow-sm"
      style={{
        background: "linear-gradient(105deg, #1e3a8a 70%, #2563eb 70%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(circle at top, rgba(255,255,255,0.4) 0%, transparent 75%)",
        }}
      ></div>
      <div className="relative z-10 flex items-center justify-between px-6 py-2">
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-inner transition-all">
            <span className="text-[6px] text-white/90 font-medium tracking-widest">
              SEAL 1
            </span>
          </div>
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-inner transition-all">
            <span className="text-[6px] text-white/90 font-medium tracking-widest">
              SEAL 2
            </span>
          </div>
        </div>
        <div className="text-center flex-1 mx-4 flex flex-col justify-center">
          <div className="text-center">
            <span className="text-[8px] text-blue-200 uppercase tracking-[0.3em] font-medium leading-none">
              City of Valenzuela
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white leading-tight mt-0.5">
            Office of the Sangguniang Barangay
          </p>
          <h1
            className="text-[20px] font-black uppercase tracking-[0.05em] text-white leading-none mt-1"
            style={{
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            BARANGAY UGONG
          </h1>
        </div>
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-inner transition-all">
            <span className="text-[6px] text-white/90 font-medium tracking-widest">
              SEAL 3
            </span>
          </div>
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-inner transition-all">
            <span className="text-[6px] text-white/90 font-medium tracking-widest">
              SEAL 4
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      className="h-[2px] w-full"
      style={{
        background:
          "linear-gradient(90deg, #3079d2 0%, #10096c 50%, #4422b3 100%)",
      }}
    ></div>
  </div>
);
export const Watermark = () => (
  <div
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    style={{
      opacity: 0.035,
    }}
  >
    <div className="w-[320px] h-[320px] rounded-full border-[14px] border-gray-800 flex items-center justify-center">
      <div className="text-center">
        <p className="text-base font-bold text-gray-800 tracking-[0.3em] uppercase">
          Barangay
        </p>
        <p className="text-2xl font-extrabold text-gray-800 tracking-wider uppercase">
          Ugong
        </p>
      </div>
    </div>
  </div>
);
export const Footer = ({ text }: { text: string }) => (
  <div className="mt-auto">
    <div
      className="relative h-9 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #1e3a5f 0%, #1e40af 35%, #2563eb 50%, #1e40af 65%, #1e3a5f 100%)",
      }}
    >
      <div
        className="absolute left-0 top-0 h-full w-36 transform -skew-x-[20deg] -ml-5"
        style={{
          background: "linear-gradient(180deg, #092c71 0%, #2e51b1 100%)",
        }}
      ></div>
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0.1) 60%, transparent 100%)",
        }}
      ></div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right">
        <span
          className="text-[9px] text-white font-semibold italic tracking-wide"
          style={{
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  </div>
);
export const Signatories = ({ template }: { template: TemplateData }) => {
  const hasThumbmark = template.settings.requiresThumbmark;
  return (
    <div className="mt-8 flex items-end justify-between">
      <div className="flex-shrink-0">
        {hasThumbmark && (
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
        )}
      </div>
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
};
export const PaymentDetails = ({
  hasFee,
  hasCtn,
  fee,
  customData,
}: {
  hasFee: boolean;
  hasCtn?: boolean;
  fee?: number;
  customData?: Record<string, string>;
}) => {
  if (!hasFee && !hasCtn) return null;

  // Helper: resolve value from snake_case or UPPER_SNAKE key
  const resolveValue = (snakeKey: string, upperKey: string) => {
    if (customData?.[snakeKey])
      return { value: customData[snakeKey], isCustom: true };
    if (customData?.[upperKey])
      return { value: customData[upperKey], isCustom: true };
    return {
      value: getValue(upperKey, customData),
      isCustom: isCustomValue(upperKey, customData),
    };
  };

  return (
    <div className="mt-6 text-[10px] leading-[1.9] text-gray-800">
      {hasCtn && (
        <div className="flex">
          <span className="w-[120px] font-medium flex-shrink-0">
            Com. Tax No.
          </span>
          <span className="mr-1.5 flex-shrink-0">:</span>
          {(() => {
            const r = resolveValue("ctc_number", "COM_TAX_NO");
            return (
              <span
                className={`font-bold ${r.isCustom ? "text-green-600" : "text-blue-700"}`}
              >
                {r.value}
              </span>
            );
          })()}
        </div>
      )}
      <div className="flex">
        <span className="w-[120px] font-medium flex-shrink-0">
          Requested On
        </span>
        <span className="mr-1.5 flex-shrink-0">:</span>
        <span
          className={`font-bold ${isCustomValue("DATE_ISSUED", customData) ? "text-green-600" : "text-blue-700"}`}
        >
          {getValue("DATE_ISSUED", customData)}
        </span>
      </div>
      {hasFee && (
        <>
          <div className="flex">
            <span className="w-[120px] font-medium flex-shrink-0">
              PAID UNDER O.R. NO
            </span>
            <span className="mr-1.5 flex-shrink-0">:</span>
            {(() => {
              const r = resolveValue("or_number", "OR_NUMBER");
              return (
                <span
                  className={`font-bold ${r.isCustom ? "text-green-600" : "text-blue-700"}`}
                >
                  {r.value}
                </span>
              );
            })()}
          </div>
          <div className="flex">
            <span className="w-[120px] font-medium flex-shrink-0">Amount</span>
            <span className="mr-1.5 flex-shrink-0">:</span>
            <span className="font-bold text-green-700">
              ₱{(fee ?? 0).toFixed(2)}
            </span>
          </div>
        </>
      )}
      <div className="flex">
        <span className="w-[120px] font-medium flex-shrink-0">Valid Until</span>
        <span className="mr-1.5 flex-shrink-0">:</span>
        <span
          className={`font-bold ${isCustomValue("VALID_UNTIL", customData) ? "text-green-600" : "text-blue-700"}`}
        >
          {getValue("VALID_UNTIL", customData)}
        </span>
      </div>
    </div>
  );
};
