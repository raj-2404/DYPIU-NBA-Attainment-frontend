# DYPIU NBA Attainment Frontend - Architecture & Overview

## 1. Project Summary
The DYPIU NBA Attainment Frontend is a React single-page application built with Vite, providing interfaces for institutional accreditation management, outcome-based education (OBE) tracking, marks upload, survey processing, and hierarchical approval workflows.

## 2. Technology Stack
- **Core**: React 19, JavaScript ES Modules, React Router v7
- **Build Tool**: Vite 8 (Dev server on port 5173 with proxy to backend port 8080)
- **Icons**: Lucide React
- **HTTP Client**: Axios with automatic JWT bearer token interceptor and automatic token refresh queue
- **Spreadsheet Ingestion**: SheetJS (`xlsx`) for client-side Excel verification and formatting
- **Styling**: Modern Vanilla CSS design system (`index.css` & `App.css`)

## 3. Directory Layout
```
src/
  ├── api/              # Axios client and API service endpoints (academic, auth, attainment, reports, dashboard)
  ├── assets/           # Logos, SVGs, static assets
  ├── components/       # Reusable layout and UI elements (Header, Sidebar, Modals, Breadcrumbs, StatusBadges)
  ├── context/          # React Contexts (AuthContext, ThemeContext, AcademicContext)
  ├── features/         # Feature modules by role and domain:
  │     ├── director/
  │     ├── hod/
  │     ├── programme-coordinator/
  │     ├── mapping/
  │     ├── marks/
  │     ├── outcomes/
  │     ├── poPsoAttainment/
  │     ├── reports/
  │     ├── review/
  │     ├── survey/
  │     └── users/
  ├── pages/            # Top-level route pages and role dashboards
  └── routes/           # Protected routes and navigation tree (AppRoutes.jsx)
```

## 4. Primary Features by Role
- **Director**: School structure, Department setup, HOD assignment, Programme overview, and School-wide reporting.
- **HOD**: Batch management, Programme Coordinator assignment, Course management, Programme Outcomes review, ATR approval.
- **Programme Coordinator**: Target settings, Batch-level PO/PSO calculation review, Programme ATR generation.
- **Course Coordinator**: CO target setting, CO-PO/PSO mapping matrix, End Sem marks upload, Course End Survey upload, CO calculation run, Course ATR.
- **IQAC**: Consolidated institutional reports and oversight across all schools and programmes.
