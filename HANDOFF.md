# Goldberg & Loren Landers — Deploy & Operate

## What's here (27 pages + hub)
- Masters: `car-accident.html` · `truck-accident.html` · `motorcycle-accident.html`
- 24 baked city variants: each master × portland-or, los-angeles-ca, las-vegas-nv,
  fresno-ca, boise-id, fargo-nd, midland-tx, plantation-fl
- `index.html` — internal review hub (never send ad traffic here)
- `img/` — optimized assets (~90KB/page mobile) · `generate-geo.mjs` — city baker
- Every page: EN/ES switch (header toggle + "Se Habla Español" benefit chip),
  `?lang=es` deep-link for Spanish campaigns, italic teal city in the headline
- Design v2 (mockup-approved 2026-08-13): headline "Hurt in a {City} Car Accident?",
  dark-teal buttons (#0f766e) w/ white text, gold review stars, rounded cards,
  radio-style form options + "Step 1 of 3" labels, icon benefit row, skyline wash,
  client quote in form card, per-market office line in attorney block, process
  section directly after results. Compliance guardrails kept: "cases handled" (not
  "won"), "a real person answers" (not "attorneys answer"), no invented results.
- ALL pages ring one campaign number: **(512) 960-3887** (per Jon 2026-08-13).
  Firm's per-office numbers preserved in ../research/site-dossier.md.

## Deploy — Vercel (recommended)
```bash
cd /Users/jonkennedy/retainer-reach/goldberg-loren/landers && npx vercel --prod
```
First run: log in, accept defaults (no build step — static). Then in the Vercel
dashboard add a custom domain. **Never run ads to *.vercel.app** — Google Ads
display URL must match the final URL domain, and a bare vercel.app subdomain
tanks trust and can trip ad review. Use a subdomain of the firm's domain
(e.g. `cases.goldbergloren.com`, CNAME → `cname.vercel-dns.com`) or one of
their existing campaign domains (e.g. carcrashlawyeridaho.com per their GTM
account naming).

## Form — Formspree (WIRED + TESTED 2026-08-13)
Endpoint `https://formspree.io/f/meajzepz` is live in all 3 masters and all baked
variants; verified 200 OK from the browser flow. Emails arrive with subject
"GoldbergandlorenPPC" (per Jon — likely feeds a mail filter/automation; case type,
market, and form answers are in the email body). TO DO in Formspree settings: route notifications
to an inbox intake watches 24/7, and (recommended) restrict allowed domains to the
production domain(s) once deployed.
Payload: `{name, phone, when, injured, case_type, geo, page, submitted, _subject}` (JSON).
Free tier = 50 subs/mo — enough for launch/testing. Production upgrade: paid
Formspree (webhooks/Zapier) or point formEndpoint straight at a Zapier/Make
webhook → CRM + **instant SMS to intake**. Speed-to-lead is the whole game:
5-min response = 21x qualification (MIT). The page converts; answering makes cases.

## Tracking — GTM (per-market containers)
Pages auto-load GTM and push two events with `case_type` + `geo` + form answers:
- `call_click` — any tap on a phone link
- `lead_form_submit` — successful form completion
Container wiring: per-geo `"gtm"` key in the `#geo-data` block (Boise is live:
`GTM-58MTFGGD`), site-wide fallback: `CONFIG.gtmId`. NEEDED from Jon/client:
container IDs for Oregon, Midland TX, Plantation FL accounts (+ any others).
Inside each container: GA4 tag + Google Ads conversion tags fired on those two
events. **Count calls as conversions** — 56% of legal conversions are calls.

## Cookies / privacy stance
No cookie banner: US-only traffic, no state requires EU-style opt-in consent,
and a banner costs conversion. Implemented instead: privacy policy link +
"Do Not Sell or Share My Personal Information" footer link (CCPA-style notice,
currently → their privacy policy; swap href if the firm provides a dedicated
opt-out page), TCPA consent checkbox on the form, full attorney-advertising
disclaimer block. If they ever target EU/UK traffic (they shouldn't), revisit.

## Geo system
- Baked pages (use for campaigns): zero flash, works without JS.
- Dynamic: `car-accident.html?geo=midland-tx&lang=es` for testing/param routing.
- New market = one JSON entry in `#geo-data` (city, h1city, h1city_es, phone,
  review, serve, office, sol + _es variants, optional gtm) → re-bake all 3.
- Review counts are real per-market numbers — never invent them for a new city.

## New case types
Copy a master → change title/description/og, hero subhead, results order,
2–3 FAQ items (+ their ES entries in `#i18n-es`), `case_type` in the JS payload
and the i18n hero-sub/FAQ ops. Geo JSON carries over unchanged.
