# Functional Specification Document (FSD)
## Security Management System (SMS)

| Field | Value |
|---|---|
| Document type | Functional Specification Document |
| System | Security Information Management System |
| Business owner | Security Department / Branch Banking Operations & Security |
| Technical owner | IT Department |
| Version | 1.0 |
| Date | 26-Nov-2026 |
| Source inputs | BRD – Security Management System (Final); ITWRF – Automation of Security Information Management System |

---

## 1. Purpose

Provide a centralized digital platform to automate and govern:

- Security guard registration & lifecycle
- Mandatory document compliance
- Monthly attendance with escalation matrix
- Guard deployment request & multi-level approval
- Branch security inspections & action plans
- CCTV / BAS inventory and complaints
- Dashboards, reporting, audit trail, and RBAC

---

## 2. Scope

### In scope (Phase 1 + Phase 2 core)

| Module | Description |
|---|---|
| Auth & RBAC | Login, JWT session, role-based menus/APIs, 2FA-ready user model |
| Guards | Registration, family, search, status (Active/Replaced/Terminated), expiry alerts |
| Documents | 7 mandatory uploads; block deployment if missing/expired |
| Attendance | Monthly periods, draft/submit, change request → Cluster Security |
| Deployment | NEW / REPLACEMENT / ADDITIONAL; 3-step approval; Reference & Deployment IDs |
| Inspections | Performa, ratings, action plan, open/overdue metrics |
| CCTV/BAS | Inventory + complaints (auto-close on resolution date) |
| Admin | Vendors, LOVs, escalation/TAT config |
| Reports | Strength, attendance, expiry, inspections; CSV export |
| Audit | Append-only action trail |
| Jobs | Attendance Day 1–4 escalations; registration TAT; expiry notifications |

### Out of scope (future)

- Native mobile apps
- Direct NADRA/Verisys API integration (manual LOV capture for now)
- Full PDF pixel-perfect bank statement style packs (CSV export delivered; PDF can extend Phase 2)

---

## 3. Users & roles

| Role | Primary access |
|---|---|
| Super Admin | Full system + configuration |
| System Admin | Technical control, admin, audit |
| Security Admin | Monitoring, reports, approvals support, LOVs |
| Branch Manager (BM) | Guard register, attendance, deployment request, action plans |
| BOM | Same operational branch functions as BM |
| District Operations Manager | Review / recommendation; Day-3 attendance escalation |
| Regional Operations Manager / ROH | Review / recommendation; Day-4 escalation; deployment step 1 |
| Cluster Security Head | Attendance change approval; inspections submit; deployment step 2 |
| Divisional Head Security | Final deployment approval; higher escalations |

---

## 4. Functional requirements

### 4.1 Authentication
- Users authenticate with email/password.
- JWT bearer token for API access.
- User entity supports TOTP 2FA fields (enablement path available).
- Role determines visible modules and API authorization.

### 4.2 Security Guard Registration
- Restricted to BM/BOM (and elevated admins).
- Initiator inferred from logged-in user.
- Mandatory fields per BRD: name, CNIC (13 digits with hyphens), CNIC expiry (no back date), mobile (11 digits), vendor, weapon, license expiry, category, deployment category/location, joining date (no back date), training, police verification, NADRA Verisys, status.
- Guard ID = CNIC digits (13).
- Immediate family: add/remove multiple members.
- Search: name, CNIC, location, status, joining, vendor, police verification, NADRA Verisys.
- Status lifecycle: Active / Replaced / Terminated (deregistration/branch switching support).

### 4.3 Mandatory documents
Required before deployment:

1. Deployment / Introductory Letter  
2. Employment Card  
3. Passport photograph  
4. Police Verification Certificate  
5. Training Certificate (APSAA)  
6. CNIC with NADRA Verisys  
7. License soft copy  

System blocks deployment when any document is missing or expired and raises alerts.

### 4.4 Monthly attendance
- Period by branch + month + year.
- Save for later (draft) and submit only when all active guards covered.
- Shift LOV: Day / Night; multiple intervals via Add.
- Summary by shift (guards × days).
- Post-submit edits via Change Request + mandatory comment → Cluster Security approve/reject.
- Escalation: Day 1–2 reminders; Day 3 DOM; Day 4 ROH (configurable).

### 4.5 Deployment workflow
- Request types: New / Replacement / Additional.
- Mandatory justification.
- Approval chain: ROH/DOM → Cluster Security → Head Security.
- On final approval: Reference ID + Unique Deployment ID.
- Guard document compliance enforced when guard linked.

### 4.6 Branch inspections
- Submitted by Cluster Security (not by branch as inspector).
- Ratings: Above / Acceptable / Marginal / Below Acceptable.
- Auto-share conceptually to BM and ROH/DOM via system visibility.
- Branch submits compliance action plan; closes observation.
- Dashboard: open observations, overdue items.

### 4.7 Registration TAT
- TAT = 1 working day from registration initiation.
- Incomplete registration escalates to next authority; further escalation after +3 working days (notifications generated by scheduler).

### 4.8 CCTV & BAS
- Inventory: BAS vendor, PTCL line, SIM, recorder type, cameras, recording days, warranty, mirroring, installation date.
- Complaints: branch, date, ticket, category (BAS/CCTV), status Opened/Closed, resolution date, comments.
- Status becomes Closed when resolution date entered.
- Search/filter by branch/vendor.

### 4.9 Dashboard & reporting
- Guards strength (region/cluster/branch)
- Attendance compliance
- Expiry alerts
- Inspection compliance
- CCTV/BAS complaint stats
- CSV export for audit packs

### 4.10 Admin & governance
- Manage vendors and LOVs.
- Configure escalation matrix / TAT keys in `SystemConfig`.
- Full audit trail of sensitive actions.
- Secure hosting assumptions: encrypted transport (HTTPS in prod), DB access control, RBAC.

---

## 5. Non-functional requirements

| Area | Requirement |
|---|---|
| Usability | Banking console UX; IBM Plex Sans; UBL blue/red palette; responsive desktop/tablet/mobile |
| Security | JWT + RBAC; password hashing (bcrypt); audit logging; optional 2FA |
| Performance | Standard ops screens < 2s under normal branch load |
| Availability | Standard business hours + batch jobs daily |
| Auditability | Every create/submit/approve/upload/status change logged |
| Compliance | Supports SBP/internal audit readiness via trail + exports |

---

## 6. External interfaces

| Interface | Notes |
|---|---|
| Web console | Next.js (`apps/web`) |
| REST API | NestJS (`apps/api`) prefix `/api` |
| Database | MySQL 8+ |
| Scheduler | Nest cron jobs for escalations/alerts |
| File store | Local/upload directory (S3/MinIO ready for prod) |

---

## 7. Implementation mapping

| BRD Phase | Delivery |
|---|---|
| Phase 1 | Guards, documents, attendance, deployment, inspections, CCTV/BAS, auth/admin |
| Phase 2 | Reports & analytics dashboards + CSV exports (delivered in console Reports module) |

---

## 8. Acceptance criteria (summary)

1. BM can register guard with validations and family details.  
2. Deployment blocked without complete/valid documents.  
3. Attendance draft/submit/change-request works with role checks.  
4. Deployment three-step approval issues IDs.  
5. Inspection action plan closes observation.  
6. Complaint closes only after resolution date.  
7. Role-based menus hide unauthorized modules.  
8. Reports export CSV; audit trail visible to authorized roles.  
9. Daily jobs create escalation/expiry notifications.

---

## 9. Training notes

- Seed users exist for each major role (`*@sms.local` / `Password@123`).
- Walkthrough: Login → Register guard → Upload 7 docs → Open attendance → Submit → Create deployment → Approve ×3 → Reports/Audit.
- Emphasize: no back-dated CNIC/joining; submit attendance only when all guards marked; deployment needs compliance.

---

*End of FSD*
