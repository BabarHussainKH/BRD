import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { InspectionRating, UserRole } from "@prisma/client";
import { InspectionsService } from "./inspections.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";

@Controller("inspections")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InspectionsController {
  constructor(private readonly inspections: InspectionsService) {}

  @Post()
  @Roles(UserRole.CLUSTER_SECURITY_HEAD, UserRole.SECURITY_ADMIN, UserRole.SUPER_ADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { branchId: string; guardRating: InspectionRating; observations: string },
  ) {
    return this.inspections.create(user, body);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query("openOnly") openOnly?: string,
    @Query("branchId") branchId?: string,
    @Query("rating") rating?: InspectionRating,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.inspections.list(user, {
      openOnly: openOnly === "true",
      branchId,
      rating,
      q,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Get("dashboard")
  dashboard(@CurrentUser() user: AuthUser) {
    return this.inspections.dashboard(user);
  }

  @Post(":id/action-plan")
  @Roles(UserRole.BRANCH_MANAGER, UserRole.BOM, UserRole.SUPER_ADMIN)
  actionPlan(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: { actionPlan: string },
  ) {
    return this.inspections.submitActionPlan(user, id, body.actionPlan);
  }
}
