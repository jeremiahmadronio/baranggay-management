import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  Printer,
  AlertCircle,
  type LucideIcon,
  FileText,
  User,
  Wallet,
  Fingerprint,
  Camera,
  ClipboardList,
  Type,
  LayoutTemplate,
  Home,
  Briefcase,
  Building2,
  Car,
} from "lucide-react";
import {
  NewTemplatePreview,
  type NewTemplatePreviewData,
  type PreviewField,
  type PreviewSignatory,
  type DesignFormat,
} from "./NewTemplatePreview";
import {
  clearanceTemplateApi,
  type TemplateRequestDTO,
} from "../../../service/clearance-api/Template";
import {
  invalidateTemplateCache,
  registerCreatedTemplateLocally,
} from "../../../clearance-api/template-api";
import { ActionModal, ConfirmModal } from "../../../reusable";

// ═══════════════════════════════════════════════════════════════════════════════
// AVAILABLE FIELDS (user picks from these)
// ═══════════════════════════════════════════════════════════════════════════════

const AVAILABLE_PERSONAL_FIELDS: PreviewField[] = [
  { name: "full_name", label: "Full Name" },
  { name: "address", label: "Address" },
  { name: "age", label: "Age" },
  { name: "civil_status", label: "Civil Status" },
  { name: "date_of_birth", label: "Date of Birth" },
  { name: "place_of_birth", label: "Place of Birth" },
  { name: "gender", label: "Gender" },
  { name: "nationality", label: "Nationality" },
  { name: "contact_no", label: "Contact No." },
  { name: "email", label: "Email Address" },
  { name: "voter_status", label: "Registered Voter" },
  { name: "tin_no", label: "TIN Number" },
  { name: "ctc_number", label: "Community Tax Cert. No." },
];

const AVAILABLE_RESIDENCY_FIELDS: PreviewField[] = [
  { name: "residency_since", label: "Residency Date" },
  { name: "years_of_residency", label: "Years of Residency" },
  { name: "house_no", label: "House/Lot No." },
  { name: "zone_purok", label: "Zone/Purok" },
  { name: "precinct_no", label: "Precinct No." },
];

const AVAILABLE_PURPOSE_FIELDS: PreviewField[] = [
  { name: "purpose", label: "Purpose" },
  { name: "nature_of_work", label: "Nature of Work" },
  { name: "occupation", label: "Occupation" },
  { name: "employer", label: "Employer" },
  { name: "employer_address", label: "Employer Address" },
  { name: "monthly_income", label: "Monthly Income" },
  { name: "cert_nature", label: "Nature of Certificate" },
  { name: "relationship_to_beneficiary", label: "Relationship to Beneficiary" },
];

const AVAILABLE_PROPERTY_FIELDS: PreviewField[] = [
  { name: "floor_area", label: "Floor Area (sq.m)" },
  { name: "lot_area", label: "Lot Area (sq.m)" },
  { name: "building_type", label: "Building Type" },
  { name: "business_name", label: "Business Name" },
  { name: "business_type", label: "Business Type" },
  { name: "business_address", label: "Business Address" },
  { name: "time", label: "Activity Time" },
];

const AVAILABLE_VEHICLE_FIELDS: PreviewField[] = [
  { name: "make", label: "Make/Model" },
  { name: "vehicle_no", label: "Vehicle Number" },
  { name: "plate_no", label: "Plate Number" },
  { name: "motor_no", label: "Motor Number" },
  { name: "battery_no", label: "Battery Number" },
  { name: "charger_no", label: "Charger Number" },
  { name: "body_color", label: "Body Color" },
  { name: "chassis_no", label: "Chassis Number" },
  { name: "body_no", label: "Body Number" },
  { name: "cr_no", label: "CR Number" },
  { name: "or_no_vehicle", label: "OR Number (Vehicle)" },
  { name: "mtop_no", label: "MTOP Number" },
];

const ALL_FIELD_GROUPS: {
  label: string;
  icon: LucideIcon;
  fields: PreviewField[];
}[] = [
  {
    label: "Personal Information",
    icon: User,
    fields: AVAILABLE_PERSONAL_FIELDS,
  },
  { label: "Residency", icon: Home, fields: AVAILABLE_RESIDENCY_FIELDS },
  {
    label: "Purpose / Employment",
    icon: Briefcase,
    fields: AVAILABLE_PURPOSE_FIELDS,
  },
  {
    label: "Property / Business",
    icon: Building2,
    fields: AVAILABLE_PROPERTY_FIELDS,
  },
  { label: "Vehicle (Tricycle)", icon: Car, fields: AVAILABLE_VEHICLE_FIELDS },
];

const MAX_BODY_SECTIONS = 6;
const MAX_TITLE_LENGTH = 80;
const MAX_SIGNATORY_NAME_LENGTH = 80;
const MAX_SIGNATORY_POSITION_LENGTH = 60;
const MAX_SELECTED_FIELDS = 16;



export default function CreateTemplate() {
  // --- State ---
  const [designFormat, setDesignFormat] = useState<DesignFormat>("clearance");
  const [title, setTitle] = useState("");
  const [bodySections, setBodySections] = useState<string[]>([
    "This is to CERTIFY that the person whose name and signature, right thumbmark and picture appeared herein is a bonafide resident of this barangay, requesting for a record and clearance from this office to wit:",
  ]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set([
      "full_name",
      "address",
      "date_of_birth",
      "place_of_birth",
      "purpose",
      "residency_since",
    ]),
  );
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  const [requiresThumbmark, setRequiresThumbmark] = useState(false);
  const [hasFee, setHasFee] = useState(false);
  const [fee, setFee] = useState(0);
  const [hasCtn, setHasCtn] = useState(false);
  const [validityMonths, setValidityMonths] = useState(6);
  const [footerText, setFooterText] = useState("Not valid without dry seal.");
  const [signatories, setSignatories] = useState<PreviewSignatory[]>([
    { name: "MARICEL PINEDA - EMPERADOR", position: "Punong Barangay" },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false);
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

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["design", "title", "body", "fields"]),
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const toggleField = useCallback((fieldName: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) next.delete(fieldName);
      else if (next.size < MAX_SELECTED_FIELDS) next.add(fieldName);
      else {
        setNotification({
          message: `Maximum of ${MAX_SELECTED_FIELDS} issue fields only.`,
          type: "error",
        });
        setTimeout(() => setNotification(null), 3000);
      }
      return next;
    });
  }, []);

  // --- Body section handlers ---
  const addBodySection = () => {
    if (bodySections.length >= MAX_BODY_SECTIONS) {
      setNotification({
        message: `Maximum of ${MAX_BODY_SECTIONS} body sections only.`,
        type: "error",
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setBodySections((prev) => [...prev, ""]);
  };
  const removeBodySection = (index: number) => {
    if (bodySections.length <= 1) return;
    setBodySections((prev) => prev.filter((_, i) => i !== index));
  };
  const updateBodySection = (index: number, text: string) => {
    setBodySections((prev) => prev.map((s, i) => (i === index ? text : s)));
  };

  // --- Signatory handlers (max 5) ---
  const addSignatory = () => {
    if (signatories.length >= 5) return;
    setSignatories((prev) => [...prev, { name: "", position: "" }]);
  };
  const removeSignatory = (index: number) => {
    if (signatories.length <= 1) return;
    setSignatories((prev) => prev.filter((_, i) => i !== index));
  };
  const updateSignatory = (
    index: number,
    field: "name" | "position",
    value: string,
  ) => {
    setSignatories((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  // --- Build preview data ---
  const allFields = ALL_FIELD_GROUPS.flatMap((g) => g.fields);
  const activeFields = allFields.filter((f) => selectedFields.has(f.name));

  const previewData: NewTemplatePreviewData = {
    designFormat,
    title,
    bodySections,
    issueFields: activeFields,
    requiresPhoto,
    requiresThumbmark,
    hasFee,
    fee,
    footerText,
    signatories,
  };

  // --- Design format switch helper ---
  const switchDesignFormat = (format: DesignFormat) => {
    setDesignFormat(format);
    if (format === "clearance") {
      setBodySections([
        "This is to CERTIFY that the person whose name and signature, right thumbmark and picture appeared herein is a bonafide resident of this barangay, requesting for a record and clearance from this office to wit:",
      ]);
      setSelectedFields(
        new Set([
          "full_name",
          "address",
          "date_of_birth",
          "place_of_birth",
          "purpose",
          "residency_since",
        ]),
      );
    } else {
      setBodySections([
        "This is to CERTIFY that {{full_name}}, {{age}} years old, of legal age, residing at {{address}}, UGONG, VALENZUELA CITY since {{residency_since}}, is known to belong to the indigent families/sector of Barangay as of this date.",
        "This CERTIFICATION is being issued upon the request of the said individual for {{purpose}} purpose or for whatever legal purpose this may serve best.",
      ]);
      setSelectedFields(new Set());
    }
  };

  // --- Save ---
  const handleSave = async () => {
    if (!title.trim()) {
      setNotification({
        message: "Please enter a certificate title.",
        type: "error",
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (title.trim().length > MAX_TITLE_LENGTH) {
      setNotification({
        message: `Certificate title should not exceed ${MAX_TITLE_LENGTH} characters.`,
        type: "error",
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (bodySections.some((section) => !section.trim())) {
      setNotification({
        message: "All body sections must have content.",
        type: "error",
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (designFormat === "clearance" && selectedFields.size === 0) {
      setNotification({
        message: "Select at least one issue field for clearance format.",
        type: "error",
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (selectedFields.size > MAX_SELECTED_FIELDS) {
      setNotification({
        message: `Maximum of ${MAX_SELECTED_FIELDS} issue fields only.`,
        type: "error",
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (signatories.some((s) => !s.name.trim() || !s.position.trim())) {
      setNotification({
        message: "All signatories must include name and position.",
        type: "error",
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (hasFee && (fee < 1 || fee > 9999)) {
      setNotification({
        message: "Fee must be between 1 and 9999 for paid certificates.",
        type: "error",
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (validityMonths < 1 || validityMonths > 24) {
      setNotification({
        message: "Validity months must be between 1 and 24.",
        type: "error",
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      // For inline templates, extract {{variables}} from body text as issueFields
      let finalIssueFields = Array.from(selectedFields);
      if (designFormat === "inline") {
        const bodyVars = new Set<string>();
        for (const text of bodySections) {
          const matches = text.match(/\{\{([^}]+)\}\}/g);
          if (matches) {
            matches.forEach((m) => bodyVars.add(m.replace(/[{}]/g, "")));
          }
        }
        finalIssueFields = [...new Set([...finalIssueFields, ...bodyVars])];
      }

      const localTemplatePayload = {
        title: title.trim().toUpperCase(),
        layoutStyle: designFormat,
        bodySections: bodySections.map((text, i) => ({
          id: `body-${i + 1}`,
          text: text.trim(),
          isEditable: true,
        })),
        footerText: footerText.trim(),
        signatories: signatories.map((s) => ({
          name: s.name.trim(),
          position: s.position.trim(),
        })),
        settings: {
          fee: hasFee ? fee : 0,
          validityMonths: Math.min(24, Math.max(1, validityMonths)),
          requiresPhoto,
          requiresThumbmark,
          hasFee,
          hasCtn,
          ctnFee: 0,
        },
        variables: finalIssueFields,
      };

      // Always store a local copy so the issue page can immediately list this template.
      registerCreatedTemplateLocally(localTemplatePayload);

      const dto: TemplateRequestDTO = {
        certTitle: title.trim().toUpperCase(),
        layoutStyle: designFormat,
        certTagline: footerText.trim(),
        bodySections: bodySections.map((text, i) => ({
          id: `body-${i + 1}`,
          text: text.trim(),
          isEditable: true,
        })),
        issueFields: finalIssueFields,
        requiresPhoto,
        requiresThumbmark,
        hasFee,
        hasCtn,
        certFee: hasFee ? fee : 0,
        validityMonths: Math.min(24, Math.max(1, validityMonths)),
        footerText: footerText.trim(),
        signatories: signatories.map((s) => ({
          signatoryName: s.name.trim(),
          signatoryTitle: s.position.trim(),
        })),
      };

      await clearanceTemplateApi.createTemplate(dto);
      invalidateTemplateCache(); // clear cache so new template shows in dropdowns
      showActionModal(
        "Template Created",
        "Template created successfully and is now available in Issue Certificate.",
        "success",
      );
    } catch {
      invalidateTemplateCache();
      showActionModal(
        "Template Saved Locally",
        "API is unavailable, but the template is saved locally and available in Issue Certificate options.",
        "success",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 pb-12 bg-gray-50">
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ═════════════════════ LEFT: Form Builder ═════════════════════ */}
          <div className="w-full lg:w-5/12 space-y-4">
            {/* ── Template Design Picker ── */}
            <EditorSection
              title="Template Design"
              icon={LayoutTemplate}
              isExpanded={expandedSections.has("design")}
              onToggle={() => toggleSection("design")}
            >
              <p className="text-[11px] text-gray-500 mb-3">
                Choose between two certificate formats.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <DesignCard
                  active={designFormat === "clearance"}
                  onClick={() => switchDesignFormat("clearance")}
                  label="Clearance Style"
                  description="Tabular fields (NAME : value), payment section, 1x1 photo option"
                  preview={
                    <div className="space-y-1 text-[8px] text-gray-400">
                      <div className="border-b border-gray-200 pb-0.5 text-center font-bold text-[9px]">
                        TITLE
                      </div>
                      <div className="flex gap-1">
                        <span className="w-8 font-bold">NAME</span>
                        <span>: value</span>
                      </div>
                      <div className="flex gap-1">
                        <span className="w-8 font-bold">ADDR</span>
                        <span>: value</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded mt-1"></div>
                    </div>
                  }
                />
                <DesignCard
                  active={designFormat === "inline"}
                  onClick={() => switchDesignFormat("inline")}
                  label="Inline / Narrative Style"
                  description="Body text with embedded variables, 'Signed this...' date line"
                  preview={
                    <div className="space-y-1 text-[8px] text-gray-400">
                      <div className="border-b border-gray-200 pb-0.5 text-center font-bold text-[9px]">
                        TITLE
                      </div>
                      <div className="leading-tight">
                        This is to certify that{" "}
                        <span className="text-blue-500 font-bold">JUAN</span>,
                        residing at...
                      </div>
                      <div className="mt-1 text-[7px]">
                        Signed this{" "}
                        <span className="border-b border-gray-300">8th</span>{" "}
                        Day of...
                      </div>
                    </div>
                  }
                />
              </div>
            </EditorSection>

            {/* ── Certificate Title ── */}
            <EditorSection
              title="Certificate Title"
              icon={Type}
              isExpanded={expandedSections.has("title")}
              onToggle={() => toggleSection("title")}
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={MAX_TITLE_LENGTH}
                placeholder={
                  designFormat === "clearance"
                    ? "e.g., BARANGAY CLEARANCE"
                    : "e.g., CERTIFICATE OF INDIGENCY"
                }
                className="w-full p-2.5 text-sm font-bold text-gray-800 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
              />
              <p className="text-right text-[10px] text-gray-400 mt-1">
                {title.length}/{MAX_TITLE_LENGTH}
              </p>
            </EditorSection>

            {/* ── Certificate Body ── */}
            <EditorSection
              title="Certificate Body"
              icon={FileText}
              isExpanded={expandedSections.has("body")}
              onToggle={() => toggleSection("body")}
              extra={
                <button
                  onClick={addBodySection}
                  className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Section
                </button>
              }
            >
              {designFormat === "inline" && (
                <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-3">
                  Tip: Use {"{{FULL_NAME}}"}, {"{{ADDRESS}}"}, {"{{AGE}}"},{" "}
                  {"{{PURPOSE}}"}, {"{{RESIDENCY_SINCE}}"} etc. inside text to
                  embed variable data inline.
                </p>
              )}
              <div className="space-y-3">
                {bodySections.map((text, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">
                        Body Text #{idx + 1}
                      </span>
                      {bodySections.length > 1 && (
                        <button
                          onClick={() => removeBodySection(idx)}
                          className="text-red-400 hover:text-red-600 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => updateBodySection(idx, e.target.value)}
                      maxLength={800}
                      rows={5}
                      className="w-full p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono leading-relaxed resize-none"
                      placeholder={
                        designFormat === "inline"
                          ? "e.g., This is to CERTIFY that {{FULL_NAME}}, {{AGE}} years old..."
                          : "Enter certificate body text..."
                      }
                    />
                    <p className="text-right text-[10px] text-gray-400 mt-0.5">
                      {text.length}/800
                    </p>
                  </div>
                ))}
              </div>
            </EditorSection>

            {/* ── Tabular Issue Fields (only for clearance format) ── */}
            {designFormat === "clearance" && (
              <EditorSection
                title="Issue Fields"
                icon={ClipboardList}
                isExpanded={expandedSections.has("fields")}
                onToggle={() => toggleSection("fields")}
                badge={`${selectedFields.size} selected`}
              >
                <p className="text-[11px] text-gray-500 mb-3">
                  These appear as tabular rows (LABEL : value) in the
                  certificate body. Select all that apply.
                </p>

                {ALL_FIELD_GROUPS.map((group) => (
                  <div key={group.label} className="mb-4 last:mb-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <group.icon className="w-3 h-3" /> {group.label}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.fields.map((field) => (
                        <FieldCheckbox
                          key={field.name}
                          field={field}
                          checked={selectedFields.has(field.name)}
                          onChange={() => toggleField(field.name)}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {selectedFields.size > 12 && (
                  <div className="mt-3 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700">
                    ⚠️ {selectedFields.size} fields selected — content may
                    overflow one page when printed. Consider reducing fields or
                    shortening body text.
                  </div>
                )}
              </EditorSection>
            )}

            {/* ── Inline: Variable Reference ── */}
            {designFormat === "inline" && (
              <EditorSection
                title="Available Variables"
                icon={ClipboardList}
                isExpanded={expandedSections.has("fields")}
                onToggle={() => toggleSection("fields")}
              >
                <p className="text-[11px] text-gray-500 mb-3">
                  Copy & paste these into your body text. No field checkboxes
                  needed — just type them in the body sections above.
                </p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {ALL_FIELD_GROUPS.flatMap((g) => g.fields).map((field) => (
                    <div
                      key={field.name}
                      className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 border border-gray-200 text-gray-600 font-mono cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                      onClick={() =>
                        navigator.clipboard.writeText(`{{${field.name}}}`)
                      }
                      title={`Click to copy {{${field.name}}}`}
                    >
                      <span className="text-blue-500">{`{{${field.name}}}`}</span>
                      <span className="text-gray-400 text-[9px] truncate">
                        = {field.label}
                      </span>
                    </div>
                  ))}
                </div>
              </EditorSection>
            )}

            {/* ── Requirements (Photo & Thumbmark) ── */}
            <EditorSection
              title="Requirements"
              icon={Fingerprint}
              isExpanded={expandedSections.has("requirements")}
              onToggle={() => toggleSection("requirements")}
            >
              <p className="text-[11px] text-gray-500 mb-3">
                Face-to-face verification requirements. Check what should appear
                on the certificate.
              </p>
              <div className="space-y-3">
                <RequirementToggle
                  icon={Camera}
                  label="1x1 Photo"
                  description={
                    designFormat === "clearance"
                      ? "Photo box appears at top-right of certificate"
                      : "Photo box appears at top-right of certificate"
                  }
                  checked={requiresPhoto}
                  onChange={setRequiresPhoto}
                />
                <RequirementToggle
                  icon={Fingerprint}
                  label="Right Thumbmark"
                  description={
                    designFormat === "clearance"
                      ? "Thumbmark box appears next to payment or at bottom"
                      : "Thumbmark box appears at bottom-left beside signatories"
                  }
                  checked={requiresThumbmark}
                  onChange={setRequiresThumbmark}
                />
              </div>
            </EditorSection>

            {/* ── Payment / Fee Settings ── */}
            <EditorSection
              title="Payment & Fee"
              icon={Wallet}
              isExpanded={expandedSections.has("settings")}
              onToggle={() => toggleSection("settings")}
            >
              <div className="space-y-4">
                <SettingToggle
                  icon={Wallet}
                  label="Paid Certificate (Has Fee)"
                  checked={hasFee}
                  onChange={(v) => {
                    setHasFee(v);
                    if (!v) setFee(0);
                  }}
                />

                {hasFee && (
                  <div className="ml-7 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1 uppercase font-semibold">
                        Fee (₱)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={fee === 0 ? "" : fee}
                        placeholder="0"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (
                            val === "" ||
                            (/^\d*$/.test(val) && val.length <= 4)
                          ) {
                            setFee(val === "" ? 0 : parseInt(val));
                          }
                        }}
                        className="w-full p-2 text-sm font-mono border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1 uppercase font-semibold">
                        Validity (months)
                      </label>
                      <input
                        type="number"
                        value={validityMonths}
                        min={1}
                        max={24}
                        onChange={(e) =>
                          setValidityMonths(
                            Math.min(24, Math.max(1, parseInt(e.target.value) || 1)),
                          )
                        }
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <SettingToggle
                  icon={Wallet}
                  label="Requires Community Tax Number (CTN)"
                  checked={hasCtn}
                  onChange={setHasCtn}
                />

                <div>
                  <label className="block text-[10px] text-gray-500 mb-1 uppercase font-semibold">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => {
                      if (e.target.value.length <= 80)
                        setFooterText(e.target.value);
                    }}
                    maxLength={80}
                    placeholder="e.g., Not valid without dry seal."
                    className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-right text-[10px] text-gray-400 mt-0.5">
                    {footerText.length}/80
                  </p>
                </div>
              </div>
            </EditorSection>

            {/* ── Signatories (max 5, grid: left 2 + right 2, 5th centered) ── */}
            <EditorSection
              title="Signatories"
              icon={User}
              isExpanded={expandedSections.has("signatories")}
              onToggle={() => toggleSection("signatories")}
              badge={`${signatories.length}/5`}
              extra={
                signatories.length < 5 ? (
                  <button
                    onClick={addSignatory}
                    className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                ) : undefined
              }
            >
              <p className="text-[11px] text-gray-500 mb-3">
                Up to 5 signatories. Layout: #1-#2 left side, #3-#4 right side,
                #5 centered below.
              </p>
              <div className="space-y-3">
                {signatories.map((sig, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-3 border border-gray-200 rounded-md bg-gray-50/50"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex-shrink-0 mt-1">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={sig.name}
                        onChange={(e) =>
                          updateSignatory(idx, "name", e.target.value)
                        }
                        placeholder="Full Name (e.g., MARICEL PINEDA - EMPERADOR)"
                        maxLength={MAX_SIGNATORY_NAME_LENGTH}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-semibold uppercase"
                      />
                      <input
                        type="text"
                        value={sig.position}
                        onChange={(e) =>
                          updateSignatory(idx, "position", e.target.value)
                        }
                        placeholder="Position (e.g., Punong Barangay)"
                        maxLength={MAX_SIGNATORY_POSITION_LENGTH}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 italic"
                      />
                    </div>
                    {signatories.length > 1 && (
                      <button
                        onClick={() => removeSignatory(idx)}
                        className="text-red-400 hover:text-red-600 p-1 mt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </EditorSection>

            {/* Save Button */}
            <div className="pt-2">
              <button
                onClick={() => setIsCreateConfirmOpen(true)}
                disabled={isSaving || !title.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                  title.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-[0.98]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                } disabled:opacity-70`}
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Create Template"}
              </button>
            </div>
          </div>

          {/* ═════════════════════ RIGHT: Live Preview ═════════════════════ */}
          <div className="w-full lg:w-7/12">
            <div className="lg:sticky lg:top-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-800">
                    Live Preview
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sample data shown in{" "}
                    <span className="text-blue-600 font-semibold">blue</span> —
                    updates in real-time
                  </p>
                </div>
                <button className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print
                </button>
              </div>

              <div className="p-3 md:p-5 rounded-lg bg-gray-100/50 border border-gray-200">
                <NewTemplatePreview data={previewData} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Error Toast */}
      {notification && notification.type === "error" && (
        <div
          className="fixed bottom-6 right-6 px-4 py-3 rounded-md shadow-lg text-white text-sm font-medium max-w-sm flex items-center gap-2 bg-red-600"
        >
          <AlertCircle className="w-4 h-4" />
          <span>{notification.message}</span>
        </div>
      )}

      <ConfirmModal
        isOpen={isCreateConfirmOpen}
        onCancel={() => setIsCreateConfirmOpen(false)}
        onConfirm={() => {
          setIsCreateConfirmOpen(false);
          void handleSave();
        }}
        title="Create Template"
        message="Are you sure you want to create this template?"
        confirmText="Create"
        cancelText="Cancel"
        type="info"
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
}

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE PARTS
// ═══════════════════════════════════════════════════════════════════════════════

function DesignCard({
  active,
  onClick,
  label,
  description,
  preview,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  description: string;
  preview: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-lg border-2 transition-all ${
        active
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div
        className={`p-2 rounded border mb-2 ${
          active ? "border-blue-200 bg-white" : "border-gray-100 bg-gray-50"
        }`}
      >
        {preview}
      </div>
      <p
        className={`text-[11px] font-bold ${active ? "text-blue-700" : "text-gray-700"}`}
      >
        {label}
      </p>
      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
        {description}
      </p>
    </button>
  );
}

function EditorSection({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  children,
  extra,
  badge,
}: {
  title: string;
  icon: LucideIcon;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  extra?: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
            {title}
          </span>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-semibold">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {extra && <div onClick={(e) => e.stopPropagation()}>{extra}</div>}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  );
}

function FieldCheckbox({
  field,
  checked,
  onChange,
}: {
  field: PreviewField;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer transition-all text-sm ${
        checked
          ? "bg-blue-50 border border-blue-200 text-blue-700"
          : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <span className="text-[11px] font-medium truncate">{field.label}</span>
    </label>
  );
}

function RequirementToggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
        disabled
          ? "opacity-40 cursor-not-allowed border-gray-200 bg-gray-50"
          : checked
            ? "border-blue-300 bg-blue-50/60"
            : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <input
        type="checkbox"
        checked={checked && !disabled}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon
            className={`w-4 h-4 ${checked && !disabled ? "text-blue-600" : "text-gray-400"}`}
          />
          <span
            className={`text-sm font-semibold ${checked && !disabled ? "text-blue-700" : "text-gray-700"}`}
          >
            {label}
          </span>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
      </div>
    </label>
  );
}

function SettingToggle({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <Icon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
      <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
        {label}
      </span>
    </label>
  );
}
