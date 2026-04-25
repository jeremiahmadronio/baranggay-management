import type {
  Department,
  Permission,
  Role,
} from "../../../../service/admin-root-api/user-management";

type DeptKey =
  | "blotter"
  | "vawc"
  | "bcpc"
  | "lupon"
  | "clearance"
  | "ftjs"
  | "captain";

const DEPT_ROLE_RULES: Record<DeptKey, string[]> = {
  blotter: ["desk officer", "focal person"],
  vawc: ["desk officer", "focal person"],
  bcpc: ["desk officer", "focal person", "chair person", "vice chairperson"],
  lupon: ["chairman", "secretary", "members", "desk officer", "focal person"],
  clearance: ["desk officer", "secretary"],
  ftjs: ["focal person", "desk officer"],
  captain: [
  "captain",
  "punong barangay",
  "barangay captain",
  "secretary",
  "desk officer",
  "officials",
  "staff",
],
};

const DEPT_PERMISSION_RULES: Record<DeptKey, string[]> = {
  blotter: [
    "View Records",
    "Manage Mediation",
    "Manage Lupon Escalation",
    "View Cases",
    "Create Case Entry",
    "Archive Cases",
    "Resolve & Finalize Case",
    "Manage Case notes",
    "Manage Reports",
    "Update Case information",
  ],
  lupon: [
    "Manage Conciliation",
    "Manage Hearings & Mediation",
    "View Cases",
    "Create Case Entry",
    "Archive Cases",
    "Resolve & Finalize Case",
    "Update Case Status",
    "Manage Case notes",
    "Manage Reports",
    "Issue Referral",
    "Update Case information",
  ],
  vawc: [
    "View Cases",
    "Create Case Entry",
    "Archive Cases",
    "Resolve & Finalize Case",
    "Manage Case notes",
    "Manage Reports",
    "Issue Referral",
    "Update Case information",
    "Issue BPO",
    "Manage Intervention",
  ],
  bcpc: [
    "View Cases",
    "Create Case Entry",
    "Archive Cases",
    "Resolve & Finalize Case",
    "Manage Case notes",
    "Manage Reports",
    "Issue Referral",
    "Update Case information",
    "Manage Mediation",
    "Issue BPO",
    "Manage Intervention",
  ],
  clearance: ["Issue Clearance", "Edit Template", "View Revenue Reports"],
  ftjs: [
    "Register new Applicant",
    "Issue ftjs Certificate",
    "View ftjs Records",
    "Update Applicant Info",
  ],
  captain: [
    "View blotter cases",
    "View blotter reports",
    "View lupon cases",
    "View lupon reports",
    "View vawc reports",
    "View vawc cases",
    "View bcpc reports",
    "View bcpc cases",
    "View clerance issued",
    "View clerance revenue",
    "View ftjs issued",
    "View ftjs reports",
  ],
};

function normalize(value?: string | null) {
  return String(value ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/[&/]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "");
}

export function resolveDeptKey(name?: string | null): DeptKey | "" {
  const value = normalize(name);
  if (value.includes("blotter")) return "blotter";
  if (value.includes("vawc")) return "vawc";
  if (value.includes("bcpc")) return "bcpc";
  if (value.includes("lupon") || value.includes("lupong")) return "lupon";
  if (value.includes("clearance")) return "clearance";
  if (
    value.includes("first time job seeker") ||
    value.includes("first-time-job-seeker") ||
    value.includes("ftjs")
  ) {
    return "ftjs";
  }
  if (
    value.includes("captain") ||
    value.includes("kapitana") ||
    value.includes("barangay captain") ||
    value.includes("office of the barangay captain")
  ) {
    return "captain";
  }
  return "";
}

export function filterRolesByDepartments(
  roles: Role[],
  departments: Department[],
  selectedDepartmentIds: number[],
): Role[] {
  if (!selectedDepartmentIds.length) return [];

  const allowedRoleNames = new Set<string>();

  selectedDepartmentIds.forEach((deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    const key = resolveDeptKey(dept?.name);
    if (!key) return;
    DEPT_ROLE_RULES[key].forEach((roleName) => allowedRoleNames.add(roleName));
  });

  if (!allowedRoleNames.size) return [];

  return roles.filter((role) => allowedRoleNames.has(normalize(role.roleName)));
}

export function filterPermissionsByDepartments(
  permissions: Permission[],
  departments: Department[],
  selectedDepartmentIds: number[],
): Permission[] {
  if (!selectedDepartmentIds.length) return [];

  const allowedPermissionNames = new Set<string>();

  selectedDepartmentIds.forEach((deptId) => {
    const dept = departments.find((d) => d.id === deptId);
    const key = resolveDeptKey(dept?.name);
    if (!key) return;
    DEPT_PERMISSION_RULES[key].forEach((name) =>
      allowedPermissionNames.add(normalize(name)),
    );
  });

  if (!allowedPermissionNames.size) return [];

  return permissions.filter((permission) =>
    allowedPermissionNames.has(normalize(permission.permissionName)),
  );
}
