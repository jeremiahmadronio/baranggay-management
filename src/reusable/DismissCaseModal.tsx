import { useState } from "react";
import { FileOutputIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reasonBase64: string) => void | Promise<void>;
  dismissedBy: string;
}

export function DismissCaseModal({
  isOpen,
  onClose,
  onSubmit,
  dismissedBy,
}: Props) {
  const [fileName, setFileName] = useState("");
  const [base64Data, setBase64Data] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const todayDate = new Date().toISOString().split("T")[0];

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!base64Data) {
      setError("Narrative file is required.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await onSubmit(base64Data);
    } catch (err: any) {
      setError(err.message || "Failed to dismiss case.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Dismiss Case</h3>
          <p className="mt-1 text-sm text-gray-500">Provide the narrative file for dismissing this case.</p>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dismissed By</label>
              <input
                type="text"
                disabled
                value={dismissedBy}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                disabled
                value={todayDate}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Narrative File (Image/Docs) <span className="text-red-500">*</span></label>
            {!(fileName && base64Data) && (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileOutputIcon className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF, or DOCX (Max 10MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".png,.jpg,.jpeg,.pdf,.docx,.doc"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          setError('File is too large. Maximum size is 10MB.');
                          return;
                        }
                        setFileName(file.name);
                        const reader = new FileReader();
                        reader.onload = () => {
                          const base64 = (reader.result as string).split(',')[1];
                          setBase64Data(base64);
                          setError("");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            )}
            {fileName && base64Data && (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="font-medium truncate max-w-[300px]">{fileName}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setFileName(''); setBase64Data(''); }} 
                  className="text-emerald-600 hover:text-emerald-800"
                >
                  <XCircleIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Dismissing..." : "Confirm Dismissal"}
          </button>
        </div>
      </div>
    </div>
  );
}
