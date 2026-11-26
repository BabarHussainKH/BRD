import { ForbiddenException } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { AuthUser } from "./decorators/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";

export type ScopeUser = AuthUser & {
  clusterId?: string | null;
  regionId?: string | null;
};

/** Branch-level visibility filter for guards / attendance / inventory / etc. */
export function branchScopeWhere(user: ScopeUser): Prisma.BranchWhereInput | undefined {
  switch (user.role as UserRole) {
    case UserRole.SUPER_ADMIN:
    case UserRole.SECURITY_ADMIN:
    case UserRole.SYSTEM_ADMIN:
    case UserRole.DIVISIONAL_HEAD_SECURITY:
      return undefined; // all branches
    case UserRole.BRANCH_MANAGER:
    case UserRole.BOM:
      if (!user.branchId) throw new ForbiddenException("Branch scope not assigned to user");
      return { id: user.branchId };
    case UserRole.CLUSTER_SECURITY_HEAD:
      if (!user.clusterId) throw new ForbiddenException("Cluster scope not assigned to user");
      return { clusterId: user.clusterId };
    case UserRole.DISTRICT_OPERATIONS_MANAGER:
    case UserRole.REGIONAL_OPERATIONS_MANAGER:
      if (!user.regionId) throw new ForbiddenException("Region scope not assigned to user");
      return { cluster: { regionId: user.regionId } };
    default:
      throw new ForbiddenException("Unrecognized role scope");
  }
}

export function guardScopeWhere(user: ScopeUser): Prisma.GuardWhereInput {
  const branchWhere = branchScopeWhere(user);
  return branchWhere ? { branch: branchWhere } : {};
}

export function assertBranchAccess(user: ScopeUser, branchId: string) {
  if (
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.SECURITY_ADMIN ||
    user.role === UserRole.SYSTEM_ADMIN ||
    user.role === UserRole.DIVISIONAL_HEAD_SECURITY
  ) {
    return;
  }
  if (
    (user.role === UserRole.BRANCH_MANAGER || user.role === UserRole.BOM) &&
    user.branchId === branchId
  ) {
    return;
  }
  if (user.role === UserRole.CLUSTER_SECURITY_HEAD && user.clusterId) return;
  if (
    (user.role === UserRole.DISTRICT_OPERATIONS_MANAGER ||
      user.role === UserRole.REGIONAL_OPERATIONS_MANAGER) &&
    user.regionId
  ) {
    return;
  }
  if (user.branchId && user.branchId !== branchId) {
    throw new ForbiddenException("You can only access data for your assigned branch");
  }
}

/** Strict check that loads branch and verifies cluster/region membership. */
export async function assertBranchInScope(
  prisma: PrismaService,
  user: ScopeUser,
  branchId: string,
) {
  const scope = branchScopeWhere(user);
  if (!scope) return;
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, ...scope },
    select: { id: true },
  });
  if (!branch) {
    throw new ForbiddenException("You can only access data within your assigned scope");
  }
}

export function isBranchScopedRole(role: string) {
  return role === UserRole.BRANCH_MANAGER || role === UserRole.BOM;
}
