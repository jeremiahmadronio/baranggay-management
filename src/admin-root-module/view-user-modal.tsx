import { ViewModal } from '../reusable/DetailView'
import { type AdminTable } from '../admin-root-api/admin-management'

interface ViewUserModalProps {
  admin: AdminTable | null
  isOpen: boolean
  onClose: () => void
}

export function ViewUserModal({ admin, isOpen, onClose }: ViewUserModalProps) {
  if (!admin || !isOpen) return null

  const fullName = `${admin.firstName} ${admin.lastName}`

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const sections = [
    {
      title: 'User Information',
      fields: [
        { key: 'username',  label: 'Username',       value: admin.username,                                                              width: 'half' as const },
        { key: 'contact',   label: 'Contact Number',  value: admin.contactNumber || 'N/A',                                               width: 'half' as const },
        { key: 'email',     label: 'Email',           value: <a href={`mailto:${admin.email}`} className="text-blue-600 hover:underline">{admin.email}</a>, width: 'full' as const },
      ],
    },
    {
      title: 'Access Details',
      fields: [
        {
          key: 'role',
          label: 'Role',
          value: <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded">{admin.roleName}</span>,
          width: 'half' as const,
        },
        {
          key: 'status',
          label: 'Status',
          value: (
            <span className={`flex items-center gap-1.5 text-sm font-medium ${admin.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${admin.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
              {admin.status}
            </span>
          ),
          width: 'half' as const,
        },
        {
          key: 'departments',
          label: 'Department Access',
          value: admin.departments?.length > 0 ? admin.departments.join(', ') : 'None',
          width: 'full' as const,
        },
      ],
    },
    {
      title: 'System Information',
      fields: [
        { key: 'isLocked',  label: 'Account Lock', value: admin.isLocked ? 'Locked ' : 'Unlocked ', width: 'half' as const },
        { key: 'lockUntil', label: 'Locked Until',  value: formatDate(admin.lockUntil),                  width: 'half' as const },
        { key: 'created',   label: 'Created At',    value: formatDate(admin.createdAt),                  width: 'half' as const },
        { key: 'lastLogin', label: 'Last Login',    value: formatDate(admin.lastLoginAt),                width: 'half' as const },
      ],
    },
  ]

  return (
    <ViewModal
      isOpen={isOpen}
      onClose={onClose}
      title={fullName}
      subtitle={admin.email}
      avatar={{ name: fullName }}
      sections={sections}
      size="md"
      closeText="Close"
    />
  )
}