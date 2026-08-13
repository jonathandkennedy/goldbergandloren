# Goldberg & Loren — PPC Landing Pages

27 conversion-optimized static pages for paid traffic (Google Ads / Meta / LSA).
No build step — every page is self-contained HTML.

- Masters: `car-accident.html`, `truck-accident.html`, `motorcycle-accident.html`
- City variants: `{master}-{city-slug}.html` × 8 markets (Portland OR, LA, Las Vegas,
  Fresno, Boise, Fargo, Midland TX, Plantation FL)
- `index.html` — internal review hub (noindexed; never send ad traffic here)
- Every page: EN/ES switch (`?lang=es` deep link), per-market phones/reviews/statutes,
  GTM per-market containers, Formspree lead form (subject `GoldbergandlorenPPC`)

## Editing
Edit a master, then re-bake its city variants:
```
node generate-geo.mjs car-accident.html --all
```
Markets live in the `#geo-data` JSON block inside each master.
Full operations guide: `HANDOFF.md`.
