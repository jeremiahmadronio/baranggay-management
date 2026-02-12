interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: 'success' | 'danger' | 'info'; 
  children: React.ReactNode; 
}

export const ActionModal = ({ isOpen, onClose, title, type = 'info', children }: ModalProps) => {
  if (!isOpen) return null;

  const headerColor = type === 'danger' ? 'text-red-600' : type === 'success' ? 'text-green-600' : 'text-blue-600';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className={`text-xl font-bold mb-4 ${headerColor}`}>{title}</h2>
        <div className="mb-6 text-gray-600">{children}</div>
        <button 
          onClick={onClose}
          className="w-full py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};