# apps/api harden notes (Backend) — 2026-09-12

Reviewed `/workspace/codifypros-site/apps/api` against locked contact contract.

## Applied locally (GitHub write still 403)

- Envelope unchanged: `200 { ok:true }` / `400|429|500 { ok:false, error, field? }`
- Body limit 32KB on `/api/contact`
- Honeypot (`website` / `_hp`) — filled → fake `200 { ok:true }`
- Global `onError` + try/catch → `500` without stack leakage
- Budget enum: locked bands `under-10k|10-25k|25-50k|50k-plus|not-sure` (matches Frontend)
- Optional `company` / `service` still accepted (form sends them)
- Email: `EMAIL_PROVIDER=stub|resend`; Resend when `RESEND_API_KEY` set; else stub log to `CONTACT_TO_EMAIL`
- `.env.example` documents email vars

## Gaps / follow-ups

1. ~~Budget enum drift~~ — Frontend aligned to dollar bands; API enum tightened to match.
2. ~~Honeypot~~ — Frontend added hidden `website`; API fake-200 on fill.
3. **GitHub write 403** — cannot push until Alex grants write token. Changes live only under `/workspace/codifypros-site`.
4. **Rate limit** is in-memory (fine for v1); Redis/KV for multi-instance prod later.
5. **Gmail connector** broken; use Resend env or keep stub.

## Smoke

```bash
npm run dev:api
curl -s localhost:8787/api/health
curl -s -X POST localhost:8787/api/contact -H 'content-type: application/json' \
  -d '{"name":"Alex","email":"a@co.com","message":"Need ops automation for CRM."}'
```
