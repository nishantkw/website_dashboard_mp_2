# Website Dashboard MP 2

Health analytics dashboard for **BIS**, **Maharashtra (dmart_mh)**, **Madhya Pradesh (dmart_mp)**, and **UMP** departments.

## Demo Frontend (Mock Data)

The frontend is a fully interactive simulation with demo data — no backend required.

### Run locally

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### What's included

| Page | Route | Schema |
|------|-------|--------|
| Overview (Landing) | `/` | All schemas |
| BIS Card Printing | `/bis/card-printing` | `bis_raw` |
| MH Claims | `/mh/claims` | `dmart_mh` |
| MP Claims & Payments | `/mp/claims-payments` | `dmart_mp` |
| MP Beneficiaries | `/mp/beneficiaries` | `dmart_mp` |
| MP Hospitals | `/mp/hospitals` | `dmart_mp` |
| MP Patients & Treatment | `/mp/patients` | `dmart_mp` |
| MP Fraud & Audit | `/mp/fraud-audit` | `dmart_mp` |
| MP Users & Workflow | `/mp/users-workflow` | `dmart_mp` |
| MP LMS Training | `/mp/lms-training` | `dmart_mp` |
| UMP User Master | `/ump/users` | `ump_raw` |

### Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Charts:** Recharts
- **Routing:** React Router v6
- **Backend (planned):** Python FastAPI + PostgreSQL

## Repository

[github.com/nishantkw/website_dashboard_mp_2](https://github.com/nishantkw/website_dashboard_mp_2)
