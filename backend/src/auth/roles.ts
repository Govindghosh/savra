export const roles = ["teacher", "student", "admin"] as const;

export type Role = (typeof roles)[number];

export const roleCapabilities: Record<Role, string[]> = {
  teacher: ["generate_presentation", "read_content", "view_own_jobs", "manage_students"],
  student: ["read_content"],
  admin: ["read_content", "view_all_jobs", "view_analytics", "manage_users"]
};

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

export type AccessTokenPayload = AuthUser & {
  type: "access";
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export function getRoleCapabilities(role: Role) {
  return roleCapabilities[role];
}
