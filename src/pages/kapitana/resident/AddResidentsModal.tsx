import React, { useEffect, useRef, useState } from "react";
import { CameraIcon, PaperclipIcon, XIcon, EyeIcon } from "lucide-react";
import { FormModalShell, FormSectionTitle } from "../../../reusable";
import {
  getResidentSuggestions,
  searchRelatives,
  type AddResidentRequest,
  type FamilyAssociationRequest,
  type RelativeSearchResult,
  type SuggestionsDTO,
  type ResidentDocumentRequest,
} from "../../../service/admin-module-api/ResidentsManagement";

interface AddResidentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddResidentRequest) => Promise<void>;
}

const CITIZENSHIPS = [
  "Filipino",
  "American",
  "Chinese",
  "Japanese",
  "Korean",
  "Others",
];

const SUFFIX_OPTIONS = ["", "Jr.", "Sr.", "II", "III", "IV", "V"];

const MAX_AGE = 130;
const MIN_YEAR = 1900;
const TODAY_ISO = new Date().toISOString().split("T")[0];
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 40;
const ADDRESS_MAX_LENGTH = 200;
const OCCUPATION_MAX_LENGTH = 80;
const EDUCATION_MIN_LENGTH = 2;
const EDUCATION_MAX_LENGTH = 80;
const EMAIL_MAX_LENGTH = 100;
const CUSTOM_TEXT_MAX_LENGTH = 60;
const HOUSEHOLD_SAMPLE = "1010";

const INITIAL_FORM_DATA: AddResidentRequest = {
  firstName: "",
  lastName: "",
  middleName: "",
  suffix: "",
  contactNumber: "",
  completeAddress: "",
  birthDate: "",
  gender: "",
  civilStatus: "",
  email: "",
  photo: "",
  householdNumber: "",
  precinctNumber: "",
  isVoter: false,
  isHeadOfFamily: false,
  occupation: "",
  citizenship: "Filipino",
  religion: "",
  bloodType: "",
  barangayIdNumber: "",
  dateOfResidency: "",
  educationalAttainment: "",
};

export function AddResidentsModal({
  isOpen,
  onClose,
  onSubmit,
}: AddResidentsModalProps) {
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] =
    useState<AddResidentRequest>(INITIAL_FORM_DATA);
  const [customReligion, setCustomReligion] = useState("");
  const [customCitizenship, setCustomCitizenship] = useState("");
  const [documents, setDocuments] = useState<ResidentDocumentRequest[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionsDTO | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [photoPositionX, setPhotoPositionX] = useState(50);
  const [photoPositionY, setPhotoPositionY] = useState(50);
  const [photoZoom, setPhotoZoom] = useState(1);

  // Family Association state
  const [relativeSearchResults, setRelativeSearchResults] = useState<RelativeSearchResult[]>([]);
  const [relativeSearchLoading, setRelativeSearchLoading] = useState(false);
  const [selectedAssociations, setSelectedAssociations] = useState<
    { relative: RelativeSearchResult; relationshipType: string }[]
  >([]);
  const [viewedRelative, setViewedRelative] = useState<RelativeSearchResult | null>(null);
  const relativeSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return "Failed to submit resident. Please try again.";
  };

  const toOptional = (value?: string | null) => {
    const trimmed = (value ?? "").trim();
    return trimmed.length ? trimmed : undefined;
  };

  const fileToBase64Payload = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result || "");
        const payload = raw.includes(",") ? raw.split(",")[1] : raw;
        resolve(payload);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const inferDocumentType = (file: File) => {
    if (file.type) return file.type;
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ext ? ext.toUpperCase() : "FILE";
  };

  const inferMimeFromName = (name?: string) => {
    const ext = name?.split(".").pop()?.toUpperCase();
    switch (ext) {
      case "PDF":
        return "application/pdf";
      case "PNG":
        return "image/png";
      case "JPG":
      case "JPEG":
        return "image/jpeg";
      case "WEBP":
        return "image/webp";
      case "GIF":
        return "image/gif";
      case "TXT":
        return "text/plain";
      case "CSV":
        return "text/csv";
      case "DOC":
        return "application/msword";
      case "DOCX":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "XLS":
        return "application/vnd.ms-excel";
      case "XLSX":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "PPT":
        return "application/vnd.ms-powerpoint";
      case "PPTX":
        return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      case "ZIP":
        return "application/zip";
      case "RAR":
        return "application/vnd.rar";
      case "7Z":
        return "application/x-7z-compressed";
      case "MP4":
        return "video/mp4";
      case "MP3":
        return "audio/mpeg";
      default:
        return "application/octet-stream";
    }
  };

  const resolveDocumentMimeType = (type?: string, name?: string) => {
    if (type) {
      const trimmed = type.trim();
      if (trimmed.includes("/")) return trimmed;
      const fromType = inferMimeFromName(`x.${trimmed}`);
      if (fromType !== "application/octet-stream") return fromType;
    }
    return inferMimeFromName(name);
  };

  const base64ToBlobUrl = (base64: string, mime: string) => {
    const clean = base64.replace(/\s/g, "");
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  };

  const openDocument = (doc: {
    fileData?: string;
    documentType?: string;
    documentName?: string;
  }) => {
    if (!doc.fileData) return;
    const mime = resolveDocumentMimeType(doc.documentType, doc.documentName);
    const src = base64ToBlobUrl(doc.fileData, mime);
    const win = window.open(src, "_blank", "noopener,noreferrer");
    if (!win) {
      const a = document.createElement("a");
      a.href = src;
      a.download = doc.documentName || "resident-document";
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(src), 60000);
  };

  const createCroppedPhotoPayload = async (sourceDataUrl: string) => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error("Failed to process selected photo"));
      image.src = sourceDataUrl;
    });

    const size = 640;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to prepare image canvas");
    }

    const baseScale = Math.max(size / img.width, size / img.height);
    const scale = baseScale * photoZoom;
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const extraX = Math.max(0, drawWidth - size);
    const extraY = Math.max(0, drawHeight - size);
    const offsetX = -extraX * (photoPositionX / 100);
    const offsetY = -extraY * (photoPositionY / 100);

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    return dataUrl.split(",")[1] ?? "";
  };

  const currentYear = new Date().getFullYear();

  const isValidYearRange = (year: number) =>
    year >= MIN_YEAR && year <= currentYear;

  const validateBarangayId = (value: string) => {
    if (!value) return null;
    const match = value.match(/^([A-Z]{2,6})-(\d{4})-(\d{3,4})$/);
    if (!match) return "Format: BUVC-YYYY-001";

    const year = Number(match[2]);
    if (!isValidYearRange(year)) {
      return `Year must be between ${MIN_YEAR} and ${currentYear}`;
    }

    return null;
  };

  const validatePwdId = (value?: string) => {
    if (!value) return null;
    if (!/^\d{2}-\d{2}-\d{2}-\d{3}-\d{7}$/.test(value)) {
      return "Format: 13-05-19-247-0000001";
    }
    return null;
  };

  const formatPwdIdInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const parts: string[] = [];
    const lengths = [2, 2, 2, 3, 7];
    let start = 0;

    for (const len of lengths) {
      if (start >= digits.length) break;
      parts.push(digits.slice(start, start + len));
      start += len;
    }

    return parts.join("-");
  };

  const normalizeHouseholdInput = (value: string) =>
    value.replace(/\D/g, "").slice(0, 4);

  const normalizeHouseholdSuggestion = (value?: string | null) => {
    const digits = (value ?? "").replace(/\D/g, "");
    if (!digits) return "";
    return digits.length <= 4 ? digits : digits.slice(-4);
  };

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const fetchSuggestions = async () => {
      try {
        setIsSuggesting(true);
        const next = await getResidentSuggestions();
        if (!active) return;

        setSuggestions(next);
        setFormData((prev) => ({
          ...prev,
          barangayIdNumber:
            prev.barangayIdNumber || next.suggestedBarangayId || "",
        }));
      } catch (error) {
        console.error("Failed to fetch resident suggestions:", error);
      } finally {
        if (active) setIsSuggesting(false);
      }
    };

    fetchSuggestions();

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const next = await getResidentSuggestions();
        setSuggestions(next);
      } catch (error) {
        console.error("Failed to refresh resident suggestions:", error);
      } finally {
        setIsSuggesting(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [
    formData.barangayIdNumber,
    formData.householdNumber,
    isOpen,
  ]);

  // Auto-search relatives whenever lastName changes
  useEffect(() => {
    if (!isOpen) return;
    if (relativeSearchTimerRef.current) clearTimeout(relativeSearchTimerRef.current);
    const lastName = formData.lastName.trim();
    if (!lastName) {
      setRelativeSearchResults([]);
      return;
    }
    relativeSearchTimerRef.current = setTimeout(async () => {
      setRelativeSearchLoading(true);
      try {
        const results = await searchRelatives(lastName);
        setRelativeSearchResults(results);
      } catch {
        setRelativeSearchResults([]);
      } finally {
        setRelativeSearchLoading(false);
      }
    }, 400);
    return () => {
      if (relativeSearchTimerRef.current) clearTimeout(relativeSearchTimerRef.current);
    };
  }, [formData.lastName, isOpen]);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return undefined;
    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  const validateName = (name: string) => {
    const value = name.trim();
    if (!value) return null;
    if (value.length < NAME_MIN_LENGTH) {
      return `At least ${NAME_MIN_LENGTH} characters`;
    }
    if (value.length > NAME_MAX_LENGTH) {
      return `Max ${NAME_MAX_LENGTH} characters`;
    }
    if (!/^[A-Za-z][A-Za-z\s'-]*$/.test(value)) {
      return "Letters, spaces, apostrophes, and hyphens only";
    }
    return null;
  };

  const sanitizeNameInput = (value: string) =>
    value
      .replace(/[^A-Za-z\s'-]/g, "")
      .replace(/\s{2,}/g, " ")
      .slice(0, NAME_MAX_LENGTH);

  const sanitizeCustomText = (value: string) =>
    value
      .replace(/[^A-Za-z\s'-]/g, "")
      .replace(/\s{2,}/g, " ")
      .slice(0, CUSTOM_TEXT_MAX_LENGTH);

  const validateEmail = (email: string) => {
    const value = email.trim();
    if (!value) return null;
    if (value.length > EMAIL_MAX_LENGTH) {
      return `Max ${EMAIL_MAX_LENGTH} characters`;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  const validateContact = (contact: string) => {
    if (!contact) return null;
    if (!/^09\d{9}$/.test(contact)) {
      return "Must start with 09 and be exactly 11 digits";
    }
    return null;
  };

  const validateHousehold = (value: string) => {
    if (!value) return null;
    if (!/^\d{4}$/.test(value)) {
      return "Must be exactly 4 digits";
    }

    return null;
  };

  const validateBirthDate = (birthDate: string) => {
    if (!birthDate) return "Required";

    const birth = new Date(birthDate);
    const today = new Date();

    if (birth > today) return "Birth date cannot be in the future";

    const age = calculateAge(birthDate);
    if (age === undefined || age < 0) return "Invalid age";
    if (age > MAX_AGE) return `Age cannot be more than ${MAX_AGE}`;

    return null;
  };

  const validateDateOfResidency = (date: string, birthDate: string) => {
    if (!date) return "Required";
    if (date > TODAY_ISO) {
      return "Date of residency cannot be in the future";
    }
    if (birthDate && date < birthDate) {
      return "Date of residency cannot be earlier than date of birth";
    }
    return null;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || "");
      setPhotoPreview(dataUrl || null);
      setPhotoPositionX(50);
      setPhotoPositionY(50);
      setPhotoZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => ({
          documentName: file.name,
          documentType: inferDocumentType(file),
          fileData: await fileToBase64Payload(file),
        })),
      );

      setDocuments((prev) => [...prev, ...uploaded]);
    } catch (error) {
      console.error("Failed to process document upload:", error);
    } finally {
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const getStep1Errors = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Required";
    else {
      const err = validateName(formData.firstName);
      if (err) newErrors.firstName = err;
    }

    if (!formData.lastName.trim()) newErrors.lastName = "Required";
    else {
      const err = validateName(formData.lastName);
      if (err) newErrors.lastName = err;
    }

    if (formData.middleName) {
      const err = validateName(formData.middleName);
      if (err) newErrors.middleName = err;
    }

    {
      const err = validateBirthDate(formData.birthDate);
      if (err) newErrors.birthDate = err;
    }

    if (!formData.gender) newErrors.gender = "Required";
    if (!formData.civilStatus) newErrors.civilStatus = "Required";

    return newErrors;
  };

  const getStep2Errors = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.completeAddress.trim()) {
      newErrors.completeAddress = "Required";
    } else if (formData.completeAddress.trim().length > ADDRESS_MAX_LENGTH) {
      newErrors.completeAddress = `Max ${ADDRESS_MAX_LENGTH} characters`;
    }
    if (formData.barangayIdNumber) {
      const err = validateBarangayId(formData.barangayIdNumber);
      if (err) newErrors.barangayIdNumber = err;
    }

    if (!formData.householdNumber) newErrors.householdNumber = "Required";
    else {
      const err = validateHousehold(formData.householdNumber);
      if (err) newErrors.householdNumber = err;
    }

    {
      const err = validateDateOfResidency(
        formData.dateOfResidency,
        formData.birthDate,
      );
      if (err) newErrors.dateOfResidency = err;
    }

    return newErrors;
  };

  const getStep3Errors = () => {
    const newErrors: Record<string, string> = {};

    // Email is now optional, only validate if present
    if (formData.email?.trim()) {
      const err = validateEmail(formData.email);
      if (err) newErrors.email = err;
    }

    // Citizenship is still required
    const finalCitizenship =
      formData.citizenship === "Others"
        ? customCitizenship.trim()
        : formData.citizenship;
    if (!finalCitizenship) newErrors.citizenship = "Required";

    // Educational attainment is now optional
    if (formData.educationalAttainment?.trim()) {
      if (formData.educationalAttainment.trim().length < EDUCATION_MIN_LENGTH) {
        newErrors.educationalAttainment = `At least ${EDUCATION_MIN_LENGTH} characters`;
      } else if (
        formData.educationalAttainment.trim().length > EDUCATION_MAX_LENGTH
      ) {
        newErrors.educationalAttainment = `Max ${EDUCATION_MAX_LENGTH} characters`;
      }
    }

    // Occupation is now optional (do not require, only validate if present)
    if (formData.occupation?.trim()) {
      if ((formData.occupation ?? "").trim().length > OCCUPATION_MAX_LENGTH) {
        newErrors.occupation = `Max ${OCCUPATION_MAX_LENGTH} characters`;
      }
    }

    // Contact number is now optional (do not require, only validate if present)
    if (formData.contactNumber?.trim()) {
      const err = validateContact(formData.contactNumber);
      if (err) newErrors.contactNumber = err;
    }

    return newErrors;
  };

  const validateAllSteps = () => {
    const mergedErrors = {
      ...getStep1Errors(),
      ...getStep2Errors(),
      ...getStep3Errors(),
    };

    setErrors(mergedErrors);
    return Object.keys(mergedErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateAllSteps()) {
      setSubmitError(
        "Please fix the highlighted required fields before submitting.",
      );
      return;
    }

    setLoading(true);
    setSubmitError("");
    try {
      const age = calculateAge(formData.birthDate);
      const croppedPhotoPayload = photoPreview
        ? await createCroppedPhotoPayload(photoPreview)
        : toOptional(formData.photo);

      const normalizedDocuments = documents
        .map((doc) => ({
          documentName: toOptional(doc.documentName),
          documentType: toOptional(doc.documentType),
          fileData: toOptional(doc.fileData),
        }))
        .filter(
          (doc): doc is ResidentDocumentRequest =>
            !!doc.documentName && !!doc.documentType && !!doc.fileData,
        );

      const finalData: AddResidentRequest = {
        ...formData,
        firstName: formData.firstName.trim(),
        middleName: toOptional(formData.middleName),
        lastName: formData.lastName.trim(),
        completeAddress: formData.completeAddress.trim(),
        email: toOptional(formData.email),
        occupation: toOptional(formData.occupation),
        photo: toOptional(croppedPhotoPayload),
        age,
        religion:
          formData.religion === "Others"
            ? toOptional(customReligion)
            : toOptional(formData.religion),
        citizenship:
          formData.citizenship === "Others"
            ? (toOptional(customCitizenship) ?? formData.citizenship)
            : formData.citizenship,
        suffix: toOptional(formData.suffix),
        contactNumber: toOptional(formData.contactNumber),
        bloodType: toOptional(formData.bloodType),
        documents: normalizedDocuments.length ? normalizedDocuments : undefined,
        familyAssociations: selectedAssociations.length
          ? selectedAssociations.map(
              (a): FamilyAssociationRequest => ({
                relativeId: a.relative.id,
                relationshipType: a.relationshipType,
              }),
            )
          : undefined,
        username: "@user",
      };

      await onSubmit(finalData);
      handleClose();
    } catch (error) {
      console.error("Failed to add resident:", error);
      setSubmitError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA);
    setCustomReligion("");
    setCustomCitizenship("");
    setDocuments([]);
    setSuggestions(null);
    setIsSuggesting(false);
    setSubmitError("");
    setPhotoPreview(null);
    setErrors({});
    setRelativeSearchResults([]);
    setSelectedAssociations([]);
    setViewedRelative(null);
    onClose();
  };

  const InputLabel = ({
    label,
    required,
  }: {
    label: string;
    required?: boolean;
  }) => (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );

  const ErrorMsg = ({ msg }: { msg?: string }) => {
    if (!msg) return null;
    return <p className="text-xs text-red-500 mt-1">{msg}</p>;
  };

  const CharCount = ({ current, max }: { current: number; max: number }) => (
    <p
      className={`mt-1 text-[11px] text-right ${
        current >= max ? "text-red-500 font-semibold" : "text-gray-400"
      }`}
    >
      {current}/{max}
    </p>
  );

  return (
    <FormModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Register New Resident"
      maxWidthClass="max-w-4xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex-1 pr-4">
            {submitError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {submitError}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      }
    >
      <div className="px-1">
        <div className="space-y-8">
          <div className="space-y-5">
            <FormSectionTitle title="Personal Information" />
            <div className="flex items-start gap-6">
              <div className="shrink-0">
                <InputLabel label="Photo" />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-gray-50 border border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden relative group"
                >
                  {photoPreview ? (
                    <>
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: `${photoPositionX}% ${photoPositionY}%`,
                          transform: `scale(${photoZoom})`,
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CameraIcon className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <CameraIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {photoPreview && (
                  <div className="mt-3 space-y-2 w-44">
                    <div>
                      <p className="text-[11px] text-gray-500 mb-1">Zoom</p>
                      <input
                        type="range"
                        min={1}
                        max={2.5}
                        step={0.01}
                        value={photoZoom}
                        onChange={(e) => setPhotoZoom(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <InputLabel label="First Name" required />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        firstName: sanitizeNameInput(e.target.value),
                      })
                    }
                    maxLength={NAME_MAX_LENGTH}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.firstName ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Juan"
                  />
                  <CharCount
                    current={formData.firstName.length}
                    max={NAME_MAX_LENGTH}
                  />
                  <ErrorMsg msg={errors.firstName} />
                </div>
                <div>
                  <InputLabel label="Last Name" required />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastName: sanitizeNameInput(e.target.value),
                      })
                    }
                    maxLength={NAME_MAX_LENGTH}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.lastName ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Dela Cruz"
                  />
                  <CharCount
                    current={formData.lastName.length}
                    max={NAME_MAX_LENGTH}
                  />
                  <ErrorMsg msg={errors.lastName} />
                </div>
                <div>
                  <InputLabel label="Middle Name" />
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        middleName: sanitizeNameInput(e.target.value),
                      })
                    }
                    maxLength={NAME_MAX_LENGTH}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.middleName ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Optional"
                  />
                  <CharCount
                    current={(formData.middleName || "").length}
                    max={NAME_MAX_LENGTH}
                  />
                  <ErrorMsg msg={errors.middleName} />
                </div>
                <div>
                  <InputLabel label="Suffix" />
                  <select
                    value={formData.suffix || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        suffix: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {SUFFIX_OPTIONS.map((s) => (
                      <option key={s || "none"} value={s}>
                        {s || "None"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <InputLabel label="Date of Birth" required />
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        birthDate: e.target.value,
                      })
                    }
                    max={new Date().toISOString().split("T")[0]}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.birthDate ? "border-red-500" : "border-gray-300"}`}
                  />
                  <div className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-600">
                    {calculateAge(formData.birthDate) !== undefined
                      ? `${calculateAge(formData.birthDate)} yrs`
                      : "--"}
                  </div>
                </div>
                <ErrorMsg msg={errors.birthDate} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <InputLabel label="Gender" required />
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.gender ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <ErrorMsg msg={errors.gender} />
                </div>
                <div>
                  <InputLabel label="Civil Status" required />
                  <select
                    value={formData.civilStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        civilStatus: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.civilStatus ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                  <ErrorMsg msg={errors.civilStatus} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <FormSectionTitle title="Resident Information" />
            <div>
              <InputLabel label="Complete Address" required />
              <textarea
                value={formData.completeAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    completeAddress: e.target.value,
                  })
                }
                rows={2}
                maxLength={ADDRESS_MAX_LENGTH}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.completeAddress ? "border-red-500" : "border-gray-300"}`}
                placeholder="House No., Street, Subdivision..."
              />
              <CharCount
                current={formData.completeAddress.length}
                max={ADDRESS_MAX_LENGTH}
              />
              <ErrorMsg msg={errors.completeAddress} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <InputLabel label="Barangay ID Number" />
                <input
                  type="text"
                  value={formData.barangayIdNumber}
                  onChange={(e) => {
                    const val = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9\-]/g, "")
                      .slice(0, 15);
                    setFormData({ ...formData, barangayIdNumber: val });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.barangayIdNumber ? "border-red-500" : "border-gray-300"}`}
                  placeholder="BUVC-2026-001"
                />
                {suggestions?.suggestedBarangayId && (
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Suggested:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          barangayIdNumber: suggestions.suggestedBarangayId,
                        })
                      }
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      {suggestions.suggestedBarangayId}
                    </button>
                    {isSuggesting && (
                      <span className="text-gray-400">refreshing...</span>
                    )}
                  </div>
                )}
                <ErrorMsg msg={errors.barangayIdNumber} />
              </div>
              <div>
                <InputLabel label="Household Number" required />
                <input
                  type="text"
                  value={formData.householdNumber}
                  onChange={(e) => {
                    const val = normalizeHouseholdInput(e.target.value);
                    setFormData({ ...formData, householdNumber: val });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.householdNumber ? "border-red-500" : "border-gray-300"}`}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                />
                {suggestions?.suggestedHouseholdNumber && (
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Suggested:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          householdNumber: HOUSEHOLD_SAMPLE,
                        })
                      }
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      {HOUSEHOLD_SAMPLE}
                    </button>
                  </div>
                )}
                <ErrorMsg msg={errors.householdNumber} />
              </div>
              <div>
                <InputLabel label="Date of Residency" required />
                <input
                  type="date"
                  value={formData.dateOfResidency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dateOfResidency: e.target.value,
                    })
                  }
                  max={TODAY_ISO}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.dateOfResidency ? "border-red-500" : "border-gray-300"}`}
                />
                <ErrorMsg msg={errors.dateOfResidency} />
              </div>
            </div>

            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isHeadOfFamily}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isHeadOfFamily: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Head of Family
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-5">
            <FormSectionTitle title="Additional Details" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <InputLabel label="Contact Number" required />
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setFormData({ ...formData, contactNumber: val });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.contactNumber ? "border-red-500" : "border-gray-300"}`}
                  placeholder="09XXXXXXXXX"
                />
                <ErrorMsg msg={errors.contactNumber} />
              </div>
              <div>
                <InputLabel label="Citizenship" required />
                <select
                  value={formData.citizenship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      citizenship: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.citizenship ? "border-red-500" : "border-gray-300"}`}
                >
                  {CITIZENSHIPS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {formData.citizenship === "Others" && (
                  <>
                    <input
                      type="text"
                      value={customCitizenship}
                      onChange={(e) =>
                        setCustomCitizenship(sanitizeCustomText(e.target.value))
                      }
                      maxLength={CUSTOM_TEXT_MAX_LENGTH}
                      placeholder="Specify citizenship"
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <CharCount
                      current={customCitizenship.length}
                      max={CUSTOM_TEXT_MAX_LENGTH}
                    />
                  </>
                )}
                <ErrorMsg msg={errors.citizenship} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <InputLabel label="Occupation" required />
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      occupation: e.target.value,
                    })
                  }
                  maxLength={OCCUPATION_MAX_LENGTH}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.occupation ? "border-red-500" : "border-gray-300"}`}
                  placeholder="e.g. Driver"
                />
                <CharCount
                  current={(formData.occupation || "").length}
                  max={OCCUPATION_MAX_LENGTH}
                />
                <ErrorMsg msg={errors.occupation} />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <PaperclipIcon className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-medium text-gray-700">
                    Resident Files / Documents
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => documentInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Add Files
                </button>
                <input
                  ref={documentInputRef}
                  type="file"
                  multiple
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </div>

              {documents.length === 0 ? (
                <p className="text-xs text-gray-500">No files attached yet.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc, idx) => (
                    <div
                      key={`${doc.documentName}-${idx}`}
                      className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 truncate">
                          {doc.documentName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {doc.documentType}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(idx)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => openDocument(doc)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
        </div>

      {/* SECTION C — Family Association */}
      <div className="px-1">
        <div className="space-y-4">
          <FormSectionTitle title="Family Association" />
          <p className="text-xs text-gray-500 -mt-2">
            Associate this resident with an existing family member in the barangay.
          </p>

          {/* Auto-search hint based on last name */}
          {formData.lastName.trim() ? (
            <p className="text-xs text-gray-500">
              {relativeSearchLoading
                ? "Searching..."
                : `Residents with last name "${formData.lastName.trim()}"`
              }
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">
              Fill in the Last Name field above to auto-search for relatives.
            </p>
          )}

          {/* Search results — inline relationship picker when checked */}
          {relativeSearchResults.length > 0 && (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {relativeSearchResults.map((rel) => {
                const assoc = selectedAssociations.find((a) => a.relative.id === rel.id);
                const isSelected = !!assoc;
                return (
                  <div
                    key={rel.id}
                    className={`border rounded-lg px-4 py-3 transition-colors ${
                      isSelected
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {/* Top row: checkbox + name/info + View Details */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssociations((prev) => [
                              ...prev,
                              { relative: rel, relationshipType: "" },
                            ]);
                          } else {
                            setSelectedAssociations((prev) =>
                              prev.filter((a) => a.relative.id !== rel.id),
                            );
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {rel.firstName} {rel.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {rel.completeAddress} | Age {rel.age} | {rel.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewedRelative(rel)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0"
                      >
                        [View Details]
                      </button>
                      {/* Inline relationship picker — only when checked */}
                      {isSelected && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-500 whitespace-nowrap">Relationship:</span>
                          <select
                            value={assoc!.relationshipType}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedAssociations((prev) =>
                                prev.map((a) =>
                                  a.relative.id === rel.id ? { ...a, relationshipType: val } : a,
                                ),
                              );
                            }}
                            className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select...</option>
                            <option value="FATHER">Father</option>
                            <option value="MOTHER">Mother</option>
                            <option value="PARENT">Parent</option>
                            <option value="SON">Son</option>
                            <option value="DAUGHTER">Daughter</option>
                            <option value="CHILD">Child</option>
                            <option value="SPOUSE">Spouse</option>
                            <option value="HUSBAND">Husband</option>
                            <option value="WIFE">Wife</option>
                            <option value="BROTHER">Brother</option>
                            <option value="SISTER">Sister</option>
                            <option value="SIBLING">Sibling</option>
                            <option value="RELATIVE">Relative</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* View Details mini-modal */}
      {viewedRelative && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={() => setViewedRelative(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Verify Identity</h3>
              <button
                type="button"
                onClick={() => setViewedRelative(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 shrink-0">Full Name:</span>
                <span className="font-medium text-gray-800">
                  {viewedRelative.firstName}{" "}
                  {viewedRelative.middleName ? `${viewedRelative.middleName} ` : ""}
                  {viewedRelative.lastName}
                  {viewedRelative.suffix ? ` ${viewedRelative.suffix}` : ""}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 shrink-0">Address:</span>
                <span className="font-medium text-gray-800">{viewedRelative.completeAddress}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 shrink-0">Age:</span>
                <span className="font-medium text-gray-800">{viewedRelative.age}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 shrink-0">Gender:</span>
                <span className="font-medium text-gray-800">{viewedRelative.gender}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 shrink-0">Civil Status:</span>
                <span className="font-medium text-gray-800">{viewedRelative.civilStatus}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 shrink-0">Contact No.:</span>
                <span className="font-medium text-gray-800">{viewedRelative.contactNumber}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 shrink-0">Household No.:</span>
                <span className="font-medium text-gray-800">{viewedRelative.householdNumber}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 shrink-0">Barangay ID:</span>
                <span className="font-medium text-gray-800">{viewedRelative.barangayIdNumber}</span>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setViewedRelative(null)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
      </div>
    </FormModalShell>
  );
}
