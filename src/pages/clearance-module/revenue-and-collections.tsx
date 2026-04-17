import { useState, useEffect, useCallback } from "react";
import {
  KPICard,
  KPIGrid,
  KPIIcons,
  LoadingModal,
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

  // ─── Formatters ───
  const peso = (n: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(n);

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
        <KPIGrid columns={4}>
          <KPICard
            title="Total Revenue"
            value={peso(stats?.totalRevenue || 0)}
            icon={KPIIcons.revenue}
            color="blue"
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
        </div>
      </div>
    </div>
  );
};

export default RevenueAndCollectionPage;
