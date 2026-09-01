# LEAFWEB OS STAGING DEPLOYMENT CHECKLIST

## Summary

Status legend: PASS, BLOCKED, PENDING, FAIL

## Deployment target

- Selected target: Vercel (simplest supported deployment target for this Next.js repository)
- Vercel authentication: PASS (CLI authenticated successfully via device login)
- Vercel project linkage: PASS (`npx vercel link` succeeded and the repo is linked to the project `pasted-text-processing`)
- Vercel project creation: PASS (the project exists in the Vercel account)
- Preview/staging deployment: BLOCKED (no staging environment variables or hosted PostgreSQL are configured)
- Initial production deployment created by default: PASS (this was an initial deployment only; it is not a valid staging deployment and is not considered production-ready)
- Repository architecture fit: PASS

## Environment variables

- NODE_ENV: PENDING (not set in the Vercel Preview environment yet)
- DATABASE_URL: BLOCKED (no hosted staging PostgreSQL is configured; local development URL is not valid for staging)
- AUTH_SECRET: BLOCKED (not configured in the Vercel Preview environment)
- APP_URL: BLOCKED (staging domain + HTTPS are not configured)
- FILE_DRIVER: PENDING (must be `s3` or `r2` for a shared staging deployment)
- storage credentials: BLOCKED (real S3/R2 credentials are not configured)
- payment provider credentials: BLOCKED (real provider credentials are not configured)
- payment webhook secret: BLOCKED (real provider webhook secret is not configured)
- AI provider credentials: BLOCKED (real AI API key is not configured)
- AI tool allowlist: PENDING (must be restricted to the approved tool set)
- monitoring/observability config: BLOCKED (deployment platform monitoring and alerts are not configured)
- production fallback secrets: PASS (no production fallback dev secret remains in code)

## Database

- PostgreSQL local verification: PASS
- Prisma schema validation: PASS
- Prisma client generation: PASS
- Prisma migration status: PASS (with the configured local DATABASE_URL only)
- Vercel Preview DATABASE_URL: BLOCKED (no real hosted staging PostgreSQL is configured)
- Prisma migration deploy to staging: BLOCKED (requires a real hosted staging DATABASE_URL)
- seed safety: PASS (seed remains idempotent and RBAC-aware)
- destructive database commands: PASS (not used; prohibited)

## Application verification

- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm test`: PASS (14/14)
- `npm run build`: PASS
- `npx prisma validate`: PASS (with the active local env loaded)
- `npx prisma generate`: PASS
- E2E command: PENDING / NONE DETECTED in package.json (no existing E2E runner was found; none invented)

## Security

- authentication server-side: PASS
- RBAC enforcement: PASS
- client/tenant isolation: PASS
- ownership checks: PASS
- browser-supplied IDs not trusted: PASS
- AI tool deny-by-default: PASS
- file authorization: PASS
- payment success not trusted from frontend: PASS
- webhook verification must be server-side: PENDING (requires real provider secret in deployment)
- secrets are not committed: PASS
- no dev secret fallback in production logic: PASS

## HTTPS / domain / runtime

- staging domain: BLOCKED
- HTTPS/SSL: BLOCKED
- APP_URL: BLOCKED
- Vercel CLI login status: BLOCKED (not authenticated in this environment)

## Monitoring and rollback

- monitoring: BLOCKED
- backup plan: BLOCKED
- rollback plan: PENDING

## Real staging smoke tests

- login: BLOCKED (no live staging app)
- logout: BLOCKED
- auth failure handling: BLOCKED
- super admin access: BLOCKED
- RBAC enforcement: BLOCKED
- tenant/client isolation: BLOCKED
- CRM lead create/read/update: BLOCKED
- lead-to-client conversion: BLOCKED
- project create/read/update: BLOCKED
- milestone/task operations: BLOCKED
- order creation: BLOCKED
- invoice creation: BLOCKED
- payment flow: BLOCKED
- payment webhook verification: BLOCKED
- file upload/access authorization: BLOCKED
- unauthorized file rejection: BLOCKED
- AI tool authorization: BLOCKED
- unauthorized AI rejection: BLOCKED
- search authorization: BLOCKED
- automation execution/authorization: BLOCKED

## Final staging status

The application codebase is validated and ready for a real staging deployment, but no real staging environment, domain, PostgreSQL host, provider credentials, or deployment credentials were available in this session. Therefore the app is ready for environment configuration but not yet live on staging.

## Required staging environment checklist before go-live

- Real staging PostgreSQL database
- `DATABASE_URL` set in the deployment environment
- `AUTH_SECRET` configured with a strong random secret
- `APP_URL` configured with the staging domain and HTTPS
- `FILE_DRIVER` set to `s3` or `r2`
- S3/R2 credentials configured
- payment provider keys and webhook secret configured
- AI provider key and allowlist configured
- monitoring and alerts configured
- backup and rollback strategy defined
- smoke tests executed against the deployed staging app
