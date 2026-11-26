import {
  ApprovalStatus,
  AttendancePeriodStatus,
  ComplaintCategory,
  ComplaintStatus,
  DeploymentCategory,
  DeploymentRequestType,
  DocumentType,
  GuardCategory,
  GuardStatus,
  InspectionRating,
  PrismaClient,
  RecorderType,
  ShiftType,
  UserRole,
  YesNo,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const TARGET_BRANCHES = 1933;
const DOC_TYPES = Object.values(DocumentType);

function daysFromNow(days: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function formatCnic(n: number) {
  const s = String(n).padStart(13, "0");
  return `${s.slice(0, 5)}-${s.slice(5, 12)}-${s.slice(12)}`;
}

function ensurePlaceholderFile(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `Dummy document\n${new Date().toISOString()}\n`);
  }
}

async function createManyBatched<T extends object>(
  label: string,
  rows: T[],
  batchSize: number,
  fn: (chunk: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    await fn(chunk);
    if ((i / batchSize) % 5 === 0) {
      console.log(`  ${label}: ${Math.min(i + batchSize, rows.length)} / ${rows.length}`);
    }
  }
}

async function main() {
  console.log("Seeding UBL-scale SMS dataset...");

  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.cctvBasInventory.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.deploymentApproval.deleteMany();
  await prisma.deploymentRequest.deleteMany();
  await prisma.attendanceChangeRequest.deleteMany();
  await prisma.attendanceEntry.deleteMany();
  await prisma.attendancePeriod.deleteMany();
  await prisma.guardDocument.deleteMany();
  await prisma.guardFamilyMember.deleteMany();
  await prisma.guard.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.user.updateMany({ data: { branchId: null, clusterId: null, regionId: null } });
  await prisma.branch.deleteMany();
  await prisma.cluster.deleteMany();
  await prisma.region.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.lovItem.deleteMany();
  await prisma.user.deleteMany();

  const regionDefs = [
    { code: "R-KHI-S", name: "Karachi South" },
    { code: "R-KHI-C", name: "Karachi Central" },
    { code: "R-SINDH", name: "Sindh (ex-Karachi)" },
    { code: "R-BAL", name: "Balochistan" },
    { code: "R-PUN-N", name: "Punjab North" },
    { code: "R-PUN-C", name: "Punjab Central" },
    { code: "R-PUN-S", name: "Punjab South" },
    { code: "R-ISB", name: "Islamabad / Rawalpindi" },
    { code: "R-KP", name: "Khyber Pakhtunkhwa" },
    { code: "R-GB-AJ", name: "GB / AJK" },
  ];

  const regions = [];
  for (const r of regionDefs) {
    regions.push(await prisma.region.create({ data: r }));
  }

  // ~8 clusters per region => 80 clusters
  const clusters = [];
  let clusterSeq = 1;
  for (const region of regions) {
    for (let i = 1; i <= 8; i++) {
      const code = `C-${String(clusterSeq).padStart(3, "0")}`;
      clusters.push(
        await prisma.cluster.create({
          data: {
            code,
            name: `${region.name} Cluster ${i}`,
            regionId: region.id,
          },
        }),
      );
      clusterSeq++;
    }
  }

  // Distribute 1933 branches across clusters
  const branchRows: Array<{
    id?: string;
    code: string;
    name: string;
    clusterId: string;
    address: string;
    isActive: boolean;
  }> = [];
  for (let i = 1; i <= TARGET_BRANCHES; i++) {
    const cluster = clusters[(i - 1) % clusters.length];
    const code = `BR-${String(i).padStart(4, "0")}`;
    const specialNames: Record<number, string> = {
      1: "Clifton Branch",
      2: "Saddar Branch",
      3: "Gulshan-e-Iqbal Branch",
      4: "Hyderabad Main Branch",
      5: "F-7 Markaz Branch",
      6: "Blue Area Branch",
      7: "Gulberg Branch",
      8: "DHA Lahore Branch",
      9: "Peshawar Cantt Branch",
      10: "Quetta Main Branch",
    };
    branchRows.push({
      code,
      name: specialNames[i] ?? `UBL Branch ${code}`,
      clusterId: cluster.id,
      address: `${specialNames[i] ?? code}, Pakistan`,
      isActive: true,
    });
  }

  console.log("Creating branches...");
  await createManyBatched("branches", branchRows, 250, (chunk) =>
    prisma.branch.createMany({ data: chunk }),
  );

  const branches = await prisma.branch.findMany({
    orderBy: { code: "asc" },
    include: { cluster: true },
  });
  const branchByCode = new Map(branches.map((b) => [b.code, b]));

  const vendorNames = [
    "SecureForce Pvt Ltd",
    "Pak Guards Security Services",
    "Falcon Protection Co.",
    "Shield Security Solutions",
    "National Security Corps",
  ];
  const vendors = [];
  for (const name of vendorNames) {
    vendors.push(await prisma.vendor.create({ data: { name } }));
  }

  const passwordHash = await bcrypt.hash("Password@123", 10);

  // Demo / role users with real scope
  const clifton = branchByCode.get("BR-0001")!;
  const saddar = branchByCode.get("BR-0002")!;
  const gulberg = branchByCode.get("BR-0007")!;
  const f7 = branchByCode.get("BR-0005")!;
  const karachiSouth = regions.find((r) => r.code === "R-KHI-S")!;
  const punjabCentral = regions.find((r) => r.code === "R-PUN-C")!;
  const isbRegion = regions.find((r) => r.code === "R-ISB")!;
  const cliftonCluster = clusters.find((c) => c.id === clifton.clusterId)!;

  const usersToCreate = [
    {
      email: "superadmin@sms.local",
      fullName: "Nasir Mahmood",
      role: UserRole.SUPER_ADMIN,
    },
    {
      email: "security.admin@sms.local",
      fullName: "Ayesha Khan",
      role: UserRole.SECURITY_ADMIN,
    },
    {
      email: "sysadmin@sms.local",
      fullName: "IT System Admin",
      role: UserRole.SYSTEM_ADMIN,
    },
    {
      email: "head.security@sms.local",
      fullName: "Maj. (R) Tariq Mehmood",
      role: UserRole.DIVISIONAL_HEAD_SECURITY,
    },
    {
      email: "roh.karachi@sms.local",
      fullName: "Kamran Shah (ROH Karachi South)",
      role: UserRole.REGIONAL_OPERATIONS_MANAGER,
      regionId: karachiSouth.id,
    },
    {
      email: "roh.punjab@sms.local",
      fullName: "Sajid Anwar (ROH Punjab Central)",
      role: UserRole.REGIONAL_OPERATIONS_MANAGER,
      regionId: punjabCentral.id,
    },
    {
      email: "dom.isb@sms.local",
      fullName: "Bilal Ahmed (DOM Islamabad)",
      role: UserRole.DISTRICT_OPERATIONS_MANAGER,
      regionId: isbRegion.id,
    },
    {
      email: "cluster.security@sms.local",
      fullName: "Hina Parveen (Cluster Security)",
      role: UserRole.CLUSTER_SECURITY_HEAD,
      clusterId: cliftonCluster.id,
    },
    {
      email: "bm.clifton@sms.local",
      fullName: "Imran Siddiqui (BM Clifton)",
      role: UserRole.BRANCH_MANAGER,
      branchId: clifton.id,
    },
    {
      email: "bom.clifton@sms.local",
      fullName: "Sana Malik (BOM Clifton)",
      role: UserRole.BOM,
      branchId: clifton.id,
    },
    {
      email: "bm.saddar@sms.local",
      fullName: "Farah Qureshi (BM Saddar)",
      role: UserRole.BRANCH_MANAGER,
      branchId: saddar.id,
    },
    {
      email: "bom.saddar@sms.local",
      fullName: "Ali Raza (BOM Saddar)",
      role: UserRole.BOM,
      branchId: saddar.id,
    },
    {
      email: "bm.gulberg@sms.local",
      fullName: "Usman Raza (BM Gulberg)",
      role: UserRole.BRANCH_MANAGER,
      branchId: gulberg.id,
    },
    {
      email: "bm.f7@sms.local",
      fullName: "Nadia Hussain (BM F-7)",
      role: UserRole.BRANCH_MANAGER,
      branchId: f7.id,
    },
    // aliases expected by older docs
    {
      email: "bm@sms.local",
      fullName: "Imran Siddiqui (BM Clifton)",
      role: UserRole.BRANCH_MANAGER,
      branchId: clifton.id,
    },
    {
      email: "bom@sms.local",
      fullName: "Sana Malik (BOM Clifton)",
      role: UserRole.BOM,
      branchId: clifton.id,
    },
    {
      email: "roh@sms.local",
      fullName: "Kamran Shah (ROH Karachi South)",
      role: UserRole.REGIONAL_OPERATIONS_MANAGER,
      regionId: karachiSouth.id,
    },
  ];

  const usersByEmail: Record<string, { id: string; branchId: string | null }> = {};
  for (const u of usersToCreate) {
    const row = await prisma.user.create({
      data: {
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        passwordHash,
        branchId: u.branchId ?? null,
        clusterId: u.clusterId ?? null,
        regionId: u.regionId ?? null,
      },
    });
    usersByEmail[u.email] = { id: row.id, branchId: row.branchId };
  }

  const bm = usersByEmail["bm.clifton@sms.local"];

  const lovs = [
    { category: "DEPLOYMENT_CATEGORY", code: "PERMANENT", label: "Permanent" },
    { category: "DEPLOYMENT_CATEGORY", code: "REPLACEMENT", label: "Replacement" },
    { category: "DEPLOYMENT_CATEGORY", code: "TEMPORARY", label: "Temporary" },
    { category: "GUARD_STATUS", code: "ACTIVE", label: "Active" },
    { category: "GUARD_STATUS", code: "REPLACED", label: "Replaced" },
    { category: "GUARD_STATUS", code: "TERMINATED", label: "Terminated" },
    { category: "TRAINING_STATUS", code: "YES", label: "Yes" },
    { category: "TRAINING_STATUS", code: "NO", label: "No" },
    { category: "WEAPON_TYPE", code: "RIFLE", label: "Rifle" },
    { category: "WEAPON_TYPE", code: "PISTOL", label: "Pistol" },
    { category: "WEAPON_TYPE", code: "SHOTGUN", label: "Shotgun" },
  ];
  await prisma.lovItem.createMany({
    data: lovs.map((l, i) => ({ ...l, sortOrder: i })),
  });

  await prisma.systemConfig.createMany({
    data: [
      {
        key: "attendance_escalation",
        value: {
          day1Reminder: true,
          day2Reminder: true,
          day3: "DISTRICT_OPERATIONS_MANAGER",
          day4: "REGIONAL_OPERATIONS_MANAGER",
        },
      },
      {
        key: "registration_tat",
        value: {
          workingDays: 1,
          firstEscalation: "GENERAL_MANAGER_OPERATIONS",
          secondEscalationAfterExtraDays: 3,
          secondEscalation: "HEAD_BRANCH_BANKING_OPERATIONS",
        },
      },
    ],
  });

  // Minimum 2 guards/branch (some 3) => ~4k guards
  console.log("Creating guards (min 2 per branch)...");
  const firstNames = [
    "Muhammad", "Ahmed", "Ali", "Hassan", "Hussain", "Omar", "Bilal", "Usman", "Imran", "Shahid",
    "Naeem", "Asif", "Javed", "Tariq", "Waqas", "Kashif", "Sohail", "Rashid", "Ghulam", "Abdul",
  ];
  const lastNames = [
    "Khan", "Ali", "Ahmed", "Hussain", "Malik", "Raza", "Iqbal", "Shah", "Akhtar", "Mehmood",
    "Nawaz", "Qureshi", "Siddiqui", "Butt", "Sheikh", "Abbas", "Rehman", "Yousaf", "Aslam", "Farooq",
  ];
  const weapons = ["Rifle", "Pistol", "Shotgun"];
  const locations = ["Main Entrance", "ATM Lobby", "Cash Hall", "Parking Gate", "Strong Room Corridor"];

  let cnicCounter = 4210170000001;
  const guardRows: Array<{
    id?: string;
    guardId: string;
    fullName: string;
    cnicNumber: string;
    cnicExpiryDate: Date;
    contactMobile: string;
    vendorId: string;
    weaponType: string;
    licenseExpiryDate: Date;
    guardCategory: GuardCategory;
    deploymentCategory: DeploymentCategory;
    deploymentLocation: string;
    branchId: string;
    dateOfJoining: Date;
    trainingStatus: YesNo;
    policeVerification: YesNo;
    nadraVerisys: YesNo;
    status: GuardStatus;
    initiatorId: string;
  }> = [];

  for (let bi = 0; bi < branches.length; bi++) {
    const branch = branches[bi];
    const guardsHere = bi % 7 === 0 ? 3 : 2; // ~14% branches get 3 guards
    for (let g = 0; g < guardsHere; g++) {
      const cnicNum = cnicCounter++;
      const cnic = formatCnic(cnicNum);
      const fn = firstNames[(bi + g) % firstNames.length];
      const ln = lastNames[(bi * 3 + g) % lastNames.length];
      guardRows.push({
        guardId: cnic.replace(/\D/g, ""),
        fullName: `${fn} ${ln}`,
        cnicNumber: cnic,
        cnicExpiryDate: daysFromNow(180 + ((bi + g) % 400)),
        contactMobile: `03${String(100000000 + ((bi * 10 + g) % 89999999)).slice(0, 9)}`,
        vendorId: vendors[(bi + g) % vendors.length].id,
        weaponType: weapons[(bi + g) % weapons.length],
        licenseExpiryDate: daysFromNow(90 + ((bi + g) % 300)),
        guardCategory: (bi + g) % 3 === 0 ? GuardCategory.EX_SERVICE_MAN : GuardCategory.CIVILIAN,
        deploymentCategory:
          g === 2 ? DeploymentCategory.TEMPORARY : DeploymentCategory.PERMANENT,
        deploymentLocation: locations[(bi + g) % locations.length],
        branchId: branch.id,
        dateOfJoining: daysFromNow(-30 - ((bi + g) % 400)),
        trainingStatus: YesNo.YES,
        policeVerification: YesNo.YES,
        nadraVerisys: YesNo.YES,
        status: GuardStatus.ACTIVE,
        initiatorId: bm.id,
      });
    }
  }

  await createManyBatched("guards", guardRows, 400, (chunk) =>
    prisma.guard.createMany({ data: chunk }),
  );

  // Enrich demo branches with family, docs, workflows
  console.log("Enriching demo branches with documents & workflows...");
  const demoBranchCodes = ["BR-0001", "BR-0002", "BR-0005", "BR-0007"];
  const uploadRoot = path.resolve(__dirname, "../uploads");
  const demoGuards = await prisma.guard.findMany({
    where: { branch: { code: { in: demoBranchCodes } } },
    include: { branch: true },
    take: 40,
  });

  for (const guard of demoGuards.slice(0, 24)) {
    await prisma.guardFamilyMember.create({
      data: {
        guardId: guard.id,
        name: `Family of ${guard.fullName.split(" ")[0]}`,
        relation: "Spouse",
        cnicNumber: formatCnic(cnicCounter++),
        dateOfBirth: daysFromNow(-10000),
      },
    });
    for (const type of DOC_TYPES) {
      const filePath = path.join(uploadRoot, guard.id, `${type}.txt`);
      ensurePlaceholderFile(filePath);
      await prisma.guardDocument.create({
        data: {
          guardId: guard.id,
          type,
          fileName: `${type.toLowerCase()}.pdf`,
          filePath,
          mimeType: "application/pdf",
          expiryDate:
            type === DocumentType.LICENSE || type === DocumentType.CNIC_NADRA_VERISYS
              ? guard.licenseExpiryDate
              : null,
        },
      });
    }
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const cliftonGuards = demoGuards.filter((g) => g.branch.code === "BR-0001");

  const submitted = await prisma.attendancePeriod.create({
    data: {
      branchId: clifton.id,
      month: month === 1 ? 12 : month - 1,
      year: month === 1 ? year - 1 : year,
      status: AttendancePeriodStatus.SUBMITTED,
      submittedAt: daysFromNow(-18),
      submittedById: bm.id,
    },
  });
  for (const g of cliftonGuards) {
    await prisma.attendanceEntry.create({
      data: {
        periodId: submitted.id,
        guardId: g.id,
        fromDate: daysFromNow(-45),
        toDate: daysFromNow(-20),
        shift: ShiftType.DAY,
      },
    });
  }
  await prisma.attendancePeriod.create({
    data: { branchId: clifton.id, month, year, status: AttendancePeriodStatus.DRAFT },
  });
  await prisma.attendancePeriod.create({
    data: { branchId: saddar.id, month, year, status: AttendancePeriodStatus.PENDING },
  });

  const readyGuard = cliftonGuards[0];
  if (readyGuard) {
    const dep = await prisma.deploymentRequest.create({
      data: {
        requestType: DeploymentRequestType.NEW,
        branchId: clifton.id,
        guardId: readyGuard.id,
        justification: "Permanent deployment confirmed after document compliance for Clifton main entrance.",
        status: ApprovalStatus.APPROVED,
        currentStep: 3,
        requesterId: bm.id,
        referenceId: "DEP-REF-2026-0001",
        deploymentId: "DEP-2026-0001",
      },
    });
    await prisma.deploymentApproval.createMany({
      data: [
        {
          requestId: dep.id,
          step: 1,
          approverId: usersByEmail["roh.karachi@sms.local"].id,
          status: ApprovalStatus.APPROVED,
          comment: "Recommended",
          actedAt: daysFromNow(-10),
        },
        {
          requestId: dep.id,
          step: 2,
          approverId: usersByEmail["cluster.security@sms.local"].id,
          status: ApprovalStatus.APPROVED,
          comment: "Docs OK",
          actedAt: daysFromNow(-8),
        },
        {
          requestId: dep.id,
          step: 3,
          approverId: usersByEmail["head.security@sms.local"].id,
          status: ApprovalStatus.APPROVED,
          comment: "Final approval",
          actedAt: daysFromNow(-7),
        },
      ],
    });
    await prisma.deploymentRequest.create({
      data: {
        requestType: DeploymentRequestType.REPLACEMENT,
        branchId: clifton.id,
        justification: "Night shift replacement required due to medical leave.",
        status: ApprovalStatus.PENDING,
        currentStep: 1,
        requesterId: bm.id,
      },
    });
  }

  await prisma.inspection.createMany({
    data: [
      {
        branchId: clifton.id,
        submittedById: usersByEmail["cluster.security@sms.local"].id,
        guardRating: InspectionRating.ACCEPTABLE,
        observations: "Access control satisfactory. Recommend refresher on visitor logging.",
        actionPlan: "Briefing completed for day/night teams.",
        actionPlanAt: daysFromNow(-2),
        isClosed: true,
      },
      {
        branchId: saddar.id,
        submittedById: usersByEmail["cluster.security@sms.local"].id,
        guardRating: InspectionRating.MARGINAL_ACCEPTABLE,
        observations: "CCTV blind spot near parking exit. Peak-hour posture needs improvement.",
        isClosed: false,
      },
    ],
  });

  for (const code of demoBranchCodes) {
    const b = branchByCode.get(code)!;
    await prisma.cctvBasInventory.create({
      data: {
        branchId: b.id,
        basVendorName: "AlarmTech Pakistan",
        dedicatedPtclLine: YesNo.YES,
        basSimNumber: `0300${code.replace(/\D/g, "").slice(-7)}`,
        recorderType: RecorderType.NVR,
        cameraCount: 16,
        recordingDays: 45,
        warrantyStatus: YesNo.YES,
        mirroringStatus: YesNo.YES,
        installationDate: daysFromNow(-400),
      },
    });
  }

  await prisma.complaint.createMany({
    data: [
      {
        branchId: clifton.id,
        complaintDate: daysFromNow(-5),
        ticketNumber: "TKT-90001",
        category: ComplaintCategory.CCTV,
        status: ComplaintStatus.CLOSED,
        resolutionDate: daysFromNow(-3),
        comments: "Camera-03 restored",
      },
      {
        branchId: saddar.id,
        complaintDate: daysFromNow(-1),
        ticketNumber: "TKT-90022",
        category: ComplaintCategory.BAS,
        status: ComplaintStatus.OPENED,
        comments: "BAS intermittent on PTCL line",
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        role: UserRole.BRANCH_MANAGER,
        title: "Attendance due",
        body: "Update monthly attendance for your branch by the 1st.",
      },
      {
        role: UserRole.SECURITY_ADMIN,
        title: "Network strength snapshot",
        body: `${TARGET_BRANCHES} active branches seeded with minimum 2 guards each.`,
      },
      {
        userId: bm.id,
        title: "Clifton deployment pending",
        body: "Replacement request awaiting ROH / Cluster approval.",
      },
    ],
  });

  const totals = {
    regions: await prisma.region.count(),
    clusters: await prisma.cluster.count(),
    branches: await prisma.branch.count(),
    guards: await prisma.guard.count(),
    activeGuards: await prisma.guard.count({ where: { status: GuardStatus.ACTIVE } }),
    users: await prisma.user.count(),
  };

  console.log("Seed complete.");
  console.log("----------------------------------------");
  console.log(JSON.stringify(totals, null, 2));
  console.log("Password for all users: Password@123");
  console.log("See docs/DEMO-USERS.md for role logins & visibility.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
