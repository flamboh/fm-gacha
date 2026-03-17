# TanStack Start + Convex + Clerk Starter

Lean base repo for projects that want:

- TanStack Start + file-based routing
- Convex for backend functions and realtime
- Clerk for auth
- Tailwind CSS v4
- Cloudflare-ready build tooling

Starter behavior:

- Near-blank landing page
- Minimal header with auth entry point
- Verification scripts aligned with repo requirements

## Quick start

```bash
bun install
cp .env.example .env.local
bun run dev
```

## Env

Required:

- `CONVEX_DEPLOYMENT`
- `VITE_CONVEX_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_FRONTEND_API_URL`

## Scripts

```bash
bun run dev
bun run build
bun run fmt
bun run lint
bun run typecheck
```

## Structure

```text
src/routes/          route files
src/lib/             shared client modules
convex/              backend functions and schema
```

## Notes

- `src/routeTree.gen.ts` and `convex/_generated/` are generated.
- Devtools render only in development.
- `wrangler.jsonc` stays in place for Cloudflare deploy work later.
