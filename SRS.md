# Software Requirements Specification (SRS)

## PM-JAY Madhya Pradesh — Health Analytics Dashboard

| Field | Detail |
|-------|--------|
| **Document Version** | 1.0 |
| **Date** | 18 August 2026 |
| **Project** | Website Dashboard MP 2 |
| **Repository** | [github.com/nishantkw/website_dashboard_mp_2](https://github.com/nishantkw/website_dashboard_mp_2) |
| **Current Phase** | Frontend simulation (mock data) |
| **Planned Phase** | Backend API + production database integration |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [User Roles and Access Control](#3-user-roles-and-access-control)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [External Interface Requirements](#6-external-interface-requirements)
7. [Data Requirements](#7-data-requirements)
8. [Security Requirements](#8-security-requirements)
9. [Future Scope](#9-future-scope)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for the **PM-JAY Madhya Pradesh Health Analytics Dashboard** — a web-based portal for monitoring Ayushman Bharat PM-JAY program data across multiple departmental schemas (BIS, Madhya Pradesh Data Mart, and UMP).

The document is intended for:

- Project stakeholders and government program officers
- Frontend and backend developers
- QA / testing teams
- System integrators connecting live databases

### 1.2 Scope

The system provides:

- A **role-based analytics portal** with government branding
- **Department-wise dashboards** for card printing, claims, beneficiaries, hospitals, patients, fraud audit, workflow, LMS training, and user management
- **Interactive visualizations** (KPI cards, bar/line/pie charts, data tables)
- **Global filtering** by geography, status, demographics, and date range
- **Drill-down modals** for detailed record inspection
- **Data export** (CSV, Excel, PDF)
- **Admin modules** for user management and bulk data import (simulated in current release)

**Out of scope (current release):**

- Live database connectivity
- Real-time data synchronization
- Maharashtra (`dmart_mh`) dashboard module (planned, not implemented)
- Production-grade authentication (JWT, password hashing, SSO)

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|------------|
| **PM-JAY** | Pradhan Mantri Jan Arogya Yojana (Ayushman Bharat health insurance scheme) |
| **BIS** | Beneficiary Identification System — card printing and enrollment |
| **dmart_mp** | Madhya Pradesh analytical data mart schema |
| **dmart_mh** | Maharashtra analytical data mart schema (planned) |
| **bis_raw** | Raw BIS operational schema |
| **ump_raw** | User Management Platform schema |
| **KPI** | Key Performance Indicator |
| **eKYC** | Electronic Know Your Customer verification |
| **NABH** | National Accreditation Board for Hospitals & Healthcare Providers |
| **RBAC** | Role-Based Access Control |
| **SRS** | Software Requirements Specification |

### 1.4 References

| Document | Location |
|----------|----------|
| Project README | `README.md` |
| Implementation Plan | `ImplementationPlan.md` |
| Database Documentation | `database_documentation.docx` |
| Frontend source | `frontend/src/` |

---

## 2. Overall Description

### 2.1 Product Perspective

The dashboard is a **single-page application (SPA)** built with React and served via Vite. In the current simulation phase, all data is served from in-memory mock datasets. A backend API and relational database are planned for production deployment.

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Browser (Client)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Login / RBAC│  │  Dashboards  │  │ Charts & Tables  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│         │                 │                    │             │
│         └─────────────────┴────────────────────┘             │
│                           │                                  │
│              React App (Vite + TypeScript)                   │
│         AuthContext │ FilterContext │ Mock Data               │
└───────────────────────────┬─────────────────────────────────┘
                            │  (Planned)
              ┌─────────────▼─────────────┐
              │   REST API (FastAPI)      │
              │   PostgreSQL Database     │
              │   bis_raw │ dmart_mp │    │
              │   ump_raw                 │
              └───────────────────────────┘
```

### 2.2 Product Functions (Summary)

| # | Function | Description |
|---|----------|-------------|
| F1 | Authentication | Role-based login with session persistence |
| F2 | Navigation | Sidebar navigation filtered by user role |
| F3 | Overview Dashboard | Cross-department KPIs and summary charts |
| F4 | Department Dashboards | Schema-specific analytics pages |
| F5 | Global Filtering | Toolbar filters applied to table data |
| F6 | Drill-Down | Click KPI/chart/table to view record details |
| F7 | Export | Download charts, tables, and full pages |
| F8 | User Management | Admin CRUD for users, roles, permissions |
| F9 | Bulk Import | CSV/Excel upload with schema auto-detection |

### 2.3 User Classes and Characteristics

| User Class | Technical Skill | Primary Use |
|------------|-----------------|-------------|
| Super Administrator | Medium | Full system administration |
| State Administrator | Low–Medium | Executive overview, all departments |
| BIS Operator | Low | Card printing monitoring |
| MP Analyst | Medium | Claims, hospitals, fraud analytics |
| UMP Administrator | Medium | User master data management |

### 2.4 Operating Environment

| Component | Requirement |
|-----------|-------------|
| Client Browser | Chrome 90+, Edge 90+, Firefox 90+ (modern evergreen browsers) |
| Screen Resolution | Responsive: 320px (mobile) to 1920px+ (desktop) |
| Development Server | Node.js 18+, `npm run dev` on port 5173 |
| Production Build | Static files via `npm run build` |

### 2.5 Design and Implementation Constraints

- Government visual identity: green color scheme (`#2d8a4e`), Ayushman MP logo, MP Government emblem
- Indian number formatting (`en-IN` locale) for all displayed figures
- Frontend-only demo must run without backend for stakeholder presentations
- TypeScript strict typing for all data models

### 2.6 Assumptions and Dependencies

- Mock data accurately represents production schema column names and value domains
- Production database schemas (`bis_raw`, `dmart_mp`, `ump_raw`) will be available for API integration
- Users access the portal from government network or VPN
- Lucide React, Recharts, and Tailwind CSS remain supported dependencies

---

## 3. User Roles and Access Control

### 3.1 Role Definitions

| Role ID | Display Label | Default Landing Page |
|---------|---------------|-------------------|
| `super_admin` | Super Administrator | `/dashboard/admin/user-management` |
| `state_admin` | State Administrator | `/dashboard` |
| `bis_user` | BIS Operator | `/dashboard/bis/card-printing` |
| `mp_user` | Madhya Pradesh Analyst | `/dashboard/mp/claims-payments` |
| `ump_user` | UMP Administrator | `/dashboard/ump/users` |

### 3.2 Route Access Matrix

| Role | Accessible Routes |
|------|-------------------|
| `super_admin` | All routes (`*`) |
| `state_admin` | All routes (`*`) |
| `bis_user` | `/dashboard/bis/*`, `/dashboard/admin/import-bulk-data` |
| `mp_user` | `/dashboard/mp/*`, `/dashboard/admin/import-bulk-data` |
| `ump_user` | `/dashboard/ump/*`, `/dashboard/admin/import-bulk-data` |

### 3.3 Navigation Access Matrix

| Role | Sidebar Sections |
|------|-----------------|
| `super_admin`, `state_admin` | Overview, BIS, MP, UMP, User Management, Import Bulk Data |
| `bis_user` | BIS, Import Bulk Data |
| `mp_user` | MP (all sub-pages), Import Bulk Data |
| `ump_user` | UMP, Import Bulk Data |

### 3.4 Demo Credentials (Simulation Only)

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `admin123` | Super Administrator |
| `admin` | `admin123` | State Administrator |
| `bis.user` | `demo123` | BIS Operator |
| `mp.user` | `demo123` | MP Analyst |
| `ump.user` | `demo123` | UMP Administrator |

> **Note:** Login requires matching **username + password + selected role**. Session is stored in browser `localStorage`.

---

## 4. Functional Requirements

### 4.1 Authentication Module

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | System shall display a login page as the default entry point (`/login`) | High |
| AUTH-02 | Login form shall accept username, password, and role selection | High |
| AUTH-03 | System shall validate credentials against authorized user records | High |
| AUTH-04 | On successful login, system shall redirect to role-specific default page | High |
| AUTH-05 | System shall persist session in browser storage until logout | Medium |
| AUTH-06 | System shall prevent access to dashboard routes for unauthenticated users | High |
| AUTH-07 | System shall provide logout functionality clearing session and redirecting to login | High |
| AUTH-08 | Login page shall use government branding (Ayushman MP theme) | Medium |

### 4.2 Layout and Navigation

| ID | Requirement | Priority |
|----|-------------|----------|
| NAV-01 | System shall display a government header with Ayushman MP logo and MP Government emblem | High |
| NAV-02 | System shall provide a collapsible sidebar with role-filtered menu items | High |
| NAV-03 | System shall support mobile navigation via hamburger menu drawer | Medium |
| NAV-04 | Dashboard toolbar shall show Analytics Portal label, search, notifications, user profile, and logout | Medium |
| NAV-05 | Sidebar shall group MP pages under "Madhya Pradesh (dmart_mp)" parent | Medium |
| NAV-06 | Unauthorized route access shall redirect to user's default allowed page | High |

### 4.3 Overview Dashboard (`/dashboard`)

| ID | Requirement | Priority |
|----|-------------|----------|
| OVR-01 | Display 8 KPI cards: Beneficiaries, Claims, Claims Paid Amount, Cards Printed, Hospitals, Suspicious Cases, Avg Processing Time, LMS Completion Rate | High |
| OVR-02 | KPI cards shall be clickable — navigate to related department page or open drill-down modal | High |
| OVR-03 | Display Claims Trend line chart (monthly claims volume and amount) | High |
| OVR-04 | Display State Comparison grouped bar chart | High |
| OVR-05 | Display Card Printing Funnel horizontal bar chart | High |
| OVR-06 | Display Claim Status Distribution donut chart | High |
| OVR-07 | Chart data values shall be visible without hover | Medium |
| OVR-08 | All charts shall support click-to-drill-down | Medium |

### 4.4 BIS — Card Printing (`/dashboard/bis/card-printing`)

| ID | Requirement | Priority |
|----|-------------|----------|
| BIS-01 | Display KPIs: Total Cards, Delivered, Printed, Distributed, Generated, Pending Print | High |
| BIS-02 | Display Card Status Distribution pie chart | High |
| BIS-03 | Display District-wise Printing grouped bar chart | High |
| BIS-04 | Display sortable data table of recent card records | High |
| BIS-05 | Table rows shall be clickable for record detail modal | Medium |
| BIS-06 | Data source schema: `bis_raw.t_card_printing_status` | High |

### 4.5 MP — Claims & Payments (`/dashboard/mp/claims-payments`)

| ID | Requirement | Priority |
|----|-------------|----------|
| MP-CL-01 | Display KPIs for claims volume, paid amount, pending, rejection rate | High |
| MP-CL-02 | Display Monthly Claims Trend line chart (paid vs pending) | High |
| MP-CL-03 | Display Payment Breakdown pie chart | High |
| MP-CL-04 | Display claims data table with case ID, patient, hospital, procedure, status, amount | High |
| MP-CL-05 | Data source schema: `dmart_mp.claim_paid_t`, `dmart_mp.t_payment_dtls` | High |

### 4.6 MP — Beneficiaries (`/dashboard/mp/beneficiaries`)

| ID | Requirement | Priority |
|----|-------------|----------|
| MP-BN-01 | Display beneficiary KPIs (total, eKYC verified, ABHA generated, etc.) | High |
| MP-BN-02 | Display Gender Distribution donut chart | High |
| MP-BN-03 | Display Urban vs Rural bar chart | High |
| MP-BN-04 | Display beneficiary records table | High |
| MP-BN-05 | Data source: `dmart_mp.t_bis_beneficiary_dtls` | High |

### 4.7 MP — Hospitals (`/dashboard/mp/hospitals`)

| ID | Requirement | Priority |
|----|-------------|----------|
| MP-HS-01 | Display hospital KPIs (empanelled, NABH certified, de-empanelled) | High |
| MP-HS-02 | Display Hospital Type Distribution pie chart | High |
| MP-HS-03 | Display District-wise Hospitals grouped bar chart | High |
| MP-HS-04 | Display hospital records table with type, district, NABH, status | High |
| MP-HS-05 | Data source: `dmart_mp.hospital_master_*_final` | High |

### 4.8 MP — Patients & Treatment (`/dashboard/mp/patients`)

| ID | Requirement | Priority |
|----|-------------|----------|
| MP-PT-01 | Display patient KPIs (admissions, discharges, active cases) | High |
| MP-PT-02 | Display Treatment by Specialty bar chart | High |
| MP-PT-03 | Display patient records table | High |

### 4.9 MP — Fraud & Audit (`/dashboard/mp/fraud-audit`)

| ID | Requirement | Priority |
|----|-------------|----------|
| MP-FR-01 | Display fraud KPIs (suspicious cases, confirmed fraud, recovered amount) | High |
| MP-FR-02 | Display Fraud Cases Trend line chart | High |
| MP-FR-03 | Display suspicious cases table | High |
| MP-FR-04 | Data source: `dmart_mp.t_suspicious_api_case_data` (case header) + `dmart_mp.t_suspicious_api_case_dtls` (rule-trigger details) + `t_workflow_transaction_audit` | High |
| MP-FR-05 | Display rule-trigger analytics (trigger type, application type) from `t_suspicious_api_case_dtls` | High |
| MP-FR-06 | Display rule-trigger details table linked by `reference_number` | High |

### 4.10 MP — Users & Workflow (`/dashboard/mp/users-workflow`)

| ID | Requirement | Priority |
|----|-------------|----------|
| MP-UW-01 | Display workflow KPIs (active users, transactions, avg processing time) | High |
| MP-UW-02 | Display Workflow Transaction Status bar chart | High |
| MP-UW-03 | Display workflow users table | High |
| MP-UW-04 | Data source: `dmart_mp.t_workflow_transaction_audit` | High |

### 4.11 MP — LMS Training (`/dashboard/mp/lms-training`)

| ID | Requirement | Priority |
|----|-------------|----------|
| MP-LM-01 | Display LMS KPIs (enrolled, completed, completion rate) | High |
| MP-LM-02 | Display Course Enrollment vs Completion grouped bar chart | High |
| MP-LM-03 | Display training records table | High |
| MP-LM-04 | Data source: `dmart_mp.lms_user_course_completion_status` | High |

### 4.12 UMP — User Master (`/dashboard/ump/users`)

| ID | Requirement | Priority |
|----|-------------|----------|
| UMP-01 | Display UMP KPIs (total users, active, inactive) | High |
| UMP-02 | Display Users by Role horizontal bar chart | High |
| UMP-03 | Display user records table | High |
| UMP-04 | Data source: `ump_raw` user master tables | High |

### 4.13 Admin — User Management (`/dashboard/admin/user-management`)

| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-01 | Provide 4-tab interface: Users, Roles, Permissions, Audit Logs | High |
| ADM-02 | Users tab: list, search, filter by role/status, add/edit/deactivate users | High |
| ADM-03 | Roles tab: view and manage role definitions | Medium |
| ADM-04 | Permissions tab: module-level permission matrix per role | High |
| ADM-05 | Audit Logs tab: view user action history | Medium |
| ADM-06 | *(Current)* All admin operations use in-memory state (no API) | — |

### 4.14 Admin — Import Bulk Data (`/dashboard/admin/import-bulk-data`)

| ID | Requirement | Priority |
|----|-------------|----------|
| IMP-01 | Accept CSV and Excel file uploads | High |
| IMP-02 | Auto-detect target schema from column headers | High |
| IMP-03 | Display parsed data preview table before import | High |
| IMP-04 | Support schema detection for: Claims, BIS Card Printing, Beneficiaries, Hospitals | High |
| IMP-05 | Auto-fill division from district when applicable | Medium |
| IMP-06 | *(Current)* Import is simulated — no data persisted to database | — |

### 4.15 Global Filter System

| ID | Requirement | Priority |
|----|-------------|----------|
| FLT-01 | Display global filter bar in dashboard toolbar (not below page content) | High |
| FLT-02 | Support filters: Schema, Division, District, Status, Gender, Urban/Rural, Hospital Type, Case Type, Role, Department, eKYC, Fraud Type, Course, NABH, Date From, Date To | High |
| FLT-03 | Support free-text search across table record fields | High |
| FLT-04 | Show active filter count badge | Medium |
| FLT-05 | Provide "Clear all" to reset all filters | Medium |
| FLT-06 | Division and District filters shall cascade (selecting division limits district options) | High |
| FLT-07 | Filters shall apply to data tables on analytics pages | High |
| FLT-08 | Filter bar may be hidden on admin and UMP pages | Low |

### 4.16 Drill-Down and Interactivity

| ID | Requirement | Priority |
|----|-------------|----------|
| INT-01 | KPI card click shall open detail modal or navigate to linked page | High |
| INT-02 | Chart bar/slice/point click shall open detail modal with connected dataset | High |
| INT-03 | Table row click shall open detail modal with row fields | High |
| INT-04 | Detail modal shall support in-modal search and filter | Medium |
| INT-05 | Detail modal shall support export of displayed records | Medium |

### 4.17 Export

| ID | Requirement | Priority |
|----|-------------|----------|
| EXP-01 | Export data tables to CSV with UTF-8 BOM for Excel compatibility | High |
| EXP-02 | Export data tables to Excel (.xls XML format) | Medium |
| EXP-03 | Export data tables and charts to PDF | Medium |
| EXP-04 | Export full dashboard page to PDF | Medium |
| EXP-05 | Export dropdown available on page headers, chart cards, and data tables | Medium |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| PERF-01 | Initial page load (dev build) | < 3 seconds on broadband |
| PERF-02 | Filter application on mock tables | < 200 ms |
| PERF-03 | Chart render with up to 12 data points | < 500 ms |
| PERF-04 | Support tables up to 10,000 rows (with pagination in production) | Planned |

### 5.2 Usability

| ID | Requirement |
|----|-------------|
| USA-01 | Interface shall follow government portal visual standards (green theme, official logos) |
| USA-02 | Numbers shall use Indian locale formatting (e.g., 10,50,000) |
| USA-03 | Charts shall display data labels without requiring hover |
| USA-04 | Multi-line charts shall alternate label positions to prevent overlap |
| USA-05 | Sidebar shall indicate current active page |
| USA-06 | Mobile layout shall remain usable with collapsible navigation |

### 5.3 Reliability

| ID | Requirement |
|----|-------------|
| REL-01 | Session shall survive page refresh (localStorage persistence) |
| REL-02 | Invalid routes shall redirect to login |
| REL-03 | Unauthorized access attempts shall redirect to allowed default route |

### 5.4 Maintainability

| ID | Requirement |
|----|-------------|
| MNT-01 | All components shall be written in TypeScript with typed interfaces |
| MNT-02 | Mock data shall be centralized in `frontend/src/data/mockData.ts` |
| MNT-03 | Filter configurations shall be centralized in `frontend/src/data/pageFilters.ts` |
| MNT-04 | Navigation structure shall be defined in `frontend/src/data/navigation.ts` |

### 5.5 Scalability (Production Target)

| ID | Requirement |
|----|-------------|
| SCL-01 | Backend API shall support pagination for large datasets |
| SCL-02 | Charts shall aggregate data server-side for date ranges > 1 year |
| SCL-03 | Filter queries shall be indexed on district, status, and date columns |
0
---

## 6. External Interface Requirements

### 6.1 User Interface

| Screen | Route | Components |
|--------|-------|------------|
| Login | `/login` | Government-themed form, role selector |
| Dashboard Shell | `/dashboard/*` | Header, sidebar, toolbar, filter bar, content area |
| Analytics Pages | `/dashboard/{module}/*` | PageHeader, KPIGrid, ChartCards, DataTable |
| Admin Pages | `/dashboard/admin/*` | Tabbed admin interface, file upload |

### 6.2 Hardware Interfaces

None. Web browser only.

### 6.3 Software Interfaces (Current)

| Interface | Technology | Purpose |
|-----------|------------|---------|
| Browser Storage | `localStorage` | Session persistence |
| File Upload | HTML5 File API | CSV/Excel import preview |

### 6.4 Software Interfaces (Planned)

| Interface | Technology | Purpose |
|-----------|------------|---------|
| REST API | Python FastAPI | Data queries, auth, admin CRUD |
| Database | PostgreSQL | `bis_raw`, `dmart_mp`, `ump_raw` schemas |
| Auth | JWT tokens | Secure session management |

### 6.5 Communication Interfaces

| Protocol | Usage |
|----------|-------|
| HTTP/HTTPS | All client-server communication (planned) |
| REST/JSON | API request/response format (planned) |

---

## 7. Data Requirements

### 7.1 Database Schemas

| Schema | Department | Status | Tables (Key) |
|--------|------------|--------|--------------|
| `bis_raw` | BIS Card Printing | Active (mock) | `t_card_printing_status` |
| `dmart_mp` | Madhya Pradesh Data Mart | Active (mock) | `claim_paid_t`, `t_bis_beneficiary_dtls`, `hospital_master_*_final`, `t_payment_dtls`, `t_suspicious_api_case_data`, `t_suspicious_api_case_dtls`, `lms_user_course_completion_status`, `t_workflow_transaction_audit` |
| `ump_raw` | User Management Platform | Active (mock) | User master tables |
| `dmart_mh` | Maharashtra Data Mart | **Not implemented** | — |

**Scale (dmart_mp):** 28 tables, 869 columns (per project documentation).

### 7.2 Geographic Hierarchy

| Level | Count | Example |
|-------|-------|---------|
| State | 1 | Madhya Pradesh |
| Division | 8 | Bhopal, Indore, Jabalpur, Gwalior, Ujjain, Rewa, Sagar, Narmadapuram |
| District | 52+ | Per division mapping in `filterOptions.ts` |

### 7.3 Filter-to-Column Mapping

| Filter Key | Database Column | Applicable Pages |
|------------|----------------|------------------|
| `schema` | `schema_name` | Overview |
| `division` | `division_name` | All MP pages |
| `district` | `district_name` | All |
| `status` | `case_status` / `card_print_status` / `empanelment_status` | Context-dependent |
| `gender` | `gender` | Beneficiaries |
| `urban_rural` | `urban_or_rural` | Beneficiaries, BIS |
| `hospital_type` | `hospital_type` | Hospitals |
| `case_type` | `case_type` | Claims |
| `role` | `role` | Users, UMP |
| `department` | `department` | Workflow users |
| `ekyc` | `ekyc_status` | Beneficiaries |
| `fraud_type` | `fraud_type` | Fraud & Audit |
| `course` | `course_name` | LMS Training |
| `nabh` | `nabh_certified` | Hospitals |
| `date_from` / `date_to` | `enroll_date`, `admission_dt`, `created_dt` | Date-filterable pages |

### 7.4 Mock Data Entities

Each analytics page consumes:

- **KPI array** — label, value, change %, color, optional navigation link
- **Chart datasets** — `ChartDataPoint[]` with `name` and metric keys
- **Table rows** — typed record objects matching schema column names

Connected drill-down datasets are defined in `frontend/src/data/connectedDemoData.ts`.

---

## 8. Security Requirements

### 8.1 Current (Simulation)

| ID | Requirement | Status |
|----|-------------|--------|
| SEC-01 | Route guards prevent unauthenticated access | Implemented |
| SEC-02 | Role guards restrict pages by role prefix | Implemented |
| SEC-03 | Passwords stored in plain text in mock file | **Demo only — not production safe** |
| SEC-04 | Session in localStorage without encryption | **Demo only** |

### 8.2 Production (Planned)

| ID | Requirement |
|----|-------------|
| SEC-P01 | Passwords hashed with bcrypt (cost factor ≥ 12) |
| SEC-P02 | JWT access tokens with 15-minute expiry |
| SEC-P03 | Refresh tokens with 7-day expiry, HTTP-only cookies |
| SEC-P04 | HTTPS enforced for all endpoints |
| SEC-P05 | Role permissions enforced at API layer, not only UI |
| SEC-P06 | Audit log for all admin actions (create, update, delete, login) |
| SEC-P07 | Rate limiting on login endpoint (5 attempts / 15 min) |
| SEC-P08 | Input validation and SQL injection prevention on all API queries |

---

## 9. Future Scope

### 9.1 Phase 2 — Backend Integration

- Python FastAPI REST API
- PostgreSQL connection to `bis_raw`, `dmart_mp`, `ump_raw`
- Replace mock data with paginated API calls
- JWT-based authentication

### 9.2 Phase 3 — Maharashtra Module

- `dmart_mh` schema dashboard (`/dashboard/mh/claims`)
- `mh_user` role and permissions
- Maharashtra-specific KPIs and geographic filters

### 9.3 Phase 4 — Advanced Analytics

- Real-time data refresh (WebSocket or polling)
- Scheduled report generation and email delivery
- Dashboard personalization (saved filter presets)
- Map-based district visualization

### 9.4 Phase 5 — Production Deployment

- Government cloud / on-premise hosting
- SSL certificate and domain configuration
- Database backup and disaster recovery
- Performance monitoring and logging (e.g., application logs, query analytics)

---

## 10. Appendices

### Appendix A — Route Map

| Route | Page | Schema |
|-------|------|--------|
| `/login` | Login | — |
| `/dashboard` | Overview | All |
| `/dashboard/bis/card-printing` | BIS Card Printing | `bis_raw` |
| `/dashboard/mp/claims-payments` | Claims & Payments | `dmart_mp` |
| `/dashboard/mp/beneficiaries` | Beneficiaries | `dmart_mp` |
| `/dashboard/mp/hospitals` | Hospitals | `dmart_mp` |
| `/dashboard/mp/patients` | Patients & Treatment | `dmart_mp` |
| `/dashboard/mp/fraud-audit` | Fraud & Audit | `dmart_mp` |
| `/dashboard/mp/users-workflow` | Users & Workflow | `dmart_mp` |
| `/dashboard/mp/lms-training` | LMS Training | `dmart_mp` |
| `/dashboard/ump/users` | UMP User Master | `ump_raw` |
| `/dashboard/admin/user-management` | User Management | Admin |
| `/dashboard/admin/import-bulk-data` | Import Bulk Data | — |

### Appendix B — Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| UI Framework | React | ^19.2 |
| Build Tool | Vite | ^8.2 |
| Language | TypeScript | ~6.0 |
| Routing | React Router DOM | ^7.18 |
| Charts | Recharts | ^3.10 |
| Styling | Tailwind CSS | ^4.3 |
| Icons | Lucide React | ^1.31 |
| Linting | Oxlint | ^1.75 |

### Appendix C — Key Source Files

| Purpose | File Path |
|---------|-----------|
| Routes | `frontend/src/App.tsx` |
| Navigation | `frontend/src/data/navigation.ts` |
| Auth types | `frontend/src/auth/types.ts` |
| Mock users | `frontend/src/auth/mockUsers.ts` |
| Permissions | `frontend/src/auth/permissions.ts` |
| Mock data | `frontend/src/data/mockData.ts` |
| Filter options | `frontend/src/data/filterOptions.ts` |
| Filter context | `frontend/src/context/FilterContext.tsx` |
| Global filter bar | `frontend/src/components/layout/GlobalFilterBar.tsx` |
| Charts | `frontend/src/components/charts/InteractiveCharts.tsx` |
| Drill-down | `frontend/src/hooks/useDrillDown.tsx` |
| Export utilities | `frontend/src/utils/exportUtils.ts` |

### Appendix D — Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 18-Aug-2026 | — | Initial SRS based on frontend simulation release |

---

*End of Document*
