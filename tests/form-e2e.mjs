// E2E check of the lead form: phone validation + response-aware submit flow.
// Serves the repo statically; Formspree is mocked per-scenario and GTM blocked,
// so nothing leaves the machine and no real lead is created.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

import { fileURLToPath } from "node:url";
const ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".avif": "image/avif" };

const server = createServer(async (req, res) => {
  try {
    const path = join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
    const body = await readFile(path);
    res.writeHead(200, { "content-type": MIME[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end("nf"); }
});
await new Promise(r => server.listen(8931, r));

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const page = await browser.newPage();

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type,Accept" };
let mode = "ok"; // "ok" | "fail"
const formspreePosts = [];
await page.route(/formspree\.io/, async route => {
  const req = route.request();
  if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
  formspreePosts.push(JSON.parse(req.postData()));
  if (mode === "fail") return route.fulfill({ status: 403, headers: CORS, contentType: "application/json", body: JSON.stringify({ error: "domain not allowed" }) });
  return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify({ ok: true }) });
});
await page.route(/googletagmanager\.com|clarity\.ms|buzzfighter\.com/, route => route.abort());

let failures = 0;
const check = (label, cond) => { console.log((cond ? "PASS " : "FAIL ") + label); if (!cond) failures++; };

async function toStep3() {
  await page.goto("http://localhost:8931/car-accident-boise-id.html");
  await page.click('.opt[data-k="when"]');
  await page.click('.opt[data-k="injured"]');
}
async function fillAndSubmit(phone) {
  await page.fill("#f-name", "Test Person");
  await page.fill("#f-phone", phone);
  await page.check("#f-consent");
  await page.click("button.submit");
}

// 1. Junk numbers rejected client-side: error shown, no POST, still on step 3
for (const junk of ["0000000001", "5555555555", "1234567890", "0000001"]) {
  await toStep3();
  await fillAndSubmit(junk);
  const errText = (await page.isVisible("#f-err")) ? await page.textContent("#f-err") : "";
  check(`junk "${junk}" rejected (error shown, still on form)`, await page.isVisible("#f-phone") && /valid 10-digit/.test(errText));
}
check("no Formspree POST fired for junk numbers", formspreePosts.length === 0);

// 2. Valid number + Formspree 200 → success card, redirect, correct payload
await toStep3();
await fillAndSubmit("+1 (512) 960-3887");
await page.waitForURL(/thank-you\.html/, { timeout: 5000 });
check("valid number + 200 redirects to thank-you.html", true);
check("exactly one Formspree POST so far", formspreePosts.length === 1);
const p = formspreePosts[0] || {};
check(`payload phone normalized ("${p.phone}")`, p.phone === "5129603887");
check(`payload subject intact ("${p._subject}")`, p._subject === "GoldbergandlorenPPC");
check("payload keys intact", ["name","phone","when","injured","case_type","geo","page","submitted","_subject"].every(k => k in p));
check(`payload when carries new option ("${p.when}")`, p.when === "Just happened");

// 2b. New timing options render in EN and ES
await page.goto("http://localhost:8931/car-accident-boise-id.html");
const enOpts = await page.$$eval('.opt[data-k="when"]', els => els.map(e => e.textContent));
check(`EN when-options (${enOpts.join(" | ")})`, JSON.stringify(enOpts) === JSON.stringify(["Just happened","1–3 months ago","3–6 months ago","6+ months ago"]));
await page.click("#lang-toggle");
const esOpts = await page.$$eval('.opt[data-k="when"]', els => els.map(e => e.textContent));
check(`ES when-options (${esOpts.join(" | ")})`, JSON.stringify(esOpts) === JSON.stringify(["Acaba de pasar","Hace 1 a 3 meses","Hace 3 a 6 meses","Hace más de 6 meses"]));
await page.evaluate(() => { try { localStorage.removeItem("gl-lang"); } catch(e){} });

// 3. Valid number + Formspree 403 → stays on form, call-us error, button restored, dataLayer error event
mode = "fail";
await toStep3();
await fillAndSubmit("512-960-3887");
await page.waitForSelector("#f-err", { state: "visible", timeout: 5000 });
const failErr = await page.textContent("#f-err");
check(`failure shows call-us fallback ("${failErr.trim()}")`, /call \(512\) 960-3887 instead/i.test(failErr));
check("still on the form (no redirect)", !/thank-you/.test(page.url()) && await page.isVisible("#f-phone"));
const btn = page.locator("button.submit");
check("submit button re-enabled with original label", await btn.isEnabled() && /Free Case Review/.test(await btn.textContent()));
const dl = await page.evaluate(() => (window.dataLayer || []).filter(e => e.event === "lead_form_error"));
check(`lead_form_error pushed to dataLayer (status "${dl[0] && dl[0].error_status}")`, dl.length === 1 && dl[0].error_status === "403");
check("retry still possible: two POSTs total", formspreePosts.length === 2);

// 4. Spanish failure copy
await toStep3();
await page.click("#lang-toggle");
await fillAndSubmit("512 960 3887");
await page.waitForSelector("#f-err", { state: "visible", timeout: 5000 });
const esErr = await page.textContent("#f-err");
check(`Spanish failure copy ("${esErr.trim()}")`, /Llame al \(512\) 960-3887/.test(esErr));

// 5. Honeypot filled → fake success card, NO POST, no redirect
mode = "ok";
const before = formspreePosts.length;
await toStep3();
await page.evaluate(() => { document.querySelector('[name="company"]').value = "bot stuff"; });
await fillAndSubmit("(512) 960-3887");
await page.waitForSelector(".fstep.success", { state: "visible", timeout: 5000 });
await page.waitForTimeout(800);
check("honeypot: success card shown but nothing sent, no redirect", formspreePosts.length === before && !/thank-you/.test(page.url()));

await browser.close();
server.close();
console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASS");
process.exit(failures ? 1 : 0);
