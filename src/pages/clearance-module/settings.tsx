import { useEffect, useState, useCallback } from "react";
import {
  Archive,
  RotateCcw,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  fetchTemplateOptionsWithStatus,
  archiveTemplate,
  restoreTemplate,
} from "../../clearance-api/template-api";
import type { TemplateOption } from "../../clearance-api/types";
import { ConfirmModal } from "../../reusable";

type TemplateWithStatus = TemplateOption & { isArchived: boolean };

export const ClearanceSettings = () => {
  const [templates, setTemplates] = useState<TemplateWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "archived">("active");

  // ── Modal state ──
  const [archiveTarget, setArchiveTarget] = useState<TemplateWithStatus | null>(
    null,
  );
  const [restoreTarget, setRestoreTarget] = useState<TemplateWithStatus | null>(
    null,
  );

  // ── Toast ──
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

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
      const data = await fetchTemplateOptionsWithStatus();
      setTemplates(data);
    } catch {
      console.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Handlers ──
  const handleArchive = async (reason?: string) => {
    if (!archiveTarget) return;
    try {
      await archiveTemplate(archiveTarget.id, reason);
      showToast(`"${archiveTarget.name}" archived.`);
      setArchiveTarget(null);
      await load();
    } catch {
      showToast("Failed to archive template.", "error");
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      await restoreTemplate(restoreTarget.id);
      showToast(`"${restoreTarget.name}" restored.`);
      setRestoreTarget(null);
      await load();
    } catch {
      showToast("Failed to restore template.", "error");
    }
  };

  const active = templates.filter((t) => !t.isArchived);
  const archived = templates.filter((t) => t.isArchived);
  const displayed = tab === "active" ? active : archived;

  return (
    <div className="p-4 w-full">
      <div className="max-w-[900px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-lg font-bold text-gray-800">
            Clearance Settings
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage certificate templates — archive unused ones or restore them
            when needed.
          </p>
        </div>

        {/* Template Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab("active")}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                tab === "active"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Active Templates
              <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-100 text-blue-600 font-bold">
                {active.length}
              </span>
            </button>
            <button
              onClick={() => setTab("archived")}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                tab === "archived"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              Archived
              <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-gray-200 text-gray-600 font-bold">
                {archived.length}
              </span>
            </button>
          </div>

          {/* Template List */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-10 text-sm text-gray-400">
                Loading templates...
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">
                {tab === "active"
                  ? "No active templates."
                  : "No archived templates."}
              </div>
            ) : (
              <div className="space-y-2">
                {displayed.map((t) => (
                  <div
                    key={String(t.id)}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          t.isArchived
                            ? "bg-gray-100 text-gray-400"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${t.isArchived ? "text-gray-400" : "text-gray-800"}`}
                        >
                          {t.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {t.isFree ? "Free" : "Paid"} • ID: {String(t.id)}
                        </p>
                      </div>
                    </div>

                    {t.isArchived ? (
                      <button
                        onClick={() => setRestoreTarget(t)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => setArchiveTarget(t)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Archive className="w-3 h-3" />
                        Archive
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Archive Confirmation */}
      <ConfirmModal
        isOpen={!!archiveTarget}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive Template"
        message={`Archive "${archiveTarget?.name || ""}"? It will no longer appear in the certificate issuance dropdown. You can restore it later.`}
        confirmText="Archive"
        type="warning"
        reasonLabel="Reason for archiving"
        reasonPlaceholder="e.g., Outdated template, no longer used..."
        reasonRequired
      />

      {/* Restore Confirmation */}
      <ConfirmModal
        isOpen={!!restoreTarget}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore Template"
        message={`Restore "${restoreTarget?.name || ""}"? It will become available again in the certificate issuance dropdown.`}
        confirmText="Restore"
        type="info"
      />

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
