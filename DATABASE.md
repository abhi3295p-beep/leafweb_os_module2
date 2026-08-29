# Database

Provider: PostgreSQL via Prisma.

Connection string: `DATABASE_URL`.

Local development: `docker compose up -d` using `docker-compose.yml` (Postgres 16). Docker Desktop was not installed on the implementation machine at Module 1 time.

## Models

User, Client, TeamMember, Role, Permission, RolePermission, Session, VerificationToken, Service, Package, Lead, Order, OrderFile, Project, ProjectMember, Milestone, Task, FileObject, Message, Notification, NotificationPreference, Invoice, Payment, ActivityEvent, AuditLog, AgencySetting.

## Constraints worth reviewing

- `Order.projectId` is unique so an order converts to at most one project.
- `Order.clientId` is required and is set from the session, never from a client-supplied field.
- Soft deletes use `deletedAt` on tenant-owned resources.
- `AuditLog` is append-only in application code. Do not expose update/delete APIs for it.
- `Payment.idempotencyKey` is unique for future provider calls.
- Project progress is an integer 0–100 recalculated from milestones, not a hardcoded UI value.

## Indexes

Indexes cover tenant filters (`clientId` + status), unique slugs, session expiry, and audit lookups.

## Migrations

After Postgres is running and the required `.env` values are set:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed requires `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` (minimum 12 characters), and `SUPER_ADMIN_NAME`. The credentials are read only from the environment and are never stored in `.env.example`.

Seed data (Module 2) should create roles, permissions, services, packages, a super admin, and two isolated demo clients for authorization tests.
