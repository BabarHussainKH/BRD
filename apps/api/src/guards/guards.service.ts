import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { GuardStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthUser } from "../common/decorators/current-user.decorator";
import { normalizePage, pageResult } from "../common/pagination";
import { assertBranchAccess, guardScopeWhere, isBranchScopedRole } from "../common/scope";

function digitsOnlyCnic(cnic: string) {
  return cnic.replace(/\D/g, "");
}

@Injectable()
export class GuardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(user: AuthUser, data: {
    fullName: string;
    cnicNumber: string;
    cnicExpiryDate: string;
    contactMobile: string;
    vendorId: string;
    weaponType: string;
    licenseExpiryDate?: string | null;
    guardCategory: "EX_SERVICE_MAN" | "CIVILIAN";
    deploymentCategory: "PERMANENT" | "REPLACEMENT" | "TEMPORARY";
    deploymentLocation: string;
    branchId: string;
    dateOfJoining: string;
    trainingStatus: "YES" | "NO";
    policeVerification: "YES" | "NO";
    nadraVerisys: "YES" | "NO";
    status?: GuardStatus;
    familyMembers?: Array<{
      name: string;
      cnicNumber?: string | null;
      dateOfBirth?: string | null;
      relation: string;
    }>;
  }) {
    const cnicExpiry = new Date(data.cnicExpiryDate);
    const joining = new Date(data.dateOfJoining);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (cnicExpiry < today) {
      throw new BadRequestException("CNIC expiry back-date is not allowed");
    }
    if (joining < today) {
      throw new BadRequestException("Date of joining back-date is not allowed");
    }

    const guardId = digitsOnlyCnic(data.cnicNumber);
    if (guardId.length !== 13) {
      throw new BadRequestException("CNIC must contain 13 digits");
    }

    if (isBranchScopedRole(user.role)) {
      if (!user.branchId || data.branchId !== user.branchId) {
        throw new ForbiddenException("Branch users can only register guards for their own branch");
      }
    }

    const created = await this.prisma.guard.create({
      data: {
        guardId,
        fullName: data.fullName,
        cnicNumber: data.cnicNumber,
        cnicExpiryDate: cnicExpiry,
        contactMobile: data.contactMobile,
        vendorId: data.vendorId,
        weaponType: data.weaponType,
        licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : null,
        guardCategory: data.guardCategory,
        deploymentCategory: data.deploymentCategory,
        deploymentLocation: data.deploymentLocation,
        branchId: data.branchId,
        dateOfJoining: joining,
        trainingStatus: data.trainingStatus,
        policeVerification: data.policeVerification,
        nadraVerisys: data.nadraVerisys,
        status: data.status ?? GuardStatus.ACTIVE,
        initiatorId: user.id,
        familyMembers: data.familyMembers?.length
          ? {
              create: data.familyMembers.map((m) => ({
                name: m.name,
                cnicNumber: m.cnicNumber ?? null,
                dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : null,
                relation: m.relation,
              })),
            }
          : undefined,
      },
      include: { familyMembers: true, vendor: true, branch: true },
    });

    await this.audit.log({
      userId: user.id,
      action: "CREATE",
      entity: "Guard",
      entityId: created.id,
      after: created,
    });

    return created;
  }

  async search(
    user: AuthUser,
    query: {
      q?: string;
      name?: string;
      cnicNumber?: string;
      location?: string;
      status?: GuardStatus;
      vendorId?: string;
      branchId?: string;
      policeVerification?: "YES" | "NO";
      nadraVerisys?: "YES" | "NO";
      page?: number;
      pageSize?: number;
    },
  ) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const scope = guardScopeWhere(user);
    if (isBranchScopedRole(user.role) && query.branchId && query.branchId !== user.branchId) {
      throw new ForbiddenException("Cannot query another branch");
    }
    const q = query.q?.trim();
    const where: Prisma.GuardWhereInput = {
      AND: [
        scope,
        {
          ...(q
            ? {
                OR: [
                  { fullName: { contains: q } },
                  { cnicNumber: { contains: q } },
                  { guardId: { contains: q.replace(/\D/g, "") || q } },
                  { deploymentLocation: { contains: q } },
                  { contactMobile: { contains: q } },
                  { branch: { OR: [{ code: { contains: q } }, { name: { contains: q } }] } },
                ],
              }
            : {}),
          ...(query.name ? { fullName: { contains: query.name } } : {}),
          ...(query.cnicNumber ? { cnicNumber: { contains: query.cnicNumber } } : {}),
          ...(query.location ? { deploymentLocation: { contains: query.location } } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(query.vendorId ? { vendorId: query.vendorId } : {}),
          ...(query.branchId ? { branchId: query.branchId } : {}),
          ...(query.policeVerification ? { policeVerification: query.policeVerification } : {}),
          ...(query.nadraVerisys ? { nadraVerisys: query.nadraVerisys } : {}),
        },
      ],
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.guard.count({ where }),
      this.prisma.guard.findMany({
        where,
        include: { vendor: true, branch: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return pageResult(items, total, page, pageSize);
  }

  async findOne(user: AuthUser, id: string) {
    const guard = await this.prisma.guard.findFirst({
      where: { id, ...guardScopeWhere(user) },
      include: {
        familyMembers: true,
        documents: true,
        vendor: true,
        branch: true,
        initiator: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!guard) throw new NotFoundException("Guard not found");
    return guard;
  }

  async updateStatus(user: AuthUser, id: string, status: GuardStatus) {
    const existing = await this.prisma.guard.findFirst({
      where: { id, ...guardScopeWhere(user) },
    });
    if (!existing) throw new NotFoundException("Guard not found");
    assertBranchAccess(user, existing.branchId);

    const updated = await this.prisma.guard.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      userId: user.id,
      action: "STATUS_UPDATE",
      entity: "Guard",
      entityId: id,
      before: { status: existing.status },
      after: { status },
    });

    return updated;
  }

  async expiringSoon(user: AuthUser, withinDays = 30) {
    const until = new Date();
    until.setDate(until.getDate() + withinDays);
    return this.prisma.guard.findMany({
      where: {
        ...guardScopeWhere(user),
        status: GuardStatus.ACTIVE,
        OR: [
          { cnicExpiryDate: { lte: until } },
          { licenseExpiryDate: { lte: until } },
        ],
      },
      include: { branch: true, vendor: true },
      orderBy: { cnicExpiryDate: "asc" },
      take: 100,
    });
  }
}
