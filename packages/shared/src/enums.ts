export const DeploymentCategory = {
  PERMANENT: "PERMANENT",
  REPLACEMENT: "REPLACEMENT",
  TEMPORARY: "TEMPORARY",
} as const;

export const GuardCategory = {
  EX_SERVICE_MAN: "EX_SERVICE_MAN",
  CIVILIAN: "CIVILIAN",
} as const;

export const GuardStatus = {
  ACTIVE: "ACTIVE",
  REPLACED: "REPLACED",
  TERMINATED: "TERMINATED",
} as const;

export const YesNo = {
  YES: "YES",
  NO: "NO",
} as const;

export const ShiftType = {
  DAY: "DAY",
  NIGHT: "NIGHT",
} as const;

export const AttendancePeriodStatus = {
  PENDING: "PENDING",
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  CHANGE_REQUESTED: "CHANGE_REQUESTED",
} as const;

export const ApprovalStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const DeploymentRequestType = {
  NEW: "NEW",
  REPLACEMENT: "REPLACEMENT",
  ADDITIONAL: "ADDITIONAL",
} as const;

export const InspectionRating = {
  ABOVE_ACCEPTABLE: "ABOVE_ACCEPTABLE",
  ACCEPTABLE: "ACCEPTABLE",
  MARGINAL_ACCEPTABLE: "MARGINAL_ACCEPTABLE",
  BELOW_ACCEPTABLE: "BELOW_ACCEPTABLE",
} as const;

export const ComplaintCategory = {
  BAS: "BAS",
  CCTV: "CCTV",
} as const;

export const ComplaintStatus = {
  OPENED: "OPENED",
  CLOSED: "CLOSED",
} as const;

export const RecorderType = {
  DVR: "DVR",
  NVR: "NVR",
} as const;

export const DocumentType = {
  DEPLOYMENT_LETTER: "DEPLOYMENT_LETTER",
  EMPLOYMENT_CARD: "EMPLOYMENT_CARD",
  PASSPORT_PHOTO: "PASSPORT_PHOTO",
  POLICE_VERIFICATION: "POLICE_VERIFICATION",
  TRAINING_CERTIFICATE: "TRAINING_CERTIFICATE",
  CNIC_NADRA_VERISYS: "CNIC_NADRA_VERISYS",
  LICENSE: "LICENSE",
} as const;

export const MANDATORY_DOCUMENT_TYPES = Object.values(DocumentType);
