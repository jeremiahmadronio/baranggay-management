import { useState, useEffect, useCallback } from "react";
import {
  KPICard,
  KPIGrid,
  KPIIcons,
  LoadingModal,
<<<<<<< HEAD
} from "../../reusable";
import { NoRecords } from "../../hooks/LoadingStates";

function SectionCard({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-5 ${className}`}>
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {subtitle ? (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

import {
} from "../../clearance-api/issued-certificate-api";
import { revenueApi, type RevenueStatsResponseDTO, type RevenueResponseByCertificate, type RevenueTrendDTO, type DailyCollectionResponseDTO } from "../../service/clearance-api/revenue";

// ── Status helpers ──



export const RevenueAndCollectionPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RevenueStatsResponseDTO | null>(null);
  const [trend, setTrend] = useState<RevenueTrendDTO[]>([]);
  const [topRevenue, setTopRevenue] = useState<RevenueResponseByCertificate[]>([]);
  const [collections, setCollections] = useState<DailyCollectionResponseDTO[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

=======
  Table,
  TableFilter,
  StatusBadge,
  type TableColumn,
} from "../../reusable";
import type { StatusType } from "../../reusable/StatusBadge";
import {
  type IssuedCertificate,
  type IssuedStats,
  fetchIssuedStats,
  fetchIssuedCertificates,
  fetchRevenueReport,
  type RevenueReportEntry,
  type RevenueReport,
} from "../../clearance-api/issued-certificate-api";

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

>>>>>>> 09c4e5e5c7b9a3bb84a9c7ef1c538cee62fe5905
  // ─── Formatters ───
  const peso = (n: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(n);
<<<<<<< HEAD

  // ─── Load all revenue data ───
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, trendRes, topRes, collectionsRes] = await Promise.all([
        revenueApi.getRevenueStats(),
        revenueApi.getRevenueTrend(dateFrom, dateTo),
        revenueApi.getTop5Revenue(dateFrom, dateTo),
        revenueApi.getDailyCollections(dateFrom, dateTo),
      ]);
      setStats(statsRes);
      setTrend(trendRes);
      setTopRevenue(topRes);
      setCollections(collectionsRes);
    } catch (err: any) {
      console.error("Failed to load revenue data:", err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading)
    return <LoadingModal isOpen={true} message="Loading revenue data..." />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white border border-red-200 rounded-lg p-8 shadow">
          <div className="text-2xl text-red-600 font-bold mb-2">Failed to load revenue data</div>
          <div className="text-gray-700 mb-4">{error}</div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => loadAll()}
          >
            Retry
          </button>
        </div>
      </div>
    );

  // UI
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
=======
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
>>>>>>> 09c4e5e5c7b9a3bb84a9c7ef1c538cee62fe5905
        <KPIGrid columns={4}>
          <KPICard
            title="Total Revenue"
            value={peso(stats?.totalRevenue || 0)}
            icon={KPIIcons.revenue}
            color="blue"
<<<<<<< HEAD
            subtitle="All time"
          />
          <KPICard
            title="This Week"
            value={peso(stats?.totalRevenueThisWeek || 0)}
            icon={KPIIcons.revenue}
            color="blue"
            subtitle="Revenue"
          />
          <KPICard
            title="This Month"
            value={peso(stats?.totalRevenueThisMonth || 0)}
            icon={KPIIcons.revenue}
            color="amber"
            subtitle="Revenue"
          />
          <KPICard
            title="This Year"
            value={peso(stats?.totalRevenueThisYear || 0)}
            icon={KPIIcons.revenue}
            color="emerald"
            subtitle="Revenue"
          />
        </KPIGrid>

        {/* Revenue Trend Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard
            title="Revenue Trend"
            subtitle="Daily/periodic revenue collection trend"
          >
            <div className="mb-4 flex gap-2 items-center">
              <label className="text-sm font-medium">Date Range:</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <span className="mx-1">to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="ml-2 text-xs text-gray-500 underline">Clear</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trend.length === 0 ? (
                    <tr>
                      <td colSpan={2}><NoRecords text="No data" /></td>
                    </tr>
                  ) : trend.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-gray-700">{row.label}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">{peso(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            title="Top 5 Revenue by Certificate"
            subtitle="Top 5 certificate types by revenue"
          >
            <div className="mb-4 flex gap-2 items-center">
              <label className="text-sm font-medium">Date Range:</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <span className="mx-1">to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="ml-2 text-xs text-gray-500 underline">Clear</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Certificate</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Issued</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Fee</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topRevenue.length === 0 ? (
                    <tr>
                      <td colSpan={4}><NoRecords text="No data" /></td>
                    </tr>
                  ) : topRevenue.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-gray-700">{row.certificateTitle}</td>
                      <td className="px-6 py-4 text-right text-gray-900">{row.count}</td>
                      <td className="px-6 py-4 text-right text-gray-900">{peso(row.fee)}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-700">{peso(row.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Revenue by Certificate Type Section */}
        <div className="grid grid-cols-1 gap-4">
          <SectionCard
            title="Revenue by Certificate Type"
            subtitle="Breakdown of revenue by certificate type"
          >
            <div className="mb-4 flex gap-2 items-center">
              <label className="text-sm font-medium">Date Range:</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <span className="mx-1">to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="ml-2 text-xs text-gray-500 underline">Clear</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Certificate</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Issued</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Fee</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* TODO: Map revenueByCertificateType here when wired */}
                  <tr>
                    <td colSpan={4}><NoRecords text="No data" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Daily Collections Section */}
        <div className="grid grid-cols-1 gap-4">
          <SectionCard
            title="Daily Collections"
            subtitle="Daily breakdown of certificate issuances and collections"
          >
            <div className="mb-4 flex gap-2 items-center">
              <label className="text-sm font-medium">Date Range:</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <span className="mx-1">to</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="ml-2 text-xs text-gray-500 underline">Clear</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Issued</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Collections</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">OR Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {collections.length === 0 ? (
                    <tr>
                      <td colSpan={4}><NoRecords text="No data" /></td>
                    </tr>
                  ) : collections.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-gray-700">{row.date}</td>
                      <td className="px-6 py-4 text-right text-gray-900">{row.totalCertIssue}</td>
                      <td className="px-6 py-4 text-right text-gray-900">{peso(row.totalCollections)}</td>
                      <td className="px-6 py-4 text-center text-gray-900">{row.oRNumberStartToEnd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
=======
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
>>>>>>> 09c4e5e5c7b9a3bb84a9c7ef1c538cee62fe5905
        </div>
      </div>
    </div>
  );
};

export default RevenueAndCollectionPage;
