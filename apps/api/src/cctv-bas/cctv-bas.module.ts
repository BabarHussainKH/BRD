import { Module } from "@nestjs/common";
import { CctvBasService } from "./cctv-bas.service";
import { CctvBasController } from "./cctv-bas.controller";

@Module({
  controllers: [CctvBasController],
  providers: [CctvBasService],
})
export class CctvBasModule {}
