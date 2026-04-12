import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RotateCcw } from "lucide-react";
import { TableFilter, Table, type TableColumn } from "../../reusable";
import { KPICard, KPIGrid, KPIIcons } from "../../hooks/KPICard";
import { ActionModal } from "../../hooks/SuccessModal";
import { ArchiveReasonModal } from "../../hooks/archive-modal";
import { CenteredLoader } from "../../hooks/LoadingStates";
import FtjsRecordModal from "./FtjsRecordModal";
import {
  ftjsApi,
  type ArchiveResponseDTO,
  type ArchiveTableResponseDTO,
  type FtjsFullResponseDTO,
  type NotesResponseDTO,
  type ResponseNewFtjsSummaryDTO,
  type TimelineResponseDTO,
} from "../../service/ftjs/FirstTimeJobSeeker";
import { formatDate, paginateItems, SectionCard, StatusPill } from "./shared";

const PAGE_SIZE = 10;

export default function FtjsArchivePage() {
  const [stats, setStats] = useState<ArchiveResponseDTO | null>(null);
  const [records, setRecords] = useState<ArchiveTableResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);

  const [selectedArchive, setSelectedArchive] =
    useState<ArchiveTableResponseDTO | null>(null);
  const [detailRecord, setDetailRecord] = useState<FtjsFullResponseDTO | null>(
    null,
  );
  const [detailNotes, setDetailNotes] = useState<NotesResponseDTO[]>([]);
  const [detailTimeline, setDetailTimeline] = useState<TimelineResponseDTO[]>(
    [],
  );
  const [detailReplacements, setDetailReplacements] = useState<
    ResponseNewFtjsSummaryDTO[]
  >([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [restoreEntry, setRestoreEntry] =
    useState<ArchiveTableResponseDTO | null>(null);
  const [restoreSuccessOpen, setRestoreSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchArchive = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, recordsRes] = await Promise.all([
        ftjsApi.getArchiveStats(),
        ftjsApi.getArchiveTable(),
      ]);

      setStats(statsRes);
      setRecords(recordsRes);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load FTJS archive.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  async function openRecord(item: ArchiveTableResponseDTO) {
    try {
      setDetailLoading(true);
      setSelectedArchive(item);

      const [recordRes, notesRes, timelineRes, replacementsRes] =
        await Promise.all([
          ftjsApi.getFullDetails(item.id),
          ftjsApi.getNotes(item.id),
          ftjsApi.getTimeline(item.id),
          ftjsApi.getReplacementSummary(item.id),
        ]);

      setDetailRecord(recordRes);
      setDetailNotes(notesRes);
      setDetailTimeline(timelineRes);
      setDetailReplacements(replacementsRes);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to open archived FTJS record.",
      );
      setSelectedArchive(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleRestoreSubmit(reason: string) {
    if (!restoreEntry) return;

    try {
      await ftjsApi.updateStatus(restoreEntry.id, {
        newStatus: "RESTORED",
        remarks: reason,
      });
      setRestoreEntry(null);
      setRestoreSuccessOpen(true);
      if (selectedArchive?.id === detailRecord?.id) {
        setSelectedArchive(null);
        setDetailRecord(null);
        setDetailNotes([]);
        setDetailTimeline([]);
        setDetailReplacements([]);
      }
      await fetchArchive();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to restore FTJS record.",
      );
    }
  }

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesKeyword =
        !keyword ||
        record.trackingNumber.toLowerCase().includes(keyword) ||
        record.fullName.toLowerCase().includes(keyword) ||
        String(record.archiveRemarks || "")
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        !statusFilter ||
        String(record.status || "").toUpperCase() === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .map((record) => String(record.status || "").toUpperCase())
            .filter(Boolean),
        ),
      )
        .sort()
        .map((status) => ({ label: status.replace(/_/g, " "), value: status })),
    [records],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const pagedRecords = useMemo(
    () => paginateItems(filteredRecords, page, PAGE_SIZE),
    [filteredRecords, page],
  );

  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  const columns: TableColumn<ArchiveTableResponseDTO>[] = [
    {
      key: "trackingNumber",
      header: "Tracking No.",
      width: "180px",
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
      width: "130px",
      render: (item) => (
        <span className="text-gray-700">{item.issuanceCount}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "150px",
      render: (item) => <StatusPill status={item.status} />,
    },
    {
      key: "archiveRemarks",
      header: "Archive Remarks",
      width: "280px",
      render: (item) => (
        <span className="block whitespace-normal break-words text-gray-700 leading-snug">
          {item.archiveRemarks || "—"}
        </span>
      ),
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
      key: "actions",
      header: "Actions",
      width: "100px",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openRecord(item);
            }}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            title="View archive record"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setRestoreEntry(item);
            }}
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="Restore FTJS record"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      ),
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
          <SectionCard title="Loading FTJS archive">
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
            title="Total Archived"
            value={stats?.totalArchive ?? 0}
            color="slate"
            icon={KPIIcons.document}
            subtitle="All archived FTJS records"
          />
          <KPICard
            title="Archived This Month"
            value={stats?.totalArchiveThisMonth ?? 0}
            color="blue"
            icon={KPIIcons.month}
            subtitle="Archive movement for the current month"
          />
          <KPICard
            title="Resident Archives"
            value={stats?.totalArchiveResident ?? 0}
            color="emerald"
            icon={KPIIcons.users}
            subtitle="Archived resident-linked records"
          />
          <KPICard
            title="Walk-in Archives"
            value={stats?.totalArchiveNonResident ?? 0}
            color="amber"
            icon={KPIIcons.alert}
            subtitle="Archived walk-in / non-resident records"
          />
        </KPIGrid>

        <TableFilter
          searchPlaceholder="Search by tracking no., applicant, or archive remark"
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
          ]}
          onFilterChange={(key, value) => {
            if (key === "status") setStatusFilter(value);
            setPage(0);
          }}
          onFilterClick={() => setPage(0)}
          onClearClick={() => {
            setSearch("");
            setStatusFilter("");
            setPage(0);
          }}
          activeFilterCount={[statusFilter].filter(Boolean).length}
          filterButtonText="Apply"
        />

        <Table<ArchiveTableResponseDTO>
          columns={columns}
          data={pagedRecords}
          keyExtractor={(item) => item.id}
          variant="resident"
          striped
          hoverable
          minRows={PAGE_SIZE}
          emptyMessage="No archived FTJS records found."
          onRowClick={(item) => openRecord(item)}
          pagination={{
            currentPage: Math.min(page + 1, totalPages),
            totalPages,
            totalItems: filteredRecords.length,
            itemsPerPage: PAGE_SIZE,
            onPageChange: (nextPage) => setPage(nextPage - 1),
          }}
        />

        <FtjsRecordModal
          isOpen={!!selectedArchive && !detailLoading}
          onClose={() => {
            setSelectedArchive(null);
            setDetailRecord(null);
            setDetailNotes([]);
            setDetailTimeline([]);
            setDetailReplacements([]);
          }}
          record={detailRecord}
          notes={detailNotes}
          timeline={detailTimeline}
          replacements={detailReplacements}
        />

        {restoreEntry ? (
          <ArchiveReasonModal
            isOpen={!!restoreEntry}
            onClose={() => setRestoreEntry(null)}
            title="Restore FTJS Record"
            subjectName={restoreEntry.trackingNumber}
            subjectLabel="request"
            submitLabel="Restore"
            placeholder="Provide a reason for restoring this FTJS record..."
            onSubmit={handleRestoreSubmit}
          />
        ) : null}

        {detailLoading ? (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <CenteredLoader minHeight="min-h-[120px]" />
          </div>
        ) : null}

        <ActionModal
          isOpen={restoreSuccessOpen}
          onClose={() => setRestoreSuccessOpen(false)}
          title="FTJS record restored"
          type="success"
        >
          Archived FTJS record has been restored successfully.
        </ActionModal>

        <ActionModal
          isOpen={!!errorMessage}
          onClose={() => setErrorMessage(null)}
          title="FTJS Archive"
          type="danger"
        >
          {errorMessage}
        </ActionModal>
      </div>
    </div>
  );
}
