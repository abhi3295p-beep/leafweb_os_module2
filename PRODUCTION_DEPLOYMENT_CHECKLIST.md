# LEAFWEB OS Production Deployment Checklist

## 1. Infrastructure requirements

Required runtime and infrastructure for a production deployment of the existing LeafWeb OS app:

- Managed or self-hosted Node.js runtime for Next.js 16 app
- Managed PostgreSQL 16+ database (recommended) or a dedicated production PostgreSQL instance
- HTTPS domain and DNS configured for the application
- Production secret manager or deployment platform environment store
- Private file storage for `FILE_DRIVER=s3` or `r2` in production; local file storage is only acceptable for non-production or ephemeral environments
- Reverse proxy or platform ingress with HTTP to HTTPS redirect enabled
- Nginx/ingress or platform-level firewall rules for only required ports
- Monitoring, log ingestion, and alerting for app, database, and payment/webhook failures
- Automated backup strategy for PostgreSQL data and application assets

The current repository is a single Next.js application with a server-side PostgreSQL + Prisma architecture and private server-side authorization. It should be deployed as a single app runtime, not split into separate app modules.

## 2. PostgreSQL requirements

Required production Postgres configuration:

- Database engine: PostgreSQL 16 or later
- Separate production database from local development database
- Dedicated user with least-privilege access for application runtime
- Database created explicitly for LeafWeb OS, not a shared dev instance
- SSL/TLS enabled for remote database connections
- Prisma migration deploy run on the production database only after a backup
- Do not use SQLite or mock database providers in production

Example production connection string:

```env
DATABASE_URL="postgresql://leafweb_app:REPLACE_ME@prod-db-host:5432/leafweb_os?schema=public"
```

The app currently expects `DATABASE_URL` to be present before database operations. The code will not proceed without it.

## 3. Environment variables

Required by the application codebase:

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/leafweb_os?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
APP_URL="https://app.example.com"
FILE_DRIVER="s3" # or "r2" for Cloudflare R2, or "local" only for non-production
FILE_LOCAL_DIR="./storage/uploads" # only used for local file storage
```

Deployment-specific/seeding variables required by the app during setup:

```env
SUPER_ADMIN_EMAIL="admin@company.com"
SUPER_ADMIN_PASSWORD="replace-with-a-strong-password-min-12-chars"
SUPER_ADMIN_NAME="LeafWeb Super Admin"
```

Local Docker variables used only for development and local PostgreSQL bootstrap:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=leafweb_os
POSTGRES_PORT=5433
```

These local development variables must never be reused as production secrets.

## 4. Secret configuration

- Store all production secrets in a managed secret store or deployment environment variables, not in source control.
- Never commit `.env`, `.env.*`, or provider keys to Git.
- Use `AUTH_SECRET` with sufficient entropy; do not rely on a fallback local-development secret.
- Keep DB credentials, payment keys, AI provider keys, and email credentials in the deployment platform or a secret manager.
- Ensure `.env` and `.env.*` are ignored in Git.

## 5. Prisma migration procedure

Safe production migration steps:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
```

Rules:

- Do not use `prisma migrate reset`.
- Do not use `prisma db push --force-reset`.
- Do not drop the database or schema.
- Take a backup before deploy migrations in a live environment.
- Run migrations only against the intended production database.

## 6. Seed procedure

The repository contains an idempotent seed process for roles, permissions, service catalog, packages, and the super admin account.

```bash
npm run db:seed
```

Production guidance:

- Only run seed against a new or intended production database.
- Keep `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` controlled and protected.
- Confirm the seeded super-admin user matches the production operational account.
- Do not run seed as a destructive reset mechanism.

## 7. Storage configuration

The codebase supports configuration for storage drivers via `FILE_DRIVER`:

- `local` — acceptable only for development or a controlled local runtime
- `s3` — production default candidate
- `r2` — production default candidate for Cloudflare R2

Production requirements:

- Keep private file uploads outside `public/`
- Use a bucket or storage namespace with restricted access
- Require server-side authorization before file download or access
- Use object-level ACLs and signed URLs only where required
- Store only encrypted or private file references in the database

## 8. Payment configuration

The app contains payment-related server-side logic around provider verification and idempotency. Production requirements:

- Confirm the payment provider is configured in the deployment environment
- Use provider webhook verification with server-side signature validation
- Treat browser-provided `payment success` values as untrusted
- Require server-side final confirmation from the provider/webhook before marking a payment successful
- Record idempotency keys to prevent duplicate webhook processing
- Keep provider API keys in the environment secret store

Production implementation must verify provider signatures before updating payment state.

## 9. AI configuration

The codebase includes AI execution and tool authorization primitives. Production requirements:

- Define the allowed AI tools and execution scope by environment or deployment configuration
- Restrict AI access to the tenant/client scope, not unrestricted database access
- Use a provider token or secret stored in deployment secrets
- Require audit logging for AI actions
- Enforce allowlist-based execution rules
- Never grant unrestricted DB or admin access to AI employee executions

## 10. Authentication and RBAC

Production requirements:

- Real `AUTH_SECRET` must be configured for JWT/session signing
- Cookies must be `httpOnly`, `sameSite`, and secure in production
- Session token must be validated on the server
- Role and permission checks must be read from the database, not browser input
- Only authorized users may access `/admin` and `/portal`
- Client isolation must be enforced by server-side tenant/client checks
- No browser-provided `userId`, `clientId`, role, or permission should be trusted

## 11. Domain / DNS / HTTPS

- Configure a production domain for the app
- Set `APP_URL` to the canonical HTTPS URL
- Ensure TLS certificate is active and valid
- Redirect HTTP to HTTPS
- If behind a CDN or proxy, configure trust headers correctly for secure cookies and generated URLs

## 12. Monitoring and logging

- Capture application logs for auth failures, DB failures, payment webhook failures, and AI tool activity
- Monitor database connection health and migration deploy status
- Alert on failed payment verification, webhook retries, or file authorization errors
- Store audit logs for admin actions, file access, payment events, and AI execution
- Maintain a log retention policy that respects compliance requirements

## 13. Backup requirements

- Daily or continuous Postgres backup strategy
- Backup verification and restore testing at least quarterly
- Retain backups beyond the rollback window
- Back up storage buckets or object storage metadata with retention policy
- Test restore procedure before go-live

## 14. Rollback procedure

- Keep the previous build artifact or deployment version available
- Check database migration rollback plan before production deployment
- Coordinate app and database version rollback carefully
- If a migration is irreversible, validate the release and backup strategy before go-live
- Use a staged rollout or canary deployment for critical production releases

## 15. Production smoke tests

Before declaring go-live, run the following against the real production environment:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx prisma validate
npx prisma generate
npx prisma migrate status
```

Then verify in the live deployment:

- Login succeeds for valid user
- Invalid login fails
- Admin-only routes reject unauthorized users
- Client portal access is tenant-scoped
- Cross-client resource access is denied
- Payment callback/webhook validation works
- File download requires authorization
- AI execution respects tool allowlist and client scope
- DB migration remains green after deployment

## 16. Security checks

- `.env` not committed to Git
- secrets stored in deployment platform secret manager
- `AUTH_SECRET` configured and strong
- Postgres connection string kept private
- no hardcoded credentials in code or docs
- session cookies use secure settings in production
- server-side permission enforcement is not bypassed by client state
- file downloads require server-side authorization
- payment success depends on server-side provider confirmation
- AI tools are allowlisted and scoped
- audit logs are recorded for sensitive actions

## 17. Final go-live checklist

- Production database provisioned and reachable
- `DATABASE_URL` configured in deployment environment
- `AUTH_SECRET` configured and strong
- `APP_URL` configured to HTTPS domain
- `FILE_DRIVER` set correctly for production storage
- secret manager configured and `.env` ignored in Git
- Prisma migration status validated against production database
- `npm run db:seed` reviewed and run only if intended
- login/auth flow verified in production-like environment
- RBAC and tenant isolation verified
- payment/webhook verification enabled
- AI tool restrictions verified
- file authorization verified
- monitoring, backup, and rollback plan validated
- final smoke tests pass

## 18. Final decision

This repository is not ready for production deployment until the required production infrastructure and environment secrets are actually configured and validated in a live-runtime environment. The project may be considered deployment-ready only after the above checks pass against the real production environment.
