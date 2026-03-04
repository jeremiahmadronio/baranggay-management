import React from 'react'
import { X } from 'lucide-react'
interface Admin {
  initials: string; name: string; email: string; role: string; department: string; status: string; created: string; lastLogin: string
}
interface ViewUserModalProps { admin: Admin; onClose: () => void }
export function ViewUserModal({ admin, onClose }: ViewUserModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose() }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-lg font-semibold text-gray-900">User Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition" aria-label="Close modal"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold mb-3">{admin.initials}</div>
          <h3 className="text-lg font-semibold text-gray-900">{admin.name}</h3>
          <a href={`mailto:${admin.email}`} className="text-sm text-blue-600 hover:underline">{admin.email}</a>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="flex justify-between items-center py-3"><span className="text-sm text-gray-600">Role</span><span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded">{admin.role}</span></div>
          <div className="flex justify-between items-center py-3"><span className="text-sm text-gray-600">Status</span><span className="flex items-center gap-1.5 text-sm text-green-600"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{admin.status}</span></div>
          <div className="flex justify-between items-center py-3"><span className="text-sm text-gray-600">Department Access</span><span className="text-sm text-gray-900">{admin.department}</span></div>
          <div className="flex justify-between items-center py-3"><span className="text-sm text-gray-600">Created</span><span className="text-sm text-blue-600">{admin.created}</span></div>
          <div className="flex justify-between items-center py-3"><span className="text-sm text-gray-600">Last Login</span><span className="text-sm text-blue-600">{admin.lastLogin}</span></div>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Close</button>
        </div>
      </div>
    </div>
  )
}