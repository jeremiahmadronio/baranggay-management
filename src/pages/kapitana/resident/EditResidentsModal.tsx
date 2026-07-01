import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, CameraIcon, PaperclipIcon, EyeIcon } from "lucide-react";
import { getResidentSuggestions, searchRelatives } from "../../../service/admin-module-api/ResidentsManagement";
import type {
  ResidentProfileViewDTO,
  ResidentDocumentViewDTO,
  ResidentDocumentRequest,
  UpdateDocumentRequest,
  AddResidentRequest,
  UpdateResidentRequest,
  FamilyAssociationRequest,
  RelativeSearchResult,
  SuggestionsDTO,
} from "../../../service/admin-module-api/ResidentsManagement";

interface EditResidentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  residentId: number;
  fetchProfile: (id: number) => Promise<ResidentProfileViewDTO>;
  onSubmit: (data: UpdateResidentRequest) => Promise<void>;
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
const EMAIL_MAX_LENGTH = 100;

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

export function EditResidentsModal({
  isOpen,
  onClose,
  residentId,
  fetchProfile,
  onSubmit,
}: EditResidentsModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const replaceDocumentInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [formData, setFormData] =
    useState<AddResidentRequest>(INITIAL_FORM_DATA);
  const [status, setStatus] = useState("");
  // Removed customReligion state as religion field is removed
  const [customCitizenship, setCustomCitizenship] = useState("");
  const [existingDocuments, setExistingDocuments] = useState<
    ResidentDocumentViewDTO[]
  >([]);
  const [newDocuments, setNewDocuments] = useState<ResidentDocumentRequest[]>(
    [],
  );
  const [removedDocumentIds, setRemovedDocumentIds] = useState<number[]>([]);
  const [updatedDocuments, setUpdatedDocuments] = useState<
    UpdateDocumentRequest[]
  >([]);
  const [replaceTargetDocumentId, setReplaceTargetDocumentId] = useState<
    number | null
  >(null);
  const [suggestions, setSuggestions] = useState<SuggestionsDTO | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [photoPositionX, setPhotoPositionX] = useState(50);
  const [photoPositionY, setPhotoPositionY] = useState(50);
  const [photoZoom, setPhotoZoom] = useState(1);
  const [hasPhotoUpdate, setHasPhotoUpdate] = useState(false);

  // Family Association state
  const [relativeSearchResults, setRelativeSearchResults] = useState<RelativeSearchResult[]>([]);
  const [relativeSearchLoading, setRelativeSearchLoading] = useState(false);
  const [selectedAssociations, setSelectedAssociations] = useState<
    { relative: RelativeSearchResult; relationshipType: string }[]
  >([]);
  const [residentPeopleId, setResidentPeopleId] = useState<number | null>(null);
  const [viewedRelative, setViewedRelative] = useState<RelativeSearchResult | null>(null);
  const relativeSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return "Failed to update resident. Please try again.";
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

  const toDisplayPhotoSrc = (photo?: string) => {
    const trimmed = photo?.trim();
    if (!trimmed) return null;
    if (
      trimmed.startsWith("data:") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("blob:")
    ) {
      return trimmed;
    }
    return `data:image/jpeg;base64,${trimmed}`;
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

  const normalizePrecinctInput = (value: string) => {
    const upper = value.toUpperCase();
    const filtered = upper.replace(/[^A-Z0-9-]/g, "");

    let hasHyphen = false;
    let coreCount = 0;
    let result = "";

    for (const ch of filtered) {
      if (ch === "-") {
        if (hasHyphen) continue;
        if (result.length === 0 || coreCount === 0) continue;
        hasHyphen = true;
        result += ch;
        continue;
      }

      if (coreCount >= 5) continue;
      coreCount += 1;
      result += ch;
    }

    if (result.endsWith("-")) {
      result = result.slice(0, -1);
    }

    return result;
  };

  useEffect(() => {
    if (!isOpen) return;

    setFetching(true);
    setErrors({});
    setPhotoPreview(null);
    setHasPhotoUpdate(false);

    fetchProfile(residentId)
      .then((profile) => {
        const existingPhoto = profile.photo?.trim() || "";
        setStatus(profile.status || "");
        setExistingDocuments(profile.documents || []);
        setNewDocuments([]);
        setRemovedDocumentIds([]);
        setUpdatedDocuments([]);
        setReplaceTargetDocumentId(null);
        setPhotoPreview(toDisplayPhotoSrc(existingPhoto));

        // Religion field removed

        let cit = profile.citizenship || "Filipino";
        const isCustomCit = cit && !CITIZENSHIPS.includes(cit);
        if (isCustomCit) {
          setCustomCitizenship(cit);
          cit = "Others";
        } else {
          setCustomCitizenship("");
        }

        setResidentPeopleId(profile.peopleId);

        if (profile.associations && profile.associations.length > 0) {
          setSelectedAssociations(
            profile.associations.map((assoc) => ({
              relative: {
                id: assoc.relativePersonId,
                firstName: assoc.firstName,
                lastName: assoc.lastName,
                middleName: assoc.middleName,
                suffix: assoc.suffix,
                completeAddress: "",
                age: assoc.age,
                birthDate: "",
                gender: assoc.gender,
                civilStatus: "",
                contactNumber: "",
                barangayIdNumber: assoc.barangayIdNumber,
                householdNumber: "",
                status: "ACTIVE",
              },
              relationshipType: assoc.relationshipType,
            }))
          );
        } else {
          setSelectedAssociations([]);
        }

        setFormData({
          firstName: profile.firstName,
          lastName: profile.lastName,
          middleName: profile.middleName || "",
          suffix: profile.suffix || "",
          contactNumber: profile.contactNumber || "",
          completeAddress: profile.completeAddress,
          birthDate: profile.birthDate,
          gender: profile.gender,
          civilStatus: profile.civilStatus,
          email: profile.email || "",
          photo: existingPhoto,
          householdNumber: profile.householdNumber || "",
          precinctNumber: profile.precinctNumber || "",
          isVoter: profile.isVoter,
          isHeadOfFamily: profile.isHeadOfFamily,
          occupation: profile.occupation || "",
          citizenship: cit,
          bloodType: profile.bloodType || "",
          barangayIdNumber: profile.barangayIdNumber || "",
          dateOfResidency: profile.dateOfResidency || "",
          is4ps: false,
          isPwd: false,
          pwdIdNumber: "",
          isIndigent: false,
        });
      })
      .catch((error) => console.error("Failed to fetch profile:", error))
      .finally(() => setFetching(false));
  }, [isOpen, residentId, fetchProfile]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const fetchSuggestions = async () => {
      try {
        setIsSuggesting(true);
        const next = await getResidentSuggestions();
        if (!active) return;
        setSuggestions(next);
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
  }, [formData.householdNumber, formData.precinctNumber, isOpen]);

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
        // Exclude the resident themselves from search results
        const filtered = results.filter((r) => r.id !== residentPeopleId);
        setRelativeSearchResults(filtered);
      } catch {
        setRelativeSearchResults([]);
      } finally {
        setRelativeSearchLoading(false);
      }
    }, 400);
    return () => {
      if (relativeSearchTimerRef.current) clearTimeout(relativeSearchTimerRef.current);
    };
  }, [formData.lastName, isOpen, residentPeopleId]);

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
    const match = value.match(/^(\d{4})-HH-(\d{4})$/);
    if (!match) return "Format: YYYY-HH-0000";

    const year = Number(match[1]);
    if (!isValidYearRange(year)) {
      return `Year must be between ${MIN_YEAR} and ${currentYear}`;
    }

    return null;
  };

  const validatePrecinct = (value: string) => {
    if (!value) return null;
    const core = value.replace(/-/g, "");
    const hyphenCount = (value.match(/-/g) || []).length;

    if (!/^[A-Z0-9-]+$/.test(value)) {
      return "A-Z, 0-9, and optional one - only";
    }

    if (hyphenCount > 1) {
      return "Only one - is allowed";
    }

    if (core.length !== 5) {
      return "Must have exactly 5 letters/numbers";
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
      setHasPhotoUpdate(true);
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

      setNewDocuments((prev) => [...prev, ...uploaded]);
    } catch (error) {
      console.error("Failed to process document upload:", error);
    } finally {
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  };

  const removeExistingDocument = (id?: number) => {
    if (id !== undefined) {
      setRemovedDocumentIds((prev) =>
        prev.includes(id) ? prev : [...prev, id],
      );
      setUpdatedDocuments((prev) => prev.filter((doc) => doc.id !== id));
    }
    setExistingDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const openReplaceDocumentPicker = (id: number) => {
    setReplaceTargetDocumentId(id);
    replaceDocumentInputRef.current?.click();
  };

  const handleReplaceExistingDocument = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    const targetId = replaceTargetDocumentId;

    if (!file || targetId === null) {
      if (replaceDocumentInputRef.current) {
        replaceDocumentInputRef.current.value = "";
      }
      setReplaceTargetDocumentId(null);
      return;
    }

    try {
      const payload = await fileToBase64Payload(file);
      const nextUpdate: UpdateDocumentRequest = {
        id: targetId,
        documentName: file.name,
        documentType: inferDocumentType(file),
        fileData: payload,
      };

      setUpdatedDocuments((prev) => {
        const withoutTarget = prev.filter((doc) => doc.id !== targetId);
        return [...withoutTarget, nextUpdate];
      });

      setExistingDocuments((prev) =>
        prev.map((doc) =>
          doc.id === targetId
            ? {
                ...doc,
                documentName: file.name,
                documentType: inferDocumentType(file),
              }
            : doc,
        ),
      );
    } catch (error) {
      console.error("Failed to replace document file:", error);
    } finally {
      if (replaceDocumentInputRef.current) {
        replaceDocumentInputRef.current.value = "";
      }
      setReplaceTargetDocumentId(null);
    }
  };

  const removeNewDocument = (index: number) => {
    setNewDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
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
    if (!formData.completeAddress.trim()) {
      newErrors.completeAddress = "Required";
    } else if (formData.completeAddress.trim().length > ADDRESS_MAX_LENGTH) {
      newErrors.completeAddress = `Max ${ADDRESS_MAX_LENGTH} characters`;
    }

    if (!formData.householdNumber) newErrors.householdNumber = "Required";
    else {
      const err = validateHousehold(formData.householdNumber);
      if (err) newErrors.householdNumber = err;
    }

    if (!formData.precinctNumber) newErrors.precinctNumber = "Required";
    else {
      const err = validatePrecinct(formData.precinctNumber);
      if (err) newErrors.precinctNumber = err;
    }

    {
      const err = validateDateOfResidency(
        formData.dateOfResidency,
        formData.birthDate,
      );
      if (err) newErrors.dateOfResidency = err;
    }

    if (formData.contactNumber) {
      const err = validateContact(formData.contactNumber);
      if (err) newErrors.contactNumber = err;
    }

    {
      const err = validateEmail(formData.email || "");
      if (err) newErrors.email = err;
    }

    const finalCitizenship =
      formData.citizenship === "Others"
        ? customCitizenship.trim()
        : formData.citizenship;

    if (!finalCitizenship) newErrors.citizenship = "Required";

    // Educational attainment is now optional and removed from UI

    if ((formData.occupation ?? "").trim().length > OCCUPATION_MAX_LENGTH) {
      newErrors.occupation = `Max ${OCCUPATION_MAX_LENGTH} characters`;
    }

    if (formData.isPwd && !formData.pwdIdNumber?.trim()) {
      newErrors.pwdIdNumber = "PWD ID number is required when PWD is checked";
    } else if (formData.isPwd) {
      const err = validatePwdId(formData.pwdIdNumber);
      if (err) newErrors.pwdIdNumber = err;
    }

    setErrors(newErrors);
    return newErrors;
  };

  const scrollToFirstError = (errorMap: Record<string, string>) => {
    const firstField = Object.keys(errorMap)[0];
    if (!firstField) return;

    const target = document.querySelector<HTMLElement>(
      `[name="${firstField}"]`,
    );
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus?.();
    }
  };

  const handleSubmit = async () => {
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setSubmitError(
        "Please fix the highlighted required fields before saving.",
      );
      scrollToFirstError(nextErrors);
      return;
    }

    setLoading(true);
    setSubmitError("");
    try {
      const age = calculateAge(formData.birthDate);
      const croppedPhotoPayload =
        hasPhotoUpdate && photoPreview
          ? await createCroppedPhotoPayload(photoPreview)
          : formData.photo;
      const updateDocuments: UpdateDocumentRequest[] = [
        ...removedDocumentIds.map((id) => ({ id, isRemoved: true })),
        ...updatedDocuments,
        ...newDocuments.map((doc) => ({
          documentName: doc.documentName,
          documentType: doc.documentType,
          fileData: doc.fileData,
        })),
      ];

      const finalData: UpdateResidentRequest = {
        ...formData,
        firstName: formData.firstName.trim(),
        middleName: (formData.middleName ?? "").trim(),
        lastName: formData.lastName.trim(),
        completeAddress: formData.completeAddress.trim(),
        email: (formData.email ?? "").trim(),
        occupation: (formData.occupation ?? "").trim(),
        photo: croppedPhotoPayload,
        age,
        citizenship:
          formData.citizenship === "Others"
            ? customCitizenship.trim()
            : formData.citizenship,
        documents: updateDocuments.length ? updateDocuments : undefined,
        familyAssociations: selectedAssociations.length
          ? selectedAssociations.map(
              (a): FamilyAssociationRequest => ({
                relativeId: a.relative.id,
                relationshipType: a.relationshipType,
              }),
            )
          : undefined,
      };

      await onSubmit(finalData);
      handleClose();
    } catch (error) {
      console.error("Failed to update resident:", error);
      setSubmitError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPhotoPreview(null);
    setStatus("");
    setExistingDocuments([]);
    setNewDocuments([]);
    setRemovedDocumentIds([]);
    setUpdatedDocuments([]);
    setReplaceTargetDocumentId(null);
    setSuggestions(null);
    setIsSuggesting(false);
    setPhotoPositionX(50);
    setPhotoPositionY(50);
    setPhotoZoom(1);
    setHasPhotoUpdate(false);
    setErrors({});
    setSubmitError("");
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Resident
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {fetching ? (
              <div className="px-6 py-24 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm text-gray-500">
                  Loading resident data...
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-6 overflow-y-auto flex-1">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
                        Personal Information
                      </h3>
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
                          {photoPreview && hasPhotoUpdate && (
                            <div className="mt-3 space-y-2 w-44">
                              <div>
                                <p className="text-[11px] text-gray-500 mb-1">
                                  Zoom
                                </p>
                                <input
                                  type="range"
                                  min={1}
                                  max={2.5}
                                  step={0.01}
                                  value={photoZoom}
                                  onChange={(e) =>
                                    setPhotoZoom(Number(e.target.value))
                                  }
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
                              name="firstName"
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
                              name="lastName"
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
                              name="middleName"
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

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <InputLabel label="Date of Birth" required />
                          <div className="flex gap-2">
                            <input
                              name="birthDate"
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
                            <div className="w-16 px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-600">
                              {calculateAge(formData.birthDate) !== undefined
                                ? `${calculateAge(formData.birthDate)}y`
                                : "--"}
                            </div>
                          </div>
                          <ErrorMsg msg={errors.birthDate} />
                        </div>
                        <div>
                          <InputLabel label="Gender" required />
                          <select
                            name="gender"
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
                            name="civilStatus"
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

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
                        Resident Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <InputLabel label="Complete Address" required />
                          <textarea
                            name="completeAddress"
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
                          />
                          <CharCount
                            current={formData.completeAddress.length}
                            max={ADDRESS_MAX_LENGTH}
                          />
                          <ErrorMsg msg={errors.completeAddress} />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <InputLabel label="Barangay ID" required />
                            <input
                              type="text"
                              value={formData.barangayIdNumber}
                              disabled
                              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg font-mono text-sm"
                            />
                          </div>
                          <div>
                            <InputLabel label="Household No." required />
                            <input
                              name="householdNumber"
                              type="text"
                              value={formData.householdNumber}
                              onChange={(e) => {
                                const val = e.target.value
                                  .toUpperCase()
                                  .replace(/[^A-Z0-9\-]/g, "")
                                  .slice(0, 12);
                                setFormData({
                                  ...formData,
                                  householdNumber: val,
                                });
                              }}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.householdNumber ? "border-red-500" : "border-gray-300"}`}
                              placeholder="YYYY-HH-0000"
                            />
                            {suggestions?.suggestedHouseholdNumber && (
                              <div className="mt-1 flex items-center gap-2 text-xs">
                                <span className="text-gray-500">
                                  Suggested:
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      householdNumber:
                                        suggestions.suggestedHouseholdNumber,
                                    }))
                                  }
                                  className="text-blue-600 hover:text-blue-700 underline"
                                >
                                  {suggestions.suggestedHouseholdNumber}
                                </button>
                                {isSuggesting && (
                                  <span className="text-gray-400">
                                    refreshing...
                                  </span>
                                )}
                              </div>
                            )}
                            <ErrorMsg msg={errors.householdNumber} />
                          </div>
                          <div>
                            <InputLabel label="Precinct No." required />
                            <input
                              name="precinctNumber"
                              type="text"
                              value={formData.precinctNumber}
                              onChange={(e) => {
                                const val = normalizePrecinctInput(
                                  e.target.value,
                                );
                                setFormData({
                                  ...formData,
                                  precinctNumber: val,
                                });
                              }}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.precinctNumber ? "border-red-500" : "border-gray-300"}`}
                              placeholder="AB123 or AB-123"
                            />
                            {suggestions?.suggestedPrecinct && (
                              <div className="mt-1 flex items-center gap-2 text-xs">
                                <span className="text-gray-500">
                                  Suggested:
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      precinctNumber:
                                        suggestions.suggestedPrecinct,
                                    }))
                                  }
                                  className="text-blue-600 hover:text-blue-700 underline"
                                >
                                  {suggestions.suggestedPrecinct}
                                </button>
                              </div>
                            )}
                            <ErrorMsg msg={errors.precinctNumber} />
                          </div>
                        </div>

                        <div>
                          <InputLabel label="Resident Status" />
                          <input
                            type="text"
                            value={status || "—"}
                            disabled
                            className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-600 rounded-lg"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Loaded directly from API.
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <InputLabel label="Date of Residency" required />
                            <input
                              name="dateOfResidency"
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
                          <div className="col-span-2 flex items-center gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.isVoter}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    isVoter: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                Registered Voter
                              </span>
                            </label>
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
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
                        Additional Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <InputLabel label="Contact Number" />
                          <input
                            name="contactNumber"
                            type="tel"
                            value={formData.contactNumber}
                            onChange={(e) => {
                              const val = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 11);
                              setFormData({ ...formData, contactNumber: val });
                            }}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.contactNumber ? "border-red-500" : "border-gray-300"}`}
                          />
                          <ErrorMsg msg={errors.contactNumber} />
                        </div>
                        <div>
                          <InputLabel label="Email Address" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            maxLength={EMAIL_MAX_LENGTH}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <CharCount
                            current={(formData.email || "").length}
                            max={EMAIL_MAX_LENGTH}
                          />
                          <ErrorMsg msg={errors.email} />
                        </div>
                        <div>
                          <InputLabel label="Citizenship" required />
                          <select
                            name="citizenship"
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
                            <input
                              type="text"
                              value={customCitizenship}
                              onChange={(e) =>
                                setCustomCitizenship(e.target.value)
                              }
                              maxLength={40}
                              placeholder="Specify citizenship"
                              className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          )}
                          <ErrorMsg msg={errors.citizenship} />
                        </div>
                        {/* Religion field removed */}
                        <div>
                          <InputLabel label="Occupation" />
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <CharCount
                            current={(formData.occupation || "").length}
                            max={OCCUPATION_MAX_LENGTH}
                          />
                          <ErrorMsg msg={errors.occupation} />
                        </div>
                        {/* Blood Type field removed */}

                        {/* Educational Attainment field removed */}
                      </div>

                      <div className="p-4 mt-4 bg-gray-50 rounded-lg border border-gray-100">
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
                          <input
                            ref={replaceDocumentInputRef}
                            type="file"
                            onChange={handleReplaceExistingDocument}
                            className="hidden"
                          />
                        </div>

                        {existingDocuments.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-500 mb-2">
                              Current Files
                            </p>
                            <div className="space-y-2">
                              {existingDocuments.map((doc) => (
                                <div
                                  key={doc.id ?? doc.documentName}
                                  className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm text-gray-700 truncate">
                                      {doc.documentName || "Untitled document"}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {doc.documentType || "FILE"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => openDocument(doc)}
                                      disabled={!doc.fileData}
                                      className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeExistingDocument(doc.id)
                                      }
                                      className="text-xs text-red-600 hover:text-red-700"
                                    >
                                      Remove
                                    </button>
                                    {doc.id !== undefined && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (doc.id !== undefined) {
                                            openReplaceDocumentPicker(doc.id);
                                          }
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700"
                                      >
                                        Replace File
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {newDocuments.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">
                              New Files to Upload
                            </p>
                            <div className="space-y-2">
                              {newDocuments.map((doc, idx) => (
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
                                    onClick={() => removeNewDocument(idx)}
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
                          </div>
                        )}

                        {existingDocuments.length === 0 &&
                          newDocuments.length === 0 && (
                            <p className="text-xs text-gray-500">
                              No files attached yet.
                            </p>
                          )}
                      </div>
                  </div>

                  {/* SECTION C — Family Association */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
                      Family Association
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Associate this resident with an existing family member in the barangay.
                    </p>

                    {/* Currently associated — always visible */}
                    {selectedAssociations.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Currently Associated</p>
                        <div className="space-y-2">
                          {selectedAssociations.map((assoc) => (
                            <div
                              key={assoc.relative.id}
                              className="border border-blue-300 bg-blue-50 rounded-lg px-4 py-3 flex items-center gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800">
                                  {assoc.relative.firstName} {assoc.relative.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Age {assoc.relative.age} | {assoc.relative.status}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-gray-500 whitespace-nowrap">Relationship:</span>
                                <select
                                  value={assoc.relationshipType}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedAssociations((prev) =>
                                      prev.map((a) =>
                                        a.relative.id === assoc.relative.id ? { ...a, relationshipType: val } : a
                                      )
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
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedAssociations((prev) =>
                                    prev.filter((a) => a.relative.id !== assoc.relative.id)
                                  )
                                }
                                className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Auto-search based on lastName field — for adding new relatives */}
                    {formData.lastName.trim() ? (
                      <p className="text-xs text-gray-500 mb-2">
                        {relativeSearchLoading
                          ? "Searching..."
                          : `Residents with last name "${formData.lastName.trim()}"`}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic mb-2">
                        Fill in the Last Name field above to auto-search for relatives to add.
                      </p>
                    )}

                    {/* Search results — only shows people NOT already associated */}
                    {relativeSearchResults.filter(
                      (r) => !selectedAssociations.some((a) => a.relative.id === r.id)
                    ).length > 0 && (
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {relativeSearchResults
                          .filter((r) => !selectedAssociations.some((a) => a.relative.id === r.id))
                          .map((rel) => (
                            <div
                              key={rel.id}
                              className="border border-gray-200 bg-white rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() => {
                                    setSelectedAssociations((prev) => [
                                      ...prev,
                                      { relative: rel, relationshipType: "" },
                                    ]);
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
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {formData.lastName.trim() &&
                      !relativeSearchLoading &&
                      relativeSearchResults.filter(
                        (r) => !selectedAssociations.some((a) => a.relative.id === r.id)
                      ).length === 0 &&
                      selectedAssociations.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-3 mb-2">
                          No residents found with that last name.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
                {submitError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
                    {submitError}
                  </p>
                )}
                <div className="flex items-center justify-between">
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
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    )}

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
    </AnimatePresence>
  );
}
