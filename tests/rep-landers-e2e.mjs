// E2E for the PPC rep's landers, groups D (long, {slug}/) and E (simple, {slug}-simple/).
// Each page is checked against its control ({case}-{geo}.html, group A) and against the
// promise generate-rep-landers.mjs makes: none of the rep's review notes or unverified
// claims survive, every form sends a tagged lead to the live landers' inbox and thank-you
// page, the live landers' tracking is in place, the partners' photo and the rental-car
// heading are in the hero. Formspree mocked, third parties blocked.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { slugs, parse, pageDir, pageUrl } from "../generate-rep-landers.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");
process.chdir(ROOT); // the generator's helpers read rep-landers/ relative to the repo
const TYPES = { webp: "image/webp", jpg: "image/jpeg", png: "image/png", svg: "image/svg+xml", woff2: "font/woff2" };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
  if (path === "" || path.endsWith("/")) path += "index.html";
  try {
    const body = await readFile(ROOT + "/" + path);
    res.writeHead(200, { "content-type": TYPES[path.split(".").pop()] || "text/html" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(8961, r));
const HOST = "http://localhost:8961/";
const BASE = "https://results.goldbergloren.com/";

const results = new Map();
const expect = (label, file, ok, detail = "") => {
  const r = results.get(label) || { n: 0, bad: [] };
  r.n++; if (!ok) r.bad.push(detail ? `${file}: ${detail}` : file);
  results.set(label, r);
};

const PAGES = slugs().map(parse).flatMap(p => ["D", "E"].map(group => ({ ...p, group, dir: pageDir(group, p.slug), url: pageUrl(group, p.slug),
  variant: `${p.city}-ppc-${group === "D" ? "long" : "simple"}`, control: `${p.cs}-${p.geo}.html` })));
const RENTAL = "Ask Us About Our Rental Car";
// what the rep marked, and the claims nobody could verify
const BANNED = [/VERIFY/, /PLACEHOLDER/, /Legal review/, /class="ph"/, /TEXAS RESULT/, /Avvo/, /Super Lawyers/, /Martindale-Hubbell/,
  /hospital room/, /at home or the hospital/, /Attorney-client confidential/, /\.\.\/assets\//, /href="#"/, /onsubmit/, /ld\+json/];

// ---- static: files, sources, hub, markup
expect("28 pages built (14 × D and E)", "-", PAGES.length === 28 && PAGES.every(p => existsSync(`${ROOT}/${p.dir}/index.html`)),
  PAGES.filter(p => !existsSync(`${ROOT}/${p.dir}/index.html`)).map(p => p.dir).join(", "));
expect("the rep's review builds never deploy", ".vercelignore", /^rep-landers\/$/m.test(readFileSync(`${ROOT}/.vercelignore`, "utf8")));
const hub = readFileSync(`${ROOT}/index.html`, "utf8").split("<h2>PPC Rep Landers</h2>")[1]?.split("</section>")[0] || "";
const hubLinks = [...hub.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
expect("hub lists every D and E page", "index.html", PAGES.every(p => hubLinks.includes(p.url)) && hubLinks.length === 28, `${hubLinks.length} links`);

for (const p of PAGES) {
  const file = p.url;
  const html = readFileSync(`${ROOT}/${p.dir}/index.html`, "utf8");
  const ctl = readFileSync(`${ROOT}/${p.control}`, "utf8");
  const ctlTel = ctl.match(/class="btn btn-teal cta-call js-tel" href="(tel:\+\d+)"/)[1];
  const left = BANNED.filter(re => re.test(html)).map(String);
  expect("no review note or unverified claim left", file, !left.length, left.join(" "));
  expect("noindex", file, html.includes('<meta name="robots" content="noindex,nofollow">'));
  expect("canonical is the page's own URL", file, html.includes(`<link rel="canonical" href="${BASE}${p.url}">`));
  const tels = [...new Set([...html.matchAll(/href="(tel:[^"]+)"/g)].map(m => m[1]))];
  expect("every call link dials the control's number", file, tels.length === 1 && tels[0] === ctlTel, `${tels} vs ${ctlTel}`);
  // the control's tracking, byte-for-byte
  const blocks = [/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/, /<!-- Microsoft Clarity -->[\s\S]*?<!-- End Microsoft Clarity -->/,
    /<!-- ClickCease\.com tracking-->[\s\S]*?<!-- ClickCease\.com tracking-->/, /<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End ClickCease\.com tracking \(noscript\) -->/];
  expect("GTM, Clarity and ClickCease exactly as on the control", file, blocks.every(re => { const c = ctl.match(re); return c && html.includes(c[0]); }));
  const rel = [...html.matchAll(/href="(\.\.\/[^"#]+)"/g)].map(m => m[1]).filter(h => !existsSync(`${ROOT}/${p.dir}/${h}index.html`));
  expect("links to other rep pages resolve", file, !rel.length, rel.join(", "));
  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]).filter(id => !html.includes(`id="${id}"`));
  expect("in-page anchors resolve", file, !anchors.length, anchors.join(", "));
  const imgs = [...html.matchAll(/(?:src|href)="\/(img\/[^"]+)"/g)].map(m => m[1]).filter(f => !existsSync(`${ROOT}/${f}`));
  expect("every image file exists", file, !imgs.length, imgs.join(", "));
}

// ---- browser
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type,Accept" };
let posts = [], formspreeStatus = 200;
const newCtx = async width => {
  // non-mobile on purpose: mobile emulation widens the layout viewport and hides overflow
  const ctx = await browser.newContext({ viewport: { width, height: 800 } });
  await ctx.route(/formspree\.io/, async route => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    posts.push(JSON.parse(route.request().postData()));
    return route.fulfill({ status: formspreeStatus, headers: CORS, contentType: "application/json", body: formspreeStatus === 200 ? '{"ok":true}' : '{"error":"x"}' });
  });
  await ctx.route(/googletagmanager\.com|clarity\.ms|buzzfighter\.com/, r => r.abort());
  return ctx;
};
// .hero{overflow:hidden} would hide clipping from scrollWidth: check the hero's own boxes
const heroClip = () => {
  const vw = document.documentElement.clientWidth;
  let worst = null, px = 0.5;
  for (const e of document.querySelectorAll("section.hero *")) {
    const over = e.getBoundingClientRect().right - vw;
    if (over > px) { worst = e; px = over; }
  }
  return worst ? `${worst.tagName.toLowerCase()}${worst.getAttribute("class") ? "." + worst.getAttribute("class").split(" ")[0] : ""} +${Math.round(px)}px` : "";
};
const snapshot = pg => pg.evaluate(() => {
  const r = document.querySelectorAll("h2.rental"), h = r[0];
  const above = document.querySelector(".cta-row") || document.querySelector(".hero ul.checks");
  const img = document.querySelector(".hero-team img");
  return {
    rental: r.length !== 1 ? `${r.length} found` : !h.closest("section.hero") ? "not in the hero" : h.getBoundingClientRect().top < above.getBoundingClientRect().bottom ? "above the call buttons" : h.textContent.trim(),
    photo: img ? img.complete && img.naturalWidth > 0 : false,
    tags: [...document.querySelectorAll(".hero-team .tn b")].map(b => b.textContent),
    dl: (window.dataLayer || []).filter(e => e.event === "page_variant").map(e => e.variant),
    over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    text: document.body.innerText,
  };
});
const PHONE = "(214) 555-0147";
async function submit(pg, p, form) {
  if (p.group === "D" && form === "hero") {
    await pg.click('#case-form label.opt:nth-child(2)');
    await pg.fill("#n", "Pat Tester"); await pg.fill("#p", PHONE); await pg.check("#c1");
    await pg.click('#case-form button[type="submit"]');
  } else if (p.group === "D") {
    await pg.fill("#n2", "Pat Tester"); await pg.fill("#p2", PHONE); await pg.check("#c2");
    await pg.click('#case-form-2 button[type="submit"]');
  } else {
    const pre = form === "hero" ? "#case-form-" : "#case-form-2-";
    await pg.fill(pre + "fn", "Pat"); await pg.fill(pre + "ln", "Tester"); await pg.fill(pre + "ph", PHONE);
    await pg.fill(pre + "zip", "75201"); await pg.fill(pre + "em", "pat@example.com"); await pg.fill(pre + "d", "Rear-ended on I-35E");
    await pg.click(`${form === "hero" ? "#case-form" : "#case-form-2"} button[type="submit"]`);
  }
}

const t0 = Date.now();
for (const width of [320, 390]) {
  const ctx = await newCtx(width);
  const pg = await ctx.newPage();
  const missing = [];
  pg.on("response", r => { if (r.url().startsWith(HOST) && r.status() >= 400) missing.push(r.url()); });
  for (const p of PAGES) {
    const file = p.url;
    missing.length = 0;
    await pg.goto(HOST + p.url);
    await pg.waitForFunction(() => { const i = document.querySelector(".hero-team img"); return i && i.complete; }, null, { timeout: 5000 }).catch(() => {});
    const s = await snapshot(pg);
    const clip = await pg.evaluate(heroClip);
    expect(`${width}px: no horizontal overflow`, file, s.over <= 0, `${s.over}px`);
    expect(`${width}px: nothing in the hero runs past the screen edge`, file, !clip, clip);
    if (width === 320) continue;
    expect("nothing on the page 404s", file, !missing.length, missing.join(", "));
    expect("rental-car H2 under the call buttons", file, s.rental === RENTAL, s.rental);
    expect("partners' photo loads, name tags James M. Loren and George Z. Goldberg", file, s.photo && s.tags.join() === "James M. Loren,George Z. Goldberg", `${s.photo} ${s.tags}`);
    expect("page_variant pushed once, with the group's tag", file, s.dl.length === 1 && s.dl[0] === p.variant, JSON.stringify(s.dl));
    expect("no review note in the rendered text", file, !/VERIFY|PLACEHOLDER|Legal review/.test(s.text));

    // both forms send a tagged lead and land on the thank-you page
    for (const form of ["hero", "bottom"]) {
      posts = [];
      await pg.goto(HOST + p.url);
      await submit(pg, p, form);
      const landed = await pg.waitForURL(/thank-you\.html/, { timeout: 8000 }).then(() => pg.url(), () => pg.url());
      const d = posts[0] || {};
      const want = { phone: "2145550147", case_type: p.cs, geo: p.geo, variant: p.variant, form, _subject: "GoldbergandlorenPPC" };
      const bad = Object.entries(want).filter(([k, v]) => d[k] !== v).map(([k, v]) => `${k}=${d[k]} want ${v}`);
      if (p.group === "D" && form === "hero") { if (d.injured !== "Yes, but I haven't been treated yet") bad.push(`injured=${d.injured}`); if (!d.when) bad.push("no when"); }
      if (p.group === "D" && d.consent !== "checkbox") bad.push(`consent=${d.consent}`);
      if (p.group === "E" && (d.zip !== "75201" || d.email !== "pat@example.com" || !d.case_type_selected || d.details !== "Rear-ended on I-35E")) bad.push("E fields");
      if (!(d.name || "").includes("Pat")) bad.push(`name=${d.name}`);
      expect(`${form} form: one lead, tagged, with every field`, file, posts.length === 1 && !bad.length, `${posts.length} posts ${bad.join(" ")}`);
      expect(`${form} form: lands on the thank-you page with geo, case type and variant`, file,
        landed.includes(`/thank-you.html?geo=${p.geo}&ct=${p.cs}&variant=${p.variant}`), landed);
    }
  }
  await ctx.close();
}

// a sample, deeper: validation and a failed send
{
  const ctx = await newCtx(390);
  const pg = await ctx.newPage();
  for (const p of PAGES.filter(p => p.slug === "car-accident-lawyer-dallas-tx")) {
    const file = p.url;
    posts = [];
    await pg.goto(HOST + p.url);
    await pg.click('#case-form button[type="submit"]');
    const err = await pg.$eval("#case-form .ferr", e => !e.hidden && e.textContent);
    expect("empty form: an error, and nothing sent", file, !!err && !posts.length, `${err} ${posts.length}`);
    if (p.group === "D") {
      await pg.click('#case-form label.opt:nth-child(1)'); await pg.fill("#n", "Pat"); await pg.fill("#p", PHONE);
      await pg.click('#case-form button[type="submit"]');
      const e2 = await pg.$eval("#case-form .ferr", e => !e.hidden && e.textContent);
      expect("D: consent box required, as on the live landers", file, /consent/.test(e2 || "") && !posts.length, e2);
    }
    await pg.goto(HOST + p.url);
    formspreeStatus = 500;
    await submit(pg, p, "hero");
    await pg.waitForFunction(() => { const e = document.querySelector("#case-form .ferr"); return e && !e.hidden; }, null, { timeout: 5000 }).catch(() => {});
    const fail = await pg.evaluate(() => [document.querySelector("#case-form .ferr").textContent, document.querySelector('#case-form button[type="submit"]').disabled, location.pathname]);
    formspreeStatus = 200;
    expect("failed send: says so, offers the phone number, keeps the visitor on the page", file,
      fail[0].includes("(214) 466-2129") && !fail[1] && !fail[2].includes("thank-you"), JSON.stringify(fail));
  }
  await ctx.close();
}
const secs = ((Date.now() - t0) / 1000).toFixed(0);
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
console.log(`\n${PAGES.length} PPC rep pages (groups D and E), at 320 and 390px, both forms each, in ${secs}s`);
console.log(failures ? `${failures} FAILING CHECK(S)` : "ALL PASS");
process.exit(failures ? 1 : 0);
