import React from 'react';
type FieldWidth = 'full' | 'half' | 'third';

interface ViewField {
  key: string;
  label: string;
  value: React.ReactNode;
  width?: FieldWidth;
}

interface ViewSection {
  title?: string;
  fields: ViewField[];
}

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  sections: ViewSection[];
  size?: 'md' | 'lg' | 'xl' | '2xl';
  onEdit?: () => void;
  editText?: string;
  closeText?: string;
  avatar?: {
    name: string;
    src?: string;
  };
}

const sizeClasses = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl'
};

const widthClasses: Record<FieldWidth, string> = {
  full: 'col-span-2',
  half: 'col-span-1',
  third: 'col-span-1'
};

export const ViewModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  sections,
  size = 'lg',
  onEdit,
  editText = 'Edit',
  closeText = 'Close',
  avatar
}: ViewModalProps) => {
  if (!isOpen) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {avatar && (
                <div className="flex-shrink-0">
                  {avatar.src ? (
                    <img
                      src={avatar.src}
                      alt={avatar.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-semibold text-base flex items-center justify-center">
                      {getInitials(avatar.name)}
                    </div>
                  )}
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.title && (
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <span>{section.title}</span>
                    <span className="flex-1 h-px bg-gray-200"></span>
                  </h3>
                )}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {section.fields.map((field) => (
                    <div key={field.key} className={widthClasses[field.width || 'half']}>
                      <dt className="text-sm text-gray-500 mb-1">{field.label}</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {field.value || <span className="text-gray-400">—</span>}
                      </dd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            {closeText}
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              {editText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const avatarSizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
};

export const Avatar = ({ src, name, size = 'md' }: AvatarProps) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${avatarSizes[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`${avatarSizes[size]} rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center`}>
      {initials}
    </div>
  );
};

// ============================================
// DETAIL CARD - For inline viewing (non-modal)
// ============================================

interface DetailCardProps {
  title: string;
  subtitle?: string;
  sections: ViewSection[];
  actions?: React.ReactNode;
}

export const DetailCard = ({
  title,
  subtitle,
  sections,
  actions
}: DetailCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <span>{section.title}</span>
                <span className="flex-1 h-px bg-gray-200"></span>
              </h3>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {section.fields.map((field) => (
                <div key={field.key} className={widthClasses[field.width || 'half']}>
                  <dt className="text-sm text-gray-500 mb-1">{field.label}</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {field.value || <span className="text-gray-400">—</span>}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Legacy exports for backward compatibility
export const DetailModal = ViewModal;
export type DetailField = ViewField;
export type DetailSection = ViewSection;
