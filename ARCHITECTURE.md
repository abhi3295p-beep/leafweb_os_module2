# LEAFWEB OS architecture

LEAFWEB OS is a single Next.js application with three experiences:

1. Public website (`/`)
2. Client portal (`/portal`)
3. Private admin OS (`/admin`)

The App Router, server components, server actions, and route handlers share one PostgreSQL database through Prisma.

## Module status

| Module | Status |
| --- | --- |
| 1 Foundation | In progress in this repository |
| 2 Database seed/migrations | Schema exists; migrate after Postgres is available |
| 3 Authentication | Not implemented |
| 4 RBAC enforcement in request path | Permission catalog exists; session wiring is Module 3 |

## Runtime split

- **Server Components** load data for dashboards, catalogs, and invoices.
- **Server Actions** mutate orders, projects, milestones, and admin status changes.
- **Route handlers** serve authenticated file downloads and future payment webhooks.
- **Client components** are limited to interactive UI (dialogs, toasts, tabs, forms).

## Identity and tenancy

Identity is derived only from the server session. The browser must never supply `clientId`, role, or permission as an authority.

Clients are a `Client` row linked 1:1 with a `User`. Staff are a `TeamMember` row linked 1:1 with a `User`. A user has exactly one `Role`. Roles grant `Permission` keys through `RolePermission`.

Authorization sequence for every protected operation:

```text
authenticate → identify role → check permission → check ownership → database
```

Client queries must include `clientId` from the session. Staff without finance permissions cannot read invoices or payments. Developers and similar roles may only access assigned projects unless they also have `project.read`.

## File and payment boundaries

Private files use `FileObject` plus a storage driver. Local development writes outside `public/`. Production targets S3 or R2. Downloads are authorized routes.

Payments expose `PaymentProvider`. Phase 1 does not charge cards.

## Out of scope for Module 1

Login, register, email verification, portal dashboards with live counts, order conversion, and admin CRM screens.
