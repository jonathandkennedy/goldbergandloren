// E2E for the shared support pages (sitelink destinations).
// Verifies runtime geo/case-type/language wiring. GTM + third parties blocked.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const server = createServer(async (req, res) => {
  try {
    const body = await readFile(ROOT + "/" + decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
    res.writeHead(200, { "content-type": "text/html" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(8934, r));
const HOST = "http://localhost:8934/";

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage();
await page.route(/googletagmanager\.com|clarity\.ms|buzzfighter\.com/, r => r.abort());

let failures = 0;
const check = (label, cond) => { console.log((cond ? "PASS " : "FAIL ") + label); if (!cond) failures++; };
const PAGES = ["no-fee", "reviews", "settlements", "case-review", "maximize-compensation", "our-team"];

// 1. every page loads, has exactly one H1, and is indexable with sane metadata
const ORIGIN = "https://results.goldbergloren.com";
for (const slug of PAGES) {
  await page.goto(HOST + slug + ".html");
  const h1s = await page.$$eval("h1", n => n.map(e => e.textContent.trim()));
  const robots = await page.getAttribute('meta[name="robots"]', "content");
  const title = await page.title();
  const desc = await page.getAttribute('meta[name="description"]', "content");
  check(`${slug}: single H1 ("${h1s[0]}"), indexable, title ${title.length}ch, desc ${desc.length}ch`,
    h1s.length === 1 && h1s[0].length > 6 && title.includes("Goldberg") && robots === "index,follow" &&
    title.length <= 62 && desc.length >= 110 && desc.length <= 165);
}

// 1b. canonical is absolute, self-referencing and PARAMETER-FREE — otherwise
// ?geo/?ct/?lang would spawn ~176 indexable duplicates of every page
for (const slug of PAGES) {
  await page.goto(HOST + slug + ".html?geo=dallas-tx&ct=truck-accident&lang=es");
  const canon = await page.getAttribute('link[rel="canonical"]', "href");
  const ogUrl = await page.getAttribute('meta[property="og:url"]', "content");
  const ogImg = await page.getAttribute('meta[property="og:image"]', "content");
  check(`${slug}: canonical param-free + absolute OG (${canon})`,
    canon === `${ORIGIN}/${slug}.html` && !canon.includes("?") &&
    ogUrl === canon && ogImg.startsWith("https://"));
}
// those loads carried ?lang=es, which is persisted on purpose (see 12b) — clear
// it so the English-copy checks below aren't reading a leftover preference
await page.evaluate(() => localStorage.removeItem("gl-lang"));

// 1c. structured data parses, identifies the firm, and points at the main site
// so the subdomain reads as the SAME entity rather than a competitor
for (const slug of PAGES) {
  await page.goto(HOST + slug + ".html");
  const blocks = await page.$$eval('script[type="application/ld+json"]', n => n.map(e => e.textContent));
  let parsed;
  try { parsed = blocks.map(b => JSON.parse(b)); } catch { parsed = null; }
  const firm = parsed && parsed.find(x => x["@type"] === "LegalService");
  check(`${slug}: JSON-LD parses, LegalService sameAs the firm site`,
    !!firm && firm.sameAs.includes("https://goldbergloren.com/") &&
    firm.name.includes("Goldberg") && firm.telephone.length > 8);
  // self-serving review markup is a manual-action risk — must stay absent
  check(`${slug}: no self-serving aggregateRating/Review markup`,
    !!parsed && parsed.every(x => !x.aggregateRating && !x.review));
}

// 1d. the two named attorneys carry Person schema on the team page
await page.goto(HOST + "our-team.html");
const people = await page.$$eval('script[type="application/ld+json"]',
  n => n.map(e => JSON.parse(e.textContent)).filter(x => x["@type"] === "Person").map(x => x.name));
check(`our-team: Person schema for both partners (${people.join(", ")})`,
  people.length === 2 && people.some(n => n.includes("Goldberg")) && people.some(n => n.includes("Loren")));

// 1e. robots.txt and sitemap agree with the pages that actually exist
const robotsTxt = await (await fetch(HOST + "robots.txt")).text();
check(`robots.txt allows crawling and points at the sitemap`,
  /User-agent:\s*\*/.test(robotsTxt) && /Allow:\s*\//.test(robotsTxt) &&
  robotsTxt.includes(`${ORIGIN}/sitemap.xml`) && !/Disallow:\s*\/\s*$/m.test(robotsTxt));
const sitemap = await (await fetch(HOST + "sitemap.xml")).text();
check(`sitemap lists exactly the ${PAGES.length} indexable pages`,
  PAGES.every(sl => sitemap.includes(`${ORIGIN}/${sl}.html`)) &&
  (sitemap.match(/<loc>/g) || []).length === PAGES.length);

// 1f. the landers stay noindex — indexing 92 near-duplicate city pages is the
// doorway-page pattern Google penalises, and that decision is unchanged here
const lander = await (await fetch(HOST + "car-accident-dallas-tx.html")).text();
check("landers still carry noindex (doorway-page risk unchanged)",
  /<meta name="robots" content="noindex/.test(lander) && !sitemap.includes("car-accident-dallas-tx"));

// 2. no geo param → national number everywhere on the page
await page.goto(HOST + "no-fee.html");
const defTels = await page.$$eval("a.js-tel", n => [...new Set(n.map(a => a.getAttribute("href")))]);
const defText = await page.$$eval(".js-tel-text", n => [...new Set(n.map(e => e.textContent))]);
check(`default geo → national number (${defTels} / ${defText})`,
  defTels.length === 1 && defTels[0] === "tel:+15129603887" && defText.length === 1 && defText[0] === "(512) 960-3887");

// 3. ?geo=san-antonio-tx → San Antonio CallRail number
await page.goto(HOST + "no-fee.html?geo=san-antonio-tx");
const saTel = await page.$$eval("a.js-tel", n => [...new Set(n.map(a => a.getAttribute("href")))]);
const saText = await page.$$eval(".js-tel-text", n => [...new Set(n.map(e => e.textContent))]);
check(`?geo=san-antonio-tx → (210) 880-6076 (${saTel} / ${saText})`,
  saTel.length === 1 && saTel[0] === "tel:+12108806076" && saText[0] === "(210) 880-6076");

// 4. ?geo=fort-worth-tx → DFW CallRail number
await page.goto(HOST + "settlements.html?geo=fort-worth-tx");
check("?geo=fort-worth-tx → (214) 466-2129",
  (await page.$eval("a.js-tel", a => a.getAttribute("href"))) === "tel:+12144662129" &&
  (await page.$eval(".js-tel-text", e => e.textContent)) === "(214) 466-2129");

// 5. bogus geo falls back to the national number, never blank
await page.goto(HOST + "settlements.html?geo=%3Cscript%3E&ct=../../evil");
check("hostile geo/ct params fall back safely",
  (await page.$eval("a.js-tel", a => a.getAttribute("href"))) === "tel:+15129603887" &&
  (await page.$$eval("a.js-form-link", n => n.every(a => /^(car|truck|motorcycle|rideshare)-accident\.html\?geo=default/.test(a.getAttribute("href"))))));

// 6. ?ct= routes every return CTA at the matching lander and carries geo through
await page.goto(HOST + "case-review.html?geo=dallas-tx&ct=motorcycle-accident");
const links = await page.$$eval("a.js-form-link", n => n.map(a => a.getAttribute("href")));
check(`?ct=motorcycle-accident routes CTAs (${links[0]})`,
  links.length >= 3 && links.every(h => h.startsWith("motorcycle-accident.html?geo=dallas-tx")) &&
  links.some(h => h.endsWith("#case-form")));

// 7. return CTAs point at pages that actually exist
for (const h of links) {
  const r = await fetch(HOST + h.split("?")[0]);
  check(`CTA target exists (${h.split("?")[0]})`, r.status === 200);
  break;
}

// 8. ratings grid renders only offices with real Google ratings
await page.goto(HOST + "reviews.html");
const cards = await page.$$eval("#ratings .rcard", n => n.map(e => ({
  num: e.querySelector(".r-num").textContent, city: e.querySelector(".r-city").textContent,
  label: e.querySelector("em").textContent, pct: e.querySelector(".r-stars").style.getPropertyValue("--pct") })));
check(`ratings cards render from real data only (${cards.map(c => `${c.city} ${c.num}`).join(" | ")})`,
  cards.length === 5 && cards.every(c => /^[45]\.\d$/.test(c.num) && /^[A-Z]/.test(c.city) && /^\d[\d,]* Google reviews$/.test(c.label)));
// a 4.2 office must show 4.2 stars, never five
check(`star fill matches each rating (${cards.map(c => c.pct).join(" ")})`,
  cards.every(c => Math.abs(parseFloat(c.pct) - parseFloat(c.num) * 20) < 0.11));
// baked at build time: present in the raw HTML, so they render without JavaScript
const rawReviews = await (await fetch(HOST + "reviews.html")).text();
check("ratings are in the served HTML, not injected by JS", (rawReviews.match(/class="rcard"/g) || []).length === 5);

// 9. three real Google testimonials present and attributed
const names = await page.$$eval(".tby", n => n.map(e => e.textContent));
check(`3 attributed testimonials (${names.join(", ")})`,
  names.length === 3 && names.every(n => n.includes("Google Review")));

// 10. ES toggle swaps copy, keeps the geo phone, and survives a round trip
await page.goto(HOST + "our-team.html?geo=dallas-tx");
const enH1 = await page.textContent("h1");
await page.click("#lang-toggle");
const esH1 = await page.textContent("h1");
const esLang = await page.getAttribute("html", "lang");
const esTel = await page.$eval(".js-tel-text", e => e.textContent);
check(`ES toggle swaps H1 ("${enH1}" → "${esH1}") and sets lang=es`,
  esH1 !== enH1 && esH1.length > 5 && esLang === "es" && !/[?]/.test(esH1));
check(`ES keeps the market number (${esTel})`, esTel === "(214) 466-2129");
await page.click("#lang-toggle");
check(`EN round trip restores H1 and number`,
  (await page.textContent("h1")) === enH1 &&
  (await page.$eval(".js-tel-text", e => e.textContent)) === "(214) 466-2129" &&
  (await page.getAttribute("html", "lang")) === "en");

// 11. ?lang=es lands in Spanish directly, with the right number
await page.goto(HOST + "case-review.html?geo=san-antonio-tx&lang=es");
check("?lang=es lands in Spanish with the SA number",
  (await page.getAttribute("html", "lang")) === "es" &&
  (await page.$eval(".js-tel-text", e => e.textContent)) === "(210) 880-6076" &&
  (await page.textContent("h1")).includes("Evaluaci"));

// 12. no untranslated placeholders leak into the ES render
const esBody = await page.textContent("body");
check("no raw data-es / undefined / [object leaks in ES render",
  !/undefined|\[object|data-es=/.test(esBody));

// 12b. the choice sticks across pages (same gl-lang key the landers use),
// and an explicit ?lang=en still wins over it
await page.goto(HOST + "no-fee.html");
check("ES preference carries to the next shared page",
  (await page.getAttribute("html", "lang")) === "es");
await page.goto(HOST + "no-fee.html?lang=en");
check("?lang=en overrides the stored preference",
  (await page.getAttribute("html", "lang")) === "en" &&
  (await page.textContent("h1")) === "No Fee Unless We Win");
await page.evaluate(() => localStorage.removeItem("gl-lang"));

// 13. call clicks push a dataLayer event carrying geo + case type + page
await page.goto(HOST + "maximize-compensation.html?geo=austin-tx&ct=truck-accident");
await page.$eval("a.js-tel", a => { a.removeAttribute("href"); a.click(); });
const dl = await page.evaluate(() => (window.dataLayer || []).filter(e => e.event === "call_click"));
check(`call_click carries geo/ct/page (${JSON.stringify(dl[0] || {})})`,
  dl.length === 1 && dl[0].geo === "austin-tx" && dl[0].case_type === "truck-accident" &&
  dl[0].support_page === "maximize-compensation");

// 14. compliance copy on every page
for (const slug of PAGES) {
  await page.goto(HOST + slug + ".html");
  const foot = (await page.textContent("footer")).replace(/\s+/g, " ");
  check(`${slug}: attorney advertising + responsible attorney + fee disclosure`,
    foot.includes("Attorney Advertising") && foot.includes("George Z. Goldberg") &&
    foot.includes("court costs and case expenses may apply"));
}

// 15. results/review pages carry the prior-results disclaimer
for (const slug of ["settlements", "reviews"]) {
  await page.goto(HOST + slug + ".html");
  const main = (await page.textContent("main")).replace(/\s+/g, " ");
  check(`${slug}: prior-results disclaimer in body`, main.includes("Prior results do not guarantee"));
}

// 16. no page ships a form — they hand off to the lander's one form
for (const slug of PAGES) {
  await page.goto(HOST + slug + ".html");
  check(`${slug}: no duplicate lead form`, (await page.$$("form")).length === 0);
}

// 17. every image referenced actually resolves
await page.goto(HOST + "our-team.html");
const imgs = await page.$$eval("img", n => n.map(i => ({ src: i.getAttribute("src"), alt: i.getAttribute("alt") })));
for (const src of [...new Set(imgs.map(i => i.src))]) {
  const r = await fetch(HOST + src);
  check(`image resolves (${src})`, r.status === 200);
}
check("both partners shown with their own real photos, named in alt text",
  imgs.some(i => i.src === "img/george-goldberg.jpg" && /George/.test(i.alt)) &&
  imgs.some(i => i.src === "img/james-loren.jpg" && /James/.test(i.alt)) && !(await page.$(".mono")));
check("hero portrait loads eagerly as the LCP image",
  await page.$eval(".hero-photo img", i => i.getAttribute("fetchpriority") === "high" && i.getAttribute("loading") !== "lazy"));

// 19. self-hosted fonts: every @font-face resolves and actually loads —
// and no page reaches out to a third-party font host
await page.goto(HOST + "no-fee.html");
await page.evaluate(() => document.fonts.ready);
const fontsLoaded = await page.evaluate(() => [
  document.fonts.check("800 40px 'Playfair Display'"),
  document.fonts.check("italic 500 40px 'Playfair Display'"),
  document.fonts.check("400 17px 'DM Sans'")]);
check(`Playfair (roman + italic) and DM Sans load from fonts/ (${fontsLoaded})`, fontsLoaded.every(Boolean));
for (const slug of PAGES) {
  const html = await (await fetch(HOST + slug + ".html")).text();
  check(`${slug}: no third-party font requests`, !/fonts\.googleapis|fonts\.gstatic|use\.typekit/.test(html));
}

// 20. sticky call bar: visible on phones with the market's number, hidden on desktop
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(HOST + "settlements.html?geo=san-antonio-tx&ct=truck-accident");
check("mobile call bar visible and dials the San Antonio number",
  await page.isVisible(".mbar") &&
  (await page.getAttribute(".mbar a.js-tel", "href")) === "tel:+12108806076" &&
  (await page.getAttribute(".mbar a.js-form-link", "href")) === "truck-accident.html?geo=san-antonio-tx#case-form");
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check(`no horizontal scroll at 390px (${overflow}px overflow)`, overflow <= 0);
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto(HOST + "settlements.html");
check("call bar hidden on desktop", !(await page.isVisible(".mbar")));

// 21. geo lookup only accepts real market keys — Object internals fall back
for (const bad of ["constructor", "__proto__", "hasOwnProperty"]) {
  await page.goto(HOST + "no-fee.html?geo=" + bad);
  check(`?geo=${bad} falls back to the national number`,
    (await page.$eval("a.js-tel", a => a.getAttribute("href"))) === "tel:+15129603887");
}

// 22. Spanish reaches the new chrome too: ticker, call bar, final CTA —
// and the market number survives the swap everywhere it appears
await page.goto(HOST + "case-review.html?geo=dallas-tx&lang=es");
const esTicker = await page.textContent(".ticker li span");
const esBar = await page.textContent(".mbar-call");
const esTels = await page.$$eval(".js-tel-text", n => [...new Set(n.map(e => e.textContent))]);
const esHrefs = await page.$$eval("a.js-tel", n => [...new Set(n.map(a => a.getAttribute("href")))]);
check(`ES covers ticker ("${esTicker}") and call bar ("${esBar.trim()}")`,
  /Accidente|Propiedad|Recuperados/.test(esTicker) && /Llame/.test(esBar));
check(`ES keeps the Dallas number on every call link (${esTels} / ${esHrefs})`,
  esTels.length === 1 && esTels[0] === "(214) 466-2129" && esHrefs.length === 1 && esHrefs[0] === "tel:+12144662129");
await page.evaluate(() => localStorage.removeItem("gl-lang"));

// 23. ticker: one list for screen readers, the loop copies hidden from them
const lists = await page.$$eval(".ticker ul", n => n.map(u => u.getAttribute("aria-hidden")));
check(`ticker exposes one list, hides ${lists.length - 1} loop copies`,
  lists.length === 4 && lists[0] === null && lists.slice(1).every(a => a === "true"));

// 24. every dollar figure on every page is a sourced one. Adding a figure means
// verifying it against the firm's published results first, then adding it here.
const SOURCED = new Set(["$4,500,000", "$8,750,000", "$2,500,000", "$1,750,000", "$1,025,000",
  "$8.75 Million", "$4.5 Million", "$2.5 Million", "$1.75 Million", "$550M+", "$750,000", "$77,600", "$17,600", "$0"]);
for (const slug of PAGES) {
  await page.goto(HOST + slug + ".html");
  const text = await page.evaluate(() => document.body.innerText);
  const found = [...new Set(text.match(/\$\d[\d,.]*(?:\s?Million|M\+)?/g) || [])];
  const unsourced = found.filter(f => !SOURCED.has(f));
  check(`${slug}: only sourced dollar figures (${unsourced.length ? "UNSOURCED " + unsourced.join(", ") : found.length + " found"})`, unsourced.length === 0);
}

// 25. layout sweep: smallest phone, common phone, desktop — both languages.
// Uses a non-mobile context on purpose: mobile emulation widens the layout
// viewport to fit overflowing content, which hides exactly what this looks for
// (it once masked an 11px header overflow at 320px).
for (const w of [320, 390, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const pg = await ctx.newPage();
  await pg.route(/googletagmanager\.com|clarity\.ms|buzzfighter\.com/, r => r.abort());
  for (const lang of ["en", "es"]) {
    const problems = [];
    for (const slug of PAGES) {
      await pg.goto(`${HOST}${slug}.html?lang=${lang}&geo=san-antonio-tx`);
      await pg.evaluate(() => document.fonts.ready);
      const r = await pg.evaluate(() => {
        const W = document.documentElement.clientWidth;
        const lines = e => { const cs = getComputedStyle(e); return Math.round(e.getBoundingClientRect().height / (parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2)); };
        const off = [...document.querySelectorAll("main *, header *, .mbar, .mbar *")].filter(e => {
          const b = e.getBoundingClientRect(); return b.width && (b.right > W + 1 || b.left < -1) && !e.closest(".ticker,.badges,.hero-mark,.ph"); });
        const wrapped = [...document.querySelectorAll(".mbar a span, .live span, .hd-call-txt strong")].filter(e => e.offsetParent && lines(e) > 1);
        return { over: document.documentElement.scrollWidth - W, off: off.length, wrapped: wrapped.map(e => e.textContent) };
      });
      if (r.over > 0 || r.off || r.wrapped.length) problems.push(`${slug}(overflow ${r.over}, offscreen ${r.off}${r.wrapped.length ? ", wrapped " + r.wrapped : ""})`);
    }
    check(`${w}px ${lang.toUpperCase()}: no overflow, clipping or wrapped labels${problems.length ? " — " + problems.join("; ") : ""}`, !problems.length);
  }
  await ctx.close();
}

// 18. hub lists all six under Shared Pages
const hub = await (await fetch(HOST + "index.html")).text();
check("hub lists all six under Shared Pages — Sitelink Destinations",
  hub.includes("Sitelink Destinations") && PAGES.every(s => hub.includes(`${s}.html?geo=`)));

await browser.close();
server.close();
console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASS");
process.exit(failures ? 1 : 0);
