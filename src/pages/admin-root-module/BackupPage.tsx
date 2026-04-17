import React, { useEffect, useState } from "react";
import {
  Database,
  RefreshCw,
  Plus,
  Upload,
  Download,
  Trash2,
  Lock,
  Unlock,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  backupApi,
  type BackupResponseDTO,
  type BackupStatsDTO,
  type BackupSchedule,
} from "../../service/system-admin-api/database-backup";
import { formatDate } from "./utils/formatter";
import { KPICard, KPIGrid, KPIIcons } from "../../hooks/KPICard";
import { TableFilter } from "../../hooks/TableFilter";
import { ActionModal } from "../../hooks/SuccessModal";
import { FormModalShell, FormFieldLabel } from "../../reusable/FormModalShell";

const formatFileSize = (
  sizeKb: number | null | undefined,
  format: "gb" | "adaptive" = "gb",
): string => {
  if (!sizeKb) return "—";

  if (format === "gb") {
    const gb = sizeKb / (1024 * 1024);
    return `${gb.toFixed(4)} GB`;
  }

  // Adaptive format: KiB, MiB, GiB
  if (sizeKb < 1024) {
    return `${sizeKb.toFixed(2)} KiB`;
  }
  const mib = sizeKb / 1024;
  if (mib < 1024) {
    return `${mib.toFixed(2)} MiB`;
  }
  const gib = mib / 1024;
  return `${gib.toFixed(2)} GiB`;
};

const formatBackupFileName = (backup: BackupResponseDTO): string => {
  if (backup.label) {
    return `${formatDate(backup.createdAt)}`;
  }
  return formatDate(backup.createdAt);
};
export function BackupPage() {
  const [backups, setBackups] = useState<BackupResponseDTO[]>([]);
  const [stats, setStats] = useState<BackupStatsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{
    type: "delete" | "restore" | "download";
    backup: BackupResponseDTO;
  } | null>(null);
  // Form States
  const [createForm, setCreateForm] = useState({
    label: "",
    passphrase: "",
  });
  const [uploadForm, setUploadForm] = useState<{
    file: File | null;
    passphrase: "";
  }>({
    file: null,
    passphrase: "",
  });
  const [scheduleForm, setScheduleForm] = useState<BackupSchedule>({
    frequency: "DAILY",
    hour: 0,
    minute: 0,
    dayOfWeek: "MON",
    enabled: false,
  });
  const [actionPassphrase, setActionPassphrase] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Restore Mode States
  const [restoreMode, setRestoreMode] = useState<"upload" | "fromTable">(
    "upload",
  );
  const [restoreSearch, setRestoreSearch] = useState("");
  const [selectedRestoreFile, setSelectedRestoreFile] =
    useState<BackupResponseDTO | null>(null);
  const [restorePassphrase, setRestorePassphrase] = useState("");
  // Table Search & Pagination States
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  // Success/Error Modal States
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: "", message: "" });
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: "", message: "" });
  const fetchData = async () => {
    try {
      const [backupsData, statsData] = await Promise.all([
        backupApi.listBackups().catch(() => []),
        backupApi.getStats().catch(() => null),
      ]);
      setBackups(backupsData);
      setStats(statsData);
    } catch (error: any) {
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await backupApi.triggerManualBackup(
        createForm.label,
        createForm.passphrase,
      );
      setIsCreateOpen(false);
      setCreateForm({
        label: "",
        passphrase: "",
      });
      setSuccessModal({
        isOpen: true,
        title: "Backup Created",
        message: "Your database backup has been created successfully.",
      });
      fetchData();
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: "Backup Failed",
        message: error.message || "Failed to create backup. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUploadRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restoreMode === "upload") {
      if (!uploadForm.file) return;
      setIsSubmitting(true);
      try {
        await backupApi.restoreFromUpload(
          uploadForm.file,
          uploadForm.passphrase,
        );
        setIsUploadOpen(false);
        setUploadForm({
          file: null,
          passphrase: "",
        });
        setSuccessModal({
          isOpen: true,
          title: "Database Restored",
          message:
            "Your database has been restored successfully from the uploaded backup.",
        });
        fetchData();
      } catch (error: any) {
        setErrorModal({
          isOpen: true,
          title: "Restore Failed",
          message:
            error.message || "Failed to restore database. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!selectedRestoreFile) return;
      setIsSubmitting(true);
      try {
        await backupApi.restoreFromCloud(
          selectedRestoreFile.fileName,
          restorePassphrase,
        );
        setIsUploadOpen(false);
        setSelectedRestoreFile(null);
        setRestorePassphrase("");
        setRestoreSearch("");
        setRestoreMode("upload");
        setSuccessModal({
          isOpen: true,
          title: "Database Restored",
          message: "Your database has been restored successfully.",
        });
        fetchData();
      } catch (error: any) {
        setErrorModal({
          isOpen: true,
          title: "Restore Failed",
          message:
            error.message || "Failed to restore database. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await backupApi.updateSchedule(scheduleForm);
      setIsScheduleOpen(false);
      setSuccessModal({
        isOpen: true,
        title: "Schedule Updated",
        message: "Your backup schedule has been updated successfully.",
      });
      fetchData();
    } catch (error: any) {
      setErrorModal({
        isOpen: true,
        title: "Update Failed",
        message:
          error.message || "Failed to update schedule. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    setIsSubmitting(true);
    const { type, backup } = actionModal;
    try {
      if (type === "delete") {
        await backupApi.deleteBackup(backup.fileName, actionPassphrase);
        setSuccessModal({
          isOpen: true,
          title: "Backup Deleted",
          message: "The backup has been deleted successfully.",
        });
      } else if (type === "restore") {
        await backupApi.restoreFromCloud(backup.fileName, actionPassphrase);
        setSuccessModal({
          isOpen: true,
          title: "Database Restored",
          message: "Your database has been restored successfully.",
        });
      } else if (type === "download") {
        const blob = await backupApi.downloadBackup(
          backup.fileName,
          actionPassphrase,
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = backup.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccessModal({
          isOpen: true,
          title: "Download Complete",
          message: "Your backup file has been downloaded successfully.",
        });
      }
      setActionModal(null);
      setActionPassphrase("");
      if (type !== "download") fetchData();
    } catch (error: any) {
      const actionName =
        type === "delete"
          ? "Delete"
          : type === "restore"
            ? "Restore"
            : "Download";
      setErrorModal({
        isOpen: true,
        title: `${actionName} Failed`,
        message: error.message || `Failed to ${type} backup. Please try again.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const openActionModal = (
    type: "delete" | "restore" | "download",
    backup: BackupResponseDTO,
  ) => {
    setActionModal({
      type,
      backup,
    });
    setActionPassphrase("");
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p>Loading backup data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Stats Cards */}
        <KPIGrid columns={4}>
          {/* Storage Usage */}
          <KPICard
            title="Storage Used"
            value={stats ? `${stats.storageUsedGb.toFixed(4)} GB` : "—"}
            icon={KPIIcons.chart}
            subtitle={stats ? `of ${stats.storageLimitGb.toFixed(2)} GB` : "—"}
            color="blue"
          />

          {/* Auto Backup Frequency */}
          <KPICard
            title="Backup Schedule"
            value={stats?.autoBackupFrequency || "—"}
            icon={KPIIcons.clock}
            subtitle="Current schedule"
            color="emerald"
          />

          {/* Next Backup Time */}
          <KPICard
            title="Next Backup"
            value={formatDate(stats?.nextBackupTime) || "—"}
            icon={KPIIcons.month}
            subtitle="Scheduled"
            color="amber"
          />

          {/* Last Backup Status */}
          <KPICard
            title="Last Backup"
            value={formatDate(stats?.lastBackupDate) || "—"}
            icon={
              stats?.lastBackupStatus === "Success"
                ? KPIIcons.check
                : KPIIcons.alert
            }
            color={stats?.lastBackupStatus === "Success" ? "emerald" : "rose"}
            subtitle={
              stats?.lastBackupStatus === "Success"
                ? "Backup successful"
                : "Backup failed"
            }
          />
        </KPIGrid>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-3 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" /> Create Backup
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors hover:shadow-sm"
          >
            <Upload className="w-4 h-4" /> Upload & Restore
          </button>
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-colors ml-auto hover:shadow-sm"
          >
            <Calendar className="w-4 h-4" /> Schedule Settings
          </button>
        </div>

        {/* Table Filter & Search */}
        <TableFilter
          showSearch={true}
          showFilterButton={false}
          showClearButton={true}
          searchValue={tableSearch}
          onSearchChange={(value) => {
            setTableSearch(value);
            setCurrentPage(1);
          }}
          onClearClick={() => {
            setTableSearch("");
            setStatusFilter("");
            setCurrentPage(1);
          }}
          filters={[
            {
              label: "Security",
              key: "security",
              value: statusFilter,
              options: [
                { value: "encrypted", label: "Encrypted" },
                { value: "decrypted", label: "Decrypted" },
              ],
            },
          ]}
          onFilterChange={(_, value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by file name..."
        />

        {/* Backup List Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-sm">
                    Display Name
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-sm">
                    Label
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-sm">
                    Created
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-sm">
                    Size
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-sm text-center">
                    Security
                  </th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-sm text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(() => {
                  const filtered = backups
                    .filter((backup) =>
                      backup.fileName
                        .toLowerCase()
                        .includes(tableSearch.toLowerCase()),
                    )
                    .filter((backup) => {
                      if (!statusFilter) return true;
                      if (statusFilter === "encrypted") return backup.encrypted;
                      if (statusFilter === "decrypted")
                        return !backup.encrypted;
                      return true;
                    })
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    );
                  const start = (currentPage - 1) * itemsPerPage;
                  const end = start + itemsPerPage;
                  const paginated = filtered.slice(start, end);

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-400"
                        >
                          <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>No backups found.</p>
                        </td>
                      </tr>
                    );
                  }

                  return paginated.map((backup) => (
                    <motion.tr
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      key={backup.fileName}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4" title={backup.fileName}>
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {formatBackupFileName(backup)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {backup.fileName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {backup.label ? (
                          <span className="px-3 py-1 bg-blue-100 rounded-full text-xs font-medium text-blue-700">
                            {backup.label}
                          </span>
                        ) : (
                          <span className="text-gray-400">Auto</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {formatDate(backup.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {formatFileSize(backup.fileSizeKb, "adaptive")}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {backup.encrypted ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-medium">
                            <Lock className="w-3 h-3" /> Encrypted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
                            <Unlock className="w-3 h-3" /> Decrypted
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openActionModal("download", backup)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openActionModal("delete", backup)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(() => {
            const filtered = backups
              .filter((backup) =>
                backup.fileName
                  .toLowerCase()
                  .includes(tableSearch.toLowerCase()),
              )
              .filter((backup) => {
                if (!statusFilter) return true;
                if (statusFilter === "encrypted") return backup.encrypted;
                if (statusFilter === "decrypted") return !backup.encrypted;
                return true;
              })
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              );
            const totalPages = Math.ceil(filtered.length / itemsPerPage);

            if (totalPages <= 1) return null;

            return (
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>
                  -
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filtered.length)}
                  </span>{" "}
                  of <span className="font-medium">{filtered.length}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Create Backup Modal */}
      <FormModalShell
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Manual Backup"
        maxWidthClass="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                handleCreateBackup(e as any);
              }}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Backup"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <FormFieldLabel label="Label" />
            <input
              type="text"
              value={createForm.label}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  label: e.target.value,
                })
              }
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Before major update"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional - helps identify your backup
            </p>
          </div>
          <div>
            <FormFieldLabel label="Passphrase" />
            <input
              type="password"
              value={createForm.passphrase}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  passphrase: e.target.value,
                })
              }
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Encrypt backup with passphrase"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional - encrypt your backup for extra security
            </p>
          </div>
        </div>
      </FormModalShell>

      {/* Upload & Restore Modal */}
      <FormModalShell
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setRestoreMode("upload");
          setSelectedRestoreFile(null);
          setRestoreSearch("");
          setRestorePassphrase("");
        }}
        title="Restore Database"
        maxWidthClass="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsUploadOpen(false);
                setRestoreMode("upload");
                setSelectedRestoreFile(null);
                setRestoreSearch("");
                setRestorePassphrase("");
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                handleUploadRestore(e as any);
              }}
              disabled={
                isSubmitting ||
                (restoreMode === "upload"
                  ? !uploadForm.file
                  : !selectedRestoreFile)
              }
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Restoring..." : "Restore Database"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Mode Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setRestoreMode("upload");
                setSelectedRestoreFile(null);
                setRestoreSearch("");
              }}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                restoreMode === "upload"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => {
                setRestoreMode("fromTable");
                setUploadForm({ file: null, passphrase: "" });
              }}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                restoreMode === "fromTable"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              From Backups List
            </button>
          </div>

          {/* Upload Mode */}
          {restoreMode === "upload" && (
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      file: e.target.files?.[0] || null,
                    })
                  }
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {uploadForm.file
                      ? uploadForm.file.name
                      : "Click to select backup file"}
                  </span>
                </label>
              </div>
              <div>
                <FormFieldLabel label="Passphrase" />
                <input
                  type="password"
                  value={uploadForm.passphrase}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      passphrase: e.target.value as any,
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter passphrase to decrypt"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Required if backup is encrypted
                </p>
              </div>
            </div>
          )}

          {/* From Table Mode */}
          {restoreMode === "fromTable" && (
            <div className="space-y-4">
              <div>
                <FormFieldLabel label="Search & Select Backup" />
                <input
                  type="text"
                  placeholder="Search by file name..."
                  value={restoreSearch}
                  onChange={(e) => setRestoreSearch(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-3"
                />

                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white">
                  {backups
                    .filter((backup) =>
                      backup.fileName
                        .toLowerCase()
                        .includes(restoreSearch.toLowerCase()),
                    )
                    .map((backup) => (
                      <div
                        key={backup.fileName}
                        onClick={() => setSelectedRestoreFile(backup)}
                        className={`p-3 cursor-pointer border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                          selectedRestoreFile?.fileName === backup.fileName
                            ? "bg-blue-100 border-l-4 border-l-blue-600"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {formatBackupFileName(backup)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {backup.fileName}
                            </p>
                          </div>
                          {backup.encrypted && (
                            <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  {backups.filter((backup) =>
                    backup.fileName
                      .toLowerCase()
                      .includes(restoreSearch.toLowerCase()),
                  ).length === 0 && (
                    <div className="p-6 text-center text-gray-400">
                      <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No backups found</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedRestoreFile && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    Selected: {selectedRestoreFile.fileName}
                  </p>
                </div>
              )}

              <div>
                <FormFieldLabel
                  label="Passphrase"
                  required={selectedRestoreFile?.encrypted}
                />
                <input
                  type="password"
                  required={selectedRestoreFile?.encrypted}
                  value={restorePassphrase}
                  onChange={(e) => setRestorePassphrase(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter passphrase to decrypt"
                />
                {selectedRestoreFile?.encrypted && (
                  <p className="mt-1 text-xs text-gray-500">
                    Required - this backup is encrypted
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </FormModalShell>

      {/* Schedule Settings Modal */}
      <FormModalShell
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Settings"
        maxWidthClass="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsScheduleOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                handleUpdateSchedule(e as any);
              }}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Enable Auto Backups</p>
              <p className="text-sm text-gray-500">
                Run backups automatically based on schedule
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={scheduleForm.enabled}
                onChange={(e) =>
                  setScheduleForm({
                    ...scheduleForm,
                    enabled: e.target.checked,
                  })
                }
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div
            className={`space-y-4 transition-opacity ${!scheduleForm.enabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["DAILY", "WEEKLY", "MONTHLY"].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() =>
                      setScheduleForm({
                        ...scheduleForm,
                        frequency: freq,
                      })
                    }
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      scheduleForm.frequency === freq
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {freq === "DAILY"
                      ? "Daily"
                      : freq === "WEEKLY"
                        ? "Weekly"
                        : "Monthly"}
                  </button>
                ))}
              </div>
            </div>

            {scheduleForm.frequency === "WEEKLY" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Day of Week
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                    (day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setScheduleForm({
                            ...scheduleForm,
                            dayOfWeek: day,
                          })
                        }
                        className={`px-2 py-2 rounded-lg font-medium text-sm transition-colors ${
                          scheduleForm.dayOfWeek === day
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {day.charAt(0)}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Backup Time
              </label>
              <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-2">
                    Select Hour
                  </label>
                  <select
                    value={scheduleForm.hour}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        hour: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
                      const period = i < 12 ? "AM" : "PM";
                      return (
                        <option key={i} value={i}>
                          {hour} {period}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Schedule will run at{" "}
                <span className="font-semibold text-gray-700">
                  {scheduleForm.hour === 0
                    ? "12 AM"
                    : scheduleForm.hour < 12
                      ? `${scheduleForm.hour} AM`
                      : scheduleForm.hour === 12
                        ? "12 PM"
                        : `${scheduleForm.hour - 12} PM`}
                </span>
              </p>
            </div>
          </div>
        </div>
      </FormModalShell>

      <FormModalShell
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={
          actionModal?.type === "delete"
            ? "Delete Backup"
            : actionModal?.type === "restore"
              ? "Restore Database"
              : "Download Backup"
        }
        maxWidthClass="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActionModal(null)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                handleAction(e as any);
              }}
              disabled={isSubmitting}
              className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                actionModal?.type === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : actionModal?.type === "restore"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting
                ? "Processing..."
                : actionModal?.type === "delete"
                  ? "Confirm Delete"
                  : actionModal?.type === "restore"
                    ? "Confirm Restore"
                    : "Download"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">Selected Backup:</p>
            <p className="font-medium text-gray-900 break-all">
              {actionModal?.backup.fileName}
            </p>
          </div>

          {actionModal?.type === "delete" && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 font-medium">
                Warning: This action cannot be undone. The backup file will be
                permanently deleted.
              </p>
            </div>
          )}
          {actionModal?.type === "restore" && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-700 font-medium">
                Warning: Restoring will overwrite the current database. Make
                sure you know what you are doing.
              </p>
            </div>
          )}

          {actionModal?.backup.encrypted && (
            <div>
              <FormFieldLabel label="Passphrase" required />
              <input
                type="password"
                required
                value={actionPassphrase}
                onChange={(e) => setActionPassphrase(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter decryption passphrase"
              />
              <p className="mt-1 text-xs text-gray-500">
                Required to decrypt this backup
              </p>
            </div>
          )}
        </div>
      </FormModalShell>

      {/* Success Modal */}
      <ActionModal
        isOpen={successModal.isOpen}
        onClose={() =>
          setSuccessModal({ isOpen: false, title: "", message: "" })
        }
        title={successModal.title}
        type="success"
      >
        {successModal.message}
      </ActionModal>

      {/* Error Modal */}
      <ActionModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: "", message: "" })}
        title={errorModal.title}
        type="danger"
      >
        {errorModal.message}
      </ActionModal>
    </div>
  );
}
