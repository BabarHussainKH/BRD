import { Injectable } from "@nestjs/common";
import { AttendancePeriodStatus, GuardStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../common/decorators/current-user.decorator";
import { branchScopeWhere, guardScopeWhere } from "../common/scope";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async guardsStrength(user: AuthUser) {
    const guardScope = guardScopeWhere(user);
    const branchScope = branchScopeWhere(user);
    const rows = await this.prisma.guard.groupBy({
      by: ["branchId", "status"],
      where: guardScope,
      _count: { _all: true },
    });
    const branches = await this.prisma.branch.findMany({
      where: branchScope ?? undefined,
      include: { cluster: { include: { region: true } } },
    });
    const byId = new Map(branches.map((b) => [b.id, b]));

    return rows
      .filter((r) => byId.has(r.branchId))
      .map((r) => {
        const b = byId.get(r.branchId)!;
        return {
          region: b.cluster.region.name,
          cluster: b.cluster.name,
          branchCode: b.code,
          branchName: b.name,
          status: r.status,
          count: r._count._all,
        };
      });
  }

  async attendanceCompliance(user: AuthUser) {
    const scope = branchScopeWhere(user);
    return this.prisma.attendancePeriod.findMany({
      where: {
        status: {
          in: [
            AttendancePeriodStatus.PENDING,
            AttendancePeriodStatus.DRAFT,
            AttendancePeriodStatus.SUBMITTED,
            AttendancePeriodStatus.CHANGE_REQUESTED,
          ],
        },
        ...(scope ? { branch: scope } : {}),
      },
      include: { branch: { include: { cluster: { include: { region: true } } } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 200,
    });
  }

  async expiryAlerts(user: AuthUser) {
    const until = new Date();
    until.setDate(until.getDate() + 30);
    return this.prisma.guard.findMany({
      where: {
        ...guardScopeWhere(user),
        status: GuardStatus.ACTIVE,
        OR: [{ cnicExpiryDate: { lte: until } }, { licenseExpiryDate: { lte: until } }],
      },
      include: { branch: true, vendor: true },
      orderBy: { cnicExpiryDate: "asc" },
      take: 200,
    });
  }

  async inspectionScores(user: AuthUser) {
    const scope = branchScopeWhere(user);
    return this.prisma.inspection.findMany({
      where: scope ? { branch: scope } : undefined,
      include: { branch: { include: { cluster: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async cctvVendorPerformance(user: AuthUser) {
    const scope = branchScopeWhere(user);
    const inventory = await this.prisma.cctvBasInventory.findMany({
      where: scope ? { branch: scope } : undefined,
      include: { branch: true },
      take: 200,
    });
    const complaints = await this.prisma.complaint.groupBy({
      by: ["category", "status"],
      where: scope ? { branch: scope } : undefined,
      _count: { _all: true },
    });
    return { inventory, complaints };
  }

  toCsv(rows: Array<Record<string, unknown>>) {
    if (!rows.length) return "No data\n";
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return `"${s.replaceAll('"', '""')}"`;
    };
    return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join(
      "\n",
    );
  }
}
