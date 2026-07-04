import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Archive } from "lucide-react";
import {
  ActionModal,
  Table,
  TableFilter,
  type TableColumn,
} from "../../../reusable";
import { ArchiveReasonModal } from "../../../hooks/archive-modal";
import { KPICard, KPIGrid, KPIIcons } from "../../../hooks/KPICard";
import { CenteredLoader } from "../../../hooks/LoadingStates";
import {
  ftjsApi,
  FTJS_PERMISSIONS,
  hasFtjsPermission,
  type FtjsStatsResponseDTO,
  type FtjsTableDTO,
} from "../../../service/first-time-job-seeker-api/FirstTimeJobSeeker";
import {
  buildFtjsAutoArchiveReason,
  formatDate,
  formatStatusLabel,
  isFtjsExpired,
  isResidentText,
  paginateItems,
  SectionCard,
  StatusPill,
} from "./shared";
import { useFtjsAccess } from "./useFtjsAccess";
import { useKapitanaMockData } from "../mock/kapitana-mock-flag";
import { mockKapitanaFtjsStats, mockKapitanaFtjsTable } from "../mock/ftjs-kapitana-mock";

const PAGE_SIZE = 10;

type FeedbackState = {
  type: "success" | "danger" | "info";
  title: string;
  message: string;
} | null;

function isArchivedStatus(status?: string | null) {
  return (
    String(status || "")
      .trim()
      .toUpperCase() === "ARCHIVED"
  );
}

export default function KapitanaFtjsManagementPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<FtjsStatsResponseDTO | null>(null);
  const [records, setRecords] = useState<FtjsTableDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [residentFilter, setResidentFilter] = useState("");
  const [page, setPage] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [archiveEntry, setArchiveEntry] = useState<FtjsTableDTO | null>(null);

  const { accessLoading, userAccess } = useFtjsAccess();
  const isMock = useKapitanaMockData();
  const canUpdateApplicantInfo = isMock || hasFtjsPermission(
    userAccess,
    FTJS_PERMISSIONS.UPDATE_APPLICANT_INFO,
  );

  async function handleArchiveSubmit(reason: string) {
    if (!archiveEntry) return;
    if (!canUpdateApplicantInfo) {
      setFeedback({
        type: "danger",
        title: "Permission required",
        message: "You do not have permission to update FTJS applicant information.",
      });
      return;
    }

    try {
      if (!isMock) {
        await ftjsApi.updateStatus(archiveEntry.id, {
          isArchived: true,
          remarks: reason,
        });
      }

      setArchiveEntry(null);
      setFeedback({
        type: "success",
        title: "Request archived",
        message: `${archiveEntry.trackingNumber} was moved to the FTJS archive successfully.`,
      });
      refreshData();
    } catch (error) {
      setFeedback({
        type: "danger",
        title: "Archive failed",
        message: error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  async function archiveExpiredRecords(recordsRes: FtjsTableDTO[]) {
    const expiredRecords = recordsRes.filter((record) => {
      return !isArchivedStatus(record.status) && isFtjsExpired(record.dateSubmitted);
    });

    if (!expiredRecords.length) {
      return recordsRes;
    }

    const results = await Promise.allSettled(
      expiredRecords.map((record) =>
        ftjsApi.updateStatus(record.id, {
          isArchived: true,
          remarks: buildFtjsAutoArchiveReason(record.dateSubmitted),
        }),
      ),
    );

    const archivedIds = new Set<number>();

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        archivedIds.add(expiredRecords[index].id);
        return;
      }

      console.error(
        `Failed to auto-archive FTJS record ${expiredRecords[index].id}:`,
        result.reason,
      );
    });

    return recordsRes.filter((record) => !archivedIds.has(record.id));
  }

  async function refreshData() {
    try {
      setLoading(true);
      if (useKapitanaMockData()) {
        setStats(mockKapitanaFtjsStats);
        setRecords(mockKapitanaFtjsTable);
        return;
      }
      const [statsRes, recordsRes, archiveRecordsRes] = await Promise.all([
        ftjsApi.getStats(),
        ftjsApi.getTableSummary(),
        ftjsApi.getArchiveTable(),
      ]);

      const archivedIds = new Set(archiveRecordsRes.map((record) => record.id));
      const visibleRecords = recordsRes.filter((record) => !archivedIds.has(record.id));

      const activeRecords = await archiveExpiredRecords(visibleRecords);

      setStats(statsRes);
      setRecords(
        activeRecords.filter((record) => !isArchivedStatus(record.status)),
      );
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Failed to load FTJS management data.",
      );
      setFeedback({
        type: "danger",
        title: "Unable to load FTJS data",
        message: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = records.filter((record) => {
      const matchesKeyword =
        !keyword ||
        record.trackingNumber.toLowerCase().includes(keyword) ||
        record.fullName.toLowerCase().includes(keyword);

      const normalizedStatus = String(record.status || "").toUpperCase();
      const matchesStatus = !statusFilter || normalizedStatus === statusFilter;

      const matchesResident =
        !residentFilter ||
        (residentFilter === "RESIDENT" && record.isResident) ||
        (residentFilter === "NON_RESIDENT" && !record.isResident);

      return matchesKeyword && matchesStatus && matchesResident;
    });

    return filtered;
  }, [records, residentFilter, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const pagedRecords = useMemo(
    () => paginateItems(filteredRecords, page, PAGE_SIZE),
    [filteredRecords, page],
  );

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(0);
    }
  }, [page, totalPages]);

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((record) => String(record.status || "").toUpperCase())
          .filter((status) => Boolean(status) && status !== "ARCHIVED"),
      ),
    )
      .sort()
      .map((status) => ({
        label: formatStatusLabel(status),
        value: status,
      }));
  }, [records]);

  const activeFilterCount = [statusFilter, residentFilter].filter(
    Boolean,
  ).length;

  const columns: TableColumn<FtjsTableDTO>[] = [
    {
      key: "trackingNumber",
      header: "Tracking No.",
      width: "190px",
      render: (item) => (
        <span className="text-gray-700 font-medium">{item.trackingNumber}</span>
      ),
    },
    {
      key: "fullName",
      header: "Applicant",
      width: "240px",
      render: (item) => (
        <span className="block whitespace-normal break-words text-gray-900 font-semibold">
          {item.fullName}
        </span>
      ),
    },
    {
      key: "issuanceCount",
      header: "Issuance Count",
      width: "140px",
      render: (item) => (
        <span className="text-gray-700">{item.issuanceCount}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "160px",
      render: (item) => <StatusPill status={item.status} />,
    },
    {
      key: "dateSubmitted",
      header: "Date Submitted",
      width: "150px",
      render: (item) => (
        <span className="text-gray-700 whitespace-nowrap">
          {formatDate(item.dateSubmitted)}
        </span>
      ),
    },
    {
      key: "isResident",
      header: "Applicant Type",
      width: "180px",
      render: (item) => (
        <span className="text-gray-700">{isResidentText(item.isResident)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      width: "120px",
      render: (item) => {
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/official-portal/ftjs/management/${item.id}`);
              }}
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
              title="View request"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canUpdateApplicantInfo && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setArchiveEntry(item);
                }}
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                title="Archive request"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (accessLoading) {
    return <CenteredLoader minHeight="min-h-[70vh]" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <KPIGrid columns={4}>
            {Array.from({ length: 4 }).map((_, index) => (
              <KPICard
                key={index}
                title="Loading"
                value="..."
                color="slate"
                icon={KPIIcons.document}
              />
            ))}
          </KPIGrid>
          <SectionCard title="Loading FTJS requests">
            <CenteredLoader minHeight="min-h-[320px]" />
          </SectionCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <KPIGrid columns={4}>
          <KPICard
            title="Total Certificates Issued"
            value={stats?.totalCertificatesIssued ?? 0}
            color="blue"
            icon={KPIIcons.issued}
            subtitle="All FTJS releases recorded"
          />
          <KPICard
            title="Issued This Month"
            value={stats?.totalCertificatedThisMonth ?? 0}
            color="emerald"
            icon={KPIIcons.month}
            subtitle="Current month FTJS output"
          />
          <KPICard
            title="Original Issuances"
            value={stats?.originalIssuances ?? 0}
            color="amber"
            icon={KPIIcons.document}
            subtitle="First release requests"
          />
          <KPICard
            title="Re-issuances"
            value={stats?.reIssuances ?? 0}
            color="blue"
            icon={KPIIcons.total}
            subtitle="Replacement certificates processed"
          />
        </KPIGrid>

        <TableFilter
          searchPlaceholder="Search by tracking number or applicant"
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
          filters={[
            {
              label: "Status",
              key: "status",
              options: statusOptions,
              value: statusFilter,
            },
            {
              label: "Applicant Type",
              key: "residentType",
              options: [
                { label: "Registered Resident", value: "RESIDENT" },
                { label: "Walk-in / Non-resident", value: "NON_RESIDENT" },
              ],
              value: residentFilter,
            },
          ]}
          onFilterChange={(key, value) => {
            setPage(0);
            if (key === "status") setStatusFilter(value);
            if (key === "residentType") setResidentFilter(value);
          }}
          onFilterClick={() => setPage(0)}
          onClearClick={() => {
            setSearch("");
            setStatusFilter("");
            setResidentFilter("");
            setPage(0);
          }}
          filterButtonText="Apply"
          activeFilterCount={activeFilterCount}
        />

        <Table<FtjsTableDTO>
          columns={columns}
          data={pagedRecords}
          keyExtractor={(item) => item.id}
          variant="resident"
          striped
          hoverable
          minRows={PAGE_SIZE}
          emptyMessage="No FTJS records found."
          pagination={{
            currentPage: Math.min(page + 1, totalPages),
            totalPages,
            totalItems: filteredRecords.length,
            itemsPerPage: PAGE_SIZE,
            onPageChange: (nextPage) => setPage(nextPage - 1),
          }}
        />

        <ActionModal
          isOpen={!!feedback}
          onClose={() => setFeedback(null)}
          title={feedback?.title || "FTJS Notification"}
          type={feedback?.type || "info"}
        >
          {feedback?.message}
        </ActionModal>

        {archiveEntry && (
          <ArchiveReasonModal
            isOpen={!!archiveEntry}
            onClose={() => setArchiveEntry(null)}
            title="Archive FTJS Request"
            subjectName={archiveEntry.trackingNumber}
            subjectLabel="request"
            submitLabel="Archive"
            onSubmit={handleArchiveSubmit}
          />
        )}
      </div>
    </div>
  );
}
