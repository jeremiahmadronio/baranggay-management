import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import type {
  BlotterDocketViewDTO,
  MediationProcessDTO,
  HearingViewDTO,
  CaseNoteViewDTO,
  HearingFullDetailsDTO,
} from "../blotter-api/DocketView";
import {
  getFullBlotterDocket,
  getMediationProcess,
  getHearingView,
  getCaseNotes,
  updateCaseStatus,
  getHearingFullDetails,
} from "../blotter-api/DocketView";
import { getMyAccess } from "../blotter-api/BlotterPermission";
import { StatusBadge } from "../blotter-module/shared/StatusBadge";
import { OverviewTab } from "../blotter-module/tabs/OverviewTab";
import { HearingsTab } from "../blotter-module/tabs/HearingTab";
import { NotesTab } from "../blotter-module/tabs/NotesTab";
import { TimelineTab } from "../blotter-module/tabs/TimeLineTab";
import { ConfirmModal } from "../blotter-module/modal/ConfirmModal";
import { ReferToLuponModal } from "../blotter-module/modal/ReferToLuponModal";
import { ScheduleHearingModal } from "../blotter-module/modal/ScheduleHearingModal";
import { HearingMinutesModal } from "./modal/HearingViewModal";
import { RecordMinutesModal } from "./modal/RecordMinutesModal";
import { FollowUpModal } from "./modal/FollowUpModal";
import { ChangeStatusModal } from "./modal/ChangeStatusModal";

interface Props {
  blotterNumber: string;
  onBack: () => void;
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
  | null;

const HEARING_PERMISSION = "Manage Hearings & Mediation";
const STATUS_PERMISSION = "Update Case Status";

export function BlotterDocketDetailView({ blotterNumber, onBack }: Props) {
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
  const [selectedHearing, setSelectedHearing] = useState<HearingViewDTO | null>(null);
  const [followUpHearing, setFollowUpHearing] = useState<HearingViewDTO | null>(null);
  const [fullHearing, setFullHearing] = useState<HearingFullDetailsDTO | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // ── Permissions — single fetch for all ──
  const [hasHearingPerm, setHasHearingPerm] = useState(false);
  const [hasStatusPerm, setHasStatusPerm] = useState(false);

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
  const handleUpdateStatus = async (statusToSend: string, reasonToSend: string) => {
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

  const handleOpenHearingDetails = async (
    hId: number,
    mode: "viewMinutes" | "recordMinutes",
  ) => {
    setDetailsLoading(true);
    try {
      const data = await getHearingFullDetails(hId);
      setFullHearing(data);
      setModal(mode);
    } catch (err: any) {
      alert(err.message || "Failed to fetch hearing details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  // ── Initial load ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [d, m] = await Promise.all([
          getFullBlotterDocket(blotterNumber),
          getMediationProcess(blotterNumber),
        ]);
        setDocket(d);
        setMediation(m);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load case details.");
      } finally {
        setLoading(false);
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
      await updateCaseStatus({
        blotterNumber,
        newStatus: "REFERRED_TO_LUPON",
        reason: `Referred to Lupon. Pangkat: ${members
          .map((m) => `${m.firstName} ${m.lastName} (${m.position})`)
          .join(", ")}`,
      });
      setModal(null);
      await refreshData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to refer case.");
    } finally {
      setActionLoading(false);
    }
  };

  const tabDefs: { key: TabKey; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "hearings", label: "Hearings", count: hearings.length },
    { key: "notes", label: "Case Notes", count: notes.length },
    { key: "timeline", label: "Timeline" },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error || !docket)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircleIcon className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-500">{error ?? "Case not found."}</p>
        <button onClick={onBack} className="text-sm text-blue-500 hover:underline">
          Go Back
        </button>
      </div>
    );

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 py-6 space-y-5">

        {/* ── LOADING OVERLAY ── */}
        {detailsLoading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
            hasPermission={hasStatusPerm}
            onConfirm={handleUpdateStatus}
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "settle" && (
          <ConfirmModal
            title="Mark as Settled"
            description="Are you sure you want to mark this case as settled? This will close the case."
            confirmLabel="Mark as Settled"
            confirmClass="bg-emerald-600 hover:bg-emerald-700"
            icon={
              <div className="bg-emerald-50 p-2 rounded-full">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              </div>
            }
            loading={actionLoading}
            reasonLabel="Settlement Details *"
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
            icon={
              <div className="bg-gray-100 p-2 rounded-full">
                <XIcon className="w-4 h-4 text-gray-600" />
              </div>
            }
            loading={actionLoading}
            reasonLabel="Reason for Dismissal *"
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
            icon={
              <div className="bg-amber-50 p-2 rounded-full">
                <AlertCircleIcon className="w-4 h-4 text-amber-600" />
              </div>
            }
            loading={actionLoading}
            reasonLabel="Grounds for Certification *"
            onConfirm={(reason) => handleUpdateStatus("CERTIFIED_TO_FILE_ACTION", reason)}
            onCancel={() => setModal(null)}
          />
        )}

        {modal === "schedule" && (
          <ScheduleHearingModal
            blotterNumber={blotterNumber}
            hearingNumber={hearings.length + 1}
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
          <HearingMinutesModal
            hearing={fullHearing}
            isViewOnly={true}
            hasPermission={hasHearingPerm}
            onClose={() => {
              setModal(null);
              setFullHearing(null);
            }}
            onSave={async () => {
              setModal(null);
              setFullHearing(null);
              await refreshData();
            }}
          />
        )}

        {modal === "addFollowUp" && followUpHearing && (
          <FollowUpModal
            hearingId={followUpHearing.hearingId}
            caseNumber={blotterNumber}
            hasPermission={hasHearingPerm}
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
            <StatusBadge status={docket.caseStatus} />
            <button
              onClick={() => setModal("changeStatus")}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              <SlidersHorizontalIcon className="w-3.5 h-3.5" />
              Change Status
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {docket.firstName} {docket.lastName} • {docket.natureOfComplaint}
          </p>
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
            onScheduleHearing={() => setModal("schedule")}
            onMarkSettled={() => setModal("settle")}
            onReferToLupon={() => setModal("refer")}
            onDismissCase={() => setModal("dismiss")}
            onIssueCFA={() => setModal("issueCFA")}
          />
        )}

        {activeTab === "hearings" && (
          <HearingsTab
            hearings={hearings}
            hearingsLoading={hearingsLoading}
            caseStatus={docket.caseStatus}
            hasPermission={hasHearingPerm}
            onScheduleHearing={() => setModal("schedule")}
            onUpdateHearing={(h) => {
              setSelectedHearing(h);
              setModal("recordMinutes");
            }}
            onViewMinutes={(h) => {
              handleOpenHearingDetails(h.hearingId, "viewMinutes");
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
            onNoteAdded={loadNotes}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineTab
            docket={docket}
            mediation={mediation}
            hearings={hearings}
            notes={notes}
          />
        )}
      </div>
    </div>
  );
}