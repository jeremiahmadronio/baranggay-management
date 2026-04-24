import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  FileText,
  HeartHandshake,
  Scale,
  ScrollText,
} from "lucide-react";
import { KPICard, KPIGrid, KPIIcons } from "../hooks/KPICard";
import { useKapitanaMockData } from "../pages/kapitana/mock/kapitana-mock-flag";
import {
  mockDashboardStats,
  mockDocketStats,
  mockRecordStats,
  mockRecentCases,
  mockUpcomingHearings,
} from "../pages/kapitana/mock/blotter-kapitana-mock";
import { mockKapitanaIssuedStats } from "../pages/kapitana/mock/clearance-kapitana-mock";
import { mockKapitanaFtjsStats } from "../pages/kapitana/mock/ftjs-kapitana-mock";
import { mockLuponDashboardStats } from "../pages/kapitana/mock/lupon-kapitana-mock";
import { MOCK_VAWC_STATS } from "../pages/kapitana/vawc-module/mock-data";

type QuickLink = {
  to: string;
  label: string;
  description: string;
};

const QUICK_LINKS: QuickLink[] = [
  {
    to: "/official-portal/blotter/docket",
    label: "Blotter docket",
    description: "Active cases at the barangay justice desk.",
  },
  {
    to: "/official-portal/blotter/records",
    label: "For-the-record (FTR)",
    description: "Recorded incidents — status RECORDED only here.",
  },
  {
    to: "/official-portal/blotter/reports",
    label: "Blotter reports",
    description: "Trends, nature of cases, and settlement view.",
  },
  {
    to: "/official-portal/vawc/cases",
    label: "VAWC cases",
    description: "Protection orders and case follow-up.",
  },
  {
    to: "/official-portal/vawc/reports",
    label: "VAWC reports",
    description: "Stats, categories, and incident trend.",
  },
  {
    to: "/official-portal/clearance/issued-certificates",
    label: "Issued certificates",
    description: "Barangay clearance and related issuances.",
  },
  {
    to: "/official-portal/clearance/revenue-and-collection",
    label: "Revenue & collection",
    description: "Fees, OR tracking, and collections trend.",
  },
  {
    to: "/official-portal/ftjs/management",
    label: "FTJS management",
    description: "First-time job seeker applications.",
  },
  {
    to: "/official-portal/ftjs/reports",
    label: "FTJS reports",
    description: "Issuance summary and monthly trend.",
  },
  {
    to: "/official-portal/lupon/cases",
    label: "Lupon cases",
    description: "Referred cases and conciliation status.",
  },
  {
    to: "/official-portal/lupon/reports",
    label: "Lupon reports",
    description: "DILG-style summaries and mediation metrics.",
  },
];

export default function OfficialDashboard() {
  const demo = useKapitanaMockData();
  const blotter = demo ? mockDocketStats() : null;
  const blotterPulse = demo ? mockDashboardStats() : null;
  const ftr = demo ? mockRecordStats() : null;
  const vawc = demo ? MOCK_VAWC_STATS : null;
  const clearance = demo ? mockKapitanaIssuedStats() : null;
  const ftjs = demo ? mockKapitanaFtjsStats : null;
  const lupon = demo ? mockLuponDashboardStats() : null;

  const dash = (v: number | string | undefined) =>
    demo && v !== undefined ? String(v) : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Official portal</h1>
        <p className="max-w-3xl text-sm text-slate-600 md:text-base">
          Overview of blotter, VAWC, clearance, first-time job seekers, and Lupon
          work. Open a module below for full lists and reports.
        </p>
        {!demo && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 inline-block">
            Demo KPI numbers appear when mock mode is on (
            <code className="text-[11px]">VITE_KAPITANA_USE_MOCK</code> or dev
            default). Links always work.
          </p>
        )}
      </header>

      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          Key metrics
        </h2>
        <KPIGrid columns={6}>
          <KPICard
            title="Blotter (docket)"
            value={dash(blotter?.totalEntries)}
            subtitle={
              demo
                ? `${blotter?.activeCases ?? 0} active · ${blotter?.resolved ?? 0} resolved`
                : "Open docket for live counts"
            }
            icon={KPIIcons.document}
            color="blue"
          />
          <KPICard
            title="FTR recorded"
            value={dash(ftr?.totalFtr)}
            subtitle={demo ? ftr?.mostReportedIssue ?? "" : "Records module only"}
            icon={KPIIcons.issued}
            color="slate"
          />
          <KPICard
            title="VAWC cases"
            value={dash(vawc?.totalCases)}
            subtitle={
              demo
                ? `${vawc?.totalPending ?? 0} pending · ${vawc?.totalClose ?? 0} closed`
                : "Open VAWC cases"
            }
            icon={<HeartHandshake className="h-5 w-5" />}
            color="rose"
          />
          <KPICard
            title="Certificates issued"
            value={dash(clearance?.totalIssued)}
            subtitle={
              demo
                ? `₱${(clearance?.totalRevenue ?? 0).toLocaleString()} revenue (demo)`
                : "Issued certificates list"
            }
            icon={<Award className="h-5 w-5" />}
            color="emerald"
          />
          <KPICard
            title="FTJS certificates"
            value={dash(ftjs?.totalCertificatesIssued)}
            subtitle={
              demo
                ? `${ftjs?.originalIssuances ?? 0} original · ${ftjs?.reIssuances ?? 0} re-issuance`
                : "FTJS management"
            }
            icon={KPIIcons.total}
            color="violet"
          />
          <KPICard
            title="Lupon (referred)"
            value={dash(lupon?.totalReferred)}
            subtitle={
              demo
                ? `${lupon?.activeConciliation ?? 0} in conciliation · ${lupon?.successfullySettled ?? 0} settled`
                : "Lupon cases"
            }
            icon={<Scale className="h-5 w-5" />}
            color="amber"
          />
        </KPIGrid>
      </section>

      {demo && blotterPulse && (
        <section
          className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 md:p-5"
          aria-label="Blotter desk pulse"
        >
          <h2 className="text-sm font-semibold text-slate-800 mb-3">
            Blotter desk (demo)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <p className="text-slate-500">Hearings today</p>
              <p className="text-lg font-semibold text-slate-900">
                {blotterPulse.hearingsToday}
              </p>
            </div>
            <div>
              <p className="text-slate-500">New / pending intake</p>
              <p className="text-lg font-semibold text-slate-900">
                {blotterPulse.pendingNewCases}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Nearing follow-up</p>
              <p className="text-lg font-semibold text-slate-900">
                {blotterPulse.nearingDeadline}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Settled (sample month)</p>
              <p className="text-lg font-semibold text-slate-900">
                {blotterPulse.settledThisMonth}
              </p>
            </div>
          </div>
        </section>
      )}

      {demo && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            aria-labelledby="recent-blotter"
          >
            <h2
              id="recent-blotter"
              className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-blue-600" />
              Recent docket entries
            </h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {mockRecentCases().map((c) => (
                <li key={c.id} className="py-2.5 first:pt-0">
                  <p className="font-medium text-slate-900">{c.blotterNumber}</p>
                  <p className="text-slate-600 line-clamp-1">{c.caseType}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.status} · {c.dateFiled}
                  </p>
                </li>
              ))}
            </ul>
            <Link
              to="/official-portal/blotter/docket"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              View docket <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            aria-labelledby="upcoming-hearings"
          >
            <h2
              id="upcoming-hearings"
              className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"
            >
              <ScrollText className="h-4 w-4 text-amber-600" />
              Upcoming hearings
            </h2>
            <ul className="space-y-3 text-sm">
              {mockUpcomingHearings().map((h) => (
                <li
                  key={h.hearingId}
                  className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-100"
                >
                  <p className="font-medium text-slate-900">{h.caseTitle}</p>
                  <p className="text-slate-600">{h.blotterNumber}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(h.scheduledStart).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
            <Link
              to="/official-portal/blotter/docket"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Schedule & docket <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      )}

      <section aria-labelledby="modules-heading">
        <h2 id="modules-heading" className="text-lg font-semibold text-slate-900 mb-3">
          Modules
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_LINKS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <span className="font-medium text-slate-900">{item.label}</span>
                <span className="mt-1 text-sm text-slate-600 flex-1">
                  {item.description}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
                  Open <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
