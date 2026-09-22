// E2E for the Austin headings-test lander (austin-car-accident-attorneys.html).
// Formspree mocked, third parties blocked. Control = car-accident-austin-tx.html.
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
await new Promise(r => server.listen(8950, r));
const HOST = "http://localhost:8950/";
const PAGE = HOST + "austin-car-accident-attorneys.html";

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage();
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type,Accept" };
const posts = [];
await page.route(/formspree\.io/, async route => {
  if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
  posts.push(JSON.parse(route.request().postData()));
  return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: '{"ok":true}' });
});
await page.route(/googletagmanager\.com|clarity\.ms|buzzfighter\.com/, r => r.abort());

let failures = 0;
const check = (label, cond) => { console.log((cond ? "PASS " : "FAIL ") + label); if (!cond) failures++; };
const outline = () => page.$$eval("h1,h2,h3,h4,h5,h6", n => n.map(e => [e.tagName.toLowerCase(), e.textContent.replace(/\s+/g, " ").trim()]));

// 1. the client's outline, exactly — every heading in the DOM, hidden ones included
const WANT = [
  ["h1", "Austin Car Accident Attorneys"],
  ["h2", "Types of Cases Our Austin Car Accident Attorneys Represent"],
  ["h3", "Red Light Accidents"], ["h3", "Car Crashes Involving Drunk Drivers"], ["h3", "Rear-End Accidents"],
  ["h3", "Rideshare Accidents"], ["h3", "Chain Reaction Auto Accidents"],
  ["h2", "Car Accident Attorneys in Austin, TX Open 24 Hours"],
  ["h2", "Why Turn to a Car Accident Attorney in Austin After a Crash"],
  ["h3", "No Fees Unless We Win"], ["h3", "Over $500 Million Won"], ["h3", "We Fight to Get You Paid While You Recover"],
  ["h3", "Award-Winning Accident Attorneys Serving Austin and All of Travis County"], ["h3", "Free Car Accident Consultations"],
  ["h2", "Schedule a Free Consultation with Our Austin Car Accident Attorneys"],
];
await page.goto(PAGE);
const got = await outline();
check(`heading outline is exactly the client's (${got.length}/${WANT.length})`,
  got.length === WANT.length && got.every(([t, x], i) => t === WANT[i][0] && x === WANT[i][1]));
for (let i = 0; i < Math.max(got.length, WANT.length); i++)
  if (JSON.stringify(got[i]) !== JSON.stringify(WANT[i])) console.log(`     #${i + 1} got ${JSON.stringify(got[i])} want ${JSON.stringify(WANT[i])}`);

// 2. the page is a separate test URL: control untouched, variant noindex, Austin number baked
const control = await (await fetch(HOST + "car-accident-austin-tx.html")).text();
check("control page carries no variant tag", !control.includes("austin-headings"));
check("variant is noindex", (await page.getAttribute('meta[name="robots"]', "content")).includes("noindex"));
const tels = await page.$$eval("a.js-tel", n => [...new Set(n.map(a => a.getAttribute("href")))]);
check(`every call link dials the Austin number (${tels})`, tels.length === 1 && tels[0] === "tel:+15129603887");

// 3. every Spanish op lands on a real element — positional drift would otherwise
// silently put Spanish text into the wrong place
const orphans = await page.evaluate(() => {
  const j = JSON.parse(document.getElementById("i18n-es").textContent);
  return j.ops.filter(o => !document.querySelectorAll(o[1])[o[2]]).map(o => o[1] + "[" + o[2] + "]");
});
check(`all Spanish ops resolve (${orphans.length ? "ORPHANS: " + orphans.join(", ") : "none orphaned"})`, orphans.length === 0);

// 4. Spanish: every heading translates, the H1 reads naturally, the number survives
await page.click("#lang-toggle");
const es = await outline();
check(`ES H1 ("${es[0][1]}")`, es[0][1] === "Abogados de Accidentes de Auto en Austin");
const untranslated = es.filter(([, x], i) => x === WANT[i][1]).map(([, x]) => x);
check(`every heading changes in Spanish (${untranslated.length ? "SAME: " + untranslated.join(" | ") : "all 15"})`, untranslated.length === 0);
check(`ES keeps 15 headings in the same levels`, es.length === 15 && es.every(([t], i) => t === WANT[i][0]));
const esNums = await page.$$eval(".js-tel-text", n => [...new Set(n.map(e => e.textContent))]);
const esTels = await page.$$eval("a.js-tel", n => [...new Set(n.map(a => a.getAttribute("href")))]);
check(`ES keeps the Austin number everywhere (${esNums} / ${esTels})`, esNums.length === 1 && esNums[0] === "(512) 960-3887" && esTels.length === 1);
const esText = await page.textContent("main");
check("no English section copy left in the new sections (ES)",
  !/Every crash is different|Crashes don't keep business hours|Your job is to heal|Don't see your crash here/.test(esText));
check("ES title gains the city", (await page.title()).startsWith("Abogados de Accidentes de Auto en Austin"));
await page.click("#lang-toggle");
const back = await outline();
check("EN round trip restores every heading", JSON.stringify(back) === JSON.stringify(WANT));
await page.evaluate(() => localStorage.removeItem("gl-lang"));

// 5. the form still converts, and tags the lead as the test variant
await page.goto(PAGE);
await page.click('.opt[data-k="when"]');
await page.click('.opt[data-k="injured"]');
await page.fill("#f-name", "Test Person");
await page.fill("#f-phone", "(512) 960-3887");
await page.check("#f-consent");
await page.click("button.submit");
await page.waitForURL(/thank-you\.html/, { timeout: 6000 });
check(`redirect tagged for GA4 (${page.url().split("?")[1]})`,
  page.url().includes("variant=austin-headings") && page.url().includes("geo=austin-tx") && page.url().includes("ct=car-accident"));
const p = posts[posts.length - 1] || {};
check(`lead payload tagged variant="${p.variant}"`, p.variant === "austin-headings");
check("lead payload core fields intact", p.phone === "5129603887" && p._subject === "GoldbergandlorenPPC" && p.case_type === "car-accident");

// 6. junk phone numbers are still refused on the variant
await page.goto(PAGE);
const before = posts.length;
await page.click('.opt[data-k="when"]');
await page.click('.opt[data-k="injured"]');
await page.fill("#f-name", "Bot");
await page.fill("#f-phone", "0000001");
await page.check("#f-consent");
await page.click("button.submit");
await page.waitForTimeout(600);
check("0000001 rejected, nothing sent", posts.length === before && await page.isVisible("#f-err"));

// 7. page_variant event for session-level segmentation
const dl = await page.evaluate(() => (window.dataLayer || []).filter(e => e.event === "page_variant"));
check("page_variant pushed to dataLayer", dl.length === 1 && dl[0].variant === "austin-headings");

// 8. sitelink anchors still land on matching content
for (const id of ["case-form", "results", "how-it-works", "attorneys", "reviews", "faq"])
  check(`#${id} anchor exists`, !!(await page.$("#" + id)));

// 9. compliance: disclaimers, sourced figures, results context for "won"
const foot = (await page.textContent("footer")).replace(/\s+/g, " ");
check("footer compliance copy intact", foot.includes("Attorney Advertising") && foot.includes("George Z. Goldberg"));
const wonBlock = await page.textContent("#results");
check('"Over $500 Million Won" block explains it as recovered + carries the disclaimer',
  wonBlock.includes("recovered $550M+") && wonBlock.includes("Prior results do not guarantee"));
const SOURCED = new Set(["$14,600,000", "$8,750,000", "$4,500,000", "$2,500,000", "$1,025,000", "$750,000",
  "$550M+", "$500 Million", "$77,600", "$17,600", "$1,000,000"]);
const text = await page.evaluate(() => document.body.innerText);
const figs = [...new Set(text.match(/\$\d[\d,.]*(?:\s?Million|M\+)?/g) || [])];
const unsourced = figs.filter(f => !SOURCED.has(f));
check(`only sourced dollar figures (${unsourced.length ? "UNSOURCED " + unsourced.join(", ") : figs.length + " found"})`, !unsourced.length);
check("unconfirmed $8.7M trucking figure is not on the variant", !text.includes("8,700,000"));

// 10. layout: no overflow at 320 / 390 / 1440 in either language (non-mobile context on purpose)
for (const w of [320, 390, 1440]) for (const lang of ["en", "es"]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const pg = await ctx.newPage();
  await pg.route(/googletagmanager\.com|clarity\.ms|buzzfighter\.com|formspree/, r => r.abort());
  await pg.goto(PAGE + "?lang=" + lang);
  const over = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`${w}px ${lang.toUpperCase()}: no horizontal overflow (${over}px)`, over <= 0);
  await ctx.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASS");
process.exit(failures ? 1 : 0);
