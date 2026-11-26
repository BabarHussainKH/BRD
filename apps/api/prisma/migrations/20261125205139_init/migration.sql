-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'SECURITY_ADMIN', 'SYSTEM_ADMIN', 'BRANCH_MANAGER', 'BOM', 'DISTRICT_OPERATIONS_MANAGER', 'REGIONAL_OPERATIONS_MANAGER', 'CLUSTER_SECURITY_HEAD', 'DIVISIONAL_HEAD_SECURITY') NOT NULL,
    `branchId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `totpSecret` VARCHAR(191) NULL,
    `totpEnabled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Region` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Region_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cluster` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `regionId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cluster_code_key`(`code`),
    INDEX `Cluster_regionId_idx`(`regionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Branch` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `clusterId` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Branch_code_key`(`code`),
    INDEX `Branch_clusterId_idx`(`clusterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vendor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Vendor_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Guard` (
    `id` VARCHAR(191) NOT NULL,
    `guardId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `cnicNumber` VARCHAR(191) NOT NULL,
    `cnicExpiryDate` DATETIME(3) NOT NULL,
    `contactMobile` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `weaponType` VARCHAR(191) NOT NULL,
    `licenseExpiryDate` DATETIME(3) NULL,
    `guardCategory` ENUM('EX_SERVICE_MAN', 'CIVILIAN') NOT NULL,
    `deploymentCategory` ENUM('PERMANENT', 'REPLACEMENT', 'TEMPORARY') NOT NULL,
    `deploymentLocation` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `dateOfJoining` DATETIME(3) NOT NULL,
    `trainingStatus` ENUM('YES', 'NO') NOT NULL,
    `policeVerification` ENUM('YES', 'NO') NOT NULL,
    `nadraVerisys` ENUM('YES', 'NO') NOT NULL,
    `status` ENUM('ACTIVE', 'REPLACED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    `initiatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Guard_guardId_key`(`guardId`),
    UNIQUE INDEX `Guard_cnicNumber_key`(`cnicNumber`),
    INDEX `Guard_branchId_idx`(`branchId`),
    INDEX `Guard_vendorId_idx`(`vendorId`),
    INDEX `Guard_status_idx`(`status`),
    INDEX `Guard_fullName_idx`(`fullName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuardFamilyMember` (
    `id` VARCHAR(191) NOT NULL,
    `guardId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cnicNumber` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `relation` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GuardFamilyMember_guardId_idx`(`guardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuardDocument` (
    `id` VARCHAR(191) NOT NULL,
    `guardId` VARCHAR(191) NOT NULL,
    `type` ENUM('DEPLOYMENT_LETTER', 'EMPLOYMENT_CARD', 'PASSPORT_PHOTO', 'POLICE_VERIFICATION', 'TRAINING_CERTIFICATE', 'CNIC_NADRA_VERISYS', 'LICENSE') NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NULL,
    `expiryDate` DATETIME(3) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GuardDocument_expiryDate_idx`(`expiryDate`),
    UNIQUE INDEX `GuardDocument_guardId_type_key`(`guardId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendancePeriod` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'DRAFT', 'SUBMITTED', 'CHANGE_REQUESTED') NOT NULL DEFAULT 'PENDING',
    `submittedAt` DATETIME(3) NULL,
    `submittedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AttendancePeriod_status_idx`(`status`),
    UNIQUE INDEX `AttendancePeriod_branchId_month_year_key`(`branchId`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceEntry` (
    `id` VARCHAR(191) NOT NULL,
    `periodId` VARCHAR(191) NOT NULL,
    `guardId` VARCHAR(191) NOT NULL,
    `fromDate` DATETIME(3) NOT NULL,
    `toDate` DATETIME(3) NOT NULL,
    `shift` ENUM('DAY', 'NIGHT') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AttendanceEntry_periodId_idx`(`periodId`),
    INDEX `AttendanceEntry_guardId_idx`(`guardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceChangeRequest` (
    `id` VARCHAR(191) NOT NULL,
    `periodId` VARCHAR(191) NOT NULL,
    `requestedById` VARCHAR(191) NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewedById` VARCHAR(191) NULL,
    `reviewComment` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `payloadJson` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AttendanceChangeRequest_periodId_idx`(`periodId`),
    INDEX `AttendanceChangeRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeploymentRequest` (
    `id` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `deploymentId` VARCHAR(191) NULL,
    `requestType` ENUM('NEW', 'REPLACEMENT', 'ADDITIONAL') NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `guardId` VARCHAR(191) NULL,
    `justification` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `currentStep` INTEGER NOT NULL DEFAULT 1,
    `requesterId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeploymentRequest_referenceId_key`(`referenceId`),
    UNIQUE INDEX `DeploymentRequest_deploymentId_key`(`deploymentId`),
    INDEX `DeploymentRequest_branchId_idx`(`branchId`),
    INDEX `DeploymentRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeploymentApproval` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `step` INTEGER NOT NULL,
    `approverId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `comment` VARCHAR(191) NULL,
    `actedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DeploymentApproval_approverId_idx`(`approverId`),
    UNIQUE INDEX `DeploymentApproval_requestId_step_key`(`requestId`, `step`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inspection` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `submittedById` VARCHAR(191) NOT NULL,
    `guardRating` ENUM('ABOVE_ACCEPTABLE', 'ACCEPTABLE', 'MARGINAL_ACCEPTABLE', 'BELOW_ACCEPTABLE') NOT NULL,
    `observations` TEXT NOT NULL,
    `actionPlan` TEXT NULL,
    `actionPlanAt` DATETIME(3) NULL,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Inspection_branchId_idx`(`branchId`),
    INDEX `Inspection_isClosed_idx`(`isClosed`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CctvBasInventory` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `basVendorName` VARCHAR(191) NOT NULL,
    `dedicatedPtclLine` ENUM('YES', 'NO') NOT NULL,
    `basSimNumber` VARCHAR(191) NULL,
    `recorderType` ENUM('DVR', 'NVR') NOT NULL,
    `cameraCount` INTEGER NOT NULL,
    `recordingDays` INTEGER NOT NULL,
    `warrantyStatus` ENUM('YES', 'NO') NOT NULL,
    `mirroringStatus` ENUM('YES', 'NO') NOT NULL,
    `installationDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CctvBasInventory_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Complaint` (
    `id` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `complaintDate` DATETIME(3) NOT NULL,
    `ticketNumber` VARCHAR(191) NOT NULL,
    `category` ENUM('BAS', 'CCTV') NOT NULL,
    `status` ENUM('OPENED', 'CLOSED') NOT NULL DEFAULT 'OPENED',
    `resolutionDate` DATETIME(3) NULL,
    `comments` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Complaint_branchId_idx`(`branchId`),
    INDEX `Complaint_status_idx`(`status`),
    INDEX `Complaint_ticketNumber_idx`(`ticketNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LovItem` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LovItem_category_idx`(`category`),
    UNIQUE INDEX `LovItem_category_code_key`(`category`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemConfig` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemConfig_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `beforeJson` JSON NULL,
    `afterJson` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `role` ENUM('SUPER_ADMIN', 'SECURITY_ADMIN', 'SYSTEM_ADMIN', 'BRANCH_MANAGER', 'BOM', 'DISTRICT_OPERATIONS_MANAGER', 'REGIONAL_OPERATIONS_MANAGER', 'CLUSTER_SECURITY_HEAD', 'DIVISIONAL_HEAD_SECURITY') NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `metaJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_idx`(`userId`),
    INDEX `Notification_role_idx`(`role`),
    INDEX `Notification_isRead_idx`(`isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cluster` ADD CONSTRAINT `Cluster_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Branch` ADD CONSTRAINT `Branch_clusterId_fkey` FOREIGN KEY (`clusterId`) REFERENCES `Cluster`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Guard` ADD CONSTRAINT `Guard_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Guard` ADD CONSTRAINT `Guard_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Guard` ADD CONSTRAINT `Guard_initiatorId_fkey` FOREIGN KEY (`initiatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuardFamilyMember` ADD CONSTRAINT `GuardFamilyMember_guardId_fkey` FOREIGN KEY (`guardId`) REFERENCES `Guard`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuardDocument` ADD CONSTRAINT `GuardDocument_guardId_fkey` FOREIGN KEY (`guardId`) REFERENCES `Guard`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendancePeriod` ADD CONSTRAINT `AttendancePeriod_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendancePeriod` ADD CONSTRAINT `AttendancePeriod_submittedById_fkey` FOREIGN KEY (`submittedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceEntry` ADD CONSTRAINT `AttendanceEntry_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `AttendancePeriod`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceEntry` ADD CONSTRAINT `AttendanceEntry_guardId_fkey` FOREIGN KEY (`guardId`) REFERENCES `Guard`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceChangeRequest` ADD CONSTRAINT `AttendanceChangeRequest_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `AttendancePeriod`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceChangeRequest` ADD CONSTRAINT `AttendanceChangeRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceChangeRequest` ADD CONSTRAINT `AttendanceChangeRequest_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeploymentRequest` ADD CONSTRAINT `DeploymentRequest_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeploymentRequest` ADD CONSTRAINT `DeploymentRequest_guardId_fkey` FOREIGN KEY (`guardId`) REFERENCES `Guard`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeploymentRequest` ADD CONSTRAINT `DeploymentRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeploymentApproval` ADD CONSTRAINT `DeploymentApproval_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `DeploymentRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeploymentApproval` ADD CONSTRAINT `DeploymentApproval_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inspection` ADD CONSTRAINT `Inspection_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inspection` ADD CONSTRAINT `Inspection_submittedById_fkey` FOREIGN KEY (`submittedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CctvBasInventory` ADD CONSTRAINT `CctvBasInventory_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
