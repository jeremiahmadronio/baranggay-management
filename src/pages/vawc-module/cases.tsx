'use client';

import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { 
  getVawcCaseSummary,
  getVawcStats, 
  getViolenceOptions,
  type CaseSummaryDTO, 
  type CaseStatsDTO,
  type ViolenceOptionDTO,
} from "../../service/vawc-api/vawc-api";

import { KPICard, KPIGrid, KPIIcons } from "../../reusable/KPICard";
import { TableFilter } from "../../reusable/TableFilter";
import { Table, type TableColumn } from "../../reusable/Table";

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

export default function VawcCaseTable() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<CaseStatsDTO | null>(null);
  const [cases, setCases] = useState<CaseSummaryDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [loadingTable, setLoadingTable] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);
  const [violenceOptions, setViolenceOptions] = useState<ViolenceOptionDTO[]>([]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [violenceType, setViolenceType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const size = 10;

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const data = await getVawcStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCases = async () => {
    try {
      setLoadingTable(true);
      setTableError(null);

      const response = await getVawcCaseSummary({
        search: search || undefined,
        status: status || undefined,
        violenceType: violenceType || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: currentPage,
        size,
      });

      setCases(response.content);
      setTotalElements(response.page.totalElements);
      setTotalPages(response.page.totalPages);
      setCurrentPage(response.page.number);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setCases([]);
      setTotalElements(0);
      setTotalPages(0);
      setTableError('Failed to load VAWC cases.');
    } finally {
      setLoadingTable(false);
    }
  };

  const fetchViolenceOptions = async () => {
    try {
      const data = await getViolenceOptions();
      setViolenceOptions(data);
    } catch (err) {
      console.error('Error fetching violence options:', err);
      setViolenceOptions([]);
    }
  };

  useEffect(() => {
    fetchViolenceOptions();
  }, []);

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    fetchCases();
  }, [search, status, violenceType, dateFrom, dateTo, currentPage]);

  const safeStats: CaseStatsDTO = stats || {
    totalPending: 0,
    totalClose: 0,
    totalExpiringSoon: 0,
    totalCases: 0,
  };

  const columns: TableColumn<CaseSummaryDTO>[] = [
    { key: "caseNumber", header: "CASE NUMBER", align: "left" },
    { key: "victimFullName", header: "VICTIM", align: "left" },
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
          onClick={() => navigate(`/vawc/casedetailview?id=${item.id}`)}
          className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-gray-50 hover:text-blue-600"
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
      options: [
        ...violenceOptions.map((option) => ({
          value: option.type,
          label: option.type,
        })),
      ],
      value: violenceType,
    },
    {
      label: "Status",
      key: "status",
      options: [
        { value: "PENDING", label: "Pending" },
        { value: "ONGOING", label: "Active" },
        { value: "UNDER_INTERVENTION", label: "Under Intervention" },
        { value: "RESOLVED", label: "Resolved" },
        { value: "CERTIFIED_TO_FILE_ACTION", label: "Certified To File Action" },
        { value: "REFERRED", label: "Referred" },
        { value: "WITHDRAWN", label: "Withdrawn" },
        { value: "DISMISSED", label: "Dismissed" },
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

        <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
          <button className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
            Export Records
          </button>
        </div>

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
              value={loadingStats ? "—" : safeStats.totalClose.toLocaleString()}
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