import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DocumentType } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

const MANDATORY: DocumentType[] = [
  DocumentType.DEPLOYMENT_LETTER,
  DocumentType.EMPLOYMENT_CARD,
  DocumentType.PASSPORT_PHOTO,
  DocumentType.POLICE_VERIFICATION,
  DocumentType.TRAINING_CERTIFICATE,
  DocumentType.CNIC_NADRA_VERISYS,
  DocumentType.LICENSE,
];

@Injectable()
export class DocumentsService {
  private readonly uploadDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    config: ConfigService,
  ) {
    this.uploadDir = path.resolve(config.get<string>("UPLOAD_DIR") ?? "./uploads");
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async upload(params: {
    userId: string;
    guardId: string;
    type: DocumentType;
    file: Express.Multer.File;
    expiryDate?: string;
  }) {
    const guard = await this.prisma.guard.findUnique({ where: { id: params.guardId } });
    if (!guard) throw new NotFoundException("Guard not found");

    const dir = path.join(this.uploadDir, params.guardId);
    fs.mkdirSync(dir, { recursive: true });
    const fileName = `${params.type}-${Date.now()}-${params.file.originalname}`;
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, params.file.buffer);

    const doc = await this.prisma.guardDocument.upsert({
      where: { guardId_type: { guardId: params.guardId, type: params.type } },
      create: {
        guardId: params.guardId,
        type: params.type,
        fileName: params.file.originalname,
        filePath,
        mimeType: params.file.mimetype,
        expiryDate: params.expiryDate ? new Date(params.expiryDate) : null,
      },
      update: {
        fileName: params.file.originalname,
        filePath,
        mimeType: params.file.mimetype,
        expiryDate: params.expiryDate ? new Date(params.expiryDate) : null,
      },
    });

    await this.audit.log({
      userId: params.userId,
      action: "UPLOAD",
      entity: "GuardDocument",
      entityId: doc.id,
      after: doc,
    });

    return doc;
  }

  async compliance(guardId: string) {
    const docs = await this.prisma.guardDocument.findMany({ where: { guardId } });
    const now = new Date();
    const present = new Set(docs.map((d) => d.type));
    const missing = MANDATORY.filter((t) => !present.has(t));
    const expired = docs.filter((d) => d.expiryDate && d.expiryDate < now).map((d) => d.type);
    const canDeploy = missing.length === 0 && expired.length === 0;

    return { guardId, missing, expired, canDeploy, documents: docs };
  }

  assertCanDeploy(compliance: { canDeploy: boolean; missing: DocumentType[]; expired: DocumentType[] }) {
    if (!compliance.canDeploy) {
      throw new BadRequestException({
        message: "Deployment blocked: missing or expired documents",
        missing: compliance.missing,
        expired: compliance.expired,
      });
    }
  }
}
