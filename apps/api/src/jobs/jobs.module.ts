import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { NotificationsModule } from "../notifications/notifications.module";
import { EscalationService } from "./escalation.service";

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule],
  providers: [EscalationService],
})
export class JobsModule {}
