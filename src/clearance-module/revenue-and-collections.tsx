import { useState, useEffect, useCallback } from "react";
import {
  KPICard,
  KPIGrid,
  KPIIcons,
  LoadingModal,
  Table,
  TableFilter,
  StatusBadge,
  type TableColumn,
} from "../reusable";
import type { StatusType } from "../reusable/StatusBadge";
import {
  type IssuedCertificate,
  type IssuedStats,
  fetchIssuedStats,
  fetchIssuedCertificates,
  fetchRevenueReport,
  type RevenueReportEntry,
  type RevenueReport,
} from "../clearance-api/issued-certificate-api";

// ── Status helpers ──
const statusMap: Record<string, StatusType> = {
  Released: "success",
  Pending: "pending",
  Cancelled: "danger",
  Voided: "danger",
};

export const RevenueAndCollectionPage = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"transactions" | "report">(
    "transactions",
  );

  // ─── KPI ───
  const [stats, setStats] = useState<IssuedStats | null>(null);

  // ─── Transactions table ───
  const [transactions, setTransactions] = useState<IssuedCertificate[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // ─── Filters ───
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ─── Report ───
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [reportDateFrom, setReportDateFrom] = useState("");
  const [reportDateTo, setReportDateTo] = useState("");

  // ─── Formatters ───
  const peso = (n: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(n);
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

  // ─── Load transactions ───
  const loadTransactions = useCallback(async () => {
    try {
      const result = await fetchIssuedCertificates(
        page,
        pageSize,
        search || undefined,
      );
      let filtered = result.content.filter(
        (c) => !c.isArchived && c.status !== "Voided",
      );
      if (dateFrom) filtered = filtered.filter((c) => c.dateIssued >= dateFrom);
      if (dateTo) filtered = filtered.filter((c) => c.dateIssued <= dateTo);
      setTransactions(filtered);
      setTotalPages(Math.ceil(filtered.length / pageSize) || 1);
      setTotalItems(filtered.length);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    }
  }, [page, search, dateFrom, dateTo]);

  // ─── Load report ───
  const loadReport = useCallback(async () => {
    try {
      const data = await fetchRevenueReport(
        reportDateFrom || undefined,
        reportDateTo || undefined,
      );
      setReport(data);
    } catch (err) {
      console.error("Failed to load report:", err);
    }
  }, [reportDateFrom, reportDateTo]);

  // ─── Initial load ───
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [s] = await Promise.all([
          fetchIssuedStats(),
          loadTransactions(),
          loadReport(),
        ]);
        setStats(s);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadTransactions, loadReport]);

  // ─── Transaction columns ───
  const txColumns: TableColumn<IssuedCertificate>[] = [
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
      header: "Amount",
      width: "100px",
      align: "right",
      render: (item) => (
        <span
          className={`text-xs font-semibold ${item.isFree ? "text-green-600" : "text-gray-800"}`}
        >
          {item.isFree ? "Free" : item.fee ? peso(item.fee) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      align: "center",
      render: (item) => (
        <StatusBadge
          status={statusMap[item.status] || "default"}
          label={item.status}
          size="sm"
        />
      ),
    },
  ];

  // ─── Report columns ───
  const reportColumns: TableColumn<RevenueReportEntry>[] = [
    {
      key: "certificateType",
      header: "Certificate Type",
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">
          {item.certificateType}
        </span>
      ),
    },
    {
      key: "totalIssued",
      header: "Total Issued",
      width: "110px",
      align: "center",
      render: (item) => (
        <span className="text-xs font-semibold text-gray-700">
          {fmt(item.totalIssued)}
        </span>
      ),
    },
    {
      key: "totalPaid",
      header: "Paid",
      width: "80px",
      align: "center",
      render: (item) => (
        <span className="text-xs text-gray-600">{fmt(item.totalPaid)}</span>
      ),
    },
    {
      key: "totalFree",
      header: "Free",
      width: "80px",
      align: "center",
      render: (item) => (
        <span className="text-xs text-green-600">{fmt(item.totalFree)}</span>
      ),
    },
    {
      key: "totalRevenue",
      header: "Revenue",
      width: "120px",
      align: "right",
      render: (item) => (
        <span className="text-sm font-bold text-blue-700">
          {peso(item.totalRevenue)}
        </span>
      ),
    },
  ];

  if (loading)
    return <LoadingModal isOpen={true} message="Loading revenue data..." />;

  return (
    <div className="p-4 w-full">
      <div className="max-w-[1600px] mx-auto w-full space-y-6">
        {/* KPI Cards */}
        <KPIGrid columns={4}>
          <KPICard
            title="Total Revenue"
            value={peso(stats?.totalRevenue || 0)}
            icon={KPIIcons.revenue}
            color="blue"
            trend={
              stats
                ? {
                    value: `${stats.revenueGrowth}%`,
                    direction: stats.revenueDirection,
                    label: "vs last month",
                  }
                : undefined
            }
          />
          <KPICard
            title="Total Issued"
            value={fmt(stats?.totalIssued || 0)}
            icon={KPIIcons.total}
            color="amber"
            subtitle="All certificates"
          />
          <KPICard
            title="Paid Certificates"
            value={fmt(stats?.totalPaidCertificates || 0)}
            icon={KPIIcons.card}
            color="emerald"
            subtitle="With fee collected"
          />
          <KPICard
            title="Free Certificates"
            value={fmt(stats?.totalFreeCertificates || 0)}
            icon={KPIIcons.gift}
            color="rose"
            subtitle="No fee"
          />
        </KPIGrid>

        {/* Tab Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "transactions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "report"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Revenue Report
            </button>
          </div>

          {/* TRANSACTIONS TAB */}
          {activeTab === "transactions" && (
            <>
              <div className="p-4 border-b border-gray-200">
                <TableFilter
                  searchPlaceholder="Search by name, type, or OR number..."
                  searchValue={search}
                  onSearchChange={(v) => {
                    setSearch(v);
                    setPage(0);
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
                  showClearButton={!!(search || dateFrom || dateTo)}
                  onClearClick={() => {
                    setSearch("");
                    setDateFrom("");
                    setDateTo("");
                    setPage(0);
                  }}
                />
              </div>

              <Table<IssuedCertificate>
                columns={txColumns}
                data={transactions}
                keyExtractor={(item) => item.id}
                emptyMessage="No transactions found."
                hoverable
                pagination={{
                  currentPage: page + 1,
                  totalPages,
                  totalItems,
                  itemsPerPage: pageSize,
                  onPageChange: (p) => setPage(p - 1),
                }}
              />
            </>
          )}

          {/* REPORT TAB */}
          {activeTab === "report" && (
            <>
              <div className="p-4 border-b border-gray-200">
                <TableFilter
                  showSearch={false}
                  dateRange={{
                    startLabel: "Start Date",
                    endLabel: "End Date",
                    startValue: reportDateFrom,
                    endValue: reportDateTo,
                    onStartChange: setReportDateFrom,
                    onEndChange: setReportDateTo,
                  }}
                  showFilterButton={false}
                  showClearButton={!!(reportDateFrom || reportDateTo)}
                  onClearClick={() => {
                    setReportDateFrom("");
                    setReportDateTo("");
                  }}
                />
              </div>

              <Table<RevenueReportEntry>
                columns={reportColumns}
                data={report?.entries || []}
                keyExtractor={(item) => item.certificateType}
                emptyMessage="No revenue data for the selected period."
                hoverable
              />

              {/* Grand Total Row */}
              {report && report.entries.length > 0 && (
                <div className="border-t-2 border-gray-300 bg-gray-50 px-4 py-3 flex items-center text-sm">
                  <span className="flex-1 font-bold text-gray-800">
                    GRAND TOTAL
                  </span>
                  <span className="w-[110px] text-center font-bold text-gray-700">
                    {fmt(report.grandTotalIssued)}
                  </span>
                  <span className="w-[80px] text-center font-semibold text-gray-600">
                    {fmt(report.grandTotalPaid)}
                  </span>
                  <span className="w-[80px] text-center font-semibold text-green-600">
                    {fmt(report.grandTotalFree)}
                  </span>
                  <span className="w-[120px] text-right font-bold text-blue-700 text-base">
                    {peso(report.grandTotalRevenue)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueAndCollectionPage;
