import { useCallback, useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { KPICard, KPIGrid } from "../../hooks/KPICard";
import {
  CenteredLoader,
  CircleLoader,
  NoRecords,
} from "../../hooks/LoadingStates";
import {
  getVawcCaseDistribution,
  getVawcDashboardStats,
  getVawcRecentCases,
  type DashboardCaseDistributionDTO,
  type DashboardRecentCaseDTO,
  type DashboardStatsDTO,
} from "../../service/vawc-api/dashboard-api";
import {
  getMyAccess,
  hasVawcPermission,
  VAWC_PERMISSIONS,
  type UserAccessPermission,
} from "../../service/vawc-api/VawcPermission";
import { PermissionDeniedPage } from "../blotter-module/reusable/PermissionDeniedPage";

const DISTRIBUTION_COLORS = [
  "#64748B",
  "#3B82F6",
  "#0F766E",
  "#7C3AED",
  "#D97706",
  "#0891B2",
  "#475569",
];

function normalizeDistributionKey(label: string) {
  return String(label || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function formatDistributionLabel(label: string) {
  const key = normalizeDistributionKey(label);
  const map: Record<string, string> = {
    OTHERS: "Others",
    CHILD_LABOR: "Child Labor",
    CHILD_ABUSE: "Child Abuse",
    PHYSICAL_VIOLENCE: "Physical Violence",
    NEGLECT: "Neglect",
    "CYBER-VIOLENCE_/_OSAEC": "Cyber-Violence / OSAEC",
    PSYCHOLOGICAL_VIOLENCE: "Psychological Violence",
  };

  return (
    map[key] ??
    label
      .toLowerCase()
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

function getDistributionColor(label: string, index: number): string {
  const key = normalizeDistributionKey(label);
  const map: Record<string, string> = {
    OTHERS: "#D97706",
    CHILD_LABOR: "#3B82F6",
    CHILD_ABUSE: "#0F766E",
    PHYSICAL_VIOLENCE: "#7C3AED",
    NEGLECT: "#6366F1",
    "CYBER-VIOLENCE_/_OSAEC": "#0891B2",
    PSYCHOLOGICAL_VIOLENCE: "#475569",
  };
  return map[key] ?? DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length];
}

function formatTrendText(value?: number | null, positiveLabel = "up") {
  if (value === undefined || value === null || value === 0) {
    return "No change from previous period";
  }

  const absolute = Math.abs(value);
  const direction = value > 0 ? positiveLabel : "down";
  return `${absolute}% ${direction} from previous period`;
}

function formatStatusText(text: string) {
  if (!text) return "";
  return text
    .toLowerCase()
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusTone(status: string) {
  const normalized = status.toUpperCase();

  if (normalized.includes("PENDING"))
    return "bg-amber-50 text-amber-700 border border-amber-300";
  if (normalized.includes("SETTLED") || normalized.includes("RESOLVED"))
    return "bg-emerald-50 text-emerald-700 border border-emerald-300";
  if (
    normalized.includes("ACTIVE") ||
    normalized.includes("ONGOING") ||
    normalized.includes("FILED")
  )
    return "bg-blue-50 text-blue-700 border border-blue-300";
  if (normalized.includes("WITHDRAWN"))
    return "bg-orange-50 text-orange-700 border border-orange-300";
  if (normalized.includes("CLOSED"))
    return "bg-slate-50 text-slate-700 border border-slate-300";
  if (normalized.includes("EXPIR"))
    return "bg-red-50 text-red-700 border border-red-300";

  return "bg-slate-50 text-slate-700 border border-slate-300";
}

function formatNameAsInitials(fullName?: string) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "-";

  return parts.map((part) => `${part.charAt(0).toUpperCase()}.`).join(" ");
}

export default function VAWCDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [distribution, setDistribution] = useState<
    DashboardCaseDistributionDTO[]
  >([]);
  const [recentCases, setRecentCases] = useState<DashboardRecentCaseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [userAccess, setUserAccess] = useState<UserAccessPermission | null>(null);

  const canViewCases = hasVawcPermission(userAccess, VAWC_PERMISSIONS.VIEW_CASES);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResult, distributionResult, recentResult] = await Promise.all(
        [
          getVawcDashboardStats(),
          getVawcCaseDistribution(),
          getVawcRecentCases(),
        ],
      );

      setStats(statsResult);
      setDistribution(
        (Array.isArray(distributionResult) ? distributionResult : []).map(
          (item) => ({
            ...item,
            label: formatDistributionLabel(item.label),
          }),
        ),
      );
      setRecentCases(Array.isArray(recentResult) ? recentResult : []);
    } catch (err: unknown) {
      console.error("Failed to load dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadAccess = async () => {
      try {
        setAccessLoading(true);
        const access = await getMyAccess();
        setUserAccess(access);
      } catch (err) {
        console.error("Failed to load VAWC access:", err);
        setUserAccess(null);
      } finally {
        setAccessLoading(false);
      }
    };

    void loadAccess();
  }, []);

  useEffect(() => {
    if (!accessLoading && canViewCases) {
      fetchData();
    }
  }, [accessLoading, canViewCases, fetchData]);

  const safeStats: DashboardStatsDTO = stats || {
    totalCases: 0,
    casesTrend: 0,
    activeBpos: 0,
    totalSettled: 0,
    settledTrend: 0,
    bposIssued: 0,
    bposTrend: 0,
  };

  const cardValue = (value?: number | null) => {
    if (loading) return <CircleLoader size="sm" />;
    if (value === undefined || value === null) return 0;
    return value;
  };

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <CenteredLoader minHeight="min-h-[320px]" />
        </div>
      </div>
    );
  }

  if (!canViewCases) {
    return (
      <PermissionDeniedPage
        message="You do not have permission to access the VAWC dashboard."
        hint="Ask your administrator to grant the View Cases permission."
        actionLabel="Open Complaint Entry"
        onAction={() => navigate('/vawc/newcomplaint')}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <CenteredLoader minHeight="min-h-[320px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <KPIGrid columns={4}>
          <KPICard
            title="Total Cases"
            value={cardValue(safeStats.totalCases)}
            color="slate"
            icon={<FileText className="w-6 h-6" />}
            subtitle={formatTrendText(safeStats.casesTrend, "up")}
          />
          <KPICard
            title="Active BPOs"
            value={cardValue(safeStats.activeBpos)}
            color="blue"
            icon={<Clock className="w-6 h-6" />}
            subtitle="Orders currently active"
          />
          <KPICard
            title="BPOs Issued"
            value={cardValue(safeStats.bposIssued)}
            color="amber"
            icon={<ShieldAlert className="w-6 h-6" />}
            subtitle={formatTrendText(safeStats.bposTrend, "up")}
          />
          <KPICard
            title="Settled Cases"
            value={cardValue(safeStats.totalSettled)}
            color="emerald"
            icon={<CheckCircle className="w-6 h-6" />}
            subtitle={formatTrendText(safeStats.settledTrend, "up")}
          />
        </KPIGrid>

        {/* ── RECENT CASES + CASE DISTRIBUTION (swapped from top) ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white lg:col-span-8">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Recent Cases
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Latest VAWC case records
                </p>
              </div>
              <button
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                onClick={() => navigate("/vawc/cases")}
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6">
                  <CenteredLoader minHeight="min-h-[120px]" />
                </div>
              ) : recentCases.length === 0 ? (
                <div className="p-6">
                  <NoRecords text="No recent VAWC cases." />
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Case No.
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Complainant
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Nature
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentCases.map((item) => (
                      <tr
                        key={item.caseNumber}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-600">
                          {item.caseNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-semibold">
                          {formatNameAsInitials(item.complainantName)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {item.natureOfComplaint}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getStatusTone(item.status)}`}
                          >
                            {formatStatusText(item.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 lg:col-span-4">
            <div className="border-b border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Case Distribution
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Breakdown by complaint category
              </p>
            </div>
            {distribution.length === 0 ? (
              <div className="p-6">
                <NoRecords text="No case distribution data." />
              </div>
            ) : (
              <div className="flex-1 p-5 space-y-4">
                <div className="h-48 mx-auto max-w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={2}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {distribution.map((item, index) => (
                          <Cell
                            key={`dist-${index}`}
                            fill={getDistributionColor(item.label, index)}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #E5E7EB",
                          fontSize: 12,
                          boxShadow: "0 8px 20px -12px rgb(15 23 42 / 0.25)",
                        }}
                        formatter={(value: number | string | undefined) =>
                          typeof value === "number"
                            ? value.toLocaleString()
                            : (value ?? "0")
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5">
                  {distribution.map((item, index) => (
                    <div
                      key={`${item.label}-${index}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: getDistributionColor(
                              item.label,
                              index,
                            ),
                          }}
                        />
                        <p className="text-xs text-gray-700 truncate">
                          {item.label}
                        </p>
                      </div>
                      <span className="text-xs text-gray-900 font-medium shrink-0">
                        {(item?.value ?? 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
