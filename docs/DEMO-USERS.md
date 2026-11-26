# Demo Users, Roles & Data Visibility

**Password for all accounts:** `Password@123`  
**Scale seeded:** ~**1,933 branches**, **min 2 guards/branch** (some branches have 3), across **10 regions** and **80 clusters**.

---

## Who sees what

| Role | Scope of guards / branches / attendance | Can manage |
|---|---|---|
| **Super Admin** | All branches nationwide | Full system |
| **Security Admin** | All branches (monitor/report) | LOVs, monitoring, approvals support |
| **System Admin** | Technical / config | Admin config, audit |
| **Divisional Head Security** | All branches | Final deployment approval, oversight |
| **Regional Operations Manager (ROH)** | Branches in **assigned region only** | Deployment step-1, escalations |
| **District Operations Manager (DOM)** | Branches in **assigned region** | Review / Day-3 attendance escalation |
| **Cluster Security Head** | Branches in **assigned cluster only** | Inspections, attendance change approval, deployment step-2 |
| **Branch Manager (BM)** | **Own branch only** | Register/update guards, attendance, deployment request, action plans |
| **BOM** | **Own branch only** | Same operational branch functions as BM |

---

## Login IDs (copy/paste)

### Nationwide / HO
| Email | Role | Sees |
|---|---|---|
| `superadmin@sms.local` | Super Admin | Everything |
| `security.admin@sms.local` | Security Admin | All branches (ops monitoring) |
| `sysadmin@sms.local` | System Admin | Admin/config/audit |
| `head.security@sms.local` | Divisional Head Security | Nationwide oversight + final approvals |

### Region / Cluster
| Email | Role | Sees |
|---|---|---|
| `roh.karachi@sms.local` | ROH | **Karachi South** region branches only |
| `roh.punjab@sms.local` | ROH | **Punjab Central** region branches only |
| `roh@sms.local` | ROH (alias) | Karachi South |
| `dom.isb@sms.local` | DOM | **Islamabad / Rawalpindi** region |
| `cluster.security@sms.local` | Cluster Security Head | Cluster of **Clifton (BR-0001)** only |

### Branch users
| Email | Role | Branch | Sees |
|---|---|---|---|
| `bm.clifton@sms.local` | Branch Manager | **BR-0001 Clifton** | Only Clifton guards/attendance/deployment |
| `bom.clifton@sms.local` | BOM | **BR-0001 Clifton** | Only Clifton |
| `bm@sms.local` | BM (alias) | Clifton | Only Clifton |
| `bom@sms.local` | BOM (alias) | Clifton | Only Clifton |
| `bm.saddar@sms.local` | BM | **BR-0002 Saddar** | Only Saddar |
| `bom.saddar@sms.local` | BOM | **BR-0002 Saddar** | Only Saddar |
| `bm.gulberg@sms.local` | BM | **BR-0007 Gulberg** | Only Gulberg |
| `bm.f7@sms.local` | BM | **BR-0005 F-7 Markaz** | Only F-7 |

---

## Suggested demos

1. Login as `bm.clifton@sms.local` → Guards list shows **only Clifton** (2–3 guards).  
2. Login as `bm.saddar@sms.local` → different branch set.  
3. Login as `cluster.security@sms.local` → cluster-scoped branches (Clifton cluster).  
4. Login as `roh.karachi@sms.local` → Karachi South region.  
5. Login as `superadmin@sms.local` → full 1,933-branch network metrics.

---

## Re-seed command

```bash
npm run db:seed
```
