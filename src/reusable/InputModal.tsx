import { useState, useEffect } from 'react';

// Single input modal (legacy support)
interface InputModalProps {
  isOpen: boolean;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  title: string;
  label: string;
  placeholder?: string;
  submitText?: string;
  cancelText?: string;
  inputType?: 'text' | 'email' | 'number' | 'textarea';
  required?: boolean;
}

export const InputModal = ({
  isOpen,
  onSubmit,
  onCancel,
  title,
  label,
  placeholder = '',
  submitText = 'Submit',
  cancelText = 'Cancel',
  inputType = 'text',
  required = true
}: InputModalProps) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (required && !value.trim()) {
      setError('This field is required');
      return;
    }
    onSubmit(value);
    setValue('');
    setError('');
  };

  const handleCancel = () => {
    setValue('');
    setError('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
          {inputType === 'textarea' ? (
            <textarea
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
            />
          ) : (
            <input
              type={inputType}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// INPUT GROUP MODAL - Multiple fields support
// ============================================

type FieldType = 'text' | 'email' | 'number' | 'tel' | 'date' | 'textarea' | 'select';

interface SelectOption {
  value: string;
  label: string;
}

export interface InputField {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[]; // For select type
  defaultValue?: string;
  width?: 'full' | 'half'; // Layout control
}

interface InputGroupModalProps {
  isOpen: boolean;
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
  title: string;
  fields: InputField[];
  submitText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  initialValues?: Record<string, string>; // For edit mode
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl'
};

export const InputGroupModal = ({
  isOpen,
  onSubmit,
  onCancel,
  title,
  fields,
  submitText = 'Submit',
  cancelText = 'Cancel',
  size = 'lg',
  initialValues = {}
}: InputGroupModalProps) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize values when modal opens (prioritize initialValues over defaultValue)
  useEffect(() => {
    if (isOpen) {
      const initValues: Record<string, string> = {};
      fields.forEach(field => {
        initValues[field.key] = initialValues[field.key] ?? field.defaultValue ?? '';
      });
      setValues(initValues);
      setErrors({});
    }
  }, [isOpen, fields, initialValues]);

  if (!isOpen) return null;

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.required && !values[field.key]?.trim()) {
        newErrors[field.key] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(values);
    setValues({});
    setErrors({});
  };

  const handleCancel = () => {
    setValues({});
    setErrors({});
    onCancel();
  };

  const renderField = (field: InputField) => {
    const commonClasses = "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    const value = values[field.key] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={`${commonClasses} resize-none h-20`}
          />
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            className={`${commonClasses} bg-white`}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type={field.type || 'text'}
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        </div>

        {/* Body - Scrollable */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="flex flex-wrap gap-4">
            {fields.map((field) => (
              <div 
                key={field.key} 
                className={field.width === 'half' ? 'w-[calc(50%-0.5rem)]' : 'w-full'}
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-rose-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {errors[field.key] && (
                  <p className="mt-1 text-xs text-rose-600">{errors[field.key]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            {submitText}
          </button>
        </div>
      </div>
    </div>
  );
};
