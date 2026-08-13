#!/usr/bin/env node
/**
 * Bake static per-city landers from a master template.
 *   node generate-geo.mjs car-accident.html portland-or   → car-accident-portland-or.html
 *   node generate-geo.mjs car-accident.html --all         → one file per geo in the template
 * Baked files have zero runtime swap (data-baked attr set), so there is no
 * flash-of-default and they work with JS disabled. Output lands in this same
 * folder so relative img/ paths keep working.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";

const [,, file, target] = process.argv;
if (!file || !target) {
  console.error("usage: node generate-geo.mjs <template.html> <geo-slug|--all>");
  process.exit(1);
}
const path = resolve(file);
const html = readFileSync(path, "utf8");

const jsonMatch = html.match(/<script type="application\/json" id="geo-data">([\s\S]*?)<\/script>/);
if (!jsonMatch) { console.error("no #geo-data block found"); process.exit(1); }
const GEOS = JSON.parse(jsonMatch[1]);

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function bake(slug) {
  const g = GEOS[slug];
  if (!g) { console.error(`unknown geo "${slug}" — known: ${Object.keys(GEOS).join(", ")}`); process.exit(1); }
  let out = html;

  // title + og:title — prefix the city onto whatever case type the template carries
  out = out.replace(/<title>([\s\S]*?)<\/title>/, (_, t) => `<title>${esc(g.city)} ${t}</title>`);
  out = out.replace(/(<meta property="og:title" content=")([^"]*)(">)/, (_, a, t, b) => `${a}${esc(g.city)} ${t}${b}`);

  // data-geo elements (span|b|p, plain-text content)
  for (const [key, val] of Object.entries(g)) {
    const text = key === "city" ? null : esc(val);
    if (text === null) continue;
    out = out.replace(
      new RegExp(`(<(span|b|p|em)\\b[^>]*data-geo="${key}"[^>]*>)[\\s\\S]*?(</\\2>)`, "g"),
      `$1${text}$3`
    );
  }
  // phone: every tel href + every visible number
  out = out.replace(/href="tel:\+1\d+"/g, `href="tel:${g.phone}"`);
  out = out.replace(/(<(span|strong)\b[^>]*class="js-tel-text"[^>]*>)[^<]*(<\/\2>)/g, `$1${esc(g.phoneDisplay)}$3`);

  // mark as baked so runtime swap stays inert
  out = out.replace(/<html lang="en">/, `<html lang="en" data-baked="${slug}">`);

  const stem = basename(path, ".html");
  const dest = resolve(dirname(path), `${stem}-${slug}.html`);
  writeFileSync(dest, out);
  console.log(`baked ${dest}`);
}

if (target === "--all") {
  Object.keys(GEOS).filter(s => s !== "default").forEach(bake);
} else {
  bake(target.toLowerCase());
}
