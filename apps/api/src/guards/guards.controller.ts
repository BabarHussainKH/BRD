import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole, GuardStatus } from "@prisma/client";
import { GuardsService } from "./guards.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";

@Controller("guards")
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuardsController {
  constructor(private readonly guards: GuardsService) {}

  @Post()
  @Roles(UserRole.BRANCH_MANAGER, UserRole.BOM, UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN)
  create(@CurrentUser() user: AuthUser, @Body() body: Parameters<GuardsService["create"]>[1]) {
    return this.guards.create(user, body);
  }

  @Get()
  search(
    @CurrentUser() user: AuthUser,
    @Query("q") q?: string,
    @Query("name") name?: string,
    @Query("cnicNumber") cnicNumber?: string,
    @Query("location") location?: string,
    @Query("status") status?: GuardStatus,
    @Query("vendorId") vendorId?: string,
    @Query("branchId") branchId?: string,
    @Query("policeVerification") policeVerification?: "YES" | "NO",
    @Query("nadraVerisys") nadraVerisys?: "YES" | "NO",
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.guards.search(user, {
      q,
      name,
      cnicNumber,
      location,
      status,
      vendorId,
      branchId,
      policeVerification,
      nadraVerisys,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Get("alerts/expiring")
  expiring(@CurrentUser() user: AuthUser, @Query("withinDays") withinDays?: string) {
    return this.guards.expiringSoon(user, withinDays ? Number(withinDays) : 30);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.guards.findOne(user, id);
  }

  @Patch(":id/status")
  @Roles(UserRole.BRANCH_MANAGER, UserRole.BOM, UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN)
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: { status: GuardStatus },
  ) {
    return this.guards.updateStatus(user, id, body.status);
  }
}
