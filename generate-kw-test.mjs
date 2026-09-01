#!/usr/bin/env node
/**
 * Keyword-insertion TEST landers (Dallas + Fort Worth).
 *   node generate-kw-test.mjs
 * Reads the baked city pages and writes *-kw.html variants that adapt the
 * headline to the ad keyword passed as ?kw={keyword} (Google ValueTrack).
 * WHITELIST ONLY: the query never reaches the DOM — we detect profession
 * (attorney/lawyer) and "near me" intent, then pick from fixed headline
 * strings. Unrecognized or missing kw = the proven control page, unchanged.
 * Leads from these pages carry variant:"kw-test" + the sanitized kw, and the
 * thank-you redirect gains &variant=kw for GA4 segmentation.
 * Re-run after re-baking the Dallas/Fort Worth pages.
 */
import { readFileSync, writeFileSync } from "node:fs";

const PAGES = [];
for (const ct of ["car-accident", "truck-accident", "motorcycle-accident"]) {
  for (const geo of ["dallas-tx", "fort-worth-tx"]) {
    PAGES.push({ src: `${ct}-${geo}.html`, out: `${ct}-${geo}-kw.html`, ct });
  }
}

const CASE_LABEL = {
  "car-accident": "Car Accident",
  "truck-accident": "Truck Accident",
  "motorcycle-accident": "Motorcycle Accident",
};

function kwScript(caseLabel) {
  return `
<script>
(function(){
  try {
    var raw = new URLSearchParams(location.search).get("kw");
    if (!raw) return;
    var kw = raw.toLowerCase().replace(/[^a-z ]+/g, " ").replace(/ +/g, " ").trim().slice(0, 80);
    if (!kw) return;
    window.__kw = kw;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "kw_variant", kw: kw });
    var attorney = kw.indexOf("attorney") > -1;
    var lawyer = kw.indexOf("lawyer") > -1;
    if (!attorney && !lawyer) return;
    var prof = attorney ? "Attorney" : "Lawyer";
    var near = kw.indexOf("near me") > -1 || kw.indexOf("near you") > -1 || kw.indexOf("nearby") > -1;
    var pre = document.querySelector(".h1-pre"), post = document.querySelector(".h1-post");
    if (pre && post) {
      if (near) { pre.textContent = ""; post.textContent = " ${caseLabel} " + prof + "s Near You"; }
      else { pre.textContent = "Need a "; post.textContent = " ${caseLabel} " + prof + "?"; }
    }
    if (attorney) {
      var sub = document.querySelector(".hero-sub");
      if (sub) sub.textContent = sub.textContent.replace(/\\blawyers\\b/, "attorneys");
    }
  } catch(e){}
})();
</script>
</body>`;
}

let fail = false;
function mustReplace(html, find, repl, file, what) {
  const n = html.split(find).length - 1;
  if (n !== 1) { console.error(`${file}: expected exactly 1 of ${what}, found ${n}`); fail = true; return html; }
  return html.replace(find, repl);
}

for (const { src, out, ct } of PAGES) {
  let html = readFileSync(src, "utf8");
  html = mustReplace(html, "<title>", '<meta name="robots" content="noindex">\n<title>', src, "title tag (noindex insert)");
  html = mustReplace(
    html,
    'payload._subject = "GoldbergandlorenPPC";',
    'payload._subject = "GoldbergandlorenPPC"; payload.variant = "kw-test"; if (window.__kw) payload.kw = window.__kw;',
    src, "payload subject line"
  );
  html = mustReplace(html, `"&ct=${ct}"`, `"&ct=${ct}&variant=kw"`, src, "thank-you ct param");
  html = mustReplace(html, "</body>", kwScript(CASE_LABEL[ct]), src, "closing body tag");
  writeFileSync(out, html);
  console.log(`built ${out}`);
}
if (fail) process.exit(1);
