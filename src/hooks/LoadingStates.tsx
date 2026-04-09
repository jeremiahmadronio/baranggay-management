import { FileText } from "lucide-react";

export function CircleLoader({
  size = "md",
  tone = "default",
  className: extraClassName = "",
}: {
  size?: "sm" | "md" | "lg";
  tone?: "default" | "light";
  className?: string;
}) {
  const sizeClass =
    size === "sm"
      ? "w-5 h-5 border-2"
      : size === "lg"
        ? "w-10 h-10 border-[3px]"
        : "w-8 h-8 border-2";

  const toneClass =
    tone === "light"
      ? "border-white/40 border-t-white"
      : "border-slate-300 border-t-slate-600";

  return (
    <span
      className={`${sizeClass} inline-block rounded-full ${toneClass} animate-spin ${extraClassName}`}
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
