import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApprovalStatus, AttendancePeriodStatus, ShiftType, UserRole } from "@prisma/client";
import { AttendanceService } from "./attendance.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";

@Controller("attendance")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post("periods")
  @Roles(UserRole.BRANCH_MANAGER, UserRole.BOM, UserRole.SUPER_ADMIN)
  ensure(@Body() body: { branchId: string; month: number; year: number }) {
    return this.attendance.ensurePeriod(body.branchId, body.month, body.year);
  }

  @Get("pending")
  pending(@Query("branchId") branchId?: string) {
    return this.attendance.listPending(branchId);
  }

  @Get("periods")
  periods(
    @CurrentUser() user: AuthUser,
    @Query("branchId") branchId?: string,
    @Query("status") status?: AttendancePeriodStatus,
    @Query("q") q?: string,
    @Query("year") year?: string,
    @Query("month") month?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.attendance.listPeriods(user, {
      branchId,
      status,
      q,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Get("change-requests")
  @Roles(
    UserRole.CLUSTER_SECURITY_HEAD,
    UserRole.SECURITY_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.DIVISIONAL_HEAD_SECURITY,
  )
  changeRequests(
    @CurrentUser() user: AuthUser,
    @Query("status") status?: ApprovalStatus,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.attendance.listChangeRequests(user, status ?? ApprovalStatus.PENDING, {
      q,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.attendance.getPeriod(id);
  }

  @Post(":id/draft")
  @Roles(UserRole.BRANCH_MANAGER, UserRole.BOM, UserRole.SUPER_ADMIN)
  draft(
    @Param("id") id: string,
    @Body()
    body: {
      entries: Array<{ guardId: string; fromDate: string; toDate: string; shift: ShiftType }>;
    },
  ) {
    return this.attendance.saveDraft(id, body.entries);
  }

  @Post(":id/submit")
  @Roles(UserRole.BRANCH_MANAGER, UserRole.BOM, UserRole.SUPER_ADMIN)
  submit(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.attendance.submit(id, user.id);
  }

  @Post(":id/change-request")
  @Roles(UserRole.BRANCH_MANAGER, UserRole.BOM, UserRole.SUPER_ADMIN)
  changeRequest(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { comment: string; payload: unknown },
  ) {
    return this.attendance.requestChange(id, user.id, body.comment, body.payload);
  }

  @Post("change-requests/:requestId/review")
  @Roles(
    UserRole.CLUSTER_SECURITY_HEAD,
    UserRole.SECURITY_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.DIVISIONAL_HEAD_SECURITY,
  )
  review(
    @Param("requestId") requestId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { approve: boolean; reviewComment?: string },
  ) {
    return this.attendance.reviewChange(requestId, user.id, body.approve, body.reviewComment);
  }
}
