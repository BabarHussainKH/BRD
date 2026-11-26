import { z } from "zod";
import {
  DeploymentCategory,
  GuardCategory,
  GuardStatus,
  YesNo,
  ShiftType,
  DeploymentRequestType,
  ComplaintCategory,
  RecorderType,
} from "./enums";

/** CNIC: 13 digits with hyphens e.g. 12345-1234567-1 */
export const cnicSchema = z
  .string()
  .regex(/^\d{5}-\d{7}-\d$/, "CNIC must be 13 digits with hyphens (XXXXX-XXXXXXX-X)");

/** Mobile: 11 digits */
export const mobileSchema = z
  .string()
  .regex(/^\d{11}$/, "Mobile number must be 11 digits");

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  totpCode: z.string().length(6).optional(),
});

export const guardCreateSchema = z.object({
  fullName: z.string().min(2).max(150),
  cnicNumber: cnicSchema,
  cnicExpiryDate: z.string().datetime().or(z.string().date()),
  contactMobile: mobileSchema,
  vendorId: z.string().uuid(),
  weaponType: z.string().min(1).max(100),
  licenseExpiryDate: z.string().datetime().or(z.string().date()).optional().nullable(),
  guardCategory: z.enum([GuardCategory.EX_SERVICE_MAN, GuardCategory.CIVILIAN]),
  deploymentCategory: z.enum([
    DeploymentCategory.PERMANENT,
    DeploymentCategory.REPLACEMENT,
    DeploymentCategory.TEMPORARY,
  ]),
  deploymentLocation: z.string().min(1).max(200),
  branchId: z.string().uuid(),
  dateOfJoining: z.string().datetime().or(z.string().date()),
  trainingStatus: z.enum([YesNo.YES, YesNo.NO]),
  policeVerification: z.enum([YesNo.YES, YesNo.NO]),
  nadraVerisys: z.enum([YesNo.YES, YesNo.NO]),
  status: z.enum([GuardStatus.ACTIVE, GuardStatus.REPLACED, GuardStatus.TERMINATED]).default(GuardStatus.ACTIVE),
  familyMembers: z
    .array(
      z.object({
        name: z.string().min(1),
        cnicNumber: cnicSchema.optional().nullable(),
        dateOfBirth: z.string().datetime().or(z.string().date()).optional().nullable(),
        relation: z.string().min(1),
      }),
    )
    .optional()
    .default([]),
});

export const guardSearchSchema = z.object({
  name: z.string().optional(),
  cnicNumber: z.string().optional(),
  location: z.string().optional(),
  status: z.enum([GuardStatus.ACTIVE, GuardStatus.REPLACED, GuardStatus.TERMINATED]).optional(),
  dateOfJoining: z.string().optional(),
  vendorId: z.string().uuid().optional(),
  policeVerification: z.enum([YesNo.YES, YesNo.NO]).optional(),
  nadraVerisys: z.enum([YesNo.YES, YesNo.NO]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const attendanceEntrySchema = z.object({
  guardId: z.string().uuid(),
  fromDate: z.string().datetime().or(z.string().date()),
  toDate: z.string().datetime().or(z.string().date()),
  shift: z.enum([ShiftType.DAY, ShiftType.NIGHT]),
});

export const deploymentRequestSchema = z.object({
  requestType: z.enum([
    DeploymentRequestType.NEW,
    DeploymentRequestType.REPLACEMENT,
    DeploymentRequestType.ADDITIONAL,
  ]),
  branchId: z.string().uuid(),
  justification: z.string().min(10).max(2000),
  guardId: z.string().uuid().optional().nullable(),
});

export const complaintSchema = z.object({
  branchId: z.string().uuid(),
  complaintDate: z.string().datetime().or(z.string().date()),
  ticketNumber: z.string().min(1).max(50),
  category: z.enum([ComplaintCategory.BAS, ComplaintCategory.CCTV]),
  comments: z.string().max(2000).optional(),
  resolutionDate: z.string().datetime().or(z.string().date()).optional().nullable(),
});

export const cctvBasSchema = z.object({
  branchId: z.string().uuid(),
  basVendorName: z.string().min(1),
  dedicatedPtclLine: z.enum([YesNo.YES, YesNo.NO]),
  basSimNumber: z.string().regex(/^\d+$/, "BAS SIM must be numeric").optional().nullable(),
  recorderType: z.enum([RecorderType.DVR, RecorderType.NVR]),
  cameraCount: z.coerce.number().int().min(0),
  recordingDays: z.coerce.number().int().min(0),
  warrantyStatus: z.enum([YesNo.YES, YesNo.NO]),
  mirroringStatus: z.enum([YesNo.YES, YesNo.NO]),
  installationDate: z.string().datetime().or(z.string().date()).optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type GuardCreateInput = z.infer<typeof guardCreateSchema>;
export type GuardSearchInput = z.infer<typeof guardSearchSchema>;
export type AttendanceEntryInput = z.infer<typeof attendanceEntrySchema>;
export type DeploymentRequestInput = z.infer<typeof deploymentRequestSchema>;
export type ComplaintInput = z.infer<typeof complaintSchema>;
export type CctvBasInput = z.infer<typeof cctvBasSchema>;
