import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, CheckCircle2, FileText, Timer, TimerOff, Printer } from "lucide-react";
import { KPIGrid, KPICard } from "../../../hooks/KPICard";

// ─── Inline Mock Data (previously from ./mock-data) ───────────────────────────

type BcpcCaseStatus =
  | "New"
  | "For Assessment"
  | "Under Intervention"
  | "Monitoring"
  | "Closed";

interface BcpcCaseMock {
  id: number;
  dateReported: string;
  status: BcpcCaseStatus;
  caseType: string;
}

const bcpcCaseMockData: BcpcCaseMock[] = [
  { id: 1,  dateReported: "2026-01-05", status: "New",                 caseType: "Physical Abuse" },
  { id: 2,  dateReported: "2026-01-10", status: "For Assessment",      caseType: "Neglect" },
  { id: 3,  dateReported: "2026-01-14", status: "Closed",              caseType: "Child Labor" },
  { id: 4,  dateReported: "2026-01-18", status: "Under Intervention",  caseType: "Physical Abuse" },
  { id: 5,  dateReported: "2026-01-22", status: "Monitoring",          caseType: "Psychological Abuse" },
  { id: 6,  dateReported: "2026-02-01", status: "Closed",              caseType: "Sexual Abuse" },
  { id: 7,  dateReported: "2026-02-05", status: "New",                 caseType: "Economic Abuse" },
  { id: 8,  dateReported: "2026-02-09", status: "For Assessment",      caseType: "Neglect" },
  { id: 9,  dateReported: "2026-02-14", status: "Monitoring",          caseType: "Psychological Abuse" },
  { id: 10, dateReported: "2026-02-18", status: "Under Intervention",  caseType: "Sexual Abuse" },
  { id: 11, dateReported: "2026-02-22", status: "Closed",              caseType: "Physical Abuse" },
  { id: 12, dateReported: "2026-03-01", status: "New",                 caseType: "Child Labor" },
  { id: 13, dateReported: "2026-03-05", status: "Under Intervention",  caseType: "Psychological Abuse" },
  { id: 14, dateReported: "2026-03-09", status: "For Assessment",      caseType: "Sexual Abuse" },
  { id: 15, dateReported: "2026-03-14", status: "Monitoring",          caseType: "Physical Abuse" },
  { id: 16, dateReported: "2026-04-02", status: "New",                 caseType: "Neglect" },
  { id: 17, dateReported: "2026-04-07", status: "Closed",              caseType: "Child Labor" },
  { id: 18, dateReported: "2026-04-15", status: "For Assessment",      caseType: "Physical Abuse" },
  { id: 19, dateReported: "2026-05-03", status: "Under Intervention",  caseType: "Sexual Abuse" },
  { id: 20, dateReported: "2026-05-11", status: "Monitoring",          caseType: "Psychological Abuse" },
];

const bcpcCaseTrendMockData = [
  { label: "Jan", count: 5 },
  { label: "Feb", count: 6 },
  { label: "Mar", count: 4 },
  { label: "Apr", count: 3 },
  { label: "May", count: 2 },
  { label: "Jun", count: 0 },
  { label: "Jul", count: 0 },
  { label: "Aug", count: 0 },
  { label: "Sep", count: 0 },
  { label: "Oct", count: 0 },
  { label: "Nov", count: 0 },
  { label: "Dec", count: 0 },
];

const statusLabel: Record<BcpcCaseStatus, string> = {
  New: "New",
  "For Assessment": "For Assessment",
  "Under Intervention": "Under Intervention",
  Monitoring: "Monitoring",
  Closed: "Closed",
};

export default function KapitanaBcpcReportPage() {
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [appliedRange, setAppliedRange] = useState({
    start: "2026-01-01",
    end: "2026-12-31",
  });

  const filteredCases = useMemo(
    () =>
      bcpcCaseMockData.filter((item) => {
        const reported = new Date(item.dateReported);
        return (
          reported >= new Date(appliedRange.start) &&
          reported <= new Date(`${appliedRange.end}T23:59:59`)
        );
      }),
    [appliedRange.end, appliedRange.start],
  );

  const totalCases = filteredCases.length;
  const resolvedCases = filteredCases.filter((item) => item.status === "Closed").length;
  const activeCases = filteredCases.filter(
    (item) => item.status === "Under Intervention" || item.status === "Monitoring",
  ).length;
  const forAssessment = filteredCases.filter((item) => item.status === "For Assessment").length;
  const resolutionRate = totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

  const statusRows = (Object.keys(statusLabel) as BcpcCaseStatus[]).map((status) => ({
    status,
    label: statusLabel[status],
    count: filteredCases.filter((item) => item.status === status).length,
  }));

  const handleApply = () => {
    setAppliedRange({ start: startDate, end: endDate });
  };

  const handlePrintReport = () => {
    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

    const kpiCards = [
      { label: "Total Cases", value: totalCases, sub: "All BCPC reported cases" },
      { label: "Resolved Cases", value: resolvedCases, sub: `${resolutionRate.toFixed(0)}% resolution rate` },
      { label: "For Assessment", value: forAssessment, sub: "Pending social worker review" },
      { label: "Active Intervention", value: activeCases, sub: "Cases with ongoing action" },
    ];

    const kpiHtml = kpiCards.map((k) => `
      <div style="border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;flex:1;min-width:130px;">
        <p style="margin:0;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;">${k.label}</p>
        <p style="margin:6px 0 2px;font-size:28px;font-weight:700;color:#111827;">${String(k.value)}</p>
        <p style="margin:0;font-size:10px;color:#9CA3AF;">${k.sub}</p>
      </div>`).join("");

    const trendRows = bcpcCaseTrendMockData.map((m) =>
      `<tr><td style="padding:5px 8px;font-size:12px;color:#374151;">${m.label}</td><td style="padding:5px 8px;font-size:12px;color:#374151;text-align:right;">${m.count}</td></tr>`
    ).join("");

    const statusHtmlRows = statusRows.map((row) => {
      const pct = totalCases > 0 ? ((row.count / totalCases) * 100).toFixed(1) : "0.0";
      const barW = totalCases > 0 ? Math.max(4, (row.count / totalCases) * 100) : 4;
      return `<tr>
        <td style="padding:6px 8px;font-size:12px;color:#374151;">${row.label}</td>
        <td style="padding:6px 8px;font-size:12px;color:#374151;text-align:right;">${row.count}</td>
        <td style="padding:6px 8px;width:45%;">
          <div style="background:#F3F4F6;border-radius:4px;height:8px;overflow:hidden;">
            <div style="background:#3B82F6;height:100%;border-radius:4px;width:${barW}%;"></div>
          </div>
        </td>
        <td style="padding:6px 8px;font-size:12px;color:#6B7280;text-align:right;">${pct}%</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
      <title>BCPC Report — ${formatDate(appliedRange.start)} to ${formatDate(appliedRange.end)}</title>
      <style>*{box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;margin:0;padding:32px 40px;background:#fff;}
        h1{font-size:20px;font-weight:700;margin:0 0 2px;}.sub{font-size:12px;color:#6B7280;margin:0 0 24px;}
        .section{margin-bottom:28px;}.section-title{font-size:14px;font-weight:700;color:#1F2937;border-bottom:2px solid #E5E7EB;padding-bottom:6px;margin-bottom:12px;}
        table{width:100%;border-collapse:collapse;}th{text-align:left;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;padding:4px 8px;border-bottom:1px solid #E5E7EB;}
        td{border-bottom:1px solid #F3F4F6;}.kpi-row{display:flex;gap:12px;flex-wrap:wrap;}
        @page{margin:1.2cm;size:A4;}@media print{body{padding:0;}}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div><h1>BCPC Report</h1><p class="sub">Period: ${formatDate(appliedRange.start)} &mdash; ${formatDate(appliedRange.end)}</p></div>
        <div style="text-align:right;"><p style="margin:0;font-size:11px;color:#6B7280;">Generated</p><p style="margin:2px 0 0;font-size:12px;font-weight:600;color:#374151;">${new Date().toLocaleString("en-PH")}</p></div>
      </div>
      <div class="section"><div class="section-title">Summary</div><div class="kpi-row">${kpiHtml}</div></div>
      <div class="section"><div class="section-title">Case Trend (Monthly)</div>
        <table><thead><tr><th>Month</th><th style="text-align:right;">Cases</th></tr></thead><tbody>${trendRows}</tbody></table></div>
      <div class="section"><div class="section-title">Status Distribution</div>
        <table><thead><tr><th>Status</th><th style="text-align:right;">Count</th><th>Distribution</th><th style="text-align:right;">Share</th></tr></thead><tbody>${statusHtmlRows}</tbody></table></div>
    </body></html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;";
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDoc) { document.body.removeChild(iframe); return; }
    iframeDoc.open(); iframeDoc.write(html); iframeDoc.close();
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 300);
    };
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Date Range Filter</h2>
              <p className="text-sm text-gray-500 mt-1">
                Mock analytics patterned after VAWC report layout.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Report
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                />
              </div>
            </div>
            <button
              onClick={handleApply}
              className="px-4 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                setStartDate("2026-01-01");
                setEndDate("2026-12-31");
                setAppliedRange({ start: "2026-01-01", end: "2026-12-31" });
              }}
              className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Reset Range
            </button>
          </div>
        </div>

        <KPIGrid columns={4}>
          <KPICard
            title="Total Cases"
            value={totalCases}
            color="blue"
            icon={<FileText className="w-6 h-6" />}
            subtitle="All BCPC reported cases"
          />
          <KPICard
            title="Resolved Cases"
            value={resolvedCases}
            color="emerald"
            icon={<CheckCircle2 className="w-6 h-6" />}
            subtitle={`${resolutionRate.toFixed(0)}% resolution rate`}
          />
          <KPICard
            title="For Assessment"
            value={forAssessment}
            color="rose"
            icon={<TimerOff className="w-6 h-6" />}
            subtitle="Pending social worker review"
          />
          <KPICard
            title="Active Intervention"
            value={activeCases}
            color="violet"
            icon={<Timer className="w-6 h-6" />}
            subtitle="Cases with ongoing action"
          />
        </KPIGrid>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-gray-900">Case Trend</h3>
          <p className="text-sm text-gray-500 mt-1">Monthly BCPC case filings (mock data)</p>
          <div className="mt-4 h-[320px] rounded-xl border border-slate-100 bg-slate-50/40 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bcpcCaseTrendMockData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#475569" }} tickLine={false} />
                <YAxis
                  width={30}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
          <p className="text-sm text-gray-500 mt-1">Current case status in selected range</p>
          <div className="mt-4 space-y-3">
            {statusRows.map((row) => (
              <div key={row.status}>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-700">{row.label}</p>
                  <p className="font-semibold text-gray-900">{row.count}</p>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${totalCases > 0 ? (row.count / totalCases) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
