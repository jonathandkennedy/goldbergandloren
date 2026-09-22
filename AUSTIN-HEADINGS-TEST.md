# Austin car accident — heading-outline test

A split test of the client's requested page structure against the current
Austin car accident lander.

| | URL | What it is |
|---|---|---|
| **Control** | `https://results.goldbergloren.com/car-accident-austin-tx.html` | The live Austin car lander, unchanged |
| **Variant** | `https://results.goldbergloren.com/austin-car-accident-attorneys.html` | Same design, hero, form and tracking — rebuilt around the client's H1/H2/H3 outline |

**What differs:** the headline and everything below the hero. **What doesn't:**
design, hero copy, the 3-step form, phone number, GTM/CallRail/Clarity/ClickCease,
footer. Above the fold, the only change is the H1. That keeps the test honest:
if the variant wins, it's the content and structure that won it.

## The outline, as built

```
H1  Austin Car Accident Attorneys
H2  Types of Cases Our Austin Car Accident Attorneys Represent
    H3  Red Light Accidents
    H3  Car Crashes Involving Drunk Drivers
    H3  Rear-End Accidents
    H3  Rideshare Accidents
    H3  Chain Reaction Auto Accidents
H2  Car Accident Attorneys in Austin, TX Open 24 Hours
H2  Why Turn to a Car Accident Attorney in Austin After a Crash
    H3  No Fees Unless We Win
    H3  Over $500 Million Won
    H3  We Fight to Get You Paid While You Recover
    H3  Award-Winning Accident Attorneys Serving Austin and All of Travis County
    H3  Free Car Accident Consultations
H2  Schedule a Free Consultation with Our Austin Car Accident Attorneys
```

These are the **only** headings on the page. The form title ("What's Your Case
Worth?"), the form's success message and the footer column titles were headings
on the control; on the variant they look identical but are styled paragraphs, so
an SEO crawler or Google's landing-page check sees exactly this outline. The
build fails if the outline drifts, and the test suite checks it in both languages.

Two wording fixes from the brief: "schedule a free consultations" → singular, and
"over 500 million dollars won" is written "Over $500 Million Won".

## Running it in Google Ads

Simplest: **Experiments → Ad variations** on the Austin car-accident campaign.
Variation type *Final URL*, find `car-accident-austin-tx.html`, replace with
`austin-car-accident-attorneys.html`, **50% split**.

- Leave sitelinks alone. They point at the control and its anchors, and the
  variant carries the same anchor IDs (`#case-form`, `#results`, `#how-it-works`,
  `#attorneys`, `#reviews`, `#faq`), so a sitelink lands correctly either way.
- Change nothing else in the campaign while it runs (bids, ads, keywords).
- Run **at least two full weeks**, and ideally until each side has 30+ leads.
  Fewer than that and the difference is mostly noise.
- Judge on **conversion rate and cost per lead**, not clicks — both arms get the
  same ads.

## Reading the results

- **Formspree:** variant leads carry `variant: "austin-headings"`. Control leads
  have no `variant` field.
- **GA4:** the thank-you URL gains `&variant=austin-headings`.
- **GTM:** a `page_variant` event fires on every variant page load, for
  session-level comparisons (bounce, scroll, time on page).
- **Clarity:** filter recordings by URL to watch how people read the longer page.
  The variant runs ~10,400px on a phone against ~7,200px for the control.

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
- Texas specifics in the case-type copy are stated generally, not as legal
  advice: the dram shop law, the $1,000,000 rideshare coverage once a trip is
  accepted, the 51% fault bar and the two-year filing window.
- The variant leaves off the landers' unconfirmed **$8.7M trucking** result and
  shows the confirmed **$8.75M** premises settlement instead.

## Rebuilding

`node generate-austin-test.mjs` rebuilds the variant from the baked control. Run
it after re-baking the Austin car page, so both arms stay in step.
Tests: `tests/austin-test-e2e.mjs`.
