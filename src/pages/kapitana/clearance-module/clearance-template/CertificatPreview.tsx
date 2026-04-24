import { type TemplateData } from "./template";
import { Printer } from "lucide-react";
import { ResidencyPreview } from "./ResidencyPreview";
import { ClearancePreview } from "./ClearancePreview";
import { IndigencyPreview } from "./IndegencyPreview";
import { JobSeekerPreview } from "./JobSeekerPreview";
import { TricyclePreview } from "./TricyclePreview";
import { TricycleRegistrationPreview } from "./Tricycle-Registration";
import { ImprovementPreview } from "./ImprovementPreview";
import { TechnicalPermitPreview } from "./Technical-PermitPreview";
import { WorkingClearancePreview } from "./Working-ClearancePreview";
import { PreviewDataProvider } from "./PreviewUtils";

interface CertificatePreviewProps {
  template: TemplateData;
  customData?: Record<string, string>;
  showHeader?: boolean;
}

export function CertificatePreview({
  template,
  customData,
  showHeader = true,
}: CertificatePreviewProps) {
  const renderPreview = () => {
    const templateKey =
      `${String(template.id)} ${template.title}`.toLowerCase();

    // For API-created templates: detect by numeric id (number or numeric string) or layoutStyle
    const idStr = String(template.id);
    const isApiTemplate =
      typeof template.id === "number" ||
      /^\d+$/.test(idStr) ||
      !!template.layoutStyle;

    if (isApiTemplate) {
      if (template.layoutStyle === "inline") {
        return <IndigencyPreview template={template} customData={customData} />;
      }
      // Default to clearance-style for API templates (tabular fields)
      return <ClearancePreview template={template} customData={customData} />;
    }

    switch (true) {
      case templateKey.includes("residency"):
        return <ResidencyPreview template={template} customData={customData} />;
      case templateKey.includes("clearance"):
        return <ClearancePreview template={template} customData={customData} />;
      case templateKey.includes("indigency"):
        return <IndigencyPreview template={template} customData={customData} />;
      case templateKey.includes("job-seeker") ||
        templateKey.includes("job seeker"):
        return <JobSeekerPreview template={template} customData={customData} />;
      case templateKey.includes("tricycle registration") ||
        templateKey.includes("tricycle-registration"):
        return (
          <TricycleRegistrationPreview
            template={template}
            customData={customData}
          />
        );
      case templateKey.includes("tricycle"):
        return <TricyclePreview template={template} customData={customData} />;
      case templateKey.includes("working-clearance") ||
        templateKey.includes("working clearance"):
        return (
          <WorkingClearancePreview
            template={template}
            customData={customData}
          />
        );
      case templateKey.includes("certificate-improvement") ||
        templateKey.includes("improvement"):
        return (
          <ImprovementPreview template={template} customData={customData} />
        );
      case templateKey.includes("technical-permits") ||
        templateKey.includes("technical permit"):
        return (
          <TechnicalPermitPreview template={template} customData={customData} />
        );
      default:
        return <ResidencyPreview template={template} customData={customData} />;
    }
  };

  const previewContent = customData ? (
    <PreviewDataProvider data={customData}>
      {renderPreview()}
    </PreviewDataProvider>
  ) : (
    renderPreview()
  );

  if (!showHeader) {
    return (
      <div className="flex-1 p-3 md:p-5 rounded-lg bg-gray-100/50 border border-gray-200">
        {previewContent}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Live Preview</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {customData
              ? "Values from form shown in green"
              : "Sample data shown in blue"}
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </button>
        </div>
      </div>

      {/* Certificate Paper - A4 */}
      <div className="p-3 md:p-5 rounded-lg bg-gray-100/50 border border-gray-200">
        {previewContent}
      </div>
    </div>
  );
}
