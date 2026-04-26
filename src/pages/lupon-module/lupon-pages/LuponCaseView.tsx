import { CFATab } from "../tabs/CFATab";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon, AlertCircleIcon } from "lucide-react";
// Removed unused imports
import {
  type MediationProcessDTO,
  type HearingViewDTO,
  type CaseNoteViewDTO,
} from "../../../service/lupon-api/LuponCaseManagement-view-api-v2";
import { type LuponViewDTO } from "../../../service/lupon-api/Lupong-tagapamayapa-view-api";
import {
  getMediationProcess,
  getHearingView,
  getCaseNotes,
  updateCaseStatus,
} from "../../../service/lupon-api/LuponCaseManagement-view-api-v2";
import { getLuponCaseView } from "../../../service/lupon-api/Lupong-tagapamayapa-view-api";
import { updateBlotterStatusById } from "../../../service/blotter-api/DocketView";
import { extendCasePeriod } from "../../../service/lupon-api/LuponCaseManagement-api";
import { getMyAccess } from "../../../service/lupon-api/LuponCasePermission";
import { OverviewTab } from "../tabs/OverviewTab";
import { HearingsTab } from "../tabs/HearingTab";
import { NotesTab } from "../tabs/NotesTab";
import { TimelineTab } from "../tabs/TimeLineTab";
import { ScheduleHearingModal } from "../modal/ScheduleHearingModal";
import { ChangeStatusModal } from "../modal/ChangeStatusModal";
import { HearingViewModal } from "../modal/HearingViewModal";
import { FollowUpModal } from "../modal/FollowUpModal";
import { RecordMinutesModal } from "../modal/RecordMinutesModal";
import { PermissionDeniedPage } from "../../blotter-module/reusable/PermissionDeniedPage";
import { CenteredLoader, CircleLoader } from "../../../hooks/LoadingStates";
import { ArchiveReasonModal } from "../../../hooks/archive-modal";
import { StatusUpdateModal } from "../../../reusable/StatusUpdateModal";
interface Props {
  blotterNumber: string;
  onBack: () => void;
  caseId?: number;
}
type TabKey = "overview" | "hearings" | "notes" | "timeline" | "CFA";
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
  | "reopen"
  | null;

const VIEW_CASES_PERMISSIONS = ["View Cases", "VIEW_CASES", "View Records"];
const MANAGE_CONCILIATION_PERMISSIONS = [
  "Manage Conciliation",
  "Manage Hearings & Mediation",
  "MANAGE_CONCILIATION",
  "MANAGE_HEARINGS_MEDIATION",
];
const RESOLVE_CASE_PERMISSIONS = [
  "Resolve & Finalize Case",
  "Update Case Status",
  "RESOLVE_FINALIZE_CASE",
  "UPDATE_CASE_STATUS",
];
const MANAGE_CASE_NOTES_PERMISSIONS = [
  "Manage Case notes",
  "Manage Case Notes",
  "MANAGE_CASE_NOTES",
];

const normalizePermission = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[&/]+/g, " ")
    .replace(/\s+/g, " ");

const hasAnyPermission = (owned: string[], required: string[]) => {
  const ownedSet = new Set(owned.map((perm) => normalizePermission(perm)));
  return required.some((perm) => ownedSet.has(normalizePermission(perm)));
};

export function LuponCaseDetailView({
  blotterNumber,
  onBack,
  caseId,
}: Props) {
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
  const [accessLoading, setAccessLoading] = useState(true);
  const [canViewCases, setCanViewCases] = useState(false);
  const [canManageConciliation, setCanManageConciliation] = useState(false);
  const [canResolveCase, setCanResolveCase] = useState(false);
  const [canManageCaseNotes, setCanManageCaseNotes] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  // New state for hearing detail modals
  const [selectedHearingId, setSelectedHearingId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    getMyAccess()
      .then((access) => {
        const granted = access.permissions || [];
        setCanViewCases(hasAnyPermission(granted, VIEW_CASES_PERMISSIONS));
        setCanManageConciliation(
          hasAnyPermission(granted, MANAGE_CONCILIATION_PERMISSIONS),
        );
        setCanResolveCase(hasAnyPermission(granted, RESOLVE_CASE_PERMISSIONS));
        setCanManageCaseNotes(
          hasAnyPermission(granted, MANAGE_CASE_NOTES_PERMISSIONS),
        );
      })
      .catch(() => {
        setCanViewCases(false);
        setCanManageConciliation(false);
        setCanResolveCase(false);
        setCanManageCaseNotes(false);
      })
      .finally(() => {
        setAccessLoading(false);
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

  const handleReopenCase = async (reason: string) => {
    if (!reason.trim()) {
      alert("Reason is required.");
      return;
    }
    const idToUse =
      caseId ||
      luponData?.id ||
      (luponData as any)?.caseId ||
      (luponData as any)?.blotterId;
    if (!idToUse) {
      alert("Case ID not found. Cannot re-open case.");
      return;
    }
    setActionLoading(true);
    try {
      await updateBlotterStatusById(Number(idToUse), {
        status: "ACTIVE",
        reason: reason,
      });
      setModal(null);
      await refreshData();
    } catch (err: any) {
      alert(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
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

  // Open record minutes
  // Removed unused handleRecordMinutes
  // Open follow-up
  const handleAddFollowUp = (h: HearingViewDTO) => {
    setSelectedHearingId(h.hearingId);
    setModal("addFollowUp");
  };
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setDetailsLoading(true);
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
        setDetailsLoading(false);
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
      label: "Conciliation",
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
  // Only show CFA tab if status is CERTIFIED_TO_FILE_ACTION
  if (luponData?.caseStatus === "CERTIFIED_TO_FILE_ACTION") {
    tabDefs.push({
      key: "CFA",
      label: "CFA (Certified to File Action)",
    });
  }
  if (loading) return <CenteredLoader minHeight="min-h-[16rem]" />;

  if (accessLoading) {
    return <CenteredLoader minHeight="min-h-[16rem]" />;
  }

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

  if (!canViewCases) {
    return (
      <PermissionDeniedPage
        message="You do not have permission to view this case."
        hint="View Cases permission is required to open docket details."
        actionLabel="Back to Docket"
        onAction={onBack}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 py-6 space-y-5">
        {/* --- LOADING OVERLAY --- */}
        {detailsLoading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <CircleLoader />
          </div>
        )}

        {/* --- MODALS --- */}
        {modal === "settle" && (
          <ArchiveReasonModal
            isOpen
            onClose={() => setModal(null)}
            title="Mark Case as Settled"
            subjectName={blotterNumber}
            subjectLabel="case"
            submitLabel="Mark as Settled"
            placeholder="Provide settlement details..."
            onSubmit={(reason) => handleUpdateStatus("SETTLED", reason)}
          />
        )}

        {modal === "dismiss" && (
          <ArchiveReasonModal
            isOpen
            onClose={() => setModal(null)}
            title="Close / Dismiss Case"
            subjectName={blotterNumber}
            subjectLabel="case"
            submitLabel="Close Case"
            placeholder="Provide reason for closing/dismissal..."
            onSubmit={(reason) => handleUpdateStatus("DISMISSED", reason)}
          />
        )}

        {modal === "issueCFA" && (
          <ArchiveReasonModal
            isOpen
            onClose={() => setModal(null)}
            title="Issue CFA"
            subjectName={blotterNumber}
            subjectLabel="case"
            submitLabel="Issue CFA"
            placeholder="State the grounds for issuing CFA..."
            onSubmit={(reason) =>
              handleUpdateStatus("CERTIFIED_TO_FILE_ACTION", reason)
            }
          />
        )}

        {modal === "extendMediation" && (
          <ArchiveReasonModal
            isOpen
            onClose={() => setModal(null)}
            title="Extend Conciliation Period"
            subjectName={blotterNumber}
            subjectLabel="case"
            submitLabel="Extend Period"
            placeholder="Provide reason for extending the conciliation period..."
            onSubmit={handleExtendMediation}
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
            hasPermission={canResolveCase}
            onConfirm={handleChangeStatus}
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "viewMinutes" && selectedHearingId && (
          <HearingViewModal
            hearingId={selectedHearingId}
            onClose={() => {
              setModal(null);
              setSelectedHearingId(null);
            }}
          />
        )}

        {modal === "recordMinutes" && selectedHearingId && (
          <RecordMinutesModal
            hearingId={selectedHearingId}
            onSuccess={async () => {
              setModal(null);
              setSelectedHearingId(null);
              await refreshData();
            }}
            onCancel={() => {
              setModal(null);
              setSelectedHearingId(null);
            }}
          />
        )}

        {modal === "addFollowUp" && selectedHearingId && (
          <FollowUpModal
            hearingId={selectedHearingId}
            caseNumber={blotterNumber}
            hasPermission={canManageConciliation}
            onSuccess={async () => {
              await refreshData();
            }}
            onClose={() => {
              setModal(null);
              setSelectedHearingId(null);
            }}
          />
        )}

        {modal === "reopen" && (
          <StatusUpdateModal
            isOpen={true}
            onClose={() => setModal(null)}
            title="Re-open Case"
            subjectName={blotterNumber}
            subjectLabel="(record)"
            submitLabel="Re-open Case"
            loading={actionLoading}
            onSubmit={handleReopenCase}
            mode="reason-only"
          />
        )}

        {/* --- HEADER --- */}
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to Docket
          </button>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {luponData.blotterNumber}
            </h1>
          </div>
          <p className="text-sm text-gray-500">{natureOfComplaint}</p>
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
            hasMediationPerm={canManageConciliation}
            hasStatusPerm={canResolveCase}
            onScheduleHearing={() => setModal("schedule")}
            onMarkSettled={() => setModal("settle")}
            onDismissCase={() => setModal("dismiss")}
            onIssueCFA={() => setModal("issueCFA")}
            onExtendMediation={() => setModal("extendMediation")}
            onReopenCase={() => setModal("reopen")}
          />
        )}

        {activeTab === "hearings" && (
          <HearingsTab
            hearings={hearings}
            hearingsLoading={hearingsLoading}
            caseStatus={luponData.caseStatus}
            hasPermission={canManageConciliation}
            blotterNumber={blotterNumber}
            caseNumber={blotterNumber}
            natureOfComplaint={natureOfComplaint}
            complainantName={complainantName}
            respondentName={respondentName}
            onScheduleHearing={() => setModal("schedule")}
            onAddFollowUp={handleAddFollowUp}
          />
        )}

        {activeTab === "notes" && (
          <NotesTab
            notes={notes}
            notesLoading={notesLoading}
            blotterNumber={blotterNumber}
            caseStatus={luponData.caseStatus}
            hasManageNotes={canManageCaseNotes}
            onNoteAdded={loadNotes}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineTab blotterNumber={blotterNumber} />
        )}

        {activeTab === "CFA" && <CFATab luponData={luponData} />}
      </div>
    </div>
  );
}
