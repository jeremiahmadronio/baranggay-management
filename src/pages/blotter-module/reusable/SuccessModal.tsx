import type { ReactNode } from "react";
interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "success" | "danger" | "info";
  children: ReactNode;
}
export const ActionModal = ({
  isOpen,
  onClose,
  title,
  type,
  children,
}: ActionModalProps) => {
  if (!isOpen) return null;
  const config = {
    success: {
      bg: "bg-green-500",
      icon: "✓",
    },
    danger: {
      bg: "bg-red-500",
      icon: "!",
    },
    info: {
      bg: "bg-blue-500",
      icon: "i",
    },
  };
  const { bg, icon } = config[type];
  return (
    <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm py-8 px-6 text-center">
        <div
          className={`w-16 h-16 ${bg} rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          <span className="text-white text-2xl font-bold">{icon}</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <div className="text-gray-600 mb-6">{children}</div>
        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
