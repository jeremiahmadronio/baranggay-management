import { useState, useEffect, useCallback } from "react";
import { Eye, Archive, RotateCcw, ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ArchiveReasonModal } from "../../hooks/archive-modal";
import { ActionModal } from "../../hooks/SuccessModal";
import { restoreCase } from "../../service/bcpc-api/CaseDetail";

import { KPICard, KPIGrid, KPIIcons } from "../../hooks/KPICard";
import { TableFilter } from "../../hooks/TableFilter";
import { Table, type TableColumn } from "../../reusable";
import {
  getBcpcArchivedCaseTable,
  getBcpcArchiveStats,
  type BcpcCaseSummaryDTO,
  type BcpcArchiveStatsDTO,
} from "../../service/bcpc-api/BcpcFormService";
import {
  BCPC_PERMISSIONS,
  getMyAccess,
  hasBcpcPermission,
  type UserSecurityProfile,
} from "../../service/bcpc-api/BcpcPermission";
import { PermissionDeniedPage } from "../blotter-module/reusable/PermissionDeniedPage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Normalize status for internal logic
const normalizeStatus = (s: string) => s.toLowerCase().replace(/_/g, " ");

// Map status to display label
const getStatusDisplay = (status: string) => {
  if (normalizeStatus(status) === "elevated to formal")
    return "ESCALATED TO CASE";
  if (normalizeStatus(status) === "recorded") return "RECORDED";
  return status.replace(/_/g, " ").toUpperCase();
};

const getStatusPillClass = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "UNDER_MEDIATION":
    case "UNDER_INTERVENTION":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "UNDER_CONCILIATION":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    case "REFERRED_TO_LUPON":
    case "REFERRED":
    case "ISSUED_REFERRAL":
      return "bg-violet-50 text-violet-700 border border-violet-200";
    case "SETTLED":
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "RECORDED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "DISMISSED":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "CERTIFIED_TO_FILE_ACTION":
      return "bg-cyan-50 text-cyan-700 border border-cyan-200";
    case "EXPIRED_UNACTIONED":
      return "bg-red-50 text-red-700 border border-red-200";
    case "WITHDRAWN":
      return "bg-gray-100 text-gray-600 border border-gray-200";
    case "CLOSED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    case "ELEVATED_TO_FORMAL":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = String(status || "")
    .toUpperCase()
    .trim();
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusPillClass(normalized)}`}
    >
      {getStatusDisplay(status)}
    </span>
  );
};

const formatNameAsInitials = (fullName?: string) => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts.map((p) => `${p.charAt(0).toUpperCase()}.`).join(" ");
};

const SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export default function BcpcArchivePage() {
  const navigate = useNavigate();

  const [cases, setCases]               = useState<BcpcCaseSummaryDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [currentPage, setCurrentPage]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const [tableError, setTableError]       = useState<string | null>(null);

  const [restoreEntry, setRestoreEntry] = useState<BcpcCaseSummaryDTO | null>(null);
  const [restoreSuccessOpen, setRestoreSuccessOpen] = useState(false);

  const [search, setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]   = useState("");

  const [stats, setStats] = useState<BcpcArchiveStatsDTO | null>(null);

  // ── Permissions ────────────────────────────────────────────────────────
  const [userAccess, setUserAccess] = useState<UserSecurityProfile | null>(null);

  useEffect(() => {
    getMyAccess()
      .then((access) => setUserAccess(access))
      .catch(() => setUserAccess(null));
  }, []);

  const canView    = hasBcpcPermission(userAccess, BCPC_PERMISSIONS.VIEW_CASES);
  const canArchive = hasBcpcPermission(userAccess, BCPC_PERMISSIONS.ARCHIVE_CASES);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await getBcpcArchiveStats());
    } catch {
      setStats(null);
    }
  }, []);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setTableError(null);
    try {
      const page = await getBcpcArchivedCaseTable({
        search: search || undefined,
        start:  dateFrom || undefined,
        end:    dateTo   || undefined,
        page:   currentPage,
        size:   SIZE,
      });
      setCases(page.content ?? []);
      setTotalElements(page.totalElements ?? 0);
      setTotalPages(page.totalPages ?? 0);
    } catch (err: any) {
      setTableError(err?.message || "Failed to load archived BCPC cases.");
      setCases([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo, currentPage]);

  useEffect(() => { 
    fetchCases(); 
    fetchStats();
  }, [fetchCases, fetchStats]);

  // ── Table columns ────────────────────────────────────────────────────────────
  const columns: TableColumn<BcpcCaseSummaryDTO>[] = [
    { key: "caseNumber", header: "CASE NUMBER", align: "left" },
    {
      key: "victimFullName",
      header: "CHILD (VICTIM)",
      align: "left",
      render: (item) => formatNameAsInitials(item.victimFullName),
    },
    {
      key: "natureOfCase",
      header: "NATURE / TYPE",
      align: "left",
      render: (item) => {
        const parts = (item.natureOfCase || "").split("|").map((p) => p.trim());
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-slate-700">{parts[0] || "—"}</span>
            {parts[1] && (
              <span className="inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                {parts[1]}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "STATUS",
      align: "center",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "dateFiled",
      header: "DATE FILED",
      align: "left",
      render: (item) =>
        item.dateFiled
          ? new Date(item.dateFiled).toLocaleDateString("en-PH")
          : "—",
    },
    { key: "assignedOfficer", header: "ASSIGNED OFFICER", align: "left" },
    {
      key: "actions" as any,
      header: "ACTION",
      align: "center",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            disabled={!canView}
            onClick={(e) => {
              e.stopPropagation();
              if (canView) navigate(`/bcpc/casedetailview?id=${item.id}`);
            }}
            title={canView ? "View case details" : "You don't have permission to view cases"}
            className={`rounded-lg p-1.5 transition-colors ${
              !canView
                ? "text-gray-300 cursor-not-allowed"
                : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <button
            disabled={!canArchive}
            onClick={(e) => {
              e.stopPropagation();
              if (canArchive) setRestoreEntry(item);
            }}
            title={canArchive ? "Restore case" : "You don't have permission to restore cases"}
            className={`p-1.5 rounded-lg transition-colors ${
              !canArchive
                ? "text-gray-300 cursor-not-allowed"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const activeFilterCount = [dateFrom, dateTo].filter(Boolean).length;

  const handleClearAll = () => {
    setSearch(""); setDateFrom(""); setDateTo(""); setCurrentPage(0);
  };

  const handleRestoreSubmit = async (reason: string) => {
    if (!restoreEntry) return;
    await restoreCase(restoreEntry.id, reason);
    setRestoreEntry(null);
    setRestoreSuccessOpen(true);
    fetchCases();
  };

  if (userAccess !== null && !canView) {
    return (
      <PermissionDeniedPage
        message="You do not have permission to access BCPC archived cases."
        hint="Ask your administrator to grant the View Cases permission."
        actionLabel="Go to Dashboard"
        onAction={() => window.location.assign('/bcpc/dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 border border-slate-200">
            <Archive className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Archived Cases</h1>
            <p className="text-sm text-gray-500">
              Closed, withdrawn, settled, and dismissed BCPC cases
            </p>
          </div>
        </div>

        {/* Permission Warning */}
        {userAccess && !canArchive && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
            <ShieldOff className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Limited Access</p>
              <p className="text-xs text-amber-700">You don't have permission to restore archived cases. Contact your administrator.</p>
            </div>
          </div>
        )}

        {/* KPI */}
        <div className="mb-8">
          <KPIGrid columns={4}>
            <KPICard
              title="Total Archived"
              value={loading ? "—" : (stats?.totalArchived ?? 0).toLocaleString()}
              icon={KPIIcons["document"]}
              color="slate"
              subtitle="All archived BCPC records"
            />
            <KPICard
              title="Withdrawn Cases"
              value={loading ? "—" : (stats?.totalWithdrawn ?? 0).toLocaleString()}
              icon={KPIIcons["alert"]}
              color="amber"
              subtitle="Cases withdrawn by complainant"
            />
            <KPICard
              title="Settled / Resolved"
              value={loading ? "—" : (stats?.totalResolved ?? 0).toLocaleString()}
              icon={KPIIcons["check"]}
              color="emerald"
              subtitle="Successfully settled BCPC cases"
            />
            <KPICard
              title="Total Expired"
              value={loading ? "—" : (stats?.totalExpired ?? 0).toLocaleString()}
              icon={KPIIcons["error"]}
              color="rose"
              subtitle="Cases expired without action"
            />
          </KPIGrid>
        </div>

        {/* Error banner */}
        {tableError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {tableError}
          </div>
        )}

        {restoreEntry && (
          <ArchiveReasonModal
            isOpen={!!restoreEntry}
            onClose={() => setRestoreEntry(null)}
            title="Restore Archived Case"
            subjectName={restoreEntry.caseNumber}
            subjectLabel="case"
            submitLabel="Restore"
            placeholder="Provide reason for restoring this case..."
            onSubmit={handleRestoreSubmit}
          />
        )}

        <ActionModal
          isOpen={restoreSuccessOpen}
          onClose={() => setRestoreSuccessOpen(false)}
          title="Case restored"
          type="success"
        >
          Archived case has been restored successfully.
        </ActionModal>

        {/* Filters */}
        <TableFilter
          searchPlaceholder="Search by Case Number or Victim Name..."
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setCurrentPage(0); }}
          filters={[]}
          onFilterChange={() => {}}
          dateRange={{
            startLabel: "Date Filed From",
            endLabel: "To",
            startValue: dateFrom,
            endValue: dateTo,
            onStartChange: (v) => { setDateFrom(v); setCurrentPage(0); },
            onEndChange:   (v) => { setDateTo(v);   setCurrentPage(0); },
          }}
          showSearch={true}
          showFilterButton={false}
          showClearButton={true}
          clearButtonText="Clear Filters"
          activeFilterCount={activeFilterCount}
          onClearClick={handleClearAll}
        />

        {/* Table */}
        <Table
          columns={columns}
          data={cases}
          keyExtractor={(item) => String(item.id)}
          emptyMessage="No archived BCPC cases found."
          loading={loading}
          hoverable={true}
          striped={true}
          variant="resident"
          minRows={SIZE}
          onRowClick={(item) => { if (canView) navigate(`/bcpc/casedetailview?id=${item.id}`); }}
          pagination={{
            currentPage: Math.min(currentPage + 1, Math.max(1, totalPages || 0)),
            totalPages: Math.max(1, totalPages || 0),
            totalItems: totalElements,
            itemsPerPage: SIZE,
            onPageChange: (p) => setCurrentPage(p - 1),
          }}
        />
      </div>
    </div>
  );
}
