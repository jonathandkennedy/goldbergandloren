// E2E for the NEW TAGs landers, every market × case type, in both test groups:
//   B  {city}-{case}-attorneys.html        the client's heading outline
//   C  {city}-{case}-attorneys-photo.html  B plus the partners' photo, nothing else
// Each page is checked against its control ({case}-{geo}.html, group A) and against the
// client's outline, independently of the generator's own tables. Formspree mocked,
// third parties blocked.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PHOTO_CSS, PHOTO_FIGURE, PHOTO_OPS } from "../generate-tag-landers.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
const TYPES = { webp: "image/webp", jpg: "image/jpeg", png: "image/png", woff2: "font/woff2" };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
  try {
    const body = await readFile(ROOT + "/" + path);
    res.writeHead(200, { "content-type": TYPES[path.split(".").pop()] || "text/html" });
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
const PARTNERS = { tp1: ["James M. Loren", "Senior Partner", "Socio Sénior"], tp2: ["George Z. Goldberg", "Founding Partner", "Socio Fundador"] };

const GEOS = JSON.parse(readFileSync(ROOT + "/car-accident.html", "utf8")
  .match(/<script type="application\/json" id="geo-data">([\s\S]*?)<\/script>/)[1]);
const geoList = Object.keys(GEOS).filter(k => k !== "default");
const short = geo => geo.replace(/-[a-z]{2}$/, "");
const PAGES = geoList.flatMap(geo => Object.keys(CASES).flatMap(cs => [
  { group: "B", geo, cs, file: `${short(geo)}-${cs}-attorneys.html`, tag: `${short(geo)}-headings` },
  { group: "C", geo, cs, file: `${short(geo)}-${cs}-attorneys-photo.html`, tag: `${short(geo)}-headings-photo` },
].map(p => ({ ...p, control: `${cs}-${geo}.html` }))));
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
const hubTags = hub.split("<h2>NEW TAGs Landers</h2>")[1]?.split("</section>")[0] || "";
const urlDoc = readFileSync(ROOT + "/CAMPAIGN-URLS-NEW-TAGS.md", "utf8");
const BASE = "https://results.goldbergloren.com/";
const photoOpsJson = JSON.stringify(PHOTO_OPS).slice(1, -1);
for (const p of PAGES) {
  const exists = existsSync(`${ROOT}/${p.file}`);
  expect("page exists for every market × case type × group", p.file, exists);
  if (!exists) continue;
  const html = readFileSync(`${ROOT}/${p.file}`, "utf8");
  const ctl = readFileSync(`${ROOT}/${p.control}`, "utf8");
  expect("control carries no variant tag", p.control, !/payload\.variant|page_variant|-headings/.test(ctl));
  expect("lead payload, thank-you URL and dataLayer carry the group's tag", p.file,
    html.includes(`payload.variant = "${p.tag}";`) && html.includes(`"&ct=${p.cs}&variant=${p.tag}"`) && html.includes(`{event:"page_variant",variant:"${p.tag}"}`));
  const gtm = s => [...new Set(s.match(/GTM-[A-Z0-9]+/g) || [])].join(",");
  expect("same GTM container as the control", p.file, gtm(html) === gtm(ctl), `${gtm(html)} vs ${gtm(ctl)}`);
  expect("hub links the page under NEW TAGs Landers", p.file, hubTags.includes(`href="${p.file}"`));
  if (p.group === "B") {
    expect("CAMPAIGN-URLS-NEW-TAGS.md lists its A, B and C URLs", p.file,
      urlDoc.includes(`| ${BASE}${p.control} | ${BASE}${p.file} | ${BASE}${p.file.replace(/\.html$/, "-photo.html")} |`));
    expect("B carries no photo", p.file, !html.includes("hero-team") && !html.includes("partners-"));
  } else {
    // C must be B plus the photo block and nothing else: strip it, rename the tag, and the bytes must match
    const b = readFileSync(`${ROOT}/${p.file.replace("-photo.html", ".html")}`, "utf8");
    const stripped = html.replace(PHOTO_CSS, "").replace(PHOTO_FIGURE, "").replace("," + photoOpsJson + "]", "]")
      .replaceAll(`${p.tag}"`, `${p.tag.replace(/-photo$/, "")}"`);
    expect("C is exactly B plus the photo (byte-for-byte once removed)", p.file, stripped === b);
  }
}
const hubLinks = [...hub.matchAll(/href="([^"#?]+)/g)].map(m => m[1]);
const dead = hubLinks.filter(f => !existsSync(`${ROOT}/${f}`));
expect("every hub link resolves", "index.html", dead.length === 0, dead.join(", "));
const imgs = ["img/partners-480.webp", "img/partners-720.webp", "img/partners-960.webp"].filter(f => !existsSync(`${ROOT}/${f}`));
expect("partner photo files exist", "img/", !imgs.length, imgs.join(", "));

// ---- browser
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type,Accept" };
const posts = [];
const newCtx = async (width, height = 800) => {
  // non-mobile on purpose: mobile emulation widens the layout viewport and hides overflow
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.route(/formspree\.io/, async route => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    posts.push(JSON.parse(route.request().postData()));
    return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: '{"ok":true}' });
  });
  await ctx.route(/googletagmanager\.com|clarity\.ms|buzzfighter\.com/, r => r.abort());
  return ctx;
};
const photoLoaded = pg => pg.waitForFunction(() => { const i = document.querySelector(".hero-team img"); return !i || i.complete; }, null, { timeout: 5000 }).catch(() => {});
const snapshot = pg => pg.evaluate(() => {
  const clean = s => s.replace(/\s+/g, " ").trim();
  const body = document.body.cloneNode(true);
  body.querySelectorAll("script,style,noscript").forEach(e => e.remove());
  const j = JSON.parse(document.getElementById("i18n-es").textContent);
  const img = document.querySelector(".hero-team img");
  const vw = document.documentElement.clientWidth;
  return {
    outline: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(e => [e.tagName.toLowerCase(), clean(e.textContent)]),
    ah: Object.fromEntries([...document.querySelectorAll('[id^="ah"]')].map(e => [e.id, clean(e.textContent)])),
    tp: Object.fromEntries([...document.querySelectorAll('[id^="tp"]')].map(e => [e.id, clean(e.textContent)])),
    names: [...document.querySelectorAll(".hero-team .tn b")].map(e => clean(e.textContent)),
    photo: img ? { ok: img.complete && img.naturalWidth > 0, w: img.getAttribute("width"), h: img.getAttribute("height"),
      prio: img.getAttribute("fetchpriority"), lazy: img.getAttribute("loading"), alt: img.alt,
      fits: (r => r.left >= -0.5 && r.right <= vw + 0.5)(document.querySelector(".hero-team").getBoundingClientRect()) } : null,
    orphans: j.ops.filter(o => !document.querySelectorAll(o[1])[o[2]]).map(o => `${o[1]}[${o[2]}]`),
    tels: [...new Set([...document.querySelectorAll("a.js-tel")].map(a => a.getAttribute("href")))],
    nums: [...new Set([...document.querySelectorAll(".js-tel-text")].map(e => e.textContent))],
    over: document.documentElement.scrollWidth - vw,
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
  const { geo, cs, file, control, group } = p;
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
  await photoLoaded(pg);
  const en = await snapshot(pg);
  const diff = en.outline.map((h, i) => JSON.stringify(h) === JSON.stringify(WANT[i]) ? null : `#${i + 1} ${JSON.stringify(h)}`).filter(Boolean);
  expect("EN outline is exactly the client's, generalised", file, en.outline.length === WANT.length && !diff.length,
    `${en.outline.length}/${WANT.length} ${diff.slice(0, 2).join(" ")}`);
  expect("title leads with the H1", file, en.title.startsWith(`${city} ${C.label} Attorneys |`), en.title);
  expect("noindex", file, en.robots.includes("noindex"), en.robots);
  expect("every call link dials the control's number", file, en.tels.length === 1 && en.tels[0] === ctlTel && en.nums.length === 1 && en.nums[0] === ctlNum,
    `${en.tels} ${en.nums} vs ${ctlTel} ${ctlNum}`);
  expect("every Spanish op lands on an element", file, !en.orphans.length, en.orphans.join(", "));
  expect("sitelink anchors exist", file, !en.missingAnchors.length, en.missingAnchors.join(", "));
  expect("page_variant pushed once, with the group's tag", file, en.dl.length === 1 && en.dl[0] === p.tag, JSON.stringify(en.dl));
  expect("footer compliance copy intact", file, en.foot.includes("Attorney Advertising") && en.foot.includes("George Z. Goldberg"));
  const figs = [...new Set(en.text.match(/\$\d[\d,.]*(?:\s?Million|M\+)?/g) || [])].map(f => f.replace(/[.,]$/, ""));
  const unsourced = figs.filter(f => !SOURCED.has(f));
  expect("only sourced dollar figures (hidden text included)", file, !unsourced.length, unsourced.join(", "));
  expect("no unconfirmed $8.7M trucking figure", file, !/8,700,000|\$8\.7M/.test(en.text));
  expect('"Over $500 Million Won" explained as recovered, with the disclaimer', file,
    en.text.includes("recovered $550M+") && en.text.includes("Prior results do not guarantee"));
  if (group === "C") {
    const ph = en.photo;
    expect("C: partners' photo loads, sized to avoid layout shift, fetched early", file,
      ph && ph.ok && ph.w === "960" && ph.h === "624" && ph.prio === "high" && !ph.lazy, JSON.stringify(ph));
    expect("C: name tags read James M. Loren (left) and George Z. Goldberg (right)", file,
      JSON.stringify(en.names) === JSON.stringify([PARTNERS.tp1[0], PARTNERS.tp2[0]]) && en.tp.tp1 === PARTNERS.tp1[1] && en.tp.tp2 === PARTNERS.tp2[1] &&
      /^James M\. Loren and George Z\. Goldberg/.test(ph?.alt || ""), `${en.names} ${JSON.stringify(en.tp)} ${ph?.alt}`);
    expect("C: photo fits the screen at 320px (EN)", file, ph?.fits);
  }

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
  if (group === "C")
    expect("C: partner titles translate", file, es.tp.tp1 === PARTNERS.tp1[2] && es.tp.tp2 === PARTNERS.tp2[2], JSON.stringify(es.tp));
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

// a sample, deeper: language round trip, 390/1440 layout, where the photo sits, real submissions
const SAMPLE_KEYS = ["austin-tx:car-accident", "dallas-tx:truck-accident", "boise-id:motorcycle-accident", "plantation-fl:rideshare-accident",
  "dallas-fort-worth-tx:rideshare-accident", "fargo-nd:truck-accident", "los-angeles-ca:car-accident", "downtown-dallas-tx:motorcycle-accident"];
const SAMPLE = PAGES.filter(p => SAMPLE_KEYS.includes(`${p.geo}:${p.cs}`));
const box = (pp, sel) => pp.evaluate(s => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; }, sel);
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const c = await newCtx(w, h);
  const pp = await c.newPage();
  for (const p of SAMPLE) for (const lang of ["en", "es"]) {
    await pp.goto(`${HOST}${p.file}?lang=${lang}`);
    await photoLoaded(pp);
    const over = await pp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(`${w}px EN/ES: no horizontal overflow (sample)`, `${p.file} ${lang}`, over <= 0, `${over}px`);
    if (p.group !== "C" || lang !== "en") continue;
    // the photo moves nothing above it: C's call button sits exactly where B's does
    const cCall = await box(pp, ".hero .cta-call"), fig = await box(pp, ".hero-team"), card = await box(pp, ".hero-in > .card");
    await pp.goto(`${HOST}${p.file.replace("-photo.html", ".html")}?lang=en`);
    const bCall = await box(pp, ".hero .cta-call");
    expect(`${w}px: C's call button sits exactly where B's does (sample)`, p.file, Math.abs(cCall.top - bCall.top) < 0.5, `${cCall.top} vs ${bCall.top}`);
    if (w === 390) {
      // phones: the faces (top 40% of the photo) are in the first screen, above the sticky call bar
      const faces = fig.top + (fig.bottom - fig.top) * 0.4;
      expect("390px: C shows the partners' faces in the first screen (sample)", p.file, fig.top > cCall.bottom && faces < h - 80, `photo ${fig.top}-${fig.bottom}`);
    } else {
      // desktop: standing in the form column, next to the H1, the card overlapping the photo's base
      expect("1440px: C's photo stands behind the form, beside the headline (sample)", p.file,
        Math.abs(fig.left - card.left) < 2 && Math.abs(fig.right - card.right) < 2 && fig.top < 140 && card.top > fig.top && card.top < fig.bottom,
        `photo ${JSON.stringify(fig)} card ${JSON.stringify(card)}`);
    }
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
  expect("toggle ES and back restores the outline and name tags (sample)", p.file,
    JSON.stringify([after.outline, after.tp]) === JSON.stringify([before.outline, before.tp]));
  await fp.evaluate(() => localStorage.removeItem("gl-lang"));

  // the form converts and tags the lead with its group
  await fp.goto(`${HOST}${p.file}?lang=en`);
  const n = posts.length;
  await fp.click('.opt[data-k="when"]');
  await fp.click('.opt[data-k="injured"]');
  await fp.fill("#f-name", "Test Person");
  await fp.fill("#f-phone", "(512) 555-0142");
  await fp.check("#f-consent");
  await fp.click("button.submit");
  await fp.waitForURL(/thank-you\.html/, { timeout: 6000 }).catch(() => {});
  const q = fp.url().split("?")[1] || "";
  const params = new URLSearchParams(q);
  expect("submission redirects with geo, ct and the group's variant (sample)", p.file,
    fp.url().includes("/thank-you.html") && params.get("geo") === p.geo && params.get("ct") === p.cs && params.get("variant") === p.tag, q);
  const lead = posts.length === n + 1 ? posts[posts.length - 1] : {};
  expect("lead payload carries the group's variant and the case type (sample)", p.file,
    lead.variant === p.tag && lead.case_type === p.cs && lead.phone === "5125550142" && lead._subject === "GoldbergandlorenPPC", JSON.stringify(lead).slice(0, 160));
}
// junk numbers are still refused
const junk = SAMPLE.find(p => p.group === "C");
await fp.goto(`${HOST}${junk.file}?lang=en`);
const n0 = posts.length;
await fp.click('.opt[data-k="when"]');
await fp.click('.opt[data-k="injured"]');
await fp.fill("#f-name", "Bot");
await fp.fill("#f-phone", "0000001");
await fp.check("#f-consent");
await fp.click("button.submit");
await fp.waitForTimeout(600);
expect("0000001 rejected, nothing sent", junk.file, posts.length === n0 && await fp.isVisible("#f-err"));
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
console.log(`\n${PAGES.length} pages (groups B and C), EN + ES, in ${secs}s`);
console.log(failures ? `${failures} FAILING CHECK(S)` : "ALL PASS");
process.exit(failures ? 1 : 0);
