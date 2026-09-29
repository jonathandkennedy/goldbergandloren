// E2E for the NEW TAGs landers — {city}-{case}-attorneys.html, every market × case type.
// Each is checked against its control ({case}-{geo}.html) and against the client's
// outline, independently of the generator's own tables. Formspree mocked, third parties blocked.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const server = createServer(async (req, res) => {
  try {
    const body = await readFile(ROOT + "/" + decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, ""));
    res.writeHead(200, { "content-type": "text/html" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(8951, r));
const HOST = "http://localhost:8951/";

// ---- the spec
const CASES = {
  "car-accident": { label: "Car Accident", es: "Auto", h3: ["Red Light Accidents", "Car Crashes Involving Drunk Drivers",
    "Rear-End Accidents", "Rideshare Accidents", "Chain Reaction Auto Accidents"] },
  "truck-accident": { label: "Truck Accident", es: "Camión", h3: ["Jackknife Accidents", "Underride Accidents",
    "Rollover Truck Accidents", "Wide-Turn and Blind-Spot Accidents", "Accidents Involving Fatigued Truck Drivers"] },
  "motorcycle-accident": { label: "Motorcycle Accident", es: "Motocicleta", h3: ["Left-Turn Motorcycle Accidents",
    "Lane-Change and Blind-Spot Accidents", "Rear-End Motorcycle Accidents", "Road Hazard Accidents", "Hit-and-Run Motorcycle Accidents"] },
  "rideshare-accident": { label: "Rideshare Accident", es: "Uber y Lyft", h3: ["Uber and Lyft Passenger Injuries",
    "Accidents Caused by Rideshare Drivers", "Pedestrian and Cyclist Rideshare Accidents", "Rideshare Drivers Injured by Other Drivers",
    "Pick-Up and Drop-Off Accidents"] },
};
// "…Serving {City} and All of {area}"
const AREA = {
  "portland-or": "Multnomah County", "los-angeles-ca": "Los Angeles County", "las-vegas-nv": "Clark County",
  "fresno-ca": "Fresno County", "boise-id": "Ada County", "fargo-nd": "Cass County", "midland-tx": "Midland County",
  "austin-tx": "Travis County", "san-antonio-tx": "Bexar County", "dallas-tx": "Dallas County",
  "downtown-dallas-tx": "Dallas County", "arlington-tx": "Tarrant County", "dallas-fort-worth-tx": "North Texas",
  "fort-worth-tx": "Tarrant County", "grapevine-tx": "Tarrant County", "rockwall-tx": "Rockwall County",
  "frisco-tx": "Collin County", "plano-tx": "Collin County", "celina-tx": "Collin County", "prosper-tx": "Collin County",
  "mckinney-tx": "Collin County", "plantation-fl": "Broward County",
};
// what the copy says about each state's law — dram: phrase the drunk-driver card must carry
const LAW = {
  tx: { name: "Texas", es: "Texas", years: "two", fault: "not more than 50%", dui: "DWI", dram: "Texas's dram shop law", rs: "Texas law requires $1,000,000" },
  ca: { name: "California", es: "California", years: "two", fault: "even if you were mostly at fault", dui: "DUI", dram: "uninsured or underinsured motorist coverage", rs: "Uber and Lyft keep at least $1,000,000" },
  nv: { name: "Nevada", es: "Nevada", years: "two", fault: "not more than 50%", dui: "DUI", dram: "uninsured or underinsured motorist coverage", rs: "Uber and Lyft keep at least $1,000,000" },
  or: { name: "Oregon", es: "Oregón", years: "two", fault: "not more than 50%", dui: "DUI", dram: "visibly intoxicated", rs: "Uber and Lyft keep at least $1,000,000" },
  id: { name: "Idaho", es: "Idaho", years: "two", fault: "less than 50%", dui: "DUI", dram: "obviously intoxicated", rs: "Uber and Lyft keep at least $1,000,000" },
  nd: { name: "North Dakota", es: "Dakota del Norte", years: "six", fault: "less than 50%", dui: "DUI", dram: "knowingly kept serving", rs: "Uber and Lyft keep at least $1,000,000" },
  fl: { name: "Florida", es: "Florida", years: "two", fault: "not more than 50%", dui: "DUI", dram: "uninsured or underinsured motorist coverage", rs: "Uber and Lyft keep at least $1,000,000" },
};
const SOURCED = new Set(["$14,600,000", "$8,750,000", "$4,500,000", "$2,500,000", "$1,025,000", "$750,000",
  "$550M+", "$500 Million", "$77,600", "$17,600", "$1,000,000"]);

const GEOS = JSON.parse(readFileSync(ROOT + "/car-accident.html", "utf8")
  .match(/<script type="application\/json" id="geo-data">([\s\S]*?)<\/script>/)[1]);
const geoList = Object.keys(GEOS).filter(k => k !== "default");
const short = geo => geo.replace(/-[a-z]{2}$/, "");
const PAGES = geoList.flatMap(geo => Object.keys(CASES).map(cs => ({ geo, cs, file: `${short(geo)}-${cs}-attorneys.html`, control: `${cs}-${geo}.html` })));
const cities = geoList.map(g => GEOS[g].city);

// ---- aggregate results: one line per check, listing the pages that fail it
const results = new Map();
const expect = (label, file, ok, detail = "") => {
  const r = results.get(label) || { n: 0, bad: [] };
  r.n++; if (!ok) r.bad.push(detail ? `${file}: ${detail}` : file);
  results.set(label, r);
};

// ---- static: files exist, controls untouched, lead tagging wired, docs and hub list every page
const hub = readFileSync(ROOT + "/index.html", "utf8");
const urlDoc = readFileSync(ROOT + "/CAMPAIGN-URLS-NEW-TAGS.md", "utf8");
for (const p of PAGES) {
  const exists = existsSync(`${ROOT}/${p.file}`);
  expect("page exists for every market × case type", p.file, exists);
  if (!exists) continue;
  const html = readFileSync(`${ROOT}/${p.file}`, "utf8");
  const ctl = readFileSync(`${ROOT}/${p.control}`, "utf8");
  const tag = `${short(p.geo)}-headings`;
  expect("control carries no variant tag", p.control, !/payload\.variant|page_variant|-headings/.test(ctl));
  expect("lead payload, thank-you URL and dataLayer carry the variant tag", p.file,
    html.includes(`payload.variant = "${tag}";`) && html.includes(`"&ct=${p.cs}&variant=${tag}"`) && html.includes(`{event:"page_variant",variant:"${tag}"}`));
  const gtm = s => [...new Set(s.match(/GTM-[A-Z0-9]+/g) || [])].join(",");
  expect("same GTM container as the control", p.file, gtm(html) === gtm(ctl), `${gtm(html)} vs ${gtm(ctl)}`);
  expect("hub links the page under NEW TAGs Landers", p.file, hub.split("<h2>NEW TAGs Landers</h2>")[1]?.includes(`href="${p.file}"`));
  expect("CAMPAIGN-URLS-NEW-TAGS.md pairs it with its control", p.file,
    urlDoc.includes(`| https://results.goldbergloren.com/${p.control} | https://results.goldbergloren.com/${p.file} | \`${tag}\` |`));
}
const hubLinks = [...hub.matchAll(/href="([^"#?]+)/g)].map(m => m[1]);
const dead = hubLinks.filter(f => !existsSync(`${ROOT}/${f}`));
expect("every hub link resolves", "index.html", dead.length === 0, dead.join(", "));

// ---- browser
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type,Accept" };
const posts = [];
const newCtx = async width => {
  // non-mobile on purpose: mobile emulation widens the layout viewport and hides overflow
  const ctx = await browser.newContext({ viewport: { width, height: 800 } });
  await ctx.route(/formspree\.io/, async route => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    posts.push(JSON.parse(route.request().postData()));
    return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: '{"ok":true}' });
  });
  await ctx.route(/googletagmanager\.com|clarity\.ms|buzzfighter\.com/, r => r.abort());
  return ctx;
};
const snapshot = pg => pg.evaluate(() => {
  const clean = s => s.replace(/\s+/g, " ").trim();
  const body = document.body.cloneNode(true);
  body.querySelectorAll("script,style,noscript").forEach(e => e.remove());
  const j = JSON.parse(document.getElementById("i18n-es").textContent);
  return {
    outline: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(e => [e.tagName.toLowerCase(), clean(e.textContent)]),
    ah: Object.fromEntries([...document.querySelectorAll('[id^="ah"]')].map(e => [e.id, clean(e.textContent)])),
    orphans: j.ops.filter(o => !document.querySelectorAll(o[1])[o[2]]).map(o => `${o[1]}[${o[2]}]`),
    tels: [...new Set([...document.querySelectorAll("a.js-tel")].map(a => a.getAttribute("href")))],
    nums: [...new Set([...document.querySelectorAll(".js-tel-text")].map(e => e.textContent))],
    over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    text: clean(body.textContent),
    robots: document.querySelector('meta[name="robots"]')?.content || "",
    missingAnchors: ["case-form", "results", "how-it-works", "attorneys", "reviews", "faq"].filter(id => !document.getElementById(id)),
    dl: (window.dataLayer || []).filter(e => e.event === "page_variant").map(e => e.variant),
    sol: document.querySelector('[data-geo="sol"]')?.textContent || "",
    note: document.querySelector(".o24-note")?.textContent || "",
    foot: clean(document.querySelector("footer")?.textContent || ""),
    title: document.title,
  };
});

// every page, EN then ES, at 320px
const ctx = await newCtx(320);
const pg = await ctx.newPage();
const t0 = Date.now();
for (const p of PAGES) {
  const { geo, cs, file, control } = p;
  const C = CASES[cs], g = GEOS[geo], st = geo.slice(-2), law = LAW[st], city = g.city;
  const WANT = [
    ["h1", `${city} ${C.label} Attorneys`],
    ["h2", `Types of Cases Our ${city} ${C.label} Attorneys Represent`],
    ...C.h3.map(h => ["h3", h]),
    ["h2", `${C.label} Attorneys in ${city}, ${st.toUpperCase()} Open 24 Hours`],
    ["h2", `Why Turn to a ${C.label} Attorney in ${city} After a Crash`],
    ["h3", "No Fees Unless We Win"], ["h3", "Over $500 Million Won"], ["h3", "We Fight to Get You Paid While You Recover"],
    ["h3", `Award-Winning Accident Attorneys Serving ${city} and All of ${AREA[geo]}`], ["h3", `Free ${C.label} Consultations`],
    ["h2", `Schedule a Free Consultation with Our ${city} ${C.label} Attorneys`],
  ];
  const ctlHtml = readFileSync(`${ROOT}/${control}`, "utf8");
  const ctlTel = ctlHtml.match(/class="btn btn-teal cta-call js-tel" href="(tel:\+\d+)"/)[1];
  const ctlNum = ctlHtml.match(/<span class="js-tel-text">([^<]+)<\/span>/)[1];

  // EN
  await pg.goto(HOST + file + "?lang=en");
  const en = await pg.evaluate(() => 0).then(() => snapshot(pg));
  const diff = en.outline.map((h, i) => JSON.stringify(h) === JSON.stringify(WANT[i]) ? null : `#${i + 1} ${JSON.stringify(h)}`).filter(Boolean);
  expect("EN outline is exactly the client's, generalised", file, en.outline.length === WANT.length && !diff.length,
    `${en.outline.length}/${WANT.length} ${diff.slice(0, 2).join(" ")}`);
  expect("title leads with the H1", file, en.title.startsWith(`${city} ${C.label} Attorneys |`), en.title);
  expect("noindex", file, en.robots.includes("noindex"), en.robots);
  expect("every call link dials the control's number", file, en.tels.length === 1 && en.tels[0] === ctlTel && en.nums.length === 1 && en.nums[0] === ctlNum,
    `${en.tels} ${en.nums} vs ${ctlTel} ${ctlNum}`);
  expect("every Spanish op lands on an element", file, !en.orphans.length, en.orphans.join(", "));
  expect("sitelink anchors exist", file, !en.missingAnchors.length, en.missingAnchors.join(", "));
  expect("page_variant pushed once", file, en.dl.length === 1 && en.dl[0] === `${short(geo)}-headings`, JSON.stringify(en.dl));
  expect("footer compliance copy intact", file, en.foot.includes("Attorney Advertising") && en.foot.includes("George Z. Goldberg"));
  const figs = [...new Set(en.text.match(/\$\d[\d,.]*(?:\s?Million|M\+)?/g) || [])].map(f => f.replace(/[.,]$/, ""));
  const unsourced = figs.filter(f => !SOURCED.has(f));
  expect("only sourced dollar figures (hidden text included)", file, !unsourced.length, unsourced.join(", "));
  expect("no unconfirmed $8.7M trucking figure", file, !/8,700,000|\$8\.7M/.test(en.text));
  expect('"Over $500 Million Won" explained as recovered, with the disclaimer', file,
    en.text.includes("recovered $550M+") && en.text.includes("Prior results do not guarantee"));

  // state law, stated the same way everywhere on the page
  const ahEn = Object.values(en.ah).join(" ");
  expect("filing window matches the page's own FAQ answer", file,
    en.note.includes(`In ${law.name} you generally have ${law.years} years`) && en.sol.includes(`${law.years} years`), `${en.note} / ${en.sol}`);
  expect("partial-fault FAQ states the state's rule", file, ahEn.includes(`In ${law.name} you can recover`) && ahEn.includes(law.fault));
  if (cs === "car-accident") {
    expect("car: drunk-driver card uses the state's term and liability rule", file,
      ahEn.includes(`A criminal ${law.dui} case`) && ahEn.includes(law.dram) && (law.dram.includes("motorist") ? !ahEn.includes("a bar or restaurant") : true));
    expect("car: chain-reaction card states the state's fault rule", file,
      ahEn.includes(`${law.name} divides fault by percentage`) || ahEn.includes(`${law.name} uses pure comparative fault`));
  }
  if (cs === "car-accident" || cs === "rideshare-accident")
    expect("rideshare coverage stated for the state", file, ahEn.includes(law.rs));

  // generator-written copy never mentions another state or market
  const others = Object.values(LAW).filter(l => l !== law);
  const strayState = others.filter(l => ahEn.includes(l.name)).map(l => l.name);
  expect("EN copy names no other state", file, !strayState.length, strayState.join(", "));
  const ahEnPlain = ahEn.replace(/Dallas North Tollway/g, "");
  const strayCity = cities.filter(c => c !== city && !city.includes(c) && ahEnPlain.includes(c));
  expect("EN copy names no other market", file, !strayCity.length, strayCity.join(", "));
  expect("320px EN: no horizontal overflow", file, en.over <= 0, `${en.over}px`);

  // ES
  await pg.goto(HOST + file + "?lang=es");
  const es = await snapshot(pg);
  const esH1 = `Abogados de Accidentes de ${C.es}${g.h1city_es}`;
  expect("ES H1 reads naturally", file, es.outline[0]?.[1] === esH1, `${es.outline[0]?.[1]} vs ${esH1}`);
  // the landers' shared runtime inserts the English city name ("en Los Angeles"), controls included
  expect("ES title gains the city", file, es.title.startsWith(`Abogados de Accidentes de ${C.es} en ${city} |`), es.title);
  expect("ES keeps every heading at the same level", file, es.outline.length === WANT.length && es.outline.every(([t], i) => t === WANT[i][0]));
  const sameHead = es.outline.filter(([, x], i) => x === WANT[i]?.[1]).map(([, x]) => x);
  expect("every heading translates", file, !sameHead.length, sameHead.join(" | "));
  const sameAh = Object.keys(en.ah).filter(id => es.ah[id] === en.ah[id]);
  expect("every new block translates (no English left)", file, !sameAh.length, sameAh.map(id => `#${id} "${en.ah[id].slice(0, 40)}"`).join(", "));
  expect("ES keeps the control's number everywhere", file, es.nums.length === 1 && es.nums[0] === ctlNum && es.tels.length === 1 && es.tels[0] === ctlTel,
    `${es.nums} ${es.tels}`);
  const ahEs = Object.values(es.ah).join(" ");
  expect("ES filing window and state name", file, ahEs.includes(`En ${law.es} generalmente tiene ${law.years === "six" ? "seis" : "dos"} años`));
  const strayEs = others.filter(l => ahEs.includes(l.es)).map(l => l.es);
  expect("ES copy names no other state", file, !strayEs.length, strayEs.join(", "));
  expect("320px ES: no horizontal overflow", file, es.over <= 0, `${es.over}px`);
}
const secs = ((Date.now() - t0) / 1000).toFixed(0);
await ctx.close();

// a sample, deeper: language round trip, 390/1440 layout, real submissions
const SAMPLE = ["austin-tx:car-accident", "dallas-tx:truck-accident", "boise-id:motorcycle-accident", "plantation-fl:rideshare-accident",
  "dallas-fort-worth-tx:rideshare-accident", "fargo-nd:truck-accident", "los-angeles-ca:car-accident", "downtown-dallas-tx:motorcycle-accident"]
  .map(k => PAGES.find(p => `${p.geo}:${p.cs}` === k));
for (const w of [390, 1440]) {
  const c = await newCtx(w);
  const pp = await c.newPage();
  for (const p of SAMPLE) for (const lang of ["en", "es"]) {
    await pp.goto(`${HOST}${p.file}?lang=${lang}`);
    const over = await pp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(`${w}px EN/ES: no horizontal overflow (sample)`, `${p.file} ${lang}`, over <= 0, `${over}px`);
  }
  await c.close();
}
const fc = await newCtx(390);
const fp = await fc.newPage();
for (const p of SAMPLE) {
  // EN → ES → EN restores every heading
  await fp.goto(`${HOST}${p.file}?lang=en`);
  const before = await snapshot(fp);
  await fp.click("#lang-toggle");
  await fp.click("#lang-toggle");
  const after = await snapshot(fp);
  expect("toggle ES and back restores the outline (sample)", p.file, JSON.stringify(after.outline) === JSON.stringify(before.outline));
  await fp.evaluate(() => localStorage.removeItem("gl-lang"));

  // the form converts and tags the lead
  await fp.goto(`${HOST}${p.file}?lang=en`);
  const n = posts.length;
  await fp.click('.opt[data-k="when"]');
  await fp.click('.opt[data-k="injured"]');
  await fp.fill("#f-name", "Test Person");
  await fp.fill("#f-phone", "(512) 555-0142");
  await fp.check("#f-consent");
  await fp.click("button.submit");
  await fp.waitForURL(/thank-you\.html/, { timeout: 6000 }).catch(() => {});
  const tag = `${short(p.geo)}-headings`;
  const q = fp.url().split("?")[1] || "";
  expect("submission redirects with geo, ct and variant (sample)", p.file,
    fp.url().includes("/thank-you.html") && q.includes(`geo=${p.geo}`) && q.includes(`ct=${p.cs}`) && q.includes(`variant=${tag}`), q);
  const lead = posts.length === n + 1 ? posts[posts.length - 1] : {};
  expect("lead payload carries variant and case type (sample)", p.file,
    lead.variant === tag && lead.case_type === p.cs && lead.phone === "5125550142" && lead._subject === "GoldbergandlorenPPC", JSON.stringify(lead).slice(0, 160));
}
// junk numbers are still refused
await fp.goto(`${HOST}${SAMPLE[1].file}?lang=en`);
const n0 = posts.length;
await fp.click('.opt[data-k="when"]');
await fp.click('.opt[data-k="injured"]');
await fp.fill("#f-name", "Bot");
await fp.fill("#f-phone", "0000001");
await fp.check("#f-consent");
await fp.click("button.submit");
await fp.waitForTimeout(600);
expect("0000001 rejected, nothing sent", SAMPLE[1].file, posts.length === n0 && await fp.isVisible("#f-err"));
await fc.close();

await browser.close();
server.close();

let failures = 0;
for (const [label, r] of results) {
  const ok = !r.bad.length;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"} ${label} (${r.n - r.bad.length}/${r.n})`);
  for (const b of r.bad.slice(0, 6)) console.log(`     ${b}`);
  if (r.bad.length > 6) console.log(`     …and ${r.bad.length - 6} more`);
}
console.log(`\n${PAGES.length} pages, EN + ES, in ${secs}s`);
console.log(failures ? `${failures} FAILING CHECK(S)` : "ALL PASS");
process.exit(failures ? 1 : 0);
