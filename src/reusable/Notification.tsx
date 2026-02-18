import { useState, type ReactNode,  } from "react";

type BannerVariant = "info" | "warning" | "success" | "error";

interface NoticeBannerProps {
  title?: string;
  message: ReactNode;
  variant?: BannerVariant;
  dismissible?: boolean;
  icon?: ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const variantStyles: Record<
  BannerVariant,
  { wrapper: string; icon: string; title: string; text: string; close: string }
> = {
  info: {
    wrapper: "bg-blue-50 border border-blue-200 text-blue-900",
    icon: "text-blue-500",
    title: "text-blue-800",
    text: "text-blue-700",
    close: "text-blue-400 hover:text-blue-600 hover:bg-blue-100",
  },
  warning: {
    wrapper: "bg-amber-50 border border-amber-200 text-amber-900",
    icon: "text-amber-500",
    title: "text-amber-800",
    text: "text-amber-700",
    close: "text-amber-400 hover:text-amber-600 hover:bg-amber-100",
  },
  success: {
    wrapper: "bg-green-50 border border-green-200 text-green-900",
    icon: "text-green-500",
    title: "text-green-800",
    text: "text-green-700",
    close: "text-green-400 hover:text-green-600 hover:bg-green-100",
  },
  error: {
    wrapper: "bg-red-50 border border-red-200 text-red-900",
    icon: "text-red-500",
    title: "text-red-800",
    text: "text-red-700",
    close: "text-red-400 hover:text-red-600 hover:bg-red-100",
  },
};

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="8.01" />
    <line x1="12" y1="12" x2="12" y2="16" />
  </svg>
);

const WarningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const SuccessIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const defaultIcons: Record<BannerVariant, ReactNode> = {
  info: <InfoIcon />,
  warning: <WarningIcon />,
  success: <SuccessIcon />,
  error: <ErrorIcon />,
};

export const NoticeBanner = ({
  title = "Privacy Notice:",
  message,
  variant = "info",
  dismissible = true,
  icon,
  className = "",
  onDismiss,
}: NoticeBannerProps) => {
  const [visible, setVisible] = useState(true);
  const styles = variantStyles[variant];

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-md px-4 py-3 text-sm ${styles.wrapper} ${className}`}
      role="alert"
    >
      {/* Icon + Content */}
      <div className="flex items-start gap-2">
        <span className={`mt-0.5 shrink-0 ${styles.icon}`}>
          {icon ?? defaultIcons[variant]}
        </span>
        <p className={styles.text}>
          {title && (
            <span className={`font-semibold ${styles.title}`}>{title} </span>
          )}
          {message}
        </p>
      </div>

      {/* Close Button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notice"
          className={`ml-2 shrink-0 rounded p-0.5 transition-colors ${styles.close}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 p-8">
      <div className="w-full max-w-2xl flex flex-col gap-3">
        {/* Default usage — blue (matches your request) */}
        <NoticeBanner
          title="Privacy Notice:"
          message="In compliance with RA 9262 (Anti-VAWC Act) and the Data Privacy Act of 2012, all records display victim initials only. Full details are accessible only to authorized personnel."
          variant="info"
        />

        {/* Warning variant */}
        <NoticeBanner
          title="Warning:"
          message="Your session will expire in 5 minutes. Please save your work."
          variant="warning"
        />

        {/* Success variant */}
        <NoticeBanner
          title="Success:"
          message="Record has been submitted and is pending review."
          variant="success"
        />

        {/* Error variant */}
        <NoticeBanner
          title="Error:"
          message="You do not have permission to access this record."
          variant="error"
        />

        {/* Non-dismissible */}
        <NoticeBanner
          title="Note:"
          message="This is a non-dismissible notice with no close button."
          variant="info"
          dismissible={false}
        />
      </div>
    </div>
  );
}