# Google Ads sitelinks — MVA campaigns

Sitelinks are configured **in Google Ads**, not in this repo. What this repo
provides is working destinations: every URL below resolves to a real page or a
real on-page anchor (added 2026-09-22), so no sitelink can 404 the way the
Fort Worth campaign did.

Limits respected below: sitelink text ≤25 chars, each description line ≤35.
Build them at **ad-group level** so the city and case type in the URL match the
ad group. Google shows 4–6; give it all of them and let it pick.

## Set A — same-page sitelinks (work on every lander)

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

## Set B — cross-case-type sitelinks (send them to a different lander)

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

- **Spanish sitelink**: `?lang=es` flips the entire lander — headline, form,
  FAQs, footer — not just a banner. Worth running everywhere, and San Antonio
  especially.
- **Anchors vs pages**: Set A links are same-page anchors, which Google accepts
  and which keep the visitor on the page that converts. Set B links are
  genuinely separate pages. Running both gives Google distinct destinations to
  choose from. If any Set A sitelink is ever disapproved for matching the ad's
  final URL, swap that row for a Set B one.
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
