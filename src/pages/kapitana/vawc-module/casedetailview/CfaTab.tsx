import { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  FileTextIcon,
  FileType2Icon,
  Loader2Icon,
  SendIcon,
} from "lucide-react";
import {
  createReferral,
  getVawcCfa,
  type CaseViewDTO,
  type DisplayCFADTO,
} from "../../../../service/vawc-api/vawc-api";
import { ActionModal } from "../../../../hooks/SuccessModal";
import { downloadVawcCFAasWord } from "./CfaExport";
import { SectionCard } from "./shared";

const OTHERS_KEYWORDS = ["others", "iba pa", "specify", "other"];

function isMissingCfaError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("404") || normalized.includes("not found");
}

function isDuplicateCfaError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("duplicate key") ||
    normalized.includes("already exists") ||
    normalized.includes("pangkat_cfa") ||
    normalized.includes("ukjv056jwbwg15q0nbpcj2li2ch")
  );
}

function formatLetterDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildVictimSentence(
  displayCfa: DisplayCFADTO,
  caseData: CaseViewDTO,
): string {
  const age = caseData.age ? `, ${caseData.age} years old,` : ",";
  const address =
    displayCfa.complainantAddress ||
    caseData.completeAddress ||
    "address not available";
  return `This is to formally refer to your good office the case of ${displayCfa.complainantName}${age} residing at ${address}.`;
}

function buildIncidentSentence(
  displayCfa: DisplayCFADTO,
  caseData: CaseViewDTO,
): string {
  const respondent = displayCfa.respondentName || "the respondent";
  const relationship = caseData.relationshipToComplainant
    ? ` (${caseData.relationshipToComplainant})`
    : "";
  const nature = (
    displayCfa.matterFiled ||
    caseData.natureOfComplaint ||
    "VAWC incident"
  ).toLowerCase();
  const location = caseData.incidentLocation
    ? ` at ${caseData.incidentLocation}`
    : "";
  return `The victim reported an incident of ${nature} committed by ${respondent}${relationship}${location}.`;
}

function buildNarrativeBlock(
  displayCfa: DisplayCFADTO,
  caseData: CaseViewDTO,
): string {
  return caseData.narrative?.trim() || displayCfa.grounds.trim();
}

function getOfficerPosition(displayCfa: DisplayCFADTO): string {
  return displayCfa.assignOfficerPosition?.trim() || "VAWC Desk Officer";
}

function buildFallbackCfaDetails(
  caseData: CaseViewDTO,
  caseId: number,
  overrides?: Partial<DisplayCFADTO>,
): DisplayCFADTO {
  const complainantName =
    [caseData.firstName, caseData.middleName, caseData.lastName]
      .filter(Boolean)
      .join(" ") || "Complainant";
  const respondentName =
    [
      caseData.respondentFirstName,
      caseData.respondentMiddleName,
      caseData.respondentLastName,
    ]
      .filter(Boolean)
      .join(" ") || "Respondent";

  return {
    blotterNumber: caseData.caseNumber,
    matterFiled: caseData.natureOfComplaint || "VAWC Complaint",
    complainantName,
    complainantAddress: caseData.completeAddress || "Address not available",
    respondentName,
    respondentAddress: caseData.respondentAddress || "Address not available",
    grounds:
      caseData.caseStatusRemarks ||
      "Ang kasong ito ay sertipikado na para makapagdemanda batay sa kasalukuyang status ng case record.",
    controlNumber: `CFA-${caseData.caseNumber || caseId}`,
    issuedAt: caseData.dateFiled || new Date().toISOString(),
    assignOfficerName: caseData.assignOfficer || "Assigned Officer",
    assignOfficerPosition: "Assigned Officer",
    ...overrides,
  };
}

type CfaTabProps = {
  caseId: number;
  caseData: CaseViewDTO;
  isWithdrawn: boolean;
  canIssueReferral: boolean;
};

export function CfaTab({ caseId, caseData, isWithdrawn, canIssueReferral }: CfaTabProps) {
  const [cfaLoading, setCfaLoading] = useState(false);
  const [cfaDetails, setCfaDetails] = useState<DisplayCFADTO | null>(null);
  const [cfaError, setCfaError] = useState("");
  const [queuedCfaDetails, setQueuedCfaDetails] =
    useState<DisplayCFADTO | null>(null);
  const [queuedReferralMessage, setQueuedReferralMessage] = useState("");
  const [showReferralSuccessModal, setShowReferralSuccessModal] =
    useState(false);
  const [referralForm, setReferralForm] = useState({
    grounds: "",
    subjectOfLitigation: caseData.natureOfComplaint || "",
  });
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [referralMessage, setReferralMessage] = useState("");
  const isCertifiedToFileAction =
    (caseData.caseStatus || "").toUpperCase() === "CERTIFIED_TO_FILE_ACTION";
  const fallbackCertifiedCfa = isCertifiedToFileAction
    ? buildFallbackCfaDetails(caseData, caseId)
    : null;
  const displayCfa = cfaDetails ?? fallbackCertifiedCfa;
  const canEditSubject = OTHERS_KEYWORDS.some((keyword) =>
    (caseData.natureOfComplaint || "").toLowerCase().includes(keyword),
  );

  const canSubmit =
    referralForm.grounds.trim().length > 0 &&
    referralForm.subjectOfLitigation.trim().length > 0 &&
    !referralLoading;

  const wait = (ms: number) =>
    new Promise((resolve) => window.setTimeout(resolve, ms));

  const loadCfaDetails = async (
    showLoader = true,
  ): Promise<DisplayCFADTO | null> => {
    try {
      if (showLoader) setCfaLoading(true);
      setCfaError("");
      const data = await getVawcCfa(caseId);
      setCfaDetails(data);
      return data;
    } catch (err) {
      console.error("Failed to load CFA details:", err);
      setCfaDetails(null);
      const message =
        err instanceof Error ? err.message : "Failed to load CFA details.";
      if (isMissingCfaError(message)) {
        setCfaError("");
        return null;
      }
      setCfaError(message);
      return null;
    } finally {
      if (showLoader) setCfaLoading(false);
    }
  };

  const fetchIssuedCfaForDownload = async (): Promise<DisplayCFADTO | null> => {
    const retryDelays = [0, 500, 1000, 2000];

    for (const delay of retryDelays) {
      if (delay > 0) {
        await wait(delay);
      }

      const data = await loadCfaDetails(false);
      if (data) {
        return data;
      }
    }

    return null;
  };

  useEffect(() => {
    setReferralForm((current) => ({
      ...current,
      subjectOfLitigation:
        current.subjectOfLitigation || caseData.natureOfComplaint || "",
    }));
  }, [caseData.natureOfComplaint]);

  useEffect(() => {
    if (!isCertifiedToFileAction) {
      setCfaLoading(false);
      setCfaDetails(null);
      setCfaError("");
      return;
    }

    void loadCfaDetails(true);
  }, [caseId, caseData.caseStatus, isCertifiedToFileAction]);

  useEffect(() => {
    if (!isCertifiedToFileAction || cfaDetails || referralLoading) return;

    void fetchIssuedCfaForDownload();
  }, [isCertifiedToFileAction, cfaDetails, referralLoading]);

  const handleReferralFormChange = (
    field: "grounds" | "subjectOfLitigation",
    value: string,
  ) => {
    setReferralForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateReferral = async () => {
    if (!canIssueReferral) {
      setReferralError("You do not have permission to issue referral.");
      return;
    }

    if (
      !referralForm.grounds.trim() ||
      !referralForm.subjectOfLitigation.trim()
    ) {
      setReferralError("Complete the referral form before saving.");
      return;
    }

    const trimmedGrounds = referralForm.grounds.trim();
    const trimmedSubject = referralForm.subjectOfLitigation.trim();

    const referralPayload = {
      caseId,
      blotterNumber: caseData.caseNumber,
      grounds: trimmedGrounds,
      subjectOfLitigation: trimmedSubject,
      matterFiled: trimmedSubject,
    };

    try {
      setReferralLoading(true);
      setReferralError("");
      setReferralMessage("");

      const existingCfa = await loadCfaDetails(false);
      if (existingCfa) {
        setReferralMessage(
          `A referral already exists for Case No. ${caseData.caseNumber}. The existing document for the selected case has been loaded instead.`,
        );
        return;
      }

      await createReferral(referralPayload);
      const issuedCfa = await fetchIssuedCfaForDownload();
      const resolvedCfa =
        issuedCfa ??
        buildFallbackCfaDetails(caseData, caseId, {
          matterFiled: trimmedSubject,
          grounds: trimmedGrounds,
        });

      if (!issuedCfa) {
        setQueuedReferralMessage(
          "Referral created successfully. The saved referral document is still syncing, so a case-based Word copy is being downloaded.",
        );
      } else {
        setQueuedReferralMessage("Referral created successfully.");
      }

      setQueuedCfaDetails(resolvedCfa);
      setShowReferralSuccessModal(true);
      setReferralForm((current) => ({
        ...current,
        grounds: "",
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create referral.";

      if (isDuplicateCfaError(message)) {
        const existingCfa = await loadCfaDetails(false);

        if (existingCfa) {
          setReferralError("");
          setReferralMessage(
            `A referral already exists for Case No. ${caseData.caseNumber}. The existing document for the selected case has been loaded instead.`,
          );
          return;
        }

        setReferralError(
          `A referral already exists for Case No. ${caseData.caseNumber}. Please reload the existing document instead of issuing a new one.`,
        );
        return;
      }

      setReferralError(message);
    } finally {
      setReferralLoading(false);
    }
  };

  const letterDate = displayCfa ? formatLetterDate(displayCfa.issuedAt) : "";

  const handleCloseReferralSuccessModal = () => {
    setShowReferralSuccessModal(false);

    if (!queuedCfaDetails) {
      setQueuedReferralMessage("");
      return;
    }

    setCfaDetails(queuedCfaDetails);
    setReferralMessage(queuedReferralMessage);
    downloadVawcCFAasWord(queuedCfaDetails, caseData);
    setQueuedCfaDetails(null);
    setQueuedReferralMessage("");
  };

  return (
    <>
      <SectionCard
        title="Referral"
        icon={<FileTextIcon className="w-4 h-4 text-gray-400" />}
      >
        {cfaLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
            <Loader2Icon className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading referral details...</p>
          </div>
        ) : cfaError && !displayCfa ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <AlertCircleIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800">
                {isCertifiedToFileAction
                  ? "Referral has been issued, but the document could not be loaded."
                  : "Unable to load referral details"}
              </p>
              <p className="mt-1 text-xs text-gray-500">{cfaError}</p>
            </div>
            <button
              onClick={() => void loadCfaDetails(true)}
              className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              Retry
            </button>
          </div>
        ) : displayCfa ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-emerald-700">
                {fallbackCertifiedCfa && !cfaDetails ? (
                  <span className="text-xs font-medium">
                    Preview generated from case record
                  </span>
                ) : (
                  <span className="text-xs font-medium"></span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    void downloadVawcCFAasWord(displayCfa, caseData)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700"
                >
                  <FileType2Icon className="h-4 w-4 text-white" />
                  Download Word
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <div
                className="mx-auto max-w-3xl bg-white px-14 py-12 text-slate-900"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                <div className="text-center">
                  <p className="text-[13px] font-bold uppercase tracking-wide">
                    Republic of the Philippines
                  </p>
                  <h2 className="mt-1 text-[19px] font-bold">
                    Barangay VAWC Desk
                  </h2>
                  <p className="text-[12px] text-slate-700">Valenzuela City</p>
                  <p className="text-[12px] text-slate-500">
                    Province, Municipality
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-500" />

                <div className="mt-8 text-right text-[14px]">{letterDate}</div>

                <div className="mt-10 space-y-1 text-[14px] leading-7">
                  <p className="font-bold">MSWDO Head</p>
                  <p>Municipal Social Welfare and Development Officer</p>
                  <p>Municipality Hall, Brgy. Poblacion</p>
                </div>

                <div className="mt-10 text-[14px] font-bold uppercase leading-7">
                  Subject: Referral: VAWC Case No. {displayCfa.blotterNumber}
                </div>

                <div className="mt-10 space-y-6 text-[14px] leading-8 text-slate-800">
                  <p>Dear Sir/Madam,</p>
                  <p>{buildVictimSentence(displayCfa, caseData)}</p>
                  <p>{buildIncidentSentence(displayCfa, caseData)}</p>
                  <div>
                    <p className="mb-1">Brief description of the incident:</p>
                    <p className="whitespace-pre-wrap">
                      {buildNarrativeBlock(displayCfa, caseData)}
                    </p>
                  </div>
                  <p>
                    We are referring this case for appropriate counseling,
                    psychological support, and further intervention as deemed
                    necessary by your office.
                  </p>
                </div>

                <div className="mt-20 text-[14px] leading-7">
                  <p>Very truly yours,</p>
                  <div className="mt-12">
                    <p className="font-bold uppercase">
                      Officer {displayCfa.assignOfficerName}
                    </p>
                    <p>{getOfficerPosition(displayCfa)}</p>
                    <p>Barangay VAWC Desk</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : isWithdrawn ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-8 text-sm text-gray-600">
            This case is withdrawn and referral issuance is no longer available.
          </div>
        ) : !canIssueReferral ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-8 text-sm text-gray-600">
            You do not have permission to issue referral.
          </div>
        ) : isCertifiedToFileAction ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-8 text-sm text-blue-900">
              <p className="font-semibold">
                This case is already marked as Certified To File Action.
              </p>
              <p className="mt-2 text-blue-800">
                The CFA document is being loaded from the saved case record. If
                it does not appear yet, retry loading the document below.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => void loadCfaDetails(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  <FileTextIcon className="h-4 w-4" />
                  Reload Referral
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-gray-100 px-6 py-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50">
                  <FileTextIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Issue Referral
                  </h3>
                  <p className="text-xs text-gray-500">
                    Case No. {caseData.caseNumber}
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Subject of Litigation{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  {canEditSubject ? (
                    <input
                      type="text"
                      value={referralForm.subjectOfLitigation}
                      onChange={(event) =>
                        handleReferralFormChange(
                          "subjectOfLitigation",
                          event.target.value,
                        )
                      }
                      placeholder="hal. Psychological Violence"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-800">
                      {referralForm.subjectOfLitigation ||
                        caseData.natureOfComplaint ||
                        "—"}
                    </div>
                  )}
                  {!canEditSubject && (
                    <p className="text-xs text-gray-400">
                      This field can only be edited when the complaint nature is
                      marked as Others.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Grounds <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={referralForm.grounds}
                    onChange={(event) =>
                      handleReferralFormChange("grounds", event.target.value)
                    }
                    rows={5}
                    placeholder=""
                    className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm leading-relaxed text-gray-900 placeholder-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400">
                   Please put a reason here...
                  </p>
                </div>

                {referralError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{referralError}</p>
                  </div>
                )}

                {referralMessage && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                    {referralMessage}
                  </div>
                )}

                <div className="flex justify-end border-t border-gray-100 pt-1">
                  <button
                    onClick={handleCreateReferral}
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {referralLoading ? (
                      <>
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                        Nagse-save...
                      </>
                    ) : (
                      <>
                        <SendIcon className="h-4 w-4" />
                        Mag-issue ng Referral
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <ActionModal
        isOpen={showReferralSuccessModal}
        onClose={handleCloseReferralSuccessModal}
        title="Referral Issued"
        type="success"
      >
        {queuedReferralMessage ||
          "The referral has been issued successfully. The document preview will open after you close this message."}
      </ActionModal>
    </>
  );
}
