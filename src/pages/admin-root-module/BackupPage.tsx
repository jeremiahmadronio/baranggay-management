import React, { useEffect, useState } from "react";
import {
  Database,
  RefreshCw,
  Plus,
  Upload,
  Calendar,
  Download,
  RotateCcw,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  backupApi,
  type BackupResponseDTO,
  type BackupStatsDTO,
  type BackupSchedule,
} from "../../service/system-admin-api/database-backup";
import { formatDate } from "./utils/formatter";
import { Modal } from "./modal/BackupModal";

const formatFileSize = (sizeKb: number | null | undefined): string => {
  if (!sizeKb) return "—";
  const kb = sizeKb;
  const mb = kb / 1024;
  const gb = mb / 1024;

  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  } else if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  } else {
    return `${kb.toFixed(2)} KB`;
  }
};
export function BackupPage() {
  const [backups, setBackups] = useState<BackupResponseDTO[]>([]);
  const [stats, setStats] = useState<BackupStatsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [backupsData, statsData] = await Promise.all([
        backupApi.listBackups().catch(() => []),
        backupApi.getStats().catch(() => null),
      ]);
      setBackups(backupsData);
      setStats(statsData);
    } catch (error: any) {
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      fetchData();
    } catch (error: any) {
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUploadRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) return;
    setIsSubmitting(true);
    try {
      await backupApi.restoreFromUpload(uploadForm.file, uploadForm.passphrase);
      setIsUploadOpen(false);
      setUploadForm({
        file: null,
        passphrase: "",
      });
      fetchData();
    } catch (error: any) {
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await backupApi.updateSchedule(scheduleForm);
      setIsScheduleOpen(false);
      fetchData();
    } catch (error: any) {
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
      } else if (type === "restore") {
        await backupApi.restoreFromCloud(backup.fileName, actionPassphrase);
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
      }
      setActionModal(null);
      setActionPassphrase("");
      if (type !== "download") fetchData();
    } catch (error: any) {
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl border border-blue-400/30 shadow-md">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Database Backups
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage and monitor your database backup operations
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 shadow-sm hover:shadow-md"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Storage Used"
            icon={<HardDrive className="w-5 h-5 text-purple-500" />}
            value={stats ? `${stats.storageUsedGb.toFixed(2)} GB` : "—"}
            subtext={stats ? `of ${stats.storageLimitGb} GB limit` : "—"}
          >
            {stats && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                <div
                  className="bg-purple-500 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min((stats.storageUsedGb / stats.storageLimitGb) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            )}
          </StatCard>

          <StatCard
            title="Auto Backup"
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            value={stats?.autoBackupFrequency || "Disabled"}
            subtext="Current schedule"
          />

          <StatCard
            title="Next Backup"
            icon={<Calendar className="w-5 h-5 text-orange-500" />}
            value={formatDate(stats?.nextBackupTime)}
            subtext="Scheduled time"
          />

          <StatCard
            title="Last Backup"
            icon={
              stats?.lastBackupStatus === "SUCCESS" ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : stats?.lastBackupStatus === "FAILED" ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Database className="w-5 h-5 text-gray-400" />
              )
            }
            value={formatDate(stats?.lastBackupDate)}
            subtext={
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${stats?.lastBackupStatus === "SUCCESS" ? "bg-green-50 text-green-600" : stats?.lastBackupStatus === "FAILED" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}
              >
                {stats?.lastBackupStatus || "UNKNOWN"}
              </span>
            }
          />
        </div>

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

        {/* Backup List Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-700 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-800">
                    File Name
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-800">
                    Label
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-800">
                    Created At
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-800">
                    Size
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-800 text-center">
                    Security
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-800 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {backups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No backups found.</p>
                    </td>
                  </tr>
                ) : (
                  backups.map((backup) => (
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
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td
                        className="px-6 py-4 font-mono text-gray-700 max-w-[250px] truncate"
                        title={backup.fileName}
                      >
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{backup.fileName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {backup.label ? (
                          <span className="px-3 py-1 bg-blue-100 rounded-full text-xs font-medium text-blue-700">
                            {backup.label}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(backup.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {formatFileSize(backup.fileSizeKb)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {backup.encrypted ? (
                          <div
                            title="Encrypted"
                            className="flex justify-center"
                          >
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-100">
                              <Lock className="w-4 h-4 text-green-600" />
                            </span>
                          </div>
                        ) : (
                          <div
                            title="Not Encrypted"
                            className="flex justify-center"
                          >
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100">
                              <Unlock className="w-4 h-4 text-gray-500" />
                            </span>
                          </div>
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
                            onClick={() => openActionModal("restore", backup)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Restore"
                          >
                            <RotateCcw className="w-4 h-4" />
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}

      {/* Create Backup Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Manual Backup"
      >
        <form onSubmit={handleCreateBackup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label (Optional)
            </label>
            <input
              type="text"
              value={createForm.label}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  label: e.target.value,
                })
              }
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., Before major update"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passphrase (Optional)
            </label>
            <input
              type="password"
              value={createForm.passphrase}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  passphrase: e.target.value,
                })
              }
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Encrypt backup with passphrase"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Backup"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload & Restore Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload & Restore"
      >
        <form onSubmit={handleUploadRestore} className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passphrase (If encrypted)
            </label>
            <input
              type="password"
              value={uploadForm.passphrase}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  passphrase: e.target.value as any,
                })
              }
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter passphrase to decrypt"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !uploadForm.file}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Restoring..." : "Restore Database"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Settings Modal */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Settings"
      >
        <form onSubmit={handleUpdateSchedule} className="space-y-4">
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
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
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
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Schedule will run at{" "}
                <span className="font-semibold text-gray-700">
                  {String(scheduleForm.hour).padStart(2, "0")}:00
                </span>
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsScheduleOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Action Modal (Delete/Restore/Download) */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={
          actionModal?.type === "delete"
            ? "Delete Backup"
            : actionModal?.type === "restore"
              ? "Restore Database"
              : "Download Backup"
        }
      >
        <form onSubmit={handleAction} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Selected File:</p>
            <p className="font-mono text-sm text-gray-900 break-all">
              {actionModal?.backup.fileName}
            </p>
          </div>

          {actionModal?.type === "delete" && (
            <p className="text-sm text-red-600">
              Warning: This action cannot be undone. The backup file will be
              permanently deleted.
            </p>
          )}
          {actionModal?.type === "restore" && (
            <p className="text-sm text-orange-600">
              Warning: Restoring will overwrite the current database. Make sure
              you know what you are doing.
            </p>
          )}

          {actionModal?.backup.encrypted && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passphrase Required
              </label>
              <input
                type="password"
                required
                value={actionPassphrase}
                onChange={(e) => setActionPassphrase(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter decryption passphrase"
              />
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setActionModal(null)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${actionModal?.type === "delete" ? "bg-red-600 hover:bg-red-700" : actionModal?.type === "restore" ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"}`}
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
        </form>
      </Modal>
    </div>
  );
}
function StatCard({
  title,
  icon,
  value,
  subtext,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  subtext: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col shadow-sm"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
          {icon}
        </div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      </div>
      <div className="mt-auto">
        <p className="text-2xl font-bold text-gray-900 tracking-tight">
          {value}
        </p>
        <div className="text-sm text-gray-400 mt-1">{subtext}</div>
        {children}
      </div>
    </motion.div>
  );
}
