import { CFATab } from "../tabs/CFATab";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon, AlertCircleIcon } from "lucide-react";
import type { MediationProcessDTO } from "../../../../service/lupon-api/LuponCaseManagement-view-api-v2";
import type { LuponViewDTO } from "../../../../service/lupon-api/Lupong-tagapamayapa-view-api";
import {
  getMediationProcess,
  getHearingView,
  getCaseNotes,
} from "../../../../service/lupon-api/LuponCaseManagement-view-api-v2";
import { getLuponCaseView } from "../../../../service/lupon-api/Lupong-tagapamayapa-view-api";
import { OverviewTab } from "../tabs/OverviewTab";
import { HearingsTab } from "../tabs/HearingTab";
import { NotesTab } from "../tabs/NotesTab";
import { TimelineTab } from "../tabs/TimeLineTab";
import { CenteredLoader, CircleLoader } from "../../../../hooks/LoadingStates";
import { useKapitanaMockData } from "../../mock/kapitana-mock-flag";
import {
  mockLuponCaseNotes,
  mockLuponCaseView,
  mockLuponHearingView,
  mockLuponMediationProcess,
} from "../../mock/lupon-kapitana-mock";

interface Props {
  blotterNumber: string;
  onBack: () => void;
}

type TabKey = "overview" | "hearings" | "notes" | "timeline" | "CFA";

export function KapitanaLuponCaseDetailView({ blotterNumber, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [luponData, setLuponData] = useState<LuponViewDTO | null>(null);
  const [mediation, setMediation] = useState<MediationProcessDTO | null>(null);
  const [hearings, setHearings] = useState<ReturnType<typeof Array<any>>>([]);
  const [notes, setNotes] = useState<ReturnType<typeof Array<any>>>([]);
  const [loading, setLoading] = useState(true);
  const [hearingsLoading, setHearingsLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setDetailsLoading(true);
      setError(null);
      try {
        if (useKapitanaMockData()) {
          setLuponData(mockLuponCaseView(blotterNumber));
          setMediation(mockLuponMediationProcess());
          return;
        }
        const [d, m] = await Promise.all([
          getLuponCaseView(blotterNumber),
          getMediationProcess(blotterNumber),
        ]);
        setLuponData(d);
        setMediation(m);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load case details.");
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
    if (useKapitanaMockData()) {
      setHearings(mockLuponHearingView());
      setHearingsLoading(false);
      return;
    }
    getHearingView(blotterNumber)
      .then(setHearings)
      .catch(console.error)
      .finally(() => setHearingsLoading(false));
  }, [activeTab, blotterNumber]);

  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      if (useKapitanaMockData()) {
        setNotes(mockLuponCaseNotes());
        return;
      }
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

  const natureOfComplaint = luponData?.incidentDetail.natureOfComplaint ?? "";

  const tabDefs: { key: TabKey; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "hearings", label: "Conciliation", count: hearings.length },
    { key: "notes", label: "Case Notes", count: notes.length },
    { key: "timeline", label: "Timeline" },
  ];

  if (luponData?.caseStatus === "CERTIFIED_TO_FILE_ACTION") {
    tabDefs.push({ key: "CFA", label: "CFA (Certified to File Action)" });
  }

  if (loading) return <CenteredLoader minHeight="min-h-[16rem]" />;

  if (error || !luponData)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircleIcon className="w-8 h-8 text-red-400" />
        <p className="text-sm text-red-500">{error ?? "Case not found."}</p>
        <button onClick={onBack} className="text-sm text-blue-500 hover:underline">
          Go Back
        </button>
      </div>
    );

  const noop = () => {};

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 py-6 space-y-5">
        {detailsLoading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <CircleLoader />
          </div>
        )}

        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to Cases
          </button>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {luponData.blotterNumber}
            </h1>
          </div>
          <p className="text-sm text-gray-500">{natureOfComplaint}</p>
        </div>

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

        {activeTab === "overview" && (
          <OverviewTab
            luponData={luponData}
            mediation={mediation}
            hasMediationPerm={false}
            hasStatusPerm={false}
            onScheduleHearing={noop}
            onMarkSettled={noop}
            onDismissCase={noop}
            onIssueCFA={noop}
            onExtendMediation={noop}
          />
        )}

        {activeTab === "hearings" && (
          <HearingsTab
            hearings={hearings}
            hearingsLoading={hearingsLoading}
            caseStatus={luponData.caseStatus}
            hasPermission={false}
            blotterNumber={blotterNumber}
            caseNumber={blotterNumber}
            natureOfComplaint={natureOfComplaint}
            complainantName=""
            respondentName=""
            onScheduleHearing={noop}
            onAddFollowUp={noop}
          />
        )}

        {activeTab === "notes" && (
          <NotesTab
            notes={notes}
            notesLoading={notesLoading}
            blotterNumber={blotterNumber}
            caseStatus={luponData.caseStatus}
            hasManageNotes={false}
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