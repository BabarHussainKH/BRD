export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  SECURITY_ADMIN: "SECURITY_ADMIN",
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  BRANCH_MANAGER: "BRANCH_MANAGER",
  BOM: "BOM",
  DISTRICT_OPERATIONS_MANAGER: "DISTRICT_OPERATIONS_MANAGER",
  REGIONAL_OPERATIONS_MANAGER: "REGIONAL_OPERATIONS_MANAGER",
  CLUSTER_SECURITY_HEAD: "CLUSTER_SECURITY_HEAD",
  DIVISIONAL_HEAD_SECURITY: "DIVISIONAL_HEAD_SECURITY",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  SECURITY_ADMIN: "Security Admin",
  SYSTEM_ADMIN: "System Admin",
  BRANCH_MANAGER: "Branch Manager",
  BOM: "Branch Operations Manager",
  DISTRICT_OPERATIONS_MANAGER: "District Operations Manager",
  REGIONAL_OPERATIONS_MANAGER: "Regional Operations Manager",
  CLUSTER_SECURITY_HEAD: "Cluster Security Head",
  DIVISIONAL_HEAD_SECURITY: "Divisional Head Security",
};
