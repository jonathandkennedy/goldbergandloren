# Google Ads sitelinks — MVA campaigns

Sitelinks are configured **in Google Ads**, not in this repo. What this repo
provides is working destinations: every URL below resolves to a real page or a
real on-page anchor, so no sitelink can 404 the way the Fort Worth campaign did.

Limits respected below: sitelink text ≤25 chars, each description line ≤35.
Build them at **ad-group level** so the city and case type in the URL match the
ad group. Google shows 4–6; give it all of them and let it pick.

**Which set to use:** start with **Set A** (dedicated pages). Google treats a
distinct URL as a stronger, more relevant destination than an anchor on the ad's
own final URL, and anchors are occasionally disapproved for matching that final
URL. Keep Set B on hand as the swap-in, and run Set C alongside either.

## Set A — dedicated pages (recommended)

Six shared pages, one per objection, added 2026-09-22. They are shared across
every market but adapt at load:

- `?geo=<city-slug>` — swaps the phone number and GTM container, so **CallRail
  still attributes the call to the right market**. Use the same city slug as the
  ad group's lander (`san-antonio-tx`, `dallas-tx`, `fort-worth-tx`, …).
- `?ct=<case-type>` — points every "back to the free case review" CTA on that
  page at the matching lander (`car-accident`, `truck-accident`,
  `motorcycle-accident`, `rideshare-accident`).
- `?lang=es` — loads the page in Spanish.

Pattern: `https://results.goldbergloren.com/<page>.html?geo=<city>&ct=<case-type>`

| Sitelink text | Description line 1 | Description line 2 | Page |
|---|---|---|---|
| **No Fee Unless We Win** | $0 upfront. We front every cost. | No recovery, no attorney fee. | `no-fee.html` |
| **Free 24/7 Case Review** | A real person answers, 24/7. | Free, confidential, no pressure. | `case-review.html` |
| **Recent Settlements** | $4.5M car. $8.7M truck. Real. | See how fast each one resolved. | `settlements.html` |
| **Client Reviews** | Real Google reviews, real cases. | See what our clients say. | `reviews.html` |
| **Maximize Your Payout** | With a lawyer: 4.4x more on avg. | First offers are low by design. | `maximize-compensation.html` |
| **Meet Your Team** | 50+ trials taken to verdict. | We know the insurance playbook. | `our-team.html` |
| **Se Habla Español** | Evaluación gratis, 24/7. | Hable con una persona real. | `case-review.html` + `&lang=es` |

Full example — San Antonio car-accident ad group:
`https://results.goldbergloren.com/no-fee.html?geo=san-antonio-tx&ct=car-accident`

That page will show **(210) 880-6076**, load the San Antonio GTM container, and
send every CTA back to `car-accident-san-antonio-tx.html`.

Each page answers one objection: **no-fee** the money question, **case-review**
the "what happens if I call", **settlements** and **reviews** the proof,
**maximize-compensation** the "do I even need a lawyer", **our-team** the
"who am I actually hiring".

## Set B — same-page anchors (swap-in, keeps them on the converting page)

Append the path to that ad group's existing final URL. Example for the San
Antonio car ad group, final URL
`https://results.goldbergloren.com/car-accident-san-antonio-tx.html`:

| Sitelink text | Description line 1 | Description line 2 | Append to final URL |
|---|---|---|---|
| **Free 24/7 Case Review** | Talk to a real person right now. | Free, confidential, no pressure. | `#case-form` |
| **No Fee Unless We Win** | $0 upfront. We front every cost. | No recovery, no attorney fee. | `#how-it-works` |
| **$550M+ Recovered** | 20,000+ injury cases since 1994. | Real settlements, real speed. | `#results` |
| **Meet Our Trial Lawyers** | 50+ trials taken to verdict. | We know the insurance playbook. | `#attorneys` |
| **Common Questions** | What's my case worth? Who pays? | Straight answers, no pressure. | `#faq` |
| **Se Habla Español** | Evaluación gratis, 24/7. | Hable con una persona real. | `?lang=es` |

Full example URL: `https://results.goldbergloren.com/car-accident-san-antonio-tx.html#results`

- **Free 24/7 Case Review** — Every campaign — the workhorse. Drops them straight onto the form.
- **No Fee Unless We Win** — Answers the #1 money objection before the click.
- **$550M+ Recovered** — Proof. Figures are the firm's real published numbers.
- **Meet Our Trial Lawyers** — Authority — George Goldberg defended insurers before switching sides.
- **Common Questions** — Catches researchers who aren't ready to call yet.
- **Se Habla Español** — Loads the whole lander in Spanish. Big in San Antonio.

## Set C — cross-case-type sitelinks (send them to a different lander)

Use the SAME city slug, swap the case type. In a car-accident ad group, use the
truck / rideshare / motorcycle rows; in a truck ad group, use the car row, and
so on — never link a case type to itself.

| Sitelink text | Description line 1 | Description line 2 | Page (same city slug) |
|---|---|---|---|
| **Truck Accident Claims** | Hit by a semi or 18-wheeler? | We move before evidence is gone. | `truck-accident` |
| **Uber & Lyft Accidents** | Up to $1,000,000 in coverage. | Passenger, driver, or hit by one. | `rideshare-accident` |
| **Motorcycle Accidents** | Insurers blame the rider first. | We shut that down. Free review. | `motorcycle-accident` |
| **Car Accident Help** | Insurance lowballed you? | Free review. You pay nothing now. | `car-accident` |

Full example: a Dallas car ad group links "Uber & Lyft Accidents" to
`https://results.goldbergloren.com/rideshare-accident-dallas-tx.html`

- **Truck Accident Claims** — Point at the truck lander for the SAME city.
- **Uber & Lyft Accidents** — Point at the rideshare lander for the same city.
- **Motorcycle Accidents** — Point at the motorcycle lander for the same city.
- **Car Accident Help** — Point at the car lander for the same city.

## Notes that matter

- **Spanish sitelink**: `?lang=es` flips the entire page — headline, form,
  FAQs, footer — not just a banner. It works on the landers and on all six
  support pages, and the choice follows the visitor from one to the next. Worth
  running everywhere, and San Antonio especially.
- **Anchors vs pages**: Set B links are same-page anchors — Google accepts them
  and they keep the visitor on the page that converts, but they share the ad's
  final URL. Sets A and C are genuinely separate pages. Lead with Set A, add
  Set C, and swap in a Set B row if a dedicated page ever underperforms for a
  given ad group.
- **The support pages are `noindex,follow`** on purpose. They exist for paid
  traffic and duplicate lander copy; letting Google index them would compete
  with the firm's own site. They still pass link equity onward.
- **Don't drop the `?geo=` parameter.** Without it the page falls back to the
  national number (512) 960-3887 and the call stops attributing to the market's
  CallRail pool. `?ct=` is optional — it defaults to the car-accident lander.
- **Claims are the firm's real published numbers** ($550M+ recovered, 20,000+
  cases handled since 1994, 50+ trials to verdict, 21 offices in 16 states).
  Keep "cases handled" — never "won" — and never invent a settlement figure.
  The prior-results disclaimer lives on every lander the sitelinks point to.
- **Callout and structured-snippet assets** are separate from sitelinks and
  also worth filling: callouts like "No Fee Unless We Win", "Open 24/7",
  "Se Habla Español", "21 Offices in 16 States"; structured snippet header
  "Services" with Car Accidents, Truck Accidents, Motorcycle Accidents,
  Rideshare Accidents.
- Anchors available on every lander: `#case-form`, `#results`, `#how-it-works`,
  `#attorneys`, `#reviews`, `#faq`.
- Shared pages available as dedicated destinations: `no-fee.html`,
  `case-review.html`, `settlements.html`, `reviews.html`,
  `maximize-compensation.html`, `our-team.html`. Rebuild them with
  `node generate-support-pages.mjs` — they read their phone numbers and GTM
  containers straight out of `car-accident.html`, so adding a market there is
  the only edit needed.
