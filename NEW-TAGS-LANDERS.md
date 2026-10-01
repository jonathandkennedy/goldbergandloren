# NEW TAGs landers — heading-outline test, every market × case type

A split test of the client's requested page structure against the current
landers. He gave the outline for Austin car accidents. It is now built for every
market and case type: **22 markets × 4 case types**. There are two test groups,
88 pages each, and every page is tested against the live lander for the same city
and case type.

| Group | URL pattern | Example |
|---|---|---|
| **A · Control** | `{case}-{market}.html` — the live lander, unchanged | `truck-accident-dallas-tx.html` |
| **B · Headings** | `{city}-{case}-attorneys.html` — rebuilt around the outline | `dallas-truck-accident-attorneys.html` |
| **C · Headings + photo** | `{city}-{case}-attorneys-photo.html` — B plus the partners' photo | `dallas-truck-accident-attorneys-photo.html` |

Every A / B / C URL is listed in **`CAMPAIGN-URLS-NEW-TAGS.md`**.

**What differs from A to B:** the headline and everything below the hero. **What
doesn't:** design, hero copy, the 2-step form, phone number,
GTM/CallRail/Clarity/ClickCease, footer. Above the fold, the only change is the H1.

**From B to C, the only difference is the photo** (below). The test suite strips the
photo out of every C page and checks that what's left is byte-for-byte the B page.
That keeps each comparison honest: whichever group wins, you know what won it.

## The outline

```
H1  {City} {Case} Attorneys
H2  Types of Cases Our {City} {Case} Attorneys Represent
    H3 × 5 — by case type (below)
H2  {Case} Attorneys in {City}, {ST} Open 24 Hours
H2  Why Turn to a {Case} Attorney in {City} After a Crash
    H3  No Fees Unless We Win
    H3  Over $500 Million Won
    H3  We Fight to Get You Paid While You Recover
    H3  Award-Winning Accident Attorneys Serving {City} and All of {County}
    H3  Free {Case} Consultations
H2  Schedule a Free Consultation with Our {City} {Case} Attorneys
```

- **{Case}** is Car Accident, Truck Accident, Motorcycle Accident or Rideshare Accident.
- **{County}** is the market's county: Travis County for Austin, Tarrant County for
  Fort Worth, Collin County for Frisco. The exception is the Dallas-Fort Worth page,
  which reads "All of North Texas".

The five "types of cases" H3s:

| Car (the client's list) | Truck | Motorcycle | Rideshare |
|---|---|---|---|
| Red Light Accidents | Jackknife Accidents | Left-Turn Motorcycle Accidents | Uber and Lyft Passenger Injuries |
| Car Crashes Involving Drunk Drivers | Underride Accidents | Lane-Change and Blind-Spot Accidents | Accidents Caused by Rideshare Drivers |
| Rear-End Accidents | Rollover Truck Accidents | Rear-End Motorcycle Accidents | Pedestrian and Cyclist Rideshare Accidents |
| Rideshare Accidents | Wide-Turn and Blind-Spot Accidents | Road Hazard Accidents | Rideshare Drivers Injured by Other Drivers |
| Chain Reaction Auto Accidents | Accidents Involving Fatigued Truck Drivers | Hit-and-Run Motorcycle Accidents | Pick-Up and Drop-Off Accidents |

**The client wrote the car list. The truck, motorcycle and rideshare lists are
ours**, following his pattern with the most common crash types for each. They are
worth his sign-off before those tests start.

These are the **only** headings on each page. The form title ("What's Your Case
Worth?"), the form's success message and the footer column titles were headings
on the control; on the variants they look identical but are styled paragraphs, so
an SEO crawler or Google's landing-page check sees exactly this outline. The
build fails if any page's outline drifts. The test suite checks all 88 pages in
both languages.

Two wording fixes from the brief: "schedule a free consultations" → singular, and
"over 500 million dollars won" is written "Over $500 Million Won".

## Group C — the partners' photo

The cutout of **James M. Loren** (left) and **George Z. Goldberg** (right), arms
crossed — the same shot as the Our Team page, with the background removed.

- **Phones:** right under the two call buttons, so the faces are in the first
  screen. The headline and both buttons stay exactly where they are on B; the
  photo fades out at the waist. Everything below moves down about 250px.
- **Desktop:** in the form column beside the headline, the partners standing
  behind the "What's Your Case Worth?" card, which overlaps the base of the photo.
  The card moves down about 260px, with its first question still above the fold.
- **Name tags** on the photo: *James M. Loren · Senior Partner* and *George Z.
  Goldberg · Founding Partner* — the titles the Our Team page uses. In Spanish:
  *Socio Sénior* and *Socio Fundador*.
- **Weight:** WebP at three sizes (17 KB, 28 KB, 35 KB); each phone or screen loads
  one. The image has fixed dimensions (no layout shift) and loads with high priority.

## Running it in Google Ads

Google Ads experiments compare two versions at a time, so read the three groups
as pairs:

- **A vs B:** do the client's headings beat today's page?
- **B vs C:** does the photo help on top of them? The photo is the only
  difference, so this is the clean read on the photo.
- **A vs C:** the full new page against today's page, if you want one answer.

For each pair, go to **Experiments → Ad variations** on the campaign. Add a
variation that **updates the final URL** from one group's page to the other's
(every URL is in `CAMPAIGN-URLS-NEW-TAGS.md`) and use a **50% split**. A custom
experiment does the same job: a campaign draft whose ads point at the other page.

- **Start where the volume is.** Every variant is the same template, so you don't
  need 88 experiments to learn whether it works. Run it on the busiest campaigns
  (Austin, Dallas and San Antonio car, say). Judge the template on those pooled
  results, then roll it out or drop it everywhere.
- Leave sitelinks alone. They point at the control and its anchors, and every
  variant carries the same anchor IDs (`#case-form`, `#results`, `#how-it-works`,
  `#attorneys`, `#reviews`, `#faq`), so a sitelink lands correctly either way.
- Change nothing else in a campaign while it runs (bids, ads, keywords).
- Run **at least two full weeks**, and ideally until each side has 30+ leads.
  Fewer than that and the difference is mostly noise.
- Judge on **conversion rate and cost per lead**, not clicks — both arms get the
  same ads.

## Reading the results

- **Formspree:** B leads carry `variant: "{city}-headings"` (`austin-headings`,
  `dallas-headings`…) and C leads `variant: "{city}-headings-photo"`. Both carry
  the usual `case_type`, so Dallas truck and Dallas car stay separable. Control
  leads have no `variant` field. Filter on the exact value or on the ending:
  "contains `headings`" matches both groups.
- **GA4:** the thank-you URL gains `&variant=…` with the same value, next to `ct=`.
- **GTM:** a `page_variant` event fires on every variant page load, for
  session-level comparisons (bounce, scroll, time on page).
- **Clarity:** filter recordings by URL to watch how people read the longer pages.
  On a phone the B pages run about 10,100–10,500px, against 7,200–7,400px for
  the controls; C pages are about 250px longer than B.

## Copy notes worth a look before it runs

- **"Over $500 Million Won"** is his wording. Everywhere else the firm says
  *recovered* — its own site says "$550M+ Recovered" — and most of that money
  came from settlements, not trial wins. The body copy under this heading says
  "recovered $550M+" and carries the prior-results disclaimer. **"Over $500
  Million Recovered"** would be the safer heading, and it's a one-word change.
- **"Award-Winning"** is backed on the page by the recognitions the landers
  already show (Martindale-Hubbell Distinguished, The National Trial Lawyers,
  Million Dollar Advocates Forum) and James Loren's 50+ verdicts.
- **"Open 24 Hours"**: the copy says a *real person* answers 24/7, not an
  attorney, in line with the intake rule used across the site.
- **State law is stated generally, per state, not as legal advice.** Each page
  names only its own state:

  | State (markets) | Filing window | Partial fault | Drunk-driver card |
  |---|---|---|---|
  | Texas (15) | two years | not more than 50% at fault | Texas dram shop law · "DWI" |
  | California (LA, Fresno) | two years | pure comparative fault | own UM/UIM coverage¹ |
  | Nevada (Las Vegas) | two years | not more than 50% | own UM/UIM coverage¹ |
  | Oregon (Portland) | two years | not more than 50% | bar that served someone *visibly* intoxicated |
  | Idaho (Boise) | two years | less than 50% | bar that served someone *obviously* intoxicated |
  | North Dakota (Fargo) | six years | less than 50% | bar that *knowingly* served someone obviously intoxicated |
  | Florida (Plantation) | two years (since 2023) | not more than 50% | own UM/UIM coverage¹ |

  ¹ These states largely shield bars from claims over serving adults, so the
  card points to the driver's own uninsured/underinsured motorist coverage instead.
  Rideshare coverage reads "Texas law requires $1,000,000" on Texas pages. Other
  states' pages say Uber and Lyft keep at least $1,000,000 once a trip is accepted.
  The filing window matches each lander's own FAQ answer, and the test suite
  checks that it does.
- **Local office line:** "Our Austin-area office is in Lakeway" and "Our office
  is right here in Boise" appear only where the geo data lists an office in that
  market. The DFW, San Antonio and Midland pages don't claim a local office.
- The variants leave off the landers' unconfirmed **$8.7M trucking** result and
  show the confirmed **$8.75M** premises settlement instead. On the truck tests
  that is one more difference between the arms. If the firm confirms the figure,
  it can go back on the truck variants.

## Rebuilding

`node generate-tag-landers.mjs` rebuilds all 176 test pages (groups B and C) from
the baked controls and rewrites `CAMPAIGN-URLS-NEW-TAGS.md`. Then `node
build-hub.mjs` refreshes the hub. Re-run both after re-baking any master (`node
generate-geo.mjs <master>.html --all`) so all three groups stay in step. The
photo files are `img/partners-480.webp`, `-720` and `-960`.

A new market needs one `MARKETS` row in the generator: its state, three busy
roads (EN/ES) and its county (EN/ES). The build refuses to run until the row is
there. The Austin car page it produces is the page approved on 2026-09-22 plus
two changes that reached every group identically: the two-step form (2026-09-29)
and the Spanish fixes (2026-09-30: small-phone hero, tab title).

Tests:
- `tests/tag-landers-e2e.mjs` checks all 176 pages, EN and ES, against their controls:
  - that C is exactly B plus the photo
  - that on phones the faces show in the first screen without moving the call button
  - where the photo sits on desktop
  - that nothing in the hero runs past a 320px screen, on every page and its control
  - that Spanish tab titles name the city the way the H1 does
- `tests/austin-test-e2e.mjs` checks the Austin page against the client's verbatim outline.
