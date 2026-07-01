import { referToLupon } from "../../../service/blotter-api/ForwardToLupon";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon, AlertCircleIcon } from "lucide-react";
import type {
  BlotterDocketViewDTO,
  MediationProcessDTO,
  HearingViewDTO,
  CaseNoteViewDTO,
  HearingFullDetailsDTO,
} from "../../../service/blotter-api/DocketView";
import {
  getFullBlotterDocket,
  getMediationProcess,
  getHearingView,
  getCaseNotes,
  updateCaseStatus,
  updateBlotterStatusById,
} from "../../../service/blotter-api/DocketView";
import {
  BLOTTER_PERMISSIONS,
  getMyAccess,
  hasBlotterPermission,
} from "../../../service/blotter-api/BlotterPermission";
import { OverviewTab } from "./tabs/OverviewTab";
import { HearingsTab } from "./tabs/HearingTab";
import { NotesTab } from "./tabs/NotesTab";
import { TimelineTab } from "./tabs/TimeLineTab";
import { ConfirmModal } from "./modal/ConfirmModal";
import { ReferToLuponModal } from "./modal/ReferToLuponModal";
import { ScheduleHearingModal } from "./modal/ScheduleHearingModal";
import { HearingViewModal } from "./modal/HearingViewModal";
import { RecordMinutesModal } from "./modal/RecordMinutesModal";
import { FollowUpModal } from "./modal/FollowUpModal";
import { ChangeStatusModal } from "./modal/ChangeStatusModal";
import { EditCaseModal } from "./modal/EditCaseModal";
import { ActionModal } from "./reusable/SuccessModal";
import { PermissionDeniedPage } from "./reusable/PermissionDeniedPage";
import { CenteredLoader, CircleLoader } from "../../../hooks/LoadingStates";
import { ArchiveReasonModal } from "../../../hooks/archive-modal";

interface Props {
  blotterNumber: string;
  onBack: () => void;
  openEditOnLoad?: boolean;
  caseId?: number;
}

type TabKey = "overview" | "hearings" | "notes" | "timeline";
type ModalKey =
  | "refer"
  | "settle"
  | "dismiss"
  | "schedule"
  | "issueCFA"
  | "recordMinutes"
  | "viewMinutes"
  | "addFollowUp"
  | "changeStatus"
  | "editCase"
  | "reopen"
  | null;

export function BlotterDocketDetailView({
  blotterNumber,
  onBack,
  openEditOnLoad = false,
  caseId,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [docket, setDocket] = useState<BlotterDocketViewDTO | null>(null);
  const [mediation, setMediation] = useState<MediationProcessDTO | null>(null);
  const [hearings, setHearings] = useState<HearingViewDTO[]>([]);
  const [notes, setNotes] = useState<CaseNoteViewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [hearingsLoading, setHearingsLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKey>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<HearingViewDTO | null>(
    null,
  );
  const [followUpHearing, setFollowUpHearing] = useState<HearingViewDTO | null>(
    null,
  );
  const [fullHearing, setFullHearing] = useState<HearingFullDetailsDTO | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [showReferSuccess, setShowReferSuccess] = useState(false);
  const [attemptedAutoEditOpen, setAttemptedAutoEditOpen] = useState(false);

  const EDITABLE_CASE_STATUSES = new Set(["PENDING", "UNDER_MEDIATION"]);

  // ── Permissions — single fetch for all ──
  const [canViewCases, setCanViewCases] = useState(true);
  const [canManageMediation, setCanManageMediation] = useState(false);
  const [canManageLuponEscalation, setCanManageLuponEscalation] =
    useState(false);
  const [canResolveFinalize, setCanResolveFinalize] = useState(false);
  const [canManageCaseNotes, setCanManageCaseNotes] = useState(false);
  const [canUpdateCaseInfo, setCanUpdateCaseInfo] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);

  useEffect(() => {
    // Intentionally bypass permissions for admin view-only mode
  }, []);

  // ── Refresh data ──
  const refreshData = async () => {
    try {
      const [d, m, h] = await Promise.all([
        getFullBlotterDocket(blotterNumber),
        getMediationProcess(blotterNumber),
        getHearingView(blotterNumber),
      ]);
      setDocket(d);
      setMediation(m);
      setHearings(h);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Shared status update handler ──
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

  const handleReopenCase = async (reason: string) => {
    if (!reason.trim()) {
      alert("Reason is required.");
      return;
    }
    console.log("REOPEN DEBUG - Passed caseId prop (Standard):", caseId);
    console.log("REOPEN DEBUG - Docket data (Standard):", docket);

    const idToUse =
      caseId || docket?.id || docket?.caseId || (docket as any)?.blotterId;

    if (!idToUse) {
      alert(
        `Case ID not found. \nFields present in docket: ${Object.keys(docket || {}).join(", ")}`,
      );
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


  // ── Initial load ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setDetailsLoading(true);
      setError(null);
      try {
        const [d, m] = await Promise.all([
          getFullBlotterDocket(blotterNumber),
          getMediationProcess(blotterNumber),
        ]);
        setDocket(d);
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

  // ── Hearings tab ──
  useEffect(() => {
    if (activeTab !== "hearings" && activeTab !== "timeline") return;
    setHearingsLoading(true);
    getHearingView(blotterNumber)
      .then(setHearings)
      .catch(console.error)
      .finally(() => setHearingsLoading(false));
  }, [activeTab, blotterNumber]);

  // ── Notes tab ──
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

  const handleReferConfirm = async (members: any[]) => {
    setActionLoading(true);
    try {
      await referToLupon(blotterNumber, { members });
      setModal(null);
      setShowReferSuccess(true);
      await refreshData();
    } catch (err: any) {
      alert(err.message || "Failed to refer case.");
    } finally {
      setActionLoading(false);
    }
  };

  const tabDefs: { key: TabKey; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "hearings", label: "Mediation", count: hearings.length },
    { key: "notes", label: "Case Notes", count: notes.length },
    { key: "timeline", label: "Timeline" },
  ];

  const normalizedStatus = String(docket?.caseStatus || "")
    .toUpperCase()
    .trim();
  const canEditByStatus = EDITABLE_CASE_STATUSES.has(normalizedStatus);
  const isOfflineRecord = !!docket?._offline;
  const canEditCase = canUpdateCaseInfo && canEditByStatus && !isOfflineRecord;

  useEffect(() => {
    if (attemptedAutoEditOpen) return;
    if (!openEditOnLoad) return;
    if (accessLoading || !docket) return;

    if (canEditCase) {
      setModal("editCase");
    }
    setAttemptedAutoEditOpen(true);
  }, [
    attemptedAutoEditOpen,
    openEditOnLoad,
    accessLoading,
    docket,
    canEditCase,
  ]);

  if (loading) return <CenteredLoader minHeight="min-h-[16rem]" />;

  if (accessLoading) {
    return <CenteredLoader minHeight="min-h-[16rem]" />;
  }

  if (error || !docket)
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
        {/* ── LOADING OVERLAY ── */}
        {detailsLoading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <CircleLoader />
          </div>
        )}

        {/* ── MODALS ── */}

        {modal === "refer" && (
          <ReferToLuponModal
            blotterNumber={blotterNumber}
            complainantName={`${docket.firstName} ${docket.lastName}`}
            loading={actionLoading}
            onConfirm={handleReferConfirm}
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "changeStatus" && (
          <ChangeStatusModal
            currentStatus={docket.caseStatus}
            loading={actionLoading}
            hasPermission={canResolveFinalize}
            onConfirm={handleUpdateStatus}
            onCancel={() => setModal(null)}
          />
        )}

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
          <ConfirmModal
            title="Issue CFA"
            description="Conciliation failed. Issue Certificate to File Action?"
            confirmLabel="Issue CFA"
            confirmClass="bg-amber-600 hover:bg-amber-700"
            icon={
              <div className="bg-amber-50 p-2 rounded-full">
                <AlertCircleIcon className="w-4 h-4 text-amber-600" />
              </div>
            }
            loading={actionLoading}
            reasonLabel="Grounds for Certification *"
            onConfirm={(reason) =>
              handleUpdateStatus("CERTIFIED_TO_FILE_ACTION", reason)
            }
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "schedule" && (
          <ScheduleHearingModal
            blotterNumber={blotterNumber}
            hearingNumber={hearings.length + 1}
            caseNumber={docket.caseNumber}
            natureOfComplaint={docket.natureOfComplaint}
            complainantName={`${docket.firstName} ${docket.lastName}`}
            respondentName={`${docket.respondentFirstName} ${docket.respondentLastName}`}
            onSuccess={async () => {
              setModal(null);
              await refreshData();
            }}
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "recordMinutes" && selectedHearing && (
          <RecordMinutesModal
            hearing={selectedHearing}
            caseNumber={docket.caseNumber}
            natureOfComplaint={docket.natureOfComplaint}
            complainantName={`${docket.firstName} ${docket.lastName}`}
            respondentName={`${docket.respondentFirstName} ${docket.respondentLastName}`}
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

        {modal === "viewMinutes" && fullHearing && (
          <HearingViewModal
            hearing={fullHearing}
            onClose={() => {
              setModal(null);
              setFullHearing(null);
            }}
          />
        )}

        {modal === "addFollowUp" && followUpHearing && (
          <FollowUpModal
            hearingId={followUpHearing.hearingId}
            hearingNumber={followUpHearing.hearingNumber}
            caseNumber={blotterNumber}
            hasPermission={canManageMediation}
            onSuccess={async () => {
              await refreshData();
              if (activeTab === "notes") loadNotes();
            }}
            onClose={() => {
              setModal(null);
              setFollowUpHearing(null);
            }}
          />
        )}

        {modal === "editCase" && docket && (
          <EditCaseModal
            docket={docket}
            hasPermission={canUpdateCaseInfo}
            onSuccess={async () => {
              setModal(null);
              await refreshData();
              setShowEditSuccess(true);
            }}
            onCancel={() => setModal(null)}
          />
        )}
       

        <ActionModal
          isOpen={showEditSuccess}
          onClose={() => setShowEditSuccess(false)}
          title="Case Updated"
          type="success"
        >
          Case information has been successfully updated.
        </ActionModal>

        <ActionModal
          isOpen={showReferSuccess}
          onClose={() => setShowReferSuccess(false)}
          title="Case referred to Lupon"
          type="success"
        >
          Case has been successfully referred to Lupon.
        </ActionModal>

        {/* ── HEADER ── */}
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to Docket
          </button>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {docket.caseNumber}
            </h1>
          </div>
          <p className="text-sm text-gray-500">{docket.natureOfComplaint}</p>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabDefs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                    activeTab === tab.key
                      ? "bg-blue-50 text-blue-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        {activeTab === "overview" && (
          <OverviewTab
            docket={docket}
            mediation={mediation}
            hasMediationPerm={canManageMediation && !isOfflineRecord}
            hasResolvePerm={canResolveFinalize && !isOfflineRecord}
            hasEscalationPerm={canManageLuponEscalation && !isOfflineRecord}
            onScheduleHearing={() => setModal("schedule")}
            onMarkSettled={() => setModal("settle")}
            onReferToLupon={() => setModal("refer")}
            onDismissCase={() => setModal("dismiss")}
            onIssueCFA={() => setModal("issueCFA")}
            onReopenCase={() => setModal("reopen")}
          />
        )}

        {activeTab === "hearings" && (
          <HearingsTab
            hearings={hearings}
            hearingsLoading={hearingsLoading}
            caseStatus={docket.caseStatus}
            hasPermission={canManageMediation && !isOfflineRecord}
            blotterNumber={blotterNumber}
            caseNumber={docket.caseNumber}
            natureOfComplaint={docket.natureOfComplaint}
            complainantName={`${docket.firstName} ${docket.lastName}`}
            respondentName={`${docket.respondentFirstName} ${docket.respondentLastName}`}
            onScheduleHearing={() => setModal("schedule")}
            onUpdateHearing={(h) => {
              setSelectedHearing(h);
              setModal("recordMinutes");
            }}
            onAddFollowUp={(h) => {
              setFollowUpHearing(h);
              setModal("addFollowUp");
            }}
          />
        )}

        {activeTab === "notes" && (
          <NotesTab
            notes={notes}
            notesLoading={notesLoading}
            blotterNumber={blotterNumber}
            caseStatus={docket.caseStatus}
            hasManageNotes={canManageCaseNotes}
            onNoteAdded={loadNotes}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineTab blotterNumber={blotterNumber} />
        )}
      </div>
    </div>
  );
}
