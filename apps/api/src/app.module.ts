import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { GuardsModule } from "./guards/guards.module";
import { DocumentsModule } from "./documents/documents.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { DeploymentModule } from "./deployment/deployment.module";
import { InspectionsModule } from "./inspections/inspections.module";
import { CctvBasModule } from "./cctv-bas/cctv-bas.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { AdminModule } from "./admin/admin.module";
import { AuditModule } from "./audit/audit.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { JobsModule } from "./jobs/jobs.module";
import { ReportsModule } from "./reports/reports.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    PrismaModule,
    AuthModule,
    GuardsModule,
    DocumentsModule,
    AttendanceModule,
    DeploymentModule,
    InspectionsModule,
    CctvBasModule,
    DashboardModule,
    AdminModule,
    AuditModule,
    NotificationsModule,
    JobsModule,
    ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
