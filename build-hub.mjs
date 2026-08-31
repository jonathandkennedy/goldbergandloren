#!/usr/bin/env node
/* Regenerates index.html (internal review hub) from the masters' geo data.
   Run after adding markets: node build-hub.mjs */
import { readFileSync, writeFileSync } from "node:fs";

const CASES = [
  ["car-accident", "Car Accidents"],
  ["truck-accident", "Truck Accidents"],
  ["motorcycle-accident", "Motorcycle Accidents"],
];
const REGIONS = [
  ["Texas — Austin", ["austin-tx"]],
  ["Texas — Dallas–Fort Worth", ["dallas-tx","downtown-dallas-tx","dallas-fort-worth-tx","fort-worth-tx","arlington-tx","grapevine-tx","rockwall-tx","frisco-tx","plano-tx","celina-tx","prosper-tx","mckinney-tx"]],
  ["Texas — West", ["midland-tx"]],
  ["West & Northwest", ["portland-or","boise-id","las-vegas-nv","los-angeles-ca","fresno-ca"]],
  ["Midwest & Southeast", ["fargo-nd","plantation-fl"]],
];

const html = readFileSync("car-accident.html", "utf8");
const geos = JSON.parse(html.match(/<script type="application\/json" id="geo-data">\n([\s\S]*?)\n<\/script>/)[1]);
const slugs = Object.keys(geos).filter(s => s !== "default");
const listed = new Set(REGIONS.flatMap(([, s]) => s));
const missing = slugs.filter(s => !listed.has(s));
if (missing.length) REGIONS.push(["Other", missing]);

const total = slugs.length * CASES.length + CASES.length;
let body = "";
for (const [caseSlug, caseName] of CASES) {
  body += `<section>\n<h2>${caseName}</h2>\n<a class="master" href="${caseSlug}.html">National (default)</a>\n`;
  for (const [region, list] of REGIONS) {
    const links = list.filter(s => geos[s])
      .map(s => `<a href="${caseSlug}-${s}.html">${geos[s].city}</a>`).join("");
    if (links) body += `<div class="reg"><h3>${region}</h3><div class="links">${links}</div></div>\n`;
  }
  body += `</section>\n`;
}

writeFileSync("index.html", `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Goldberg &amp; Loren — Landing Page Review Hub</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:#f7fafc;color:#152036;padding:40px 20px 60px}
.wrap{max-width:900px;margin:0 auto}
.kick{font-size:.68rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#0f766e}
h1{font-size:1.7rem;font-weight:800;color:#153b66;margin:6px 0 4px}
.note{color:#5b6b7f;font-size:.85rem;margin-bottom:28px;line-height:1.6}
section{background:#fff;border:1px solid #dfe6ee;border-radius:12px;padding:20px;margin-bottom:14px}
h2{font-size:1.05rem;font-weight:800;color:#153b66;margin-bottom:12px}
h3{font-size:.66rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#5b6b7f;margin:14px 0 8px}
.reg{border-top:1px solid #eef2f6}
.links{display:flex;flex-wrap:wrap;gap:8px}
.links a,.master{font-size:.8rem;font-weight:700;color:#153b66;text-decoration:none;border:1px solid #dfe6ee;border-radius:8px;padding:8px 12px;background:#f7fafc;display:inline-block}
.links a:hover,.master:hover{border-color:#0f766e;color:#0f766e}
.master{background:#0f766e;border-color:#0f766e;color:#fff}
.tip{font-size:.75rem;color:#5b6b7f;margin-top:16px;line-height:1.6}
code{background:#eef3f2;border-radius:3px;padding:1px 5px;font-size:.72rem}
</style>
</head>
<body><div class="wrap">
<p class="kick">Retainer Reach · Internal Review</p>
<h1>Goldberg &amp; Loren — Landers</h1>
<p class="note">${total} pages · ${slugs.length} markets · every page has an EN/ES switch (header toggle or the "Se Habla Español" chip) · add <code>?lang=es</code> to any URL to land in Spanish · national pages accept <code>?geo=frisco-tx</code> etc. · forms redirect to <code>/thank-you.html</code></p>
${body}<p class="tip">This hub is for review only — never send ad traffic here. Campaign final URLs go directly to a city page.</p>
</div></body></html>
`);
console.log(`hub rebuilt — ${slugs.length} markets, ${total} pages`);
