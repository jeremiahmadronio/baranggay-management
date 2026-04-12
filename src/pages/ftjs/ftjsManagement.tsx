import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import {
  ActionModal,
  Table,
  TableFilter,
  type TableColumn,
} from "../../reusable";
import { KPICard, KPIGrid, KPIIcons } from "../../hooks/KPICard";
import { CenteredLoader } from "../../hooks/LoadingStates";
import {
  ftjsApi,
  type FtjsStatsResponseDTO,
  type FtjsTableDTO,
} from "../../service/ftjs/FirstTimeJobSeeker";
import {
  formatDate,
  isResidentText,
  paginateItems,
  SectionCard,
  StatusPill,
} from "./shared";

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

export default function FtjsManagementPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<FtjsStatsResponseDTO | null>(null);
  const [records, setRecords] = useState<FtjsTableDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [residentFilter, setResidentFilter] = useState("");
  const [page, setPage] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  async function refreshData() {
    try {
      setLoading(true);
      const [statsRes, recordsRes] = await Promise.all([
        ftjsApi.getStats(),
        ftjsApi.getTableSummary(),
      ]);

      setStats(statsRes);
      setRecords(
        recordsRes.filter((record) => !isArchivedStatus(record.status)),
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
        label: status.replace(/_/g, " "),
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
      width: "80px",
      render: (item) => {
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/first-time-job-seeker/management/${item.id}`);
              }}
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
              title="View request"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

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
            color="violet"
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
      </div>
    </div>
  );
}
