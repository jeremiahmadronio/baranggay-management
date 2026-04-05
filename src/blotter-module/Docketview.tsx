import { BlotterDocketDetailView } from "./Blotterdocketdetailview";
import { useState, useEffect, useCallback } from "react";
import { Eye, AlertCircle } from "lucide-react";
import { KPICard, KPIGrid, KPIIcons } from "../reusable/KPICard";
import { Table, type TableColumn } from "../reusable";
import { TableFilter } from "../reusable/TableFilter";
import type {
  DocketTableParams,
  BlotterSummaryDTO,
  BlotterStatsDTO,
} from "../blotter-api/DocketView";
import { getDocketTable, getDocketStats } from "../blotter-api/DocketView";
import {
  getMyAccess,
  type UserSecurityProfile,
} from "../blotter-api/BlotterPermission";
import {
  getNatureOfComplaintOptions,
  type NatureOptionDTO,
} from "../blotter-api/BlotterFormComplaint";
import { referToLupon } from "../blotter-api/ForwardToLupon";
import { StatusBadge, type StatusType } from "../reusable/StatusBadge";
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

const hasPerm = (user: UserSecurityProfile | null, perm: string) =>
  user?.permissions.includes(perm) ?? false;

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Settled", value: "SETTLED" },
  { label: "Dismissed", value: "DISMISSED" },
  { label: "Under Mediation", value: "UNDER_MEDIATION" },
  { label: "Escalate to Lupon", value: "REFERRED_TO_LUPON" },
  { label: "Expired / Unactioned", value: "EXPIRED_UNACTIONED" },
];

const DOCKET_STATUS_MAP: Record<string, { type: StatusType; label: string }> = {
  DISMISSED: { type: "danger", label: "Dismissed" },
  UNDER_MEDIATION: { type: "info", label: "Under Mediation" },
  PENDING: { type: "pending", label: "Pending" },
  REFERRED_TO_LUPON: { type: "info", label: "Referred to Lupon" },
  EXPIRED_UNACTIONED: { type: "warning", label: "Expired / Unactioned" },
  SETTLED: { type: "success", label: "Settled" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Docketview = () => {
  const [selectedBlotterNumber, setSelectedBlotterNumber] = useState<
    string | null
  >(null);

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
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Refer to Lupon modal state
  const [referEntry, setReferEntry] = useState<BlotterSummaryDTO | null>(null);
  const [referLoading, setReferLoading] = useState(false);

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
    setFetchError(null);
    try {
      const data = await getDocketTable(p);
      setTableData(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(data.number ?? 0);
    } catch {
      setFetchError("Failed to load records.");
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
        .then(setUserAccess)
        .catch(() => setUserAccess(null)),
    ]);
  }, []);

  // ── Permissions ───────────────────────────────────────────────────────────

  const canView = hasPerm(userAccess, "View Blotter Records");
  const canEdit = hasPerm(userAccess, "Update Case Status");

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
      sort: "createdAt,desc",
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
      sort: "createdAt,desc",
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
      // Map PangkatMember (from modal) to PangkatMemberDTO (for API)
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
      await referToLupon(referEntry.blotterNumber, { members: mappedMembers });

      setReferEntry(null);
      fetchTable(params);
      fetchStats();
    } catch (err: any) {
      alert(err.message || "Failed to refer case to Lupon.");
    } finally {
      setReferLoading(false);
    }
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canView) setSelectedBlotterNumber(item.blotterNumber);
          }}
          className="font-mono text-sm font-semibold text-blue-600 hover:underline text-left"
        >
          {item.blotterNumber}
        </button>
      ),
    },

    {
      key: "complainantName",
      header: "Complainant",
      width: "175px",
      render: (item) => (
        <span className="text-sm font-medium text-gray-800">
          {item.complainantName}
        </span>
      ),
    },
    {
      key: "respondentName",
      header: "Respondent",
      width: "175px",
      render: (item) => (
        <span className="text-sm text-gray-700">{item.respondentName}</span>
      ),
    },
    {
      key: "natureOfComplaint",
      header: "Nature of Complaint",
      render: (item) => (
        <span className="text-sm text-gray-600 truncate block max-w-[180px]">
          {item.natureOfComplaint}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "160px",
      render: (item) => {
        const mapped = DOCKET_STATUS_MAP[item.status];
        return (
          <StatusBadge
            status={mapped?.type ?? "default"}
            label={mapped?.label ?? item.status}
          />
        );
      },
    },
    {
      key: "dateFiled",
      header: "Date Filed",
      width: "120px",
      render: (item) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {formatDate(item.dateFiled)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "300px",
      render: (item) => (
        <div className="flex items-center gap-2 flex-wrap">
          {/* View */}
          <button
            disabled={!canView}
            onClick={(e) => {
              e.stopPropagation();
              if (canView) setSelectedBlotterNumber(item.blotterNumber);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              !canView
                ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                : "text-gray-600 border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>

          {/* Refer to Pangkat — only for active/mediation cases */}
          {["UNSETTLED", "PENDING", "UNDER_MEDIATION"].includes(
            item.status,
          ) && (
            <button
              disabled={!canEdit}
              onClick={(e) => {
                e.stopPropagation();
                if (canEdit) setReferEntry(item);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                !canEdit
                  ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                  : "text-violet-600 border-violet-200 bg-violet-50 hover:bg-violet-100"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Escalate to Lupon
            </button>
          )}
        </div>
      ),
    },
  ];

  // ── Navigate to detail ────────────────────────────────────────────────────

  if (selectedBlotterNumber) {
    return (
      <BlotterDocketDetailView
        blotterNumber={selectedBlotterNumber}
        onBack={() => {
          setSelectedBlotterNumber(null);
          fetchTable(params);
          fetchStats();
        }}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-5">
      {/* ReferToLuponModal — shown when user clicks "Refer to Pangkat" */}
      {referEntry && (
        <ReferToLuponModal
          blotterNumber={referEntry.blotterNumber}
          complainantName={referEntry.complainantName}
          loading={referLoading}
          onConfirm={handleReferConfirm}
          onCancel={() => setReferEntry(null)}
        />
      )}

      {/* KPI Stats */}
      <KPIGrid columns={4}>
        <KPICard
          title="Total Entries"
          value={statsLoading ? "..." : (stats?.totalEntries ?? 0)}
          color="blue"
          icon={KPIIcons["document"]}
        />
        <KPICard
          title="Active Cases"
          value={statsLoading ? "..." : (stats?.activeCases ?? 0)}
          color="emerald"
          icon={KPIIcons["users"]}
        />
        <KPICard
          title="Resolved"
          value={statsLoading ? "..." : (stats?.resolved ?? 0)}
          color="slate"
          icon={KPIIcons["check"]}
        />
        <KPICard
          title="Pending Mediation"
          value={statsLoading ? "..." : (stats?.pendingMediation ?? 0)}
          color="amber"
          icon={KPIIcons["pending"]}
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

      {/* Error */}
      {fetchError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {fetchError}
        </div>
      )}

      {/* Table */}
      <Table<BlotterSummaryDTO>
        columns={columns}
        data={tableData}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="No docket records found."
        onRowClick={(item) => {
          if (canView) setSelectedBlotterNumber(item.blotterNumber);
        }}
        hoverable
        striped
        minRows={PAGE_SIZE}
        pagination={
          totalElements > 0
            ? {
                currentPage: currentPage + 1,
                totalPages,
                totalItems: totalElements,
                itemsPerPage: PAGE_SIZE,
                onPageChange: handlePageChange,
              }
            : undefined
        }
      />
    </div>
  );
};

export default Docketview;
