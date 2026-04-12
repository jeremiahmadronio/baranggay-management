import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays } from "lucide-react";
import { Table, type TableColumn } from "../../reusable";
import { KPICard, KPIGrid, KPIIcons } from "../../hooks/KPICard";
import {
  CenteredLoader,
  CircleLoader,
  NoRecords,
} from "../../hooks/LoadingStates";
import {
  ftjsReportApi,
  type FtjsReportTableDTO,
  type ReportStatsResponseDTO,
  type StatusDistributionDTO,
  type TrendResponseDTO,
} from "../../service/ftjs/FirstTimeJobSeekerReport";
import {
  CHART_COLORS,
  formatDate,
  formatStatusLabel,
  getDefaultDateRange,
  getMaxEndDate,
  getStatusBadgeClass,
  getStatusDescription,
  paginateItems,
  SectionCard,
} from "./shared";

const PAGE_SIZE = 8;
const DONUT_COLORS = [
  "#2563EB",
  "#0EA5E9",
  "#14B8A6",
  "#8B5CF6",
  "#F59E0B",
  "#64748B",
];

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

export default function FtjsReportPage() {
  const defaults = getDefaultDateRange();

  const [pendingStart, setPendingStart] = useState(defaults.start);
  const [pendingEnd, setPendingEnd] = useState(defaults.end);
  const [appliedStart, setAppliedStart] = useState(defaults.start);
  const [appliedEnd, setAppliedEnd] = useState(defaults.end);

  const [stats, setStats] = useState<ReportStatsResponseDTO | null>(null);
  const [distribution, setDistribution] = useState<StatusDistributionDTO[]>([]);
  const [trend, setTrend] = useState<TrendResponseDTO[]>([]);
  const [cases, setCases] = useState<FtjsReportTableDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [dateError, setDateError] = useState<string | null>(null);

  async function fetchAll(startDate: string, endDate: string) {
    try {
      setLoading(true);
      const [statsRes, distributionRes, trendRes, casesRes] = await Promise.all(
        [
          ftjsReportApi.getReportSummary(startDate, endDate),
          ftjsReportApi.getStatusDistribution(startDate, endDate),
          ftjsReportApi.getTrend(startDate, endDate),
          ftjsReportApi.getReportCases(startDate, endDate),
        ],
      );

      setStats(statsRes);
      setDistribution(distributionRes);
      setTrend(trendRes);
      setCases(casesRes);
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Failed to load FTJS reports.",
      );
      setDateError(
        error instanceof Error ? error.message : "Failed to load FTJS reports.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll(appliedStart, appliedEnd);
  }, []);

  const filteredCases = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return cases.filter((item) => {
      return (
        !keyword ||
        item.ftjsNumber.toLowerCase().includes(keyword) ||
        item.fullName.toLowerCase().includes(keyword) ||
        item.contactNumber.toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword)
      );
    });
  }, [cases, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / PAGE_SIZE));
  const pagedCases = useMemo(
    () => paginateItems(filteredCases, page, PAGE_SIZE),
    [filteredCases, page],
  );

  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  const columns: TableColumn<FtjsReportTableDTO>[] = [
    {
      key: "ftjsNumber",
      header: "FTJS No.",
      width: "180px",
      render: (item) => (
        <span className="text-gray-700 font-medium">{item.ftjsNumber}</span>
      ),
    },
    {
      key: "fullName",
      header: "Applicant",
      width: "240px",
      render: (item) => (
        <span className="block whitespace-normal break-words text-gray-900 font-semibold">
          {item.fullName}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "160px",
      render: (item) => <StatusPill status={item.status} />,
    },
    {
      key: "contactNumber",
      header: "Contact Number",
      width: "170px",
      render: (item) => (
        <span className="text-gray-700">{item.contactNumber || "—"}</span>
      ),
    },
    {
      key: "dateSubmitted",
      header: "Date Submitted",
      width: "150px",
      render: (item) => (
        <span className="text-gray-700 whitespace-nowrap">
          {formatDate(item.dateSubmitted)}
        </span>
      ),
    },
  ];

  function handleApplyFilter() {
    setDateError(null);

    if (!pendingStart || !pendingEnd) {
      setDateError("Please select both a start and end date.");
      return;
    }

    const start = new Date(pendingStart);
    const end = new Date(pendingEnd);

    if (end < start) {
      setDateError("End date cannot be before start date.");
      return;
    }

    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > 365) {
      setDateError("Date range cannot exceed 1 year.");
      return;
    }

    setAppliedStart(pendingStart);
    setAppliedEnd(pendingEnd);
    setPage(0);
    fetchAll(pendingStart, pendingEnd);
  }

  function handleReset() {
    const nextDefaults = getDefaultDateRange();
    setPendingStart(nextDefaults.start);
    setPendingEnd(nextDefaults.end);
    setAppliedStart(nextDefaults.start);
    setAppliedEnd(nextDefaults.end);
    setSearch("");
    setDateError(null);
    setPage(0);
    fetchAll(nextDefaults.start, nextDefaults.end);
  }

  const totalDistribution = distribution.reduce(
    (sum, item) => sum + item.total,
    0,
  );
  const reissuedCount =
    distribution.find(
      (item) => String(item.status || "").toUpperCase() === "RE_ISSUANCE",
    )?.total ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <KPIGrid columns={4}>
            {Array.from({ length: 4 }).map((_, index) => (
              <KPICard
                key={index}
                title="Loading"
                value={<CircleLoader size="sm" />}
                color="slate"
                icon={KPIIcons.document}
              />
            ))}
          </KPIGrid>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="FTJS Trend">
              <CenteredLoader minHeight="min-h-[260px]" />
            </SectionCard>
            <SectionCard title="FTJS Status Distribution">
              <CenteredLoader minHeight="min-h-[260px]" />
            </SectionCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                FTJS Report Date Range
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Default range is the last 6 months. Maximum selectable range is
                1 year.
              </p>
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
              Max 1 Year
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={pendingStart}
                  max={pendingEnd || undefined}
                  onChange={(event) => {
                    setPendingStart(event.target.value);
                    setDateError(null);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={pendingEnd}
                  min={pendingStart || undefined}
                  max={getMaxEndDate(pendingStart)}
                  onChange={(event) => {
                    setPendingEnd(event.target.value);
                    setDateError(null);
                  }}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyFilter}
              className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Filter
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Reset Range
            </button>
          </div>

          {dateError ? (
            <p className="text-xs text-red-500 mt-3">{dateError}</p>
          ) : null}
        </div>

        <KPIGrid columns={4}>
          <KPICard
            title="Total Certificate Records"
            value={stats?.totalRecords ?? 0}
            color="slate"
            icon={KPIIcons.document}
            subtitle="Issued and re-issued FTJS certificates within range"
          />
          <KPICard
            title="With Resident Record"
            value={stats?.residentRecords ?? 0}
            color="emerald"
            icon={KPIIcons.users}
            subtitle="Certificates issued to applicants found in the resident system"
          />
          <KPICard
            title="Without Resident Record"
            value={stats?.nonResidentRecords ?? 0}
            color="amber"
            icon={KPIIcons.alert}
            subtitle="Certificates issued without a linked resident system record"
          />
          <KPICard
            title="Re-issued Records"
            value={reissuedCount}
            color="blue"
            icon={KPIIcons.month}
            subtitle="Records currently counted under RE_ISSUANCE status"
          />
        </KPIGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard
            title="FTJS Trend"
            subtitle="Counts returned by the FTJS trend endpoint for the selected range"
          >
            {trend.length === 0 ? (
              <NoRecords text="No FTJS trend data for the selected range." />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={trend}
                    margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#D1D5DB"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#4B5563" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#4B5563" }}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "#EFF6FF" }}
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #E5E7EB",
                        fontSize: 12,
                      }}
                      formatter={(value?: number) => [value ?? 0, "Total"]}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={42}>
                      {trend.map((_, index) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Status Distribution"
            subtitle="Current status totals reported by the FTJS report endpoint"
          >
            {distribution.length === 0 ? (
              <NoRecords text="No FTJS status distribution for the selected range." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        dataKey="total"
                        nameKey="status"
                        innerRadius={62}
                        outerRadius={94}
                        paddingAngle={1.5}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {distribution.map((_, index) => (
                          <Cell
                            key={`ftjs-report-status-${index}`}
                            fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #E5E7EB",
                          fontSize: 12,
                        }}
                        formatter={(value?: number) => [value ?? 0, "Requests"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="mb-3">
                    <p className="text-3xl font-semibold text-gray-900">
                      {totalDistribution.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total tracked requests
                    </p>
                  </div>

                  {distribution.map((item, index) => (
                    <div
                      key={`${item.status}-${index}`}
                      className="flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full mt-1.5"
                          style={{
                            backgroundColor:
                              DONUT_COLORS[index % DONUT_COLORS.length],
                          }}
                        />
                        <div>
                          <p className="text-sm text-gray-700 leading-tight">
                            {formatStatusLabel(item.status)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {getStatusDescription(item.status)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="FTJS Report Cases"
          subtitle="Searchable list of FTJS report rows returned by the API for the selected date range"
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Search report rows
            </label>
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search by FTJS no., applicant, contact, or status"
              className="w-full md:max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <Table<FtjsReportTableDTO>
            columns={columns}
            data={pagedCases}
            keyExtractor={(item) => item.id}
            variant="resident"
            striped
            hoverable
            minRows={PAGE_SIZE}
            emptyMessage="No FTJS report cases found for the selected range."
            pagination={{
              currentPage: Math.min(page + 1, totalPages),
              totalPages,
              totalItems: filteredCases.length,
              itemsPerPage: PAGE_SIZE,
              onPageChange: (nextPage) => setPage(nextPage - 1),
            }}
          />
        </SectionCard>
      </div>
    </div>
  );
}
