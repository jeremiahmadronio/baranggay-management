import { useState } from "react"
import { Pencil, Lock, Trash2, Eye } from "lucide-react"
import CreateAdminModal from "./create-admin-modal"
import { EditUserModal } from "./edit-user-modal"
import { ViewUserModal } from "./view-user-modal"
import { LockUserModal } from "./lock-user-modal"
import { DeleteUserModal } from "./delete-user-modal"
interface Admin {
  initials: string
  name: string
  email: string
  role: string
  department: string
  status: string
  created: string
  lastLogin: string
}
export default function AdminManagement() {
  const [openCreate, setOpenCreate] = useState(false)
  // Modal state for action buttons
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [openEdit, setOpenEdit] = useState(false)
  const [openView, setOpenView] = useState(false)
  const [openLock, setOpenLock] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  // Action handlers
  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin)
    setOpenEdit(true)
  }
  const handleView = (admin: Admin) => {
    setSelectedAdmin(admin)
    setOpenView(true)
  }
  const handleLock = (admin: Admin) => {
    setSelectedAdmin(admin)
    setOpenLock(true)
  }
  const handleDelete = (admin: Admin) => {
    setSelectedAdmin(admin)
    setOpenDelete(true)
  }
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">
              Admin Management
            </h2>
            <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-600">
              Root Admin Only
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage administrator accounts and access control
          </p>
        </div>
        <button
          onClick={() => setOpenCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg shadow"
        >
          + Create Admin Account
        </button>
      </div>
      {/* Elevated Privilege Box */}
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
        <div className="font-semibold">⚠ Elevated Privilege Zone</div>
        <p className="text-sm mt-1">
          This section is only accessible to Root Admins. All actions performed here are logged in the audit trail with high-priority flags.
        </p>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Total Admins</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">3</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-3xl font-bold text-green-600 mt-2">2</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-3xl font-bold text-red-600 mt-2">0</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Locked</p>
          <p className="text-3xl font-bold text-orange-500 mt-2">1</p>
        </div>
      </div>
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {/* Admin Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Profile</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Department Access</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3">Last Login</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[
              {
                initials: "OM",
                name: "Off. Maria Cruz",
                email: "maria.cruz@juanggo.gov.ph",
                role: "Admin",
                department: "All Departments",
                status: "Active",
                created: "2024-12-01",
                lastLogin: "2 mins ago",
              },
            ].map((admin, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    {admin.initials}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{admin.name}</div>
                    <div className="text-xs text-gray-500">{admin.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">{admin.role}</span>
                </td>
                <td className="px-6 py-4 text-gray-600">{admin.department}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded ${admin.status === "Active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                    {admin.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{admin.created}</td>
                <td className="px-6 py-4 text-gray-600">{admin.lastLogin}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-3">
                    <Pencil className="w-4 h-4 text-blue-500 cursor-pointer hover:scale-110 transition" onClick={() => handleEdit(admin)} />
                    <Eye className="w-4 h-4 text-gray-600 cursor-pointer hover:text-blue-600 hover:scale-110 transition" onClick={() => handleView(admin)} />
                    <Lock className="w-4 h-4 text-yellow-500 cursor-pointer hover:scale-110 transition" onClick={() => handleLock(admin)} />
                    <Trash2 className="w-4 h-4 text-red-500 cursor-pointer hover:scale-110 transition" onClick={() => handleDelete(admin)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* ✅ ALL MODALS */}
      {openCreate && <CreateAdminModal onClose={() => setOpenCreate(false)} />}
      {openEdit && selectedAdmin && (
        <EditUserModal admin={selectedAdmin} onClose={() => { setOpenEdit(false); setSelectedAdmin(null) }} />
      )}
      {openView && selectedAdmin && (
        <ViewUserModal admin={selectedAdmin} onClose={() => { setOpenView(false); setSelectedAdmin(null) }} />
      )}
      {openLock && selectedAdmin && (
        <LockUserModal admin={selectedAdmin} onClose={() => { setOpenLock(false); setSelectedAdmin(null) }} />
      )}
      {openDelete && selectedAdmin && (
        <DeleteUserModal admin={selectedAdmin} onClose={() => { setOpenDelete(false); setSelectedAdmin(null) }} />
      )}
    </div>
  )
}