import { Injectable } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    userId?: string;
    role?: UserRole;
    title: string;
    body: string;
    meta?: unknown;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        role: data.role,
        title: data.title,
        body: data.body,
        metaJson: (data.meta as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  forUser(userId: string, role: UserRole) {
    return this.prisma.notification.findMany({
      where: {
        OR: [{ userId }, { role }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
