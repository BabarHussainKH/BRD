import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { normalizePage, pageResult } from "../common/pagination";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    before?: unknown;
    after?: unknown;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        beforeJson: (params.before as Prisma.InputJsonValue) ?? undefined,
        afterJson: (params.after as Prisma.InputJsonValue) ?? undefined,
        ipAddress: params.ipAddress,
      },
    });
  }

  async list(query: {
    q?: string;
    action?: string;
    entity?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const q = query.q?.trim();
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action ? { action: { contains: query.action } } : {}),
      ...(query.entity ? { entity: { contains: query.entity } } : {}),
      ...(q
        ? {
            OR: [
              { action: { contains: q } },
              { entity: { contains: q } },
              { entityId: { contains: q } },
              { user: { fullName: { contains: q } } },
              { user: { email: { contains: q } } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { user: { select: { id: true, fullName: true, email: true } } },
      }),
    ]);

    return pageResult(items, total, page, pageSize);
  }
}
