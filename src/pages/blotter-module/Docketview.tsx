import { BlotterDocketDetailView } from "./Blotterdocketdetailview";
import { useState, useEffect, useCallback } from "react";
import { Eye, ArrowUpRight, Archive, PencilLine } from "lucide-react";
import { KPICard, KPIGrid, KPIIcons } from "../../hooks/KPICard";
import { Table, type TableColumn } from "../../reusable";
import { TableFilter } from "../../hooks/TableFilter";
import { ActionModal } from "../../hooks/SuccessModal";
import { ArchiveReasonModal } from "../../hooks/archive-modal";
import type {
  DocketTableParams,
  BlotterSummaryDTO,
  BlotterStatsDTO,
} from "../../service/blotter-api/DocketView";
import {
  getDocketTable,
  getDocketStats,
  archiveCase,
} from "../../service/blotter-api/DocketView";
import {
  BLOTTER_PERMISSIONS,
  getMyAccess,
  hasBlotterPermission,
  type UserSecurityProfile,
} from "../../service/blotter-api/BlotterPermission";
import {
  getNatureOfComplaintOptions,
  type NatureOptionDTO,
} from "../../service/blotter-api/BlotterFormComplaint";
import { referToLupon } from "../../service/blotter-api/ForwardToLupon";
import {
  ReferToLuponModal,
  type PangkatMember,
} from "./modal/ReferToLuponModal"; // ← adjust path to wherever you put it

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Settled", value: "SETTLED" },
  { label: "Dismissed", value: "DISMISSED" },
  { label: "Under Mediation", value: "UNDER_MEDIATION" },
  { label: "Under Conciliation", value: "UNDER_CONCILIATION" },
  { label: "Escalate to Lupon", value: "REFERRED_TO_LUPON" },
  { label: "Certified to File Action", value: "CERTIFIED_TO_FILE_ACTION" },
  { label: "Withdrawn", value: "WITHDRAWN" },
  { label: "Closed", value: "CLOSED" },
  { label: "Expired / Unactioned", value: "EXPIRED_UNACTIONED" },
];

const ARCHIVABLE_STATUSES = new Set([
  "SETTLED",
  "EXPIRED_UNACTIONED",
  "DISMISSED",
  "CERTIFIED_TO_FILE_ACTION",
  "WITHDRAWN",
  "CLOSED",
]);

const EDITABLE_STATUSES = new Set(["PENDING", "UNDER_MEDIATION"]);

const getStatusPillClass = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "UNDER_MEDIATION":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "UNDER_CONCILIATION":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    case "REFERRED_TO_LUPON":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "SETTLED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "DISMISSED":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "CERTIFIED_TO_FILE_ACTION":
      return "bg-cyan-50 text-cyan-700 border border-cyan-200";
    case "EXPIRED_UNACTIONED":
      return "bg-red-50 text-red-700 border border-red-200";
    case "WITHDRAWN":
      return "bg-orange-50 text-orange-700 border border-orange-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Docketview = () => {
  const [selectedBlotterNumber, setSelectedBlotterNumber] = useState<
    string | null
  >(null);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [openEditOnDetailLoad, setOpenEditOnDetailLoad] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [natureId, setNatureId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Query params
  const [params, setParams] = useState<DocketTableParams>({
    search: "",
    status: "",
    natureId: undefined,
    start: "",
    end: "",
    page: 0,
    size: PAGE_SIZE,
    sort: "dateFiled,desc",
  });

  // Data state
  const [userAccess, setUserAccess] = useState<UserSecurityProfile | null>(
    null,
  );
  const [tableData, setTableData] = useState<BlotterSummaryDTO[]>([]);
  const [stats, setStats] = useState<BlotterStatsDTO | null>(null);
  const [natureOptions, setNatureOptions] = useState<NatureOptionDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Refer to Lupon modal state
  const [referEntry, setReferEntry] = useState<BlotterSummaryDTO | null>(null);
  const [referLoading, setReferLoading] = useState(false);
  const [referSuccessOpen, setReferSuccessOpen] = useState(false);
  const [referredBlotterNumber, setReferredBlotterNumber] = useState("");
  const [archiveEntry, setArchiveEntry] = useState<BlotterSummaryDTO | null>(
    null,
  );
  const [archiveSuccessOpen, setArchiveSuccessOpen] = useState(false);
  const safeTotalPages = Math.max(1, totalPages || 0);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await getDocketStats());
    } catch {
      // non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchTable = useCallback(async (p: DocketTableParams) => {
    setLoading(true);

    try {
      const data = await getDocketTable(p);
      setTableData(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(data.number ?? 0);
    } catch {
      console.error("Failed to load records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchTable(params),
      getNatureOfComplaintOptions()
        .then(setNatureOptions)
        .catch(() => setNatureOptions([])),
      getMyAccess()
        .then((access) => {
          setUserAccess(access);
        })
        .catch((err: any) => {
          setUserAccess(null);

          console.error(err?.message || "error");
        }),
    ]);
  }, []);

  // ── Permissions ───────────────────────────────────────────────────────────

  const canView = hasBlotterPermission(
    userAccess,
    BLOTTER_PERMISSIONS.VIEW_CASES,
  );
  const canEscalate = hasBlotterPermission(
    userAccess,
    BLOTTER_PERMISSIONS.MANAGE_LUPON_ESCALATION,
  );
  const canArchive = hasBlotterPermission(
    userAccess,
    BLOTTER_PERMISSIONS.ARCHIVE_CASES,
  );

  // ── Nature filter options ─────────────────────────────────────────────────

  const natureFilterOptions = natureOptions.map((n) => ({
    label: n.natureName,
    value: String(n.id),
  }));

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleApplyFilter = () => {
    const updated: DocketTableParams = {
      search,
      status: status || "",
      natureId: natureId ? Number(natureId) : undefined,
      start: startDate,
      end: endDate,
      page: 0,
      size: PAGE_SIZE,
      sort: "dateFiled,desc",
    };
    setParams(updated);
    fetchTable(updated);
  };

  const handleClearFilter = () => {
    setSearch("");
    setStatus("");
    setNatureId("");
    setStartDate("");
    setEndDate("");
    const reset: DocketTableParams = {
      search: "",
      status: "",
      natureId: undefined,
      start: "",
      end: "",
      page: 0,
      size: PAGE_SIZE,
      sort: "dateFiled,desc",
    };
    setParams(reset);
    fetchTable(reset);
  };

  const handlePageChange = (page: number) => {
    const updated = { ...params, page: page - 1 };
    setParams(updated);
    fetchTable(updated);
  };

  const handleReferConfirm = async (members: PangkatMember[]) => {
    if (!referEntry) return;
    setReferLoading(true);
    try {
      const targetBlotterNumber = referEntry.blotterNumber;
      const mappedMembers = members.map((m) => {
        const [firstName, ...rest] = m.fullName.split(" ");
        const lastName = rest.join(" ");
        return {
          employeeId: m.employeeId,
          firstName: firstName || "",
          lastName: lastName || "",
          position: m.position,
        };
      });
      await referToLupon(targetBlotterNumber, { members: mappedMembers });

      setReferEntry(null);
      setReferredBlotterNumber(targetBlotterNumber);
      setReferSuccessOpen(true);
      fetchTable(params);
      fetchStats();
    } catch (err: any) {
      alert("Failed to refer case to Lupon.");
    } finally {
      setReferLoading(false);
    }
  };

  const handleArchiveSubmit = async (reason: string) => {
    if (!archiveEntry) return;
    await archiveCase(archiveEntry.id, { reason });
    setArchiveEntry(null);
    setArchiveSuccessOpen(true);
    fetchTable(params);
    fetchStats();
  };

  const activeFilterCount = [status, natureId, startDate, endDate].filter(
    Boolean,
  ).length;

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: TableColumn<BlotterSummaryDTO>[] = [
    {
      key: "blotterNumber",
      header: "Case / Blotter No.",
      width: "250px",
      render: (item) => (
        <span className="text-gray-600">{item.blotterNumber}</span>
      ),
    },

    {
      key: "complainantName",
      header: "Complainant",
      width: "260px",
      render: (item) => (
        <span className="block whitespace-normal break-words text-gray-600 leading-snug">
          {item.complainantName}
        </span>
      ),
    },
    {
      key: "respondentName",
      header: "Respondent",
      width: "175px",
      render: (item) => (
        <span className="text-gray-600">{item.respondentName}</span>
      ),
    },
    {
      key: "natureOfComplaint",
      header: "Nature of Complaint",
      render: (item) => (
        <span className="text-gray-600 truncate block max-w-[180px]">
          {item.natureOfComplaint}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "175px",
      render: (item) => {
        const docketStatus = String(item.status || "")
          .toUpperCase()
          .trim();
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusPillClass(docketStatus)}`}
          >
            {docketStatus ? docketStatus.replace(/_/g, " ") : "UNKNOWN"}
          </span>
        );
      },
    },
    {
      key: "dateFiled",
      header: "Date Filed",
      width: "120px",
      render: (item) => (
        <span className="text-gray-600 whitespace-nowrap">
          {formatDate(item.dateFiled)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      width: "180px",
      render: (item) => {
        const statusKey = String(item.status || "")
          .toUpperCase()
          .trim();
        const canArchiveThisStatus = ARCHIVABLE_STATUSES.has(statusKey);
        const canEditThisStatus = EDITABLE_STATUSES.has(statusKey);

        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* View */}
            <button
              disabled={!canView}
              onClick={(e) => {
                e.stopPropagation();
                if (canView) {
                  setOpenEditOnDetailLoad(false);
                  setSelectedBlotterNumber(item.blotterNumber);
                  setSelectedCaseId(item.id);
                }
              }}
              title="View case"
              className={`p-1.5 rounded-lg transition-colors ${
                !canView
                  ? "text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Edit */}
            <button
              disabled={!canView || !canEditThisStatus}
              onClick={(e) => {
                e.stopPropagation();
                if (canView && canEditThisStatus) {
                  setOpenEditOnDetailLoad(true);
                  setSelectedBlotterNumber(item.blotterNumber);
                  setSelectedCaseId(item.id);
                }
              }}
              title={
                canEditThisStatus
                  ? "Edit case"
                  : "Editing allowed only for Pending and Under Mediation"
              }
              className={`p-1.5 rounded-lg transition-colors ${
                !canView || !canEditThisStatus
                  ? "text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                  : "text-gray-500 hover:bg-amber-50"
              }`}
            >
              <PencilLine className="w-4 h-4" />
            </button>

            {["UNSETTLED", "PENDING", "UNDER_MEDIATION"].includes(
              item.status,
            ) && (
              <button
                disabled={!canEscalate}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canEscalate) setReferEntry(item);
                }}
                title="Escalate to Lupon"
                className={`p-1.5 rounded-lg transition-colors ${
                  !canEscalate
                    ? "text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                    : "text-violet-600 hover:bg-violet-50"
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}

            <button
              disabled={!canArchive || !canArchiveThisStatus}
              onClick={(e) => {
                e.stopPropagation();
                if (canArchive && canArchiveThisStatus) setArchiveEntry(item);
              }}
              title={
                canArchiveThisStatus
                  ? "Archive case"
                  : "Archiving allowed only for settled/closed terminal statuses"
              }
              className={`p-1.5 rounded-lg transition-colors ${
                !canArchive || !canArchiveThisStatus
                  ? "text-gray-400 bg-gray-50 cursor-not-allowed opacity-60"
                  : "text-rose-600 hover:bg-rose-50"
              }`}
            >
              <Archive className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // ── Navigate to detail ────────────────────────────────────────────────────

  if (selectedBlotterNumber) {
    return (
      <BlotterDocketDetailView
        blotterNumber={selectedBlotterNumber}
        caseId={selectedCaseId ?? undefined}
        openEditOnLoad={openEditOnDetailLoad}
        onBack={() => {
          setOpenEditOnDetailLoad(false);
          setSelectedBlotterNumber(null);
          setSelectedCaseId(null);
          fetchTable(params);
          fetchStats();
        }}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-5">
      {referEntry && (
        <ReferToLuponModal
          blotterNumber={referEntry.blotterNumber}
          complainantName={referEntry.complainantName}
          loading={referLoading}
          onConfirm={handleReferConfirm}
          onCancel={() => setReferEntry(null)}
        />
      )}

      <ActionModal
        isOpen={referSuccessOpen}
        onClose={() => setReferSuccessOpen(false)}
        title="Case referred to Lupon"
        type="success"
      >
        Case {referredBlotterNumber || ""} has been successfully referred to
        Lupon.
      </ActionModal>

      {archiveEntry && (
        <ArchiveReasonModal
          isOpen={!!archiveEntry}
          onClose={() => setArchiveEntry(null)}
          title="Archive Docket Case"
          subjectName={archiveEntry.blotterNumber}
          subjectLabel="case"
          submitLabel="Archive"
          onSubmit={handleArchiveSubmit}
        />
      )}

      <ActionModal
        isOpen={archiveSuccessOpen}
        onClose={() => setArchiveSuccessOpen(false)}
        title="Case archived"
        type="success"
      >
        The docket case has been archived successfully.
      </ActionModal>

      {/* KPI Stats */}
      <KPIGrid columns={4}>
        <KPICard
          title="Total Entries"
          value={statsLoading ? "..." : (stats?.totalEntries ?? 0)}
          color="blue"
          icon={KPIIcons["document"]}
          subtitle="All docket book entries filed"
        />
        <KPICard
          title="Active Cases"
          value={statsLoading ? "..." : (stats?.activeCases ?? 0)}
          color="emerald"
          icon={KPIIcons["users"]}
          subtitle="Cases currently under handling"
        />
        <KPICard
          title="Resolved"
          value={statsLoading ? "..." : (stats?.resolved ?? 0)}
          color="slate"
          icon={KPIIcons["check"]}
          subtitle="Cases closed through settlement"
        />
        <KPICard
          title="Pending Mediation"
          value={statsLoading ? "..." : (stats?.pendingMediation ?? 0)}
          color="amber"
          icon={KPIIcons["pending"]}
          subtitle="Awaiting mediation schedule"
        />
      </KPIGrid>

      {/* Filters */}
      <TableFilter
        searchPlaceholder="Search by case no."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: "Status",
            key: "status",
            options: STATUS_FILTER_OPTIONS,
            value: status,
          },
          {
            label: "Nature of Case",
            key: "natureId",
            options: natureFilterOptions,
            value: natureId,
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === "status") setStatus(value);
          if (key === "natureId") setNatureId(value);
        }}
        dateRange={{
          startLabel: "Date From",
          endLabel: "Date To",
          startValue: startDate,
          endValue: endDate,
          onStartChange: setStartDate,
          onEndChange: setEndDate,
        }}
        onFilterClick={handleApplyFilter}
        onClearClick={handleClearFilter}
        filterButtonText="Apply"
        activeFilterCount={activeFilterCount}
      />

      {/* Table */}
      <Table<BlotterSummaryDTO>
        columns={columns}
        data={tableData}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="No docket records found."
        variant="resident"
        onRowClick={(item) => {
          if (canView) {
            setOpenEditOnDetailLoad(false);
            setSelectedBlotterNumber(item.blotterNumber);
            setSelectedCaseId(item.id);
          }
        }}
        hoverable
        striped
        minRows={PAGE_SIZE}
        pagination={{
          currentPage: Math.min(currentPage + 1, safeTotalPages),
          totalPages: safeTotalPages,
          totalItems: totalElements,
          itemsPerPage: PAGE_SIZE,
          onPageChange: handlePageChange,
        }}
      />
    </div>
  );
};

export default Docketview;
