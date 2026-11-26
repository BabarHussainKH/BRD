import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ComplaintCategory, ComplaintStatus, RecorderType, UserRole, YesNo } from "@prisma/client";
import { CctvBasService } from "./cctv-bas.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";

@Controller("cctv-bas")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CctvBasController {
  constructor(private readonly cctvBas: CctvBasService) {}

  @Post("inventory")
  @Roles(UserRole.SECURITY_ADMIN, UserRole.SUPER_ADMIN, UserRole.CLUSTER_SECURITY_HEAD, UserRole.BRANCH_MANAGER)
  upsert(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      branchId: string;
      basVendorName: string;
      dedicatedPtclLine: YesNo;
      basSimNumber?: string;
      recorderType: RecorderType;
      cameraCount: number;
      recordingDays: number;
      warrantyStatus: YesNo;
      mirroringStatus: YesNo;
      installationDate?: string;
    },
  ) {
    return this.cctvBas.upsertInventory(user, body);
  }

  @Get("inventory")
  inventory(
    @CurrentUser() user: AuthUser,
    @Query("branchName") branchName?: string,
    @Query("branchCode") branchCode?: string,
    @Query("vendorName") vendorName?: string,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.cctvBas.listInventory(user, {
      branchName,
      branchCode,
      vendorName,
      q,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Post("complaints")
  @Roles(UserRole.BRANCH_MANAGER, UserRole.BOM, UserRole.SECURITY_ADMIN, UserRole.SUPER_ADMIN)
  createComplaint(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      branchId: string;
      complaintDate: string;
      ticketNumber: string;
      category: ComplaintCategory;
      comments?: string;
      resolutionDate?: string;
    },
  ) {
    return this.cctvBas.createComplaint(user, body);
  }

  @Get("complaints")
  complaints(
    @CurrentUser() user: AuthUser,
    @Query("status") status?: ComplaintStatus,
    @Query("category") category?: ComplaintCategory,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.cctvBas.listComplaints(user, {
      status,
      category,
      q,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Patch("complaints/:id/resolve")
  resolve(
    @Param("id") id: string,
    @Body() body: { resolutionDate: string; comments?: string },
  ) {
    return this.cctvBas.resolveComplaint(id, body.resolutionDate, body.comments);
  }
}
