import React from "react";
import { FileText } from "lucide-react";

export function CircleLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const className =
    size === "sm"
      ? "w-5 h-5 border-2"
      : size === "lg"
        ? "w-10 h-10 border-[3px]"
        : "w-8 h-8 border-2";

  return (
    <span
      className={`${className} inline-block rounded-full border-slate-300 border-t-slate-600 animate-spin`}
      aria-label="Loading"
    />
  );
}

export function CenteredLoader({
  minHeight = "min-h-[180px]",
}: {
  minHeight?: string;
}) {
  return (
    <div className={`${minHeight} flex items-center justify-center`}>
      <CircleLoader />
    </div>
  );
}

export function NoRecords({ text = "No records" }: { text?: string }) {
  return (
    <div className="py-10 flex flex-col items-center justify-center gap-2 text-center">
      <FileText className="w-6 h-6 text-slate-300" />
      <p className="text-xs text-slate-400 italic">{text}</p>
    </div>
  );
}
