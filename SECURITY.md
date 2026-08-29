# Security

## Non-negotiable rules

- Never trust `clientId`, role, or permission from the client.
- Never load a client resource by id alone.
- Never expose private files from `/public/uploads`.
- Never process live payments in Phase 1.
- Never commit `.env` or provider secrets.
- Do not authorize with `if (role === "ADMIN")`. Use permission keys.

## Request path

Every protected mutation and query:

1. Authenticate the session.
2. Load the user role and granted permission keys from the database (cached only with a short, server-side strategy later).
3. Require the permission for the operation.
4. Enforce ownership or assignment (`ownedByClient`, `assignedProjectWhere`).
5. Perform the Prisma operation, preferably in a transaction for multi-step writes.

`/admin/*` requires `admin.access`. Clients have `portal.access` only. Hiding navigation is not access control.

## Client isolation

Example: Client A requesting project B is denied because `project.clientId` must equal the session client id.

The same pattern applies to orders, invoices, payments, files, messages, tasks, milestones, notifications, and activity.

## Audit

Security-sensitive actions write `AuditLog` rows: login, order create/approve/convert, project create/update, permission changes, file upload/download, payment updates.

Application code must not update or delete audit rows.

## Known risks (Module 1)

- Authentication is not implemented, so `/admin` and `/portal` are not yet gated.
- Prisma migrations have not been applied because PostgreSQL/Docker were unavailable on this machine.
- Contact and login forms are intentionally disabled to avoid fake success states.
- Permission maps live in source (`DEFAULT_ROLE_PERMISSIONS`). Seed must persist them; runtime must read from the database after Module 2–4, not from this constant as the only source of truth.
