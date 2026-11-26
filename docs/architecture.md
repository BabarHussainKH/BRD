# Architecture

## Why monorepo + separate apps

- One Git history for BRD features that span UI + API
- Separate deployables (`web`, `api`) for IT operations
- Shared contracts in `packages/shared`

## Runtime

```text
Browser (Next.js)
    │  JWT
    ▼
NestJS API  ── Prisma ── MySQL
    │
    └── Redis/BullMQ (escalation & reminders — wired next)
```

## Domain modules

| Module | BRD mapping |
|---|---|
| Guards | Registration, family, search, expiry alerts |
| Documents | 7 mandatory uploads; block deploy if missing/expired |
| Attendance | Monthly grid, draft/submit, change request → Cluster Security |
| Deployment | NEW/REPLACEMENT/ADDITIONAL; 3-step approval |
| Inspections | Performa + action plan + open/overdue dashboard |
| CCTV/BAS | Inventory + complaints (auto-close on resolution date) |
| Admin | LOVs, vendors, TAT / escalation config |
| Audit | Append-only action log |

## Roles

Super Admin, Security Admin, System Admin, Branch Manager, BOM, DOM, ROH, Cluster Security Head, Divisional Head Security.

## Security controls

- JWT bearer auth + RBAC guards
- Optional TOTP 2FA fields on User
- Document validity gates on deployment
- Audit log on create/submit/approve/upload
