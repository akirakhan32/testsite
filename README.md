# CodifyPros

Premium marketing monorepo — operator-editorial site for CodifyPros.

**One-liner:** CodifyPros replaces manual operations with intelligent systems — software, agents, and workflows that run the work.

## Stack

| App | Path | Tech |
|-----|------|------|
| Web | `apps/web` | Astro 5 · TypeScript · CSS variables |
| API | `apps/api` | Hono · Zod · Node |

## Quick start

```bash
# From repo root
cp .env.example .env
npm install

# Terminal 1 — API (default :8787)
npm run dev:api

# Terminal 2 — Web (default :4321)
npm run dev:web
```

Open [http://localhost:4321](http://localhost:4321). Contact form posts to `PUBLIC_API_URL/api/contact`.

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — hero, stuck-ops wedge, 4 services, method, CTA |
| `/services` | Five offers + fit/not-fit band |
| `/about` | Team honesty, beliefs, method, studio |
| `/contact` | Form + email/phone channels |

No `/work` in v1 (empty collection — hidden by design).

## Design tokens

Ink `#0E1014` · paper `#F4F1EA` · copper `#C96A3D` · fonts: Instrument Serif, IBM Plex Sans, IBM Plex Mono.

## API

- `GET /api/health` → liveness `{ ok: true, status: "healthy" }`
- `GET /api/ready` → readiness (checks CORS + email provider config; `503` if not ready)
- `POST /api/contact` → `{ name, email, message, budget? }` · Zod · IP rate limit · honeypot · CORS

### Contact email

Default `EMAIL_PROVIDER=stub` logs the full brief to the API console.

For production mail via Resend:

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=contact@codifypros.io
CONTACT_FROM_EMAIL=CodifyPros <noreply@your-verified-domain>
CORS_ORIGIN=https://www.codifypros.com,https://codifypros.com
```

See `.env.example` and `apps/api/HARDEN.md`.

## License

Proprietary — CodifyPros.


## Deploy

**Web (Vercel):** import `akirakhan32/testsite`, use repo root (`vercel.json`).

**API:** deploy `apps/api` to Railway/Fly/Render. Set `CORS_ORIGIN` to the web origin, set web `PUBLIC_API_URL` to the API URL, optionally `EMAIL_PROVIDER=resend` + `RESEND_API_KEY`.
