import {
type  InputHTMLAttributes,
type  SelectHTMLAttributes,
type TextareaHTMLAttributes,
 type ReactNode,
  type ChangeEvent,
} from "react";
export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  id?: string;
  placeholder?: string;
}
export interface FormSelectOption {
  value: string;
  label: string;
}
export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  options: FormSelectOption[];
  placeholder?: string;
  error?: string;
  className?: string;
  value?: string;
}
interface FormDatePickerProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
}
interface FormTimePickerProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
}
interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}
interface SectionCardProps {
  letter: string;
  title: string;
  children: ReactNode;
  notice?: string;
}
interface FormRowProps {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}
interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  title: string;
  description?: string;
}
interface DocketInfoField {
  label: string;
  value: string;
  hint?: string;
}
interface DocketInfoCardProps {
  fields: DocketInfoField[];
}
interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  mode?: "record" | "formal";
}
interface SectionDividerProps {
  label: string;
}
interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}
export const FormInput = ({
  label,
  required,
  hint,
  error,
  className = "",
  ...props
}: FormInputProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      {...props}
      className={`w-full rounded-md border ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    />
    {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);
export const FormSelect = ({
  label,
  required,
  options,
  placeholder = "Select...",
  error,
  className = "",
  ...props
}: FormSelectProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <select
      {...props}
      className={`w-full rounded-md border ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);
export const FormDatePicker = ({
  label,
  required,
  error,
  className = "",
  ...props
}: FormDatePickerProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type="date"
      required={required}
      {...props}
      className={`w-full rounded-md border ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    />
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);
export const FormTimePicker = ({
  label,
  required,
  error,
  className = "",
  ...props
}: FormTimePickerProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type="time"
      required={required}
      {...props}
      className={`w-full rounded-md border ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${className}`}
    />
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);
export const FormTextarea = ({
  label,
  required,
  error,
  hint,
  className = "",
  ...props
}: FormTextareaProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <textarea
      {...props}
      className={`w-full rounded-md border ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"} px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none ${className}`}
    />
    {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);
export const SectionCard = ({
  letter,
  title,
  children,
  notice,
}: SectionCardProps) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
      <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
        {letter}
      </span>
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
        {title}
      </h2>
    </div>
    <div className="p-6 flex flex-col gap-4">
      {notice && (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-md px-4 py-3 text-sm text-blue-700">
          <svg
            className="mt-0.5 shrink-0"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="8.01" />
            <line x1="12" y1="12" x2="12" y2="16" />
          </svg>
          <span>{notice}</span>
        </div>
      )}
      {children}
    </div>
  </div>
);
const colsMap = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};
export const FormRow = ({ children, cols = 2 }: FormRowProps) => (
  <div className={`grid ${colsMap[cols]} gap-4`}>{children}</div>
);
export const RadioCard = ({
  name,
  value,
  checked,
  onChange,
  title,
  description,
}: RadioCardProps) => (
  <label
    className={`flex items-start gap-3 rounded-xl border-2 px-5 py-4 cursor-pointer transition-all ${checked ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
  >
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="mt-0.5 accent-blue-600"
    />
    <div>
      <p
        className={`text-sm font-semibold ${checked ? "text-blue-700" : "text-gray-700"}`}
      >
        {title}
      </p>
      {description && (
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      )}
    </div>
  </label>
);
export const DocketInfoCard = ({ fields }: DocketInfoCardProps) => (
  <div
    className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 grid gap-4"
    style={{
      gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr))`,
    }}
  >
    {fields.map((f) => (
      <div key={f.label}>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
          {f.label}
        </p>
        <p className="text-sm font-semibold text-gray-800">{f.value}</p>
        {f.hint && <p className="text-xs text-gray-400">{f.hint}</p>}
      </div>
    ))}
  </div>
);
export const FormActions = ({
  onCancel,
  onSubmit,
  submitLabel = "Save & Record Entry",
  isSubmitting = false,
  mode = "record",
}: FormActionsProps) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-4 flex items-center justify-between">
    <p className="text-xs text-gray-400">
      Fields marked with <span className="text-red-500 font-semibold">*</span>{" "}
      are required.
    </p>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className={`flex items-center gap-2 text-sm font-semibold text-white disabled:opacity-60 px-5 py-2.5 rounded-lg transition-all shadow-sm ${mode === "formal" ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-900"}`}
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Saving...
          </>
        ) : (
          <>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {submitLabel}
          </>
        )}
      </button>
    </div>
  </div>
);
export const SectionDivider = ({ label }: SectionDividerProps) => (
  <div className="flex items-center gap-3 mt-1">
    <div className="h-px flex-1 bg-gray-100" />
    <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">
      {label}
    </span>
    <div className="h-px flex-1 bg-gray-100" />
  </div>
);
export const ConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
}: ConfirmModalProps) => {
  if (!isOpen) return null;
  const config = {
    danger: {
      iconBg: "bg-red-500",
      confirmBtn: "border-2 border-red-500 text-red-500 hover:bg-red-50",
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
            strokeWidth={2.5}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
    },
    warning: {
      iconBg: "bg-yellow-500",
      confirmBtn:
        "border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50",
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
            strokeWidth={2.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    info: {
      iconBg: "bg-blue-500",
      confirmBtn: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50",
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
            strokeWidth={2.5}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };
  const { iconBg, confirmBtn, icon } = config[type];
  return (
    <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm py-8 px-6 text-center">
        <div
          className={`w-20 h-20 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-5`}
        >
          {icon}
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 font-medium rounded border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 font-medium rounded transition-colors ${confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
