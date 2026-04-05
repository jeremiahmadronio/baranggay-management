import React from "react";
import { XIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FormModalShellProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  bodyClassName?: string;
}

export function FormModalShell({
  isOpen,
  title,
  onClose,
  children,
  footer,
  maxWidthClass = "max-w-4xl",
  bodyClassName = "",
}: FormModalShellProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white rounded-xl shadow-xl w-full ${maxWidthClass} my-8 flex flex-col max-h-[90vh]`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div
              className={`px-6 py-6 overflow-y-auto flex-1 ${bodyClassName}`}
            >
              {children}
            </div>

            {footer ? (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function FormSectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
      {title}
    </h3>
  );
}

export function FormFieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

export function FormFieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}
