import { useEffect, useState, useCallback } from "react";
import {
  KPICard,
  KPIGrid,
  KPIIcons,
  LoadingModal,
  Table,
  TableFilter,
  StatusBadge,
  ConfirmModal,
  type TableColumn,
} from "../../reusable";

import {
  type IssuedStats,
  type IssuedCertificate,
  fetchIssuedStats,
  fetchIssuedCertificates,
  voidCertificate,
  archiveIssuedCertificate,
  restoreIssuedCertificate,
} from "../../clearance-api/issued-certificate-api";
import type { StatusType } from "../../reusable/StatusBadge";

// ── Status helpers ──
const statusMap: Record<string, StatusType> = {
  Released: "success",
  Pending: "pending",
  Cancelled: "danger",
  Voided: "danger",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "Released", label: "Released" },
  { value: "Pending", label: "Pending" },
  { value: "Voided", label: "Voided" },
];

export const IssuedCertificatePage = () => {
  // ─── KPI ───
  const [KPIData, setKPIData] = useState<IssuedStats | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Tab ───
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // ─── Table state ───
  const [tableData, setTableData] = useState<IssuedCertificate[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // ─── Filters ───
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ─── Void modal ───
  const [voidTarget, setVoidTarget] = useState<IssuedCertificate | null>(null);

  // ─── Archive modal ───
  const [archiveTarget, setArchiveTarget] = useState<IssuedCertificate | null>(
    null,
  );

  // ─── Restore modal ───
  const [restoreTarget, setRestoreTarget] = useState<IssuedCertificate | null>(
    null,
  );

  // ─── Toast ───
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Formatters ───
  const revenueFormatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(KPIData?.totalRevenue || 0);

  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

  // ─── Fetch ───
  const loadTable = useCallback(async () => {
    try {
      const result = await fetchIssuedCertificates(
        page,
        pageSize,
        search || undefined,
        statusFilter || undefined,
      );
      // Client-side filter by archive status and date range
      let filtered = result.content.filter((c) =>
        activeTab === "archived" ? c.isArchived === true : !c.isArchived,
      );
      if (dateFrom) filtered = filtered.filter((c) => c.dateIssued >= dateFrom);
      if (dateTo) filtered = filtered.filter((c) => c.dateIssued <= dateTo);
      setTableData(filtered);
      setTotalPages(Math.ceil(filtered.length / pageSize) || 1);
      setTotalItems(filtered.length);
    } catch (error) {
      console.error("Error loading table:", error);
    }
  }, [page, search, statusFilter, activeTab, dateFrom, dateTo]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [stats] = await Promise.all([fetchIssuedStats(), loadTable()]);
        setKPIData(stats);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [loadTable]);

  // ─── Void handler ───
  const handleVoid = async (reason?: string) => {
    if (!voidTarget || !reason) return;
    try {
      await voidCertificate(voidTarget.id, reason);
      showToast(`Certificate for ${voidTarget.requesterName} has been voided.`);
      setVoidTarget(null);
      await loadTable();
      const stats = await fetchIssuedStats();
      setKPIData(stats);
    } catch {
      showToast("Failed to void certificate.", "error");
    }
  };

  // ─── Archive handler ───
  const handleArchive = async (reason?: string) => {
    if (!archiveTarget || !reason) return;
    try {
      await archiveIssuedCertificate(archiveTarget.id, reason);
      showToast(
        `Certificate for ${archiveTarget.requesterName} has been archived.`,
      );
      setArchiveTarget(null);
      await loadTable();
      const stats = await fetchIssuedStats();
      setKPIData(stats);
    } catch {
      showToast("Failed to archive certificate.", "error");
    }
  };

  // ─── Restore handler ───
  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      await restoreIssuedCertificate(restoreTarget.id);
      showToast(
        `Certificate for ${restoreTarget.requesterName} has been restored.`,
      );
      setRestoreTarget(null);
      await loadTable();
      const stats = await fetchIssuedStats();
      setKPIData(stats);
    } catch {
      showToast("Failed to restore certificate.", "error");
    }
  };

  // ─── Table columns ───
  const columns: TableColumn<IssuedCertificate>[] = [
    {
      key: "dateIssued",
      header: "Date",
      width: "100px",
      render: (item) => (
        <span className="text-xs text-gray-600">
          {new Date(item.dateIssued).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "requesterName",
      header: "Requestor",
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">
          {item.requesterName}
        </span>
      ),
    },
    {
      key: "certificateType",
      header: "Certificate",
      render: (item) => (
        <span className="text-xs text-gray-600">{item.certificateType}</span>
      ),
    },
    {
      key: "orNumber",
      header: "OR No.",
      width: "120px",
      render: (item) => (
        <span className="text-xs font-mono text-gray-600">
          {item.orNumber || (item.isFree ? "FREE" : "—")}
        </span>
      ),
    },
    {
      key: "fee",
      header: "Fee",
      width: "80px",
      align: "right",
      render: (item) => (
        <span className="text-xs font-medium text-gray-700">
          {item.isFree ? "Free" : item.fee ? `₱${item.fee.toFixed(2)}` : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "110px",
      align: "center",
      render: (item) => (
        <StatusBadge
          status={statusMap[item.status] || "default"}
          label={item.status}
          size="sm"
        />
      ),
    },
    {
      key: "actions",
      header: "",
      width: "160px",
      align: "center",
      render: (item) =>
        activeTab === "archived" ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRestoreTarget(item);
            }}
            className="text-[11px] px-2.5 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-colors"
          >
            Restore
          </button>
        ) : (
          <div className="flex items-center gap-1.5 justify-center">
            {item.status !== "Voided" && item.status !== "Cancelled" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setVoidTarget(item);
                }}
                className="text-[11px] px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
              >
                Void
              </button>
            )}
            {item.voidReason && !item.isArchived && (
              <span
                className="text-[10px] text-gray-400 italic truncate max-w-[60px]"
                title={item.voidReason}
              >
                {item.voidReason}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setArchiveTarget(item);
              }}
              className="text-[11px] px-2.5 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium transition-colors"
            >
              Archive
            </button>
          </div>
        ),
    },
  ];

  if (loading)
    return <LoadingModal isOpen={true} message="Loading dashboard data..." />;

  const activeCount = tableData.filter((c) => !c.isArchived).length;
  const archivedCount = tableData.filter((c) => c.isArchived).length;

  return (
    <div className="p-4 w-full">
      <div className="max-w-[1600px] mx-auto w-full space-y-6">
        {/* KPI Cards */}
        <KPIGrid columns={4}>
          <KPICard
            title="Total Issued"
            value={fmt(KPIData?.totalIssued || 0)}
            icon={KPIIcons.total}
            color="amber"
            subtitle="Certificates issued"
          />
          <KPICard
            title="Total Paid Certificates"
            value={fmt(KPIData?.totalPaidCertificates || 0)}
            icon={KPIIcons.card}
            color="emerald"
            subtitle="Paid certificates"
          />
          <KPICard
            title="Total Free Certificates"
            value={fmt(KPIData?.totalFreeCertificates || 0)}
            icon={KPIIcons.gift}
            color="rose"
            subtitle="Free certificates"
          />
          <KPICard
            title="Total Revenue"
            value={revenueFormatted}
            icon={KPIIcons.revenue}
            color="blue"
            trend={
              KPIData
                ? {
                    value: `${KPIData.revenueGrowth}%`,
                    direction: KPIData.revenueDirection,
                    label: "vs last month",
                  }
                : undefined
            }
          />
        </KPIGrid>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab("active");
                setPage(0);
              }}
              className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "active"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Active Certificates
              <span
                className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === "active"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("archived");
                setPage(0);
              }}
              className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "archived"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Archived
              <span
                className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === "archived"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {archivedCount}
              </span>
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <TableFilter
              searchPlaceholder="Search by name, type, or OR number..."
              searchValue={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(0);
              }}
              filters={[
                {
                  label: "Status",
                  key: "status",
                  options: STATUS_OPTIONS,
                  value: statusFilter,
                },
              ]}
              onFilterChange={(key, value) => {
                if (key === "status") {
                  setStatusFilter(value);
                  setPage(0);
                }
              }}
              dateRange={{
                startLabel: "Date From",
                endLabel: "Date To",
                startValue: dateFrom,
                endValue: dateTo,
                onStartChange: (v) => {
                  setDateFrom(v);
                  setPage(0);
                },
                onEndChange: (v) => {
                  setDateTo(v);
                  setPage(0);
                },
              }}
              showFilterButton={false}
              showClearButton={!!(search || statusFilter || dateFrom || dateTo)}
              onClearClick={() => {
                setSearch("");
                setStatusFilter("");
                setDateFrom("");
                setDateTo("");
                setPage(0);
              }}
            />
          </div>

          <Table<IssuedCertificate>
            columns={columns}
            data={tableData}
            keyExtractor={(item) => item.id}
            emptyMessage={
              activeTab === "archived"
                ? "No archived certificates."
                : "No issued certificates found."
            }
            hoverable
            pagination={{
              currentPage: page + 1,
              totalPages,
              totalItems,
              itemsPerPage: pageSize,
              onPageChange: (p) => setPage(p - 1),
            }}
          />
        </div>
      </div>

      {/* Void Confirmation Modal */}
      <ConfirmModal
        isOpen={!!voidTarget}
        onCancel={() => setVoidTarget(null)}
        onConfirm={handleVoid}
        title="Void Certificate"
        message={`Are you sure you want to void the certificate for "${voidTarget?.requesterName || ""}"? This action marks the certificate as invalid and cannot be reversed.`}
        confirmText="Void Certificate"
        type="danger"
        reasonLabel="Reason for voiding"
        reasonPlaceholder="e.g., Wrong data entered, duplicate issuance, requestor cancelled..."
        reasonRequired
      />

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={!!archiveTarget}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive Certificate"
        message={`Are you sure you want to archive the certificate for "${archiveTarget?.requesterName || ""}"? You can restore it later from the Archived tab.`}
        confirmText="Archive"
        type="warning"
        reasonLabel="Reason for archiving"
        reasonPlaceholder="e.g., Record no longer needed, housekeeping, old record..."
        reasonRequired
      />

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={!!restoreTarget}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore Certificate"
        message={`Are you sure you want to restore the certificate for "${restoreTarget?.requesterName || ""}"? It will be moved back to the active list.`}
        confirmText="Restore"
        type="info"
      />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-lg text-white text-sm font-medium max-w-sm z-50 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default IssuedCertificatePage;
