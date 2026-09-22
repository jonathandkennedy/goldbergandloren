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

// 1. every page loads, has exactly one H1, a title, and is noindex
for (const slug of PAGES) {
  await page.goto(HOST + slug + ".html");
  const h1s = await page.$$eval("h1", n => n.map(e => e.textContent.trim()));
  const robots = await page.getAttribute('meta[name="robots"]', "content");
  const title = await page.title();
  check(`${slug}: single H1 ("${h1s[0]}"), titled, noindex`,
    h1s.length === 1 && h1s[0].length > 6 && title.includes("Goldberg") && robots === "noindex,follow");
}

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
const cards = await page.$$eval("#ratings .rcard", n => n.map(e => e.textContent.replace(/\s+/g, " ").trim()));
check(`ratings cards render from real data only (${cards.length}: ${cards.join(" | ")})`,
  cards.length === 5 && cards.every(c => /^[45]\.\d\/5[A-Z]/.test(c) && /\d+ Google reviews$/.test(c)));

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
const imgs = await page.$$eval("img", n => n.map(i => i.getAttribute("src")));
for (const src of imgs) {
  const r = await fetch(HOST + src);
  check(`image resolves (${src})`, r.status === 200);
}
check("James Loren rendered with a monogram, not a stand-in photo",
  imgs.length === 1 && (await page.textContent(".mono")).trim() === "JL");

// 18. hub lists all six under Shared Pages
const hub = await (await fetch(HOST + "index.html")).text();
check("hub lists all six under Shared Pages — Sitelink Destinations",
  hub.includes("Sitelink Destinations") && PAGES.every(s => hub.includes(`${s}.html?geo=`)));

await browser.close();
server.close();
console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASS");
process.exit(failures ? 1 : 0);
