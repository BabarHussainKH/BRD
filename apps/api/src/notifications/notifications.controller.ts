import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.forUser(user.id, user.role as UserRole);
  }

  @Patch(":id/read")
  read(@Param("id") id: string) {
    return this.notifications.markRead(id);
  }
}
