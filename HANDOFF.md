# Goldberg & Loren Landers — Deploy & Operate

> Cloning this system for a NEW client? Start at **TEMPLATE-HANDOFF.md** —
> the client-agnostic build playbook. Browser test suites live in `tests/`
> (`cd tests && npm i && node form-e2e.mjs && node kw-e2e.mjs`; set
> CHROME_PATH if using a preinstalled Chromium) — run before every deploy.

## What's here (4 masters × 22 baked cities + hub + thank-you + 404)
- Masters: `car-accident.html` · `truck-accident.html` · `motorcycle-accident.html`
  · `rideshare-accident.html` (added 2026-09-17: Uber/Lyft $1M-coverage angle,
  app-on/app-off who-pays FAQ, passenger FAQ, full EN+ES, case_type
  "rideshare-accident"; footer cross-links added to all masters)
- 88 baked city variants: each master × portland-or, los-angeles-ca, las-vegas-nv,
  fresno-ca, boise-id, fargo-nd, plantation-fl + 15 TX markets
  (austin, san-antonio (added 2026-09-17: GTM-NK6KTLNL, CallRail tracking
  number **(210) 880-6076** on all 3 SA pages — IN CALLRAIL add it to the
  keyword pool's "numbers to swap" list alongside 512/214 or SA ad visitors
  won't get session numbers; verify with ?gclid=test),
  midland, and the DFW set incl. fort-worth-tx, added 2026-08-31 —
  the Fort Worth ads campaign previously had no city page and 404'd)
- `404.html` — branded not-found page (Vercel serves it automatically for bad
  URLs): call CTA + links to the 3 masters, GTM-NK6KTLNL, pushes call_click
  with geo="404" so rescued clicks are visible. Raw Vercel 404 is gone.
- Microsoft Clarity (2026-09-01): project `ybpj42my1c` — session recordings +
  heatmaps on every visitor-facing page (masters, all baked city pages, kw-test
  pages, thank-you, 404). The snippet lives in the 3 masters' head (and
  thank-you/404 directly), so baking carries it everywhere; index.html (internal
  hub) deliberately has NO tag so internal visits don't pollute recordings.
  Dashboard: clarity.microsoft.com.
- Sitelink anchors (2026-09-22): every lander now carries section ids —
  `#case-form`, `#results`, `#how-it-works`, `#attorneys`, `#reviews`, `#faq` —
  so Google Ads sitelinks have real destinations. Ready-to-paste sitelink text,
  descriptions and URLs are in **SITELINKS.md** (character limits already
  enforced: 25 / 35 / 35). Pages use scroll-behavior:smooth, so anchor landings
  animate; all six verified to land in view at 390px.
- Heading copy (2026-09-22): H1 and 4 of the 7 H2s are now case-type-specific
  (process, insider, FAQ, final-CTA), EN + ES. Rideshare H1 reads "Uber or
  Lyft Accident" rather than "Rideshare" for ad message match (ES already
  said "Uber o Lyft"). Three H2s stay shared ON PURPOSE: the form-card
  "What's Your Case Worth?" (measured: it is 1 line at 390px; every
  case-specific variant wraps to 2 and pushes the form down), "Real Results
  — Real Speed" (the grid below it mixes car/trucking/construction/
  pedestrian results — a case-specific claim there would misrepresent), and
  "What Clients Say" (the Google reviews are firm-wide, not case-tagged).
  Editing any H2 means editing its ES op too: .card h2[0], .sec-h[0..4],
  and .final .sec-h[0] (an "ft" op so the "Free/Gratis" span survives).
- ClickCease (2026-09-21): click-fraud detection/blocking on all 102
  visitor-facing pages (4 masters + every baked city page + kw-test pages,
  thank-you, 404, privacy-policy, terms). Async script in the head after the
  Clarity tag; the `<noscript>` iframe sits after `<body>` (not in the head —
  an iframe inside a head `<noscript>` is invalid HTML and browsers relocate
  it), landing right below the GTM noscript on baked pages. index.html
  (internal hub) deliberately has NO tag, same reasoning as Clarity. Account
  id `1c12dbadd579836d7d83166cb5b124b3` (ob.buzzfighter.com is ClickCease's
  CDN). IN CLICKCEASE: connect the Google Ads account (639-774-4725) so it can
  actually add fraudulent IPs to the account's exclusion list — the tag alone
  only detects. The test suites block buzzfighter.com alongside GTM/Clarity.
- KW-TEST landers (2026-09-01): `{car,truck,motorcycle}-accident-{dallas-tx,
  fort-worth-tx}-kw.html` — copies of the baked pages whose headline adapts to
  the ad keyword via `?kw={keyword}` (whitelist only: attorney/lawyer +
  "near me" pick from fixed strings; raw query text never touches the DOM;
  no/unrecognized kw = control page unchanged, so these are safe to send any
  traffic). Leads carry `variant:"kw-test"` + sanitized kw; thank-you redirect
  adds `&variant=kw`; a `kw_variant` dataLayer event fires. noindex. Built by
  `node generate-kw-test.mjs` — RE-RUN IT whenever the Dallas/Fort Worth pages
  are re-baked. Evaluate after 2-3 weeks: QS landing-page-experience + conv
  rate on the test ad groups vs control, then roll wider or delete.
- DFW pages (2026-08-31, per PPC audit): office line no longer shows the
  Lakeway street address to DFW searchers — now "Serving Dallas–Fort Worth ·
  21 offices in 16 states · Intake open 24/7". Austin & Midland keep their
  original office lines.
- DFW number (2026-08-31): all 12 DFW pages display CallRail tracking number
  **(214) 466-2129** (tel links, visible text, office line). All other markets
  still ring (512) 960-3887. IN CALLRAIL: the Google Ads keyword pool's
  "numbers to swap" list must include (214) 466-2129 (alongside 512-960-3887)
  or DFW ad visitors won't get session numbers — verify with ?gclid=test on a
  Dallas page. thank-you.html still says callbacks come from (512) 960-3887 —
  that's intake's outbound caller ID; if intake starts dialing DFW leads from
  the 214 number, make that line geo-aware.
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
Phone validation (2026-08-25, after junk "0000001"-style leads): the form now
requires a real US number — 10 digits after stripping formatting (a leading "1"
country code is dropped before sending), area code and exchange can't start
with 0/1, no all-same-digit numbers, no N11 codes. NOTE: junk with fewer than
10 digits can't come through the page at all (even the old code blocked it) —
those leads are bots POSTing directly to the public Formspree endpoint,
bypassing the page JS and honeypot. Fix that in the Formspree dashboard:
restrict allowed domains to the production domain(s) and turn on spam
filtering. Diagnostic: real form leads always arrive with subject
"GoldbergandlorenPPC" — direct-bot spam usually comes without it.
Submit flow (2026-08-25): the page now WAITS for Formspree's response
instead of fire-and-forget. Success (2xx) → success card + redirect to
/thank-you.html, so lead_form_submit conversions now count only confirmed
sends. Failure or 12s timeout → visitor stays on the form with a bilingual
"call (512) 960-3887" error, the browser console logs
`Lead form send failed: <status> <body>` (F12 → Console shows Formspree's
exact reason: over quota, domain not allowed, …), and a `lead_form_error`
dataLayer event fires with error_status. The submit button disables while
sending (also kills double-submit dupes). If a test reaches the thank-you
page but never appears in the dashboard, you're likely logged into a
different Formspree account than the one that owns f/meajzepz.
Free tier = 50 subs/mo — enough for launch/testing. Production upgrade: paid
Formspree (webhooks/Zapier) or point formEndpoint straight at a Zapier/Make
webhook → CRM + **instant SMS to intake**. Speed-to-lead is the whole game:
5-min response = 21x qualification (MIT). The page converts; answering makes cases.

## Tracking — GTM (per-market containers)
Pages auto-load GTM and push two events with `case_type` + `geo`:
- `call_click` — any tap on a phone link (fires on the lander)
- `lead_form_submit` — fires on `/thank-you.html` (landers redirect there after a
  successful submit, passing `?geo=&ct=&lang=`; the thank-you page loads the same
  per-market container). Conversion triggers can therefore be EITHER the custom
  event `lead_form_submit` OR a page-path trigger for `/thank-you.html` — both
  work; don't use both on the same conversion action or it double-counts.
  Honeypot bot submissions never redirect and never fire the event.
  Meta ads: fire the pixel `Lead` event on the /thank-you.html pageview.
Container wiring: per-geo `"gtm"` key in the `#geo-data` block (Boise is live:
`GTM-58MTFGGD`), site-wide fallback: `CONFIG.gtmId`. NEEDED from Jon/client:
container IDs for Oregon, Midland TX, Plantation FL accounts (+ any others).
Inside each container: GA4 tag + Google Ads conversion tags fired on those two
events. **Count calls as conversions** — 56% of legal conversions are calls.

## Legal pages + footer (2026-09-14)
- `privacy-policy.html` and `terms.html` — subdomain-specific, written for THESE
  pages (Formspree/Vercel/Google as the actual processors, TCPA consent language
  matching the form, state privacy rights incl. CA/TX/FL/OR, do-not-sell anchor
  at `privacy-policy.html#do-not-sell`). English only, with a Spanish notice
  directing ES speakers to call; translating legal text is a counsel decision.
  ⚠️ **These are drafted documents, not legal advice — the firm's own counsel
  must review and reconcile them with the policy on goldbergloren.com before
  they're relied on.** Governing-law clause (Terms §15) in particular is a
  placeholder ("state where the office handling your inquiry is located").
- Real footer on every lander: firm identity + per-market office line + tap-to-call
  (auto-picks the market's tracking number) + intake email; practice-area
  cross-links (same city, other case types); location cross-links (same case type,
  all other cities, current city rendered as plain text); legal bar with Privacy /
  Terms / Do Not Sell. All footer copy localizes to Spanish.
- Cross-links are deliberately footer-only — every exit link costs conversion
  (Unbounce: 13.5% CVR at 1 link → 10.5% at 5+), and the landers are noindex so
  cross-links earn no SEO. Do NOT add them higher up the page.
- Footer city list regenerates from geo data at bake time; `generate-geo.mjs`
  rewrites `data-xcase` hrefs per city and marks the current city. Nothing to
  maintain by hand when a market is added.
- Legal links also on `thank-you.html` and `404.html`.

## Cookies / privacy stance
No cookie banner: US-only traffic, no state requires EU-style opt-in consent,
and a banner costs conversion. Implemented instead: Privacy Policy + Terms of Use
+ "Do Not Sell or Share My Personal Information" footer links (all on-subdomain),
TCPA consent checkbox on the form, full attorney-advertising disclaimer block.
If they ever target EU/UK traffic (they shouldn't), revisit.

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

## Shared support pages / sitelink destinations (2026-09-22)
Six shared pages exist so Google Ads sitelinks have real destinations instead of
anchors on the ad's own final URL. Built by `node generate-support-pages.mjs`:

| Page | Answers |
|---|---|
| `no-fee.html` | "What's this going to cost me?" |
| `case-review.html` | "What actually happens if I call?" |
| `settlements.html` | "Do they actually recover money?" |
| `reviews.html` | "What do real clients say?" |
| `maximize-compensation.html` | "Do I even need a lawyer?" |
| `our-team.html` | "Who am I actually hiring?" |

**Shared, but geo-aware.** One page serves all 22 markets; it adapts at load:
- `?geo=<city-slug>` — swaps the phone number and loads that market's GTM
  container, so CallRail still attributes the call. **Drop this and calls fall
  back to the national line (512) 960-3887 and stop attributing to the market.**
- `?ct=<case-type>` — points every "back to the case review" CTA at the matching
  lander. Defaults to `car-accident`.
- `?lang=es` — Spanish. Same `gl-lang` localStorage key as the landers, so the
  visitor's choice follows them from lander to support page and back. An explicit
  `?lang=en` overrides a stored preference.

Numbers and GTM containers are read out of `car-accident.html`'s `#geo-data` at
build time — **adding a market there is the only edit needed**, then re-run the
generator. There is no second copy of the phone list to keep in sync.

Deliberate choices:
- **Indexable (`index,follow`) as of 2026-09-22.** Originally shipped `noindex`
  to avoid competing with goldbergloren.com; the client confirmed that isn't a
  concern, and unlike the landers these six are six unique pages rather than 92
  city duplicates, so there is no doorway-page risk. See the SEO section below
  for what indexing them required beyond deleting the meta tag.
- **No form on any of them.** They hand off to the lander's single form, so
  there is exactly one form to maintain, test, and keep TCPA-compliant.
- **Ratings grid on `reviews.html` renders only offices with a real Google
  rating** (Portland 4.6/489, Fresno 4.2/57, Boise 5.0/37, Fargo 5.0/72,
  Plantation 4.4/106) — pulled from geo data, never invented. Markets without a
  rating simply don't get a card.
- **James Loren has no photo in `img/`**, so he renders as a navy "JL" monogram.
  Drop a real headshot at `img/james-loren.jpg` and swap the monogram div for an
  `<img>` when one exists — do not substitute a stock photo.
- Clarity + ClickCease tags on all six, same as every other page.

Tests: `tests/support-e2e.mjs` (39 checks) — geo phone swap, hostile-param
fallback, CTA routing, EN/ES round trip, language persistence, dataLayer payload,
compliance copy, no-duplicate-form, image resolution, hub listing.

### SEO on the support pages (2026-09-22)
Making them indexable needed more than removing `noindex`:

- **Canonical, parameter-free**, e.g. `https://results.goldbergloren.com/no-fee.html`.
  This is the load-bearing one. The pages accept `?geo=` × 22, `?ct=` × 4 and
  `?lang=` × 2 — without a canonical that is ~176 indexable duplicates of every
  page. Ads keep using the parameters; organic consolidates on the clean URL.
- **`LegalService` JSON-LD with `sameAs: goldbergloren.com`** on every page. The
  subdomain is a different host to Google; `sameAs` says "same firm", not
  "competitor". `Person` schema for both partners on `our-team.html`.
- **No `aggregateRating` or `Review` markup, deliberately.** Google does not show
  review rich results for self-serving reviews about a business on its own site,
  and marking them up anyway risks a structured-data manual action. The reviews
  still display to humans — they just aren't marked up. Do not "fix" this.
- **Absolute OG/Twitter URLs.** (The landers' `og:image` is a *relative* path,
  which is invalid for Open Graph — worth fixing there separately.)
- **`robots.txt` + `sitemap.xml`**, generated alongside the pages so they cannot
  drift. robots.txt deliberately **allows everything**: the landers rely on a
  `noindex` meta tag, and a crawler blocked by robots.txt never sees it.
- Titles ≤62 chars, descriptions 110–165, enforced by the test suite.

**The landers stay `noindex`, and that should not change.** 22 cities × 4 case
types of near-identical copy with the city swapped is the textbook doorway-page
pattern Google penalises, and a manual action would hit the whole subdomain.
The six support pages are safe to index precisely because they are unique.

**Spanish is not indexed.** `?lang=es` is a JS toggle on the same URL, and the
canonical points at the English version. Getting Spanish into organic properly
means separate `-es.html` files with hreflang pairs — a real piece of work, not
a config flag. Flagged, not done.

### Bio claims — verified 2026-09-22
Checked against the firm's own published material before using:
- **George Z. Goldberg** — J.D. University of Miami School of Law, 1994, magna
  cum laude. First two years in practice at an aviation defense firm, defending
  airlines and insurance companies in injury litigation; opened his own injury
  firm in 1996. Founding and managing partner.
- **James M. Loren** — Senior partner and the firm's most senior trial lawyer;
  also its CFO. 20+ years in practice, **50+ cases tried to verdict** (this is
  where the firm's "50+ trials to verdict" figure comes from — it is his
  record, so attribute it to him, not to the firm generally). Certified Public
  Accountant. Bar admissions: FL, GA, OR, WA, ME, WI; has tried cases in federal
  court in TX, CO, NM, ND, MI, TN, IL, IN.
- Firm-wide: 20,000+ cases and over half a billion dollars recovered since 1994,
  21 offices in 16 states — all corroborated.

**Two things deliberately NOT used:**
- The firm publishes a **"98% success rate."** Unsubstantiated success-rate
  claims are a bar-complaint risk in attorney advertising in several states, and
  it is not needed — the settlement figures do the same job. Left off every page.
- The firm's **published national number is (888) 522-0335.** Our pages use the
  CallRail tracking lines on purpose; do not swap the published number in or
  call attribution breaks.

**Open item for the client:** neither partner's listed bar admissions include
Texas state bar (both have federal-court practice in Texas). The footer already
carries "Attorneys are licensed by state; not all attorneys are licensed in every
state," which covers the advertising. Worth confirming which Texas-licensed
attorney is responsible for Texas matters, since DFW and San Antonio are where
the ad spend is going.

## Shared pages redesign — goldbergloren.com look (2026-09-22)
The six shared pages were rebuilt to match the firm's own site, from the client's
phone screenshots of goldbergloren.com: deep navy + metallic gold, Playfair
Display headlines with gold italic accents over DM Sans, a gold results ticker,
square gold CTAs with a light sheen, ghosted serif numerals behind each hero,
and a sticky **Call Now / Free Review** bar on phones (the firm's has "Chat with
us"; ours routes to the lander's form, since there is no chat).

- **Fonts are self-hosted** in `fonts/` (Playfair Display + DM Sans variable
  woff2, ~112 KB total, SIL Open Font License — licence files alongside). No
  Google Fonts request, so no third-party dependency and no extra DNS lookup.
  Preloaded; `font-display: swap`, so text never waits on them.
- **Our Team uses the firm's homepage partner portrait** as its hero, and each
  partner now has his own photo. James Loren's headshot (`img/james-loren.jpg`)
  is cropped from that portrait — the left-hand partner. Basis: both George
  Goldberg headshots in this repo's history (the original and the "bio
  headshot" swap) are the right-hand partner, so the left is James.
  **Confirm with the firm before merging** — it is an inference, not a label.
- **The page chrome is otherwise unchanged in behaviour:** `?geo=` swaps phone +
  GTM, `?ct=` routes the CTAs, `?lang=es` swaps language, all 95 support-suite
  checks pass. The geo lookup was also hardened: `?geo=constructor` used to
  resolve to a JavaScript internal and produce `tel:undefined`.
- **Motion respects `prefers-reduced-motion`** (ticker, badge strip and button
  sheen all stop).
- Checked at 320 / 360 / 375 / 390 / 414 / 768 / 1024 / 1440 px in English and
  Spanish: no overflow, clipping or wrapped labels. A 320px sweep now runs in
  the suite — it caught an 11px header overflow that mobile emulation had hidden.

### Results used — sources for every figure
From the firm's own results page (client screenshots, 2026-09-22), verbatim:
- **$8.75 Million** settlement — premises liability, Ben Lomond, CA, Aug 2025
- **$4.5 Million** settlement — auto accident, Bonanza, OR, Apr 2025 (the
  description is truncated at "…requiring multiple surgeries." — the firm's
  full sentence runs on, and it was cut rather than completed from guesswork)
- **$1,750,000** wrongful death (ticker only on the firm's site — no details)

Confirmed by the client, 2026-09-22:
- **$14.6 Million** settlement — construction accident. Lexinter's listing for
  the firm: "$14.6 million for a construction site injury." It now leads the
  settlements page and the ticker.
- **The landers had this as "$14,000,000" — corrected to $14,600,000** in all
  four masters and re-baked: 98 pages (92 city + 6 keyword-test), one line each,
  verified by diff to be the only change. "Settled in 289 days" is unchanged.
- This also resolves the earlier worry: the firm's results page labels $8.75M
  its "largest settlement", but that page is "a selection of recent" results —
  the $14.6M case evidently predates it.

From the landers: $2.5M pedestrian (settled in 193 days) and the $1,025,000
policy-limits story.

**Still open:**
- **"$8,700,000 trucking" (landers only) — not used on the shared pages.** It is
  suspiciously close to the $8.75M *premises liability* case and no source
  confirms a trucking case at that figure. Needs the firm's word.
- **Pedestrian figures:** Lexinter also lists "$3.5 million for a pedestrian
  accident"; the landers show $2,500,000 pedestrian. May be two different cases
  — worth one question to the firm while confirming the trucking figure.

The support suite holds an allowlist of sourced dollar figures and fails on any
other, so a new number cannot slip onto these pages unverified.

### Copy dropped
The "You talk to lawyers, not phone trees" chip is gone from the shared pages:
it conflicts with the rule that intake copy says *a real person answers*, not
*an attorney answers*. **It is still on every lander** — worth the same fix there.

## Austin heading-outline test (2026-09-22)
The client asked for a separate Austin car-accident page, built to an exact
H1/H2/H3 outline, to test against the current Austin lander.
`austin-car-accident-attorneys.html` is built by `generate-austin-test.mjs` from
the baked control (`car-accident-austin-tx.html`): same design, hero, form and
tracking, rebuilt below the hero around his outline. **Setup, the outline and
how to read results: `AUSTIN-HEADINGS-TEST.md`.**

- **Exact outline, enforced.** The page has exactly his 15 headings and no
  others. The form title, success message and footer column titles are styled
  paragraphs on this page. The build fails on any drift, and the suite checks
  it in English and Spanish.
- **Spanish rebuilt safely.** The landers' Spanish is positional, so 48 entries
  aimed at removed sections were dropped and 69 new ones added, targeted by ID.
  A test proves every entry lands on a real element. Call buttons translate
  around the number, so CallRail's swapped number survives a language change.
- **Tagged for the split:** `variant: "austin-headings"` on leads,
  `&variant=austin-headings` on the thank-you URL, and a `page_variant` GTM event.
- `noindex`, like every lander.
- Listed in the hub under its own section, **NEW TAGs Landers**.
- **"Over $500 Million Won" is the client's wording, kept as he wrote it.** The firm
  says *recovered* everywhere else. It was flagged, and "Recovered" is a one-word
  change if he ever wants it.
