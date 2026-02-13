interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: 'success' | 'danger' | 'info'; 
  children: React.ReactNode; 
}

export const ActionModal = ({ isOpen, onClose, title, type = 'info', children }: ModalProps) => {
  if (!isOpen) return null;

  const config = {
    success: {
      iconBg: 'bg-green-500',
      buttonStyle: 'border-2 border-green-500 text-green-600 hover:bg-green-50',
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    danger: {
      iconBg: 'bg-red-500',
      buttonStyle: 'border-2 border-red-500 text-red-600 hover:bg-red-50',
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    info: {
      iconBg: 'bg-blue-500',
      buttonStyle: 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50',
      icon: (
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const { iconBg, buttonStyle, icon } = config[type];

  return (
    <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm py-8 px-6 text-center">
        {/* Icon Circle */}
        <div className={`w-20 h-20 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-5`}>
          {icon}
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
        
        {/* Message */}
        <div className="text-gray-500 text-sm mb-6">{children}</div>
        
        {/* Button */}
        <button 
          onClick={onClose}
          className={`w-full py-2.5 font-medium rounded transition-colors ${buttonStyle}`}
        >
          OK
        </button>
      </div>
    </div>
  );
};