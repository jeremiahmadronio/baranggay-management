import { ViewModal } from "../reusable/DetailView";
import { type UserTable } from "../admin-module-api/user-management";

interface ViewStaffModalProps {
  user: UserTable | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewStaffModal({ user, isOpen, onClose }: ViewStaffModalProps) {
  if (!user || !isOpen) return null;

  const fullName = `${user.firstName} ${user.lastName}`;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sections = [
    {
      title: "User Information",
      fields: [
        {
          key: "username",
          label: "Username",
          value: user.username,
          width: "half" as const,
        },
        {
          key: "contact",
          label: "Contact Number",
          value: user.contactNumber || "N/A",
          width: "half" as const,
        },
        {
          key: "email",
          label: "Email",
          value: (
            <a
              href={`mailto:${user.email}`}
              className="text-blue-600 hover:underline"
            >
              {user.email}
            </a>
          ),
          width: "full" as const,
        },
      ],
    },
    {
      title: "Access Details",
      fields: [
        {
          key: "role",
          label: "Role",
          value: (
            <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-600 rounded">
              {user.roleName}
            </span>
          ),
          width: "half" as const,
        },
        {
          key: "status",
          label: "Status",
          value: (
            <span
              className={`flex items-center gap-1.5 text-sm font-medium ${user.status === "ACTIVE" ? "text-green-600" : "text-red-600"}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${user.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"}`}
              />
              {user.status}
            </span>
          ),
          width: "half" as const,
        },
        {
          key: "department",
          label: "Department",
          value: user.departmentName || "None",
          width: "half" as const,
        },
        {
          key: "permissions",
          label: "Permissions",
          value:
            user.permissions?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {user.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 text-xs bg-purple-50 text-purple-600 rounded font-medium"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            ) : (
              "None"
            ),
          width: "full" as const,
        },
      ],
    },
    {
      title: "System Information",
      fields: [
        {
          key: "isLocked",
          label: "Account Lock",
          value: user.isLocked ? "Locked " : "Unlocked ",
          width: "half" as const,
        },
        {
          key: "lockUntil",
          label: "Locked Until",
          value: formatDate(user.lockUntil),
          width: "half" as const,
        },
        {
          key: "created",
          label: "Created At",
          value: formatDate(user.createdAt),
          width: "half" as const,
        },
        {
          key: "lastLogin",
          label: "Last Login",
          value: formatDate(user.lastLoginAt),
          width: "half" as const,
        },
      ],
    },
  ];

  return (
    <ViewModal
      isOpen={isOpen}
      onClose={onClose}
      title={fullName}
      subtitle={user.email}
      avatar={{ name: fullName }}
      sections={sections}
      size="lg"
      closeText="Close"
    />
  );
}
