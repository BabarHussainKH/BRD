import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { DocumentType, UserRole } from "@prisma/client";
import { DocumentsService } from "./documents.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthUser } from "../common/decorators/current-user.decorator";

@Controller("documents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post(":guardId/upload")
  @Roles(UserRole.BRANCH_MANAGER, UserRole.BOM, UserRole.SUPER_ADMIN, UserRole.SECURITY_ADMIN)
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @CurrentUser() user: AuthUser,
    @Param("guardId") guardId: string,
    @Query("type") type: DocumentType,
    @Query("expiryDate") expiryDate: string | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documents.upload({
      userId: user.id,
      guardId,
      type,
      file,
      expiryDate,
    });
  }

  @Get(":guardId/compliance")
  compliance(@Param("guardId") guardId: string) {
    return this.documents.compliance(guardId);
  }
}
