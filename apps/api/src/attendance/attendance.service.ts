import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ApprovalStatus, AttendancePeriodStatus, Prisma, ShiftType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthUser } from "../common/decorators/current-user.decorator";
import { normalizePage, pageResult } from "../common/pagination";
import { branchScopeWhere } from "../common/scope";

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async ensurePeriod(branchId: string, month: number, year: number) {
    return this.prisma.attendancePeriod.upsert({
      where: { branchId_month_year: { branchId, month, year } },
      create: { branchId, month, year, status: AttendancePeriodStatus.PENDING },
      update: {},
      include: { entries: { include: { guard: true } }, branch: true },
    });
  }

  listPending(branchId?: string) {
    return this.prisma.attendancePeriod.findMany({
      where: {
        status: { in: [AttendancePeriodStatus.PENDING, AttendancePeriodStatus.DRAFT] },
        ...(branchId ? { branchId } : {}),
      },
      include: { branch: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
  }

  async listPeriods(
    user: AuthUser,
    params?: {
      branchId?: string;
      status?: AttendancePeriodStatus;
      q?: string;
      year?: number;
      month?: number;
      page?: number;
      pageSize?: number;
    },
  ) {
    const scope = branchScopeWhere(user);
    const { page, pageSize, skip, take } = normalizePage(params ?? {});
    const q = params?.q?.trim();
    const where: Prisma.AttendancePeriodWhereInput = {
      ...(scope ? { branch: scope } : {}),
      ...(params?.branchId ? { branchId: params.branchId } : {}),
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.year ? { year: params.year } : {}),
      ...(params?.month ? { month: params.month } : {}),
      ...(q
        ? {
            OR: [
              { branch: { code: { contains: q } } },
              { branch: { name: { contains: q } } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.attendancePeriod.count({ where }),
      this.prisma.attendancePeriod.findMany({
        where,
        include: {
          branch: true,
          entries: true,
          changeRequests: {
            where: { status: ApprovalStatus.PENDING },
            include: { requestedBy: { select: { id: true, fullName: true } } },
          },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        skip,
        take,
      }),
    ]);

    return pageResult(items, total, page, pageSize);
  }

  async listChangeRequests(
    user: AuthUser,
    status: ApprovalStatus = ApprovalStatus.PENDING,
    params: { page?: number; pageSize?: number; q?: string } = {},
  ) {
    const scope = branchScopeWhere(user);
    const { page, pageSize, skip, take } = normalizePage(params);
    const q = params.q?.trim();
    const where: Prisma.AttendanceChangeRequestWhereInput = {
      status,
      ...(scope ? { period: { branch: scope } } : {}),
      ...(q
        ? {
            OR: [
              { comment: { contains: q } },
              { period: { branch: { OR: [{ code: { contains: q } }, { name: { contains: q } }] } } },
              { requestedBy: { fullName: { contains: q } } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.attendanceChangeRequest.count({ where }),
      this.prisma.attendanceChangeRequest.findMany({
        where,
        include: {
          period: { include: { branch: true } },
          requestedBy: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return pageResult(items, total, page, pageSize);
  }

  async saveDraft(
    periodId: string,
    entries: Array<{ guardId: string; fromDate: string; toDate: string; shift: ShiftType }>,
  ) {
    const period = await this.prisma.attendancePeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException("Attendance period not found");
    if (period.status === AttendancePeriodStatus.SUBMITTED) {
      throw new BadRequestException("Submitted attendance requires a change request");
    }

    await this.prisma.$transaction([
      this.prisma.attendanceEntry.deleteMany({ where: { periodId } }),
      this.prisma.attendanceEntry.createMany({
        data: entries.map((e) => ({
          periodId,
          guardId: e.guardId,
          fromDate: new Date(e.fromDate),
          toDate: new Date(e.toDate),
          shift: e.shift,
        })),
      }),
      this.prisma.attendancePeriod.update({
        where: { id: periodId },
        data: { status: AttendancePeriodStatus.DRAFT },
      }),
    ]);

    return this.getPeriod(periodId);
  }

  async submit(periodId: string, userId: string) {
    const period = await this.getPeriod(periodId);
    const activeGuards = await this.prisma.guard.count({
      where: { branchId: period.branchId, status: "ACTIVE" },
    });
    const markedGuardIds = new Set(period.entries.map((e) => e.guardId));
    if (markedGuardIds.size < activeGuards) {
      throw new BadRequestException("Submit enabled only when attendance is marked for all guards");
    }

    const updated = await this.prisma.attendancePeriod.update({
      where: { id: periodId },
      data: {
        status: AttendancePeriodStatus.SUBMITTED,
        submittedAt: new Date(),
        submittedById: userId,
      },
      include: { entries: { include: { guard: true } }, branch: true },
    });

    await this.audit.log({
      userId,
      action: "SUBMIT",
      entity: "AttendancePeriod",
      entityId: periodId,
      after: updated,
    });

    return { period: updated, summary: this.summarize(updated.entries) };
  }

  summarize(entries: Array<{ guardId: string; fromDate: Date; toDate: Date; shift: ShiftType }>) {
    const byShift = new Map<ShiftType, { guards: Set<string>; days: number }>();
    for (const e of entries) {
      const days = Math.max(1, Math.ceil((e.toDate.getTime() - e.fromDate.getTime()) / 86400000) + 1);
      const bucket = byShift.get(e.shift) ?? { guards: new Set<string>(), days: 0 };
      bucket.guards.add(e.guardId);
      bucket.days += days;
      byShift.set(e.shift, bucket);
    }
    return Array.from(byShift.entries()).map(([shift, v]) => ({
      shift,
      numberOfGuards: v.guards.size,
      numberOfDays: v.days,
    }));
  }

  async getPeriod(periodId: string) {
    const period = await this.prisma.attendancePeriod.findUnique({
      where: { id: periodId },
      include: { entries: { include: { guard: true } }, branch: true, changeRequests: true },
    });
    if (!period) throw new NotFoundException("Attendance period not found");
    return period;
  }

  async requestChange(periodId: string, userId: string, comment: string, payload: unknown) {
    const period = await this.getPeriod(periodId);
    if (period.status !== AttendancePeriodStatus.SUBMITTED) {
      throw new BadRequestException("Change request only allowed after submission");
    }

    const req = await this.prisma.attendanceChangeRequest.create({
      data: {
        periodId,
        requestedById: userId,
        comment,
        payloadJson: payload as Prisma.InputJsonValue,
        status: ApprovalStatus.PENDING,
      },
    });

    await this.prisma.attendancePeriod.update({
      where: { id: periodId },
      data: { status: AttendancePeriodStatus.CHANGE_REQUESTED },
    });

    return req;
  }

  async reviewChange(requestId: string, reviewerId: string, approve: boolean, reviewComment?: string) {
    const req = await this.prisma.attendanceChangeRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Change request not found");

    if (approve) {
      const payload = req.payloadJson as Array<{
        guardId: string;
        fromDate: string;
        toDate: string;
        shift: ShiftType;
      }>;
      await this.prisma.$transaction([
        this.prisma.attendanceEntry.deleteMany({ where: { periodId: req.periodId } }),
        this.prisma.attendanceEntry.createMany({
          data: payload.map((e) => ({
            periodId: req.periodId,
            guardId: e.guardId,
            fromDate: new Date(e.fromDate),
            toDate: new Date(e.toDate),
            shift: e.shift,
          })),
        }),
        this.prisma.attendanceChangeRequest.update({
          where: { id: requestId },
          data: {
            status: ApprovalStatus.APPROVED,
            reviewedById: reviewerId,
            reviewComment,
            reviewedAt: new Date(),
          },
        }),
        this.prisma.attendancePeriod.update({
          where: { id: req.periodId },
          data: { status: AttendancePeriodStatus.SUBMITTED },
        }),
      ]);
    } else {
      await this.prisma.$transaction([
        this.prisma.attendanceChangeRequest.update({
          where: { id: requestId },
          data: {
            status: ApprovalStatus.REJECTED,
            reviewedById: reviewerId,
            reviewComment,
            reviewedAt: new Date(),
          },
        }),
        this.prisma.attendancePeriod.update({
          where: { id: req.periodId },
          data: { status: AttendancePeriodStatus.SUBMITTED },
        }),
      ]);
    }

    return this.getPeriod(req.periodId);
  }
}
