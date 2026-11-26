import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../common/decorators/current-user.decorator";
import { normalizePage, pageResult } from "../common/pagination";
import { branchScopeWhere } from "../common/scope";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listLov(category?: string) {
    return this.prisma.lovItem.findMany({
      where: {
        isActive: true,
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
  }

  upsertLov(data: { category: string; code: string; label: string; sortOrder?: number }) {
    return this.prisma.lovItem.upsert({
      where: { category_code: { category: data.category, code: data.code } },
      create: {
        category: data.category,
        code: data.code,
        label: data.label,
        sortOrder: data.sortOrder ?? 0,
      },
      update: {
        label: data.label,
        sortOrder: data.sortOrder ?? 0,
        isActive: true,
      },
    });
  }

  setConfig(key: string, value: unknown) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
  }

  getConfig(key: string) {
    return this.prisma.systemConfig.findUnique({ where: { key } });
  }

  listVendors() {
    return this.prisma.vendor.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  }

  createVendor(name: string) {
    return this.prisma.vendor.create({ data: { name } });
  }

  async listBranches(
    user: AuthUser,
    query: { q?: string; page?: number; pageSize?: number; all?: boolean } = {},
  ) {
    const scope = branchScopeWhere(user);
    const q = query.q?.trim();
    const where: Prisma.BranchWhereInput = {
      isActive: true,
      ...(scope ?? {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q } },
              { name: { contains: q } },
              { address: { contains: q } },
              { cluster: { name: { contains: q } } },
              { cluster: { region: { name: { contains: q } } } },
            ],
          }
        : {}),
    };

    // Small scoped sets (BM/BOM) can return all for dropdowns
    if (query.all || (scope && "id" in scope)) {
      const items = await this.prisma.branch.findMany({
        where,
        include: { cluster: { include: { region: true } } },
        orderBy: { code: "asc" },
        take: 5000,
      });
      return pageResult(items, items.length, 1, items.length || 1);
    }

    const { page, pageSize, skip, take } = normalizePage(query, 100);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.branch.count({ where }),
      this.prisma.branch.findMany({
        where,
        include: { cluster: { include: { region: true } } },
        orderBy: { code: "asc" },
        skip,
        take,
      }),
    ]);
    return pageResult(items, total, page, pageSize);
  }

  async orgSummary() {
    const [regions, clusters, branches, activeGuards, users] = await Promise.all([
      this.prisma.region.count(),
      this.prisma.cluster.count(),
      this.prisma.branch.count({ where: { isActive: true } }),
      this.prisma.guard.count({ where: { status: "ACTIVE" } }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);
    return { regions, clusters, branches, activeGuards, users };
  }
}
