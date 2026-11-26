import { Injectable } from "@nestjs/common";
import { ComplaintCategory, ComplaintStatus, Prisma, RecorderType, YesNo } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../common/decorators/current-user.decorator";
import { normalizePage, pageResult } from "../common/pagination";
import { assertBranchInScope, branchScopeWhere } from "../common/scope";

@Injectable()
export class CctvBasService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertInventory(
    user: AuthUser,
    data: {
      branchId: string;
      basVendorName: string;
      dedicatedPtclLine: YesNo;
      basSimNumber?: string | null;
      recorderType: RecorderType;
      cameraCount: number;
      recordingDays: number;
      warrantyStatus: YesNo;
      mirroringStatus: YesNo;
      installationDate?: string | null;
    },
  ) {
    await assertBranchInScope(this.prisma, user, data.branchId);
    return this.prisma.cctvBasInventory.create({
      data: {
        ...data,
        installationDate: data.installationDate ? new Date(data.installationDate) : null,
      },
      include: { branch: true },
    });
  }

  async listInventory(
    user: AuthUser,
    filters: {
      branchName?: string;
      branchCode?: string;
      vendorName?: string;
      q?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const scope = branchScopeWhere(user);
    const { page, pageSize, skip, take } = normalizePage(filters);
    const q = filters.q?.trim();
    const where: Prisma.CctvBasInventoryWhereInput = {
      ...(filters.vendorName ? { basVendorName: { contains: filters.vendorName } } : {}),
      branch: {
        ...(scope ?? {}),
        ...(filters.branchName ? { name: { contains: filters.branchName } } : {}),
        ...(filters.branchCode ? { code: { contains: filters.branchCode } } : {}),
      },
      ...(q
        ? {
            OR: [
              { basVendorName: { contains: q } },
              { basSimNumber: { contains: q } },
              { branch: { OR: [{ code: { contains: q } }, { name: { contains: q } }] } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.cctvBasInventory.count({ where }),
      this.prisma.cctvBasInventory.findMany({
        where,
        include: { branch: true },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
    ]);

    return pageResult(items, total, page, pageSize);
  }

  async createComplaint(
    user: AuthUser,
    data: {
      branchId: string;
      complaintDate: string;
      ticketNumber: string;
      category: ComplaintCategory;
      comments?: string;
      resolutionDate?: string | null;
    },
  ) {
    await assertBranchInScope(this.prisma, user, data.branchId);
    const resolutionDate = data.resolutionDate ? new Date(data.resolutionDate) : null;
    return this.prisma.complaint.create({
      data: {
        branchId: data.branchId,
        complaintDate: new Date(data.complaintDate),
        ticketNumber: data.ticketNumber,
        category: data.category,
        comments: data.comments,
        resolutionDate,
        status: resolutionDate ? ComplaintStatus.CLOSED : ComplaintStatus.OPENED,
      },
      include: { branch: true },
    });
  }

  async resolveComplaint(id: string, resolutionDate: string, comments?: string) {
    return this.prisma.complaint.update({
      where: { id },
      data: {
        resolutionDate: new Date(resolutionDate),
        status: ComplaintStatus.CLOSED,
        ...(comments ? { comments } : {}),
      },
    });
  }

  async listComplaints(
    user: AuthUser,
    query: {
      status?: ComplaintStatus;
      category?: ComplaintCategory;
      q?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const scope = branchScopeWhere(user);
    const { page, pageSize, skip, take } = normalizePage(query);
    const q = query.q?.trim();
    const where: Prisma.ComplaintWhereInput = {
      ...(scope ? { branch: scope } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(q
        ? {
            OR: [
              { ticketNumber: { contains: q } },
              { comments: { contains: q } },
              { branch: { OR: [{ code: { contains: q } }, { name: { contains: q } }] } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.complaint.count({ where }),
      this.prisma.complaint.findMany({
        where,
        include: { branch: true },
        orderBy: { complaintDate: "desc" },
        skip,
        take,
      }),
    ]);

    return pageResult(items, total, page, pageSize);
  }
}
