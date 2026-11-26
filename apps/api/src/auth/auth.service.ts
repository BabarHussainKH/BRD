import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string, totpCode?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        cluster: { select: { id: true, code: true, name: true } },
        region: { select: { id: true, code: true, name: true } },
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    if (user.totpEnabled) {
      if (!totpCode || !user.totpSecret) {
        throw new UnauthorizedException("2FA code required");
      }
      const valid = authenticator.verify({ token: totpCode, secret: user.totpSecret });
      if (!valid) throw new UnauthorizedException("Invalid 2FA code");
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      clusterId: user.clusterId,
      regionId: user.regionId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        branchId: user.branchId,
        clusterId: user.clusterId,
        regionId: user.regionId,
        totpEnabled: user.totpEnabled,
        branch: user.branch,
        cluster: user.cluster,
        region: user.region,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        branchId: true,
        clusterId: true,
        regionId: true,
        totpEnabled: true,
        branch: { select: { id: true, code: true, name: true } },
        cluster: { select: { id: true, code: true, name: true } },
        region: { select: { id: true, code: true, name: true } },
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
