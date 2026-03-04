"use client";

import { useState } from "react";

type Status = "Active" | "Locked" | "Inactive";

interface StaffMember {
  id: number;
  name: string;
  email: string;
  department: string;
  departmentColor: string;
  roleTitle: string;
  status: Status;
  lastActive: string;
}

const initialStaff: StaffMember[] = [
  {
    id: 1,
    name: "Maria Santos",
    email: "maria.santos@ugong.gov.ph",
    department: "VAWC",
    departmentColor: "bg-purple-100 text-purple-700",
    roleTitle: "Case Officer",
    status: "Active",
    lastActive: "2 mins ago",
  },
  {
    id: 2,
    name: "Pedro Reyes",
    email: "pedro.reyes@ugong.gov.ph",
    department: "BCPC",
    departmentColor: "bg-blue-100 text-blue-700",
    roleTitle: "Social Worker",
    status: "Active",
    lastActive: "15 mins ago",
  },
  {
    id: 3,
    name: "Juan Cruz",
    email: "juan.cruz@ugong.gov.ph",
    department: "Clearance",
    departmentColor: "bg-sky-100 text-sky-700",
    roleTitle: "Clearance Officer",
    status: "Active",
    lastActive: "1 hour ago",
  },
  {
    id: 4,
    name: "Ana Lopez",
    email: "ana.lopez@ugong.gov.ph",
    department: "Blotter",
    departmentColor: "bg-orange-100 text-orange-700",
    roleTitle: "Desk Officer",
    status: "Locked",
    lastActive: "3 days ago",
  },
  {
    id: 5,
    name: "Roberto Garcia",
    email: "roberto.garcia@ugong.gov.ph",
    department: "FTJS",
    departmentColor: "bg-green-100 text-green-700",
    roleTitle: "Youth Officer",
    status: "Active",
    lastActive: "30 mins ago",
  },
  {
    id: 6,
    name: "Liza Mendoza",
    email: "liza.mendoza@ugong.gov.ph",
    department: "VAWC",
    departmentColor: "bg-purple-100 text-purple-700",
    roleTitle: "Case Officer",
    status: "Inactive",
    lastActive: "2 weeks ago",
  },
];

const statusStyles: Record<Status, string> = {
  Active: "bg-green-100 text-green-700 border border-green-200",
  Locked: "bg-red-100 text-red-600 border border-red-200",
  Inactive: "bg-gray-100 text-gray-500 border border-gray-200",
};

// --- Icons ---
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const BanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export default function UserManagement() {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [search, setSearch] = useState("");

  const filtered = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
  );

  const totalStaff = staff.length;
  const activeCount = staff.filter((s) => s.status === "Active").length;
  const lockedCount = staff.filter((s) => s.status === "Locked").length;
  const inactiveCount = staff.filter((s) => s.status === "Inactive").length;

  const handleDelete = (id: number) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleLock = (id: number) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "Locked" ? "Active" : "Locked" }
          : s
      )
    );
  };

  const handleToggleInactive = (id: number) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "Inactive" ? "Active" : "Inactive" }
          : s
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage staff accounts and access control</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <PlusIcon />
            Create Staff Account
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Staff</p>
            <p className="text-2xl font-bold text-gray-900">{totalStaff}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-500">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Locked</p>
            <p className="text-2xl font-bold text-orange-400">{lockedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Inactive</p>
            <p className="text-2xl font-bold text-gray-400">{inactiveCount}</p>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Profile</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Assigned Department</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Role Title</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Last Active</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-10">No staff members found.</td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    {/* Profile */}
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </td>
                    {/* Department */}
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-md ${member.departmentColor}`}>
                        {member.department}
                      </span>
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3 text-gray-600">{member.roleTitle}</td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[member.status]}`}>
                        {member.status}
                      </span>
                    </td>
                    {/* Last Active */}
                    <td className="px-4 py-3 text-gray-500">{member.lastActive}</td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          title="Edit"
                          className="p-1.5 rounded-md text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          <EditIcon />
                        </button>
                        <button
                          title={member.status === "Locked" ? "Unlock" : "Lock"}
                          onClick={() => handleToggleLock(member.id)}
                          className="p-1.5 rounded-md text-yellow-500 hover:bg-yellow-50 transition-colors"
                        >
                          <LockIcon />
                        </button>
                        <button
                          title={member.status === "Inactive" ? "Reactivate" : "Deactivate"}
                          onClick={() => handleToggleInactive(member.id)}
                          className="p-1.5 rounded-md text-orange-400 hover:bg-orange-50 transition-colors"
                        >
                          <BanIcon />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDelete(member.id)}
                          className="p-1.5 rounded-md text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}