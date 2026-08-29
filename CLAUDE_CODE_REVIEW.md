# Claude Code review — Module 1

## Architecture changes

Initialized `leafweb-os` as a Next.js App Router TypeScript app with Tailwind v4, Prisma 6, Zod, and a three-surface route plan (public, `/portal`, `/admin`).

## Database changes

Added the full Prisma schema for the specified core models, enums, indexes, unique conversion constraint on orders, and soft deletes. No migration has been applied yet.

## Authentication changes

None. Login UI is disabled. Session model exists in Prisma only.

## Authorization changes

Added permission keys, default role maps, `hasPermission` / `assertPermission`, and ownership helpers (`ownedByClient`, `assignedProjectWhere`). Not yet enforced in middleware or queries.

## API / server actions

None yet.

## Security-sensitive code

Permission catalog and scope helpers. File and payment provider interfaces are stubs. No secrets committed.

## Known risks

- Postgres/Docker missing on the build machine, so isolation tests against a real database cannot run.
- Public `/admin` and `/portal` routes are not created and not gated.
- Default role permissions in TypeScript must be seeded and then loaded from the database.

## Tests performed

Unit tests for permission checks, client ownership where-clauses, and `cn`.

## Known limitations

Homepage metrics and service catalog are empty until seed. Payments and email are integration boundaries only.
