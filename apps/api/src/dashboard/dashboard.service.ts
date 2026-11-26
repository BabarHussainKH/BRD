import { Injectable } from "@nestjs/common";
import { AttendancePeriodStatus, GuardStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../common/decorators/current-user.decorator";
import { branchScopeWhere, guardScopeWhere } from "../common/scope";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(user: AuthUser) {
    const now = new Date();
    const in30 = new Date();
    in30.setDate(now.getDate() + 30);
    const guardScope = guardScopeWhere(user);
    const branchScope = branchScopeWhere(user);
    const branchFilter: Prisma.AttendancePeriodWhereInput = branchScope
      ? { branch: branchScope }
      : {};

    const [
      activeGuards,
      byBranch,
      attendancePending,
      openInspections,
      expiringDocs,
      openComplaints,
      branchCount,
    ] = await Promise.all([
      this.prisma.guard.count({ where: { status: GuardStatus.ACTIVE, ...guardScope } }),
      this.prisma.guard.groupBy({
        by: ["branchId"],
        where: { status: GuardStatus.ACTIVE, ...guardScope },
        _count: { _all: true },
        orderBy: { branchId: "asc" },
        take: 50,
      }),
      this.prisma.attendancePeriod.count({
        where: {
          status: { in: [AttendancePeriodStatus.PENDING, AttendancePeriodStatus.DRAFT] },
          ...branchFilter,
        },
      }),
      this.prisma.inspection.count({
        where: {
          isClosed: false,
          ...(branchScope ? { branch: branchScope } : {}),
        },
      }),
      this.prisma.guardDocument.count({
        where: {
          expiryDate: { lte: in30 },
          guard: guardScope,
        },
      }),
      this.prisma.complaint.count({
        where: {
          status: "OPENED",
          ...(branchScope ? { branch: branchScope } : {}),
        },
      }),
      this.prisma.branch.count({
        where: { isActive: true, ...(branchScope ?? {}) },
      }),
    ]);

    return {
      guardsStrength: activeGuards,
      guardsByBranch: byBranch,
      attendanceNonCompliance: attendancePending,
      openInspections,
      expiryAlerts: expiringDocs,
      openComplaints,
      branchesInScope: branchCount,
    };
  }
}
