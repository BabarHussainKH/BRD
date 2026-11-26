import { Module } from "@nestjs/common";
import { DocumentsModule } from "../documents/documents.module";
import { DeploymentService } from "./deployment.service";
import { DeploymentController } from "./deployment.controller";

@Module({
  imports: [DocumentsModule],
  controllers: [DeploymentController],
  providers: [DeploymentService],
})
export class DeploymentModule {}
