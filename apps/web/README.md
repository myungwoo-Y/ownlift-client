# OwnLift Web

Small static Next.js App Router site for OwnLift launch support pages.

## Local Development

From the repository root:

```sh
pnpm --filter @ownlift/web dev
pnpm --filter @ownlift/web lint
pnpm --filter @ownlift/web build
```

## Vercel Settings

- Root Directory: `apps/web`
- Build Command: `pnpm build`
- Output: Next.js default

No analytics, tracking, cookies, ads, newsletter forms, or server data collection are configured.
