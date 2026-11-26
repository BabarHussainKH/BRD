import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  AttendancePeriodStatus,
  GuardStatus,
  UserRole,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Daily attendance reminder / escalation matrix (BRD Day 1–4). */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async attendanceEscalations() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Pending periods for current calendar month
    const pending = await this.prisma.attendancePeriod.findMany({
      where: {
        month,
        year,
        status: {
          in: [AttendancePeriodStatus.PENDING, AttendancePeriodStatus.DRAFT],
        },
      },
      include: { branch: true },
    });

    if (!pending.length) {
      this.logger.debug("No pending attendance periods for escalation");
      return;
    }

    const cfg = await this.prisma.systemConfig.findUnique({
      where: { key: "attendance_escalation" },
    });
    const matrix = (cfg?.value ?? {}) as {
      day3?: string;
      day4?: string;
    };

    for (const period of pending) {
      const title = `Attendance pending · ${period.branch.code} · ${String(month).padStart(2, "0")}/${year}`;
      if (day === 1 || day === 2) {
        await this.notifications.create({
          role: UserRole.BRANCH_MANAGER,
          title,
          body: `Reminder: update monthly attendance for ${period.branch.name} by the 1st. Current delay day ${day}.`,
          meta: { periodId: period.id, day },
        });
      } else if (day === 3) {
        await this.notifications.create({
          role: (matrix.day3 as UserRole) ?? UserRole.DISTRICT_OPERATIONS_MANAGER,
          title: `Escalation Day 3 · ${period.branch.code}`,
          body: `Attendance still pending for ${period.branch.name}. Escalated to District Operations Manager.`,
          meta: { periodId: period.id, day },
        });
      } else if (day >= 4) {
        await this.notifications.create({
          role: (matrix.day4 as UserRole) ?? UserRole.REGIONAL_OPERATIONS_MANAGER,
          title: `Escalation Day 4 · ${period.branch.code}`,
          body: `Attendance still pending for ${period.branch.name}. Escalated to Regional Operations Head.`,
          meta: { periodId: period.id, day },
        });
      }
    }

    this.logger.log(`Attendance escalation processed for ${pending.length} period(s)`);
  }

  /** Guard registration TAT: 1 working day, then escalate (BRD). */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async registrationTat() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 1);
    const incompleteDocs = await this.prisma.guard.findMany({
      where: {
        status: GuardStatus.ACTIVE,
        createdAt: { lte: cutoff },
        documents: { none: {} },
      },
      include: { branch: true },
      take: 50,
    });

    for (const g of incompleteDocs) {
      const ageDays = Math.floor((Date.now() - g.createdAt.getTime()) / 86400000);
      if (ageDays >= 1 && ageDays < 4) {
        await this.notifications.create({
          role: UserRole.REGIONAL_OPERATIONS_MANAGER,
          title: `Registration TAT breach · ${g.fullName}`,
          body: `Guard ${g.guardId} at ${g.branch.code} incomplete after ${ageDays} day(s). Escalate to GM Operations hierarchy.`,
          meta: { guardId: g.id, ageDays },
        });
      } else if (ageDays >= 4) {
        await this.notifications.create({
          role: UserRole.DIVISIONAL_HEAD_SECURITY,
          title: `Registration TAT 2nd escalation · ${g.fullName}`,
          body: `Guard ${g.guardId} still incomplete after ${ageDays} days. Escalate to Head Branch Banking Operations.`,
          meta: { guardId: g.id, ageDays },
        });
      }
    }
  }

  /** Document / CNIC / license expiry alerts. */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async expiryAlerts() {
    const until = new Date();
    until.setDate(until.getDate() + 30);

    const guards = await this.prisma.guard.findMany({
      where: {
        status: GuardStatus.ACTIVE,
        OR: [
          { cnicExpiryDate: { lte: until } },
          { licenseExpiryDate: { lte: until } },
        ],
      },
      include: { branch: true },
      take: 100,
    });

    if (!guards.length) return;

    await this.notifications.create({
      role: UserRole.SECURITY_ADMIN,
      title: `Expiry alerts · ${guards.length} guard(s)`,
      body: "CNIC or license documents expire within 30 days. Review Guards → Alerts.",
      meta: { count: guards.length },
    });

    this.logger.log(`Expiry alert notification created for ${guards.length} guards`);
  }
}
