# Security Management System (SMS)

Monorepo for a centralized **Security Information Management System** aligned to the BRD / ITWRF:

- Guard registration & family details
- Mandatory document compliance (blocks deployment)
- Monthly attendance + escalation / change-request workflow
- Deployment approval hierarchy
- Branch security inspections
- CCTV / BAS inventory & complaints
- Dashboard, LOVs, audit trail, RBAC (+ 2FA-ready)

## Stack

| Layer | Tech |
|---|---|
| Monorepo | npm workspaces |
| Frontend | Next.js 15 + TypeScript + Tailwind |
| Backend | NestJS + Prisma |
| Database | **MySQL 8** |
| Jobs (ready) | Redis + BullMQ |
| Shared | `@sms/shared` (roles, enums, Zod) |

## Structure

```text
apps/
  api/          NestJS REST API
  web/          Next.js console
packages/
  shared/       Shared types & validators
docker-compose.yml   MySQL + Redis
```

## Prerequisites

- Node.js 20+
- MySQL 8+ (local service is fine; `docker-compose.yml` also includes MySQL + Redis if you use Docker)

## Quick start

```bash
# 1) Ensure MySQL is running, then create DB/user (once):
#    CREATE DATABASE sms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
#    CREATE USER 'sms'@'localhost' IDENTIFIED BY 'sms_secret';
#    GRANT ALL PRIVILEGES ON sms.* TO 'sms'@'localhost';
#    (Prisma migrate also needs CREATE DATABASE for shadow DB)

# Optional Redis (escalation workers later):
# docker compose up -d redis

# 2) Install
npm install

# 3) Shared + Prisma
npm run build -w @sms/shared
copy .env apps\api\.env
npm run db:generate
npm run db:migrate
npm run db:seed

# 4) Run (two terminals)
npm run dev:api
npm run dev:web
```

Default `DATABASE_URL` in `.env`:

`mysql://sms:sms_secret@localhost:3306/sms`

- Web: http://localhost:3000  
- API: http://localhost:4000/api/health  

### Seed logins

| Email | Password | Role |
|---|---|---|
| `superadmin@sms.local` | `Password@123` | Super Admin |
| `bm@sms.local` | `Password@123` | Branch Manager |
| `cluster.security@sms.local` | `Password@123` | Cluster Security Head |

## Implementation phases

1. **Phase 1 (scaffolded):** Guard DB, documents, attendance, deployment, inspection, CCTV/BAS, auth/RBAC, admin LOVs  
2. **Phase 2:** Rich analytics dashboards, PDF/Excel exports, full BullMQ escalation workers  

## API map (high level)

| Area | Base path |
|---|---|
| Auth | `/api/auth` |
| Guards | `/api/guards` |
| Documents | `/api/documents` |
| Attendance | `/api/attendance` |
| Deployment | `/api/deployment` |
| Inspections | `/api/inspections` |
| CCTV/BAS | `/api/cctv-bas` |
| Dashboard | `/api/dashboard` |
| Reports | `/api/reports` |
| Admin | `/api/admin` |
| Audit | `/api/audit` |

## Project documentation (mandatory pack)

| Document | Path |
|---|---|
| Functional Specification (FSD) | [`docs/FSD-Security-Management-System.md`](docs/FSD-Security-Management-System.md) |
| Database schema | [`docs/DB-Schema.md`](docs/DB-Schema.md) |
| ERD (Mermaid) | [`docs/ERD.md`](docs/ERD.md) |
| Training guide | [`docs/Training-Guide.md`](docs/Training-Guide.md) |
| Architecture | [`docs/architecture.md`](docs/architecture.md) |

## UI branding

- Font: **IBM Plex Sans** (banking console density: 13px body, compact tables)
- Colors: **UBL blue** `#017DC5`, deep navy `#0B3D66`, accent red `#CA242D`
