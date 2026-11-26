# Entity Relationship Diagram (ERD)
## Security Management System

Use this diagram for training, BA walkthroughs, and DB onboarding.

```mermaid
erDiagram
  REGION ||--o{ CLUSTER : contains
  CLUSTER ||--o{ BRANCH : contains
  BRANCH ||--o{ USER : employs
  BRANCH ||--o{ GUARD : deploys
  VENDOR ||--o{ GUARD : supplies
  USER ||--o{ GUARD : initiates
  GUARD ||--o{ GUARD_FAMILY_MEMBER : has
  GUARD ||--o{ GUARD_DOCUMENT : uploads
  BRANCH ||--o{ ATTENDANCE_PERIOD : tracks
  ATTENDANCE_PERIOD ||--o{ ATTENDANCE_ENTRY : includes
  GUARD ||--o{ ATTENDANCE_ENTRY : marked_in
  ATTENDANCE_PERIOD ||--o{ ATTENDANCE_CHANGE_REQUEST : may_have
  USER ||--o{ ATTENDANCE_CHANGE_REQUEST : requests
  BRANCH ||--o{ DEPLOYMENT_REQUEST : raises
  GUARD ||--o{ DEPLOYMENT_REQUEST : linked_to
  USER ||--o{ DEPLOYMENT_REQUEST : requests
  DEPLOYMENT_REQUEST ||--o{ DEPLOYMENT_APPROVAL : flows_through
  USER ||--o{ DEPLOYMENT_APPROVAL : acts_on
  BRANCH ||--o{ INSPECTION : inspected
  USER ||--o{ INSPECTION : submits
  BRANCH ||--o{ CCTV_BAS_INVENTORY : maintains
  BRANCH ||--o{ COMPLAINT : logs
  USER ||--o{ AUDIT_LOG : generates

  REGION {
    string id PK
    string code UK
    string name
  }
  CLUSTER {
    string id PK
    string code UK
    string name
    string regionId FK
  }
  BRANCH {
    string id PK
    string code UK
    string name
    string clusterId FK
  }
  USER {
    string id PK
    string email UK
    string role
    string branchId FK
  }
  VENDOR {
    string id PK
    string name UK
  }
  GUARD {
    string id PK
    string guardId UK
    string cnicNumber UK
    string status
    string branchId FK
    string vendorId FK
  }
  GUARD_DOCUMENT {
    string id PK
    string guardId FK
    string type
    datetime expiryDate
  }
  ATTENDANCE_PERIOD {
    string id PK
    string branchId FK
    int month
    int year
    string status
  }
  ATTENDANCE_ENTRY {
    string id PK
    string periodId FK
    string guardId FK
    string shift
  }
  DEPLOYMENT_REQUEST {
    string id PK
    string requestType
    string status
    int currentStep
    string referenceId
    string deploymentId
  }
  INSPECTION {
    string id PK
    string branchId FK
    string guardRating
    boolean isClosed
  }
  CCTV_BAS_INVENTORY {
    string id PK
    string branchId FK
    string recorderType
    int cameraCount
  }
  COMPLAINT {
    string id PK
    string branchId FK
    string category
    string status
  }
  AUDIT_LOG {
    string id PK
    string userId FK
    string action
    string entity
  }
```

## Training reading order

1. Org hierarchy: Region → Cluster → Branch  
2. Master data: Vendor + Guard + Documents  
3. Monthly ops: AttendancePeriod → Entries → ChangeRequest  
4. Workflow: DeploymentRequest → Approvals  
5. Risk modules: Inspection, CCTV/BAS, Complaint  
6. Control plane: User/RBAC, SystemConfig, AuditLog, Notification  
