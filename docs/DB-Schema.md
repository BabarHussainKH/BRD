# Database Schema — Security Management System

**Engine:** MySQL 8+ (utf8mb4)  
**ORM:** Prisma (`apps/api/prisma/schema.prisma`)  
**Database name (dev):** `sms`

---

## 1. Entity list

| Table | Purpose |
|---|---|
| User | System users & roles |
| Region / Cluster / Branch | Org hierarchy |
| Vendor | Guard vendors |
| Guard | Guard master |
| GuardFamilyMember | Immediate family |
| GuardDocument | Mandatory docs |
| AttendancePeriod | Monthly attendance header |
| AttendanceEntry | Day/Night intervals |
| AttendanceChangeRequest | Post-submit edits |
| DeploymentRequest | Deployment workflow |
| DeploymentApproval | Approval steps |
| Inspection | Branch inspection |
| CctvBasInventory | CCTV/BAS inventory |
| Complaint | BAS/CCTV tickets |
| LovItem | Configurable LOVs |
| SystemConfig | TAT / escalation JSON |
| AuditLog | Immutable audit |
| Notification | Alerts / escalations |

---

## 2. Key fields & rules

### User
- `role` enum: SUPER_ADMIN, SECURITY_ADMIN, SYSTEM_ADMIN, BRANCH_MANAGER, BOM, DISTRICT_OPERATIONS_MANAGER, REGIONAL_OPERATIONS_MANAGER, CLUSTER_SECURITY_HEAD, DIVISIONAL_HEAD_SECURITY
- `passwordHash` bcrypt
- `totpSecret` / `totpEnabled` for 2FA

### Guard
- `guardId` unique = 13-digit CNIC
- `cnicNumber` formatted `XXXXX-XXXXXXX-X`
- Status: ACTIVE | REPLACED | TERMINATED
- Expiry fields drive alerts

### GuardDocument
- Unique `(guardId, type)`
- Types: DEPLOYMENT_LETTER, EMPLOYMENT_CARD, PASSPORT_PHOTO, POLICE_VERIFICATION, TRAINING_CERTIFICATE, CNIC_NADRA_VERISYS, LICENSE

### AttendancePeriod
- Unique `(branchId, month, year)`
- Status: PENDING | DRAFT | SUBMITTED | CHANGE_REQUESTED

### DeploymentRequest
- `referenceId`, `deploymentId` set on final approval
- `currentStep` 1..3

### Complaint
- Status OPENED until `resolutionDate` set → CLOSED

---

## 3. Relationships (textual)

```
Region 1—N Cluster 1—N Branch 1—N Guard
Vendor 1—N Guard
User 1—N Guard (initiator)
Guard 1—N GuardFamilyMember
Guard 1—N GuardDocument
Branch 1—N AttendancePeriod 1—N AttendanceEntry N—1 Guard
AttendancePeriod 1—N AttendanceChangeRequest
Branch 1—N DeploymentRequest N—1 Guard?
DeploymentRequest 1—N DeploymentApproval N—1 User
Branch 1—N Inspection
Branch 1—N CctvBasInventory
Branch 1—N Complaint
User 1—N AuditLog
```

---

## 4. Indexes (important)

- Guard: `branchId`, `vendorId`, `status`, `fullName`, unique `cnicNumber`/`guardId`
- AttendancePeriod: unique branch+month+year; `status`
- DeploymentRequest: `status`, `branchId`
- AuditLog: `(entity, entityId)`, `userId`, `createdAt`
- Notification: `userId`, `role`, `isRead`

---

## 5. Seed baseline

- Region `R-SOUTH`, Cluster `C-KAR`, Branch `BR-001`
- Vendor `SecureForce Pvt Ltd`
- Users for Super Admin, Security Admin, BM, BOM, ROH, Cluster Security, Divisional Head
- Default password: `Password@123`
- SystemConfig keys: `attendance_escalation`, `registration_tat`

---

## 6. Migration location

`apps/api/prisma/migrations/` — initial migration creates full schema.

Generate SQL anytime:

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel apps/api/prisma/schema.prisma --script
```
