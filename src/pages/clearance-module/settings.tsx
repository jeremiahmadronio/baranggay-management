import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  Clock3,
  RotateCcw,
  Trash2,
  FileText,
  Search,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  fetchTemplateOptionsWithStatus,
  restoreTemplate,
} from "../../clearance-api/template-api";
import {
  CLEARANCE_PERMISSIONS,
  getMyAccess,
  hasAnyClearancePermission,
} from "../../service/clearance-api/ClearancePermission";
import type { TemplateOption } from "../../clearance-api/types";
import {
  fetchIssuedCertificates,
  restoreIssuedCertificate,
  type IssuedCertificate,
} from "../../clearance-api/issued-certificate-api";
import { ActionModal, ConfirmModal } from "../../reusable";

type TemplateWithStatus = TemplateOption & { isArchived: boolean };

const DELETED_ARCHIVED_TEMPLATE_IDS_KEY = "clearance.deletedArchivedTemplateIds";
const ARCHIVED_TEMPLATE_DATES_KEY = "clearance.archivedTemplateDates";
const ARCHIVED_CERTIFICATE_DATES_KEY = "clearance.archivedCertificateDates";

const readDeletedIds = (key: string): Set<string> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
};

const writeDeletedIds = (key: string, ids: Set<string>) => {
  localStorage.setItem(key, JSON.stringify([...ids]));
};

const readArchivedTemplateDates = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(ARCHIVED_TEMPLATE_DATES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    const dates: Record<string, string> = {};
    Object.entries(parsed).forEach(([id, value]) => {
      if (typeof value === "string") dates[id] = value;
    });
    return dates;
  } catch {
    return {};
  }
};

const writeArchivedTemplateDates = (dates: Record<string, string>) => {
  localStorage.setItem(ARCHIVED_TEMPLATE_DATES_KEY, JSON.stringify(dates));
};

const readArchivedCertificateDates = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(ARCHIVED_CERTIFICATE_DATES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return {};

    const dates: Record<string, string> = {};
    Object.entries(parsed).forEach(([id, value]) => {
      if (typeof value === "string") dates[id] = value;
    });
    return dates;
  } catch {
    return {};
  }
};

const writeArchivedCertificateDates = (dates: Record<string, string>) => {
  localStorage.setItem(ARCHIVED_CERTIFICATE_DATES_KEY, JSON.stringify(dates));
};

const parseStoredDate = (value?: string): Date | null => {
  if (!value) return null;

  const numeric = Number(value);
  if (Number.isFinite(numeric) && value.trim() !== "") {
    const fromEpoch = new Date(numeric);
    if (!Number.isNaN(fromEpoch.getTime())) return fromEpoch;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const toDateOnly = (value?: string): string => {
  const parsed = parseStoredDate(value);
  if (!parsed) return "";
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDateTime = (value?: string): string => {
  const parsed = parseStoredDate(value);
  if (!parsed) return "N/A";
  return parsed.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const isDateWithinRange = (
  value: string,
  from: string,
  to: string,
): boolean => {
  const normalized = toDateOnly(value);
  if (!normalized) return !from && !to;
  if (from && normalized < from) return false;
  if (to && normalized > to) return false;
  return true;
};

const isCurrentMonthDate = (value: string): boolean => {
  const parsed = parseStoredDate(value);
  if (!parsed) return false;
  const now = new Date();
  return (
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth()
  );
};

export const ClearanceSettings = () => {
  const [searchParams] = useSearchParams();
  const [templates, setTemplates] = useState<TemplateWithStatus[]>([]);
  const [archivedCertificates, setArchivedCertificates] = useState<
    IssuedCertificate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [archiveTargetView, setArchiveTargetView] = useState<
    "certificates" | "templates"
  >("templates");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [canRestoreTemplates, setCanRestoreTemplates] = useState(true);
  const [canRestoreCertificates, setCanRestoreCertificates] = useState(true);
  const [templateArchivedDates, setTemplateArchivedDates] = useState<Record<string, string>>({});
  const [certificateArchivedDates, setCertificateArchivedDates] = useState<Record<string, string>>({});

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "certificates" || view === "templates") {
      setArchiveTargetView(view);
    }
  }, [searchParams]);

  useEffect(() => {
    setAppliedSearch(searchInput);
  }, [searchInput]);

  // ── Modal state ──
  const [restoreTarget, setRestoreTarget] = useState<TemplateWithStatus | null>(
    null,
  );
  const [restoreCertTarget, setRestoreCertTarget] =
    useState<IssuedCertificate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateWithStatus | null>(null);

  // ── Toast ──
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "danger" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [templateData, certData] = await Promise.all([
        fetchTemplateOptionsWithStatus(),
        fetchIssuedCertificates(0, 300),
      ]);
      const deletedTemplateIds = readDeletedIds(DELETED_ARCHIVED_TEMPLATE_IDS_KEY);

      const archivedTemplateDates = readArchivedTemplateDates();
      const today = String(Date.now());
      const nextTemplateDates = { ...archivedTemplateDates };
      const archivedCertificateDates = readArchivedCertificateDates();
      const nextCertificateDates = { ...archivedCertificateDates };
      const archivedCertificatesOnly = (certData.content || []).filter(
        (item) => item.isArchived,
      );

      templateData
        .filter((item) => item.isArchived)
        .forEach((item) => {
          const id = String(item.id);
          if (!nextTemplateDates[id]) {
            nextTemplateDates[id] = today;
          }
        });

      writeArchivedTemplateDates(nextTemplateDates);
      setTemplateArchivedDates(nextTemplateDates);

      archivedCertificatesOnly.forEach((item) => {
        const id = String(item.id);
        if (!nextCertificateDates[id]) {
          nextCertificateDates[id] =
            item.archivedAt || item.dateIssued || today;
        }
      });
      writeArchivedCertificateDates(nextCertificateDates);
      setCertificateArchivedDates(nextCertificateDates);

      setTemplates(
        templateData.filter((item) => !deletedTemplateIds.has(String(item.id))),
      );
      setArchivedCertificates(archivedCertificatesOnly);
    } catch {
      console.error("Failed to load archived records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let isMounted = true;

    const loadAccess = async () => {
      try {
        const access = await getMyAccess();
        if (!isMounted) return;

        const templateAllowed = hasAnyClearancePermission(access, [
          CLEARANCE_PERMISSIONS.EDIT_TEMPLATE,
        ]);

        const certificateAllowed = hasAnyClearancePermission(access, [
          CLEARANCE_PERMISSIONS.ISSUE_CLEARANCE,
        ]);

        setCanRestoreTemplates(templateAllowed);
        setCanRestoreCertificates(certificateAllowed);
      } catch {
        // Do not block restore UX on permission endpoint errors.
        if (isMounted) {
          setCanRestoreTemplates(true);
          setCanRestoreCertificates(true);
        }
      }
    };

    loadAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRestore = async () => {
    if (!canRestoreTemplates) {
      showToast("You do not have permission to restore archived templates.", "error");
      return;
    }
    if (!restoreTarget) return;
    try {
      await restoreTemplate(restoreTarget.id);
      setRestoreTarget(null);
      await load();
    } catch {
      showToast("Failed to restore template.", "error");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return;
    const deleted = readDeletedIds(DELETED_ARCHIVED_TEMPLATE_IDS_KEY);
    deleted.add(String(deleteTarget.id));
    writeDeletedIds(DELETED_ARCHIVED_TEMPLATE_IDS_KEY, deleted);

    const nextDates = { ...templateArchivedDates };
    delete nextDates[String(deleteTarget.id)];
    writeArchivedTemplateDates(nextDates);
    setTemplateArchivedDates(nextDates);

    setDeleteTarget(null);
    await load();
    setActionModal({
      isOpen: true,
      title: "Archived Template Deleted",
      message: "The archived template has been removed from the list.",
      type: "success",
    });
  };

  const handleRestoreCertificate = async () => {
    if (!canRestoreCertificates) {
      showToast("You do not have permission to restore archived certificates.", "error");
      return;
    }
    if (!restoreCertTarget) return;
    try {
      await restoreIssuedCertificate(restoreCertTarget.id);
      const nextCertificateDates = { ...certificateArchivedDates };
      delete nextCertificateDates[String(restoreCertTarget.id)];
      writeArchivedCertificateDates(nextCertificateDates);
      setCertificateArchivedDates(nextCertificateDates);
      setRestoreCertTarget(null);
      await load();
    } catch {
      showToast("Failed to restore archived certificate.", "error");
    }
  };

  const archived = templates.filter((t) => t.isArchived);
  const archivedCertCount = archivedCertificates.length;
  const archivedCertFree = archivedCertificates.filter((c) => c.isFree).length;
  const restorableCertificateCount = archivedCertCount;
  const archivedTemplatesThisMonth = archived.filter((t) =>
    isCurrentMonthDate(templateArchivedDates[String(t.id)] || ""),
  ).length;
  const archivedCertificatesThisMonth = archivedCertificates.filter((c) =>
    isCurrentMonthDate(certificateArchivedDates[String(c.id)] || ""),
  ).length;
  const filteredTemplates = archived.filter((t) => {
    const keyword = appliedSearch.trim().toLowerCase();
    const archivedDate = templateArchivedDates[String(t.id)] || "";
    const matchesDate = isDateWithinRange(archivedDate, dateFrom, dateTo);
    const matchesKeyword =
      !keyword ||
      t.name.toLowerCase().includes(keyword) ||
      String(t.id).toLowerCase().includes(keyword);

    return matchesKeyword && matchesDate;
  });

  const filteredCertificates = archivedCertificates.filter((c) => {
    const keyword = appliedSearch.trim().toLowerCase();
    const archivedDate = certificateArchivedDates[String(c.id)] || "";
    const matchesDate = isDateWithinRange(archivedDate, dateFrom, dateTo);
    const matchesKeyword =
      !keyword ||
      c.requesterName.toLowerCase().includes(keyword) ||
      c.certificateType.toLowerCase().includes(keyword) ||
      String(c.orNumber || "").toLowerCase().includes(keyword) ||
      String(c.id).toLowerCase().includes(keyword);

    return matchesKeyword && matchesDate;
  });

  const restorableTemplateCount = archived.length;

  const clearFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setDateFrom("");
    setDateTo("");
  };

  const todayDateOnly = toDateOnly(String(Date.now()));

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total Archived
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {archiveTargetView === "certificates"
                    ? archivedCertCount
                    : archived.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              {archiveTargetView === "certificates"
                ? "All archived clearance certificates"
                : "All archived template records"}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Archived This Month
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {archiveTargetView === "certificates"
                    ? archivedCertificatesThisMonth
                    : archivedTemplatesThisMonth}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Archive movement for current month
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {archiveTargetView === "certificates"
                    ? "Resident Archives"
                    : "Archived Templates"}
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {archiveTargetView === "certificates"
                    ? archivedCertFree
                    : archived.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Clock3 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              {archiveTargetView === "certificates"
                ? "Archived resident-linked records"
                : "Templates currently archived"}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ready To Restore
                </p>
                <p className="text-3xl font-semibold text-gray-900 mt-2">
                  {archiveTargetView === "certificates"
                    ? restorableCertificateCount
                    : restorableTemplateCount}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              {archiveTargetView === "certificates"
                ? "Certificates available for restoration"
                : "Templates available for restoration"}
            </p>
          </div>
        </div>

        {archiveTargetView === "certificates" ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_180px_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search archived certificates..."
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={todayDateOnly}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    max={todayDateOnly}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Requestor
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Certificate
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      OR No.
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fee
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                        Loading archived certificate records...
                      </td>
                    </tr>
                  ) : filteredCertificates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                        No archived certificates found.
                      </td>
                    </tr>
                  ) : (
                    filteredCertificates.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDateTime(
                            certificateArchivedDates[String(item.id)] ||
                              item.archivedAt ||
                              item.dateIssued,
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.requesterName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.certificateType}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.orNumber || (item.isFree ? "FREE" : "-")}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.isFree
                            ? "Free"
                            : item.fee
                              ? `PHP ${item.fee.toFixed(2)}`
                              : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Archived
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              if (!canRestoreCertificates) {
                                showToast(
                                  "You do not have permission to restore archived certificates.",
                                  "error",
                                );
                                return;
                              }
                              setRestoreCertTarget(item);
                            }}
                            disabled={!canRestoreCertificates}
                            title={
                              canRestoreCertificates
                                ? "Restore archived certificate"
                                : "No permission to restore archived certificate"
                            }
                            aria-label="Restore archived certificate"
                            className={`inline-flex h-7 w-7 items-center justify-center border rounded-lg transition-colors ${
                              canRestoreCertificates
                                ? "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                : "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                            }`}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px_180px_auto] gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search by template name or ID..."
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={todayDateOnly}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    max={todayDateOnly}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Template ID
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Archived Date
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                        Loading templates...
                      </td>
                    </tr>
                  ) : filteredTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                        No archived templates found.
                      </td>
                    </tr>
                  ) : (
                    filteredTemplates.map((t) => (
                      <tr
                        key={String(t.id)}
                        className="border-b border-gray-100 hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {t.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {String(t.id)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatDateTime(templateArchivedDates[String(t.id)])}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Archived
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (!canRestoreTemplates) {
                                  showToast(
                                    "You do not have permission to restore archived templates.",
                                    "error",
                                  );
                                  return;
                                }
                                setRestoreTarget(t);
                              }}
                              disabled={!canRestoreTemplates}
                              title={
                                canRestoreTemplates
                                  ? "Restore archived template"
                                  : "No permission to restore archived template"
                              }
                              aria-label="Restore archived template"
                              className={`inline-flex h-7 w-7 items-center justify-center border rounded-lg transition-colors ${
                                canRestoreTemplates
                                  ? "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                  : "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed"
                              }`}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(t)}
                              title="Delete archived template from list"
                              aria-label="Delete archived template"
                              className="inline-flex h-7 w-7 items-center justify-center border rounded-lg transition-colors text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!restoreTarget}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore Archived Template"
        message={`Are you sure you want to restore "${restoreTarget?.name || ""}"? It will be available again in Issue Certificate and active template lists.`}
        confirmText="Restore Template"
        type="info"
      />

      <ConfirmModal
        isOpen={!!restoreCertTarget}
        onCancel={() => setRestoreCertTarget(null)}
        onConfirm={handleRestoreCertificate}
        title="Restore Archived Certificate"
        message={`Are you sure you want to restore archived certificate for "${restoreCertTarget?.requesterName || ""}"?`}
        confirmText="Restore Certificate"
        type="info"
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTemplate}
        title="Delete Archived Template"
        message={`Delete "${deleteTarget?.name || ""}" from archived list? This only removes it from this archive list.`}
        confirmText="Delete"
        type="danger"
      />

      <ActionModal
        isOpen={actionModal.isOpen}
        onClose={() =>
          setActionModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
        title={actionModal.title}
        type={actionModal.type}
      >
        {actionModal.message}
      </ActionModal>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-lg text-white text-sm font-medium max-w-sm flex items-center gap-2 z-50 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default ClearanceSettings;
