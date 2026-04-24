import { useState, useEffect } from "react";
import {
  FileTextIcon,
  SendIcon,
  AlertCircleIcon,
  FileType2Icon,
} from "lucide-react";
import { CircleLoader, CenteredLoader } from "../../../../hooks/LoadingStates";
import { downloadCFAasWord } from "../lib/CfaExport";
import {
  getCfaDetails,
  issueCFA,
  type CFAResponse,
} from "../../../../service/lupon-api/CFA";
import { useKapitanaMockData } from "../../mock/kapitana-mock-flag";
import { mockCfaDetails } from "../../mock/lupon-kapitana-mock";

function formatFilipinoIssueLine(value?: string | Date) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "—";

  const month = d
    .toLocaleDateString("en-US", {
      month: "long",
    })
    .toUpperCase();

  return `Ika - ${d.getDate()} ng ${month} taong ${d.getFullYear()}`;
}

const OTHERS_KEYWORDS = ["others", "iba pa", "specify", "ibang usapin"];
const isOthers = (v: string) =>
  OTHERS_KEYWORDS.some((k) => v.toLowerCase().includes(k));

function CFAPaper({
  caseNumber,
  matterFiled,
  complainantName,
  complainantAddress,
  respondentName,
  respondentAddress,
  grounds,
  issuedLine,
  secretaryName,
  secretaryPosition,
  chairmanName,
  chairmanPosition,
  memberName,
  memberPosition,
}: {
  caseNumber: string;
  matterFiled: string;
  complainantName: string;
  complainantAddress: string;
  respondentName: string;
  respondentAddress: string;
  grounds: string;
  issuedLine: string;
  secretaryName: string;
  secretaryPosition: string;
  chairmanName: string;
  chairmanPosition: string;
  memberName: string;
  memberPosition: string;
}) {
  return (
    <div
      className="p-7 sm:p-10 max-w-[920px] mx-auto relative text-[14px] leading-[1.8] text-gray-900"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ zIndex: 0 }}
      >
        <img
          src="/images/brgy-ugong-seal.png"
          alt=""
          className="w-64 h-64 object-contain"
          style={{ opacity: 0.05 }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <div className="text-center border-b border-gray-700 pb-5 mb-8">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
            Republic of the Philippines
          </p>
          <h2 className="text-[29px] font-black uppercase tracking-[0.12em] text-gray-900 leading-none mt-2">
            Barangay Ugong
          </h2>
          <p className="text-[11px] uppercase tracking-[0.1em] text-gray-600 mt-1.5">
            Valenzuela City
          </p>
          <p className="text-[12px] text-gray-600 mt-2">Lupong Tagapamayapa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-x-12 gap-y-8 mb-10 items-start">
          <div className="space-y-7">
            <div>
              <p className="font-bold uppercase underline tracking-wide leading-7">
                {complainantName || "—"}
              </p>
              <p className="uppercase leading-7">{complainantAddress || "—"}</p>
              <p className="italic text-gray-700 mt-1">(Mga/May Sumbong)</p>
            </div>

            <div>
              <p className="font-bold uppercase underline tracking-wide leading-7">
                {respondentName || "—"}
              </p>
              <p className="uppercase leading-7">{respondentAddress || "—"}</p>
              <p className="italic text-gray-700 mt-1">(Mga Ipinagsusumbong)</p>
            </div>
          </div>

          <div className="w-full md:w-[340px] md:justify-self-end text-left space-y-5 md:pt-1">
            <p>
              <span className="font-bold">Barangay Case No.:</span>
              <br />
              <span className="font-semibold break-words">
                {caseNumber || "—"}
              </span>
            </p>
            <p>
              <span className="font-bold">Nature of Case:</span>
              <br />
              <span className="uppercase break-words">
                {matterFiled || "—"}
              </span>
            </p>
          </div>
        </div>

        <div className="text-center mb-8">
          <h3 className="text-[22px] font-black uppercase tracking-[0.07em] leading-tight">
            Katibayan Para Makapagdemanda
          </h3>
          <p className="text-[15px] uppercase tracking-[0.02em] mt-1.5">
            (Certificate to File Action)
          </p>
        </div>

        <div className="space-y-3.5 mb-12 text-justify">
          <p className="font-semibold">Pinatutunayan na:</p>
          <ol className="list-decimal pl-7 space-y-2.5 leading-8">
            <li>
              Dumalo ang magkabilang panig sa Punong Barangay at nabigyan ng
              pagkakataong magkasundo ngunit walang naganap na pagkakasundo.
            </li>
            <li style={{ whiteSpace: "pre-wrap" }}>{grounds}</li>
            <li>
              Dahil dito, ang kakulangang demanda sa usaping ito ay maaari nang
              idulog sa hukuman o alin mang matataas na tanggapan ng pamahalaan.
            </li>
          </ol>
        </div>

        <div className="mb-14">
          <p>
            Ngayong <span className="font-bold underline">{issuedLine}</span>
          </p>
        </div>

        <div className="flex justify-end mb-14">
          <div className="text-center w-[290px]">
            <div className="h-11" />
            <p className="font-bold uppercase tracking-wide">
              {secretaryName || "—"}
            </p>
            <div className="border-t border-gray-800 pt-1 mt-1">
              <p>{secretaryPosition || "Kalihim ng Pangkat"}</p>
            </div>
          </div>
        </div>

        <p className="mb-3">Pinatunayan:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          <div className="flex justify-center">
            <div className="w-[300px] text-center">
              <div className="h-11" />
              <p className="font-bold uppercase tracking-wide">
                {chairmanName || "—"}
              </p>
              <div className="border-t border-gray-800 pt-1 mt-1">
                <p>{chairmanPosition || "Taga-Pangulo ng Pangkat"}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-[300px] text-center">
              <div className="h-11" />
              <p className="font-bold uppercase tracking-wide">
                {memberName || "—"}
              </p>
              <div className="border-t border-gray-800 pt-1 mt-1">
                <p>{memberPosition || "Lupon Member"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CFADocument({ data }: { data: CFAResponse }) {
  const issuedLine = formatFilipinoIssueLine(data.issuedAt);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-3 rounded-xl  bg-blue-50/60 px-4 py-3">
        <button
          onClick={() => downloadCFAasWord(data)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-colors shadow-sm"
        >
          <FileType2Icon className="w-4 h-4" />
          Download Word
        </button>
      </div>

      <div
        id="cfa-printable"
        className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
      >
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Document Issued
          </span>
        </div>

        <CFAPaper
          caseNumber={data.controlNumber || "—"}
          matterFiled={data.matterFiled || "—"}
          complainantName={data.complinantName || "—"}
          complainantAddress={data.complinantAddress || "—"}
          respondentName={data.respondentName || "—"}
          respondentAddress={data.respondentAddress || "—"}
          grounds={
            data.grounds ||
            "Dumalo ang mga panig sa Lupong Tagapamayapa ngunit hindi dumalo ang ipinagsusumbong kaya't walang naganap na pagkakasundo."
          }
          issuedLine={issuedLine}
          secretaryName={data.luponSecretary || "—"}
          secretaryPosition={data.secretaryPosition || "Kalihim ng Pangkat"}
          chairmanName={data.luponChairman || "—"}
          chairmanPosition={data.chairmanPosition || "Taga-Pangulo ng Pangkat"}
          memberName={data.luponMember || "—"}
          memberPosition={data.memberPosition || "Lupon Member"}
        />
      </div>
    </div>
  );
}

// ─── CFAForm ──────────────────────────────────────────────────────────────────

function CFAForm({
  luponData,
  grounds,
  matterFiled,
  onGroundsChange,
  onMatterFiledChange,
  onSubmit,
  submitting,
  error,
}: {
  luponData: any;
  grounds: string;
  matterFiled: string;
  onGroundsChange: (v: string) => void;
  onMatterFiledChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const rawNature: string = luponData?.incidentDetail?.natureOfComplaint ?? "";
  const showMatterInput = isOthers(rawNature);
  const canSubmit =
    grounds.trim().length > 0 && matterFiled.trim().length > 0 && !submitting;

  return (
    <div className="space-y-5">
      <div className="w-full max-w-4xl mx-auto">
        {/* Form card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
              <FileTextIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Issue Certificate to File Action
              </h3>
              <p className="text-xs text-gray-500">
                Blotter No. {luponData?.blotterNumber}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Matter filed */}
            {showMatterInput ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nature of Case <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={matterFiled}
                  onChange={(e) => onMatterFiledChange(e.target.value)}
                  placeholder="e.g. Unlawful Detainer / Rental Dispute"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nature of Case
                </p>
                <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-800 font-medium">
                    {rawNature || "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Grounds */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Grounds <span className="text-red-500">*</span>
              </label>
              <textarea
                value={grounds}
                onChange={(e) => onGroundsChange(e.target.value)}
                rows={6}
                placeholder="State the grounds for issuance (e.g. conciliation failed, non-appearance, no settlement reached)."
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y leading-relaxed"
              />
              <p className="text-xs text-gray-500">
                Ilalagay ito sa item #2 ng sertipiko (main grounds / dahilan ng
                pag-isyu).
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircleIcon className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Divider + submit */}
            <div className="pt-1 border-t border-gray-100 flex justify-end">
              <button
                onClick={onSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {submitting ? (
                  <>
                    <CircleLoader size="sm" tone="light" className="w-4 h-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SendIcon className="w-4 h-4" />
                    Issue CFA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CFATab ───────────────────────────────────────────────────────────────────

export function CFATab({ luponData }: { luponData: any }) {
  const [cfaData, setCfaData] = useState<CFAResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const rawNature: string = luponData?.incidentDetail?.natureOfComplaint ?? "";
  const [grounds, setGrounds] = useState("");
  const [matterFiled, setMatterFiled] = useState(
    isOthers(rawNature) ? "" : rawNature,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isNoCfaYetError = (err: unknown) => {
    const message = String((err as any)?.message ?? "").toLowerCase();
    return (
      message.includes("404") ||
      message.includes("not found") ||
      message.includes("no cfa") ||
      message.includes("walang") ||
      // backend currently returns plain 500 for some no-record states
      message.includes("http error! status: 500")
    );
  };

  const fetchCFA = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setFetchError(null);
    try {
      if (useKapitanaMockData()) {
        setCfaData(mockCfaDetails(luponData.blotterNumber));
        return;
      }
      const data = await getCfaDetails(luponData.blotterNumber);
      setCfaData(data);
    } catch (e: any) {
      console.error("[CFATab] getCfaDetails error:", e);
      if (isNoCfaYetError(e)) {
        // fallback to issuance form instead of blocking page with error state
        setCfaData(null);
        setFetchError(null);
      } else {
        setFetchError(
          e?.message ?? "Unable to load CFA data. Please try again.",
        );
        setCfaData(null);
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCFA(true);
  }, [luponData.blotterNumber]);

  const handleIssue = async () => {
    if (!grounds.trim() || !matterFiled.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!useKapitanaMockData()) {
        await issueCFA({
          blotterNumber: luponData.blotterNumber,
          grounds,
          matterFiled,
        });
      }
      await new Promise((r) => setTimeout(r, 300));
      await fetchCFA(false);
    } catch (e: any) {
      console.error("[CFATab] issueCFA error:", e);
      setSubmitError(e?.message ?? "Failed to issue CFA. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return <CenteredLoader minHeight="min-h-[220px]" />;
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircleIcon className="w-5 h-5 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">
            Unable to load CFA
          </p>
          <p className="text-xs text-gray-500 mt-1">{fetchError}</p>
        </div>
        <button
          onClick={() => fetchCFA(true)}
          className="text-xs text-blue-600 hover:underline mt-1"
        >
          Try again
        </button>
      </div>
    );
  }

  if (cfaData) return <CFADocument data={cfaData} />;

  return (
    <CFAForm
      luponData={luponData}
      grounds={grounds}
      matterFiled={matterFiled}
      onGroundsChange={setGrounds}
      onMatterFiledChange={setMatterFiled}
      onSubmit={handleIssue}
      submitting={submitting}
      error={submitError}
    />
  );
}
