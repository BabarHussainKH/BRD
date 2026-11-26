-- AlterTable
ALTER TABLE `user` ADD COLUMN `clusterId` VARCHAR(191) NULL,
    ADD COLUMN `regionId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `User_clusterId_idx` ON `User`(`clusterId`);

-- CreateIndex
CREATE INDEX `User_regionId_idx` ON `User`(`regionId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_clusterId_fkey` FOREIGN KEY (`clusterId`) REFERENCES `Cluster`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
