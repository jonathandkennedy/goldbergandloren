# PPC Lander System — New-Client Template

How to stand this system up for any law firm (or local-service client) in any
set of cities. Extracted from the Goldberg & Loren build (Aug–Sep 2026), which
is the reference implementation living in this repo. Keep the layout and the
machinery; swap everything marked `{{LIKE_THIS}}`.

---

## 0. What this system is

Static, dependency-free HTML landers deployed on Vercel. One **master page per
practice/case type**; a Node script **bakes** per-city variants from a single
JSON block inside each master. Every page is one self-contained HTML file — no
framework, no build pipeline, nothing to break. On top of the layout you get,
already wired and battle-tested:

- 3-step qualifying form (2 tap-questions → name/phone) with **strict US phone
  validation** (NANP: no 0/1-leading area codes/exchanges, no repeated-digit
  junk, no N11; a typed +1 is normalized away)
- **Response-aware submit**: lead POSTs to Formspree/webhook and the page
  redirects to thank-you ONLY on a confirmed 2xx. Failure or 12s timeout shows
  a bilingual "call us instead" error, logs the server's reason to the console,
  and fires a `lead_form_error` dataLayer event. Submit button disables while
  sending (kills double-submit dupes). Honeypot silently swallows bots.
- EN/ES toggle (`?lang=es` deep link for Spanish campaigns)
- Per-market GTM containers + two conversion events: `call_click` (on the
  lander) and `lead_form_submit` (fires on thank-you.html, which landers
  redirect to with `?geo=&ct=&lang=`)
- CallRail-ready phone display (see §6) and Microsoft Clarity recordings
- Branded **404 page** with a call CTA (Vercel serves `/404.html`
  automatically) so a bad final URL never dead-ends a paid click
- **Keyword-insertion test landers** (`*-kw.html`): headline adapts to the ad
  keyword via `?kw={keyword}` from a whitelist — raw query text never touches
  the page
- Playwright E2E suite in `tests/` covering all of the above

## 1. The placeholder sheet — collect BEFORE building

| Token | What it is | This repo's value (example) |
|---|---|---|
| `{{FIRM_NAME}}` | Display name | Goldberg & Loren |
| `{{FIRM_TAGLINE}}` | Logo subline | Personal Injury Attorneys |
| `{{RESPONSIBLE_ATTORNEY}}` | Named in the ad-compliance block | George Z. Goldberg |
| `{{INTAKE_PHONE}}` / `{{INTAKE_DISPLAY}}` | Main **CallRail tracking number** shown on pages (NOT the firm's raw line) | +15129603887 / (512) 960-3887 |
| `{{METRO_PHONE_*}}` | Per-metro local tracking numbers | (214) 466-2129 for all DFW pages |
| `{{FORM_ENDPOINT}}` | Formspree form or CRM/Zapier webhook — **one per client, never shared** | https://formspree.io/f/meajzepz |
| `{{EMAIL_SUBJECT_TAG}}` | `_subject` on every lead; feeds the client's mail filter and is your bot-spam diagnostic | GoldbergandlorenPPC |
| `{{INTAKE_EMAIL}}` | Footer + where Formspree notifies (must be watched 24/7) | intakes@goldbergloren.com |
| `{{GTM_*}}` | Container ID per market (or one site-wide) | GTM-NK6KTLNL (DFW) |
| `{{CLARITY_ID}}` | Clarity project — **one per client** | ybpj42my1c |
| `{{CLICKCEASE_ID}}` | ClickCease account hash in the tag URL — **one per client** | 1c12dbadd579836d7d83166cb5b124b3 |
| `{{PROD_DOMAIN}}` | Subdomain of the CLIENT's domain | results.goldbergloren.com |
| `{{PRIVACY_URL}}` | Client's privacy policy | goldbergloren.com/privacy-policy/ |
| `{{TRUST_STATS}}` | The 4 stat tiles — must be real | $550M+ / Since 1994 / 20,000+ / rating |
| `{{PRACTICE_TYPES}}` | One master each | car / truck / motorcycle accident |
| `{{MARKETS}}` | City list with per-market data (see §4) | 21 markets |
| Brand palette | CSS vars at top of masters | navy #153b66 · teal-ink #0f766e · teal #32edd0 |

## 2. File inventory

| File | Role |
|---|---|
| `<practice>.html` (×N) | Masters. All copy, CSS, JS, geo JSON, ES translations live inline here. Edit THESE, then re-bake. |
| `#geo-data` JSON block (inside each master) | One entry per market + `default`. The only per-city data source. |
| `#i18n-es` JSON block (inside each master) | Spanish swap ops (selector+index → text). |
| `generate-geo.mjs` | Baker: `node generate-geo.mjs <master>.html --all` → one flash-free static page per market, GTM hard-baked. |
| `build-hub.mjs` | Regenerates `index.html`, the internal review hub. NEVER send ad traffic to it (it carries no analytics on purpose). |
| `generate-kw-test.mjs` | Builds the `-kw.html` keyword-adaptive test variants from named baked pages. Re-run after re-baking those markets. |
| `generate-support-pages.mjs` | Builds the 6 shared sitelink-destination pages. Reads phone numbers + GTM containers out of the first master's `#geo-data`, so there is no second copy to sync. |
| `thank-you.html` | Post-submit page; fires `lead_form_submit` + loads the per-market GTM (reads `?geo=&ct=`). |
| `404.html` | Branded not-found with call CTA; `call_click` tagged `geo:"404"`. |
| `CAMPAIGN-URLS-*.md` | Final-URL reference handed to whoever builds the ad campaigns. |
| `generate-austin-test.mjs` | Pattern for a **client-specified heading outline** test: builds a variant from a baked lander, rebuilds the body around the given H1/H2/H3 list, fails the build if the outline drifts, and re-targets the positional Spanish ops by ID. Copy it for any market. |
| `tests/form-e2e.mjs`, `tests/kw-e2e.mjs`, `tests/support-e2e.mjs`, `tests/austin-test-e2e.mjs` | Playwright suites (Formspree mocked — no real leads sent). Run before every deploy. |
| `HANDOFF.md` | The live client's operating doc — keep one per client, dated, honest. |

## 3. New-client build order (~half a day)

1. **Copy this repo** to a fresh repo per client. Delete the baked `*-tx.html`
   etc. city pages, `*-kw.html` pages, and the old client's `CAMPAIGN-URLS-*`;
   keep masters, scripts, tests, thank-you, 404.
2. **Global find/replace** across masters + thank-you + 404 for every §1 token:
   firm name, tagline, attorney, phone (both `tel:+1…` and display form),
   Formspree ID, subject tag, intake email, privacy URL, Clarity ID, stats,
   brand colors. Grep afterward for the OLD client's name and number — zero
   hits allowed outside git history.
3. **Rewrite per-practice copy** in each master: title/description/og, hero
   H1 pattern stays `"{emotional hook} {City} {Practice}?"` (the `h1-pre` /
   `h1-city` / `h1-post` span structure powers both geo-bake and kw-test —
   don't restructure it), subhead, results, 2–3 practice-specific FAQ items,
   the two step-1/step-2 qualifying questions, `case_type` in the JS payload,
   and the matching entries in `#i18n-es`. Compliance rules in §5.
4. **Geo JSON** — one entry per market. Field reference:
   `city`, `h1city`(+`_es`), `phone`/`phoneDisplay` (per-market tracking
   number), `stars`/`starsLabel`(+`_es`)/`review`(+`_es`) (REAL review data
   per market or the firmwide fallback — never invent), `serve`(+`_es`),
   `office`(+`_es`) (only claim offices that exist; for markets without one
   use the "Serving {metro} · N offices in M states" pattern — showing a
   far-away street address tanks landing-page Quality Score), `sol`(+`_es`)
   (**statute-of-limitations line — verify per state**, incl. shorter
   government-claim windows), optional `gtm`.
5. **Bake + hub**: `node generate-geo.mjs <each master> --all` then
   `node build-hub.mjs`. Optionally `node generate-kw-test.mjs` (edit its
   PAGES list to this client's test markets first).
6. **Test**: `cd tests && npm i playwright && node form-e2e.mjs && node kw-e2e.mjs`
   (update the hardcoded city page/number assertions to the new client first).
7. **Deploy**: `npx vercel --prod`, then attach `{{PROD_DOMAIN}}` (CNAME →
   `cname.vercel-dns.com`). **Never run ads to \*.vercel.app.**
8. **Wire services** — per §6, in this order: Formspree → CallRail → GTM →
   Clarity → Google Ads final URLs.
9. Write the client's `CAMPAIGN-URLS-*.md` and a fresh `HANDOFF.md`.

## 4. Adding a market / practice later

- New market = one JSON entry in `#geo-data` of each master → re-bake all
  masters → `node build-hub.mjs` → add rows to the campaign-URLs doc. Make the
  city page BEFORE the campaign goes live — Goldberg & Loren's Fort Worth
  campaign spent ~$960 in a month pointing at a 404.
- New practice type = copy the closest master, change: title/og, hero copy,
  qualifying questions, FAQ (+ES ops), `case_type` payload value, the
  `&ct=` value in the thank-you redirect. Geo JSON carries over unchanged.

## 5. Law-firm compliance guardrails (bake into every rewrite)

- "cases **handled**", never "won"; "a real person answers", never "attorneys
  answer" (unless true); no invented settlements, review counts, or ratings.
- TCPA consent checkbox above the submit button (call/text, automated means,
  consent-not-required-to-hire language) — the form blocks without it.
- Attorney-advertising block in the footer: general-information disclaimer,
  no-attorney-client-relationship, prior-results, fee explanation, responsible
  attorney by name, licensed-by-state note.
- Privacy policy link + "Do Not Sell or Share" CCPA-style footer link. No
  cookie banner for US-only traffic — and keep it that way in Clarity (§6).
- SOL deadlines differ by state AND by claim type (government-entity claims
  can be months, not years) — verify each `sol` line per client per state.

## 6. Service wiring — the exact settings that matter

**Formspree (or webhook)** — one form per client. Free tier = 50 subs/month
(testing only); production = paid or point `formEndpoint` at a Zapier/Make
webhook → CRM + instant SMS. Formshield ON (it's the only bot defense on free
— domain restriction is a paid feature). Know the diagnostics: real leads
always carry `{{EMAIL_SUBJECT_TAG}}`; junk WITHOUT it = bots POSTing the
public endpoint directly. Sub-10-digit phones can't come from the page at
all. If a test "succeeds" but never appears, check the Spam tab and confirm
which Formspree ACCOUNT owns the form.

**CallRail** — the number printed on the pages IS a CallRail tracking number
(calls log even with nothing else configured). For keyword attribution you
need a **Google Ads keyword pool** on `{{PROD_DOMAIN}}` whose "numbers to
swap" list contains EVERY number the pages display (main + each metro
number) — miss one and those pages silently stop swapping. Verify with
`?gclid=test` in incognito: the displayed number AND the tap-to-call `tel:`
must change. Provision metro-local numbers (bake via geo `phone`) — an
out-of-area code to local searchers drags Quality Score. Keep exactly ONE
swap system: never run Google's website-call-tracking snippet alongside.

**GTM** — per-market containers via the geo `gtm` key (site-wide fallback:
`CONFIG.gtmId`). Inside each: GA4 + Google Ads conversion tags on
`call_click` and `lead_form_submit` (or a `/thank-you.html` page trigger —
one or the other, both double-counts). Count calls as conversions. Target
state in Google Ads: 3 clean primaries — Phone Call (CallRail), Form Capture
(CallRail), Calls-from-ads >60s — everything else secondary or deleted.

**Clarity** — one project per client, snippet in the masters' head (bake
carries it everywhere; leave `index.html` untagged). **Settings → Setup →
Advanced → Cookies OFF** — otherwise Clarity's consent banner appears over
the bottom of the page, exactly where the mobile call CTA lives. This
banner measurably killed conversions for a week on the reference client.

**ClickCease** (click-fraud protection, optional but standard here) — one
account per client; async script in the masters' head, `<noscript>` iframe
after `<body>` (never inside the head — invalid HTML there). Bake carries it
everywhere; leave `index.html` untagged. Connect the client's Google Ads
account inside ClickCease or it only detects and never blocks. Add the tag
host to the E2E suites' aborted routes so tests stay hermetic.

**Google Ads hygiene** (from the reference client's audit — hand this to
whoever runs the account): Max-Clicks needs a CPC cap (~$100–125) or single
clicks hit $650; city-per-campaign fragments learning — consolidate to metro
cores; account-level negative list (competitor brands, jobs, DIY intent);
every ad group's final URL = its city lander, never the main site; DKI in
RSAs only AFTER keyword lists are typo- and competitor-clean.

## 7. Keyword-test landers (optional but proven safe)

`generate-kw-test.mjs` copies named baked pages to `-kw.html` variants. Ad
group final URL: `https://{{PROD_DOMAIN}}/<page>-kw.html?kw={keyword}`.
Whitelist logic only — profession synonyms + "near me" pick from FIXED
headline strings; unrecognized/missing kw = the control page unchanged, so
any traffic is safe. Leads arrive tagged `variant:"kw-test"` + the sanitized
keyword; thank-you gains `&variant=kw` for GA4 splits. Adapt the whitelist
map per practice (attorney/lawyer for law; plumber/electrician/etc. for
trades). Evaluate on landing-page-experience QS + conv rate after 2–3 weeks.

## 7b. Shared support pages (sitelink destinations)

`generate-support-pages.mjs` builds six shared pages, one per buying objection:
`no-fee`, `case-review`, `settlements`, `reviews`, `maximize-compensation`,
`our-team`. Google treats a distinct URL as a stronger sitelink destination than
an anchor on the ad's own final URL, and anchors are occasionally disapproved for
matching that final URL.

They are **shared across all markets but geo-aware at runtime** — `?geo=<slug>`
swaps the phone and GTM container so call tracking still attributes,
`?ct=<practice>` points the return CTAs at the matching lander, `?lang=es`
switches language (same localStorage key as the landers, so the choice follows
the visitor).

**They are indexable; the landers are not.** Six unique pages can rank. Ninety-two
near-identical city landers are a doorway-page pattern — keep those `noindex`
whatever the client asks. Indexing the six requires, and the generator emits:
a **parameter-free canonical** (without it `?geo`/`?ct`/`?lang` spawn ~176
duplicates per page), `LegalService` JSON-LD with `sameAs` pointing at the
client's main site so the subdomain reads as the same entity, absolute OG URLs,
and a generated `robots.txt` + `sitemap.xml`. **Never** add `aggregateRating` or
`Review` markup for the client's own reviews on the client's own site — Google
won't show it and it risks a manual action.

Porting to a new client:
1. Rewrite the copy in the `PAGES` object — the page **shells** (geo wiring,
   language toggle, CTA routing, compliance footer) carry over unchanged.
2. Keep `our-team` honest: no stock photos. Missing headshot → initials
   monogram, which is what the template ships.
3. `reviews` and `settlements` are where a client gets a firm into trouble.
   Only real, attributable reviews; only real figures; prior-results disclaimer
   in the body of both, not just the footer.
4. **Verify every bio claim against the client's own published material** before
   it ships, and record where each one came from. Skip any unsubstantiated
   success-rate or "best/top" claim even when the client publishes it — those
   are the ones that draw bar complaints, and the settlement figures do the
   same persuasive work.
5. Add them to the hub's Shared Pages section (`SUPPORT` array in
   `build-hub.mjs`) and to the client's `SITELINKS.md`.
6. **Dress them in the client's own brand, not the lander template's.** These
   pages are what a prospect sees after clicking a sitelink, so they should
   feel like the firm's main site. Get phone screenshots of the client's site,
   match palette + type, and **self-host the fonts** (`npm pack
   @fontsource-variable/<family>`, copy the latin `wght` woff2 + LICENSE into
   `fonts/`) rather than calling Google Fonts. Keep the geo/lang/CTA script and
   the compliance footer exactly as they are — only the skin changes.
7. **Keep a dollar-figure allowlist in the test.** Every amount on these pages
   must trace to the client's published results. When the client's site and
   older material disagree (it happened here), leave the figure off and ask.

## 8. Launch QA checklist (every client, every time)

- [ ] `tests/` suites green (form validation, submit success/failure EN+ES,
      honeypot, kw variants, hostile-input sanitization)
- [ ] Browser test on production: junk phone rejected; real submit reaches
      thank-you AND appears in the form backend; failure path shows call CTA
- [ ] `?gclid=test` swaps display + `tel:` on every metro's pages
- [ ] `?lang=es` renders Spanish end-to-end incl. error messages
- [ ] GTM preview shows `call_click` + `lead_form_submit` with case_type/geo
- [ ] Clarity recording appears; NO consent banner visible
- [ ] Bad URL shows branded 404 with working call button
- [ ] Old client's name/phone: zero grep hits
- [ ] Campaign final URLs all 200 (no page missing for any live ad group)
- [ ] Formspree notification lands in the 24/7 intake inbox; speed-to-lead
      owner named (5-min response ≈ 21× qualification — the page converts;
      answering makes cases)

---
Template extracted 2026-09-10 from the Goldberg & Loren engagement. Reference
implementation: this repo (see `HANDOFF.md` for the live-client specifics and
the dated history of why each mechanism exists).
