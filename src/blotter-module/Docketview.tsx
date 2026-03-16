import BlotterDocketDetailView from './Blotterdocketdetailview';
import { useState, useEffect, useCallback } from 'react';
import { Search, X, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { KPICard, KPIGrid, KPIIcons } from '../reusable/KPICard';
import type { DocketTableParams, BlotterSummaryDTO, BlotterStatsDTO } from '../blotter-api/DocketView';
import { getDocketTable, getDocketStats, updateCaseStatus } from '../blotter-api/DocketView';

// ─── Date Formatter ───────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Pending Mediation', value: 'PENDING_MEDIATION' },
  { label: 'Unsettled', value: 'UNSETTLED' },
  { label: 'Under Mediation', value: 'UNDER_MEDIATION' },
  { label: 'Referred to Lupon', value: 'REFERRED_TO_LUPON' },
  { label: 'Summoned', value: 'SUMMONED' },
];

const NATURE_OPTIONS = [
  { label: 'All Nature', value: '' },
  { label: 'Physical Assault', value: '1' },
  { label: 'Theft', value: '2' },
  { label: 'Trespassing', value: '3' },
];

const statusConfig: Record<string, string> = {
  UNSETTLED:         'bg-red-100 text-red-600',
  UNDER_MEDIATION:   'bg-blue-100 text-blue-600',
  PENDING:           'bg-gray-100 text-gray-600',
  REFERRED_TO_LUPON: 'bg-purple-100 text-purple-600',
  SUMMONED:          'bg-amber-100 text-amber-600',
  RESOLVED:          'bg-emerald-100 text-emerald-600',
  ACTIVE:            'bg-cyan-100 text-cyan-600',
  PENDING_MEDIATION: 'bg-orange-100 text-orange-600',
};

const statusLabel: Record<string, string> = {
  UNSETTLED:         'Unsettled',
  UNDER_MEDIATION:   'Under Mediation',
  PENDING:           'Pending',
  REFERRED_TO_LUPON: 'Referred to Lupon',
  SUMMONED:          'Summoned',
  RESOLVED:          'Resolved',
  ACTIVE:            'Active',
  PENDING_MEDIATION: 'Pending Mediation',
};

// ─── Forward to Lupon Modal ───────────────────────────────────────────────────

interface ForwardModalProps {
  entry: BlotterSummaryDTO;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const ForwardToLuponModal = ({ entry, onConfirm, onCancel, loading }: ForwardModalProps) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-red-100 p-2 rounded-full">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Forward to Lupon</h2>
      </div>
      <p className="text-sm text-gray-600 mb-1">
        Are you sure you want to escalate this case to Lupon?
      </p>
      <div className="bg-gray-50 rounded-lg p-3 my-4 text-sm space-y-1">
        <p><span className="text-gray-500">Case No.:</span> <span className="font-medium text-blue-600">{entry.blotterNumber}</span></p>
        <p><span className="text-gray-500">Complainant:</span> <span className="font-medium">{entry.complainantName}</span></p>
        <p><span className="text-gray-500">Respondent:</span> <span className="font-medium">{entry.respondentName}</span></p>
        <p><span className="text-gray-500">Nature:</span> <span className="font-medium">{entry.natureOfComplaint}</span></p>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2">
          {loading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Confirm Forward
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Docketview ──────────────────────────────────────────────────────────

const Docketview = () => {

  // ── Navigation state ──
  const [selectedBlotterNumber, setSelectedBlotterNumber] = useState<string | null>(null);

  const [params, setParams] = useState<DocketTableParams>({
    search: '',
    status: '',
    natureId: undefined,
    start: '',
    end: '',
    page: 0,
    size: 10,
    sort: 'createdAt,desc',
  });

  const [tableData,      setTableData]      = useState<BlotterSummaryDTO[]>([]);
  const [stats,          setStats]          = useState<BlotterStatsDTO | null>(null);
  const [totalPages,     setTotalPages]     = useState(0);
  const [totalElements,  setTotalElements]  = useState(0);
  const [loading,        setLoading]        = useState(false);
  const [statsLoading,   setStatsLoading]   = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [selectedEntry,  setSelectedEntry]  = useState<BlotterSummaryDTO | null>(null);
  const [forwardLoading, setForwardLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getDocketStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchTable = useCallback(async (currentParams: DocketTableParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDocketTable(currentParams);
      setTableData(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err.message || 'Failed to load docket table.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTable(params);
  }, []);

  const handleChange = (key: keyof DocketTableParams, value: string | number | undefined) => {
    const updated = { ...params, [key]: value, page: 0 };
    setParams(updated);
    fetchTable(updated);
  };

  const handleReset = () => {
    const reset: DocketTableParams = {
      search: '', status: '', natureId: undefined,
      start: '', end: '', page: 0, size: 10, sort: 'createdAt,desc',
    };
    setParams(reset);
    fetchTable(reset);
  };

  const handlePageChange = (newPage: number) => {
    const updated = { ...params, page: newPage };
    setParams(updated);
    fetchTable(updated);
  };

  const hasActiveFilters =
    !!params.search || !!params.status || !!params.natureId || !!params.start || !!params.end;

  const handleForwardConfirm = async () => {
    if (!selectedEntry) return;
    setForwardLoading(true);
    try {
      await updateCaseStatus({
        caseId: selectedEntry.blotterNumber,
        newStatus: 'REFERRED_TO_LUPON',
        reason: 'Case escalated to Lupon Tagapamayapa',
      });
      setSelectedEntry(null);
      fetchTable(params);
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to forward case.');
    } finally {
      setForwardLoading(false);
    }
  };

  // ── Navigate to detail view ──
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

  // ── Table View ──
  return (
    <div className="w-full px-1 py-10 space-y-3">

      {/* Forward to Lupon Modal */}
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Search */}
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, case no..."
                value={params.search}
                onChange={(e) => handleChange('search', e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
          <div className="min-w-[160px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
            <select
              value={params.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Nature of Case */}
          <div className="min-w-[160px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nature of Case</label>
            <select
              value={params.natureId ?? ''}
              onChange={(e) => handleChange('natureId', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {NATURE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="min-w-[145px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Date From</label>
            <input
              type="date"
              value={params.start}
              onChange={(e) => handleChange('start', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div className="min-w-[145px]">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Date To</label>
            <input
              type="date"
              value={params.end}
              onChange={(e) => handleChange('end', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Docket Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Case/Blotter No.</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Date Filed</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Complainant</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Respondent</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nature of Complaint</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">

              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-red-500 text-sm">{error}</td>
                </tr>
              )}

              {!loading && !error && tableData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">No records found.</td>
                </tr>
              )}

              {!loading && !error && tableData.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">

                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelectedBlotterNumber(entry.blotterNumber)}
                      className="text-blue-600 font-medium hover:underline text-left"
                    >
                      {entry.blotterNumber}
                    </button>
                  </td>

                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(entry.dateFiled)}
                  </td>

                  <td className="px-5 py-3 text-gray-800">{entry.complainantName}</td>
                  <td className="px-5 py-3 text-gray-800">{entry.respondentName}</td>

                  <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate">
                    {entry.natureOfComplaint}
                  </td>

                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusConfig[entry.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {statusLabel[entry.status] ?? entry.status}
                    </span>

                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedBlotterNumber(entry.blotterNumber)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>

                     {(entry.status === 'UNSETTLED' || entry.status === 'UNDER_MEDIATION') && (
                      <button
                    onClick={() => setSelectedEntry(entry)}
                     className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                     >
                   <AlertCircle className="w-3.5 h-3.5" />
                     Forward to Lupon
                      </button>
                     )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(params.page! * params.size!) + 1}–{Math.min((params.page! + 1) * params.size!, totalElements)} of {totalElements} entries
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(params.page! - 1)}
                disabled={params.page === 0}
                className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => handlePageChange(i)}
                  className={`px-3 py-1.5 text-xs rounded-lg border ${
                    params.page === i
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}>
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(params.page! + 1)}
                disabled={params.page === totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Docketview;