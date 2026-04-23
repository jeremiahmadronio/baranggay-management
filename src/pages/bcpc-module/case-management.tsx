import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { KPICard, KPIGrid, KPIIcons } from "../../hooks/KPICard";
import { TableFilter } from "../../hooks/TableFilter";
import { Table, type TableColumn } from "../../hooks/Table";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CaseSummaryDTO {
  id: number;
  caseNumber: string;
  victimFullName: string;
  violenceTypes: string;
  status: string;
  dateFiled: string;
  assignedOfficer: string;
}

interface CaseStatsDTO {
  totalPending: number;
  totalClose: number;
  totalExpiringSoon: number;
  totalCases: number;
}

interface ViolenceOptionDTO {
  type: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CASES: CaseSummaryDTO[] = [
  { id: 1,  caseNumber: "BCPC-2026-0001", victimFullName: "Maria Dela Cruz",     violenceTypes: "Physical, Psychological",           status: "PENDING",                   dateFiled: "2026-01-05", assignedOfficer: "Off. Reyes" },
  { id: 2,  caseNumber: "BCPC-2026-0002", victimFullName: "Ana Santos",          violenceTypes: "Sexual",                            status: "ONGOING",                   dateFiled: "2026-01-10", assignedOfficer: "Off. Mendoza" },
  { id: 3,  caseNumber: "BCPC-2026-0003", victimFullName: "Luz Garcia",          violenceTypes: "Economic, Psychological",            status: "RESOLVED",                  dateFiled: "2026-01-14", assignedOfficer: "Off. Reyes" },
  { id: 4,  caseNumber: "BCPC-2026-0004", victimFullName: "Rosa Villanueva",     violenceTypes: "Physical",                          status: "UNDER_INTERVENTION",        dateFiled: "2026-01-18", assignedOfficer: "Off. Cruz" },
  { id: 5,  caseNumber: "BCPC-2026-0005", victimFullName: "Elena Bautista",      violenceTypes: "Psychological",                     status: "REFERRED",                  dateFiled: "2026-01-22", assignedOfficer: "Off. Mendoza" },
  { id: 6,  caseNumber: "BCPC-2026-0006", victimFullName: "Carmen Lopez",        violenceTypes: "Physical, Sexual",                  status: "CERTIFIED_TO_FILE_ACTION",  dateFiled: "2026-02-01", assignedOfficer: "Off. Cruz" },
  { id: 7,  caseNumber: "BCPC-2026-0007", victimFullName: "Imelda Torres",       violenceTypes: "Economic",                          status: "DISMISSED",                 dateFiled: "2026-02-05", assignedOfficer: "Off. Reyes" },
  { id: 8,  caseNumber: "BCPC-2026-0008", victimFullName: "Norma Aquino",        violenceTypes: "Physical, Economic",                status: "WITHDRAWN",                 dateFiled: "2026-02-09", assignedOfficer: "Off. Mendoza" },
  { id: 9,  caseNumber: "BCPC-2026-0009", victimFullName: "Gloria Ramos",        violenceTypes: "Psychological",                     status: "PENDING",                   dateFiled: "2026-02-14", assignedOfficer: "Off. Cruz" },
  { id: 10, caseNumber: "BCPC-2026-0010", victimFullName: "Perla Castillo",      violenceTypes: "Sexual, Psychological",             status: "ONGOING",                   dateFiled: "2026-02-18", assignedOfficer: "Off. Reyes" },
  { id: 11, caseNumber: "BCPC-2026-0011", victimFullName: "Josefa Navarro",      violenceTypes: "Physical",                          status: "RESOLVED",                  dateFiled: "2026-02-22", assignedOfficer: "Off. Cruz" },
  { id: 12, caseNumber: "BCPC-2026-0012", victimFullName: "Teresita Soriano",    violenceTypes: "Economic, Physical",                status: "PENDING",                   dateFiled: "2026-03-01", assignedOfficer: "Off. Mendoza" },
  { id: 13, caseNumber: "BCPC-2026-0013", victimFullName: "Maribel Abad",        violenceTypes: "Psychological",                     status: "UNDER_INTERVENTION",        dateFiled: "2026-03-05", assignedOfficer: "Off. Reyes" },
  { id: 14, caseNumber: "BCPC-2026-0014", victimFullName: "Corazon Manalang",    violenceTypes: "Sexual",                            status: "REFERRED",                  dateFiled: "2026-03-09", assignedOfficer: "Off. Cruz" },
  { id: 15, caseNumber: "BCPC-2026-0015", victimFullName: "Florencia Padilla",   violenceTypes: "Physical, Psychological, Economic", status: "ONGOING",                   dateFiled: "2026-03-14", assignedOfficer: "Off. Mendoza" },
];

const MOCK_VIOLENCE_OPTIONS: ViolenceOptionDTO[] = [
  { type: "Physical" },
  { type: "Sexual" },
  { type: "Psychological" },
  { type: "Economic" },
];

const MOCK_STATS: CaseStatsDTO = {
  totalPending:      MOCK_CASES.filter((c) => c.status === "PENDING").length,
  totalClose:        MOCK_CASES.filter((c) => c.status === "RESOLVED").length,
  totalExpiringSoon: 3,
  totalCases:        MOCK_CASES.length,
};

const MOCK_RESOLVED_CASES = MOCK_CASES.filter((c) => c.status === "RESOLVED").length;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VIOLENCE_TYPE_TONE: string[] = [
  "bg-rose-50 text-rose-700 border border-rose-200",
  "bg-amber-50 text-amber-700 border border-amber-200",
  "bg-blue-50 text-blue-700 border border-blue-200",
  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "bg-violet-50 text-violet-700 border border-violet-200",
];

const STATUS_LABEL_OVERRIDES: Record<string, string> = {
  UNDER_MEDIATION: "Under Intervention",
};

const formatStatusLabel = (status: string) =>
  STATUS_LABEL_OVERRIDES[status] ??
  status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const formatNameAsInitials = (fullName?: string) => {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "-";
  return parts.map((part) => `${part.charAt(0).toUpperCase()}.`).join(" ");
};

const getStatusPillClass = (status: string) => {
  switch (status) {
    case "PENDING":                  return "bg-amber-50 text-amber-700 border border-amber-200";
    case "ONGOING":                  return "bg-blue-50 text-blue-700 border border-blue-200";
    case "UNDER_MEDIATION":
    case "UNDER_INTERVENTION":       return "bg-sky-50 text-sky-700 border border-sky-200";
    case "RESOLVED":                 return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "CERTIFIED_TO_FILE_ACTION": return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    case "REFERRED":                 return "bg-violet-50 text-violet-700 border border-violet-200";
    case "WITHDRAWN":                return "bg-gray-100 text-gray-600 border border-gray-200";
    case "DISMISSED":                return "bg-rose-50 text-rose-700 border border-rose-200";
    default:                         return "bg-gray-100 text-gray-600 border border-gray-200";
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BcpcCaseManagement() {
  const navigate = useNavigate();

  const [stats]          = useState<CaseStatsDTO>(MOCK_STATS);
  const [resolvedCases]  = useState<number>(MOCK_RESOLVED_CASES);
  const [violenceOptions] = useState<ViolenceOptionDTO[]>(MOCK_VIOLENCE_OPTIONS);

  const [cases, setCases]               = useState<CaseSummaryDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [currentPage, setCurrentPage]     = useState(0);

  const [loadingTable, setLoadingTable] = useState(false);
  const [tableError, setTableError]     = useState<string | null>(null);

  const [search, setSearch]             = useState("");
  const [status, setStatus]             = useState("");
  const [violenceType, setViolenceType] = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");

  const SIZE = 10;

  // ── Filter + paginate mock data locally ─────────────────────────────────────
  const fetchCases = () => {
    try {
      setLoadingTable(true);
      setTableError(null);

      let filtered = [...MOCK_CASES];

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.caseNumber.toLowerCase().includes(q) ||
            c.victimFullName.toLowerCase().includes(q),
        );
      }

      if (status) {
        filtered = filtered.filter((c) => c.status === status);
      }

      if (violenceType) {
        filtered = filtered.filter((c) =>
          c.violenceTypes.toLowerCase().includes(violenceType.toLowerCase()),
        );
      }

      if (dateFrom) {
        filtered = filtered.filter((c) => c.dateFiled >= dateFrom);
      }

      if (dateTo) {
        filtered = filtered.filter((c) => c.dateFiled <= dateTo);
      }

      const total = filtered.length;
      const pages = Math.ceil(total / SIZE) || 1;
      const safePage = Math.min(currentPage, pages - 1);
      const slice = filtered.slice(safePage * SIZE, safePage * SIZE + SIZE);

      setCases(slice);
      setTotalElements(total);
      setTotalPages(pages);
      setCurrentPage(safePage);
    } catch (err) {
      console.error("Error filtering cases:", err);
      setCases([]);
      setTotalElements(0);
      setTotalPages(0);
      setTableError("Failed to load BCPC cases.");
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [search, status, violenceType, dateFrom, dateTo, currentPage]);

  // ── Table columns ────────────────────────────────────────────────────────────
  const columns: TableColumn<CaseSummaryDTO>[] = [
    { key: "caseNumber", header: "CASE NUMBER", align: "left" },
    {
      key: "victimFullName",
      header: "VICTIM",
      align: "left",
      render: (item) => formatNameAsInitials(item.victimFullName),
    },
    {
      key: "violenceTypes",
      header: "VIOLENCE TYPE",
      align: "left",
      render: (item) => {
        const types = item.violenceTypes
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);

        return types.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {types.map((v, index) => (
              <span
                key={`${item.id}-${v}-${index}`}
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  VIOLENCE_TYPE_TONE[index % VIOLENCE_TYPE_TONE.length]
                }`}
              >
                {v}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      },
    },
    {
      key: "status",
      header: "STATUS",
      align: "center",
      render: (item) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusPillClass(item.status)}`}
        >
          {formatStatusLabel(item.status)}
        </span>
      ),
    },
    {
      key: "dateFiled",
      header: "DATE FILED",
      align: "left",
      render: (item) =>
        item.dateFiled
          ? new Date(item.dateFiled).toLocaleDateString("en-PH")
          : "-",
    },
    { key: "assignedOfficer", header: "ASSIGNED OFFICER", align: "left" },
    {
     key: "actions",
  header: "ACTION",
  align: "center",
  render: (item) => (
    <button
      onClick={() => navigate(`/bcpc/casedetailview?id=${item.id}`)}
      className="rounded-lg p-2 text-neutral-400 hover:bg-gray-50 hover:text-blue-600 transition-colors"
      title="View case details"
    >
      <Eye className="h-5 w-5" />
    </button>
      ),
    },
  ];

  // ── Filter configs ───────────────────────────────────────────────────────────
  const filterConfigs = [
    {
      label: "Violence Type",
      key: "violenceType",
      options: violenceOptions.map((o) => ({ value: o.type, label: o.type })),
      value: violenceType,
    },
    {
      label: "Status",
      key: "status",
      options: [
        { value: "PENDING",                  label: "Pending" },
        { value: "ONGOING",                  label: "Active" },
        { value: "UNDER_INTERVENTION",       label: "Under Intervention" },
        { value: "RESOLVED",                 label: "Resolved" },
        { value: "CERTIFIED_TO_FILE_ACTION", label: "Certified To File Action" },
        { value: "REFERRED",                 label: "Referred" },
        { value: "WITHDRAWN",                label: "Withdrawn" },
        { value: "DISMISSED",                label: "Dismissed" },
      ],
      value: status,
    },
  ];

  const dateRangeConfig = {
    startLabel: "Date Filed From",
    endLabel: "To",
    startValue: dateFrom,
    endValue: dateTo,
    onStartChange: (value: string) => { setDateFrom(value); setCurrentPage(0); },
    onEndChange:   (value: string) => { setDateTo(value);   setCurrentPage(0); },
  };

  const activeFilterCount = [violenceType, status, dateFrom, dateTo].filter(Boolean).length;

  const handleSearchChange = (value: string) => { setSearch(value); setCurrentPage(0); };
  const handleFilterChange = (key: string, value: string) => {
    if (key === "violenceType") setViolenceType(value);
    else if (key === "status")  setStatus(value);
    setCurrentPage(0);
  };
  const handleClearAll = () => {
    setSearch(""); setStatus(""); setViolenceType("");
    setDateFrom(""); setDateTo(""); setCurrentPage(0);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <KPIGrid columns={4}>
            <KPICard
              title="Pending Cases"
              value={stats.totalPending.toLocaleString()}
              icon={KPIIcons["clock"]}
              color="amber"
              subtitle="Awaiting action or review"
            />
            <KPICard
              title="Closed Cases"
              value={resolvedCases.toLocaleString()}
              icon={KPIIcons["check"]}
              color="emerald"
              subtitle="Cases marked resolved"
            />
            <KPICard
              title="Expiring Soon"
              value={stats.totalExpiringSoon.toLocaleString()}
              icon={KPIIcons["month"]}
              color="rose"
              subtitle="Cases within 3 days"
            />
            <KPICard
              title="Total Cases"
              value={stats.totalCases.toLocaleString()}
              icon={KPIIcons["document"]}
              color="blue"
              subtitle="All BCPC records"
            />
          </KPIGrid>
        </div>

        {tableError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {tableError}
          </div>
        )}

        <TableFilter
          searchPlaceholder="Search by Case Number or Victim Name..."
          searchValue={search}
          onSearchChange={handleSearchChange}
          filters={filterConfigs}
          onFilterChange={handleFilterChange}
          dateRange={dateRangeConfig}
          showSearch={true}
          showFilterButton={false}
          showClearButton={true}
          clearButtonText="Clear All Filters"
          activeFilterCount={activeFilterCount}
          onClearClick={handleClearAll}
        />

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <Table
            columns={columns}
            data={cases}
            keyExtractor={(item) => item.id}
            emptyMessage="No cases found."
            loading={loadingTable}
            hoverable={true}
            striped={false}
            pagination={{
              currentPage: currentPage + 1,
              totalPages:  totalPages || 1,
              totalItems:  totalElements,
              itemsPerPage: SIZE,
              onPageChange: (page) => setCurrentPage(page - 1),
            }}
          />
        </div>
      </div>
    </div>
  );
}