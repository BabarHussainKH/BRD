import { Injectable, NotFoundException } from "@nestjs/common";
import { InspectionRating, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthUser } from "../common/decorators/current-user.decorator";
import { normalizePage, pageResult } from "../common/pagination";
import { assertBranchInScope, branchScopeWhere } from "../common/scope";

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    user: AuthUser,
    data: {
      branchId: string;
      guardRating: InspectionRating;
      observations: string;
    },
  ) {
    await assertBranchInScope(this.prisma, user, data.branchId);

    const created = await this.prisma.inspection.create({
      data: {
        branchId: data.branchId,
        guardRating: data.guardRating,
        observations: data.observations,
        submittedById: user.id,
      },
      include: { branch: true },
    });

    await this.audit.log({
      userId: user.id,
      action: "CREATE",
      entity: "Inspection",
      entityId: created.id,
      after: created,
    });

    return created;
  }

  async list(
    user: AuthUser,
    query: {
      openOnly?: boolean;
      branchId?: string;
      rating?: InspectionRating;
      q?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const scope = branchScopeWhere(user);
    const { page, pageSize, skip, take } = normalizePage(query);
    const q = query.q?.trim();
    const where: Prisma.InspectionWhereInput = {
      ...(query.openOnly ? { isClosed: false } : {}),
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.rating ? { guardRating: query.rating } : {}),
      ...(scope ? { branch: scope } : {}),
      ...(q
        ? {
            OR: [
              { observations: { contains: q } },
              { actionPlan: { contains: q } },
              { branch: { OR: [{ code: { contains: q } }, { name: { contains: q } }] } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.inspection.count({ where }),
      this.prisma.inspection.findMany({
        where,
        include: {
          branch: true,
          submittedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return pageResult(items, total, page, pageSize);
  }

  async submitActionPlan(user: AuthUser, id: string, actionPlan: string) {
    const existing = await this.prisma.inspection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Inspection not found");
    await assertBranchInScope(this.prisma, user, existing.branchId);

    return this.prisma.inspection.update({
      where: { id },
      data: {
        actionPlan,
        actionPlanAt: new Date(),
        isClosed: true,
      },
    });
  }

  async dashboard(user: AuthUser) {
    const scope = branchScopeWhere(user);
    const where = scope ? { branch: scope } : {};
    const [open, overdue, byCluster] = await Promise.all([
      this.prisma.inspection.count({ where: { isClosed: false, ...where } }),
      this.prisma.inspection.count({
        where: {
          isClosed: false,
          createdAt: { lt: new Date(Date.now() - 7 * 86400000) },
          ...where,
        },
      }),
      this.prisma.inspection.groupBy({
        by: ["branchId"],
        where,
        _count: { _all: true },
        orderBy: { branchId: "asc" },
        take: 100,
      }),
    ]);

    return { openObservations: open, overdueItems: overdue, byBranch: byCluster };
  }
}
