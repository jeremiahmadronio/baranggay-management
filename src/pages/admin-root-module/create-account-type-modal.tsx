import { Shield, Users } from "lucide-react";

interface CreateAccountTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAdmin: () => void;
  onSelectUser: () => void;
}

export function CreateAccountTypeModal({
  isOpen,
  onClose,
  onSelectAdmin,
  onSelectUser,
}: CreateAccountTypeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
            <p className="text-gray-600 mt-2">
              What type of account would you like to create?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Admin Account Option */}
            <button
              onClick={() => {
                onSelectAdmin();
                onClose();
              }}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Admin Account</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Elevated privileges with access across multiple departments.
                    All actions are audited.
                  </p>
                </div>
              </div>
            </button>

            {/* User Account Option */}
            <button
              onClick={() => {
                onSelectUser();
                onClose();
              }}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">User Account</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Staff / focal person with department-level access and
                    specific permissions.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
