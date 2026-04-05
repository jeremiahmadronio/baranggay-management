import { useState, useEffect } from "react";
import {
  FileTextIcon,
  SendIcon,
  Loader2Icon,
  AlertCircleIcon,
  FileType2Icon,
  ClipboardListIcon,
} from "lucide-react";
import {downloadCFAasWord } from "../lib/CfaExport";
import {
  getCfaDetails,
  issueCFA,
  type CFAResponse,
} from "../../lupong-tagapamayapa-api/CFA";

const TAGALOG_MONTHS = [
  "ENERO",
  "PEBRERO",
  "MARSO",
  "ABRIL",
  "MAYO",
  "HUNYO",
  "HULYO",
  "AGOSTO",
  "SETYEMBRE",
  "OKTUBRE",
  "NOBYEMBRE",
  "DISYEMBRE",
];

function formatCFADate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate(),
    month: TAGALOG_MONTHS[d.getMonth()],
    year: d.getFullYear(),
  };
}

const OTHERS_KEYWORDS = ["others", "iba pa", "specify", "ibang usapin"];
const isOthers = (v: string) =>
  OTHERS_KEYWORDS.some((k) => v.toLowerCase().includes(k));

function CFADocument({ data }: { data: CFAResponse }) {
  const date = formatCFADate(data.issuedAt);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-700 rounded-lg px-3 py-2">
          <span className="text-xs font-medium"></span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCFAasWord(data)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
          >
            <FileType2Icon className="w-3.5 h-3.5 text-blue-500" />
            Word
          </button>
        </div>
      </div>

      {/* Document preview */}
      <div
        id="cfa-printable"
        className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
      >
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Preview ng Dokumento
          </span>
          <span className="text-xs text-gray-400">
            I-download para sa opisyal na kopya
          </span>
        </div>

        <div
          className="p-10 max-w-2xl mx-auto relative"
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
              style={{ opacity: 0.06 }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          <div className="relative" style={{ zIndex: 1 }}>
            {/* Letterhead */}
            <div className="text-center pb-4 mb-6 border-b-2 border-gray-900">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                Tanggapan ng Sangguniang Barangay
              </p>
              <h1
                className="text-2xl font-black uppercase tracking-widest text-gray-900"
                style={{ letterSpacing: "0.15em" }}
              >
                Barangay Ugong
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Valenzuela City, Metro Manila
              </p>
            </div>

            {/* Case info */}
            <div className="text-right mb-8 text-sm leading-relaxed">
              <p>
                <span className="font-bold">Usaping Barangay Blg:</span>{" "}
                {data.controlNumber}
              </p>
              <p>
                <span className="font-bold">Usaping Inihain:</span>{" "}
                <span className="uppercase">{data.matterFiled}</span>
              </p>
            </div>

            {/* Parties */}
            <div className="mb-8 space-y-4 text-sm">
              <div>
                <p className="font-black uppercase underline tracking-wide">
                  {data.complinantName}
                </p>
                <p className="uppercase underline">{data.complinantAddress}</p>
                <p className="italic text-gray-600">(Mga) May Sumbong</p>
              </div>
              <p className="text-sm text-gray-700">Laban kay/kina:</p>
              <div>
                <p className="font-black uppercase underline tracking-wide">
                  {data.respondentName}
                </p>
                <p className="uppercase underline">{data.respondentAddress}</p>
                <p className="italic text-gray-600">(Mga) Ipinagsumbong</p>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-8">
              <h2 className="text-base font-black uppercase tracking-widest">
                Katibayan Para Makapagdemanda
              </h2>
              <p className="text-sm text-gray-600 font-semibold">
                (Certificate to File Action)
              </p>
            </div>

            {/* Body */}
            <div className="mb-8 text-sm">
              <p className="font-bold mb-3">Pinatunayan na:</p>
              <ol
                className="space-y-3 leading-relaxed"
                style={{ listStyleType: "decimal", paddingLeft: "1.5rem" }}
              >
                <li>
                  Dumalo ang magkabilang panig sa Punong Barangay at nagbigay ng
                  kanya kanyang salaysay ngunit walang naganap na pagkakasundo.
                </li>
                <li style={{ whiteSpace: "pre-wrap" }}>{data.grounds}</li>
                <li>
                  Dahil dito, ang kaukulang demanda para sa usaping ito ay
                  maaari nang idulog sa hukuman o alin mang mataas na tanggapan
                  ng pamahalaan.
                </li>
              </ol>
            </div>

            {/* Date */}
            <div className="mb-12 text-sm">
              <p>
                Ngayong{" "}
                <span className="font-bold underline">Ika – {date.day}</span> ng{" "}
                <span className="font-bold underline"> {date.month} </span>{" "}
                taong <span className="font-bold underline"> {date.year}</span>
              </p>
            </div>

            {/* Secretary */}
            <div className="flex justify-end mb-10 text-sm">
              <div className="text-center">
                <p className="font-black uppercase tracking-wide">
                  {data.luponSecretary}
                </p>
                <div className="border-t border-gray-900 pt-1 mt-1">
                  <p className="text-gray-600">{data.secretaryPosition}</p>
                </div>
              </div>
            </div>

            {/* Signatories */}
            <p className="text-sm mb-1 font-semibold">Pinatunayan:</p>
            <div className="flex justify-between text-sm mt-8">
              <div className="text-center w-48">
                <p className="font-black uppercase tracking-wide text-sm">
                  {data.luponChairman}
                </p>
                <div className="border-t border-gray-900 pt-1 mt-1">
                  <p className="text-gray-600 text-xs">
                    {data.chairmanPosition}
                  </p>
                </div>
              </div>
              <div className="text-center w-48">
                <p className="font-black uppercase tracking-wide text-sm">
                  {data.luponMember}
                </p>
                <div className="border-t border-gray-900 pt-1 mt-1">
                  <p className="text-gray-600 text-xs">{data.memberPosition}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      {/* Notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
        <ClipboardListIcon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Walang naka-issue na CFA
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Punan ang form sa ibaba para mag-issue ng Certificate to File Action
            para sa blotter na ito.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
            <FileTextIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Issue ng Certificate to File Action
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
                Usaping Inihain <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={matterFiled}
                onChange={(e) => onMatterFiledChange(e.target.value)}
                placeholder="hal. Pagpapaalis sa Bahay na Paupahan"
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Usaping Inihain
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
              rows={5}
              placeholder="hal. Dumalo ang may sumbong sa Lupong Tagapamayapa ngunit hindi dumalo ang ipinagsumbong kaya't walang naganap na pagkakasundo..."
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y leading-relaxed"
            />
            <p className="text-xs text-gray-400">
              Ilagay ang dahilan kung bakit hindi nagkaroon ng pagkakasundo.
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
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  Nagse-save...
                </>
              ) : (
                <>
                  <SendIcon className="w-4 h-4" />
                  Mag-issue ng CFA
                </>
              )}
            </button>
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

  const fetchCFA = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setFetchError(null);
    try {
      // getCfaDetails now returns null (not throws) when there's no CFA yet
      const data = await getCfaDetails(luponData.blotterNumber);
      setCfaData(data);
    } catch (e: any) {
      console.error("[CFATab] getCfaDetails error:", e);
      setFetchError(e?.message ?? "Hindi ma-load ang CFA data. Subukan ulit.");
      setCfaData(null);
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
      await issueCFA({
        blotterNumber: luponData.blotterNumber,
        grounds,
        matterFiled,
      });
      await new Promise((r) => setTimeout(r, 300));
      await fetchCFA(false);
    } catch (e: any) {
      console.error("[CFATab] issueCFA error:", e);
      setSubmitError(e?.message ?? "Hindi na-issue ang CFA. Subukan ulit.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
        <Loader2Icon className="w-6 h-6 animate-spin" />
        <p className="text-sm">Kinukuha ang CFA data…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircleIcon className="w-5 h-5 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">
            Hindi ma-load ang CFA
          </p>
          <p className="text-xs text-gray-500 mt-1">{fetchError}</p>
        </div>
        <button
          onClick={() => fetchCFA(true)}
          className="text-xs text-blue-600 hover:underline mt-1"
        >
          Subukan ulit
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
