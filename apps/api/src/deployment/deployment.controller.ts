import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApprovalStatus, DeploymentRequestType, UserRole } from "@prisma/client";
import { DeploymentService } from "./deployment.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";

@Controller("deployment")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeploymentController {
  constructor(private readonly deployment: DeploymentService) {}

  @Post()
  @Roles(UserRole.BRANCH_MANAGER, UserRole.BOM, UserRole.SUPER_ADMIN)
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      requestType: DeploymentRequestType;
      branchId: string;
      justification: string;
      guardId?: string;
    },
  ) {
    return this.deployment.create(user, body);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query("status") status?: ApprovalStatus,
    @Query("requestType") requestType?: DeploymentRequestType,
    @Query("branchId") branchId?: string,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    return this.deployment.list(user, {
      status,
      requestType,
      branchId,
      q,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Post(":id/act")
  @Roles(
    UserRole.REGIONAL_OPERATIONS_MANAGER,
    UserRole.DISTRICT_OPERATIONS_MANAGER,
    UserRole.CLUSTER_SECURITY_HEAD,
    UserRole.DIVISIONAL_HEAD_SECURITY,
    UserRole.SUPER_ADMIN,
  )
  act(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { approve: boolean; comment?: string },
  ) {
    return this.deployment.act(id, user.id, body.approve, body.comment);
  }
}
