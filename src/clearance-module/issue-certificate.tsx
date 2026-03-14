import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Check,
  Printer,
  User,
  ClipboardList,
  Wallet,
  Car,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { LoadingModal } from "../reusable/LoadingModal";
import {
  fetchTemplateOptions,
  getPreviewData,
  type TemplateOption,
} from "../clearance-api/template-api";
import {
  fetchIssuanceTemplate,
  issueCertificate,
  type IssuanceTemplate,
  type FormFieldConfig,
} from "../clearance-api/issue-certificate-api";
import type { FormSection as FormSectionType } from "../clearance-api/types";
import { CertificatePreview } from "./clearance-template/CertificatPreview";
import { type TemplateData } from "./clearance-template/template";

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
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  // Load template options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await fetchTemplateOptions();
        setTemplateOptions(options);
        if (options.length > 0) {
          const defaultId =
            options.find((o) => String(o.id) === "barangay-clearance")?.id ||
            options[0].id;
          setSelectedTemplateId(String(defaultId));
        }
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
  }, []);

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
          // Date and time fields
          DATE_ISSUED: formatDateReadable(today),
          OR_DATE: formatDateReadable(today),
          DAY: getDayWithOrdinal(today.getDate()),
          MONTH: getMonthName(today),
          YEAR: today.getFullYear().toString(),
          // Location
          ISSUED_AT: "3S Center, Barangay Ugong, Valenzuela City",
          // Validity
          VALID_UNTIL: calculateValidityDate(data.settings.validityMonths || 6), // Based on template validity
        };

        // Set default amount based on template fee (format as currency)
        if (data.settings.fee > 0) {
          autoFilledData.AMOUNT_PAID = `₱${data.settings.fee.toFixed(2)}`;
        }

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
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    setFormData({});
  };

  const handleSubmit = async () => {
    if (!templateData) return;

    // Validate required fields from all sections
    const missingFields: string[] = [];
    templateData.formFields.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required && !formData[field.name]?.trim()) {
          missingFields.push(field.label);
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

    setIsSubmitting(true);
    try {
      const result = await issueCertificate({
        templateId: selectedTemplateId,
        formData,
        issuedBy: "Admin", // TODO: Get from auth context
      });
      if (result.success) {
        setNotification({
          message: result.message || "Certificate issued successfully!",
          type: "success",
        });
        setFormData({}); // Reset form after successful submission
      } else {
        throw new Error(result.message || "Failed to issue certificate");
      }
    } catch (error) {
      setNotification({
        message: "Failed to issue certificate. Please try again.",
        type: "error",
      });
    } finally {
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
              />
            ) : (
              <div className="flex items-center justify-center bg-white rounded-lg border border-gray-200 p-12">
                <p className="text-gray-400">Select a template to continue</p>
              </div>
            )}
          </div>

          {/* RIGHT: Live Preview */}
          <div className="w-full lg:w-7/12 lg:sticky lg:top-6 lg:self-start">
            {isLoading ? (
              <div className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 p-12">
                <p className="text-gray-400">Loading preview...</p>
              </div>
            ) : previewTemplate ? (
              <CertificatePreviewWrapper
                template={previewTemplate}
                formData={formData}
              />
            ) : null}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-lg text-white text-sm font-medium transition-all transform translate-y-0 max-w-sm flex items-center space-x-2 ${
            notification.type === "success"
              ? "bg-green-600"
              : notification.type === "warning"
                ? "bg-amber-500"
                : "bg-red-600"
          }`}
        >
          {notification.type === "success" && (
            <CheckCircle className="w-4 h-4" />
          )}
          {notification.type === "warning" && (
            <AlertCircle className="w-4 h-4" />
          )}
          {notification.type === "error" && <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}
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
}

function TemplateSelector({
  options,
  selectedId,
  onSelect,
}: TemplateSelectorProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        Select Certificate Template to Issue:
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {options.map((option) => {
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
              {option.isFree && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 rounded">
                  Free
                </span>
              )}
              {isSelected && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-blue-500 text-white rounded-full p-0.5">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
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
}

function IssuanceForm({
  template,
  formData,
  formSections,
  onInputChange,
  onSubmit,
  isSubmitting,
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
}

function CertificatePreviewWrapper({
  template,
  formData,
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
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </button>
        </div>
      </div>

      {/* Certificate Paper */}
      <div className="p-3 md:p-5 rounded-lg bg-gray-100/50 border border-gray-200">
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
}

function FormField({ field, value, onChange }: FormFieldProps) {
  const isAutoFilled = field.autoFilled;
  const isReadOnly = field.readOnly;

  const baseInputClass = isAutoFilled
    ? "w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700 font-medium cursor-not-allowed"
    : "w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";

  // Label with auto-fill indicator
  const labelElement = (
    <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
      <span className="flex items-center">
        {field.label}
        {field.required && !isAutoFilled && (
          <span className="text-red-500 ml-1">*</span>
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

  // Help text element
  const helpTextElement =
    field.helpText && isAutoFilled ? (
      <p className="text-[10px] text-gray-400 mt-0.5">{field.helpText}</p>
    ) : null;

  if (field.type === "select" && field.options && !isAutoFilled) {
    return (
      <div className="space-y-1.5">
        {labelElement}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
        {helpTextElement}
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
          placeholder={field.placeholder}
          rows={3}
          className={baseInputClass}
          readOnly={isReadOnly}
        />
        {helpTextElement}
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
        placeholder={field.placeholder}
        className={baseInputClass}
        readOnly={isReadOnly}
        tabIndex={isReadOnly ? -1 : 0}
      />
      {helpTextElement}
    </div>
  );
}

export default IssueCertificatePage;
