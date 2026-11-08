# Medianet BAISKOAFU Subscription Reports

Secure internal reporting portal on top of the Medianet CRM.

- **Report data** is read directly (read-only) from the CRM MongoDB — the same database the CRM itself uses — via aggregation pipelines. The CRM REST API is per-contact (`/contacts/{id}/services`), so listing every BAISKOAFU subscriber through it would mean thousands of calls per page; one aggregation does it in a single query.
- **App data** (portal users, permissions, sessions, audit logs) is stored in MySQL/MariaDB. Tables are created automatically on startup.

| Report | Contact tag | Subscription package |
| --- | --- | --- |
| Medianet TV | `Medianet TV` | `BAISKOAFU` |
| OTT | `OTT` | `BAISKOAFU OTT` |

Each row is one subscription: contact code, customer name/type, phone, email, island/atoll, package, status, price, **subscription start date**, **end date** and days remaining. Filters: search, status, validity (active/expired), start/end date ranges, sorting, paging and CSV export.

Admins create users and decide per user which reports they see, whether they may export, whether they see full phone/email (otherwise masked), and whether they may manage users or read audit logs.

## Structure

```
backend/                 Node.js + Express REST API (layered)
  src/config/            env validation (zod), DB connections, report definitions
  src/constants/         roles & permissions catalogue
  src/database/          MySQL schema (users, refresh_tokens, audit_logs), applied idempotently on startup
  src/repositories/      data access; MySQL repositories + subscriptionReport.repository.js (CRM aggregation)
  src/services/          business logic (auth, tokens, users, reports, audit)
  src/controllers/       HTTP layer
  src/routes/            /api/v1 routing + permission guards
  src/middlewares/       auth, RBAC, CSRF, validation, rate limits, sanitising, errors
  src/validators/        zod request schemas
  scripts/create-admin.js  bootstrap first administrator
  scripts/mysql-setup.sql  one-time MySQL database + least-privilege user creation
  tests/                 unit tests (node --test)
frontend/                React + TypeScript + Vite + MUI
  src/api/               axios client (CSRF header, silent token refresh) and API modules
  src/context/           AuthContext (session, permissions, idle sign-out)
  src/routes/            ProtectedRoute / RequirePermission guards
  src/layouts/ pages/ components/ hooks/ utils/
  nginx.conf             production static hosting + API reverse proxy + security headers
docker-compose.yml
```

## Local development

Requirements: Node 20+, MySQL 8+ or MariaDB 10.5+, and network access to the CRM MongoDB (5.0+).

```bash
# 0. One-time: create the BAISKOAFU database and user (asks for the MySQL root password)
mysql -u root -p < backend/scripts/mysql-setup.sql

# 1. API
cd backend
cp .env.example .env          # fill DB_*, CRM_MONGO_URI, JWT_ACCESS_SECRET
npm install
npm run create-admin -- --username admin --name "System Administrator"
npm run dev                   # http://localhost:5050

# 2. Web
cd ../frontend
npm install
npm run dev                   # http://localhost:5173 (proxies /api to :5050)
```

Sign in with the printed temporary password; you are forced to set a new one.

`npm test` (backend) runs the unit tests. `npm run build` (frontend) type-checks and builds.

## Security controls

- **Authentication**: bcrypt password hashes; 15‑minute JWT access token and rotating opaque refresh token, both in `HttpOnly`, `Secure`, `SameSite=Strict` cookies (`__Host-`/`__Secure-` prefixed). Tokens are never readable by JavaScript.
- **Refresh token theft detection**: refresh tokens are stored hashed and rotated on every use. Re-using an old one revokes the whole session family. Sessions have an absolute lifetime (`REFRESH_TOKEN_TTL_HOURS`).
- **Instant revocation**: each request reloads the user, so disabling a user, changing permissions or resetting a password takes effect immediately.
- **Brute force**: account lockout after `LOGIN_MAX_ATTEMPTS` failures, per IP+username login rate limit, global API rate limit, plus nginx `limit_req`. Login errors are generic, and timing is constant for unknown users.
- **Password policy**: 12+ chars with upper, lower, digit and symbol; must not contain the username. Admin-issued passwords are temporary and must be changed at first login.
- **RBAC**: permission checks on every API route (server side) and in the UI. Admins cannot demote, disable or delete themselves, and the last active admin is protected.
- **CSRF**: double-submit token on every state-changing request, in addition to SameSite=Strict.
- **Injection**: zod validation with whitelisted fields/sort keys, parameterised MySQL queries with escaped `LIKE` patterns and a column whitelist for updates, Mongo operator and prototype-pollution key stripping, escaped regex search, and CSV formula-injection neutralisation.
- **Data minimisation**: phone, email and address are masked unless the user has `View full contact details`. API responses are `Cache-Control: no-store`.
- **Headers**: Helmet on the API; strict CSP, `X-Frame-Options: DENY`, `nosniff`, `no-referrer` and Permissions-Policy from nginx.
- **Audit trail**: logins (success/failure/lockout), refresh-token reuse, report views and exports (with filters and row counts) and all admin actions, with IP and user agent. Retention is controlled by `AUDIT_RETENTION_DAYS`. Logs redact cookies and passwords.
- **Idle timeout**: the browser signs out after 15 minutes of inactivity.
- **CRM is read-only**: the app only runs aggregations against the CRM. Give `CRM_MONGO_URI` a MongoDB user with only the built-in `read` role.

## Production checklist

1. Serve only over HTTPS (TLS at the load balancer). Keep `COOKIE_SECURE=true` and `NODE_ENV=production`. Uncomment HSTS in `frontend/nginx.conf`.
2. Set `CORS_ORIGINS` to the public URL and `TRUST_PROXY` to the number of proxies (compose sets 1).
3. Generate a unique `JWT_ACCESS_SECRET` (64+ random bytes) and keep `.env` out of source control.
4. Use a read-only CRM database user, and the dedicated least-privilege MySQL user from `scripts/mysql-setup.sql` (change its password). Set `DB_SSL=true` if MySQL is on another host. In Docker, the API reaches the host's MySQL via `host.docker.internal`; MySQL must accept connections from the Docker network.
5. Recommended CRM indexes: `Subscriptions { "services.product.name": 1 }`, `ContactProfiles { contact_id: 1 }`, `Journals { contact_id: 1 }`.
6. `docker compose up -d --build`, then `docker compose exec api node scripts/create-admin.js --username admin`.

## Changing tags or packages

Edit these values in `backend/.env` (comma-separated lists are allowed for products):

```
REPORT_MEDIANET_TV_TAG=Medianet TV
REPORT_MEDIANET_TV_PRODUCTS=BAISKOAFU
REPORT_OTT_TAG=OTT
REPORT_OTT_PRODUCTS=BAISKOAFU OTT
```
