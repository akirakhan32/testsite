# CodifyPros — Design / anti-slop

Source of truth: the locked marketing brief (operator editorial). This file is the merge gate for `apps/web`.

## DNA
- Display: Instrument Serif. UI/body: IBM Plex Sans. Mono: IBM Plex Mono.
- Ink `#0E1014` · paper `#F4F1EA` · copper `#C96A3D` (only loud color) · muted ≤ `#B0B5C0`.
- Radius ≤ 8. Hairline borders. No glass, neon, purple, mesh, glow orbs.

## Anti-slop (must pass)
- [ ] No Inter / Roboto / Poppins / Montserrat / Space Grotesk / Plus Jakarta as primary
- [ ] No icon-in-colored-circle service grids
- [ ] No stock handshake / AI-brain / robot art
- [ ] No “cutting-edge / world-class / redefine the future / unlock opportunities”
- [ ] No fake case studies, fake logos, or invented KPIs
- [ ] Work route/nav hidden until ≥1 real case — mechanism cards replace Featured Work, never stack
- [ ] One copper object per viewport (hero: one Talk to us; secondary is a text link)
- [ ] Motion ≤ 800ms; honor `prefers-reduced-motion`
- [ ] Contact: `POST /api/contact` `{ name, email, message, budget?, website }`

## Home arc
Hero → pain → stakes → approach (services + method) → mechanism cards (or Featured Work) → fit → CTA.
