import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ApprovalStatus, DeploymentRequestType, Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { DocumentsService } from "../documents/documents.service";
import { AuditService } from "../audit/audit.service";
import { AuthUser } from "../common/decorators/current-user.decorator";
import { normalizePage, pageResult } from "../common/pagination";
import { assertBranchInScope, branchScopeWhere } from "../common/scope";

const STEPS: UserRole[] = [
  UserRole.REGIONAL_OPERATIONS_MANAGER,
  UserRole.CLUSTER_SECURITY_HEAD,
  UserRole.DIVISIONAL_HEAD_SECURITY,
];

@Injectable()
export class DeploymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
    private readonly audit: AuditService,
  ) {}

  async create(
    user: AuthUser,
    data: {
      requestType: DeploymentRequestType;
      branchId: string;
      justification: string;
      guardId?: string | null;
    },
  ) {
    await assertBranchInScope(this.prisma, user, data.branchId);

    if (data.guardId) {
      const compliance = await this.documents.compliance(data.guardId);
      this.documents.assertCanDeploy(compliance);
    }

    const created = await this.prisma.deploymentRequest.create({
      data: {
        requestType: data.requestType,
        branchId: data.branchId,
        justification: data.justification,
        guardId: data.guardId ?? null,
        requesterId: user.id,
        status: ApprovalStatus.PENDING,
        currentStep: 1,
      },
    });

    await this.audit.log({
      userId: user.id,
      action: "CREATE",
      entity: "DeploymentRequest",
      entityId: created.id,
      after: created,
    });

    return created;
  }

  async list(
    user: AuthUser,
    query: {
      status?: ApprovalStatus;
      requestType?: DeploymentRequestType;
      branchId?: string;
      q?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const scope = branchScopeWhere(user);
    const { page, pageSize, skip, take } = normalizePage(query);
    const q = query.q?.trim();
    const where: Prisma.DeploymentRequestWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.requestType ? { requestType: query.requestType } : {}),
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(scope ? { branch: scope } : {}),
      ...(q
        ? {
            OR: [
              { justification: { contains: q } },
              { referenceId: { contains: q } },
              { deploymentId: { contains: q } },
              { branch: { OR: [{ code: { contains: q } }, { name: { contains: q } }] } },
              { guard: { fullName: { contains: q } } },
              { requester: { fullName: { contains: q } } },
            ],
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.deploymentRequest.count({ where }),
      this.prisma.deploymentRequest.findMany({
        where,
        include: {
          branch: true,
          guard: true,
          requester: { select: { id: true, fullName: true, role: true } },
          approvals: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return pageResult(items, total, page, pageSize);
  }

  async act(requestId: string, approverId: string, approve: boolean, comment?: string) {
    const req = await this.prisma.deploymentRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Deployment request not found");
    if (req.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException("Request is not pending");
    }

    await this.prisma.deploymentApproval.create({
      data: {
        requestId,
        step: req.currentStep,
        approverId,
        status: approve ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        comment,
        actedAt: new Date(),
      },
    });

    if (!approve) {
      return this.prisma.deploymentRequest.update({
        where: { id: requestId },
        data: { status: ApprovalStatus.REJECTED },
        include: { approvals: true },
      });
    }

    if (req.currentStep >= STEPS.length) {
      const referenceId = `DEP-REF-${Date.now()}`;
      const deploymentId = `DEP-${Date.now()}`;
      const final = await this.prisma.deploymentRequest.update({
        where: { id: requestId },
        data: {
          status: ApprovalStatus.APPROVED,
          referenceId,
          deploymentId,
        },
        include: { approvals: true, branch: true, guard: true },
      });

      await this.audit.log({
        userId: approverId,
        action: "APPROVE_FINAL",
        entity: "DeploymentRequest",
        entityId: requestId,
        after: final,
      });

      return final;
    }

    return this.prisma.deploymentRequest.update({
      where: { id: requestId },
      data: { currentStep: req.currentStep + 1 },
      include: { approvals: true },
    });
  }
}
