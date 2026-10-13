#!/usr/bin/env node
/**
 * Groups D and E — the PPC rep's paid-search landers, made ad-ready.
 *   node generate-rep-landers.mjs
 *
 * Sources: rep-landers/long/{slug}.html and rep-landers/simple/{slug}.html, the rep's
 * "review builds" exactly as delivered on 2026-10-12 (kept out of the deployment by
 * .vercelignore). 14 Texas pages each: 12 car, 2 truck, e.g. car-accident-lawyer-dallas-tx.
 *
 *   D · long   {slug}/index.html          the rep's own URLs, e.g. /car-accident-lawyer-dallas-tx/
 *   E · simple {slug}-simple/index.html   the short form-first design, its own URLs
 *
 * Each page is tested against the live lander for the same city and case type (A, e.g.
 * car-accident-dallas-tx.html). The rep's design and copy are kept; what changes:
 *   - every yellow VERIFY / PLACEHOLDER / "Legal review" note is gone, and so is each claim
 *     the rep could not verify: the review-site badges (Avvo, Martindale, Super Lawyers,
 *     Google rating), home/hospital visits, the empty "Texas result" card, the unverified
 *     Denton County courthouse address and Prosper ER list. Claims the live landers already
 *     make (the four stats, the three client reviews, the two published results, Texas
 *     filing deadline and fault rule) stay.
 *   - the forms send leads: same Formspree inbox, same thank-you page and conversion as the
 *     live landers, tagged variant {city}-ppc-long (D) or {city}-ppc-simple (E)
 *   - the live landers' tracking: GTM, Microsoft Clarity, ClickCease
 *   - the partners' photo in the hero, and the "Ask Us About Our Rental Car" heading every
 *     lander carries, under the call buttons
 * The build fails if a note survives, a phone number differs from the control's, or a
 * removal no longer finds what it removes (the rep sent a new version: re-check by hand).
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";

const SRC = "rep-landers";
const BASE = "https://results.goldbergloren.com/";
export const GROUPS = {
  D: { dir: "long", label: "Group D · PPC rep, long", suffix: "", tag: "ppc-long" },
  E: { dir: "simple", label: "Group E · PPC rep, simple", suffix: "-simple", tag: "ppc-simple" },
};
const CITY_FIX = { "fort-worth": "Fort Worth", "san-antonio": "San Antonio", mckinney: "McKinney" };

// car-accident-lawyer-dallas-tx → { cs: "car-accident", geo: "dallas-tx", city: "dallas" }
export function parse(slug) {
  const m = slug.match(/^(car|truck)-accident-lawyer-([a-z-]+-tx)$/);
  if (!m) throw new Error(`unexpected rep slug ${slug}`);
  const geo = m[2], city = geo.replace(/-tx$/, "");
  return { slug, cs: `${m[1]}-accident`, geo, city,
    cityName: CITY_FIX[city] || city.replace(/(^|-)([a-z])/g, (_, a, b) => (a ? " " : "") + b.toUpperCase()) };
}
export const slugs = () => readdirSync(`${SRC}/long`).filter(f => f.endsWith(".html")).map(f => f.slice(0, -5)).sort();
export const pageDir = (group, slug) => slug + GROUPS[group].suffix;
export const pageUrl = (group, slug) => `${pageDir(group, slug)}/`;

const PARTNERS = `<picture><img src="/img/partners-720.webp" srcset="/img/partners-480.webp 480w, /img/partners-720.webp 720w, /img/partners-960.webp 960w" sizes="(min-width: 960px) 440px, calc(100vw - 40px)" width="960" height="624" alt="James M. Loren and George Z. Goldberg, partners of Goldberg &amp; Loren" fetchpriority="high"></picture>`;
const TAGS = `<figcaption><span class="tn"><b>James M. Loren</b><i>Senior Partner</i></span><span class="tn"><b>George Z. Goldberg</b><i>Founding Partner</i></span></figcaption>`;
const CAR_ICON = c => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${c.replace("#", "%23")}' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 17H3.5v-4.5L6 7h12l2.5 5.5V17H19'/%3E%3Cpath d='M3.5 12.5h17'/%3E%3Ccircle cx='7.5' cy='17' r='2'/%3E%3Ccircle cx='16.5' cy='17' r='2'/%3E%3Cpath d='M9.5 17h5'/%3E%3C/svg%3E")`;
const RENTAL = `<h2 class="rental">Ask Us About Our Rental Car</h2>`;

const CSS = {
  D: `
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
  E: `
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
  D: [{ id: "case-form", where: "hero", name: "n", phone: "p", when: "w", consent: "c1", injured: "inj" },
      { id: "case-form-2", where: "bottom", name: "n2", phone: "p2", consent: "c2" }],
  E: [{ id: "case-form", where: "hero", pre: "case-form-" }, { id: "case-form-2", where: "bottom", pre: "case-form-2-" }],
};

function script(group, p, phoneDisplay) {
  const variant = `${p.city}-${GROUPS[group].tag}`;
  return `<script>
(function(){
  "use strict";
  // leads go where the live landers' go; the thank-you page fires the conversion
  var ENDPOINT = "https://formspree.io/f/meajzepz", CT = "${p.cs}", GEO = "${p.geo}", VARIANT = "${variant}", PHONE = "${phoneDisplay}";
  var FORMS = ${JSON.stringify(FORMS[group])};
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

function build(group, p) {
  const control = `${p.cs}-${p.geo}.html`;
  const ctl = readFileSync(control, "utf8");
  let html = readFileSync(`${SRC}/${GROUPS[group].dir}/${p.slug}.html`, "utf8");
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
    if (c !== n) errs.push(`expected ${n} × ${what}, removed ${c}`);
  };
  const grab = (re, s = ctl) => (s.match(re) || [])[0] || (errs.push(`control ${control}: missing ${re}`), "");

  // the control's tracking, verbatim
  const trackHead = [/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/, /<!-- Microsoft Clarity -->[\s\S]*?<!-- End Microsoft Clarity -->/,
    /<!-- ClickCease\.com tracking-->[\s\S]*?<!-- ClickCease\.com tracking-->/].map(re => grab(re)).join("\n");
  const trackBody = grab(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End ClickCease\.com tracking \(noscript\) -->/);
  const ctlTel = (ctl.match(/class="btn btn-teal cta-call js-tel" href="tel:(\+\d+)"/) || [])[1];
  const ctlDisplay = (ctl.match(/<span class="js-tel-text">([^<]+)<\/span>/) || [])[1];
  const tels = [...new Set([...html.matchAll(/href="tel:(\+?\d+)"/g)].map(m => m[1]))];
  if (!ctlTel || tels.length !== 1 || tels[0] !== ctlTel) errs.push(`phone ${tels} differs from the control's ${ctlTel}`);

  // the rep's review scaffolding
  rep(/<!-- (?:Generated review build|Simple form-first variant)[^>]*-->\n?/, "", "review-build comment");
  rep(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/, "", "JSON-LD block (noindex page; its FAQ text carried the notes)");
  rep('<meta charset="utf-8">', '<meta charset="utf-8">\n' + trackHead, "charset meta");
  rep(/<body>\n?/, "<body>\n" + trackBody + "\n", "body tag");

  // claims the rep flagged as unverified
  rep(/(by phone, video,) or (?:in person )?at home or the hospital/, "by phone or video", "home/hospital visit claim", "+");
  if (group === "D") {
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
    removeEl('<div class="badges"><span class="ph">', "badge/stat note");
  }
  // every remaining note, then the empty paragraphs they leave
  html = html.replace(/ ?<span class="ph"[^>]*>[^<]*<\/span>/g, "").replace(/<p(?: class="disc")?>\s*<\/p>\n?/g, "");

  // the partners' photo, and the rental-car heading under the call buttons
  if (group === "D") {
    const f = html.indexOf('<form class="card" id="case-form"'); const e = f >= 0 ? elementEnd(html, f) : -1;
    if (f < 0) errs.push("hero form not found");
    else html = html.slice(0, f) + `<div class="hero-side">\n <figure class="hero-team">${PARTNERS}${TAGS}</figure>\n ` + html.slice(f, e) + "\n </div>" + html.slice(e);
    rep(/(<div class="micro">[^<]*<\/div>)/, "$1\n  " + RENTAL, "line under the call buttons");
  } else {
    rep(/<img src="\.\.\/assets\/george-goldberg\.jpg"[^>]*>/, `<figure class="hero-team">${PARTNERS}${TAGS}</figure>`, "hero headshot");
    rep(/(<ul class="checks">[\s\S]*?<\/ul>)/, "$1\n    " + RENTAL, "hero checklist");
    rep('="../assets/gl-logo.svg"', '="/img/gl-logo.svg"', "logo (preload, header, footer)", 3);
    rep(new RegExp(`(<link rel="canonical" href="${BASE}${p.slug})/"`), `$1-simple/"`, "canonical");
  }
  rep("</style>", CSS[group] + "</style>", "closing style tag");

  // forms: real ids, consent where the design has a checkbox, a honeypot and an error line
  rep(/ onsubmit="return false"/, "", "inert form handler", 2);
  if (group === "D") {
    rep('<form class="card">', '<form class="card" id="case-form-2" aria-labelledby="fh2">', "bottom form");
    rep("<h2>Free case review</h2>", '<h2 id="fh2">Free case review</h2>', "bottom form title");
    html = html.replace(/<label class="opt"><input type="radio" name="inj"(?: checked)?> ([^<]+)<\/label>/g, (_, t) => `<label class="opt"><input type="radio" name="inj" value="${t.trim()}"> ${t}</label>`);
    rep('<label class="consent"><input type="checkbox">', '<label class="consent"><input type="checkbox" id="c1">', "hero consent box");
    const consent = (html.match(/<label class="consent">[\s\S]*?<\/label>/) || [""])[0].replace('id="c1"', 'id="c2"');
    rep(/(<div class="fld"><label for="p2">[\s\S]*?<\/div>)/, "$1\n  " + consent, "bottom form phone field");
  }
  rep(/(\n\s*<button class="btn [^"]*" type="submit">)/, '\n  <input class="hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="ferr" role="alert" hidden></p>$1', "submit buttons", 2);
  rep("</body>", script(group, p, ctlDisplay) + "\n</body>", "closing body tag");

  // nothing the rep marked may survive, and nothing may point nowhere
  for (const bad of ["VERIFY", "PLACEHOLDER", "Legal review", 'class="ph"', "../assets/", 'href="#"', "onsubmit", "hospital room", "at home or the hospital", "TEXAS RESULT"])
    if (html.includes(bad)) errs.push(`still contains "${bad}"`);
  if (!html.includes('<meta name="robots" content="noindex,nofollow">')) errs.push("not noindex");

  const out = `${pageDir(group, p.slug)}/index.html`;
  if (errs.length) { console.error(`${out}:\n  ` + errs.join("\n  ")); return false; }
  mkdirSync(pageDir(group, p.slug), { recursive: true });
  writeFileSync(out, html);
  return true;
}

function urlTable() {
  const rows = slugs().map(parse).map(p => `| ${p.cityName} | ${p.cs === "car-accident" ? "Car" : "Truck"} Accident | ${BASE}${p.cs}-${p.geo}.html | ${BASE}${pageUrl("D", p.slug)} | ${BASE}${pageUrl("E", p.slug)} |`);
  return `# PPC rep landers (groups D and E) — campaign URLs

Generated by \`node generate-rep-landers.mjs\` — don't edit by hand. Each D and E page is
tested against the live lander for the same city and case type (A). Leads carry
\`variant: {city}-ppc-long\` (D) or \`{city}-ppc-simple\` (E) alongside \`case_type\`.

| City | Case type | A · Control (live) | D · PPC rep, long | E · PPC rep, simple |
|---|---|---|---|---|
${rows.join("\n")}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let built = 0, failed = 0;
  for (const slug of slugs()) for (const g of ["D", "E"]) {
    const p = parse(slug);
    if (!existsSync(`${p.cs}-${p.geo}.html`)) { console.error(`${slug}: no control ${p.cs}-${p.geo}.html`); failed++; continue; }
    build(g, p) ? built++ : failed++;
  }
  if (failed) { console.error(`${failed} page(s) not built`); process.exit(1); }
  writeFileSync("CAMPAIGN-URLS-PPC-REP.md", urlTable());
  console.log(`built ${built} PPC rep landers (${slugs().length} pages × groups D and E); no review notes left; CAMPAIGN-URLS-PPC-REP.md updated`);
}
