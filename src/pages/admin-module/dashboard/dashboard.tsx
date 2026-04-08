import { useCallback, useEffect, useMemo, useState } from "react";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import { KPICard, KPIGrid, KPIIcons } from "../../../reusable/KPICard";
import {
  adminDashboardApi,
  type AdminDashboardStats,
  type AdminDashboardOfficerByDepartmentDTO,
  type AdminDashboaradResidentByStatusDTO,
  type AdminDashboardRecentAddedResidentDTO,
  type AdminDashboardRecentActivityDTO,
  type AdminDashboardDepartmentActivityResponse,
} from "../../../service/admin-module-api/Dashboard";

function formatNumber(value?: number) {
  return (value ?? 0).toLocaleString();
}

function formatTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getStatusBadge(status: string) {
  const key = status?.toUpperCase() ?? "";
  if (key === "ACTIVE") return "bg-green-100 text-green-700";
  if (key === "INACTIVE") return "bg-slate-100 text-slate-700";
  if (key === "ARCHIVED" || key === "DECEASED")
    return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function getBlueIntensityCardClasses(percent: number) {
  if (percent >= 30)
    return "bg-gradient-to-br from-blue-700 to-blue-600 text-white border-blue-700";
  if (percent >= 22)
    return "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600";
  if (percent >= 14)
    return "bg-gradient-to-br from-blue-500 to-blue-400 text-white border-blue-500";
  if (percent >= 8) return "bg-blue-200 text-blue-900 border-blue-200";
  return "bg-blue-100 text-blue-900 border-blue-100";
}

const OFFICER_BAR_COLORS = [
  "bg-sky-400",
  "bg-blue-500",
  "bg-cyan-400",
  "bg-teal-500",
  "bg-slate-500",
  "bg-emerald-500",
];

function formatDepartmentDisplayName(rawLabel: string): string {
  const normalized = rawLabel.toUpperCase().trim().replace(/\s+/g, "_");

  switch (normalized) {
    case "VAWC":
      return "VAWC (Violence Against Women and Children)";
    case "BCPC":
      return "BCPC (Council for the Protection of Children)";
    case "FTJS":
      return "FTJS (First Time Job Seekers)";
    case "LUPONG_TAGAPAMAYAPA":
      return "Lupong Tagapamayapa";
    case "CLEARANCE":
      return "Barangay Clearance & Certification";
    case "BLOTTER":
      return "Blotter Management";
    case "KAPITANA":
      return "Office of the Barangay Captain";
    case "INACTIVE":
      return "Inactive";
    default:
      return rawLabel
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

function getOfficerBarColor(label: string, index: number): string {
  const normalized = label.toUpperCase().trim().replace(/\s+/g, "_");
  if (normalized === "INACTIVE") return "bg-rose-500";
  return OFFICER_BAR_COLORS[index % OFFICER_BAR_COLORS.length];
}

function getResidentStatusColor(statusLabel: string): string {
  const normalizedStatus = statusLabel
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "_");

  const statusColors: Record<string, string> = {
    ACTIVE: "#2563eb",
    INACTIVE: "#94a3b8",
    MOVE_OUT: "#0ea5e9",
    ARCHIVED: "#64748b",
    DECEASED: "#dc2626",
  };

  return statusColors[normalizedStatus] || "#cbd5e1";
}

function getResidentStatusMeta(statusLabel: string): {
  label: string;
  description: string;
} {
  const normalized = statusLabel.toUpperCase().trim().replace(/\s+/g, "_");

  switch (normalized) {
    case "ACTIVE":
      return {
        label: "Active",
        description: "Currently residing",
      };
    case "INACTIVE":
      return {
        label: "Inactive",
        description: "No longer active in records",
      };
    case "DECEASED":
      return {
        label: "Deceased",
        description: "Passed away",
      };
    case "ARCHIVED":
      return {
        label: "Archived",
        description: "Record archived for retention",
      };
    case "MOVED_OUT":
    case "MOVE_OUT":
      return {
        label: "Moved Out",
        description: "Resident moved out of barangay",
      };
    default:
      return {
        label: statusLabel
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase()),
        description: "Resident status",
      };
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [officerByDepartment, setOfficerByDepartment] = useState<
    AdminDashboardOfficerByDepartmentDTO[]
  >([]);
  const [residentByStatus, setResidentByStatus] = useState<
    AdminDashboaradResidentByStatusDTO[]
  >([]);
  const [recentAdded, setRecentAdded] = useState<
    AdminDashboardRecentAddedResidentDTO[]
  >([]);
  const [recentActivity, setRecentActivity] = useState<
    AdminDashboardRecentActivityDTO[]
  >([]);
  const [departmentActivity, setDepartmentActivity] =
    useState<AdminDashboardDepartmentActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      setError(null);
      const [
        statsData,
        officerByDepartmentData,
        residentByStatusData,
        recentAddedData,
        recentActivityData,
        departmentActivityData,
      ] = await Promise.all([
        adminDashboardApi.getStats(),
        adminDashboardApi.getOfficerByDepartment(),
        adminDashboardApi.getResidentByStatus(),
        adminDashboardApi.getRecentAdded(),
        adminDashboardApi.getRecentActivity(),
        adminDashboardApi.getDepartmentActivity(),
      ]);

      setStats(statsData);
      setOfficerByDepartment(officerByDepartmentData || []);
      setResidentByStatus(residentByStatusData || []);
      setRecentAdded((recentAddedData || []).slice(0, 5));
      const normalizedRecentActivity = (recentActivityData || [])
        .map((item: any) => ({
          action:
            item?.action ||
            item?.actionTaken ||
            item?.activity ||
            item?.description ||
            "No action details",
          time:
            item?.time ||
            item?.createdAt ||
            item?.timestamp ||
            item?.dateTime ||
            "",
        }))
        .filter((item) => Boolean(item.action));
      setRecentActivity(normalizedRecentActivity.slice(0, 5));
      setDepartmentActivity(departmentActivityData);
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const residentChartData = useMemo(
    () =>
      residentByStatus.map((item) => ({
        name: item.statusLabel,
        value: item.count,
        color: getResidentStatusColor(item.statusLabel),
      })),
    [residentByStatus],
  );

  const maxOfficerCount = useMemo(
    () => Math.max(...officerByDepartment.map((item) => item.count), 1),
    [officerByDepartment],
  );

  const totalOfficerByDepartment = useMemo(
    () => officerByDepartment.reduce((sum, item) => sum + (item.count || 0), 0),
    [officerByDepartment],
  );

  const totalResidentsFromStatus = residentByStatus.reduce(
    (sum, item) => sum + (item.count || 0),
    0,
  );

  const displayTotalResidents =
    totalResidentsFromStatus > 0
      ? totalResidentsFromStatus
      : (stats?.totalResident ?? 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-52 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 rounded-lg border border-gray-200 bg-white"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-80 rounded-lg border border-gray-200 bg-white" />
            <div className="h-80 rounded-lg border border-gray-200 bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <KPIGrid columns={4}>
          <KPICard
            title="Total Residents"
            value={formatNumber(stats?.totalResident)}
            subtitle="All registered residents"
            color="blue"
            icon={KPIIcons.users}
          />
          <KPICard
            title="Total Users"
            value={formatNumber(stats?.totalUsers)}
            subtitle="System user accounts"
            color="emerald"
            icon={KPIIcons.check}
          />
          <KPICard
            title="Total Officers"
            value={formatNumber(stats?.totalOfficer)}
            subtitle="Active barangay officers"
            color="violet"
            icon={KPIIcons.home}
          />
          <KPICard
            title="System Actions Today"
            value={formatNumber(stats?.totalSystemActionsToday)}
            subtitle="Logged activities today"
            color="slate"
            icon={KPIIcons.chart}
          />
        </KPIGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Officers by Department
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Current active officer count
                </p>
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-4">
              {officerByDepartment.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No department data available.
                </p>
              ) : (
                officerByDepartment.map((item, index) => {
                  const share =
                    totalOfficerByDepartment > 0
                      ? (item.count / totalOfficerByDepartment) * 100
                      : 0;
                  const width = Math.max(
                    (item.count / maxOfficerCount) * 100,
                    8,
                  );
                  const barColor = getOfficerBarColor(item.label, index);
                  return (
                    <div
                      key={item.label}
                      className="grid grid-cols-1 sm:grid-cols-[1fr,3fr,auto] items-center gap-2 sm:gap-3"
                    >
                      <span className="text-sm text-gray-700">
                        {formatDepartmentDisplayName(item.label)}
                      </span>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-800 min-w-[72px] text-right">
                        {item.count} ({share.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Resident Status Breakdown
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Current distribution by status
                </p>
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                All Time
              </span>
            </div>

            {residentChartData.length === 0 ? (
              <p className="text-sm text-gray-500">
                No resident status data available.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={residentChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={2}
                      >
                        {residentChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | string | undefined) =>
                          typeof value === "number"
                            ? value.toLocaleString()
                            : (value ?? "0")
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="mb-4">
                    <p className="text-3xl font-semibold text-gray-900">
                      {formatNumber(displayTotalResidents)}
                    </p>
                    <p className="text-sm text-gray-500">Total residents</p>
                  </div>

                  {residentChartData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full mt-1.5"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <p className="text-sm text-gray-700 leading-tight">
                            {getResidentStatusMeta(item.name).label}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight mt-0.5">
                            {getResidentStatusMeta(item.name).description}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-900">
                        {formatNumber(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Activity Overview
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                System actions by department
              </p>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {formatNumber(departmentActivity?.totalOverall ?? 0)} total
            </span>
          </div>

          {departmentActivity?.breakdown?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {departmentActivity.breakdown.map((item) => (
                <div
                  key={item.departmentName}
                  className={`rounded-xl border p-4 transition-colors ${getBlueIntensityCardClasses(item.percentage)}`}
                >
                  <p className="text-[11px] font-medium tracking-wider uppercase opacity-90">
                    {formatDepartmentDisplayName(item.departmentName)}
                  </p>
                  <p className="text-3xl font-semibold mt-2">
                    {formatNumber(item.count)}
                  </p>
                  <div className="mt-4 pt-3 border-t border-white/30">
                    <p className="text-sm font-medium opacity-90">
                      {item.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No activity breakdown available.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Recently Added Residents
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Latest 5 residents registered
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/residents")}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
              >
                View All →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Brgy. ID
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Voter
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentAdded.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-10 text-center text-sm text-gray-500"
                      >
                        No recent residents to display.
                      </td>
                    </tr>
                  ) : (
                    recentAdded.map((item) => (
                      <tr
                        key={`${item.barangayIdNumber}-${item.fullName}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          {item.barangayIdNumber}
                        </td>
                        <td className="px-5 py-4 text-base font-semibold text-gray-900">
                          {item.fullName}
                        </td>
                        <td className="px-5 py-4 text-center text-sm text-gray-700 font-medium">
                          {item.isVoter ? "Yes" : "No"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Recent Activity
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Latest system actions
                </p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                Today
              </span>
            </div>

            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No recent activity logs available yet.
                </p>
              ) : (
                recentActivity.map((item, index) => (
                  <div
                    key={`${item.time || "time"}-${index}`}
                    className="flex gap-3"
                  >
                    <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(item.time)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
