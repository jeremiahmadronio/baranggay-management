import { useState, useEffect } from "react";
import { XIcon, UsersIcon, AlertTriangleIcon, Loader2Icon } from "lucide-react";
import {
  luponOptions,
  type LuponOptionDTO,
} from "../../../service/blotter-api/BlotterFormComplaint";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: "success" | "danger" | "info";
  children: React.ReactNode;
}

export const ActionModal = ({
  isOpen,
  onClose,
  title,
  type = "info",
  children,
}: ModalProps) => {
  if (!isOpen) return null;

  const config = {
    success: {
      iconBg: "bg-green-500",
      buttonStyle: "border-2 border-green-500 text-green-600 hover:bg-green-50",
      icon: (
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
    danger: {
      iconBg: "bg-red-500",
      buttonStyle: "border-2 border-red-500 text-red-600 hover:bg-red-50",
      icon: (
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    info: {
      iconBg: "bg-blue-500",
      buttonStyle: "border-2 border-blue-500 text-blue-600 hover:bg-blue-50",
      icon: (
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const { iconBg, buttonStyle, icon } = config[type];

  return (
    <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm py-8 px-6 text-center">
        <div
          className={`w-20 h-20 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-5`}
        >
          {icon}
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
        <div className="text-gray-500 text-sm mb-6">{children}</div>
        <button
          onClick={onClose}
          className={`w-full py-2.5 font-medium rounded transition-colors ${buttonStyle}`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PangkatMember {
  employeeId: number;
  fullName: string;
  position: string;
}

interface ReferToLuponModalProps {
  blotterNumber: string;
  complainantName: string;
  loading: boolean;
  onConfirm: (members: PangkatMember[]) => Promise<void>;
  onCancel: () => void;
}

// ─── Slot positions ───────────────────────────────────────────────────────────

const SLOTS = [
  { position: "Chairman", sublabel: "Pangkat Chairman" },
  { position: "Secretary", sublabel: "Pangkat Secretary" },
  { position: "Member", sublabel: "Lupon Member" },
] as const;

// ─── Modal ────────────────────────────────────────────────────────────────────

export function ReferToLuponModal({
  blotterNumber,
  complainantName,
  loading,
  onConfirm,
  onCancel,
}: ReferToLuponModalProps) {
  const [employees, setEmployees] = useState<LuponOptionDTO[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // selected employeeId per slot index ("" = not yet chosen)
  const [selected, setSelected] = useState<(number | "")[]>(["", "", ""]);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Fetch employees ────────────────────────────────────────────────────────
  useEffect(() => {
    luponOptions()
      .then(setEmployees)
      .catch((err) =>
        setFetchError(
          err instanceof Error ? err.message : "Failed to load lupon options.",
        ),
      )
      .finally(() => setFetchLoading(false));
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const normalize = (v: string) =>
    (v || "")
      .toLowerCase()
      .replace(/[_\s-]+/g, " ")
      .trim();

  const optionsFor = (position: string) =>
    employees.filter((e) => {
      const p = normalize(e.position);
      const slot = normalize(position);
      if (slot === "member") return p.includes("member");
      if (slot === "chairman") return p.includes("chairman");
      if (slot === "secretary") return p.includes("secretary");
      return p === slot;
    });

  const updateSelected = (idx: number, value: number | "") => {
    setSelected((prev) => prev.map((v, i) => (i === idx ? value : v)));
    if (error) setError("");
  };

  const allFilled = selected.every((v) => v !== "");

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!allFilled) {
      setError("Please select a name for all Pangkat members.");
      return;
    }

    const uniqueIds = new Set(selected);
    if (uniqueIds.size !== selected.length) {
      setError(
        "Duplicate selection detected. Please select unique individuals.",
      );
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const members: PangkatMember[] = selected.map((empId, idx) => {
        const emp = employees.find((e) => e.id === empId)!;
        return {
          employeeId: emp.id,
          fullName: emp.name,
          position: SLOTS[idx].position,
        };
      });
      await onConfirm(members);
      setShowSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to escalate case.");
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loading || submitting;

  return (
    <>
      {/* ── Main Modal ── */}
      {!showSuccess && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <UsersIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Escalate to Lupong Tagapamayapa
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {blotterNumber} · {complainantName}
                  </p>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Info block */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Why Escalate?
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  The complaint filed at the blotter level remained unresolved.
                  Escalate this case by assigning the three (3) Pangkat
                  Tagapagkasundo members who will handle the formal
                  conciliation.
                </p>
              </div>

              {/* Loading employees */}
              {fetchLoading && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Loader2Icon className="w-5 h-5 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-400">Loading employees…</p>
                </div>
              )}

              {/* Fetch error */}
              {fetchError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{fetchError}</p>
                </div>
              )}

              {/* Pangkat Assignment */}
              {!fetchLoading && !fetchError && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Pangkat Member Assignment
                  </p>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {SLOTS.map(({ position, sublabel }, idx) => {
                      const options = optionsFor(position);
                      const currentValue = selected[idx];

                      return (
                        <div
                          key={position}
                          className="flex items-center justify-between px-4 py-3 gap-4"
                        >
                          <div className="w-1/3 shrink-0">
                            <p className="text-sm font-medium text-gray-800">
                              {position}
                            </p>
                            <p className="text-xs text-gray-500">{sublabel}</p>
                          </div>
                          <div className="w-2/3">
                            <select
                              value={currentValue}
                              onChange={(e) =>
                                updateSelected(
                                  idx,
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                                )
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              style={
                                currentValue === "" ? { color: "#9ca3af" } : {}
                              }
                            >
                              <option
                                value=""
                                disabled
                                style={{ color: "#9ca3af" }}
                              >
                                Select {position}
                              </option>
                              {options.map((emp) => (
                                <option
                                  key={emp.id}
                                  value={emp.id}
                                  style={{ color: "#111827" }}
                                >
                                  {emp.name} • {emp.position}
                                </option>
                              ))}
                              {options.length === 0 && (
                                <option disabled style={{ color: "#9ca3af" }}>
                                  No {position} available
                                </option>
                              )}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Validation / submit error */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <p className="text-xs text-gray-400 font-medium">
                3 unique members required
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-md text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button autoFocus
                  onClick={handleSubmit}
                  disabled={
                    isLoading || !allFilled || fetchLoading || !!fetchError
                  }
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {isLoading && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Escalate to Lupon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal ── */}
      <ActionModal
        isOpen={showSuccess}
        onClose={onCancel}
        title="Escalation Successful"
        type="success"
      >
        <p>
          <span className="font-medium text-gray-700">{blotterNumber}</span> has
          been successfully referred to the Lupong Tagapamayapa.
        </p>
        <p className="mt-1">
          The assigned Pangkat members have been recorded and will proceed with
          formal conciliation.
        </p>
      </ActionModal>
    </>
  );
}
