

import React, { useState, useEffect } from "react";
import {
  Eye, EyeOff, Save, ShieldCheck, Loader2,
  CheckCircle2, AlertCircle, type LucideIcon,
} from "lucide-react";
import { PasswordStrengthIndicator } from "./../admin-root-module/PasswordStrengthIndicator";

// ─── Public types ─────────────────────────────────────────────────────────────

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "password"
  | "confirmPassword";

export interface SettingsFieldConfig {
  key:           string;
  label:         string;
  type:          FieldType;
  placeholder?:  string;
  required?:     boolean;
  hint?:         string;
  icon?:         React.ReactNode;
  readOnly?:     boolean;
  confirmOf?:    string;
}

export interface SettingsSectionConfig {
  title:     string;
  subtitle?: string;
  icon:      LucideIcon;
  fields:    SettingsFieldConfig[];
}

export interface ReusableSettingsProps<T extends Record<string, string>> {
  loadData:    () => Promise<T>;
  saveData:    (values: T) => Promise<string | void>;
  sections:    SettingsSectionConfig[];
  omitOnSave?: string[];
  avatarKeys?: [string, string];
  nameKeys?:   [string, string];
  roleLabel?:  string;
  columns?:    1 | 2 | 3;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const isPasswordStrong = (p: string) =>
  p.length >= 8 &&
  /[A-Z]/.test(p) &&
  /[a-z]/.test(p) &&
  /[0-9]/.test(p) &&
  /[^A-Za-z0-9]/.test(p);

type ToastType = "success" | "error";

// ─── Primitive UI pieces ──────────────────────────────────────────────────────

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div 
    className={`animate-pulse rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 ${className}`}
  />
);

const Toast = ({ type, message }: { type: ToastType; message: string }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5
      rounded-xl shadow-xl border backdrop-blur-sm text-sm font-semibold
      transition-all duration-300 animate-in slide-in-from-bottom-5
      ${type === "success" 
        ? "border-emerald-200/60 bg-white text-emerald-900" 
        : "border-rose-200/60 bg-white text-rose-900"
      }`}
  >
    {type === "success"
      ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
      : <AlertCircle  className="w-5 h-5 text-rose-500 shrink-0" />}
    <span>{message}</span>
  </div>
);

const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) => (
  <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3.5 bg-gradient-to-r from-slate-50 to-transparent">
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center shrink-0">
      <Icon className="w-4.5 h-4.5 text-blue-600" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-bold text-slate-900 tracking-tight">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1 font-normal">{subtitle}</p>}
    </div>
  </div>
);

const FieldLabel = ({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) => (
  <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-2.5">
    {label}
    {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
  </label>
);

// Enhanced input shell with better visual feedback
const InputShell = ({
  state = "default",
  disabled,
  children,
}: {
  state?: "default" | "error" | "success";
  disabled?: boolean;
  children: React.ReactNode;
}) => {
  const borderCls = disabled
    ? "border-slate-150 bg-slate-50/60 cursor-not-allowed"
    : {
        default: "border-slate-200 hover:border-slate-300 focus-within:border-blue-400 focus-within:shadow-md focus-within:shadow-blue-500/10 focus-within:ring-2 focus-within:ring-blue-500/20",
        error:   "border-rose-300 hover:border-rose-400 focus-within:border-rose-500 focus-within:shadow-md focus-within:shadow-rose-500/10 focus-within:ring-2 focus-within:ring-rose-500/20",
        success: "border-emerald-300 hover:border-emerald-400 focus-within:border-emerald-500 focus-within:shadow-md focus-within:shadow-emerald-500/10 focus-within:ring-2 focus-within:ring-emerald-500/20",
      }[state];

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border bg-white
        transition-all duration-200 ${borderCls}`}
    >
      {children}
    </div>
  );
};

// ─── Field renderer ───────────────────────────────────────────────────────────

function SettingsField({
  cfg,
  value,
  allValues,
  onChange,
}: {
  cfg:       SettingsFieldConfig;
  value:     string;
  allValues: Record<string, string>;
  onChange:  (key: string, val: string) => void;
}) {
  const [showPw, setShowPw] = useState(false);

  const isPassword        = cfg.type === "password";
  const isConfirmPassword = cfg.type === "confirmPassword";
  const pwKey             = cfg.confirmOf ?? "password";
  const passwordValue     = allValues[pwKey] ?? "";
  const disabled          = cfg.readOnly || (isConfirmPassword && !passwordValue);

  // Validation state
  let state: "default" | "error" | "success" = "default";
  if (isPassword && value && !isPasswordStrong(value))  state = "error";
  if (isConfirmPassword && value) {
    state = value === passwordValue ? "success" : "error";
  }

  const inputType =
    isPassword || isConfirmPassword
      ? showPw ? "text" : "password"
      : cfg.type;

  return (
    <div className="space-y-2">
      <FieldLabel label={cfg.label} required={cfg.required} />

      <InputShell state={state} disabled={disabled}>
        {cfg.icon && (
          <span className="text-slate-400 shrink-0 flex-shrink-0">{cfg.icon}</span>
        )}
        <input
          type={inputType}
          value={value}
          placeholder={cfg.placeholder}
          required={cfg.required}
          disabled={disabled}
          onChange={(e) => onChange(cfg.key, e.target.value)}
          className="flex-1 text-sm text-slate-800 placeholder-slate-400
            outline-none bg-transparent disabled:cursor-not-allowed disabled:text-slate-500
            transition-colors"
        />
        {(isPassword || isConfirmPassword) && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowPw((p) => !p)}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40 shrink-0 p-1 hover:bg-slate-100/50 rounded-md"
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </InputShell>

      {/* Password strength indicator */}
      {isPassword && value && (
        <div className="pt-1">
          <PasswordStrengthIndicator password={value} />
        </div>
      )}

      {/* Confirm password feedback */}
      {isConfirmPassword && value && (
        state === "error"
          ? <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Passwords do not match
            </p>
          : <p className="text-xs text-emerald-600 flex items-center gap-1.5 mt-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Passwords match
            </p>
      )}

      {cfg.hint && (
        <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{cfg.hint}</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReusableSettings<T extends Record<string, string>>({
  loadData,
  saveData,
  sections,
  omitOnSave   = ["confirmPassword"],
  avatarKeys   = ["firstName", "lastName"],
  nameKeys     = ["firstName", "lastName"],
  roleLabel,
  columns      = 2,
}: ReusableSettingsProps<T>) {
  const [form,     setForm]    = useState<Record<string, string>>({});
  const [original, setOrig]    = useState<Record<string, string>>({});
  const [loading,  setLoading] = useState(true);
  const [saving,   setSaving]  = useState(false);
  const [toast,    setToast]   = useState<{ type: ToastType; message: string } | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData()
      .then((data) => {
        const flat = data as Record<string, string>;
        setOrig(flat);
        setForm({ ...flat, password: "", confirmPassword: "" });
      })
      .catch(() => fireToast("error", "Failed to load settings."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fireToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Change ───────────────────────────────────────────────────────────────
  const handleChange = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // ── Dirty check ──────────────────────────────────────────────────────────
  const hasChanges = Object.keys(original).some((k) => form[k] !== original[k])
    || (form["password"]?.length ?? 0) > 0;

  // ── Validation ───────────────────────────────────────────────────────────
  const allPasswordFields = sections
    .flatMap((s) => s.fields)
    .filter((f) => f.type === "password");

  const allConfirmFields = sections
    .flatMap((s) => s.fields)
    .filter((f) => f.type === "confirmPassword");

  const pwsValid = allPasswordFields.every(
    (f) => !form[f.key] || isPasswordStrong(form[f.key])
  );

  const confirmsMatch = allConfirmFields.every((f) => {
    const pwKey = f.confirmOf ?? "password";
    return !form[f.key] || form[f.key] === form[pwKey];
  });

  const canSave = hasChanges && pwsValid && confirmsMatch && !saving;

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([k]) => !omitOnSave.includes(k))
      ) as T;

      await saveData(payload);

      // Update original (exclude password fields)
      const nextOrig = { ...form };
      allPasswordFields.forEach((f) => delete nextOrig[f.key]);
      allConfirmFields.forEach((f)  => delete nextOrig[f.key]);
      setOrig(nextOrig);

      // Reset password fields
      const reset: Record<string, string> = {};
      allPasswordFields.forEach((f) => { reset[f.key] = ""; });
      allConfirmFields.forEach((f)  => { reset[f.key] = ""; });
      setForm((prev) => ({ ...prev, ...reset }));

      fireToast("success", "Settings saved successfully.");
    } catch (err: unknown) {
      fireToast("error", err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel ───────────────────────────────────────────────────────────────
  const handleCancel = () => {
    const reset: Record<string, string> = {};
    allPasswordFields.forEach((f) => { reset[f.key] = ""; });
    allConfirmFields.forEach((f)  => { reset[f.key] = ""; });
    setForm({ ...original, ...reset });
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 p-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className={`grid grid-cols-1 ${columns === 2 ? "lg:grid-cols-2" : columns === 3 ? "lg:grid-cols-3" : ""} gap-6`}>
          {sections.map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const initials =
    (form[avatarKeys[0]]?.[0] ?? "").toUpperCase() +
    (form[avatarKeys[1]]?.[0] ?? "").toUpperCase();

  const displayName =
    `${form[nameKeys[0]] ?? ""} ${form[nameKeys[1]] ?? ""}`.trim();

  const colClass = {
    1: "",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
  }[columns];

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSave} className="space-y-6">

          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow duration-300 px-6 py-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg ring-2 ring-blue-400/20">
              {initials || <ShieldCheck className="w-7 h-7" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-slate-900 truncate">{displayName}</p>
              {roleLabel && (
                <p className="text-sm text-slate-500 mt-1.5 font-medium">{roleLabel}</p>
              )}
            </div>
            {hasChanges && (
              <div className="shrink-0 inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-300/50 rounded-full px-4 py-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                Unsaved changes
              </div>
            )}
          </div>

              <div className={`grid grid-cols-1 ${colClass} gap-6 items-start`}>
            {sections.map((section) => (
              <div
                key={section.title}
                className="bg-white rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <SectionHeader
                  icon={section.icon}
                  title={section.title}
                  subtitle={section.subtitle}
                />
                <div className="p-6 space-y-5">
                  {section.fields.map((field) => (
                    <SettingsField
                      key={field.key}
                      cfg={field}
                      value={form[field.key] ?? ""}
                      allValues={form}
                      onChange={handleChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Action Bar ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-6 pb-2 border-t border-slate-200/50">
            <p className="text-sm text-slate-600 font-medium">
              {hasChanges 
                ? " You have unsaved changes" 
                : " No changes to save"}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={!hasChanges || saving}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                  hover:shadow-sm active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSave}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700
                  hover:from-blue-700 hover:to-blue-800 hover:shadow-lg disabled:from-blue-300 disabled:to-blue-400 
                  disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2.5 shadow-md
                  active:scale-95 disabled:shadow-none"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving</>
                  : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>

        </form>

        {toast && <Toast type={toast.type} message={toast.message} />}
      </div>
    </div>
  );
}