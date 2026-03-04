import React, { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
interface Admin {
  initials: string; name: string; email: string; role: string; department: string; status: string; created: string; lastLogin: string
}
interface DeleteUserModalProps { admin: Admin; onClose: () => void }
export function DeleteUserModal({ admin, onClose }: DeleteUserModalProps) {
  const [reason, setReason] = useState('')
  const handleBackdropClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose() }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Delete User Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition" aria-label="Close modal"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-3 mb-6">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          <div>
            <p className="text-sm font-medium text-gray-900">Delete {admin.name}'s account?</p>
            <p className="text-sm text-red-500 mt-1">This action cannot be undone. All of their data will be permanently removed from the system.</p>
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-red-600 mb-1.5">Reason for deleting this account <span className="text-red-500">*</span></label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for deletion..." rows={4} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition">Confirm Delete</button>
        </div>
      </div>
    </div>
  )
}