  import { LockIcon } from "lucide-react";

interface PermissionDeniedPageProps {
  message?: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PermissionDeniedPage({
  message = "You do not have permission to access this section.",
  hint = "Contact your supervisor to unlock this feature.",
  actionLabel,
  onAction,
}: PermissionDeniedPageProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto w-full max-w-[330px] mb-6">
          <svg
            viewBox="0 0 360 240"
            role="img"
            aria-label="Access denied illustration"
            className="w-full h-auto"
          >
            <ellipse cx="180" cy="212" rx="126" ry="10" fill="#D9D9E3" />

            <rect
              x="118"
              y="30"
              width="156"
              height="112"
              rx="10"
              fill="#F3F4F6"
              stroke="#A1A1AA"
              strokeWidth="2"
            />
            <circle cx="132" cy="42" r="2" fill="#52525B" />
            <circle cx="140" cy="42" r="2" fill="#52525B" />
            <circle cx="148" cy="42" r="2" fill="#52525B" />
            <rect x="263" y="40" width="8" height="6" rx="1" fill="#A1A1AA" />

            <rect
              x="176"
              y="144"
              width="40"
              height="20"
              rx="4"
              fill="#E5E7EB"
            />
            <rect x="154" y="164" width="86" height="8" rx="4" fill="#D4D4D8" />

            <rect x="177" y="76" width="38" height="30" rx="7" fill="#27272A" />
            <path
              d="M186 76v-7a10 10 0 0 1 20 0v7"
              fill="none"
              stroke="#27272A"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="196" cy="91" r="3" fill="#F4F4F5" />
            <rect
              x="194.5"
              y="93"
              width="3"
              height="8"
              rx="1.5"
              fill="#F4F4F5"
            />

            <circle cx="84" cy="123" r="22" fill="#E5E7EB" />
            <path
              d="M64 180c6-20 18-30 35-30 16 0 29 10 34 30"
              fill="#1E1B4B"
            />
            <circle cx="99" cy="124" r="9" fill="#F8FAFC" />
            <circle cx="99" cy="124" r="4" fill="#1E3A8A" />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-slate-800">
          Access denied!
        </h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <p className="mt-1 text-xs text-slate-400">{hint}</p>

        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <LockIcon className="w-4 h-4" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
