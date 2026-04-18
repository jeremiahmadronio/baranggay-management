import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CircleX } from "lucide-react";
import {
  ActionModal,
  KPICard,
  KPIGrid,
  KPIIcons,
  LoadingModal,
  Table,
  TableFilter,
  type TableColumn,
} from "../../reusable";
import { ArchiveReasonModal, useArchiveModal } from "../../hooks/archive-modal";

import {
  type IssuedStats,
  type IssuedCertificate,
  fetchIssuedStats,
  fetchIssuedCertificates,
  voidCertificate,
  archiveIssuedCertificate,
} from "../../clearance-api/issued-certificate-api";
import { clearanceTemplateApi } from "../../service/clearance-api/Template";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "Released", label: "Released" },
  { value: "Pending", label: "Pending" },
  { value: "Voided", label: "Voided" },
];

const getStatusPillClass = (statusRaw: string) => {
  const status = String(statusRaw || "").toUpperCase().trim();
  if (status === "RELEASED") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (status === "PENDING") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  if (status === "VOIDED" || status === "CANCELLED") {
    return "bg-rose-50 text-rose-700 border border-rose-200";
  }
  return "bg-slate-100 text-slate-700 border border-slate-200";
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeIssuedStatus = (statusRaw: unknown): IssuedCertificate["status"] => {
  const status = String(statusRaw ?? "").trim().toUpperCase();
  if (status.includes("VOID")) return "Voided";
  if (status.includes("CANCEL")) return "Cancelled";
  if (status.includes("RELEASE")) return "Released";
  return "Pending";
};

const normalizeIssuedRows = (rows: unknown): IssuedCertificate[] => {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) => {
    const item = (row ?? {}) as Record<string, unknown>;
    const certificateType = String(
      item.certificateType ?? item.certTitle ?? item.templateName ?? "",
    );
    const fee = toNumber(item.fee ?? item.amount ?? item.certFee ?? item.totalFee ?? 0);
    const rawIsFree = item.isFree;
    const computedIsFree =
      typeof rawIsFree === "boolean"
        ? fee > 0
          ? false
          : rawIsFree
        : fee <= 0;
    return {
      id: String(item.id ?? item.issuedId ?? `${certificateType}-${index}`),
      templateId: String(item.templateId ?? certificateType ?? "template"),
      certificateType,
      requesterName: String(
        item.requesterName ?? item.requestorName ?? item.requestor ?? "Unknown",
      ),
      issuedBy: String(item.issuedBy ?? "System"),
      status: normalizeIssuedStatus(item.status),
      dateIssued: String(item.dateIssued ?? item.requestedAt ?? item.date ?? ""),
      isFree: computedIsFree,
      isArchived: Boolean(item.isArchived ?? false),
      fee,
      orNumber: String(item.orNumber ?? item.ORNumber ?? ""),
    };
  });
};

const parseDateValue = (value: string): Date | null => {
  const raw = value.trim();
  if (!raw) return null;

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    const fromEpoch = new Date(numeric);
    if (!Number.isNaN(fromEpoch.getTime())) return fromEpoch;
  }

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    const localDate = new Date(Number(y), Number(m) - 1, Number(d));
    if (!Number.isNaN(localDate.getTime())) return localDate;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateOnly = (value: string): string => {
  const parsed = parseDateValue(value);
  if (!parsed) return "";
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const isInDateRange = (value: string, from: string, to: string): boolean => {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return false;
  if (from && dateOnly < from) return false;
  if (to && dateOnly > to) return false;
  return true;
};

const deriveStatsFromRows = (rows: IssuedCertificate[]): IssuedStats => {
  const activeRows = rows.filter((row) => !row.isArchived && row.status !== "Voided");
  const paidRows = activeRows.filter((row) => !row.isFree);
  const freeRows = activeRows.filter((row) => row.isFree);
  const totalRevenue = paidRows.reduce((sum, row) => sum + toNumber(row.fee), 0);

  return {
    totalIssued: activeRows.length,
    totalRevenue,
    totalFreeCertificates: freeRows.length,
    totalPaidCertificates: paidRows.length,
    revenueGrowth: 0,
    revenueDirection: "neutral",
  };
};

const fetchSummaryFallbackRows = async (): Promise<IssuedCertificate[]> => {
  const summary = await clearanceTemplateApi.getSummaryTable();
  return normalizeIssuedRows(summary);
};

export const IssuedCertificatePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ─── KPI ───
  const [KPIData, setKPIData] = useState<IssuedStats | null>(null);
  const [loading, setLoading] = useState(true);

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
  const {
    target: voidTarget,
    isOpen: isVoidModalOpen,
    openArchiveModal: openVoidModal,
    closeArchiveModal: closeVoidModal,
  } = useArchiveModal<IssuedCertificate>();

  // ─── Archive modal ───
  const {
    target: archiveTarget,
    isOpen: isArchiveModalOpen,
    openArchiveModal: openArchiveModal,
    closeArchiveModal: closeArchiveModal,
  } = useArchiveModal<IssuedCertificate>();

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "danger" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  const showActionModal = (
    title: string,
    message: string,
    type: "success" | "danger" | "info" = "success",
  ) => {
    setActionModal({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  useEffect(() => {
    const issuedSuccessMessage = (location.state as { issuedSuccessMessage?: string } | null)
      ?.issuedSuccessMessage;

    if (issuedSuccessMessage) {
      showActionModal("Success", issuedSuccessMessage, "success");
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  // ─── Formatters ───
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const revenueFormatted = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(KPIData?.totalRevenue || 0);

  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

  // ─── Fetch ───
  const loadTable = useCallback(async (): Promise<IssuedCertificate[]> => {
    try {
      let baseRows: IssuedCertificate[] = [];

      const result = await fetchIssuedCertificates(
        page,
        pageSize,
        search || undefined,
        statusFilter || undefined,
      );

      baseRows = normalizeIssuedRows(result.content);

      // If issued endpoint returns empty, fallback to clearance summary process data.
      if (baseRows.length === 0) {
        baseRows = await fetchSummaryFallbackRows();
      }

      let activeRows = baseRows.filter((c) => !c.isArchived);

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        activeRows = activeRows.filter(
          (c) =>
            c.requesterName.toLowerCase().includes(q) ||
            c.certificateType.toLowerCase().includes(q) ||
            (c.orNumber || "").toLowerCase().includes(q),
        );
      }

      if (statusFilter) {
        const normalizedFilter = statusFilter.trim().toUpperCase();
        activeRows = activeRows.filter(
          (c) => c.status.trim().toUpperCase() === normalizedFilter,
        );
      }

      if (dateFrom) {
        activeRows = activeRows.filter((c) => isInDateRange(c.dateIssued, dateFrom, dateTo));
      }
      if (dateTo) {
        activeRows = activeRows.filter((c) => isInDateRange(c.dateIssued, dateFrom, dateTo));
      }

      const start = page * pageSize;
      const pagedRows = activeRows.slice(start, start + pageSize);

      setTableData(pagedRows);
      setTotalPages(Math.ceil(activeRows.length / pageSize) || 1);
      setTotalItems(activeRows.length);
      return activeRows;
    } catch (error) {
      console.error("Error loading table:", error);
      try {
        const fallbackRows = await fetchSummaryFallbackRows();
        let activeRows = fallbackRows.filter((c) => !c.isArchived);

        if (search.trim()) {
          const q = search.trim().toLowerCase();
          activeRows = activeRows.filter(
            (c) =>
              c.requesterName.toLowerCase().includes(q) ||
              c.certificateType.toLowerCase().includes(q) ||
              (c.orNumber || "").toLowerCase().includes(q),
          );
        }

        if (statusFilter) {
          const normalizedFilter = statusFilter.trim().toUpperCase();
          activeRows = activeRows.filter(
            (c) => c.status.trim().toUpperCase() === normalizedFilter,
          );
        }

        if (dateFrom) {
          activeRows = activeRows.filter((c) => isInDateRange(c.dateIssued, dateFrom, dateTo));
        }
        if (dateTo) {
          activeRows = activeRows.filter((c) => isInDateRange(c.dateIssued, dateFrom, dateTo));
        }

        const start = page * pageSize;
        const pagedRows = activeRows.slice(start, start + pageSize);
        setTableData(pagedRows);
        setTotalPages(Math.ceil(activeRows.length / pageSize) || 1);
        setTotalItems(activeRows.length);
        return activeRows;
      } catch (fallbackError) {
        console.error("Error loading fallback table:", fallbackError);
        setTableData([]);
        setTotalPages(1);
        setTotalItems(0);
      }
      return [];
    }
  }, [page, search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [statsResult, rows] = await Promise.allSettled([
          fetchIssuedStats(),
          loadTable(),
        ]);

        const tableRows = rows.status === "fulfilled" ? rows.value : [];
        const fallbackStats = deriveStatsFromRows(tableRows);

        if (statsResult.status === "fulfilled") {
          const stats = statsResult.value;
          const useFallback =
            toNumber(stats.totalIssued) === 0 &&
            toNumber(stats.totalRevenue) === 0 &&
            tableRows.length > 0;
          setKPIData(useFallback ? fallbackStats : stats);
        } else {
          setKPIData(fallbackStats);
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setKPIData({
          totalIssued: 0,
          totalRevenue: 0,
          totalFreeCertificates: 0,
          totalPaidCertificates: 0,
          revenueGrowth: 0,
          revenueDirection: "neutral",
        });
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [loadTable]);

  // ─── Void handler ───
  const handleVoid = async (reason: string) => {
    if (!voidTarget) return;
    try {
      await voidCertificate(voidTarget.id, reason);
      showActionModal(
        "Certificate Voided",
        `Certificate for ${voidTarget.requesterName} has been voided.`,
        "success",
      );
      closeVoidModal();
      await loadTable();
      const stats = await fetchIssuedStats();
      setKPIData(stats);
    } catch {
      throw new Error("Failed to void certificate.");
    }
  };

  // ─── Archive handler ───
  const handleArchive = async (reason: string) => {
    if (!archiveTarget) return;
    try {
      await archiveIssuedCertificate(archiveTarget.id, reason);
      showActionModal(
        "Certificate Archived",
        `Certificate for ${archiveTarget.requesterName} has been archived.`,
        "success",
      );
      closeArchiveModal();
      await loadTable();
      const stats = await fetchIssuedStats();
      setKPIData(stats);
    } catch {
      throw new Error("Failed to archive certificate.");
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
          {(() => {
            const parsed = parseDateValue(item.dateIssued);
            if (!parsed) return item.dateIssued || "-";
            return parsed.toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          })()}
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
          {item.orNumber || (toNumber(item.fee) > 0 ? "—" : "FREE")}
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
          {toNumber(item.fee) > 0
            ? `₱${toNumber(item.fee).toFixed(2)}`
            : item.isFree
              ? "Free"
              : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "140px",
      align: "center",
      render: (item) => {
        const status = String(item.status || "").toUpperCase().trim();
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusPillClass(status)}`}
          >
            {status || "UNKNOWN"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      width: "170px",
      align: "center",
      render: (item) => (
        <div className="flex items-center gap-2 justify-center">
          {item.status !== "Voided" && item.status !== "Cancelled" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openVoidModal(item);
              }}
              title="Void certificate"
              aria-label="Void certificate"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100"
            >
              <CircleX className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openArchiveModal(item);
            }}
            title="Archive certificate"
            className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600 transition-colors hover:bg-amber-100"
          >
            Archive
          </button>
        </div>
      ),
    },
  ];

  if (loading)
    return <LoadingModal isOpen={true} message="Loading dashboard data..." />;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Issued Certificates</h2>
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
                maxDate: todayISO,
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
            emptyMessage="No issued certificates found."
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
      <ArchiveReasonModal
        isOpen={isVoidModalOpen}
        onClose={closeVoidModal}
        onSubmit={handleVoid}
        title="Void Certificate"
        subjectName={voidTarget?.requesterName}
        subjectLabel="certificate"
        submitLabel="Void Certificate"
        placeholder="e.g., Wrong data entered, duplicate issuance, requestor cancelled..."
      />

      {/* Archive Confirmation Modal */}
      <ArchiveReasonModal
        isOpen={isArchiveModalOpen}
        onClose={closeArchiveModal}
        onSubmit={handleArchive}
        title="Archive Certificate"
        subjectName={archiveTarget?.requesterName}
        subjectLabel="certificate"
        submitLabel="Archive"
        placeholder="e.g., Record no longer needed, housekeeping, old record..."
      />

      <ActionModal
        isOpen={actionModal.isOpen}
        onClose={() =>
          setActionModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        title={actionModal.title}
        type={actionModal.type}
      >
        {actionModal.message}
      </ActionModal>
    </div>
  );
};

export default IssuedCertificatePage;
