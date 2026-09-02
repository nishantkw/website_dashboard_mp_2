# PM-JAY Dashboard API

Express API with **Postgres + Supabase failover**. Schemas follow the Excel files in `Data dictionary/`.

## Dual database

`DB_PRIMARY` controls which pool is tried first:

1. **Postgres** — `DATABASE_URL`
2. **Supabase** — `SUPABASE_DB_URL`

If a query fails on the primary, the API automatically retries on the other pool.

## Quick start (local Postgres)

```bash
# 1. Start Docker Desktop, then:
cd backend
docker compose up -d

# 2. Env
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

# 3. Install + create schema only (no demo rows)
npm install
npm run setup

# 4. Run API
npm run dev
```

- API: http://localhost:4000  
- Health: http://localhost:4000/api/health  

Frontend Vite proxies `/api` → backend. Tables stay empty until you load real data.

## Supabase-only (or as fallback)

1. Create a Supabase project  
2. Run `sql/001_init_schemas.sql` in the SQL Editor  
3. Set `SUPABASE_DB_URL` (Database → URI)  
4. Optionally set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`  
5. Set `DB_PRIMARY=supabase` if Supabase should be tried first  
6. `npm run clear-data` if any old demo rows exist  

## Data

- `npm run migrate` — create schemas/tables only  
- `npm run clear-data` (alias: `npm run seed`) — **delete all rows**; does not insert demo data  
- Load real data with your own ETL / SQL / imports when ready  

There are **no demo users or sample claims** in the backend.

## Schema map (Data dictionary)

| Table | Source workbook |
|-------|-----------------|
| `ump_raw.user_master_ump` | data_dictionay_user_master_ump.xlsx |
| `ump_raw.ump_user_dtl` / `dmart_mp.ump_role_dtl` | UMP_DataDictionary |
| `bis_raw.t_bis_beneficiary_dtls` | Redshift BIS table |
| `dmart_mp.t_workflow_transaction_audit` | Redshift BIS workflow |
| `dmart_mp.claim_paid_excel_t` (+ view `claim_paid_t`) | Redshift TMS base |
| `dmart_mp.workflow_users_t` | Redshift TMS workflow |
| `dmart_mp.t_suspicious_api_case_*` | Fraud module |
| `dmart_mp.hospital_master` | Hospital module |
| `app_auth.dashboard_users` | Dashboard login |

## API routes

- `POST /api/auth/login`
- `GET  /api/auth/users`
- `GET  /api/health`
- `GET  /api/overview`
- `GET  /api/claims`
- `GET  /api/beneficiaries`
- `GET  /api/hospitals`
- `GET  /api/fraud`
- `GET  /api/workflow`
- `GET  /api/ump/users`

## Frontend

Pages use live API data when the backend is up. If the backend is offline, the frontend can show temporary demo UI (`ENABLE_DEMO_FALLBACK` in the frontend) — that is separate from the database.
