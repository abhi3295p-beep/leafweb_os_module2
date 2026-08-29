# Development

## Tooling observed

- Node.js v24.18.1
- npm 11.16.0
- Git 2.55
- Docker: not installed
- `psql`: not installed
- pnpm: not installed (npm is the package manager)

## Setup

```bash
cd C:\Users\Abhilash\leafweb-os
copy .env.example .env
# Fill in .env before starting services, including POSTGRES_* and SUPER_ADMIN_* values.
docker compose up -d
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev
```

If Docker is unavailable, install Docker Desktop or a local PostgreSQL 16 instance and point `DATABASE_URL` at it. Do not switch the production schema to SQLite.

## Scripts

- `npm run dev` — Next.js
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run db:generate`

## Loop after each module

code → typecheck → lint → test → build → fix

## Storage

Local uploads go to `FILE_LOCAL_DIR` (default `./storage/uploads`), which is gitignored. Do not place private objects in `public/`.
