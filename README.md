# Ownd

Territory-based running tracker. Every street you run becomes yours. Others can steal it by running it with a better score.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (PostGIS) · Mapbox GL JS · Stripe.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in keys.
3. Apply migrations: `supabase db push` (or paste `supabase/migrations/*.sql` into the SQL editor).
4. Deploy edge functions:
   ```
   supabase functions deploy process-run
   supabase functions deploy decay
   ```
   Schedule `decay` to run daily via Supabase Cron.
5. Configure Stripe webhook → `/api/stripe/webhook`. Set `NEXT_PUBLIC_STRIPE_PRICE_ID` to your €5/month recurring price.
6. `npm run dev`.

## Scoring

- New segment: claimed at score 50.
- Owner re-runs: +10 (cap 100), `last_defended_at` bumped.
- Rival runs: if owner has no active `shield` power-up, score -= 15 (+ runner boost). On hitting 0, ownership transfers.
- Daily decay (cron `decay`): -5 if not defended in 24h.

## Pages

| Route | Notes |
|---|---|
| `/` | Landing + map preview |
| `/map` | Full territory map |
| `/run` | GPS tracker, uploads run → `process-run` edge fn |
| `/profile/[username]` | Stats. Run history & streaks behind paywall |
| `/leaderboard` | Premium only |
| `/shop` | Buy power-ups (USDC simulated for MVP) |
| `/login` | Magic link + Google |

## Env vars
`NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_ID`, `NEXT_PUBLIC_SITE_URL`.
