import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";

@Controller("reports")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get("guards-strength")
  guardsStrength(@CurrentUser() user: AuthUser) {
    return this.reports.guardsStrength(user);
  }

  @Get("attendance-compliance")
  attendance(@CurrentUser() user: AuthUser) {
    return this.reports.attendanceCompliance(user);
  }

  @Get("expiry-alerts")
  expiry(@CurrentUser() user: AuthUser) {
    return this.reports.expiryAlerts(user);
  }

  @Get("inspections")
  inspections(@CurrentUser() user: AuthUser) {
    return this.reports.inspectionScores(user);
  }

  @Get("cctv-bas")
  cctv(@CurrentUser() user: AuthUser) {
    return this.reports.cctvVendorPerformance(user);
  }

  @Get("export")
  async export(
    @CurrentUser() user: AuthUser,
    @Query("type") type = "guards-strength",
    @Res() res: Response,
  ) {
    let rows: Array<Record<string, unknown>> = [];
    if (type === "guards-strength") {
      rows = await this.reports.guardsStrength(user);
    } else if (type === "expiry-alerts") {
      const data = await this.reports.expiryAlerts(user);
      rows = data.map((g) => ({
        guardId: g.guardId,
        fullName: g.fullName,
        cnic: g.cnicNumber,
        cnicExpiry: g.cnicExpiryDate.toISOString().slice(0, 10),
        licenseExpiry: g.licenseExpiryDate?.toISOString().slice(0, 10) ?? "",
        branch: g.branch?.code,
        vendor: g.vendor?.name,
      }));
    } else if (type === "attendance") {
      const data = await this.reports.attendanceCompliance(user);
      rows = data.map((p) => ({
        month: p.month,
        year: p.year,
        status: p.status,
        branch: p.branch.code,
        region: p.branch.cluster.region.name,
      }));
    } else if (type === "inspections") {
      const data = await this.reports.inspectionScores(user);
      rows = data.map((i) => ({
        branch: i.branch.code,
        rating: i.guardRating,
        closed: i.isClosed,
        createdAt: i.createdAt.toISOString().slice(0, 10),
      }));
    }
    const csv = this.reports.toCsv(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="sms-${type}.csv"`);
    res.send(csv);
  }
}
