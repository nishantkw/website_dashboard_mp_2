# Implementation Plan — User Management & Analytics Portal

This document provides the technical implementation plan for the **User Management System & Analytics Dashboard**, detailing the simulation phase, frontend architecture, backend design, main database integration, and future deployment setup.

---

## 1. Simulation Phase (Prototyping & Mock Testing)

### Overview
Prior to live database and backend integration, a complete **interactive simulation** was built to validate user flows, tab navigation, side panel integration, and role-based permissions.

### Technologies & Tools Used
- **React 18 & Vite**: Fast development server and module bundling.
- **TypeScript**: Strict type interfaces (`AuthUser`, `UserRole`, `RoleRecord`, `AuditLog`).
- **Tailwind CSS**: Utility-first CSS framework for responsive layout styling.
- **Lucide React Icons**: Vector iconography for sidebar links, action buttons, and status indicators.
- **In-Memory React State & LocalStorage**: Managing session tokens, active tabs, filter criteria, and mock audit logs.

### Simulation Objectives & Validation
- **Role Switching**: Support for demo user roles (`super_admin`, `state_admin`, `bis_user`, `mh_user`, `mp_user`, `ump_user`).
- **UI Verification**: Interactive 4-Tab Admin Page (**User Management**, **Role Management**, **Permissions**, **Audit Logs**).
- **Sidebar Integration**: Dedicated **User Management** option in the side panel, separated from legacy `UMP` schema items.

---

## 2. Frontend Architecture & Implementation Plan

### Technology Stack
- **Framework**: React 18
- **Build System**: Vite
- **Language**: TypeScript (`.tsx` / `.ts`)
- **Styling**: Tailwind CSS & CSS Modules
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React
- **State Context**: `AuthContext` (User session & roles) and `FilterContext` (Global date & region filters)

### Component Hierarchy
```
src/
├── auth/
│   ├── AuthContext.tsx        # Authentication provider
│   ├── mockUsers.ts          # Credentials & role default routes
│   ├── permissions.ts       # Route & navigation access rules
│   └── types.ts             # Auth interfaces & UserRole types
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx # Access control route guards
│   └── layout/
│       ├── DashboardLayout.tsx# Main layout shell
│       ├── Sidebar.tsx        # Side panel with User Management link
│       └── GovernmentHeader.tsx# Header branding & profile widget
└── pages/
    ├── admin/
    │   └── UserManagement.tsx # 4-Tab Admin Module Component
    └── Login.tsx              # Role-based login page
```

### Admin Module Tabs
1. **User Management**:
   - Filter bar (search username/name, role dropdown, status dropdown).
   - User table showing Username, Full Name, Role Badge, Department, Active/Inactive status.
   - Action controls: Toggle Active/Inactive status, Reset Password modal, Create User modal.
2. **Role Management**:
   - System roles listing (`super_admin`, `state_admin`, `bis_user`, `mh_user`, `mp_user`, `ump_user`).
   - Role Labels, Descriptions, User Counts, and Create Role modal.
3. **Permissions**:
   - Matrix mapping system roles against application modules.
   - Dynamic checkbox controls for access toggling.
4. **Audit Logs**:
   - Activity log table recording User, Role, Action Name, Module, IP Address, Status, and Timestamp.

---

## 3. Backend Plan (Current Data & Technology Stack)

### Technology Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: `bcryptjs` (10 salt rounds)
- **CORS & Body Parser**: `cors` and `express.json()`

### Current Data Entities

#### Users (`users`)
```typescript
interface UserEntity {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: 'super_admin' | 'state_admin' | 'bis_user' | 'mh_user' | 'mp_user' | 'ump_user';
  division?: string;
  department?: string;
  office?: string;
  is_active: boolean;
  created_at: string;
}
```

#### Roles (`roles`)
```typescript
interface RoleEntity {
  roleid: number;
  rolename: string;
  role_label: string;
  isactive: boolean;
  created_at: string;
}
```

#### Permissions (`module_permissions`)
```typescript
interface ModulePermissionEntity {
  id: number;
  role: string;
  module_id: string;
  can_access: boolean;
  created_at: string;
}
```

#### Audit Logs (`audit_logs`)
```typescript
interface AuditLogEntity {
  id: number;
  user_id?: number;
  username: string;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'DENIED';
  ip_address: string;
  details?: string;
  created_at: string;
}
```

### API Routes Specification
- `POST /api/auth/login` — Login user & return JWT token.
- `GET /api/auth/me` — Return active authenticated profile & permissions.
- `GET /api/auth/roles` — Return active roles for login selection.
- `GET /api/admin/users` — List system users.
- `POST /api/admin/users` — Create new user account.
- `PUT /api/admin/users/:id` — Update user details or role assignment.
- `PATCH /api/admin/users/:id/status` — Toggle user Active/Inactive state.
- `POST /api/admin/users/:id/reset-password` — Reset password for user.
- `GET /api/admin/roles` — List defined roles.
- `POST /api/admin/roles` — Create new custom role.
- `GET /api/admin/permissions` — Fetch permission matrix.
- `PUT /api/admin/permissions` — Save permission matrix updates.
- `GET /api/admin/audit-logs` — Fetch system activity logs.

---

## 4. Main Database Integration Plan

### Database Architecture
- **Engine**: SQL Server Express 2022 (with dual-compatibility layer for SQLite).
- **Driver**: `mssql` / `tedious` Node.js drivers.
- **Connection Layer**: Parameterized query binding, pool management, and identity insert utilities.

### Schema Relationships
- `users.role` → `roles.rolename`
- `module_permissions.role` → `roles.rolename`
- `audit_logs.user_id` → `users.id`

### Integrity Rules
- System protects primary `super_admin` account from deactivation or deletion.
- `super_admin` role retains mandatory access to `user_management`.

---

## 5. Deployment Setup Plan

> **Note**: Deployment technology choice is not decided yet. The hosting environment selection (e.g. Windows Server / IIS, Linux Container / Docker, PaaS, or Cloud VM) will be finalized in a subsequent phase.

### Deployment Preparedness Checklist
- **Configuration**: Environment variables (`.env`) for DB credentials, JWT secrets, and CORS origins.
- **Build Output**: Static production bundle generation (`npm run build`).
- **Security & Proxy**: SSL/TLS reverse proxy configuration and API header hardening.
