import { useEffect, useMemo, useState, useRef } from "react";
import { TemplateSelector } from "./TemplateSelector";
import { TemplateEditor } from "./TemplateEditor";
import { CertificatePreview } from "./CertificatPreview";
import {
  fetchTemplateOptions,
  fetchTemplate,
  saveTemplate,
  resetTemplate,
  extractVariables,
  type TemplateData,
  type TemplateOption,
} from "../../../clearance-api/template-api";
import { ActionModal } from "../../../reusable";
import { Loader2 } from "lucide-react";
export default function EditTemplate() {
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "error" | "warning";
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

  const showActionModal = (
    title: string,
    message: string,
    type: "success" | "danger" | "info" = "success",
  ) => {
    setActionModal({
      isOpen: true,
      title,
      message,
      type,
    });
  };
  const requiredVarsMap = useRef<Record<string, string[]>>({});
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await fetchTemplateOptions();
        setTemplateOptions(options);
        if (options.length > 0) {
          const defaultId =
            options.find((o) => o.id === "barangay-clearance")?.id ||
            options[0].id;
          setSelectedTemplateId(String(defaultId));
        }
      } catch (error) {
        console.error("Failed to load options", error);
      }
    };
    loadOptions();
  }, []);
  useEffect(() => {
    if (!selectedTemplateId) return;
    const loadTemplate = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTemplate(selectedTemplateId);
        const varsMap: Record<string, string[]> = {};
        data.bodySections.forEach((section) => {
          varsMap[section.id] = extractVariables(section.text).map(
            (v) => `{{${v}}}`,
          );
        });
        requiredVarsMap.current = varsMap;
        const enrichedData: TemplateData = {
          ...data,
          bodySections: data.bodySections.map((section) => ({
            ...section,
            requiredVariables: varsMap[section.id] || [],
          })),
        };
        setTemplateData(enrichedData);
      } catch (error) {
        console.error("Failed to load template", error);
        setNotification({
          message: "Failed to load template",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplate();
  }, [selectedTemplateId]);
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  const validationErrors = useMemo(() => {
    if (!templateData) return [];
    const errors: {
      sectionIndex: number;
      sectionId: string;
      missingVars: string[];
    }[] = [];
    templateData.bodySections.forEach((section, idx) => {
      const required = requiredVarsMap.current[section.id] || [];
      const currentVars = extractVariables(section.text).map((v) => `{{${v}}}`);
      const missing = required.filter((v) => !currentVars.includes(v));
      if (missing.length > 0) {
        errors.push({
          sectionIndex: idx,
          sectionId: section.id,
          missingVars: missing,
        });
      }
    });
    return errors;
  }, [templateData]);
  const canSave = validationErrors.length === 0;
  const handleUpdate = (updatedTemplate: TemplateData) => {
    const enriched: TemplateData = {
      ...updatedTemplate,
      bodySections: updatedTemplate.bodySections.map((section) => ({
        ...section,
        requiredVariables:
          requiredVarsMap.current[section.id] ||
          section.requiredVariables ||
          [],
      })),
    };
    setTemplateData(enriched);
  };

  const handleSave = async () => {
    if (!templateData) return;
    if (!canSave) {
      const totalMissing = validationErrors.reduce(
        (sum, e) => sum + e.missingVars.length,
        0,
      );
      setNotification({
        message: `Cannot save — ${totalMissing} required variable${totalMissing > 1 ? "s" : ""} missing. Please add them back.`,
        type: "warning",
      });
      return;
    }
    setIsSaving(true);
    try {
      await saveTemplate(templateData.id, templateData);
      showActionModal("Template Saved", "Template saved successfully!", "success");
    } catch (error) {
      setNotification({
        message: "Failed to save template",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleReset = async () => {
    if (!selectedTemplateId) return;
    setIsLoading(true);
    try {
      // Use resetTemplate to clear localStorage and get original mock data
      const data = await resetTemplate(selectedTemplateId);
      // Recompute required variables
      const varsMap: Record<string, string[]> = {};
      data.bodySections.forEach((section) => {
        varsMap[section.id] = extractVariables(section.text).map(
          (v) => `{{${v}}}`,
        );
      });
      requiredVarsMap.current = varsMap;
      const enrichedData: TemplateData = {
        ...data,
        bodySections: data.bodySections.map((section) => ({
          ...section,
          requiredVariables: varsMap[section.id] || [],
        })),
      };
      setTemplateData(enrichedData);
      showActionModal("Template Reset", "Template reset to original", "success");
    } catch (error) {
      console.error("Failed to reset", error);
      setNotification({
        message: "Failed to reset template",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen font-sans text-gray-900 pb-12 bg-gray-50">
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Template Selector */}
        <TemplateSelector
          options={templateOptions}
          selectedId={selectedTemplateId}
          onSelect={setSelectedTemplateId}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-5/12">
            {isLoading ? (
              <div className="flex items-center justify-center bg-white rounded-lg border border-gray-200 p-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : templateData ? (
              <TemplateEditor
                template={templateData}
                onUpdate={handleUpdate}
                onSave={handleSave}
                onReset={handleReset}
                isSaving={isSaving}
                canSave={canSave}
                validationErrors={validationErrors}
              />
            ) : null}
          </div>

          <div className="w-full lg:w-7/12 lg:sticky lg:top-6 lg:self-start">
            {isLoading ? (
              <div className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 p-12">
                <p className="text-gray-400">Loading preview...</p>
              </div>
            ) : templateData ? (
              <CertificatePreview template={templateData} />
            ) : null}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-lg text-white text-sm font-medium transition-all transform translate-y-0 max-w-sm ${notification.type === "warning" ? "bg-amber-500" : "bg-red-600"}`}
        >
          {notification.message}
        </div>
      )}

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
        <p>{actionModal.message}</p>
      </ActionModal>
    </div>
  );
}
