import { type PermissionOptions } from "../../../service/admin-root-api/admin-management";

export const ALLOWED_PERMISSIONS = [
  "Create users",
  "Edit users",
  "View users",
  "Lock users",
  "Archive users",
  "Create resident",
  "View residents",
  "Edit resident",
  "Archive resident",
  "Create Officer",
  "View Officers",
  "Edit Officer",
  "Restore Archived",
  "Case Re-open",
] as const;

export const PERMISSION_GROUPS: Record<string, string[]> = {
  "User Management": [
    "Create users",
    "Edit users",
    "View users",
    "Lock users",
    "Archive users",
  ],
  "Resident Management": [
    "Create resident",
    "View residents",
    "Edit resident",
    "Archive resident",
  ],
  "Officer Management": ["Create Officer", "View Officers", "Edit Officer"],
  "Archive & Cases": ["Restore Archived", "Case Re-open"],
};

export const filterAllowedPermissions = (permissions: PermissionOptions[]) =>
  permissions.filter((p) =>
    ALLOWED_PERMISSIONS.some((allowed) =>
      p.permissionName.toLowerCase().includes(allowed.toLowerCase()),
    ),
  );

export const getGroupPermissions = (
  permissions: PermissionOptions[],
  groupName: string,
) => {
  const groupPerms = PERMISSION_GROUPS[groupName];
  if (!groupPerms) return [];
  return permissions.filter((p) =>
    groupPerms.some((perm) =>
      p.permissionName.toLowerCase().includes(perm.toLowerCase()),
    ),
  );
};
