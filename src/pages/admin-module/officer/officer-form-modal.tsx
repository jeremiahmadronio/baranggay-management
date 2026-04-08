import { useEffect, useMemo, useState } from "react";
import {
  employeeApi,
  EmployeeStatuses,
  type AddEmployeePayload,
  type DepartmentOption,
  type EditEmployeePayload,
  type EmployeeStatus,
  type EmployeeTable,
  type PersonSearchResult,
} from "../../../service/admin-module-api/officer";
import {
  FormFieldError,
  FormFieldLabel,
  FormModalShell,
} from "../../../reusable";
import {
  DEPARTMENT_POSITION_MAP,
  GLOBAL_POSITIONS,
  resolveDeptKey,
  useDebounce,
  type EmployeeModalMode,
} from "./officer-shared";

interface EmployeeFormModalProps {
  isOpen: boolean;
  mode: EmployeeModalMode;
  departments: DepartmentOption[];
  targetEmployee?: EmployeeTable | null;
  onClose: () => void;
  onSubmit: (
    payload: AddEmployeePayload | EditEmployeePayload,
  ) => Promise<void>;
}

interface PersonPickerProps {
  selectedPerson: PersonSearchResult | null;
  onSelect: (person: PersonSearchResult) => void;
  onClearSelection?: () => void;
  disabled?: boolean;
}

const POSITION_MIN_LENGTH = 2;
const POSITION_MAX_LENGTH = 60;
const POSITION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\s.,&/()'-]*$/;

const normalizePositionInput = (value: string) =>
  value
    .replace(/[^A-Za-z0-9\s.,&/()'-]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, POSITION_MAX_LENGTH);

function PersonPicker({
  selectedPerson,
  onSelect,
  onClearSelection,
  disabled,
}: PersonPickerProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedName = (selectedPerson?.fullName || "").trim().toLowerCase();
  const queryName = query.trim().toLowerCase();
  const hasExactSelectedValue =
    !!selectedPerson && queryName.length > 0 && queryName === selectedName;

  useEffect(() => {
    if (selectedPerson) {
      setQuery(selectedPerson.fullName);
    }
  }, [selectedPerson]);

  useEffect(() => {
    if (
      !debouncedQuery ||
      debouncedQuery.trim().length < 2 ||
      disabled ||
      hasExactSelectedValue
    ) {
      setResults([]);
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await employeeApi.searchPersons(debouncedQuery.trim());
        if (!active) return;
        setResults(res);
      } catch {
        if (!active) return;
        setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [debouncedQuery, disabled, hasExactSelectedValue]);

  return (
    <div className="relative">
      <FormFieldLabel label="Resident / Person" required={!disabled} />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const nextValue = e.target.value;
          setQuery(nextValue);

          if (
            selectedPerson &&
            nextValue.trim().toLowerCase() !==
              selectedPerson.fullName.trim().toLowerCase()
          ) {
            onClearSelection?.();
          }
        }}
        disabled={disabled}
        placeholder={disabled ? "Person locked for edit" : "Search by name..."}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
      />

      {!disabled &&
        !hasExactSelectedValue &&
        (query.trim().length >= 2 || loading) && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-2 text-xs text-gray-500">Searching...</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-500">
                No matching person found.
              </p>
            ) : (
              results.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => {
                    onSelect(person);
                    setQuery(person.fullName);
                    setResults([]);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                >
                  <p className="text-sm font-medium text-gray-800">
                    {person.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(person.barangayIdNumber
                      ? `${person.barangayIdNumber} • `
                      : "") +
                      (person.address ||
                        person.completeAddress ||
                        "No address")}
                  </p>
                </button>
              ))
            )}
          </div>
        )}

      {selectedPerson && (
        <p className="text-xs text-emerald-600 mt-1">
          Selected: {selectedPerson.fullName}
        </p>
      )}
    </div>
  );
}

export function OfficerFormModal({
  isOpen,
  mode,
  departments,
  targetEmployee,
  onClose,
  onSubmit,
}: EmployeeFormModalProps) {
  const isEdit = mode === "edit";
  const [selectedPerson, setSelectedPerson] =
    useState<PersonSearchResult | null>(null);
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [isGlobal, setIsGlobal] = useState(false);
  const [position, setPosition] = useState("");
  const [activateAccount, setActivateAccount] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === departmentId),
    [departments, departmentId],
  );

  const positionOptions = useMemo(() => {
    if (isGlobal) return GLOBAL_POSITIONS;
    const key = resolveDeptKey(selectedDepartment?.name);
    return DEPARTMENT_POSITION_MAP[key] || [];
  }, [isGlobal, selectedDepartment?.name]);

  useEffect(() => {
    if (!isOpen) return;

    setError("");
    setFieldError("");
    setSaving(false);

    if (isEdit && targetEmployee) {
      const dept = departments.find(
        (d) =>
          d.name.toLowerCase() ===
          (targetEmployee.departmentName || "").toLowerCase(),
      );
      setDepartmentId(dept?.id ?? "");
      setIsGlobal(false);
      setPosition(targetEmployee.position || "");
      setActivateAccount(
        targetEmployee.status?.toUpperCase() === EmployeeStatuses.INACTIVE
          ? false
          : true,
      );
      setSelectedPerson(null);
      return;
    }

    setSelectedPerson(null);
    setDepartmentId("");
    setIsGlobal(false);
    setPosition("");
    setActivateAccount(true);
  }, [isOpen, isEdit, targetEmployee, departments]);

  useEffect(() => {
    if (!positionOptions.length) return;
    if (!positionOptions.includes(position)) {
      setPosition(positionOptions[0]);
    }
  }, [positionOptions, position]);

  const handleSubmit = async () => {
    setError("");
    setFieldError("");

    const trimmedPosition = position.trim();

    if (!trimmedPosition) {
      setFieldError("Position is required.");
      return;
    }

    if (trimmedPosition.length < POSITION_MIN_LENGTH) {
      setFieldError(
        `Position must be at least ${POSITION_MIN_LENGTH} characters.`,
      );
      return;
    }

    if (trimmedPosition.length > POSITION_MAX_LENGTH) {
      setFieldError(
        `Position must be at most ${POSITION_MAX_LENGTH} characters.`,
      );
      return;
    }

    if (!POSITION_PATTERN.test(trimmedPosition)) {
      setFieldError(
        "Position contains invalid characters. Use letters, numbers, spaces, and standard punctuation only.",
      );
      return;
    }

    if (!isGlobal && departmentId === "") {
      setFieldError("Department is required unless Global is enabled.");
      return;
    }

    if (!isEdit && !selectedPerson) {
      setFieldError("Please select a person to hire.");
      return;
    }

    const status: EmployeeStatus = activateAccount
      ? EmployeeStatuses.ACTIVE
      : EmployeeStatuses.INACTIVE;

    setSaving(true);
    try {
      if (!isEdit && selectedPerson) {
        const payload: AddEmployeePayload = {
          personId: selectedPerson.id,
          isGlobal,
          departmentId: isGlobal ? 0 : Number(departmentId),
          position: trimmedPosition,
          status,
        };
        await onSubmit(payload);
      } else {
        const payload: EditEmployeePayload = {
          departmentId: departmentId === "" ? undefined : Number(departmentId),
          position: trimmedPosition,
          status,
          ...(selectedPerson ? { personId: selectedPerson.id } : {}),
        };
        await onSubmit(payload);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save employee.");
      setSaving(false);
      return;
    }

    setSaving(false);
    onClose();
  };

  return (
    <FormModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Update Officer / Staff" : "Register Officer / Staff"}
      maxWidthClass="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            {(fieldError || error) && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {fieldError || error}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Register"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <PersonPicker
          selectedPerson={selectedPerson}
          onSelect={setSelectedPerson}
          onClearSelection={() => setSelectedPerson(null)}
          disabled={isEdit}
        />
        {isEdit && targetEmployee && (
          <p className="text-xs text-gray-500 -mt-2">
            Current employee:{" "}
            <span className="font-medium text-gray-700">
              {targetEmployee.fullName}
            </span>
          </p>
        )}

        {!isEdit && (
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <input
              type="checkbox"
              checked={isGlobal}
              onChange={(e) => {
                setIsGlobal(e.target.checked);
                if (e.target.checked) {
                  setDepartmentId("");
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Global Assignment
            </span>
            <span className="text-xs text-gray-500">
              Use this for barangay-wide roles (no department required)
            </span>
          </label>
        )}

        <div>
          <FormFieldLabel label="Department" required={!isGlobal} />
          <select
            value={departmentId}
            onChange={(e) =>
              setDepartmentId(e.target.value ? Number(e.target.value) : "")
            }
            disabled={isGlobal}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {isGlobal ? "Global mode enabled" : "Select department"}
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FormFieldLabel label="Position" required />
          {positionOptions.length > 0 ? (
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {positionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                type="text"
                value={position}
                onChange={(e) =>
                  setPosition(normalizePositionInput(e.target.value))
                }
                maxLength={POSITION_MAX_LENGTH}
                placeholder="e.g. Lupon Secretary"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p
                className={`mt-1 text-[11px] text-right ${
                  position.length >= POSITION_MAX_LENGTH
                    ? "text-red-500 font-semibold"
                    : "text-gray-400"
                }`}
              >
                {position.length}/{POSITION_MAX_LENGTH}
              </p>
            </>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {isGlobal
              ? "Global role positions are available"
              : selectedDepartment
                ? `Department: ${selectedDepartment.name}`
                : "Select a department to see role options"}
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <input
            type="checkbox"
            checked={activateAccount}
            onChange={(e) => setActivateAccount(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Activate account
          </span>
          <span
            className={`ml-auto text-xs px-2 py-0.5 rounded-full ${activateAccount ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
          >
            {activateAccount ? "ACTIVE" : "INACTIVE"}
          </span>
        </label>
        <FormFieldError msg={fieldError ? "" : undefined} />
      </div>
    </FormModalShell>
  );
}
