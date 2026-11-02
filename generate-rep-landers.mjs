#!/usr/bin/env node
/**
 * The PPC rep's paid-search landers, made ad-ready.
 *   node generate-rep-landers.mjs
 *
 * Sources: the rep's "review builds" exactly as delivered, kept out of the deployment by
 * .vercelignore:
 *   rep-landers/long/{slug}.html, rep-landers/simple/{slug}.html   Texas, 2026-10-12. 14 pages
 *     each: 12 car, 2 truck, e.g. car-accident-lawyer-dallas-tx
 *   rep-landers/az/{area}/{keyword}.html, rep-landers/az/{page}.html   Arizona, 2026-10-14. 63
 *     single-keyword pages (7 areas × 9 keywords) and 7 sitelink pages
 *
 *   D · long    /{slug}/                  Texas, the rep's own URLs, e.g. /car-accident-lawyer-dallas-tx/
 *   E · simple  /{slug}-simple/           Texas, the short form-first design
 *   AZ          /az/{area}/{keyword}/     Arizona, the rep's planned URLs; sitelinks at /az/{page}/
 *
 * D and E are each tested against the live lander for the same city and case type (A, e.g.
 * car-accident-dallas-tx.html). Arizona has no live lander; its pages share E's design. The
 * rep's design and copy are kept; what changes:
 *   - every yellow VERIFY / PLACEHOLDER / "Legal review" note is gone, and so is each claim
 *     the rep could not verify: the review-site badges (Avvo, Martindale, Super Lawyers,
 *     Google rating), home/hospital visits, the empty "Texas result" card, the unverified
 *     Denton County courthouse address and Prosper ER list, Yuma's "highest rates per
 *     resident". Claims the live landers already make (the four stats, the three client
 *     reviews, the two published results, the Texas filing deadline and fault rule) stay;
 *     so do Arizona's law statements and ADOT crash counts (checked against ADOT's 2024
 *     Crash Facts, tables 2-2 and 2-5).
 *   - Arizona: James M. Loren is named as the attorney responsible for the ads and for Arizona
 *     cases; the reviews (all from Texas clients) say so; calls go to (520) 376-2425
 *   - the forms send leads: same Formspree inbox, same thank-you page and conversion as the
 *     live landers, tagged variant {city}-ppc-long (D), {city}-ppc-simple (E) or
 *     az-{area}-{keyword} (AZ)
 *   - the live landers' tracking: GTM, Microsoft Clarity, ClickCease and the CallTrackingMetrics
 *     number swap (Arizona: the Dallas lander's GTM, Clarity and ClickCease, i.e. the container
 *     in AZ.gtm, and its own CallTrackingMetrics account)
 *   - the partners' photo in the hero, and the "Ask Us About Our Rental Car" heading every
 *     lander carries, under the call buttons
 *   - titles fit in 60 characters (the "| Goldberg & Loren" tail goes where it doesn't fit),
 *     and every page's title and meta description is its own
 *   - JSON-LD: the rep's LegalService block (the sitelink pages, which have none, get the
 *     keyword pages'), and an FAQPage rebuilt from the page's own (cleaned) FAQ, so the
 *     markup always matches what the page shows
 * The build fails if a note survives, a phone number differs from the expected one, two pages
 * share a title or description, or a removal no longer finds what it removes (the rep sent a
 * new version: re-check by hand).
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from "node:fs";
import { STATES, statePages } from "./state-landers.mjs";

const SRC = "rep-landers";
const BASE = "https://results.goldbergloren.com/";
export const GROUPS = {
  D: { dir: "long", label: "Group D · PPC rep, long", suffix: "", tag: "ppc-long" },
  E: { dir: "simple", label: "Group E · PPC rep, simple", suffix: "-simple", tag: "ppc-simple" },
};
// Arizona has no live lander of its own: its tracking is copied from the Dallas lander, i.e. the
// GTM container the rep's Texas pages use (one constant to change if AZ gets its own container)
export const AZ = { abbr: "AZ", name: "Arizona", slug: "az", phone: "+15203762425", display: "(520) 376-2425", attorney: "James M. Loren",
  gtm: "GTM-NK6KTLNL", trackFrom: "car-accident-dallas-tx.html",
  // CallTrackingMetrics number swap, Arizona only (the firm's snippet, verbatim), at the end of the
  // body so it doesn't hold up the page
  callTracking: `<!-- CallTrackingMetrics -->
<script type="text/javascript" src="//cdn.calltrk.com/companies/977831359/decf00814d0bf9e721cf/12/swap.js"></script>
<!-- End CallTrackingMetrics -->` };
// every state the rep-style keyword pages cover: Arizona from the rep's drafts, the rest from
// state-landers.mjs, built in the same design by the same steps
export const REP_STATES = { AZ, ...STATES };
const CITY_FIX = { "fort-worth": "Fort Worth", "san-antonio": "San Antonio", mckinney: "McKinney" };
const titleCase = s => s.replace(/(^|-)([a-z])/g, (_, a, b) => (a ? " " : "") + b.toUpperCase());

// car-accident-lawyer-dallas-tx → { cs: "car-accident", geo: "dallas-tx", city: "dallas" }
export function parse(slug) {
  const m = slug.match(/^(car|truck)-accident-lawyer-([a-z-]+-tx)$/);
  if (!m) throw new Error(`unexpected rep slug ${slug}`);
  const geo = m[2], city = geo.replace(/-tx$/, "");
  return { slug, cs: `${m[1]}-accident`, geo, city, cityName: CITY_FIX[city] || titleCase(city) };
}
export const slugs = () => readdirSync(`${SRC}/long`).filter(f => f.endsWith(".html")).map(f => f.slice(0, -5)).sort();
export const pageDir = (group, slug) => slug + GROUPS[group].suffix;
export const pageUrl = (group, slug) => `${pageDir(group, slug)}/`;

// Arizona: { area, areaName, keyword, kind: "keyword" | "sitelink", dir, url, cs, geo, variant }
export function azPages() {
  const out = [];
  for (const f of readdirSync(`${SRC}/az`).sort()) {
    if (statSync(`${SRC}/az/${f}`).isDirectory()) {
      for (const k of readdirSync(`${SRC}/az/${f}`).filter(x => x.endsWith(".html")).sort()) {
        const keyword = k.slice(0, -5);
        out.push({ group: "AZ", kind: "keyword", area: f, areaName: titleCase(f), keyword, src: `${SRC}/az/${f}/${k}`,
          dir: `az/${f}/${keyword}`, cs: /truck/.test(keyword) ? "truck-accident" : "car-accident", geo: `az-${f}`, variant: `az-${f}-${keyword}` });
      }
    } else if (f.endsWith(".html")) {
      const page = f.slice(0, -5);
      out.push({ group: "AZ", kind: "sitelink", page, src: `${SRC}/az/${f}`, dir: `az/${page}`,
        cs: /truck/.test(page) ? "truck-accident" : "car-accident", geo: "az", variant: `az-${page}` });
    }
  }
  // the keyword pages by area, then the sitelinks
  return out.sort((a, b) => (a.kind === "sitelink") - (b.kind === "sitelink")).map(p => ({ ...p, url: `${p.dir}/`, design: "simple" }));
}
// every page this script builds: Texas, Arizona, then the states state-landers.mjs drafts
export function allPages() {
  const tx = slugs().map(parse).flatMap(p => ["D", "E"].map(group => ({ ...p, group, design: group === "D" ? "long" : "simple",
    src: `${SRC}/${GROUPS[group].dir}/${p.slug}.html`, dir: pageDir(group, p.slug), url: pageUrl(group, p.slug),
    variant: `${p.city}-${GROUPS[group].tag}`, control: `${p.cs}-${p.geo}.html` })));
  return [...tx, ...azPages(), ...statePages()];
}

const PARTNERS = `<picture><img src="/img/partners-720.webp" srcset="/img/partners-480.webp 480w, /img/partners-720.webp 720w, /img/partners-960.webp 960w" sizes="(min-width: 960px) 440px, calc(100vw - 40px)" width="960" height="624" alt="James M. Loren and George Z. Goldberg, partners of Goldberg &amp; Loren" fetchpriority="high"></picture>`;
const TAGS = `<figcaption><span class="tn"><b>James M. Loren</b><i>Senior Partner</i></span><span class="tn"><b>George Z. Goldberg</b><i>Founding Partner</i></span></figcaption>`;
const CAR_ICON = c => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${c.replace("#", "%23")}' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 17H3.5v-4.5L6 7h12l2.5 5.5V17H19'/%3E%3Cpath d='M3.5 12.5h17'/%3E%3Ccircle cx='7.5' cy='17' r='2'/%3E%3Ccircle cx='16.5' cy='17' r='2'/%3E%3Cpath d='M9.5 17h5'/%3E%3C/svg%3E")`;
const RENTAL = `<h2 class="rental">Ask Us About Our Rental Car</h2>`;

const CSS = {
  long: `
/* ---- ad-ready additions ---- */
.hero-side{display:flex;flex-direction:column;min-width:0}
.hero-team{position:relative;z-index:0;width:100%;max-width:440px;margin:0 auto -64px}
.hero-team::before{content:"";position:absolute;left:6%;right:6%;top:12%;bottom:0;border-radius:999px 999px 0 0;background:linear-gradient(180deg,#e4f0ed 0%,rgba(243,247,251,0) 90%)}
.hero-team img{position:relative;display:block;width:100%;height:auto;-webkit-mask-image:linear-gradient(#000 74%,transparent 98%);mask-image:linear-gradient(#000 74%,transparent 98%)}
.hero-team figcaption{position:absolute;left:0;right:0;bottom:76px;z-index:1;display:flex;justify-content:space-between;gap:6px}
.tn{background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 6px 18px rgba(21,59,102,.16);padding:6px 11px 7px;line-height:1.2}
.tn b{display:block;font-size:13px;font-weight:800;color:var(--navy);white-space:nowrap}
.tn i{display:block;margin-top:2px;font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--btn);white-space:nowrap}
.hero-side .card{position:relative;z-index:1}
.rental{display:flex;align-items:center;gap:10px;margin:18px 0 0;font-size:21px;line-height:1.25;font-weight:800;color:var(--navy-deep)}
.rental::before{content:"";flex:none;width:30px;height:30px;background:${CAR_ICON("#0f766e")} center/contain no-repeat}
.ferr{color:#b42318;font-size:14px;font-weight:700;margin:10px 0 0}
.hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
@media (max-width:374px){.tn{padding:5px 8px 6px}.tn b{font-size:11.5px}.tn i{font-size:8.5px;letter-spacing:.08em}}
`,
  simple: `
/* ---- ad-ready additions ---- */
.pitch{grid-template-columns:1fr;gap:10px;margin-bottom:18px}
.hero-team{position:relative;margin:0;width:100%;max-width:400px}
.hero-team img{display:block;width:100%;height:auto;-webkit-mask-image:linear-gradient(#000 76%,transparent 99%);mask-image:linear-gradient(#000 76%,transparent 99%)}
.hero-team figcaption{position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:space-between;gap:6px}
.tn{background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 6px 18px rgba(10,22,40,.16);padding:6px 11px 7px;line-height:1.2;text-align:left}
.tn b{display:block;font-size:13px;font-weight:800;color:var(--navy-deep);white-space:nowrap}
.tn i{display:block;margin-top:2px;font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-dark);white-space:nowrap}
.rental{display:flex;align-items:center;gap:10px;margin:14px 0 0;font-size:20px;line-height:1.25;color:var(--navy-deep)}
.rental::before{content:"";flex:none;width:28px;height:28px;background:${CAR_ICON("#1B3A5C")} center/contain no-repeat}
.ferr{color:#b42318;font-size:14px;font-weight:700;margin:0 0 10px}
.hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
@media (max-width:640px){.hero-team{margin:0 auto;max-width:340px}.rental{justify-content:center;font-size:17px;gap:8px}.rental::before{width:24px;height:24px}}
@media (max-width:374px){.tn{padding:5px 8px 6px}.tn b{font-size:11.5px}.tn i{font-size:8.5px;letter-spacing:.08em}}
`,
};

// field ids per form, per design
const FORMS = {
  long: [{ id: "case-form", where: "hero", name: "n", phone: "p", when: "w", consent: "c1", injured: "inj" },
         { id: "case-form-2", where: "bottom", name: "n2", phone: "p2", consent: "c2" }],
  simple: [{ id: "case-form", where: "hero", pre: "case-form-" }, { id: "case-form-2", where: "bottom", pre: "case-form-2-" }],
};

function script(p, phoneDisplay) {
  return `<script>
(function(){
  "use strict";
  // leads go where the live landers' go; the thank-you page fires the conversion
  var ENDPOINT = "https://formspree.io/f/meajzepz", CT = "${p.cs}", GEO = "${p.geo}", VARIANT = "${p.variant}", PHONE = "${phoneDisplay}";
  var FORMS = ${JSON.stringify(FORMS[p.design])};
  window.dataLayer = window.dataLayer || [];
  function track(ev, extra){ var e = { event: ev, case_type: CT, geo: GEO, variant: VARIANT }; if (extra) for (var k in extra) e[k] = extra[k]; window.dataLayer.push(e); }
  window.dataLayer.push({ event: "page_variant", variant: VARIANT });
  document.addEventListener("click", function(e){ if (e.target.closest && e.target.closest('a[href^="tel:"]')) track("call_click"); });
  function val(id){ var el = id && document.getElementById(id); return el ? el.value.trim() : ""; }
  FORMS.forEach(function(cfg){
    var form = document.getElementById(cfg.id); if (!form) return;
    var err = form.querySelector(".ferr"), btn = form.querySelector('button[type="submit"]');
    function fail(msg){ err.textContent = msg; err.hidden = false; }
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var pre = cfg.pre, data = {};
      if (pre) {
        data.name = (val(pre + "fn") + " " + val(pre + "ln")).trim();
        data.phone = val(pre + "ph"); data.zip = val(pre + "zip"); data.email = val(pre + "em");
        data.case_type_selected = val(pre + "ct"); data.details = val(pre + "d"); data.consent = "by submitting the form";
        if (!val(pre + "fn")) return fail("Please enter your first name.");
      } else {
        data.name = val(cfg.name); data.phone = val(cfg.phone);
        if (cfg.when) data.when = val(cfg.when);
        if (cfg.injured) { var r = form.querySelector('input[name="' + cfg.injured + '"]:checked'); data.injured = r ? r.value : "";
          if (!data.injured) return fail("Please tell us whether you were injured."); }
        if (!data.name) return fail("Please enter your name.");
      }
      var ph = data.phone.replace(/\\D/g, ""); if (ph.length === 11 && ph.charAt(0) === "1") ph = ph.slice(1);
      if (!(/^[2-9]\\d{2}[2-9]\\d{6}$/.test(ph) && !/^(\\d)\\1{9}$/.test(ph) && !/^[2-9]11/.test(ph) && !/^\\d{3}[2-9]11/.test(ph)))
        return fail("Please enter a valid 10-digit phone number.");
      data.phone = ph;
      if (cfg.consent) { if (!document.getElementById(cfg.consent).checked) return fail("Please check the consent box so we can contact you."); data.consent = "checkbox"; }
      err.hidden = true;
      var dest = "/thank-you.html?geo=" + GEO + "&ct=" + CT + "&variant=" + VARIANT;
      if (form.querySelector('[name="company"]').value !== "") { location.href = dest; return; }
      data.case_type = CT; data.geo = GEO; data.variant = VARIANT; data.form = cfg.where;
      data.page = location.href; data.submitted = new Date().toISOString(); data._subject = "GoldbergandlorenPPC";
      var label = btn.textContent, settled = false; btn.disabled = true; btn.textContent = "Sending\\u2026";
      function sendFail(status, detail){ if (settled) return; settled = true; btn.disabled = false; btn.textContent = label;
        try { console.error("Lead form send failed:", status, detail); } catch(e2){}
        track("lead_form_error", { error_status: String(status) });
        fail("We couldn't send your form. Please call " + PHONE + " instead \\u2014 free, 24/7."); }
      setTimeout(function(){ sendFail("timeout", "no response after 12s"); }, 12000);
      try {
        fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
          .then(function(r){ if (r.ok) { if (!settled) { settled = true; location.href = dest; } }
            else r.text().then(function(t){ sendFail(r.status, t); }, function(){ sendFail(r.status, ""); }); },
            function(e2){ sendFail("network", String(e2)); });
      } catch(e2){ sendFail("exception", String(e2)); }
    });
  });
})();
</script>`;
}

// the element starting at `start` (an index of "<tag"), through its matching close tag
function elementEnd(html, start) {
  const tag = html.slice(start + 1).match(/^[a-z0-9]+/)[0];
  const re = new RegExp(`<${tag}\\b|</${tag}>`, "g");
  re.lastIndex = start; let depth = 0, m;
  while ((m = re.exec(html))) { depth += m[0][1] === "/" ? -1 : 1; if (!depth) return m.index + m[0].length; }
  throw new Error("unbalanced " + tag);
}

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…", sect: "§", middot: "·" };
export const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? m);
// visible text of an HTML fragment, footnote markers dropped
export const text = s => decode(s.replace(/<sup\b[\s\S]*?<\/sup>/g, "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const attr = s => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
export const TITLE_MAX = 60;
// the first candidate that fits, the "| Goldberg & Loren" tail and then the "free review" tail
// giving way in turn
const fit = cands => cands.find(t => t.length <= TITLE_MAX) || cands[cands.length - 1];
const TAILS = [" | Free Case Review 24/7", " | Free 24/7 Review", " | Free Review", ""];

const LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>\n?/;
function legalService(html) {
  try { const j = JSON.parse((html.match(LD) || [])[1]); return (j["@graph"] || [j]).find(g => g["@type"] === "LegalService") || null; }
  catch { return null; }
}
// the sitelink pages carry no JSON-LD: they get the firm's LegalService block from the keyword pages
let azLegalCache;
const azLegal = () => azLegalCache ??= legalService(readFileSync(azPages().find(x => x.kind === "keyword").src, "utf8"));

function build(p) {
  const st = REP_STATES[p.group]; // the state settings for a rep-style keyword page
  const ref = p.control || st.trackFrom;
  const ctl = readFileSync(ref, "utf8");
  let html = p.draft ? p.draft() : readFileSync(p.src, "utf8");
  const errs = [];
  const count = (s, f) => typeof f === "string" ? s.split(f).length - 1 : (s.match(new RegExp(f.source, "g")) || []).length;
  // replace exactly n (default 1) occurrences, "+" for one or more, "*" for any (page-specific), or record the drift
  const rep = (find, repl, what, n = 1) => {
    const c = count(html, find);
    if (n === "+" ? c < 1 : n !== "*" && c !== n) { errs.push(`expected ${n === "+" ? "1+" : n} × ${what}, found ${c}`); return; }
    html = typeof find === "string" ? html.split(find).join(repl) : html.replace(new RegExp(find.source, "g"), repl);
  };
  const removeEl = (startPat, what, n = 1) => {
    let c = 0, i;
    while ((i = html.indexOf(startPat)) >= 0) { html = html.slice(0, i) + html.slice(elementEnd(html, i)).replace(/^\s*\n/, "\n"); c++; }
    if (n !== "*" && c !== n) errs.push(`expected ${n} × ${what}, removed ${c}`);
  };
  const grab = (re, s = ctl) => (s.match(re) || [])[0] || (errs.push(`${ref}: missing ${re}`), "");
  const az = p.group === "AZ", sitelink = p.kind === "sitelink";

  // the live lander's tracking, verbatim (for a state's keyword pages, the container its settings name)
  const trackHead = [/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/, /<!-- Microsoft Clarity -->[\s\S]*?<!-- End Microsoft Clarity -->/,
    /<!-- ClickCease\.com tracking-->[\s\S]*?<!-- ClickCease\.com tracking-->/].map(re => grab(re)).join("\n");
  const trackBody = grab(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End ClickCease\.com tracking \(noscript\) -->/);
  if (st && [...new Set((trackHead + trackBody).match(/GTM-[A-Z0-9]+/g))].join() !== st.gtm) errs.push(`${ref}: tracking is not ${st.gtm}`);
  const tel = st ? st.phone : (ctl.match(/class="btn btn-teal cta-call js-tel" href="tel:(\+\d+)"/) || [])[1];
  const display = st ? st.display : (ctl.match(/<span class="js-tel-text">([^<]+)<\/span>/) || [])[1];
  const tels = [...new Set([...html.matchAll(/href="tel:(\+?\d+)"/g)].map(m => m[1]))];
  if (!tel || tels.length !== 1 || tels[0] !== tel) errs.push(`phone ${tels} differs from the expected ${tel}`);

  // the rep's review scaffolding; the LegalService block is kept for the rebuilt JSON-LD
  rep(/<!-- (?:Generated review build|Simple form-first variant|[A-Z]{2} (?:SKAG|sitelink) page)[\s\S]*?-->\n?/, "", "review-build comment");
  const legal = az && sitelink ? azLegal() : legalService(html);
  if (!legal) errs.push("no LegalService block in the rep's JSON-LD");
  rep(LD, "", "JSON-LD block (rebuilt below from the cleaned page)", az && sitelink ? 0 : 1);
  rep('<meta charset="utf-8">', '<meta charset="utf-8">\n' + trackHead, "charset meta");
  rep(/<body>\n?/, "<body>\n" + trackBody + "\n", "body tag");

  // claims the rep flagged as unverified
  rep(/by phone, video,? (and|or)(?: in person)?(?: at)? home or (?:the )?hospital(?: visits)?/, "by phone $1 video", "home/hospital visit claim", az && !sitelink ? "+" : "*");
  if (p.design === "long") {
    rep(", and can come to your home or hospital room", "", "hospital-room claim", "*");
    removeEl('<div class="badges">', "review-site badge row");
    removeEl('<div class="res"><b><span class="ph"', "empty Texas result card");
    rep(/(Examples from the firm's published results\. Location shown for each case\.<\/p>\s*<div class=")grid3/, "$1grid2", "results grid");
    rep(/<dt>Hospitals<\/dt><dd>(?:(?!<\/dd>)[\s\S])*VERIFY nearest ERs(?:(?!<\/dd>)[\s\S])*<\/dd>/, "", "unverified ER list (Prosper)", "*");
    rep(/ <span class="ph">VERIFY courthouse name\/address<\/span>(?= [a-z])/, ",", "courthouse note mid-sentence (Denton County cities)", "*");
    rep('<a class="lang" href="#" aria-label="Ver en español">ES</a>', "", "dead ES link");
    rep('<div class="ini">JL</div>', '<img src="/img/james-loren.jpg" width="600" height="800" loading="lazy" alt="James M. Loren, senior partner">', "James Loren photo placeholder");
    rep('<img src="../assets/george-goldberg.jpg" width="300" height="401"', '<img src="/img/george-goldberg.jpg" width="600" height="802"', "George Goldberg photo");
    rep("<span>Attorney-client confidential</span>", "<span>Confidential</span>", "attorney-client claim (a form isn't privileged)");
  } else {
    removeEl('<div class="badges"><span class="ph">', "badge/stat note", az && !sitelink ? 1 : "*");
  }
  if (az) {
    // the attorney the firm named, where the rep left a blank (one wording on every page)
    if (sitelink) rep("Attorney Advertising. Responsible attorney: ", "Attorney Advertising. Attorney responsible for this advertisement: ", "responsible-attorney wording");
    rep(' VERIFY all firm facts on this page">', '">', "note in the About page's description", "*");
    rep('<span class="ph">VERIFY Arizona-licensed responsible attorney</span>', AZ.attorney, "responsible-attorney line");
    rep(/<span class="ph">VERIFY: (?:name the Arizona-licensed attorney responsible for AZ cases|Arizona-licensed attorney\(s\), bar admissions and ER 7\.1–7\.3 compliance)<\/span>/,
      `Arizona cases are handled by attorney ${AZ.attorney}.`, "who handles Arizona cases", sitelink ? "*" : "+");
    rep(", among the highest rates per resident in Arizona", "", "Yuma per-resident claim (not in ADOT's report)", "*");
  }
  if (st) rep(/ · Client review<\/small>/, " · Texas client</small>", "review labels (the reviews are from Texas clients)", sitelink ? "*" : 3);
  // every remaining note, then the empty paragraphs they leave
  html = html.replace(/ ?<span class="ph"[^>]*>[^<]*<\/span>/g, "").replace(/<p(?: class="disc")?>\s*<\/p>\n?/g, "");

  // the partners' photo, and the rental-car heading under the call buttons
  if (p.design === "long") {
    const f = html.indexOf('<form class="card" id="case-form"'); const e = f >= 0 ? elementEnd(html, f) : -1;
    if (f < 0) errs.push("hero form not found");
    else html = html.slice(0, f) + `<div class="hero-side">\n <figure class="hero-team">${PARTNERS}${TAGS}</figure>\n ` + html.slice(f, e) + "\n </div>" + html.slice(e);
    rep(/(<div class="micro">[^<]*<\/div>)/, "$1\n  " + RENTAL, "line under the call buttons");
  } else {
    rep(/<img src="(?:\.\.\/)+assets\/george-goldberg\.jpg"[^>]*>/, `<figure class="hero-team">${PARTNERS}${TAGS}</figure>`, "hero headshot");
    rep(/(<ul class="checks">[\s\S]*?<\/ul>)/, "$1\n    " + RENTAL, "hero checklist");
    rep(/="(?:\.\.\/)+assets\/gl-logo\.svg"/, '="/img/gl-logo.svg"', "logo (preload, header, footer)", sitelink ? 2 : 3);
    if (p.group === "E") rep(new RegExp(`(<link rel="canonical" href="${BASE}${p.slug})/"`), `$1-simple/"`, "canonical");
  }
  if (!html.includes(`<link rel="canonical" href="${BASE}${p.url}">`)) errs.push(`canonical isn't ${BASE}${p.url}`);
  rep("</style>", CSS[p.design] + "</style>", "closing style tag");

  // forms: real ids, consent where the design has a checkbox, a honeypot and an error line
  const nForms = count(html, /<form\b/);
  rep(/ onsubmit="return false"/, "", "inert form handler", nForms);
  if (p.design === "long") {
    rep('<form class="card">', '<form class="card" id="case-form-2" aria-labelledby="fh2">', "bottom form");
    rep("<h2>Free case review</h2>", '<h2 id="fh2">Free case review</h2>', "bottom form title");
    html = html.replace(/<label class="opt"><input type="radio" name="inj"(?: checked)?> ([^<]+)<\/label>/g, (_, t) => `<label class="opt"><input type="radio" name="inj" value="${t.trim()}"> ${t}</label>`);
    rep('<label class="consent"><input type="checkbox">', '<label class="consent"><input type="checkbox" id="c1">', "hero consent box");
    const consent = (html.match(/<label class="consent">[\s\S]*?<\/label>/) || [""])[0].replace('id="c1"', 'id="c2"');
    rep(/(<div class="fld"><label for="p2">[\s\S]*?<\/div>)/, "$1\n  " + consent, "bottom form phone field");
  }
  rep(/(\n\s*<button class="btn [^"]*" type="submit">)/, '\n  <input class="hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="ferr" role="alert" hidden></p>$1', "submit buttons", nForms);

  // title and description: short enough not to be cut off, and each page's own
  const oldTitle = decode((html.match(/<title>([^<]*)<\/title>/) || [, ""])[1]);
  const noBrand = oldTitle.replace(/ \| Goldberg & Loren$/, "");
  const h1 = text((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [, ""])[1]);
  let title, desc = null;
  // (the brand once: "About Goldberg & Loren" doesn't need it again)
  if (p.group === "D" || sitelink) title = fit(noBrand.includes("Goldberg & Loren") ? [noBrand] : [oldTitle, noBrand]);
  else if (p.group === "E") {
    title = fit(TAILS.map(t => h1 + t));
    const kind = p.cs === "truck-accident" ? "truck" : "car";
    desc = `Hurt in a ${p.cityName} ${kind} crash? Talk to a Goldberg & Loren ${kind} accident lawyer, free and 24/7. No fee unless we win. Takes about a minute.`;
  } else {
    // an Arizona near-me headline doesn't name the area; the title has to, or the seven areas share it
    const base = az && /near-me$/.test(p.keyword) ? `${h1} | ${p.areaName}, AZ` : h1;
    title = fit(TAILS.map(t => base + t));
  }
  if (title.length > TITLE_MAX) errs.push(`title "${title}" is ${title.length} characters`);
  rep(/<title>[^<]*<\/title>/, `<title>${attr(title)}</title>`, "title");
  if (desc) rep(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(desc)}">`, "meta description");

  // JSON-LD: the rep's LegalService (with this page's number) and the FAQ as the page shows it
  const faq = [...html.matchAll(/<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)]
    .map(m => ({ "@type": "Question", name: text(m[1]), acceptedAnswer: { "@type": "Answer", text: text(m[2]) } }));
  const graph = [{ ...legal, telephone: tel }];
  if (faq.length) graph.push({ "@type": "FAQPage", mainEntity: faq });
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  rep("</head>", `<script type="application/ld+json">${json}</script>\n</head>`, "closing head tag");
  // call tracking: the control's CallTrackingMetrics block (Texas), or the state's own account, if it has one
  const ctm = st ? st.callTracking : grab(/<!-- CallTrackingMetrics -->[\s\S]*?<!-- End CallTrackingMetrics -->/);
  rep("</body>", script(p, display) + (ctm ? "\n" + ctm : "") + "\n</body>", "closing body tag");

  // nothing the rep marked may survive, and nothing may point nowhere
  for (const bad of ["VERIFY", "PLACEHOLDER", "Legal review", 'class="ph"', "../assets/", 'href="#"', "onsubmit", "hospital room", "home or hospital", "home or the hospital", "TEXAS RESULT", "highest rates per resident"])
    if (html.includes(bad)) errs.push(`still contains "${bad}"`);
  if (!html.includes('<meta name="robots" content="noindex,nofollow">')) errs.push("not noindex");
  if (st && !html.includes(`Attorney responsible for this advertisement: ${st.attorney}`)) errs.push("no responsible attorney");

  const out = `${p.dir}/index.html`;
  if (errs.length) { console.error(`${out}:\n  ` + errs.join("\n  ")); return null; }
  mkdirSync(p.dir, { recursive: true });
  writeFileSync(out, html);
  return { title, desc: decode((html.match(/<meta name="description" content="([^"]*)">/) || [, ""])[1]) };
}

function urlTable(pages) {
  const tx = slugs().map(parse).map(p => `| ${p.cityName} | ${p.cs === "car-accident" ? "Car" : "Truck"} Accident | ${BASE}${p.cs}-${p.geo}.html | ${BASE}${pageUrl("D", p.slug)} | ${BASE}${pageUrl("E", p.slug)} |`);
  const az = pages.filter(p => p.group === "AZ").map(p => p.kind === "keyword"
    ? `| ${p.areaName} | ${p.keyword.replace(/-/g, " ")} | ${BASE}${p.url} | \`${p.variant}\` |`
    : `| Sitelink | ${p.page.replace(/-/g, " ")} | ${BASE}${p.url} | \`${p.variant}\` |`);
  return `# PPC rep landers — campaign URLs

Generated by \`node generate-rep-landers.mjs\` — don't edit by hand.

## Texas: groups D and E

Each D and E page is tested against the live lander for the same city and case type (A).
Leads carry \`variant: {city}-ppc-long\` (D) or \`{city}-ppc-simple\` (E) alongside \`case_type\`.

| City | Case type | A · Control (live) | D · PPC rep, long | E · PPC rep, simple |
|---|---|---|---|---|
${tx.join("\n")}

## Arizona: one page per keyword

Calls go to ${AZ.display}; leads carry the variant below (and \`geo: az-{area}\`, or \`az\` on a sitelink).
Attorney responsible for the ads: ${AZ.attorney}. GTM container: ${AZ.gtm}.

| Area | Keyword | URL | Lead tag |
|---|---|---|---|
${az.join("\n")}
${Object.entries(STATES).map(([g, S]) => `
## ${S.name}: one page per keyword (the rep's Arizona design, drafted by state-landers.mjs)

Calls go to ${S.display}${S.phonePlaceholder ? " — **a placeholder: replace it in state-landers.mjs before the ads run**" : ""}; leads carry the
variant below (and \`geo: ${S.slug}-{area}\`, or \`${S.slug}\` on a sitelink). Attorney responsible for the ads:
${S.attorney}. GTM container: ${S.gtm}.${S.callTracking ? "" : " No call tracking yet."}

| Area | Keyword | URL | Lead tag |
|---|---|---|---|
${pages.filter(p => p.group === g).map(p => p.kind === "keyword"
    ? `| ${p.areaName} | ${p.keyword.replace(/-/g, " ")} | ${BASE}${p.url} | \`${p.variant}\` |`
    : `| Sitelink | ${p.page.replace(/-/g, " ")} | ${BASE}${p.url} | \`${p.variant}\` |`).join("\n")}
`).join("")}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pages = allPages();
  let failed = 0;
  const seen = { title: new Map(), desc: new Map() };
  for (const p of pages) {
    if (p.control && !existsSync(p.control)) { console.error(`${p.slug}: no control ${p.control}`); failed++; continue; }
    const r = build(p);
    if (!r) { failed++; continue; }
    for (const k of ["title", "desc"]) {
      if (seen[k].has(r[k])) { console.error(`${p.url} and ${seen[k].get(r[k])} share the ${k} "${r[k]}"`); failed++; }
      seen[k].set(r[k], p.url);
    }
  }
  if (failed) { console.error(`${failed} problem(s); fix them before publishing`); process.exit(1); }
  writeFileSync("CAMPAIGN-URLS-PPC-REP.md", urlTable(pages));
  const n = g => pages.filter(p => p.group === g).length;
  console.log(`built ${pages.length} PPC rep landers (Texas: ${n("D")} D + ${n("E")} E; ${Object.entries(REP_STATES).map(([g, S]) => `${S.name}: ${n(g)}`).join("; ")}); no review notes left; titles ≤${TITLE_MAX} characters and unique; CAMPAIGN-URLS-PPC-REP.md updated`);
  for (const S of Object.values(REP_STATES)) if (S.phonePlaceholder) console.warn(`NOTE: ${S.name}'s phone number ${S.display} is a placeholder; set the real one in state-landers.mjs before the ads run`);
}
