import type { IssuedCertificate, IssuedStats } from "../../../clearance-api/types";
import type {
  DailyCollectionResponseDTO,
  RevenueResponseByCertificate,
  RevenueStatsResponseDTO,
  RevenueTrendDTO,
} from "../../../service/clearance-api/revenue";

const CERT_TYPES = [
  "Barangay Clearance",
  "Indigency Certificate",
  "Residency Certificate",
  "Business Permit",
  "Job Seeker Clearance",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Raw rows para sa `normalizeIssuedRows` / revenue helpers */
export function mockKapitanaClearanceIssuedRaw(): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const now = new Date();
  for (let i = 0; i < 18; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (i % 14));
    const fee = i % 4 === 0 ? 0 : 50 + (i % 3) * 25;
    const released = true;
    out.push({
      id: `mock-cert-${i + 1}`,
      templateId: String((i % 5) + 1),
      certificateType: CERT_TYPES[i % CERT_TYPES.length],
      requesterName: ["Ana Reyes", "Pedro Cruz", "Liza Tan", "Marco Lim"][i % 4],
      issuedBy: "Brgy. Treasurer (demo)",
      status: released ? "Released" : "Pending",
      dateIssued: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      isFree: fee === 0,
      fee,
      orNumber: released && fee > 0 ? `OR-2026-${1000 + i}` : "",
    });
  }
  return out;
}

export function mockKapitanaIssuedStats(): IssuedStats {
  const rows = mockKapitanaClearanceIssuedRaw();
  const paid = rows.filter(
    (r) => String(r.status) === "Released" && toNumber(r.fee) > 0,
  );
  const free = rows.filter((r) => toNumber(r.fee) <= 0);
  const revenue = paid.reduce((s, r) => s + toNumber(r.fee), 0);
  return {
    totalIssued: rows.length,
    totalRevenue: revenue,
    totalFreeCertificates: free.length,
    totalPaidCertificates: paid.length,
    revenueGrowth: 4.2,
    revenueDirection: "up",
  };
}

function toNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function mockKapitanaIssuedCertificateList(): IssuedCertificate[] {
  return mockKapitanaClearanceIssuedRaw().map((row, index) => ({
    id: String(row.id ?? index),
    templateId: String(row.templateId ?? "1"),
    certificateType: String(row.certificateType),
    requesterName: String(row.requesterName),
    issuedBy: String(row.issuedBy),
    status: row.status as IssuedCertificate["status"],
    dateIssued: String(row.dateIssued),
    isFree: Boolean(row.isFree),
    fee: toNumber(row.fee),
    orNumber: String(row.orNumber ?? ""),
  }));
}

export function mockKapitanaRevenueStats(): RevenueStatsResponseDTO {
  const rows = mockKapitanaClearanceIssuedRaw();
  const active = rows.filter((r) => String(r.status) === "Released");
  const total = active.reduce((s, r) => s + toNumber(r.fee), 0);
  return {
    totalRevenue: total,
    totalRevenueThisWeek: Math.round(total * 0.12),
    totalRevenueThisMonth: Math.round(total * 0.45),
    totalRevenueThisYear: total,
  };
}

export function mockKapitanaRevenueByType(): RevenueResponseByCertificate[] {
  const map = new Map<string, RevenueResponseByCertificate>();
  for (const row of mockKapitanaClearanceIssuedRaw()) {
    if (String(row.status) !== "Released") continue;
    const title = String(row.certificateType);
    const fee = toNumber(row.fee);
    const cur = map.get(title) ?? {
      certificateTitle: title,
      count: 0,
      fee,
      totalRevenue: 0,
    };
    map.set(title, {
      ...cur,
      count: cur.count + 1,
      fee: fee > 0 ? fee : cur.fee,
      totalRevenue: cur.totalRevenue + fee,
    });
  }
  return [...map.values()].sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function mockKapitanaDailyCollections(
  dateFrom: string,
  dateTo: string,
): DailyCollectionResponseDTO[] {
  const start = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T23:59:59`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const byDay = new Map<string, { issue: number; rev: number }>();
  for (const row of mockKapitanaClearanceIssuedRaw()) {
    if (String(row.status) !== "Released") continue;
    const ds = String(row.dateIssued).slice(0, 10);
    const d = new Date(ds);
    if (d < start || d > end) continue;
    const cur = byDay.get(ds) ?? { issue: 0, rev: 0 };
    cur.issue += 1;
    cur.rev += toNumber(row.fee);
    byDay.set(ds, cur);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      totalCertIssue: v.issue,
      totalCollections: v.rev,
      oRNumberStartToEnd: "—",
    }));
}

export function mockKapitanaRevenueTrend(
  dateFrom: string,
  dateTo: string,
): RevenueTrendDTO[] {
  return mockKapitanaDailyCollections(dateFrom, dateTo).map((d) => ({
    label: d.date,
    revenue: d.totalCollections,
  }));
}
