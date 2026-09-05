# mullaney.ai

Personal site for [Kelly Mullaney](https://mullaney.ai), VP of Internal Applied AI at Juniper Square.

The home page pairs a short bio with a phone-frame Shorts feed. Confident AI takes run back to back with direct counters.

## Stack

- Next.js (App Router)
- TypeScript
- Hand-authored CSS
- Upstash Redis (Shorts like/dislike votes)
- Vitest + Testing Library
- Deployed on Vercel

## Develop

```bash
npm install
npm run dev
```

## Environment variables

Votes are stored in Upstash Redis. `lib/votes/redis.ts` uses the first complete credential pair it finds:

| Variable | Purpose |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Classic Upstash Redis REST credentials |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Set by the Vercel Marketplace Upstash integration |

Copy `.env.example` to `.env.local` and fill in whichever pair you have.

Without Redis credentials, the vote API returns 503 and the UI shows zero counts. The feed still works, and local development needs no secrets.

## Quality scripts

```bash
npm test          # Vitest unit/component tests
npm run lint      # ESLint (eslint-config-next)
npm run typecheck # tsc --noEmit
npm run build     # Next.js production build
```

## Deploy

Hosted on Vercel at [mullaney.ai](https://mullaney.ai).
