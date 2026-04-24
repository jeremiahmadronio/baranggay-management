"use client";

import { useEffect, useState } from "react";
import { ChevronLeftIcon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type {
  BpoDetails,
  CaseNoteViewDTO,
  CaseTimeLineDTO,
  CaseViewDTO,
  InterventionViewDTO,
  FollowUpViewDTO,
} from "../../../../service/vawc-api/vawc-api";
import { BpoTab } from "./BpoTab";
import { CfaTab } from "./CfaTab";
import { NotesTab } from "./NotesTab";
import { OverviewTab } from "./OverviewTab";
import { TimelineTab } from "./TimelineTab";
import { SkeletonBlock, formatDate } from "./shared";
import type { ActiveTab } from "./shared";

import {
  getMockCaseDetail,
  getMockBpoDetails,
  getMockNotes,
  getMockTimeline,
  getMockInterventionLogs,
} from "../mock-data";

type LocalInterventionViewDTO = InterventionViewDTO & {
  followUps: (FollowUpViewDTO & { pendingSync?: boolean })[];
  pendingSync?: boolean;
};

export default function CaseDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = Number(searchParams.get("id") || "1");

  const [caseData, setCaseData] = useState<CaseViewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  const [bpoDetails, setBpoDetails] = useState<BpoDetails | null>(null);
  const [bpoLoading, setBpoLoading] = useState(false);
  const [notes, setNotes] = useState<CaseNoteViewDTO[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [timeline, setTimeline] = useState<CaseTimeLineDTO[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [interventionLogs, setInterventionLogs] = useState<LocalInterventionViewDTO[]>([]);
  const [interventionLogsLoading, setInterventionLogsLoading] = useState(false);
  const [interventionDetails, setInterventionDetails] = useState<LocalInterventionViewDTO | null>(null);
  const [interventionDetailsLoading, setInterventionDetailsLoading] = useState(false);

  const caseStatus = (caseData?.caseStatus || "").toUpperCase();
  const isWithdrawn = caseStatus === "WITHDRAWN";
  const isCertifiedToFileAction = caseStatus === "CERTIFIED_TO_FILE_ACTION";

  // ── Load mock data ──
  useEffect(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      const data = getMockCaseDetail(id);
      if (data) {
        setCaseData(data);
      } else {
        setError("Case not found.");
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    setBpoLoading(true);
    const timer = setTimeout(() => {
      setBpoDetails(getMockBpoDetails(id));
      setBpoLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    if (activeTab !== "notes") return;
    setNotesLoading(true);
    const timer = setTimeout(() => {
      setNotes(getMockNotes(id));
      setNotesLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab !== "timeline") return;
    setTimelineLoading(true);
    const timer = setTimeout(() => {
      setTimeline(getMockTimeline(id));
      setTimelineLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab !== "bpo" || !bpoDetails?.id) return;
    setInterventionLogsLoading(true);
    const timer = setTimeout(() => {
      const logs = getMockInterventionLogs(bpoDetails.id);
      setInterventionLogs(logs.map(l => ({ ...l, pendingSync: false })));
      setInterventionLogsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, bpoDetails?.id]);

  const victimFullName =
    [caseData?.firstName, caseData?.middleName, caseData?.lastName]
      .filter(Boolean)
      .join(" ") || "Case Record";

  const respondentFullName = [
    caseData?.respondentFirstName,
    caseData?.respondentMiddleName,
    caseData?.respondentLastName,
  ]
    .filter(Boolean)
    .join(" ");

  const violenceTypeLabel =
    caseData?.violenceTypes?.map((item) => item.type).join(", ") || "—";

  const displayTimeline = [...timeline].sort(
    (left, right) =>
      new Date(right.eventDate).getTime() - new Date(left.eventDate).getTime(),
  );

  const tabDefs: { key: ActiveTab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "bpo", label: "BPO Management" },
    { key: "notes", label: "Case Notes", count: notes.length },
    { key: "timeline", label: "Timeline" },
    { key: "cfa", label: "Referral" },
  ];

  // No-op handlers for view-only mode
  const noop = () => {};

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto px-6 py-6 space-y-5">
          <div className="flex flex-col gap-2">
            <SkeletonBlock className="h-4 w-36" />
            <SkeletonBlock className="h-8 w-72" />
            <SkeletonBlock className="h-4 w-56" />
          </div>
          <div className="flex flex-col gap-5">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6"
              >
                <SkeletonBlock className="h-4 w-36" />
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex flex-col gap-1.5">
                      <SkeletonBlock className="h-3 w-20" />
                      <SkeletonBlock className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto px-6 py-6 space-y-5">
          <button
            onClick={() => navigate("/official-portal/vawc/cases")}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Cases
          </button>
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-24 text-red-500">
            <p className="text-sm font-medium">{error || "Case not found."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 py-6 space-y-5">
        {/* ── HEADER ── */}
        <div>
          <button
            onClick={() => navigate("/official-portal/vawc/cases")}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" /> Back to Cases
          </button>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {caseData.caseNumber}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {caseData.natureOfComplaint || "VAWC Case"}
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
            caseData={caseData}
            victimFullName={victimFullName}
            respondentFullName={respondentFullName}
            caseStatus={caseStatus}
            isWithdrawn={isWithdrawn}
            isReadOnly={true}
            canIssueBpo={false}
            canManageIntervention={false}
            canIssueReferral={false}
            canResolveFinalize={false}
            violenceTypeLabel={violenceTypeLabel}
            canRecordIntervention={false}
            showWithdrawInput={false}
            withdrawReason=""
            withdrawError=""
            withdrawMessage=""
            withdrawLoading={false}
            onShowWithdrawInput={noop}
            onWithdrawReasonChange={noop}
            onWithdrawCase={noop}
            onIssueBpo={noop}
            onRecordIntervention={noop}
            onReferralLetter={noop}
          />
        )}

        {activeTab === "bpo" && (
          <BpoTab
            caseData={caseData}
            isWithdrawn={isWithdrawn}
            isReadOnly={true}
            canIssueBpo={false}
            canManageIntervention={false}
            victimFullName={victimFullName}
            respondentFullName={respondentFullName}
            bpoDetails={bpoDetails}
            bpoLoading={bpoLoading}
            bpoActionLoading={false}
            bpoActionMessage=""
            assignOfficerOptions={[]}
            assignOfficerLoading={false}
            interventionLogs={interventionLogs}
            interventionLogsLoading={interventionLogsLoading}
            interventionForm={{
              activityType: "Assessment",
              customActivityType: "",
              interventionDetails: "",
              interventionDate: "",
              startTime: "",
              endTime: "",
              performedByEmployeeIds: [],
            }}
            interventionLoading={false}
            interventionError=""
            interventionMessage=""
            interventionDetails={interventionDetails}
            interventionDetailsLoading={interventionDetailsLoading}
            interventionDetailsError=""
            followUpText=""
            followUpLoading={false}
            followUpError=""
            followUpMessage=""
            followUpSaveDisabled={true}
            onActivateBpo={noop}
            onPrintBpoRequest={noop}
            onInterventionFormChange={noop}
            onAddIntervention={noop}
            onViewIntervention={(interventionId: number) => {
              setInterventionDetailsLoading(true);
              const log = interventionLogs.find((l) => l.id === interventionId) ?? null;
              setTimeout(() => {
                setInterventionDetails(log);
                setInterventionDetailsLoading(false);
              }, 200);
            }}
            onFollowUpTextChange={noop}
            onAddFollowUp={noop}
            onCloseInterventionDetails={() => setInterventionDetails(null)}
            onResetInterventionForm={noop}
          />
        )}

        {activeTab === "notes" && (
          <NotesTab
            notes={notes}
            isReadOnly={true}
            isCertifiedToFileAction={isCertifiedToFileAction}
            canManageNotes={false}
            notesLoading={notesLoading}
            showNoteInput={false}
            noteText=""
            noteLoading={false}
            noteError=""
            onShowNoteInput={noop}
            onNoteTextChange={noop}
            onSaveNote={noop}
            formatDate={formatDate}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineTab
            timeline={displayTimeline}
            timelineLoading={timelineLoading}
            formatDate={formatDate}
          />
        )}

        {activeTab === "cfa" && (
          <CfaTab
            caseId={id}
            caseData={caseData}
            isWithdrawn={isWithdrawn}
            canIssueReferral={false}
          />
        )}
      </div>
    </div>
  );
}
