// E2E for the keyword-insertion test landers. Formspree mocked, GTM blocked.
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
await new Promise(r => server.listen(8933, r));

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage();
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type,Accept" };
const posts = [];
await page.route(/formspree\.io/, async route => {
  if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
  posts.push(JSON.parse(route.request().postData()));
  return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: '{"ok":true}' });
});
await page.route(/googletagmanager\.com/, r => r.abort());

let failures = 0;
const check = (label, cond) => { console.log((cond ? "PASS " : "FAIL ") + label); if (!cond) failures++; };
const h1 = async () => (await page.textContent("h1")).replace(/\s+/g, " ").trim();

// 1. attorney + near me → fixed variant, city em preserved
await page.goto("http://localhost:8933/car-accident-dallas-tx-kw.html?kw=car+accident+attorney+near+me");
check(`attorney+near H1 ("${await h1()}")`, await h1() === "Dallas Car Accident Attorneys Near You");
check("city still styled em", await page.textContent("h1 em.h1-city") === "Dallas");
const subWithKw = (await page.textContent(".hero-sub")).trim();

// 2. plain lawyer keyword
await page.goto("http://localhost:8933/car-accident-dallas-tx-kw.html?kw=dallas+car+accident+lawyer");
check(`lawyer H1 ("${await h1()}")`, await h1() === "Need a Dallas Car Accident Lawyer?");

// 3. no kw → control page unchanged
await page.goto("http://localhost:8933/car-accident-dallas-tx-kw.html");
check(`no-kw control H1 ("${await h1()}")`, await h1() === "Hurt in a Dallas Car Accident?");
// copy-agnostic subhead integrity: with a kw active, the subhead may differ
// from control only by the lawyers→attorneys swap — never corrupted
const subControl = (await page.textContent(".hero-sub")).trim();
check("kw subhead intact (only lawyers→attorneys may differ)",
  subWithKw === subControl || subWithKw === subControl.replace(/\blawyers\b/, "attorneys"));

// 4. unrecognized kw → unchanged
await page.goto("http://localhost:8933/car-accident-dallas-tx-kw.html?kw=crash+help+free");
check(`unrecognized kw leaves control H1 ("${await h1()}")`, await h1() === "Hurt in a Dallas Car Accident?");

// 5. hostile kw → sanitized, fixed strings only, no injection
await page.goto("http://localhost:8933/car-accident-dallas-tx-kw.html?kw=%3Cscript%3Ealert(1)%3C%2Fscript%3E+best+lawyer+guaranteed");
check(`hostile kw yields fixed variant ("${await h1()}")`, await h1() === "Need a Dallas Car Accident Lawyer?");
const kwVal = await page.evaluate(() => window.__kw);
check(`kw sanitized to letters/spaces ("${kwVal}")`, /^[a-z ]+$/.test(kwVal) && !kwVal.includes("<"));

// 6. Fort Worth truck attorney
await page.goto("http://localhost:8933/truck-accident-fort-worth-tx-kw.html?kw=fort+worth+truck+accident+attorney");
check(`FW truck H1 ("${await h1()}")`, await h1() === "Need a Fort Worth Truck Accident Attorney?");

// 7. DFW number present on kw pages
check("kw page shows (214) 466-2129", (await page.content()).includes("tel:+12144662129"));

// 8. submit on kw page → payload carries variant + kw, redirect has variant=kw
await page.goto("http://localhost:8933/car-accident-dallas-tx-kw.html?kw=car+accident+attorney+near+me");
await page.click('.opt[data-k="when"]');
await page.click('.opt[data-k="injured"]');
await page.fill("#f-name", "Test Person");
await page.fill("#f-phone", "(512) 960-3887");
await page.check("#f-consent");
await page.click("button.submit");
await page.waitForURL(/thank-you\.html/, { timeout: 5000 });
check("redirect carries variant=kw", page.url().includes("variant=kw") && page.url().includes("geo=dallas-tx"));
const p = posts[posts.length - 1] || {};
check(`payload variant ("${p.variant}")`, p.variant === "kw-test");
check(`payload kw ("${p.kw}")`, p.kw === "car accident attorney near me");
check("payload core fields intact", p.phone === "5129603887" && p._subject === "GoldbergandlorenPPC" && p.case_type === "car-accident");

// 9. dataLayer got kw_variant event
await page.goto("http://localhost:8933/motorcycle-accident-dallas-tx-kw.html?kw=motorcycle+accident+lawyer");
check(`motorcycle H1 ("${await h1()}")`, await h1() === "Need a Dallas Motorcycle Accident Lawyer?");
const dl = await page.evaluate(() => (window.dataLayer || []).filter(e => e.event === "kw_variant"));
check("kw_variant pushed to dataLayer", dl.length === 1 && dl[0].kw === "motorcycle accident lawyer");

// 10. live pages untouched: baked dallas page has no kw script
const baked = await (await fetch("http://localhost:8933/car-accident-dallas-tx.html")).text();
check("production dallas page has no kw script or variant tag", !baked.includes("kw-test") && !baked.includes("__kw"));

await browser.close();
server.close();
console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASS");
process.exit(failures ? 1 : 0);
