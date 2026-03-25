import { useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon, AlertCircleIcon } from "lucide-react";
import {
  type MediationProcessDTO,
  type HearingViewDTO,
  type CaseNoteViewDTO,
  type HearingFullDetailsDTO,
} from "../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2";
import { type LuponViewDTO } from "../lupong-tagapamayapa-api/Lupong-tagapamayapa-view-api";
import {
  getMediationProcess,
  getHearingView,
  getCaseNotes,
  updateCaseStatus,
  getHearingFullDetails,
} from "../lupong-tagapamayapa-api/LuponCaseManagement-view-api-v2";
import { getLuponCaseView } from "../lupong-tagapamayapa-api/Lupong-tagapamayapa-view-api";
import { extendCasePeriod } from "../lupong-tagapamayapa-api/LuponCaseManagement-api";
import { getMyAccess } from "../lupong-tagapamayapa-api/LuponCasePermission";
import { OverviewTab } from "./tabs/OverviewTab";
import { HearingsTab } from "./tabs/HearingTab";
import { NotesTab } from "./tabs/NotesTab";
import { TimelineTab } from "./tabs/TimeLineTab";
import { ConfirmModal } from "./modal/ConfirmModal";
import { ExtendMediationModal } from "./modal/ExtendMediationModal";
import { ScheduleHearingModal } from "./modal/ScheduleHearingModal";
import { ChangeStatusModal } from "./modal/ChangeStatusModal";
import { HearingViewModal } from "./modal/HearingViewModal";
import { FollowUpModal } from "./modal/FollowUpModal";
import { RecordMinutesModal } from "./modal/RecordMinutesModal";
interface Props {
  blotterNumber: string;
  onBack: () => void;
}
type TabKey = "overview" | "hearings" | "notes" | "timeline";
type ModalKey =
  | "settle"
  | "dismiss"
  | "issueCFA"
  | "extendMediation"
  | "schedule"
  | "changeStatus"
  | "recordMinutes"
  | "viewMinutes"
  | "addFollowUp"
  | null;
const HEARING_PERMISSION = "Manage Hearings & Mediation";
const STATUS_PERMISSION = "Update Case Status";
export function LuponCaseDetailView({ blotterNumber, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [luponData, setLuponData] = useState<LuponViewDTO | null>(null);
  const [mediation, setMediation] = useState<MediationProcessDTO | null>(null);
  const [hearings, setHearings] = useState<HearingViewDTO[]>([]);
  const [notes, setNotes] = useState<CaseNoteViewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [hearingsLoading, setHearingsLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKey>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasHearingPerm, setHasHearingPerm] = useState(false);
  const [hasStatusPerm, setHasStatusPerm] = useState(false);
  // New state for hearing detail modals
  const [selectedHearing, setSelectedHearing] = useState<HearingViewDTO | null>(
    null,
  );
  const [fullHearing, setFullHearing] = useState<HearingFullDetailsDTO | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  useEffect(() => {
    getMyAccess()
      .then((access) => {
        setHasHearingPerm(access.permissions.includes(HEARING_PERMISSION));
        setHasStatusPerm(access.permissions.includes(STATUS_PERMISSION));
      })
      .catch(() => {
        setHasHearingPerm(false);
        setHasStatusPerm(false);
      });
  }, []);
  const refreshData = async () => {
    try {
      const [d, m, h] = await Promise.all([
        getLuponCaseView(blotterNumber),
        getMediationProcess(blotterNumber),
        getHearingView(blotterNumber),
      ]);
      setLuponData(d);
      setMediation(m);
      setHearings(h);
    } catch (err) {
      console.error(err);
    }
  };
  const handleUpdateStatus = async (
    statusToSend: string,
    reasonToSend: string,
  ) => {
    if (!statusToSend || !reasonToSend?.trim()) {
      alert("Status and reason are required.");
      return;
    }
    setActionLoading(true);
    try {
      await updateCaseStatus({
        blotterNumber,
        newStatus: statusToSend,
        reason: reasonToSend,
      });
      setModal(null);
      await refreshData();
    } catch (err: any) {
      alert(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };
  const handleChangeStatus = async (newStatus: string, reason: string) => {
    setActionLoading(true);
    try {
      await updateCaseStatus({
        blotterNumber,
        newStatus,
        reason,
      });
      setModal(null);
      await refreshData();
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };
  const handleExtendMediation = async (reason: string) => {
    setActionLoading(true);
    try {
      if (!luponData?.id) throw new Error("Missing case ID");
      await extendCasePeriod(luponData.id, { reason });
      setModal(null);
      await refreshData();
    } catch (err: any) {
      alert(err.message || "Failed to extend mediation.");
    } finally {
      setActionLoading(false);
    }
  };
  // Open hearing details (view minutes)
  const handleViewMinutes = async (h: HearingViewDTO) => {
    setSelectedHearing(h);
    setDetailsLoading(true);
    try {
      const details = await getHearingFullDetails(h.hearingId);
      setFullHearing(details);
      setModal("viewMinutes");
    } catch (err) {
      console.error(err);
      alert("Failed to load hearing details.");
    } finally {
      setDetailsLoading(false);
    }
  };
  // Open record minutes
  const handleRecordMinutes = (h: HearingViewDTO) => {
    setSelectedHearing(h);
    setModal("recordMinutes");
  };
  // Open follow-up
  const handleAddFollowUp = (h: HearingViewDTO) => {
    setSelectedHearing(h);
    setModal("addFollowUp");
  };
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [d, m] = await Promise.all([
          getLuponCaseView(blotterNumber),
          getMediationProcess(blotterNumber),
        ]);
        setLuponData(d);
        setMediation(m);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load case details.",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [blotterNumber]);
  useEffect(() => {
    if (activeTab !== "hearings" && activeTab !== "timeline") return;
    setHearingsLoading(true);
    getHearingView(blotterNumber)
      .then(setHearings)
      .catch(console.error)
      .finally(() => setHearingsLoading(false));
  }, [activeTab, blotterNumber]);
  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      setNotes(await getCaseNotes(blotterNumber));
    } catch (err) {
      console.error(err);
    } finally {
      setNotesLoading(false);
    }
  }, [blotterNumber]);
  useEffect(() => {
    if (activeTab !== "notes" && activeTab !== "timeline") return;
    loadNotes();
  }, [activeTab, loadNotes]);
  // Derived values
  const complainantName = luponData
    ? `${luponData.complainant.firstName} ${luponData.complainant.lastName}`
    : "";
  const respondentName = luponData
    ? `${luponData.respondent.firstName} ${luponData.respondent.lastName}`
    : "";
  const natureOfComplaint = luponData?.incidentDetail.natureOfComplaint ?? "";
  const tabDefs: {
    key: TabKey;
    label: string;
    count?: number;
  }[] = [
    {
      key: "overview",
      label: "Overview",
    },
    {
      key: "hearings",
      label: "Hearings",
      count: hearings.length,
    },
    {
      key: "notes",
      label: "Case Notes",
      count: notes.length,
    },
    {
      key: "timeline",
      label: "Timeline",
    },
  ];
  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (error || !luponData)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircleIcon className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-500">{error ?? "Case not found."}</p>
        <button
          onClick={onBack}
          className="text-sm text-blue-500 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* --- LOADING OVERLAY --- */}
        {detailsLoading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[90] backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg px-6 py-4 flex items-center gap-3">
              <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-700">
                Loading hearing details...
              </span>
            </div>
          </div>
        )}

        {/* --- MODALS --- */}
        {modal === "settle" && (
          <ConfirmModal
            title="Mark as Settled"
            description="Are you sure you want to mark this case as settled? This will close the case."
            confirmLabel="Mark as Settled"
            confirmClass="bg-emerald-600 hover:bg-emerald-700"
            loading={actionLoading}
            reasonLabel="Settlement Details *"
            reasonPlaceholder="Describe the terms of the settlement..."
            onConfirm={(reason) => handleUpdateStatus("SETTLED", reason)}
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "dismiss" && (
          <ConfirmModal
            title="Dismiss Case"
            description="Are you sure you want to dismiss this case?"
            confirmLabel="Dismiss Case"
            confirmClass="bg-gray-600 hover:bg-gray-700"
            loading={actionLoading}
            reasonLabel="Reason for Dismissal *"
            reasonPlaceholder="Provide the reason for dismissal..."
            onConfirm={(reason) => handleUpdateStatus("DISMISSED", reason)}
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "issueCFA" && (
          <ConfirmModal
            title="Issue CFA"
            description="Conciliation failed. Issue Certificate to File Action?"
            confirmLabel="Issue CFA"
            confirmClass="bg-amber-600 hover:bg-amber-700"
            loading={actionLoading}
            reasonLabel="Grounds for Certification *"
            reasonPlaceholder="State the grounds for issuing CFA..."
            onConfirm={(reason) =>
              handleUpdateStatus("CERTIFIED_TO_FILE_ACTION", reason)
            }
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "extendMediation" && (
          <ExtendMediationModal
            currentDeadline={luponData.mediationInfo.luponDeadline}
            loading={actionLoading}
            onConfirm={handleExtendMediation}
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "schedule" && (
          <ScheduleHearingModal
            blotterNumber={blotterNumber}
            hearingNumber={hearings.length + 1}
            caseNumber={blotterNumber}
            natureOfComplaint={natureOfComplaint}
            complainantName={complainantName}
            respondentName={respondentName}
            onSuccess={async () => {
              setModal(null);
              await refreshData();
            }}
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "changeStatus" && (
          <ChangeStatusModal
            currentStatus={luponData.caseStatus}
            loading={actionLoading}
            hasPermission={hasStatusPerm}
            onConfirm={handleChangeStatus}
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "viewMinutes" && fullHearing && (
          <HearingViewModal
            hearing={fullHearing}
            onClose={() => {
              setModal(null);
              setFullHearing(null);
              setSelectedHearing(null);
            }}
          />
        )}

        {modal === "recordMinutes" && selectedHearing && (
          <RecordMinutesModal
            hearing={selectedHearing}
            caseNumber={blotterNumber}
            natureOfComplaint={natureOfComplaint}
            complainantName={complainantName}
            respondentName={respondentName}
            onSuccess={async () => {
              setModal(null);
              setSelectedHearing(null);
              await refreshData();
            }}
            onCancel={() => {
              setModal(null);
              setSelectedHearing(null);
            }}
          />
        )}

        {modal === "addFollowUp" && selectedHearing && (
          <FollowUpModal
            hearingId={selectedHearing.hearingId}
            caseNumber={blotterNumber}
            hasPermission={hasHearingPerm}
            onSuccess={async () => {
              await refreshData();
            }}
            onClose={() => {
              setModal(null);
              setSelectedHearing(null);
            }}
          />
        )}

        {/* --- HEADER --- */}
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to Docket
          </button>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {luponData.blotterNumber}
            </h1>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
              LUPON CASE
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {complainantName} • {natureOfComplaint}
          </p>
        </div>

        {/* --- TABS --- */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabDefs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.key ? "border-blue-600 text-blue-600 bg-white rounded-t-lg" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.key ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <OverviewTab
            luponData={luponData}
            mediation={mediation}
            hasStatusPerm={hasStatusPerm}
            onScheduleHearing={() => setModal("schedule")}
            onMarkSettled={() => setModal("settle")}
            onDismissCase={() => setModal("dismiss")}
            onIssueCFA={() => setModal("issueCFA")}
            onExtendMediation={() => setModal("extendMediation")}
          />
        )}

        {activeTab === "hearings" && (
          <HearingsTab
            hearings={hearings}
            hearingsLoading={hearingsLoading}
            caseStatus={luponData.caseStatus}
            hasPermission={hasHearingPerm}
            blotterNumber={blotterNumber}
            caseNumber={blotterNumber}
            natureOfComplaint={natureOfComplaint}
            complainantName={complainantName}
            respondentName={respondentName}
            onScheduleHearing={() => setModal("schedule")}
            onRecordMinutes={handleRecordMinutes}
            onViewMinutes={handleViewMinutes}
            onAddFollowUp={handleAddFollowUp}
          />
        )}

        {activeTab === "notes" && (
          <NotesTab
            notes={notes}
            notesLoading={notesLoading}
            blotterNumber={blotterNumber}
            caseStatus={luponData.caseStatus}
            onNoteAdded={loadNotes}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineTab
            blotterNumber={blotterNumber}
          />
        )}
      </div>
    </div>
  );
}
