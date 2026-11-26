import { Body, Controller, Get, Post, Put, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("lov")
  lov(@Query("category") category?: string) {
    return this.admin.listLov(category);
  }

  @Post("lov")
  @Roles(UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN, UserRole.SYSTEM_ADMIN)
  upsertLov(@Body() body: { category: string; code: string; label: string; sortOrder?: number }) {
    return this.admin.upsertLov(body);
  }

  @Put("config")
  @Roles(UserRole.SUPER_ADMIN, UserRole.SYSTEM_ADMIN)
  setConfig(@Body() body: { key: string; value: unknown }) {
    return this.admin.setConfig(body.key, body.value);
  }

  @Get("config")
  getConfig(@Query("key") key: string) {
    return this.admin.getConfig(key);
  }

  @Get("vendors")
  vendors() {
    return this.admin.listVendors();
  }

  @Post("vendors")
  @Roles(UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN, UserRole.SYSTEM_ADMIN)
  createVendor(@Body() body: { name: string }) {
    return this.admin.createVendor(body.name);
  }

  @Get("branches")
  branches(
    @CurrentUser() user: AuthUser,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("all") all?: string,
  ) {
    return this.admin.listBranches(user, {
      q,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
      all: all === "true" || all === "1",
    });
  }

  @Get("org-summary")
  @Roles(UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.DIVISIONAL_HEAD_SECURITY)
  orgSummary() {
    return this.admin.orgSummary();
  }
}
