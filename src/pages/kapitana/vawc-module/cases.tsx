'use client';

import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type {
  CaseSummaryDTO,
  CaseStatsDTO,
} from "../../../service/vawc-api/vawc-api";

import { KPICard, KPIGrid, KPIIcons } from "../../../hooks/KPICard";
import { TableFilter } from "../../../hooks/TableFilter";
import { Table, type TableColumn } from "../../../hooks/Table";

import {
  MOCK_VAWC_STATS,
  MOCK_RESOLVED_CASES,
  MOCK_CASES,
  MOCK_VIOLENCE_OPTIONS,
} from "./mock-data";

const VIOLENCE_TYPE_TONE: string[] = [
  'bg-rose-50 text-rose-700 border border-rose-200',
  'bg-amber-50 text-amber-700 border border-amber-200',
  'bg-blue-50 text-blue-700 border border-blue-200',
  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'bg-violet-50 text-violet-700 border border-violet-200',
];

const STATUS_LABEL_OVERRIDES: Record<string, string> = {
  UNDER_MEDIATION: 'Under Intervention',
};

const formatStatusLabel = (status: string) =>
  STATUS_LABEL_OVERRIDES[status] ??
  status
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const formatNameAsInitials = (fullName?: string) => {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '-';

  return parts.map((part) => `${part.charAt(0).toUpperCase()}.`).join(' ');
};

const getStatusPillClass = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'ONGOING':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'UNDER_MEDIATION':
    case 'UNDER_INTERVENTION':
      return 'bg-sky-50 text-sky-700 border border-sky-200';
    case 'RESOLVED':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'CERTIFIED_TO_FILE_ACTION':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    case 'REFERRED':
      return 'bg-violet-50 text-violet-700 border border-violet-200';
    case 'WITHDRAWN':
      return 'bg-gray-100 text-gray-600 border border-gray-200';
    case 'DISMISSED':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-200';
  }
};

export default function KapitanaVawcCaseTable() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<CaseStatsDTO | null>(null);
  const [resolvedCases, setResolvedCases] = useState(0);
  const [cases, setCases] = useState<CaseSummaryDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [loadingTable, setLoadingTable] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [tableError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [violenceType, setViolenceType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const size = 10;

  // ── Load mock stats ──
  useEffect(() => {
    setLoadingStats(true);
    const timer = setTimeout(() => {
      setStats(MOCK_VAWC_STATS);
      setResolvedCases(MOCK_RESOLVED_CASES);
      setLoadingStats(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // ── Load mock cases with filtering ──
  useEffect(() => {
    setLoadingTable(true);
    const timer = setTimeout(() => {
      let filtered = [...MOCK_CASES];

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.caseNumber.toLowerCase().includes(q) ||
            c.victimFullName.toLowerCase().includes(q)
        );
      }
      if (status) {
        filtered = filtered.filter((c) => c.status === status);
      }
      if (violenceType) {
        filtered = filtered.filter((c) =>
          c.violenceTypes.toLowerCase().includes(violenceType.toLowerCase())
        );
      }
      if (dateFrom) {
        filtered = filtered.filter((c) => c.dateFiled >= dateFrom);
      }
      if (dateTo) {
        filtered = filtered.filter((c) => c.dateFiled <= dateTo);
      }

      const start = currentPage * size;
      const paged = filtered.slice(start, start + size);

      setCases(paged);
      setTotalElements(filtered.length);
      setTotalPages(Math.ceil(filtered.length / size));
      setLoadingTable(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, status, violenceType, dateFrom, dateTo, currentPage]);

  const safeStats: CaseStatsDTO = stats || {
    totalPending: 0,
    totalClose: 0,
    totalExpiringSoon: 0,
    totalCases: 0,
  };

  const columns: TableColumn<CaseSummaryDTO>[] = [
    { key: "caseNumber", header: "CASE NUMBER", align: "left" },
    {
      key: "victimFullName",
      header: "VICTIM",
      align: "left",
      render: (item: CaseSummaryDTO) => formatNameAsInitials(item.victimFullName),
    },
    {
      key: "violenceTypes",
      header: "VIOLENCE TYPE",
      align: "left",
      render: (item: CaseSummaryDTO) => {
        const violenceTypes = item.violenceTypes
          ?.split(',')
          .map((entry) => entry.trim())
          .filter(Boolean) ?? [];

        return violenceTypes.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {violenceTypes.map((entry, index) => (
              <span
                key={`${item.id}-${entry}-${index}`}
                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${VIOLENCE_TYPE_TONE[index % VIOLENCE_TYPE_TONE.length]}`}
              >
                {entry}
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
      render: (item: CaseSummaryDTO) => (
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
      render: (item: CaseSummaryDTO) =>
        item.dateFiled
          ? new Date(item.dateFiled).toLocaleDateString("en-PH")
          : "-",
    },
    { key: "assignedOfficer", header: "ASSIGNED OFFICER", align: "left" },
    {
      key: "actions",
      header: "ACTION",
      align: "center",
      render: (item: CaseSummaryDTO) => (
        <button
          onClick={() => {
            navigate(`/official-portal/vawc/casedetailview?id=${item.id}`);
          }}
          className="rounded-lg p-2 transition-colors text-neutral-400 hover:bg-gray-50 hover:text-blue-600"
          title="View case details"
        >
          <Eye className="h-5 w-5" />
        </button>
      ),
    },
  ];

  const filterConfigs = [
    {
      label: "Violence Type",
      key: "violenceType",
      options: MOCK_VIOLENCE_OPTIONS.map((option) => ({
        value: option.type,
        label: option.type,
      })),
      value: violenceType,
    },
    {
      label: "Status",
      key: "status",
      options: [
        { value: "PENDING", label: "Pending" },
        { value: "UNDER_INTERVENTION", label: "Under Intervention" },
        { value: "RESOLVED", label: "Resolved" },
        { value: "CERTIFIED_TO_FILE_ACTION", label: "Certified To File Action" },
        { value: "WITHDRAWN", label: "Withdrawn" },
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
    onEndChange: (value: string) => { setDateTo(value); setCurrentPage(0); },
  };

  const activeFilterCount = [violenceType, status, dateFrom, dateTo].filter(Boolean).length;

  const handleSearchChange = (value: string) => { setSearch(value); setCurrentPage(0); };
  const handleFilterChange = (key: string, value: string) => {
    if (key === "violenceType") setViolenceType(value);
    else if (key === "status") setStatus(value);
    setCurrentPage(0);
  };
  const handleClearAll = () => {
    setSearch(''); setStatus(''); setViolenceType(''); setDateFrom(''); setDateTo('');
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <KPIGrid columns={4}>
            <KPICard
              title="Pending Cases"
              value={loadingStats ? "—" : safeStats.totalPending.toLocaleString()}
              icon={KPIIcons["clock"]}
              color="amber"
              subtitle="Awaiting action or review"
            />
            <KPICard
              title="Closed Cases"
              value={loadingStats ? "—" : resolvedCases.toLocaleString()}
              icon={KPIIcons["check"]}
              color="emerald"
              subtitle="Cases marked resolved"
            />
            <KPICard
              title="Expiring Soon"
              value={loadingStats ? "—" : safeStats.totalExpiringSoon.toLocaleString()}
              icon={KPIIcons["month"]}
              color="rose"
              subtitle="Cases within 3 days"
            />
            <KPICard
              title="Total Cases"
              value={loadingStats ? "—" : safeStats.totalCases.toLocaleString()}
              icon={KPIIcons["document"]}
              color="blue"
              subtitle="All VAWC records"
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
              totalPages: totalPages || 1,
              totalItems: totalElements,
              itemsPerPage: size,
              onPageChange: (page) => setCurrentPage(page - 1),
            }}
          />
        </div>
      </div>
    </div>
  );
}