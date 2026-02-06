# CoDesk Database + SPA

## Database migrations
Apply order:
1. 000_init.sql
2. 001_tables.sql
3. 002_constraints_indexes.sql
4. 003_rpcs.sql
5. 004_rls.sql
6. 005_views.sql
7. 006_seed.sql
8. 007_grants.sql

Quick tests:
- quick_tests.sql

## SPA setup
1. Install deps

```bash
npm install
```

2. Configure env

```bash
cp .env.example .env
```

Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. If missing or unreachable, the app auto-switches to DEMO MODE.

3. Run dev server

```bash
npm run dev
```

## Tests
- Unit: `npm test`
- E2E: `npm run test:e2e`

Notes:
- RPC error codes are raised as exception message with SQLSTATE P0001.
- DEMO MODE uses in-memory data and still supports booking/holiday/reports flow.
