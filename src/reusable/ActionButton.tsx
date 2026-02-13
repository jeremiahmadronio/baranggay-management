type ActionType = 'view' | 'edit' | 'delete' | 'copy' | 'export' | 'share' | 'message' | 'archive' | 'approve' | 'reject' | 'print' | 'download';

interface ActionButtonProps {
  type: ActionType;
  onClick: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const actionLabels: Record<ActionType, string> = {
  view: 'View',
  edit: 'Edit',
  delete: 'Delete',
  copy: 'Copy',
  export: 'Export',
  share: 'Share',
  message: 'Message',
  archive: 'Archive',
  approve: 'Approve',
  reject: 'Reject',
  print: 'Print',
  download: 'Download'
};

// Icon size per button size
const iconSizeConfig = {
  sm: 'w-4 h-4',
  md: 'w-[18px] h-[18px]',
  lg: 'w-5 h-5'
};

// Get icon component by action type
const getActionIcon = (type: ActionType, sizeClass: string) => {
  const icons: Record<ActionType, React.ReactNode> = {
    view: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    edit: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    delete: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    copy: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    export: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    share: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    message: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    archive: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    approve: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    reject: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    print: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
    ),
    download: (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    )
  };
  return icons[type];
};

const paddingConfig = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5'
};

// Color config for each action type
const actionColors: Record<ActionType, { base: string; hover: string; hoverBg: string }> = {
  view: { base: 'text-slate-600', hover: 'hover:text-blue-600', hoverBg: 'hover:bg-blue-50' },
  edit: { base: 'text-slate-600', hover: 'hover:text-amber-600', hoverBg: 'hover:bg-amber-50' },
  delete: { base: 'text-slate-600', hover: 'hover:text-rose-600', hoverBg: 'hover:bg-rose-50' },
  copy: { base: 'text-slate-600', hover: 'hover:text-blue-600', hoverBg: 'hover:bg-blue-50' },
  export: { base: 'text-slate-600', hover: 'hover:text-emerald-600', hoverBg: 'hover:bg-emerald-50' },
  share: { base: 'text-slate-600', hover: 'hover:text-violet-600', hoverBg: 'hover:bg-violet-50' },
  message: { base: 'text-slate-600', hover: 'hover:text-blue-600', hoverBg: 'hover:bg-blue-50' },
  archive: { base: 'text-slate-600', hover: 'hover:text-slate-700', hoverBg: 'hover:bg-slate-100' },
  approve: { base: 'text-slate-600', hover: 'hover:text-emerald-600', hoverBg: 'hover:bg-emerald-50' },
  reject: { base: 'text-slate-600', hover: 'hover:text-rose-600', hoverBg: 'hover:bg-rose-50' },
  print: { base: 'text-slate-600', hover: 'hover:text-slate-700', hoverBg: 'hover:bg-slate-100' },
  download: { base: 'text-slate-600', hover: 'hover:text-blue-600', hoverBg: 'hover:bg-blue-50' }
};

export const ActionButton = ({ 
  type, 
  onClick, 
  label,
  size = 'md',
  disabled = false
}: ActionButtonProps) => {
  const colors = actionColors[type];
  const iconSize = iconSizeConfig[size];
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={label || actionLabels[type]}
      className={`
        ${colors.base} ${colors.hover} ${colors.hoverBg}
        rounded-md transition-all duration-150
        ${paddingConfig[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {getActionIcon(type, iconSize)}
    </button>
  );
};

// Group component for multiple action buttons
interface ActionButtonGroupProps {
  children: React.ReactNode;
}

export const ActionButtonGroup = ({ children }: ActionButtonGroupProps) => {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {children}
    </div>
  );
};
