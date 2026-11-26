# Training Guide — Security Management System

## 1. Access

- URL: `http://localhost:3000` (or production URL)
- Demo Super Admin: `superadmin@sms.local` / `Password@123`
- Other seeded roles: `bm@sms.local`, `bom@sms.local`, `roh@sms.local`, `cluster.security@sms.local`, `head.security@sms.local`, `security.admin@sms.local`

## 2. Role quick map

| If you are… | You mainly… |
|---|---|
| BM / BOM | Register guards, upload docs, mark attendance, request deployment, submit action plans |
| Cluster Security | Approve attendance changes, submit inspections, approve deployments (step 2) |
| ROH / DOM | Review deployments (step 1), receive attendance escalations |
| Head Security | Final deployment approval |
| Security / Super Admin | Monitor all modules, configure LOVs/escalation, view audit & reports |

## 3. Standard day-1 walkthrough (30 min)

1. Sign in as Super Admin / BM  
2. **Guards → Register guard** (valid CNIC/mobile; no back dates)  
3. Open profile → upload all **7 mandatory documents**  
4. Confirm compliance shows **Ready for deployment**  
5. **Attendance → Open period** → add intervals → Save / Submit  
6. **Deployment → New request** linking the guard → Approve through 3 steps  
7. **Inspections** → submit report → BM action plan  
8. **CCTV/BAS** → add inventory + complaint → Resolve  
9. **Reports** → export CSV; **Audit Trail** → review actions  

## 4. Business rules to emphasize

- Deployment is blocked without complete/valid documents  
- Attendance submit requires all active guards marked  
- Submitted attendance only changes via approved change request  
- Complaint stays Open until resolution date  
- CNIC expiry & joining date cannot be back-dated  

## 5. Support documents

- `docs/FSD-Security-Management-System.md`
- `docs/DB-Schema.md`
- `docs/ERD.md`
- `docs/architecture.md`
- `README.md`
