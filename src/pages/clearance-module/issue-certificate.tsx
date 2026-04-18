import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  FileText,
  Check,
  Printer,
  Archive,
  User,
  ClipboardList,
  Wallet,
  Car,
  Loader2,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import { LoadingModal } from "../../reusable/LoadingModal";
import { ActionModal, ConfirmModal } from "../../reusable";
import {
  archiveTemplate,
  fetchTemplateOptions,
  getPreviewData,
  type TemplateOption,
} from "../../clearance-api/template-api";
import {
  fetchIssuanceTemplate,
  issueCertificate,
  type IssuanceTemplate,
  type FormFieldConfig,
} from "../../clearance-api/issue-certificate-api";
import type { FormSection as FormSectionType } from "../../clearance-api/types";
import { CertificatePreview } from "./clearance-template/CertificatPreview";
import { type TemplateData } from "./clearance-template/template";
import {
  searchPeople,
  type PersonSearchResponseDTO,
} from "../../blotter-api/Resident";

// ============================================
// MAIN COMPONENT
// ============================================

export const IssueCertificatePage = () => {
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateData, setTemplateData] = useState<IssuanceTemplate | null>(
    null,
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchivingTemplate, setIsArchivingTemplate] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
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
  const [formResetSignal, setFormResetSignal] = useState(0);
  const printContentRef = useRef<HTMLDivElement | null>(null);
  const pendingPrintWindowRef = useRef<Window | null>(null);

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

  const loadTemplateOptions = useCallback(async () => {
    const options = await fetchTemplateOptions();
    setTemplateOptions(options);
    setSelectedTemplateId((prev) => {
      if (!options.length) return "";
      if (prev && options.some((o) => String(o.id) === String(prev))) {
        return prev;
      }
      const fallbackId =
        options.find((o) => String(o.id) === "barangay-clearance")?.id ||
        options[0].id;
      return String(fallbackId);
    });
  }, []);

  // Map resident profile to form field values
  const mapResidentToFormData = useCallback(
    (resident: PersonSearchResponseDTO): Record<string, string> => {
      const fullName = [
        resident.firstName,
        resident.middleName,
        resident.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      const mapped: Record<string, string> = {};
      // snake_case keys (API templates)
      if (fullName) {
        mapped.full_name = fullName;
        mapped.FULL_NAME = fullName;
      }
      if (resident.age) {
        mapped.age = String(resident.age);
        mapped.AGE = String(resident.age);
      }
      if (resident.civilStatus) {
        mapped.civil_status = resident.civilStatus;
        mapped.CIVIL_STATUS = resident.civilStatus;
      }
      if (resident.completeAddress) {
        mapped.address = resident.completeAddress;
        mapped.ADDRESS = resident.completeAddress;
      }
      if (resident.gender) {
        mapped.gender = resident.gender;
        mapped.GENDER = resident.gender;
      }
      if (resident.birthDate) {
        mapped.date_of_birth = resident.birthDate;
        mapped.DATE_OF_BIRTH = resident.birthDate;
      }
      if (resident.contactNumber) {
        mapped.contact_no = resident.contactNumber;
        mapped.CONTACT_NO = resident.contactNumber;
      }
      if (resident.email) {
        mapped.email = resident.email;
        mapped.EMAIL = resident.email;
      }
      return mapped;
    },
    [],
  );

  const handleResidentSelect = useCallback(
    (resident: PersonSearchResponseDTO) => {
      const residentData = mapResidentToFormData(resident);
      setFormData((prev) => ({ ...prev, ...residentData }));
    },
    [mapResidentToFormData],
  );

  // Load template options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        await loadTemplateOptions();
      } catch (error) {
        console.error("Failed to load options", error);
        setNotification({
          message: "Failed to load template options",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadOptions();
  }, [loadTemplateOptions]);

  useEffect(() => {
    const refreshOptions = async () => {
      try {
        await loadTemplateOptions();
      } catch {
        // avoid disruptive notifications for background refresh
      }
    };

    const handleFocus = () => {
      void refreshOptions();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshOptions();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadTemplateOptions]);

  // Helper function to format date as "Month Day, Year" (e.g., "March 8, 2026")
  const formatDateReadable = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to get day with ordinal suffix (e.g., "8th")
  const getDayWithOrdinal = (day: number): string => {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = day % 100;
    return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  // Helper function to get month name in uppercase
  const getMonthName = (date: Date): string => {
    return date.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  };

  // Helper function to calculate validity date (6 months from now by default)
  const calculateValidityDate = (months: number = 6): string => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return formatDateReadable(date);
  };

  const computeAgeFromBirthDate = (birthDateValue: string): number | null => {
    if (!birthDateValue) return null;
    const birthDate = new Date(birthDateValue);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  };

  const computeFullYearsBetween = (from: Date, to: Date): number => {
    let years = to.getFullYear() - from.getFullYear();
    const monthDiff = to.getMonth() - from.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && to.getDate() < from.getDate())) {
      years -= 1;
    }

    return years;
  };

  const toInputDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const computeYearsOfResidency = (residencySinceValue: string): number | null => {
    if (!residencySinceValue) return null;

    const parsedDate = new Date(residencySinceValue);
    let startDate: Date;

    if (!Number.isNaN(parsedDate.getTime())) {
      startDate = parsedDate;
    } else {
      const yearOnly = Number(residencySinceValue);
      if (!Number.isFinite(yearOnly)) return null;
      startDate = new Date(yearOnly, 0, 1);
    }

    const years = computeFullYearsBetween(startDate, new Date());
    return years >= 0 ? years : null;
  };

  const computeResidencySinceFromYears = (yearsValue: string): string | null => {
    if (!yearsValue.trim()) return "";

    const parsedYears = Number(yearsValue);
    if (!Number.isFinite(parsedYears) || parsedYears < 0) return null;

    const wholeYears = Math.floor(parsedYears);
    const today = new Date();
    const residencySince = new Date(today);
    residencySince.setFullYear(today.getFullYear() - wholeYears);
    return toInputDate(residencySince);
  };

  // Load selected template
  useEffect(() => {
    if (!selectedTemplateId) return;
    const loadTemplate = async () => {
      setIsLoading(true);
      try {
        const data = await fetchIssuanceTemplate(selectedTemplateId);
        setTemplateData(data);

        // Auto-fill common fields to reduce human error
        const today = new Date();
        const autoFilledData: Record<string, string> = {
          // Date and time fields (UPPER_SNAKE for legacy mock templates)
          DATE_ISSUED: formatDateReadable(today),
          OR_DATE: formatDateReadable(today),
          DAY: getDayWithOrdinal(today.getDate()),
          MONTH: getMonthName(today),
          YEAR: today.getFullYear().toString(),
          ISSUED_AT: "3S Center, Barangay Ugong, Valenzuela City",
          VALID_UNTIL: calculateValidityDate(data.settings.validityMonths || 6),
          amount: String(data.settings.fee || 0),
          fee: String(data.settings.fee || 0),
          AMOUNT: String(data.settings.fee || 0),
          AMOUNT_PAID: String(data.settings.fee || 0),
          // snake_case equivalents for API templates
          or_date: formatDateReadable(today),
        };

        setFormData(autoFilledData);
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

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Generate preview template with form data
  const previewTemplate = useMemo((): TemplateData | null => {
    if (!templateData) return null;
    const previewData = getPreviewData(formData);

    // Replace variables in body sections with actual form values
    const processedSections = templateData.bodySections.map((section) => ({
      ...section,
      text: section.text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
        const value = previewData[variable];
        return value ? `{{${variable}}}` : match; // Keep variables for preview rendering
      }),
    }));

    return {
      ...templateData,
      id: String(templateData.id), // Ensure id is string for TemplateData type
      bodySections: processedSections,
    };
  }, [templateData, formData]);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      const normalizedKey = key.trim().toLowerCase();

      if (normalizedKey === "date_of_birth") {
        const computedAge = computeAgeFromBirthDate(value);
        if (computedAge !== null) {
          next.age = String(computedAge);
          next.AGE = String(computedAge);
        }
      }

      if (normalizedKey === "residency_since") {
        const computedYears = computeYearsOfResidency(value);
        if (computedYears !== null) {
          next.years_of_residency = String(computedYears);
          next.YEARS_OF_RESIDENCY = String(computedYears);
        } else if (!value.trim()) {
          next.years_of_residency = "";
          next.YEARS_OF_RESIDENCY = "";
        }
      }

      if (normalizedKey === "years_of_residency") {
        const computedResidencySince = computeResidencySinceFromYears(value);
        if (computedResidencySince !== null) {
          next.residency_since = computedResidencySince;
          next.RESIDENCY_SINCE = computedResidencySince;
        }
      }

      return next;
    });
  };

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    setFormData({});
  };

  const triggerAutoPrint = useCallback((targetWindow?: Window | null) => {
    const source = printContentRef.current;
    if (!source) return;

    const styleTags = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((node) => node.outerHTML)
      .join("\n");

    const printWindow =
      targetWindow && !targetWindow.closed
        ? targetWindow
        : window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) {
      setNotification({
        message: "Certificate issued, but print popup was blocked.",
        type: "warning",
      });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Certificate Print</title>
          ${styleTags}
          <style>
            html,
            body {
              width: 210mm;
              min-height: 297mm;
              margin: 0;
              padding: 0;
              margin-inline: auto;
              background: #fff;
            }

            #print-root {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              box-sizing: border-box;
              overflow: hidden;
            }

            #print-root,
            #print-root * {
              color: #000 !important;
            }

            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            @page {
              size: 210mm 297mm;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div id="print-root">
            ${source.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    const doPrint = () => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };

    if (printWindow.document.readyState === "complete") {
      doPrint();
    } else {
      printWindow.addEventListener("load", doPrint, { once: true });
    }
  }, []);

  const archiveSelectedTemplate = async () => {
    if (!selectedTemplateId) {
      setNotification({
        message: "Select a template first before archiving.",
        type: "warning",
      });
      return;
    }

    const selectedTemplate = templateOptions.find(
      (option) => String(option.id) === String(selectedTemplateId),
    );

    setIsArchivingTemplate(true);
    try {
      await archiveTemplate(
        selectedTemplateId,
        `Archived from Issue Certificate: ${selectedTemplate?.name || selectedTemplateId}`,
      );
      await loadTemplateOptions();
      setTemplateData(null);

      showActionModal(
        "Template Archived",
        `"${selectedTemplate?.name || "Selected template"}" moved to Archived Templates.`,
        "success",
      );
    } catch {
      showActionModal(
        "Archive Failed",
        "Unable to archive this template right now. Please try again.",
        "danger",
      );
    } finally {
      setIsArchivingTemplate(false);
    }
  };

  const handleArchivedButtonClick = () => {
    if (!selectedTemplateId) {
      setNotification({
        message: "Select a template first before archiving.",
        type: "warning",
      });
      return;
    }

    setIsArchiveConfirmOpen(true);
  };

  const handleSubmit = async () => {
    if (!templateData) return;

    // Validate required fields from all sections
    const missingFields: string[] = [];
    const invalidFields: string[] = [];
    templateData.formFields.sections.forEach((section) => {
      section.fields.forEach((field) => {
        const val = formData[field.name]?.trim() || "";
        if (field.required && !val) {
          missingFields.push(field.label);
          return;
        }
        if (!val) return;
        if (field.maxLength && val.length > field.maxLength) {
          invalidFields.push(`${field.label} exceeds ${field.maxLength} chars`);
        }
        if (field.type === "number") {
          const num = Number(val);
          if (isNaN(num)) invalidFields.push(`${field.label} must be a number`);
          else if (field.min !== undefined && num < field.min)
            invalidFields.push(`${field.label} min is ${field.min}`);
          else if (field.max !== undefined && num > field.max)
            invalidFields.push(`${field.label} max is ${field.max}`);
        }
        if (field.pattern && !new RegExp(field.pattern).test(val)) {
          invalidFields.push(
            `${field.label}: ${field.patternMessage || "invalid format"}`,
          );
        }
      });
    });

    if (missingFields.length > 0) {
      setNotification({
        message: `Please fill in required fields: ${missingFields.join(", ")}`,
        type: "warning",
      });
      return;
    }

    if (invalidFields.length > 0) {
      setNotification({
        message: `Fix errors: ${invalidFields.join(", ")}`,
        type: "warning",
      });
      return;
    }

    // Open print window while still in direct user interaction to avoid popup blockers.
    pendingPrintWindowRef.current = window.open(
      "",
      "_blank",
      "width=900,height=1200",
    );

    setIsSubmitting(true);
    try {
      const feeValue = templateData.settings.hasFee
        ? Number(templateData.settings.fee || 0)
        : 0;
      const feeText = String(feeValue);
      const payloadFormData = {
        ...formData,
        amount: formData.amount || feeText,
        fee: formData.fee || feeText,
        AMOUNT: formData.AMOUNT || feeText,
        AMOUNT_PAID: formData.AMOUNT_PAID || feeText,
      };

      const result = await issueCertificate({
        templateId: selectedTemplateId,
        formData: payloadFormData,
        issuedBy: "Admin", // TODO: Get from auth context
        certificateType: templateData.title,
      });
      if (result.success) {
        triggerAutoPrint(pendingPrintWindowRef.current);
        showActionModal(
          "Certificate Issued",
          result.message || "Certificate issued successfully!",
          "success",
        );
        setFormData({}); // Clear values for next issuance
        setFormResetSignal((prev) => prev + 1); // Reset per-field touched state
      } else {
        throw new Error(result.message || "Failed to issue certificate");
      }
    } catch (error) {
      if (pendingPrintWindowRef.current && !pendingPrintWindowRef.current.closed) {
        pendingPrintWindowRef.current.close();
      }
      setNotification({
        message: "Failed to issue certificate. Please try again.",
        type: "error",
      });
    } finally {
      pendingPrintWindowRef.current = null;
      setIsSubmitting(false);
    }
  };

  // Form sections are already grouped in the API response
  const formSections = templateData?.formFields?.sections || [];

  if (isLoading && templateOptions.length === 0) {
    return <LoadingModal isOpen={true} message="Loading templates..." />;
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 pb-12 bg-gray-50">
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Template Selector */}
        <TemplateSelector
          options={templateOptions}
          selectedId={selectedTemplateId}
          onSelect={handleTemplateSelect}
          onArchivedClick={handleArchivedButtonClick}
          isArchivingTemplate={isArchivingTemplate}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT: Form Panel */}
          <div className="w-full lg:w-5/12">
            {isLoading ? (
              <div className="flex items-center justify-center bg-white rounded-lg border border-gray-200 p-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : templateData ? (
              <IssuanceForm
                template={templateData}
                formData={formData}
                formSections={formSections}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                onResidentSelect={handleResidentSelect}
                resetSignal={formResetSignal}
              />
            ) : (
              <div className="flex items-center justify-center bg-white rounded-lg border border-gray-200 p-12">
                <p className="text-gray-400">Select a template to continue</p>
              </div>
            )}
          </div>

          {/* RIGHT: Live Preview */}
          <div className="w-full lg:w-7/12">
            <div className="lg:sticky lg:top-4">
              {isLoading ? (
                <div className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 p-12">
                  <p className="text-gray-400">Loading preview...</p>
                </div>
              ) : previewTemplate ? (
                <CertificatePreviewWrapper
                  template={previewTemplate}
                  formData={formData}
                  printContentRef={printContentRef}
                />
              ) : null}
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-lg text-white text-sm font-medium transition-all transform translate-y-0 max-w-sm flex items-center space-x-2 ${
            notification.type === "warning" ? "bg-amber-500" : "bg-red-600"
          }`}
        >
          {notification.type === "warning" && (
            <AlertCircle className="w-4 h-4" />
          )}
          {notification.type === "error" && <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      <ConfirmModal
        isOpen={isArchiveConfirmOpen}
        onCancel={() => setIsArchiveConfirmOpen(false)}
        onConfirm={() => {
          setIsArchiveConfirmOpen(false);
          void archiveSelectedTemplate();
        }}
        title="Archive Template"
        message={`Are you sure you want to archive "${
          templateOptions.find(
            (option) => String(option.id) === String(selectedTemplateId),
          )?.name || "selected template"
        }"?`}
        confirmText="Archive"
        cancelText="Cancel"
        type="warning"
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
        <p>{actionModal.message}</p>
      </ActionModal>
    </div>
  );
};

// ============================================
// TEMPLATE SELECTOR COMPONENT
// ============================================

interface TemplateSelectorProps {
  options: TemplateOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onArchivedClick: () => void | Promise<void>;
  isArchivingTemplate: boolean;
}

function TemplateSelector({
  options,
  selectedId,
  onSelect,
  onArchivedClick,
  isArchivingTemplate,
}: TemplateSelectorProps) {
  const renderTemplateButton = (option: TemplateOption) => {
    const isSelected = selectedId === String(option.id);

    return (
      <button
        key={String(option.id)}
        onClick={() => onSelect(String(option.id))}
        className={`
          relative flex items-center p-3 text-left text-sm rounded-md border transition-all
          ${
            isSelected
              ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500"
              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700"
          }
        `}
      >
        <FileText
          className={`w-4 h-4 mr-2 ${isSelected ? "text-blue-500" : "text-gray-400"}`}
        />
        <span className="truncate flex-1">{option.name}</span>
        {isSelected && (
          <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-blue-500 text-white rounded-full p-0.5">
            <Check className="w-3 h-3" />
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Select Certificate Template to Issue:
        </h3>
        <button
          type="button"
          onClick={onArchivedClick}
          disabled={isArchivingTemplate || !selectedId}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
        >
          <Archive className="w-3.5 h-3.5" />
          {isArchivingTemplate ? "Archiving..." : "Archive Selected"}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {options.map((option) => renderTemplateButton(option))}
      </div>
    </div>
  );
}

// ============================================
// ISSUANCE FORM COMPONENT
// ============================================

interface IssuanceFormProps {
  template: IssuanceTemplate;
  formData: Record<string, string>;
  formSections: FormSectionType[];
  onInputChange: (key: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onResidentSelect: (resident: PersonSearchResponseDTO) => void;
  resetSignal: number;
}

function IssuanceForm({
  template,
  formData,
  formSections,
  onInputChange,
  onSubmit,
  isSubmitting,
  onResidentSelect,
  resetSignal,
}: IssuanceFormProps) {
  // Helper to get icon based on section title
  const getSectionIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("personal")) return <User className="w-3 h-3" />;
    if (lowerTitle.includes("vehicle")) return <Car className="w-3 h-3" />;
    if (lowerTitle.includes("payment")) return <Wallet className="w-3 h-3" />;
    if (lowerTitle.includes("owner")) return <User className="w-3 h-3" />;
    if (lowerTitle.includes("property"))
      return <FileText className="w-3 h-3" />;
    if (lowerTitle.includes("permit") || lowerTitle.includes("activity"))
      return <ClipboardList className="w-3 h-3" />;
    return <ClipboardList className="w-3 h-3" />;
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 flex items-center space-x-2">
          <ClipboardList className="w-4 h-4 text-blue-600" />
          <span>Issue {template.title}</span>
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Fill in the required information below
        </p>
      </div>

      {/* Resident Search */}
      <div className="px-6 pt-5 pb-2">
        <ResidentSearchBar onSelect={onResidentSelect} />
      </div>

      {/* Form Body - Sections from API */}
      <div className="p-6 space-y-6">
        {formSections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <FormSection
              title={section.title}
              icon={getSectionIcon(section.title)}
              subtitle=""
            />
            <div className="grid grid-cols-1 gap-4">
              {section.fields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formData[field.name] || ""}
                  onChange={(value) => onInputChange(field.name, value)}
                  resetSignal={resetSignal}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Fee Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-gray-700">
              Standard Fee:
            </span>
            <span
              className={`text-lg font-bold ${template.settings.fee === 0 ? "text-green-600" : "text-blue-600"}`}
            >
              {template.settings.fee === 0
                ? "FREE"
                : `₱${template.settings.fee.toFixed(2)}`}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            * Fee amount can be adjusted in the Payment section above if
            applicable
          </p>
        </div>
      </div>

      {/* Footer - Submit Button */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center space-x-2 rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-md transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Printer className="w-4 h-4" />
              <span>Issue Certificate</span>
            </>
          )}
        </button>
        <p className="mt-2 text-center text-[11px] text-gray-400">
          Ensure all data is verified before issuing.
        </p>
      </div>
    </div>
  );
}

// ============================================
// CERTIFICATE PREVIEW WRAPPER
// ============================================

interface CertificatePreviewWrapperProps {
  template: TemplateData;
  formData: Record<string, string>;
  printContentRef: React.RefObject<HTMLDivElement | null>;
}

function CertificatePreviewWrapper({
  template,
  formData,
  printContentRef,
}: CertificatePreviewWrapperProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Live Preview</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {Object.keys(formData).length > 0
              ? "Form values shown in green"
              : "Fill the form to see your data"}
          </p>
        </div>
      </div>

      {/* Certificate Paper */}
      <div
        ref={printContentRef}
        className="p-3 md:p-5 rounded-lg bg-gray-100/50 border border-gray-200"
      >
        <CertificatePreview
          template={template}
          customData={formData}
          showHeader={false}
        />
      </div>
    </div>
  );
}

// ============================================
// RESIDENT SEARCH BAR
// ============================================

function ResidentSearchBar({
  onSelect,
}: {
  onSelect: (resident: PersonSearchResponseDTO) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonSearchResponseDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchPeople(value.trim());
        setResults(data);
        setIsOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelect = (resident: PersonSearchResponseDTO) => {
    onSelect(resident);
    setQuery(
      `${resident.firstName} ${resident.middleName ? resident.middleName + " " : ""}${resident.lastName}`,
    );
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
        <Search className="w-3 h-3 text-blue-500" />
        Search Resident
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Type resident name to auto-fill..."
          className="w-full rounded-lg border border-blue-200 bg-blue-50/30 pl-9 pr-8 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {r.firstName} {r.middleName ? r.middleName + " " : ""}
                  {r.lastName}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {r.completeAddress}
                  {r.age ? ` • ${r.age} yrs old` : ""}
                  {r.civilStatus ? ` • ${r.civilStatus}` : ""}
                </p>
              </div>
              {r.isResident && (
                <span className="text-[9px] font-bold uppercase bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex-shrink-0">
                  Resident
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && !isSearching && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg p-4 text-center">
          <p className="text-xs text-gray-400">No residents found</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

interface FormSectionProps {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
}

function FormSection({ title, icon, subtitle }: FormSectionProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-blue-50 text-blue-600 rounded">{icon}</div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          {title}
        </h4>
      </div>
      {subtitle && (
        <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center">
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {subtitle}
        </span>
      )}
    </div>
  );
}

interface FormFieldProps {
  field: FormFieldConfig;
  value: string;
  onChange: (value: string) => void;
  resetSignal: number;
}

function FormField({ field, value, onChange, resetSignal }: FormFieldProps) {
  const isAutoFilled = field.autoFilled;
  const isReadOnly = field.readOnly;
  const [touched, setTouched] = useState(false);
  const now = new Date();
  const todayDateOnly = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    setTouched(false);
  }, [resetSignal]);

  // Validation
  const validationError = useMemo(() => {
    if (!touched || isAutoFilled || isReadOnly) return null;
    if (field.required && !value.trim()) return `${field.label} is required`;
    if (!value.trim()) return null;
    if (field.maxLength && value.length > field.maxLength)
      return `Max ${field.maxLength} characters`;
    if (field.type === "number") {
      const num = Number(value);
      if (isNaN(num)) return "Must be a number";
      if (field.min !== undefined && num < field.min)
        return `Min value is ${field.min}`;
      if (field.max !== undefined && num > field.max)
        return `Max value is ${field.max}`;
    }
    if (field.pattern) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(value)) return field.patternMessage || "Invalid format";
    }
    return null;
  }, [value, touched, field, isAutoFilled, isReadOnly]);

  const hasError = !!validationError;

  const baseInputClass = isAutoFilled
    ? "w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700 font-medium cursor-not-allowed"
    : hasError
      ? "w-full rounded-lg border border-red-300 bg-red-50/30 px-3 py-2.5 text-sm outline-none transition-all focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
      : "w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";

  // Label with auto-fill indicator
  const labelElement = (
    <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
      <span className="flex items-center">
        {field.label}
        {field.required && !isAutoFilled && (
          <span className="text-red-500 ml-1">*</span>
        )}
        {field.maxLength && !isAutoFilled && (
          <span className="text-[10px] text-gray-400 ml-1.5 font-normal">
            ({value.length}/{field.maxLength})
          </span>
        )}
      </span>
      {isAutoFilled && (
        <span className="flex items-center text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
          <svg
            className="w-3 h-3 mr-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Auto
        </span>
      )}
    </label>
  );

  // Error / help text element
  const bottomText = validationError ? (
    <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {validationError}
    </p>
  ) : field.helpText && isAutoFilled ? (
    <p className="text-[10px] text-gray-400 mt-0.5">{field.helpText}</p>
  ) : null;

  if (field.type === "select" && field.options && !isAutoFilled) {
    return (
      <div className="space-y-1.5">
        {labelElement}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className={baseInputClass}
          disabled={isReadOnly}
        >
          <option value="">Select {field.label}...</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {bottomText}
      </div>
    );
  }

  if (field.type === "textarea" && !isAutoFilled) {
    return (
      <div className="space-y-1.5">
        {labelElement}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={field.placeholder}
          rows={3}
          maxLength={field.maxLength}
          className={baseInputClass}
          readOnly={isReadOnly}
        />
        {bottomText}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {labelElement}
      <input
        type={
          isAutoFilled
            ? "text"
            : field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : "text"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={field.placeholder}
        maxLength={field.type !== "number" ? field.maxLength : undefined}
        min={field.min}
        max={field.type === "date" ? todayDateOnly : field.max}
        className={baseInputClass}
        readOnly={isReadOnly}
        tabIndex={isReadOnly ? -1 : 0}
      />
      {bottomText}
    </div>
  );
}

export default IssueCertificatePage;
