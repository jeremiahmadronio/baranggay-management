import type { ReactNode } from "react";

interface InfoRowProps {
  label: string;
  value?: ReactNode;
}

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-700">{value ?? "—"}</p>
    </div>
  );
}
