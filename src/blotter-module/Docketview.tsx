import {BlotterDocketDetailView} from './Blotterdocketdetailview';
import { useState, useEffect, useCallback } from 'react';
import { Eye, AlertCircle } from 'lucide-react';
import { KPICard, KPIGrid, KPIIcons } from '../reusable/KPICard';
import { Table, type TableColumn } from '../reusable';
import { TableFilter } from '../reusable/TableFilter';
import type { DocketTableParams, BlotterSummaryDTO, BlotterStatsDTO } from '../blotter-api/DocketView';
import { getDocketTable, getDocketStats, updateCaseStatus } from '../blotter-api/DocketView';
import { getMyAccess, type UserSecurityProfile } from '../blotter-api/BlotterPermission';
import { getNatureOfComplaintOptions, type NatureOptionDTO } from '../blotter-api/BlotterFormComplaint';
import { StatusBadge, type StatusType } from '../reusable/StatusBadge';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const hasPerm = (user: UserSecurityProfile | null, perm: string) =>
  user?.permissions.includes(perm) ?? false;

// ─── Config ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// Status options are static enums — hardcoded is correct here
const STATUS_FILTER_OPTIONS = [
  { label: 'Pending',           value: 'PENDING' },
  { label: 'Settled',           value: 'SETTLED' },
  { label: 'Dismissed',         value: 'DISMISSED' },
  { label: 'Under Mediation',   value: 'UNDER_MEDIATION' },
  { label: 'Escalate to Lupon', value: 'REFERRED_TO_LUPON' },
  { label: 'Expired / Unactioned',          value: 'EXPIRED_UNACTIONED' },
];

// Direct StatusType mapping — no middleman
const DOCKET_STATUS_MAP: Record<string, { type: StatusType; label: string }> = {
  DISMISSED:         { type: 'danger',  label: 'Dismissed' },
  UNDER_MEDIATION:   { type: 'info',    label: 'Under Mediation' },
  PENDING:           { type: 'pending', label: 'Pending' },
  REFERRED_TO_LUPON: { type: 'info',    label: 'Referred to Lupon' },
  EXPIRED_UNACTIONED:          { type: 'warning', label: 'Expired / Unactioned' },
  SETTLED:           { type: 'success', label: 'Settled' },
};

// ─── Forward to Lupon Modal ───────────────────────────────────────────────────

interface ForwardModalProps {
  entry: BlotterSummaryDTO;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const ForwardToLuponModal = ({ entry, onConfirm, onCancel, loading }: ForwardModalProps) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-800">Escalate to Lupon</h2>
          <p className="text-xs text-gray-500">This action will escalate the case to Lupon Tagapamayapa.</p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 my-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Case No.</span>
          <span className="font-medium text-blue-600">{entry.blotterNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Complainant</span>
          <span className="font-medium text-gray-800">{entry.complainantName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Respondent</span>
          <span className="font-medium text-gray-800">{entry.respondentName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Nature</span>
          <span className="font-medium text-gray-800 text-right max-w-[200px]">{entry.natureOfComplaint}</span>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Confirm Escalation
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Docketview = () => {
  const [selectedBlotterNumber, setSelectedBlotterNumber] = useState<string | null>(null);

  // Filter state
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [natureId,  setNatureId]  = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  // Query params
  const [params, setParams] = useState<DocketTableParams>({
    search: '', status: '', natureId: undefined,
    start: '', end: '', page: 0, size: PAGE_SIZE, sort: 'createdAt,desc',
  });

  // Data state
  const [userAccess,     setUserAccess]     = useState<UserSecurityProfile | null>(null);
  const [tableData,      setTableData]      = useState<BlotterSummaryDTO[]>([]);
  const [stats,          setStats]          = useState<BlotterStatsDTO | null>(null);
  const [natureOptions,  setNatureOptions]  = useState<NatureOptionDTO[]>([]);
  const [totalPages,     setTotalPages]     = useState(0);
  const [totalElements,  setTotalElements]  = useState(0);
  const [currentPage,    setCurrentPage]    = useState(0);
  const [loading,        setLoading]        = useState(false);
  const [statsLoading,   setStatsLoading]   = useState(false);
  const [fetchError,     setFetchError]     = useState<string | null>(null);
  const [selectedEntry,  setSelectedEntry]  = useState<BlotterSummaryDTO | null>(null);
  const [forwardLoading, setForwardLoading] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await getDocketStats());
    } catch {
      // non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchTable = useCallback(async (p: DocketTableParams) => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getDocketTable(p);
      setTableData(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(data.number ?? 0);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch everything in parallel on mount
    Promise.all([
      fetchStats(),
      fetchTable(params),
      getNatureOfComplaintOptions()
        .then(setNatureOptions)
        .catch(() => setNatureOptions([])),
      getMyAccess()
        .then(setUserAccess)
        .catch(() => setUserAccess(null)),
    ]);
  }, []);

  // ── Permissions ──────────────────────────────────────────────────────────────

  const canView = hasPerm(userAccess, 'View Blotter Records');
  const canEdit = hasPerm(userAccess, 'Update Case Status');

  // ── Nature filter options from API ───────────────────────────────────────────

  const natureFilterOptions = natureOptions.map((n) => ({
    label: n.natureName,
    value: String(n.id),
  }));

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleApplyFilter = () => {
    const updated: DocketTableParams = {
      search,
      status: status || '',
      natureId: natureId ? Number(natureId) : undefined,
      start: startDate,
      end: endDate,
      page: 0,
      size: PAGE_SIZE,
      sort: 'createdAt,desc',
    };
    setParams(updated);
    fetchTable(updated);
  };

  const handleClearFilter = () => {
    setSearch(''); setStatus(''); setNatureId(''); setStartDate(''); setEndDate('');
    const reset: DocketTableParams = {
      search: '', status: '', natureId: undefined,
      start: '', end: '', page: 0, size: PAGE_SIZE, sort: 'createdAt,desc',
    };
    setParams(reset);
    fetchTable(reset);
  };

  const handlePageChange = (page: number) => {
    const updated = { ...params, page: page - 1 };
    setParams(updated);
    fetchTable(updated);
  };

  const handleForwardConfirm = async () => {
    if (!selectedEntry) return;
    setForwardLoading(true);
    try {
      await updateCaseStatus({
        blotterNumber: selectedEntry.blotterNumber,
        newStatus: 'REFERRED_TO_LUPON',
        reason: 'Case escalated to Lupon Tagapamayapa',
      });
      setSelectedEntry(null);
      fetchTable(params);
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to escalate case.');
    } finally {
      setForwardLoading(false);
    }
  };

  const activeFilterCount = [status, natureId, startDate, endDate].filter(Boolean).length;

  // ── Columns ──────────────────────────────────────────────────────────────────

  const columns: TableColumn<BlotterSummaryDTO>[] = [
    {
      key: 'blotterNumber',
      header: 'Case / Blotter No.',
      width: '250px',
      render: (item) => (
        <button
          onClick={(e) => { e.stopPropagation(); if (canView) setSelectedBlotterNumber(item.blotterNumber); }}
          className="font-mono text-sm font-semibold text-blue-600 hover:underline text-left"
        >
          {item.blotterNumber}
        </button>
      ),
    },
    {
      key: 'dateFiled',
      header: 'Date Filed',
      width: '120px',
      render: (item) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">{formatDate(item.dateFiled)}</span>
      ),
    },
    {
      key: 'complainantName',
      header: 'Complainant',
      width: '175px',
      render: (item) => <span className="text-sm font-medium text-gray-800">{item.complainantName}</span>,
    },
    {
      key: 'respondentName',
      header: 'Respondent',
      width: '175px',
      render: (item) => <span className="text-sm text-gray-700">{item.respondentName}</span>,
    },
    {
      key: 'natureOfComplaint',
      header: 'Nature of Complaint',
      render: (item) => (
        <span className="text-sm text-gray-600 truncate block max-w-[180px]">{item.natureOfComplaint}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '160px',
      render: (item) => {
        const mapped = DOCKET_STATUS_MAP[item.status];
        return (
          <StatusBadge
            status={mapped?.type ?? 'default'}
            label={mapped?.label ?? item.status}
          />
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '300px',
      render: (item) => (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            disabled={!canView}
            onClick={(e) => { e.stopPropagation(); if (canView) setSelectedBlotterNumber(item.blotterNumber); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              !canView
                ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60 grayscale'
                : 'text-gray-600 border-gray-200 bg-white hover:bg-gray-50 shadow-sm'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>

          {['UNSETTLED', 'PENDING', 'UNDER_MEDIATION'].includes(item.status) && (
            <button
              disabled={!canEdit}
              onClick={(e) => { e.stopPropagation(); if (canEdit) setSelectedEntry(item); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                !canEdit
                  ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60 grayscale'
                  : 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Escalate to Lupon
            </button>
          )}
        </div>
      ),
    },
  ];

  // ── Navigate to detail ────────────────────────────────────────────────────────

  if (selectedBlotterNumber) {
    return (
      <BlotterDocketDetailView
        blotterNumber={selectedBlotterNumber}
        onBack={() => {
          setSelectedBlotterNumber(null);
          fetchTable(params);
          fetchStats();
        }}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-5">

      {selectedEntry && (
        <ForwardToLuponModal
          entry={selectedEntry}
          onConfirm={handleForwardConfirm}
          onCancel={() => setSelectedEntry(null)}
          loading={forwardLoading}
        />
      )}

      {/* KPI Stats */}
      <KPIGrid columns={4}>
        <KPICard
          title="Total Entries"
          value={statsLoading ? '...' : (stats?.totalEntries ?? 0)}
          color="blue"
          icon={KPIIcons['document']}
        />
        <KPICard
          title="Active Cases"
          value={statsLoading ? '...' : (stats?.activeCases ?? 0)}
          color="emerald"
          icon={KPIIcons['users']}
        />
        <KPICard
          title="Resolved"
          value={statsLoading ? '...' : (stats?.resolved ?? 0)}
          color="slate"
          icon={KPIIcons['check']}
        />
        <KPICard
          title="Pending Mediation"
          value={statsLoading ? '...' : (stats?.pendingMediation ?? 0)}
          color="amber"
          icon={KPIIcons['pending']}
        />
      </KPIGrid>

      {/* Filters — nature options from API, status hardcoded enums */}
      <TableFilter
        searchPlaceholder="Search by  case no."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            label: 'Status',
            
            key: 'status',
            options: STATUS_FILTER_OPTIONS,
            value: status,
          },
          {
            label: 'Nature of Case',
            key: 'natureId',
            options: natureFilterOptions,
            value: natureId,
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === 'status')   setStatus(value);
          if (key === 'natureId') setNatureId(value);
        }}
        dateRange={{
          startLabel: 'Date From',
          endLabel:   'Date To',
          startValue: startDate,
          endValue:   endDate,
          onStartChange: setStartDate,
          onEndChange:   setEndDate,
        }}
        onFilterClick={handleApplyFilter}
        onClearClick={handleClearFilter}
        filterButtonText="Apply"
        activeFilterCount={activeFilterCount}
      />

      {/* Error banner */}
      {fetchError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {fetchError}
        </div>
      )}

      {/* Table */}
      <Table<BlotterSummaryDTO>
        columns={columns}
        data={tableData}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="No docket records found."
        onRowClick={(item) => { if (canView) setSelectedBlotterNumber(item.blotterNumber); }}
        hoverable
        striped
        minRows={PAGE_SIZE}
        pagination={
          totalElements > 0
            ? {
                currentPage: currentPage + 1,
                totalPages,
                totalItems: totalElements,
                itemsPerPage: PAGE_SIZE,
                onPageChange: handlePageChange,
              }
            : undefined
        }
      />

    </div>
  );
};

export default Docketview;