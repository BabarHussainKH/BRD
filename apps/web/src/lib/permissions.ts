import { UserRole } from "@sms/shared";

export type AppModule =
  | "dashboard"
  | "guards"
  | "guards.write"
  | "attendance"
  | "attendance.review"
  | "deployment"
  | "deployment.approve"
  | "inspections"
  | "inspections.write"
  | "inspections.action"
  | "cctv"
  | "admin"
  | "audit"
  | "reports";

const ALL: AppModule[] = [
  "dashboard",
  "guards",
  "guards.write",
  "attendance",
  "attendance.review",
  "deployment",
  "deployment.approve",
  "inspections",
  "inspections.write",
  "inspections.action",
  "cctv",
  "admin",
  "audit",
  "reports",
];

const MATRIX: Record<string, AppModule[]> = {
  [UserRole.SUPER_ADMIN]: ALL,
  [UserRole.SYSTEM_ADMIN]: ["dashboard", "admin", "audit", "reports", "guards", "cctv"],
  [UserRole.SECURITY_ADMIN]: [
    "dashboard",
    "guards",
    "attendance",
    "attendance.review",
    "deployment",
    "deployment.approve",
    "inspections",
    "inspections.write",
    "cctv",
    "admin",
    "audit",
    "reports",
  ],
  [UserRole.BRANCH_MANAGER]: [
    "dashboard",
    "guards",
    "guards.write",
    "attendance",
    "deployment",
    "inspections",
    "inspections.action",
    "cctv",
    "reports",
  ],
  [UserRole.BOM]: [
    "dashboard",
    "guards",
    "guards.write",
    "attendance",
    "deployment",
    "inspections",
    "inspections.action",
    "cctv",
    "reports",
  ],
  [UserRole.DISTRICT_OPERATIONS_MANAGER]: [
    "dashboard",
    "guards",
    "attendance",
    "deployment",
    "deployment.approve",
    "inspections",
    "reports",
  ],
  [UserRole.REGIONAL_OPERATIONS_MANAGER]: [
    "dashboard",
    "guards",
    "attendance",
    "deployment",
    "deployment.approve",
    "inspections",
    "reports",
  ],
  [UserRole.CLUSTER_SECURITY_HEAD]: [
    "dashboard",
    "guards",
    "attendance",
    "attendance.review",
    "deployment",
    "deployment.approve",
    "inspections",
    "inspections.write",
    "cctv",
    "reports",
  ],
  [UserRole.DIVISIONAL_HEAD_SECURITY]: [
    "dashboard",
    "guards",
    "attendance",
    "attendance.review",
    "deployment",
    "deployment.approve",
    "inspections",
    "cctv",
    "audit",
    "reports",
  ],
};

export function can(role: string | undefined | null, module: AppModule) {
  if (!role) return false;
  return (MATRIX[role] ?? []).includes(module);
}

export function navForRole(role: string | undefined | null) {
  const items = [
    { href: "/app", label: "Dashboard", module: "dashboard" as AppModule },
    { href: "/app/guards", label: "Guards", module: "guards" as AppModule },
    { href: "/app/attendance", label: "Attendance", module: "attendance" as AppModule },
    { href: "/app/deployment", label: "Deployment", module: "deployment" as AppModule },
    { href: "/app/inspections", label: "Inspections", module: "inspections" as AppModule },
    { href: "/app/cctv-bas", label: "CCTV / BAS", module: "cctv" as AppModule },
    { href: "/app/reports", label: "Reports", module: "reports" as AppModule },
    { href: "/app/audit", label: "Audit Trail", module: "audit" as AppModule },
    { href: "/app/admin", label: "Admin", module: "admin" as AppModule },
  ];
  return items.filter((i) => can(role, i.module));
}
