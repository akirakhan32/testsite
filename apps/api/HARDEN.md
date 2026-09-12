# apps/api — harden + prod notes (Backend)

## Contract

`POST /api/contact` body: `{ name, email, message, budget? }`
`budget?`: `under-10k | 10-25k | 25-50k | 50k-plus | not-sure`

Responses: `200 { ok:true }` · `400|429|500 { ok:false, error, field? }`

Also:
- `GET /api/health` — liveness
- `GET /api/ready` — readiness (`503` if Resend misconfigured or CORS empty)

## Hardening in place

- Zod validation + `field` on 400
- IP rate limit 5 / 15m (in-memory; use Redis/KV multi-instance)
- Body limit 32KB → 400
- Honeypot `website` / `_hp` → fake 200
- CORS from `CORS_ORIGIN` (comma-separated exact origins)
- Stub logs full brief with short request id; Resend when configured
- Resend failure still logs stub so leads aren’t dropped silently (returns 500 to client)

## Resend (production email)

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=contact@codifypros.io
CONTACT_FROM_EMAIL=CodifyPros <noreply@your-verified-domain>
CORS_ORIGIN=https://www.codifypros.com,https://codifypros.com
```

`GET /api/ready` fails closed if `EMAIL_PROVIDER=resend` without a key.

## Smoke

```bash
npm run dev:api
curl -s localhost:8787/api/health
curl -s localhost:8787/api/ready
curl -s -X POST localhost:8787/api/contact -H 'content-type: application/json' \
  -d '{"name":"Alex","email":"a@co.com","message":"Need ops automation for CRM."}'
```
