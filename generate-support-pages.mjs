#!/usr/bin/env node
/**
 * Builds the shared support pages used as Google Ads sitelink destinations.
 *   node generate-support-pages.mjs
 *
 * Design follows goldbergloren.com: deep navy + metallic gold, Playfair Display
 * headlines over DM Sans, a gold results ticker, square gold CTAs and a sticky
 * call bar on mobile. Fonts are self-hosted from fonts/ (SIL OFL) so the pages
 * make no third-party font requests.
 *
 * Shared, not per-city: the phone number, GTM container and "back to the case
 * review" CTAs adapt at runtime from ?geo=<slug> and ?ct=<case-type>, so one
 * page serves every market while CallRail still sees the right number.
 * ?lang=es switches the page to Spanish. Geo data is read from car-accident.html
 * so numbers and containers have exactly one source of truth.
 *
 * Every figure on these pages is either the firm's published data or taken from
 * the firm's own results page. Do not add a dollar figure without a source —
 * tests/support-e2e.mjs holds an allowlist and will fail on an unknown one.
 */
import { readFileSync, writeFileSync } from "node:fs";

const master = readFileSync("car-accident.html", "utf8");
const GEOS = JSON.parse(master.match(/<script type="application\/json" id="geo-data">([\s\S]*?)<\/script>/)[1]);
// Only offices whose geo record carries a real Google rating get a ratings card.
// Everything else is left out rather than invented.
const rating = v => {
  const m = (v.review || "").match(/★\s*([\d.]+)\/5\s*·\s*([\d,]+)\s*Google reviews/i);
  return m ? { stars: m[1], count: m[2] } : null;
};
const GEO_MIN = Object.fromEntries(Object.entries(GEOS).map(([k, v]) => {
  const r = rating(v);
  const rec = { city: v.city || "", phone: v.phone, display: v.phoneDisplay, gtm: v.gtm || "" };
  if (r) { rec.stars = r.stars; rec.count = r.count; }
  return [k, rec];
}));
const RATED = Object.values(GEO_MIN).filter(v => v.stars && v.city);

const ORIGIN = "https://results.goldbergloren.com";
const FIRM_URL = "https://goldbergloren.com/";
const esc = v => String(v).replace(/&(?!(?:amp|lt|gt|quot|#\d+|[a-z]+);)/g, "&amp;").replace(/"/g, "&quot;");

// Entity consolidation: these pages live on a subdomain, so sameAs tells Google
// this is the SAME firm as goldbergloren.com rather than a competing site.
const firmSchema = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  "@id": ORIGIN + "/#firm",
  name: "Goldberg & Loren Personal Injury Attorneys",
  url: ORIGIN + "/",
  sameAs: [FIRM_URL],
  telephone: "+1-512-960-3887",
  description: "Personal injury attorneys handling car, truck, motorcycle and rideshare accident claims nationwide. 20,000+ injury cases handled since 1994.",
  areaServed: "US",
  address: {
    "@type": "PostalAddress",
    streetAddress: "10189 Cleary Boulevard, Suite 101",
    addressLocality: "Plantation",
    addressRegion: "FL",
    postalCode: "33324",
    addressCountry: "US"
  },
  founder: [
    { "@type": "Person", name: "George Z. Goldberg", sameAs: "https://goldbergloren.com/attorney-george-goldberg/" },
    { "@type": "Person", name: "James M. Loren", sameAs: "https://goldbergloren.com/attorney-james-loren/" }
  ]
};
// Deliberately NO aggregateRating/Review markup: Google does not show review
// rich results for self-serving reviews about the business on its own site, and
// marking them up anyway risks a structured-data manual action.

const CLARITY = `<!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "ybpj42my1c");
</script>
<!-- End Microsoft Clarity -->
<!-- ClickCease.com tracking-->
<script async src="https://ob.buzzfighter.com/i/1c12dbadd579836d7d83166cb5b124b3.js" class="ct_clicktrue"></script>
<!-- ClickCease.com tracking-->`;

const CC_NOSCRIPT = `<!-- ClickCease.com tracking (noscript) -->
<noscript><iframe src="https://ob.buzzfighter.com/ns/1c12dbadd579836d7d83166cb5b124b3.html?ch="
width="0" height="0" style="display:none"></iframe></noscript>
<!-- End ClickCease.com tracking (noscript) -->`;

const CHECK_SVG = c => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23${c}'/%3E%3Cpath d='M7 12.4l3.2 3.2L17 9' fill='none' stroke='%230c1a30' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

const CSS = `@font-face{font-family:"Playfair Display";font-style:normal;font-weight:400 900;font-display:swap;src:url(fonts/playfair-display-latin-wght-normal.woff2) format("woff2")}
@font-face{font-family:"Playfair Display";font-style:italic;font-weight:400 900;font-display:swap;src:url(fonts/playfair-display-latin-wght-italic.woff2) format("woff2")}
@font-face{font-family:"DM Sans";font-style:normal;font-weight:100 1000;font-display:swap;src:url(fonts/dm-sans-latin-wght-normal.woff2) format("woff2")}
:root{--navy-950:#081222;--navy-900:#0c1a30;--navy-800:#12243f;--gold-300:#e6cf95;--gold-400:#d4b46e;--gold-500:#c9a35a;--gold-600:#9a7632;--gold-700:#7a5a1e;
--cream:#f5f0e6;--paper:#fffdf8;--ink:#0c1a30;--body:#3c4658;--muted:#626b7c;--line:#e2d7c2;--line-soft:#ece4d4;--on-navy:#c3cbd9;--on-navy-muted:#98a3b8;
--gold-grad:linear-gradient(115deg,#a8823c 0%,#caa75e 22%,#f0dca6 46%,#d6b56f 62%,#b08a44 84%,#a8823c 100%);
--serif:"Playfair Display",Georgia,"Times New Roman",serif;--sans:"DM Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;--ease:cubic-bezier(.2,.7,.2,1)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;scroll-padding-top:84px}
body{font-family:var(--sans);font-size:17px;line-height:1.65;color:var(--body);background:var(--paper);-webkit-font-smoothing:antialiased;padding-bottom:calc(62px + env(safe-area-inset-bottom))}
img{display:block;max-width:100%;height:auto}
a{color:inherit}
:focus-visible{outline:2px solid var(--gold-400);outline-offset:3px}
.wrap{width:100%;max-width:1160px;margin:0 auto;padding:0 20px}
.skip{position:absolute;left:-9999px;top:0;z-index:100;background:var(--gold-400);color:var(--navy-950);padding:10px 16px;font-weight:700}
.skip:focus{left:12px;top:12px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* results ticker */
.ticker{background:var(--gold-grad);color:var(--navy-950);overflow:hidden;position:relative;z-index:41}
.ticker-track{display:flex;width:max-content;animation:tick 64s linear infinite}
.ticker:hover .ticker-track{animation-play-state:paused}
.ticker ul{display:flex;list-style:none}
.ticker li{display:flex;align-items:baseline;gap:10px;padding:10px 24px;white-space:nowrap;font-size:.68rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;border-right:1px solid rgba(8,18,34,.25)}
.ticker li b{font-size:.92rem;font-weight:800;letter-spacing:.03em}
@keyframes tick{to{transform:translateX(-50%)}}

/* header */
.hd{position:sticky;top:0;z-index:40;background:rgba(8,18,34,.97);border-bottom:1px solid rgba(201,163,90,.2)}
@supports (backdrop-filter:blur(8px)){.hd{background:rgba(8,18,34,.9);backdrop-filter:saturate(150%) blur(10px)}}
.hd-in{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:68px}
.brand{display:flex;flex-direction:column;line-height:1}
.brand-name{font-weight:800;font-size:1.22rem;letter-spacing:.02em;color:var(--gold-400);white-space:nowrap}
@supports ((-webkit-background-clip:text) or (background-clip:text)){.brand-name{background:var(--gold-grad);-webkit-background-clip:text;background-clip:text;color:transparent}}
.brand-name i{font-style:normal}
.brand-sub{margin-top:7px;font-size:.54rem;font-weight:500;letter-spacing:.5em;text-transform:uppercase;color:#e9edf4;white-space:nowrap}
.hd-actions{display:flex;align-items:center;gap:10px}
.lang{font:700 .7rem/1 var(--sans);letter-spacing:.14em;color:var(--gold-300);background:transparent;border:1px solid rgba(201,163,90,.45);min-width:44px;min-height:42px;padding:0 10px;cursor:pointer;transition:background .2s}
.lang:hover{background:rgba(201,163,90,.14)}
.hd-call{display:flex;align-items:center;gap:12px;text-decoration:none;color:#fff}
.hd-call .ic{display:grid;place-items:center;width:44px;height:44px;background:var(--gold-grad);color:var(--navy-950)}
.hd-call-txt{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.hd-call-txt small{display:block;font-size:.6rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-300)}
.hd-call-txt strong{display:block;margin-top:3px;font-size:1.14rem;font-weight:800;letter-spacing:.01em}
@media(max-width:374px){.wrap{padding:0 16px}.hd-in{gap:8px}.brand-name{font-size:1.02rem}.brand-sub{font-size:.5rem;letter-spacing:.4em}.hd-actions{gap:6px}.lang{min-width:40px}.hd-call .ic{width:42px;height:42px}}
@media(min-width:720px){.hd-call-txt{position:static;width:auto;height:auto;overflow:visible;clip:auto;line-height:1.1}.brand-name{font-size:1.42rem}.brand-sub{font-size:.6rem}}

/* buttons */
.ctas{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:34px}
.btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:12px;min-height:60px;padding:16px 30px;font:800 .8rem/1.2 var(--sans);letter-spacing:.16em;text-transform:uppercase;text-decoration:none;overflow:hidden;white-space:nowrap;transition:transform .2s var(--ease),box-shadow .2s var(--ease),border-color .2s,color .2s}
.btn svg{flex:none}
.btn .num{font-size:1rem;letter-spacing:.04em}
.btn-gold{background:var(--gold-grad);color:var(--navy-950);box-shadow:0 14px 34px -14px rgba(201,163,90,.65)}
.btn-gold:hover{transform:translateY(-2px);box-shadow:0 20px 40px -14px rgba(201,163,90,.8)}
.btn-gold::after,.mbar-call::after{content:"";position:absolute;top:0;left:-60%;width:38%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-18deg);animation:sheen 6s var(--ease) infinite}
@keyframes sheen{0%,64%{left:-60%}100%{left:135%}}
.btn-line{color:#fff;border:1px solid rgba(255,255,255,.42)}
.btn-line:hover{border-color:var(--gold-400);color:var(--gold-300)}
.btn-navy{background:var(--navy-900);color:#fff}
.btn-navy:hover{background:var(--navy-800)}
.btn-xl{min-height:70px;padding:18px 36px;font-size:.9rem}
.btn-xl .num{font-size:1.24rem}
@media(max-width:560px){.ctas{flex-direction:column;align-items:stretch}.btn{padding:16px 18px;letter-spacing:.12em}}
/* small phones (320–380px): the number gets its own line so it can never be clipped */
@media(max-width:380px){.btn{flex-wrap:wrap;white-space:normal;text-align:center;row-gap:6px;column-gap:10px;padding:14px 12px;letter-spacing:.1em}.btn .num{flex-basis:100%}.btn-xl{padding:16px 12px}}

/* hero */
.hero{position:relative;overflow:hidden;isolation:isolate;text-align:center;color:#fff;padding:72px 0 76px;background:radial-gradient(90% 70% at 50% -10%,rgba(201,163,90,.2),transparent 60%),linear-gradient(180deg,var(--navy-900),#0a1628)}
.hero-mark{position:absolute;z-index:-1;left:50%;top:18px;transform:translateX(-50%);font-family:var(--serif);font-weight:900;font-size:clamp(9rem,40vw,25rem);line-height:.82;letter-spacing:-.03em;color:rgba(255,255,255,.045);white-space:nowrap;pointer-events:none;user-select:none;font-feature-settings:"lnum"}
.eyebrow{display:inline-flex;align-items:center;justify-content:center;gap:14px;font-size:.7rem;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--gold-400)}
.eyebrow::before,.eyebrow::after{content:"";flex:none;width:26px;height:1px;background:currentColor;opacity:.7}
@media(max-width:480px){.eyebrow{letter-spacing:.24em;gap:10px}.eyebrow::before,.eyebrow::after{width:16px}}
h1{margin:18px auto 0;max-width:15em;font-family:var(--serif);font-weight:800;font-size:clamp(2.55rem,8.6vw,4.7rem);line-height:1.02;letter-spacing:-.012em;color:#fff;text-wrap:balance}
h1 em,h2 em{font-style:italic;font-weight:500;color:var(--gold-400)}
.hero-sub{margin:22px auto 0;max-width:37em;font-size:1.08rem;line-height:1.7;color:var(--on-navy)}
.trust{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 26px;margin-top:30px;list-style:none;font-size:.74rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--on-navy)}
.trust li{display:flex;align-items:center;gap:9px}
.trust li::before{content:"";width:16px;height:16px;background:${CHECK_SVG("c9a35a")} no-repeat center/contain}
.live{display:inline-flex;align-items:center;gap:10px;margin-bottom:22px;padding:8px 14px;border:1px solid rgba(74,222,128,.35);background:rgba(74,222,128,.08);color:#c4f5d4;font-size:.7rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.live i{width:8px;height:8px;border-radius:50%;background:#4ade80;animation:pulse 2s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.55)}70%{box-shadow:0 0 0 10px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
.hero-photo{padding:0 0 76px;background:var(--navy-950)}
.hero-photo .ph{position:relative;z-index:-1}
.hero-photo .ph img{width:100%;height:clamp(380px,96vw,660px);object-fit:cover;object-position:center 22%}
.hero-photo .ph::after{content:"";position:absolute;inset:0;background:radial-gradient(75% 90% at 50% 30%,transparent 42%,rgba(8,18,34,.72) 100%),linear-gradient(180deg,rgba(8,18,34,0) 42%,rgba(8,18,34,.78) 74%,var(--navy-950) 100%)}
.hero-photo .hero-in{margin-top:clamp(-190px,-22vw,-120px)}
.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:30px 14px;max-width:880px;margin:46px auto 0;padding-top:38px;border-top:1px solid rgba(255,255,255,.13)}
.stats-3 .stat:last-child{grid-column:1/-1}
@media(min-width:760px){.stats-3{grid-template-columns:repeat(3,1fr)}.stats-3 .stat:last-child{grid-column:auto}.stats-4{grid-template-columns:repeat(4,1fr)}}
.stat b{display:block;font-family:var(--serif);font-weight:600;font-size:clamp(2.3rem,6.4vw,3.2rem);line-height:1;color:var(--gold-400);font-feature-settings:"lnum"}
.stat span{display:block;margin-top:12px;font-size:.68rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--on-navy)}

/* badge strip */
.badges{background:var(--navy-950);border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);padding:20px 0;overflow:hidden}
.badges-track{display:flex;width:max-content;animation:tick 44s linear infinite}
.badges img{height:50px;width:auto;max-width:none;padding-right:56px;opacity:.94}
@media(min-width:1100px){.badges-track{animation:none;width:auto;justify-content:center}.badges img{height:58px;padding:0}.badges img+img{display:none}}

/* sections */
.sec{padding:68px 0}
@media(min-width:900px){.sec{padding:100px 0}}
.sec-paper{background:var(--paper)}
.sec-cream{background:var(--cream)}
.sec-navy{background:var(--navy-900);color:var(--on-navy)}
.sec-head{max-width:780px;margin:0 auto 46px;text-align:center}
.sec-head .eyebrow{color:var(--gold-700)}
.sec-navy .sec-head .eyebrow,.sec-navy .eyebrow{color:var(--gold-400)}
h2{margin-top:14px;font-family:var(--serif);font-weight:700;font-size:clamp(2.05rem,5.6vw,3.2rem);line-height:1.08;letter-spacing:-.01em;color:var(--ink);text-wrap:balance}
h2 em{color:var(--gold-600)}
.sec-navy h2,.final h2{color:#fff}
.sec-navy h2 em,.final h2 em{color:var(--gold-400)}
.lede{margin-top:16px;font-size:1.08rem;color:var(--muted)}
.sec-navy .lede{color:var(--on-navy)}
h3{font-family:var(--serif);font-weight:700;color:var(--ink);line-height:1.2}
.fineprint{max-width:680px;margin:30px auto 0;text-align:center;font-size:.84rem;color:var(--muted)}
.fineprint b{color:var(--ink)}

/* $0 trio */
.zeros{display:grid;gap:18px}
@media(min-width:820px){.zeros{grid-template-columns:repeat(3,1fr);gap:22px}}
.zero{background:#fff;border:1px solid var(--line-soft);border-top:3px solid var(--gold-500);padding:38px 26px 34px;text-align:center;box-shadow:0 28px 50px -34px rgba(12,26,48,.35)}
.zero b{display:block;font-family:var(--serif);font-weight:800;font-size:4.6rem;line-height:1;color:var(--ink);font-feature-settings:"lnum"}
.zero span{display:block;margin:14px auto 0;max-width:16em;font-size:1rem;color:var(--body)}

/* steps */
.steps{display:grid;gap:18px}
@media(min-width:900px){.steps{grid-template-columns:repeat(3,1fr);gap:24px}}
.step{background:#fff;border:1px solid var(--line-soft);padding:34px 28px 32px;box-shadow:0 28px 50px -38px rgba(12,26,48,.35)}
.step-n{display:block;font-family:var(--serif);font-style:italic;font-weight:500;font-size:2.9rem;line-height:1;color:var(--gold-500);font-feature-settings:"lnum"}
.step h3{margin-top:16px;font-size:1.42rem}
.step p{margin-top:10px;font-size:.98rem}

/* comparison bars */
.compare{max-width:780px;margin:0 auto}
.bar-row+.bar-row{margin-top:26px}
.bar-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-weight:700;color:var(--ink)}
.bar-top b{font-family:var(--serif);font-size:clamp(1.7rem,5vw,2.3rem);font-weight:700;color:var(--ink);font-feature-settings:"lnum"}
.bar{margin-top:10px;height:16px;background:#e9e1d0}
.bar i{display:block;height:100%;background:var(--gold-grad)}
.bar.dim i{background:#9aa3b2}
.src{margin-top:24px;font-size:.8rem;color:var(--muted);text-align:center}
.sec-navy .bar-top,.sec-navy .bar-top b{color:#fff}
.sec-navy .bar{background:rgba(255,255,255,.09)}
.sec-navy .bar.dim i{background:#56627a}
.sec-navy .src{color:var(--on-navy-muted)}

/* faq */
.faq{max-width:820px;margin:0 auto}
.faq details{border-top:1px solid var(--line)}
.faq details:last-child{border-bottom:1px solid var(--line)}
.faq summary{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:24px 0;cursor:pointer;list-style:none;font-family:var(--serif);font-weight:700;font-size:1.26rem;color:var(--ink)}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:"+";flex:none;font-family:var(--sans);font-weight:300;font-size:2rem;line-height:1;color:var(--gold-600);transition:transform .25s var(--ease)}
.faq details[open] summary::after{transform:rotate(45deg)}
.faq details p{padding:0 0 26px;max-width:44em}

/* checklist + callouts */
.checks{list-style:none;display:grid;gap:12px;max-width:860px;margin:0 auto}
@media(min-width:760px){.checks{grid-template-columns:1fr 1fr}}
.checks li{display:flex;align-items:flex-start;gap:14px;background:#fff;border:1px solid var(--line-soft);padding:18px 20px;font-weight:500;color:var(--ink)}
.checks li::before{content:"";flex:none;width:22px;height:22px;margin-top:2px;background:${CHECK_SVG("d4b46e")} no-repeat center/contain}
.callout{max-width:860px;margin:0 auto;background:var(--navy-900);color:var(--on-navy);padding:32px 34px;border-left:4px solid var(--gold-400);font-size:1.04rem}
.callout b{color:#fff}
.callout+*{margin-top:22px}
.typebox{max-width:860px;margin:0 auto;display:grid;gap:12px;justify-items:start;background:#fff;border:1px solid var(--line-soft);padding:32px 34px}
.typebox h3{font-size:1.55rem}
@media(min-width:760px){.typebox{grid-template-columns:1fr auto;align-items:center;column-gap:34px}.typebox .btn{grid-row:1/3;grid-column:2}}

/* result cards */
.cases{display:grid;gap:22px}
@media(min-width:860px){.cases{grid-template-columns:1fr 1fr}.case-feature{grid-column:1/-1}}
.case{background:#fff;border-left:4px solid var(--gold-500);padding:30px 24px 32px;box-shadow:0 28px 50px -36px rgba(12,26,48,.4)}
.case-amt{font-family:var(--serif);font-weight:600;font-size:clamp(2.2rem,7.4vw,3.4rem);line-height:1;color:var(--ink);font-feature-settings:"lnum";white-space:nowrap}
@media(min-width:600px){.case{padding:34px 32px 36px}}
.case-kind,.case-type{font-size:.72rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--gold-700)}
.case-kind{margin-top:12px}
.case-type{margin-top:24px}
.case-meta{margin-top:8px;font-size:.72rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.case-body{margin-top:18px;font-size:1.02rem}
.case-feature{background:var(--navy-900);border-left-color:var(--gold-400);color:var(--on-navy);padding:36px 26px 38px}
.case-feature .case-amt{color:#fff;font-size:clamp(2.35rem,9.4vw,4.3rem);white-space:nowrap}
@media(min-width:600px){.case-feature{padding:44px 40px 46px}}
.case-feature .case-kind,.case-feature .case-type{color:var(--gold-400)}
.case-feature .case-meta{color:var(--on-navy-muted)}
@media(min-width:860px){.case-feature{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:56px;align-items:center}.case-feature .case-type{margin-top:0}}

/* reviews */
.quote-hero{max-width:900px;margin:0 auto;text-align:center}
.stars5{color:var(--gold-500);font-size:1.15rem;letter-spacing:.2em}
.quote-hero blockquote{margin-top:22px;font-family:var(--serif);font-style:italic;font-weight:500;font-size:clamp(1.75rem,4.8vw,2.7rem);line-height:1.28;color:var(--ink);text-wrap:balance}
.tby{margin-top:20px;font-size:.72rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-700)}
.qcards{display:grid;gap:20px;margin-top:56px}
@media(min-width:820px){.qcards{grid-template-columns:1fr 1fr}}
.qcard{position:relative;background:#fff;border:1px solid var(--line-soft);padding:34px 32px;box-shadow:0 28px 50px -38px rgba(12,26,48,.35)}
.qcard::before{content:"\\201C";position:absolute;top:6px;right:24px;font-family:var(--serif);font-size:6.5rem;line-height:1;color:var(--gold-300)}
.qcard blockquote{position:relative;margin-top:14px;font-family:var(--serif);font-size:1.24rem;line-height:1.5;color:var(--ink)}
.ratings{display:grid;grid-template-columns:repeat(auto-fit,minmax(142px,1fr));gap:12px}
@media(min-width:760px){.ratings{gap:16px}}
.rcard{background:#fff;border:1px solid var(--line-soft);padding:24px 12px 20px;text-align:center}
.r-num{display:block;font-family:var(--serif);font-weight:700;font-size:2.8rem;line-height:1;color:var(--ink);font-feature-settings:"lnum"}
.r-stars{position:relative;display:inline-block;margin-top:10px;font-size:1.05rem;line-height:1;letter-spacing:.14em}
.r-stars::before{content:"\\2605\\2605\\2605\\2605\\2605";color:#dccfb4}
.r-stars::after{content:"\\2605\\2605\\2605\\2605\\2605";position:absolute;left:0;top:0;width:var(--pct);overflow:hidden;white-space:nowrap;color:var(--gold-500)}
.r-city{display:block;margin-top:12px;font-weight:700;letter-spacing:.04em;color:var(--ink)}
.rcard em{display:block;margin-top:4px;font-style:normal;font-size:.8rem;color:var(--muted)}

/* insider + tactics */
.insider{display:grid;gap:40px;align-items:center;max-width:1020px;margin:0 auto}
@media(min-width:880px){.insider{grid-template-columns:300px minmax(0,1fr);gap:64px}}
.frame{position:relative;max-width:300px;margin:0 auto 18px;width:100%}
.frame::before{content:"";position:absolute;inset:16px -16px -16px 16px;border:1px solid var(--gold-500)}
.frame img{position:relative;width:100%;aspect-ratio:3/4;object-fit:cover}
.insider h2{margin-top:14px}
.insider .eyebrow{justify-content:flex-start}
.insider .eyebrow::after{display:none}
.insider p.body{margin-top:18px;font-size:1.06rem}
.tactics{display:grid;gap:16px;max-width:1020px;margin:56px auto 0}
@media(min-width:760px){.tactics{grid-template-columns:1fr 1fr}}
.tactic{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.1);padding:28px 26px}
.tactic .tag{font-size:.64rem;font-weight:700;letter-spacing:.26em;text-transform:uppercase;color:var(--gold-400)}
.tactic h3{margin-top:10px;font-size:1.32rem;color:#fff}
.tactic p{margin-top:8px;font-size:.96rem}

/* numbered list */
.nlist{list-style:none;max-width:840px;margin:0 auto;counter-reset:n}
.nlist li{counter-increment:n;display:grid;grid-template-columns:62px minmax(0,1fr);gap:16px;padding:26px 0;border-top:1px solid var(--line)}
.nlist li:last-child{border-bottom:1px solid var(--line)}
.nlist li::before{content:"0" counter(n);font-family:var(--serif);font-style:italic;font-weight:500;font-size:2.3rem;line-height:1;color:var(--gold-600)}
.nlist b{display:block;font-family:var(--serif);font-size:1.3rem;color:var(--ink);margin-bottom:4px}

/* bios */
.bio{display:grid;gap:40px;align-items:center;max-width:1060px;margin:0 auto}
.bio+.bio{margin-top:96px}
@media(min-width:900px){.bio{grid-template-columns:360px minmax(0,1fr);gap:72px}.bio.flip{grid-template-columns:minmax(0,1fr) 360px}.bio.flip .frame{order:2}}
.bio .frame{max-width:360px}
.bio-name{font-family:var(--serif);font-weight:700;font-size:clamp(2.1rem,5.6vw,2.9rem);line-height:1.08;color:var(--ink)}
.bio-role{margin-top:10px;font-size:.72rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--gold-700)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 4px}
.chip{font-size:.74rem;font-weight:700;letter-spacing:.06em;color:var(--ink);background:var(--cream);border:1px solid var(--line);padding:8px 12px}
.bio p.body{margin-top:16px;font-size:1.04rem}

/* final CTA */
.final{position:relative;overflow:hidden;isolation:isolate;text-align:center;background:var(--navy-950);color:var(--on-navy);padding:92px 0 98px}
.final::before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(60% 90% at 50% 0%,rgba(201,163,90,.2),transparent 70%)}
.final p.lede{max-width:34em;margin-left:auto;margin-right:auto}

/* footer */
.ft{background:#060e1b;color:#8e99ad;font-size:.78rem;line-height:1.75;padding:50px 0 44px}
.ft .brand{margin-bottom:24px}
.ft p{max-width:920px}
.ft a{color:#b9c3d4}
.ft .legal{margin-top:16px}

/* sticky mobile call bar */
.mbar{position:fixed;left:0;right:0;bottom:0;z-index:50;display:grid;grid-template-columns:1fr 1fr;background:var(--navy-950);padding-bottom:env(safe-area-inset-bottom);box-shadow:0 -12px 30px rgba(8,18,34,.35)}
.mbar a{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px;min-height:62px;font:800 .78rem/1 var(--sans);letter-spacing:.14em;text-transform:uppercase;text-decoration:none}
.mbar-call{background:var(--gold-grad);color:var(--navy-950)}
.mbar-form{color:#fff;border-top:1px solid rgba(255,255,255,.08)}
@media(max-width:380px){.mbar svg{display:none}.mbar a{font-size:.72rem;letter-spacing:.08em;padding:0 8px}}
@media(min-width:900px){.mbar{display:none}body{padding-bottom:0}}

@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .ticker-track,.badges-track{animation:none}
  .ticker,.badges{overflow-x:auto}
  .btn-gold::after,.mbar-call::after{display:none}
  .live i{animation:none}
}`;

// ---------------------------------------------------------------- helpers
// attribute-safe: the copy below carries entities and quotes on purpose
const attr = v => String(v).replace(/"/g, "&quot;");
// element carrying both languages. data-es must only sit on elements whose
// content holds no other data-es element (the swap replaces innerHTML).
const t = (tag, en, es, cls = "", extra = "") =>
  `<${tag}${cls ? ` class="${cls}"` : ""}${extra ? " " + extra : ""} data-es="${attr(es)}">${en}</${tag}>`;

const ICON_PHONE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const ICON_FORM = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;

const BRAND = `<span class="brand"><span class="brand-name">GOLDBERG <i>&amp;</i> LOREN</span><span class="brand-sub">Injury Attorneys</span></span>`;

// Every figure here is the firm's own: the first four and $1.75M from the
// results ticker/cards on goldbergloren.com, $1,025,000 from the landers.
const TICKER = [
  ["$4,500,000", "Auto Accident", "Accidente de Auto"],
  ["$8,750,000", "Premises Liability", "Lesiones en Propiedad Ajena"],
  ["$2,500,000", "Pedestrian Accident", "Accidente Peatonal"],
  ["$1,750,000", "Wrongful Death", "Muerte por Negligencia"],
  ["$1,025,000", "Commercial Vehicle", "Vehículo Comercial"],
  ["$550M+", "Recovered Since 1994", "Recuperados Desde 1994"],
];
// four identical lists; the track slides by half, so the loop is seamless on
// screens up to ~3000px wide. Only the first list is exposed to screen readers.
const tickerList = hidden => `<ul${hidden ? ' aria-hidden="true"' : ""}>${TICKER.map(([amt, en, es]) =>
  `<li><b>${amt}</b>${t("span", en, es)}</li>`).join("")}</ul>`;
const ticker = () => `<div class="ticker" role="region" aria-label="Recent client results"><div class="ticker-track">${tickerList(false)}${tickerList(true)}${tickerList(true)}${tickerList(true)}</div></div>`;

const header = () => `<header class="hd">
  <div class="wrap hd-in">
    ${BRAND}
    <div class="hd-actions">
      <button class="lang" id="lang-toggle" type="button" aria-label="Español / English">ES</button>
      <a class="hd-call js-tel" href="tel:+15129603887"><span class="ic">${ICON_PHONE}</span><span class="hd-call-txt">${t("small", "Free Case Review · 24/7", "Evaluación Gratis · 24/7")}<strong class="js-tel-text">(512) 960-3887</strong></span></a>
    </div>
  </div>
</header>`;

const callBtn = (xl = false) => `<a class="btn btn-gold js-tel${xl ? " btn-xl" : ""}" href="tel:+15129603887">${ICON_PHONE}${t("span", "Call Now", "Llame Ahora")}<span class="num js-tel-text">(512) 960-3887</span></a>`;
const formBtn = (cls = "btn-line") => `<a class="btn ${cls} js-form-link" data-form href="car-accident.html#case-form">${t("span", "Free Case Review Online", "Evaluación Gratis en Línea")}</a>`;
const ctas = (xl = false) => `<div class="ctas">${callBtn(xl)}${formBtn()}</div>`;

const trust = () => `<ul class="trust">
      ${t("li", "No fee unless we win", "No paga si no ganamos")}
      ${t("li", "Open 24/7", "Abierto 24/7")}
      <li>Se habla español</li>
    </ul>`;

const stat = (num, en, es) => `<div class="stat"><b>${num}</b>${t("span", en, es)}</div>`;

const hero = h => `<section class="hero${h.photo ? " hero-photo" : ""}">
  ${h.photo ? `<div class="ph">${h.photo}</div>` : `<div class="hero-mark" aria-hidden="true">${h.mark}</div>`}
  <div class="wrap hero-in">
    ${h.live ? `<p class="live"><i></i>${t("span", "Intake lines open now", "Líneas abiertas ahora")}</p><br>` : ""}
    ${t("p", h.eyebrow[0], h.eyebrow[1], "eyebrow")}
    ${t("h1", h.h1[0], h.h1[1])}
    ${t("p", h.sub[0], h.sub[1], "hero-sub")}
    ${h.noCtas ? "" : ctas(h.xl)}
    ${h.after || trust()}
  </div>
</section>`;

const badges = () => `<div class="badges" role="img" aria-label="Avvo, Yelp, Google Guaranteed, HG.org and Martindale-Hubbell Distinguished 2023">
  <div class="badges-track"><img src="img/badges-strip.png" alt="" width="1251" height="103"><img src="img/badges-strip.png" alt="" width="1251" height="103"></div>
</div>`;

const section = (cls, inner) => `<section class="sec ${cls}"><div class="wrap">${inner}
</div></section>`;
const secHead = (eyebrow, h2, lede) => `<div class="sec-head">
    ${eyebrow ? t("p", eyebrow[0], eyebrow[1], "eyebrow") : ""}
    ${t("h2", h2[0], h2[1])}
    ${lede ? t("p", lede[0], lede[1], "lede") : ""}
  </div>`;
const step = (n, h, p) => `<div class="step"><span class="step-n">${n}</span>${t("h3", h[0], h[1])}${t("p", p[0], p[1])}</div>`;
const faq = (q, a) => `<details>${t("summary", q[0], q[1])}${t("p", a[0], a[1])}</details>`;

const compare = () => `<div class="compare">
    <div class="bar-row">
      <div class="bar-top">${t("span", "With a lawyer", "Con abogado")}<b>$77,600</b></div>
      <div class="bar" aria-hidden="true"><i style="width:100%"></i></div>
    </div>
    <div class="bar-row">
      <div class="bar-top">${t("span", "Without a lawyer", "Sin abogado")}<b>$17,600</b></div>
      <div class="bar dim" aria-hidden="true"><i style="width:22.7%"></i></div>
    </div>
    ${t("p", "Average recoveries reported by crash victims in a Martindale-Nolo consumer study. Individual results vary.", "Recuperaciones promedio reportadas por víctimas de accidentes en un estudio de consumidores de Martindale-Nolo. Los resultados individuales varían.", "src")}
  </div>`;

const caseCard = c => `<article class="case${c.feature ? " case-feature" : ""}">
      <div>${t("p", c.amt[0], c.amt[1], "case-amt")}${t("p", c.kind[0], c.kind[1], "case-kind")}</div>
      <div>${t("p", c.type[0], c.type[1], "case-type")}${c.meta ? t("p", c.meta[0], c.meta[1], "case-meta") : ""}${c.body ? t("p", c.body[0], c.body[1], "case-body") : ""}</div>
    </article>`;

const quote = (cls, en, es, who) => `<figure class="${cls}">
      <div class="stars5" role="img" aria-label="5 out of 5 stars">★★★★★</div>
      <blockquote>${t("p", en, es)}</blockquote>
      <figcaption>${t("div", `${who} · Google Review`, `${who} · Reseña de Google`, "tby")}</figcaption>
    </figure>`;

// ratings are baked at build time (they come from the same geo data), so they
// render without JavaScript and cannot flash in. Partial stars are drawn to the
// real value — a 4.2 shows 4.2 stars, never five.
const ratingsHTML = RATED.map(v => `<div class="rcard"><b class="r-num">${v.stars}</b><span class="r-stars" style="--pct:${(parseFloat(v.stars) * 20).toFixed(1)}%" aria-hidden="true"></span><span class="r-city">${v.city}</span>${t("em", `${v.count} Google reviews`, `${v.count} reseñas de Google`)}</div>`).join("");

const tactic = (n, h, p) => `<div class="tactic">${t("p", `Tactic ${n}`, `Táctica ${n}`, "tag")}${t("h3", h[0], h[1])}${t("p", p[0], p[1])}</div>`;

const bio = b => `<div class="bio${b.flip ? " flip" : ""}">
    <div class="frame"><img src="${b.img}" alt="${b.alt}" width="600" height="${b.h || 800}" loading="lazy"></div>
    <div>
      <h3 class="bio-name">${b.name}</h3>
      ${t("p", b.role[0], b.role[1], "bio-role")}
      <div class="chips">${b.chips.map(c => t("span", c[0], c[1], "chip")).join("")}</div>
      ${b.paras.map(p => t("p", p[0], p[1], "body")).join("\n      ")}
    </div>
  </div>`;

const finalCta = () => `<section class="final">
  <div class="wrap">
    ${t("p", "Free · Confidential", "Gratis · Confidencial", "eyebrow")}
    ${t("h2", "Find out what your case is <em>really worth.</em>", "Descubra cuánto vale <em>realmente su caso.</em>")}
    ${t("p", "A real person answers 24/7 — and you pay no attorney fee unless we recover for you.", "Una persona real contesta 24/7 — y no paga honorarios de abogado a menos que recuperemos para usted.", "lede")}
    ${ctas()}
  </div>
</section>`;

const footer = () => `<footer class="ft">
  <div class="wrap">
    ${BRAND}
    <p data-es="Publicidad de Abogados. Esta página contiene información general y no constituye asesoría legal. Contactar al bufete no crea una relación abogado-cliente. Los resultados anteriores no garantizan un resultado similar; cada caso es único. &laquo;No paga si no ganamos&raquo; significa que no hay honorarios de abogado a menos que recuperemos para usted — pueden aplicar costos judiciales y gastos del caso. Abogado responsable de este anuncio: George Z. Goldberg. Los abogados tienen licencia por estado; no todos los abogados tienen licencia en todos los estados.">Attorney Advertising. This page is for general information only and is not legal advice. Contacting the firm does not create an attorney-client relationship. Prior results do not guarantee a similar outcome; every case is unique. "No fee unless we win" means no attorney fees unless we recover for you — court costs and case expenses may apply. Attorney responsible for this advertisement: George Z. Goldberg. Attorneys are licensed by state; not all attorneys are licensed in every state.</p>
    <p class="legal">&copy; <span id="yr"></span> Goldberg &amp; Loren. <a href="privacy-policy.html" data-es="Política de Privacidad">Privacy Policy</a> &middot; <a href="terms.html" data-es="Términos de Uso">Terms of Use</a> &middot; <a href="mailto:intakes@goldbergloren.com">intakes@goldbergloren.com</a></p>
  </div>
</footer>`;

const mbar = () => `<nav class="mbar" aria-label="Contact">
  <a class="mbar-call js-tel" href="tel:+15129603887">${ICON_PHONE}${t("span", "Call Now", "Llame Ahora")}</a>
  <a class="mbar-form js-form-link" data-form href="car-accident.html#case-form">${ICON_FORM}${t("span", "Free Review", "Evaluación Gratis")}</a>
</nav>`;

// ---------------------------------------------------------------- pages
const PAGES = {
"no-fee": {
  title: "No Fee Unless We Win | Goldberg & Loren Injury Attorneys",
  desc: "You pay nothing up front and no attorney fee unless we recover money for you. Here is exactly how the contingency fee works — including the fine print.",
  hero: {
    mark: "$0",
    eyebrow: ["How We Get Paid", "Cómo Cobramos"],
    h1: ["No Fee <em>Unless We Win</em>", "No Paga <em>Si No Ganamos</em>"],
    sub: ["You pay nothing up front — ever. We front every dollar it costs to build your case, and we only collect an attorney fee if we recover money for you.",
          "Usted no paga nada por adelantado — nunca. Nosotros cubrimos cada dólar que cuesta armar su caso y solo cobramos honorarios si recuperamos dinero para usted."],
  },
  body: [
    section("sec-paper", `
  ${secHead(["The Short Version", "En Resumen"], ["What it costs you <em>to hire us today.</em>", "Lo que le cuesta <em>contratarnos hoy.</em>"])}
  <div class="zeros">
    <div class="zero"><b>$0</b>${t("span", "To call and have your case reviewed", "Para llamar y evaluar su caso")}</div>
    <div class="zero"><b>$0</b>${t("span", "Out of pocket while your case is going on", "De su bolsillo mientras su caso está en curso")}</div>
    <div class="zero"><b>$0</b>${t("span", "In attorney fees if we don't recover for you", "En honorarios si no recuperamos dinero para usted")}</div>
  </div>
  ${t("p", "<b>The fine print, plainly:</b> court costs and case expenses may apply, and they are explained clearly in your agreement before you sign anything.", "<b>La letra pequeña, en claro:</b> pueden aplicar costos judiciales y gastos del caso, y se explican claramente en su acuerdo antes de que usted firme.", "fineprint")}`),
    section("sec-cream", `
  ${secHead(["How It Works", "Cómo Funciona"], ["You focus on healing. <em>We carry the cost.</em>", "Usted se enfoca en sanar. <em>Nosotros cargamos el costo.</em>"])}
  <div class="steps">
    ${step("01", ["Free case review", "Evaluación gratuita"], ["Call or send the 60-second form. A real person hears what happened and tells you where you stand — no cost, no obligation.", "Llame o envíe el formulario de 60 segundos. Una persona real escucha qué pasó y le dice dónde está parado — sin costo ni compromiso."])}
    ${step("02", ["We front every cost", "Cubrimos todos los costos"], ["Investigators, records, experts, filing fees — we pay to build your case. You are never asked for money out of pocket while it's going on.", "Investigadores, expedientes, expertos, cuotas de presentación — pagamos para armar su caso. Nunca le pedimos dinero de su bolsillo mientras está en curso."])}
    ${step("03", ["We get paid when you do", "Cobramos cuando usted cobra"], ["Our fee comes out of the recovery. If we don't recover money for you, you owe no attorney fee.", "Nuestros honorarios salen de lo que se recupere. Si no recuperamos dinero para usted, no nos debe honorarios."])}
  </div>`),
    section("sec-navy", `
  ${secHead(["Why It's Worth It", "Por Qué Vale la Pena"], ["Represented victims recover <em>4.4× more.</em>", "Las víctimas con abogado recuperan <em>4.4 veces más.</em>"])}
  ${compare()}`),
    section("sec-paper", `
  ${secHead(["Common Questions", "Preguntas Frecuentes"], ["Straight answers <em>about the fee.</em>", "Respuestas claras <em>sobre los honorarios.</em>"])}
  <div class="faq">
    ${faq(["What if we don't win?", "¿Y si no ganamos?"], ["You owe no attorney fee. That's the point of a contingency fee — we only get paid if we recover money for you.", "No nos debe honorarios. Ese es el sentido de los honorarios de contingencia — solo cobramos si recuperamos dinero para usted."])}
    ${faq(["Are there any other costs?", "¿Hay algún otro costo?"], ["Court costs and case expenses may apply. They are explained clearly in your agreement before you sign anything.", "Pueden aplicar costos judiciales y gastos del caso. Se explican claramente en su acuerdo antes de que usted firme."])}
    ${faq(["Does the case review cost anything?", "¿La evaluación del caso cuesta algo?"], ["No. The review is free and confidential, and there is no obligation to hire us.", "No. La evaluación es gratuita y confidencial, y no hay obligación de contratarnos."])}
    ${faq(["Why would a firm work this way?", "¿Por qué un bufete trabajaría así?"], ["Because it puts us on your side of the table. We only get paid if you do, so we push for the maximum.", "Porque nos pone de su lado. Solo cobramos si usted cobra, así que buscamos el máximo."])}
  </div>`),
  ],
},
"reviews": {
  title: "Client Reviews | Goldberg & Loren Injury Attorneys",
  desc: "Real Google reviews from Goldberg & Loren injury clients, plus current client ratings by office. 20,000+ injury cases handled since 1994.",
  hero: {
    mark: "&ldquo;",
    eyebrow: ["Client Reviews", "Reseñas de Clientes"],
    h1: ["What our clients <em>say about us.</em>", "Lo que dicen <em>nuestros clientes.</em>"],
    sub: ["Reviews left by real clients on Google. We handle injury cases nationwide — here is what people say after working with our team.",
          "Reseñas dejadas por clientes reales en Google. Manejamos casos de lesiones en todo el país — esto es lo que dicen después de trabajar con nuestro equipo."],
  },
  body: [
    section("sec-paper", `
  ${quote("quote-hero", "&ldquo;Incredibly knowledgeable, great in court, and the settlement was way more than I expected.&rdquo;", "&laquo;Increíblemente conocedores, excelentes en corte, y el acuerdo fue mucho más de lo que esperaba.&raquo;", "Constance Sanchez")}
  <div class="qcards">
    ${quote("qcard", "&ldquo;I could not be more pleased with the personnel, process, and results I got from working with George Goldberg and his team.&rdquo;", "&laquo;No podría estar más satisfecha con el personal, el proceso y los resultados que obtuve trabajando con George Goldberg y su equipo.&raquo;", "Valerie Harris")}
    ${quote("qcard", "&ldquo;It was my first time needing to hire an attorney, and I was really happy with the entire process. Mr. Loren worked tirelessly for me while I recovered.&rdquo;", "&laquo;Era la primera vez que necesitaba contratar a un abogado y quedé muy contento con todo el proceso. El Sr. Loren trabajó sin descanso por mí mientras me recuperaba.&raquo;", "Charles Sanchez")}
  </div>`),
    section("sec-cream", `
  ${secHead(["Google Ratings", "Calificaciones en Google"], ["Rated by clients <em>across the country.</em>", "Calificados por clientes <em>en todo el país.</em>"], ["Google ratings for our offices with public review profiles.", "Calificaciones de Google de nuestras oficinas con perfiles públicos de reseñas."])}
  <div id="ratings" class="ratings">${ratingsHTML}</div>
  ${t("p", "Reviews are from public Google profiles and reflect those clients' experiences. Prior results do not guarantee a similar outcome; every case is unique.", "Las reseñas son de perfiles públicos de Google y reflejan la experiencia de esos clientes. Los resultados anteriores no garantizan un resultado similar; cada caso es único.", "fineprint")}`),
  ],
},
"settlements": {
  title: "Recent Settlements & Results | Goldberg & Loren",
  desc: "Real settlements Goldberg & Loren recovered for injury clients — including $8.75M and $4.5M — with the facts behind each. $550M+ recovered since 1994.",
  hero: {
    mark: "$550M+",
    noCtas: true,
    eyebrow: ["Results", "Resultados"],
    h1: ["Recent settlements that <em>speak for themselves.</em>", "Acuerdos recientes que <em>hablan por sí solos.</em>"],
    sub: ["A selection of recent recoveries for our clients. Prior results do not guarantee future outcomes.",
          "Una selección de recuperaciones recientes para nuestros clientes. Los resultados anteriores no garantizan resultados futuros."],
    after: `<div class="stats stats-3">
      ${stat("$550M+", "Recovered since 1994", "Recuperados desde 1994")}
      ${stat("20,000+", "Injury cases handled", "Casos de lesiones manejados")}
      ${stat("21", "Offices in 16 states", "Oficinas en 16 estados")}
    </div>`,
  },
  body: [
    section("sec-cream", `
  ${secHead(["Featured Results", "Resultados Destacados"], ["Real cases. <em>Real recoveries.</em>", "Casos reales. <em>Recuperaciones reales.</em>"])}
  <div class="cases">
    ${caseCard({ feature: true, amt: ["$8.75 Million", "$8.75 Millones"], kind: ["Settlement", "Acuerdo"], type: ["Premises Liability", "Lesiones en Propiedad Ajena"], meta: ["Ben Lomond, CA · August 2025", "Ben Lomond, CA · Agosto 2025"], body: ["A vendor was restocking merchandise at a store when a store employee struck her with a train of shopping carts. She suffered a herniated disc in her back from the collision.", "Una proveedora estaba reabasteciendo mercancía en una tienda cuando un empleado la golpeó con una fila de carritos de compras. Sufrió una hernia de disco en la espalda por el impacto."] })}
    ${caseCard({ amt: ["$4.5 Million", "$4.5 Millones"], kind: ["Settlement", "Acuerdo"], type: ["Auto Accident", "Accidente de Auto"], meta: ["Bonanza, OR · April 2025", "Bonanza, OR · Abril 2025"], body: ["Our client was lawfully walking on the sidewalk when a driver exiting a driveway struck and ran over her. She sustained severe injuries requiring multiple surgeries.", "Nuestra clienta caminaba legalmente por la acera cuando un conductor que salía de una entrada la atropelló. Sufrió lesiones graves que requirieron múltiples cirugías."] })}
    ${caseCard({ amt: ["$1,025,000", "$1,025,000"], kind: ["Recovery", "Recuperación"], type: ["Commercial Vehicle", "Vehículo Comercial"], body: ["The insurer insisted the policy limit was the most our client could ever get. We recovered $750,000 more than their &ldquo;maximum&rdquo; — for an 8-year-old rear-ended by a commercial vehicle.", "La aseguradora insistió en que el límite de la póliza era lo máximo que nuestro cliente podría recibir. Recuperamos $750,000 más que su &laquo;máximo&raquo; — para un niño de 8 años impactado por detrás por un vehículo comercial."] })}
    ${caseCard({ amt: ["$2.5 Million", "$2.5 Millones"], kind: ["Settlement", "Acuerdo"], type: ["Pedestrian Accident", "Accidente Peatonal"], meta: ["Settled in 193 days", "Resuelto en 193 días"] })}
    ${caseCard({ amt: ["$1.75 Million", "$1.75 Millones"], kind: ["Recovery", "Recuperación"], type: ["Wrongful Death", "Muerte por Negligencia"] })}
  </div>
  ${t("p", "Prior results do not guarantee a similar outcome. Every case is unique and results depend on the facts and the applicable law.", "Los resultados anteriores no garantizan un resultado similar. Cada caso es único y los resultados dependen de los hechos y de la ley aplicable.", "fineprint")}`),
  ],
},
"case-review": {
  title: "Free 24/7 Case Review | Goldberg & Loren Injury Attorneys",
  desc: "Talk to a real person about your injury case right now. Free, confidential, and no obligation — 24 hours a day, 7 days a week.",
  hero: {
    mark: "24/7",
    live: true,
    xl: true,
    eyebrow: ["Free &amp; Confidential", "Gratis y Confidencial"],
    h1: ["Free Case Review — <em>24/7</em>", "Evaluación Gratis — <em>24/7</em>"],
    sub: ["Call now and a real person — not a phone tree — hears what happened and tells you where you stand. Free, confidential, and no obligation.",
          "Llame ahora y una persona real — no una contestadora — escucha qué pasó y le dice dónde está parado. Gratis, confidencial y sin compromiso."],
  },
  body: [
    section("sec-paper", `
  ${secHead(["What To Expect", "Qué Esperar"], ["What happens <em>when you call.</em>", "Qué pasa <em>cuando llama.</em>"])}
  <div class="steps">
    ${step("01", ["You talk. 60 seconds.", "Usted habla. 60 segundos."], ["A real person hears what happened and tells you where you stand — free, no pressure.", "Una persona real escucha qué pasó y le dice dónde está parado — gratis, sin presión."])}
    ${step("02", ["We take it from here.", "Nosotros seguimos desde ahí."], ["Every adjuster call, every deadline, the evidence, and help coordinating your medical care.", "Cada llamada del ajustador, cada plazo, la evidencia y ayuda para coordinar su atención médica."])}
    ${step("03", ["You get paid.", "Usted recibe su pago."], ["We push for the maximum, and you owe no attorney fee unless we recover for you.", "Buscamos el máximo, y no debe honorarios a menos que recuperemos para usted."])}
  </div>`),
    section("sec-cream", `
  ${secHead(["Before You Call", "Antes de Llamar"], ["Helpful to have. <em>Not required.</em>", "Útil tenerlo. <em>No es obligatorio.</em>"], ["Missing something? That's normal — call anyway and we'll start with what you have.", "¿Le falta algo? Es normal — llame de todos modos y empezamos con lo que tenga."])}
  <ul class="checks">
    ${t("li", "The date and place of the crash", "La fecha y el lugar del accidente")}
    ${t("li", "The other driver's insurance, if you have it", "El seguro del otro conductor, si lo tiene")}
    ${t("li", "Photos of the scene, vehicles, or injuries", "Fotos del lugar, los vehículos o sus lesiones")}
    ${t("li", "Names of doctors or hospitals that treated you", "Nombres de médicos u hospitales que lo atendieron")}
    ${t("li", "Any letters or calls from an insurance adjuster", "Cartas o llamadas de algún ajustador de seguros")}
    ${t("li", "A police report number, if one was made", "El número del reporte policial, si se hizo uno")}
  </ul>`),
    section("sec-paper", `
  <div class="callout">${t("p", "<b>Before you give a recorded statement:</b> adjusters are trained to keep payouts low, and what you say can be used to cut your claim. A free review first costs you nothing.", "<b>Antes de dar una declaración grabada:</b> los ajustadores están entrenados para mantener bajos los pagos, y lo que usted diga puede usarse para reducir su reclamo. Una evaluación gratuita primero no le cuesta nada.")}</div>
  <div class="typebox">
    ${t("h3", "Prefer to type?", "¿Prefiere escribir?")}
    ${t("p", "The 60-second case review form asks three quick questions and goes straight to our intake team.", "El formulario de 60 segundos hace tres preguntas rápidas y llega directo a nuestro equipo de admisión.")}
    <a class="btn btn-navy js-form-link" data-form href="car-accident.html#case-form">${t("span", "Open the free form", "Abrir el formulario gratis")}<span aria-hidden="true">&rarr;</span></a>
  </div>`),
  ],
},
"maximize-compensation": {
  title: "Maximize Your Injury Compensation | Goldberg & Loren",
  desc: "Insurers settle low and fast by design. How Goldberg & Loren build injury cases that pay in full — and why represented victims recover 4.4x more on average.",
  hero: {
    mark: "4.4&times;",
    eyebrow: ["Getting Paid in Full", "Cobrar lo Justo"],
    h1: ["Maximize your <em>compensation.</em>", "Maximice su <em>compensación.</em>"],
    sub: ["First offers are low by design. We build the case the insurer hopes you never build — and we do it on our dime.",
          "Las primeras ofertas son bajas por diseño. Construimos el caso que la aseguradora espera que usted nunca construya — y lo hacemos con nuestro dinero."],
  },
  body: [
    section("sec-paper", `
  ${secHead(["The Numbers", "Las Cifras"], ["The first offer is <em>not the real number.</em>", "La primera oferta <em>no es la cifra real.</em>"], ["Represented crash victims recover 4.4 times more on average than those who go it alone.", "Las víctimas de accidentes con abogado recuperan en promedio 4.4 veces más que quienes lo enfrentan solos."])}
  ${compare()}`),
    section("sec-navy", `
  <div class="insider">
    <div class="frame"><img src="img/george-goldberg.jpg" alt="George Z. Goldberg, founding partner of Goldberg &amp; Loren" width="600" height="802" loading="lazy"></div>
    <div>
      ${t("p", "Inside Knowledge", "Conocimiento Interno", "eyebrow")}
      ${t("h2", "We know the insurance playbook. <em>We learned it from the inside.</em>", "Conocemos el manual de las aseguradoras. <em>Lo aprendimos desde adentro.</em>")}
      ${t("p", "Founding partner George Goldberg spent his first two years in practice defending airlines and insurance companies in injury litigation, before switching sides in 1996. He learned every delay tactic and every lowball script. When the adjuster calls with a low offer, he already knows their next three moves.", "El socio fundador George Goldberg pasó sus primeros dos años de práctica defendiendo a aerolíneas y aseguradoras en litigios por lesiones, antes de cambiar de bando en 1996. Aprendió cada táctica de demora y cada guion de ofertas bajas. Cuando el ajustador llama con una oferta baja, él ya sabe sus próximos tres movimientos.", "body")}
    </div>
  </div>
  <div class="tactics">
    ${tactic("01", ["The fast lowball", "La oferta baja y rápida"], ["An early offer arrives before you know what your injuries will cost. Signing usually ends your claim for good — even if your injuries get worse.", "Llega una oferta temprana antes de que sepa cuánto costarán sus lesiones. Firmar normalmente termina su reclamo para siempre — incluso si sus lesiones empeoran."])}
    ${tactic("02", ["The recorded statement", "La declaración grabada"], ["Friendly questions on a recorded line. What you say can be used to cut your claim.", "Preguntas amables en una línea grabada. Lo que usted diga puede usarse para reducir su reclamo."])}
    ${tactic("03", ["The long delay", "La demora larga"], ["Insurers profit by dragging cases out, hoping you'll take less just to be done.", "Las aseguradoras ganan alargando los casos, esperando que usted acepte menos solo para terminar."])}
    ${tactic("04", ["The blame shift", "Culparlo a usted"], ["They argue you were partly at fault to shrink what they owe. Don't accept their version without a review.", "Alegan que usted tuvo parte de la culpa para reducir lo que deben. No acepte su versión sin una evaluación."])}
  </div>`),
    section("sec-cream", `
  ${secHead(["Our Approach", "Nuestro Enfoque"], ["What we do that <em>raises the number.</em>", "Lo que hacemos y <em>sube la cifra.</em>"])}
  <ol class="nlist">
    ${t("li", "<div><b>Preserve the evidence</b>Before it disappears — camera footage gets erased and witnesses move.</div>", "<div><b>Preservar la evidencia</b>Antes de que desaparezca — los videos se borran y los testigos se mudan.</div>")}
    ${t("li", "<div><b>Document every loss</b>Medical bills, lost wages, future treatment, and what the crash took from your life.</div>", "<div><b>Documentar cada pérdida</b>Gastos médicos, salarios perdidos, tratamiento futuro y lo que el accidente le quitó.</div>")}
    ${t("li", "<div><b>Handle the insurer</b>Every adjuster call and every deadline, so nothing you say gets used to cut your claim.</div>", "<div><b>Manejar a la aseguradora</b>Cada llamada del ajustador y cada plazo, para que nada de lo que diga reduzca su reclamo.</div>")}
    ${t("li", "<div><b>Be ready for trial</b>When they won't pay fairly, we try the case — our senior trial partner has taken 50+ cases to verdict.</div>", "<div><b>Estar listos para juicio</b>Cuando no quieren pagar justamente, llevamos el caso a juicio — nuestro socio litigante sénior ha llevado más de 50 casos a veredicto.</div>")}
  </ol>
  <div class="callout" style="margin-top:44px">${t("p", "<b>Before you accept anything:</b> signing usually ends your claim permanently, even if your injuries get worse. A free review costs you nothing and tells you what your claim is actually worth.", "<b>Antes de aceptar algo:</b> firmar normalmente termina su reclamo de forma permanente, incluso si sus lesiones empeoran. Una evaluación gratuita no le cuesta nada y le dice cuánto vale realmente su reclamo.")}</div>`),
  ],
},
"our-team": {
  title: "Meet Your Team | Goldberg & Loren Injury Attorneys",
  desc: "Meet the Goldberg & Loren injury team: a founding partner who spent two years defending insurers, and a senior trial partner with 50+ verdicts and a CPA.",
  extraSchema: [
    { "@context": "https://schema.org", "@type": "Person", name: "George Z. Goldberg",
      jobTitle: "Founding & Managing Partner", worksFor: { "@id": ORIGIN + "/#firm" },
      image: ORIGIN + "/img/george-goldberg.jpg",
      alumniOf: [{ "@type": "CollegeOrUniversity", name: "University of Miami School of Law" },
                 { "@type": "CollegeOrUniversity", name: "Emory University" }],
      sameAs: "https://goldbergloren.com/attorney-george-goldberg/",
      description: "Founding and managing partner. Spent his first two years in practice at an aviation defense firm, defending airlines and insurance companies in injury litigation, before opening his own injury firm in 1996." },
    { "@context": "https://schema.org", "@type": "Person", name: "James M. Loren",
      jobTitle: "Senior Partner", worksFor: { "@id": ORIGIN + "/#firm" },
      image: ORIGIN + "/img/james-loren.jpg",
      sameAs: "https://goldbergloren.com/attorney-james-loren/",
      description: "Senior partner and the firm's most senior trial lawyer. 20+ years in practice with 50+ cases tried to verdict nationwide. Certified Public Accountant." }
  ],
  hero: {
    // the firm's own homepage portrait: James M. Loren (left), George Z. Goldberg (right)
    photo: `<img src="img/hero-partners.jpg" alt="James M. Loren and George Z. Goldberg, the partners of Goldberg &amp; Loren" width="2560" height="1703" fetchpriority="high">`,
    eyebrow: ["Your Team", "Su Equipo"],
    h1: ["Meet your <em>team.</em>", "Conozca a <em>su equipo.</em>"],
    sub: ["A dedicated personal injury team — one partner who used to defend insurance companies, and one who takes them to trial.",
          "Un equipo dedicado a lesiones personales — un socio que antes defendía a las aseguradoras y otro que las lleva a juicio."],
  },
  body: [
    section("sec-paper", `
  ${bio({ img: "img/george-goldberg.jpg", h: 802, alt: "George Z. Goldberg, founding and managing partner", name: "George Z. Goldberg",
          role: ["Founding &amp; Managing Partner", "Socio Fundador y Administrador"],
          chips: [["Miami Law &rsquo;94 · Magna Cum Laude", "Derecho, U. de Miami &rsquo;94 · Magna Cum Laude"], ["Plaintiffs&rsquo; attorney since 1996", "Abogado de demandantes desde 1996"], ["Former insurance defense", "Ex abogado de defensa de seguros"]],
          paras: [["George spent his first two years in practice on the other side — at an aviation defense firm, defending airlines and insurance companies in injury litigation. He learned every delay tactic and every lowball script, then switched sides and opened his own injury firm in 1996. When an adjuster calls with a low offer, he already knows their next three moves.", "George pasó sus primeros dos años de práctica del otro lado — en un bufete de defensa de aviación, defendiendo a aerolíneas y aseguradoras en litigios por lesiones. Aprendió cada táctica de demora y cada guion de ofertas bajas, luego cambió de bando y abrió su propio bufete de lesiones en 1996. Cuando un ajustador llama con una oferta baja, él ya sabe sus próximos tres movimientos."],
                  ["He earned his law degree from the University of Miami School of Law in 1994, magna cum laude, and as managing partner he still stays involved in the direction of the firm's major cases.", "Obtuvo su título de abogado en la Facultad de Derecho de la Universidad de Miami en 1994, magna cum laude, y como socio administrador sigue involucrado en la dirección de los casos principales del bufete."]] })}
  ${bio({ flip: true, img: "img/james-loren.jpg", alt: "James M. Loren, senior partner", name: "James M. Loren",
          role: ["Senior Partner · Trial Lawyer", "Socio Sénior · Abogado Litigante"],
          chips: [["50+ cases tried to verdict", "Más de 50 casos a veredicto"], ["Certified Public Accountant", "Contador Público Certificado"], ["20+ years in practice", "Más de 20 años de práctica"]],
          paras: [["When insurers still won't pay, James takes them to court. He has tried over 50 cases to verdict across the country in more than 20 years of practice, including in federal court in Texas. Adjusters track which firms fold before trial and which ones don't — this isn't a firm that folds.", "Cuando las aseguradoras aun así no quieren pagar, James las lleva a corte. Ha llevado más de 50 casos a veredicto en todo el país en más de 20 años de práctica, incluyendo en corte federal en Texas. Los ajustadores saben qué bufetes se rinden antes del juicio y cuáles no — este no es un bufete que se rinde."],
                  ["He is also a Certified Public Accountant, which matters more than it sounds: valuing a claim is an accounting problem before it is an argument — lost earnings, future treatment, life-care costs. He reads the insurer's numbers as fluently as their lawyers do.", "También es Contador Público Certificado, lo cual importa más de lo que parece: valorar un reclamo es un problema contable antes de ser un argumento — salarios perdidos, tratamiento futuro, costos de cuidado de por vida. Él lee los números de la aseguradora con la misma fluidez que sus abogados."]] })}`),
    section("sec-navy", `
  ${secHead(["The Firm Behind Them", "El Bufete Detrás de Ellos"], ["Fighting for injury victims <em>since 1994.</em>", "Luchando por víctimas de lesiones <em>desde 1994.</em>"])}
  <div class="stats stats-4" style="margin-top:0">
    ${stat("20,000+", "Injury cases handled", "Casos de lesiones manejados")}
    ${stat("$550M+", "Recovered for clients", "Recuperados para clientes")}
    ${stat("21", "Offices in 16 states", "Oficinas en 16 estados")}
    ${stat("24/7", "National intake", "Admisión nacional")}
  </div>`),
  ],
},
};

// ---------------------------------------------------------------- shell
const page = (slug, p) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="index,follow">
<meta name="theme-color" content="#081222">
${CLARITY}
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${ORIGIN}/${slug}.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Goldberg &amp; Loren Personal Injury Attorneys">
<meta property="og:url" content="${ORIGIN}/${slug}.html">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:image" content="${ORIGIN}/img/hero-partners.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.desc)}">
<meta name="twitter:image" content="${ORIGIN}/img/hero-partners.jpg">
<link rel="icon" type="image/png" href="img/favicon.png">
<link rel="preload" href="fonts/playfair-display-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/playfair-display-latin-wght-italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/dm-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<script type="application/ld+json">
${JSON.stringify(firmSchema, null, 1)}
</script>${(p.extraSchema || []).map(x => `
<script type="application/ld+json">
${JSON.stringify(x, null, 1)}
</script>`).join("")}
<style>
${CSS}
</style>
</head>
<body>
${CC_NOSCRIPT}
<a class="skip" href="#main" data-es="Saltar al contenido">Skip to content</a>
${ticker()}
${header()}
<main id="main">
${hero(p.hero)}
${badges()}
${p.body.join("\n")}
${finalCta()}
</main>
${footer()}
${mbar()}
<script type="application/json" id="geo-min">
${JSON.stringify(GEO_MIN)}
</script>
<script>
(function(){
  "use strict";
  var GEO = JSON.parse(document.getElementById("geo-min").textContent);
  var CASES = ["car-accident","truck-accident","motorcycle-accident","rideshare-accident"];
  var PAGE = "${slug}", LANG = "en";
  var q; try { q = new URLSearchParams(location.search); } catch(e) { q = null; }
  var geoSlug = "default", ct = "car-accident";
  if (q) {
    var gp = (q.get("geo") || "").toLowerCase();
    // own keys only: "constructor" or "__proto__" must not resolve to Object internals
    if (Object.prototype.hasOwnProperty.call(GEO, gp)) geoSlug = gp;
    var cp = (q.get("ct") || "").toLowerCase();
    if (CASES.indexOf(cp) > -1) ct = cp;
  }
  var g = GEO[geoSlug];

  // Re-run after every language swap: swapped markup is rebuilt from data-es,
  // which carries the default number and hrefs.
  function applyGeo(){
    var i, n;
    n = document.querySelectorAll("a.js-tel");
    for (i = 0; i < n.length; i++) n[i].href = "tel:" + g.phone;
    n = document.querySelectorAll(".js-tel-text");
    for (i = 0; i < n.length; i++) n[i].textContent = g.display;
    n = document.querySelectorAll("a.js-form-link");
    for (i = 0; i < n.length; i++)
      n[i].href = ct + ".html?geo=" + encodeURIComponent(geoSlug) + (n[i].hasAttribute("data-form") ? "#case-form" : "");
  }
  applyGeo();

  if (g.gtm) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtm.js?id=" + g.gtm;
    document.head.appendChild(s);
  }
  function track(ev){
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: ev, case_type: ct, geo: geoSlug, support_page: PAGE, lang: LANG });
  }
  document.addEventListener("click", function(e){ if (e.target.closest && e.target.closest("a.js-tel")) track("call_click"); });

  function setLang(l){
    var es = l === "es", n = document.querySelectorAll("[data-es]"), i, el;
    for (i = 0; i < n.length; i++) {
      el = n[i];
      if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.innerHTML);
      el.innerHTML = es ? el.getAttribute("data-es") : el.getAttribute("data-en");
    }
    document.documentElement.lang = es ? "es" : "en";
    document.getElementById("lang-toggle").textContent = es ? "EN" : "ES";
    LANG = l;
    applyGeo();
    try { localStorage.setItem("gl-lang", l); } catch(e){}
  }
  document.getElementById("lang-toggle").addEventListener("click", function(){ setLang(LANG === "es" ? "en" : "es"); });
  try { if (((q && q.get("lang")) || localStorage.getItem("gl-lang")) === "es") setLang("es"); } catch(e){}

  document.getElementById("yr").textContent = new Date().getFullYear();
})();
</script>
</body>
</html>
`;

for (const [slug, p] of Object.entries(PAGES)) {
  writeFileSync(slug + ".html", page(slug, p));
  console.log("built " + slug + ".html");
}

// robots.txt must NOT disallow the landers — they carry a noindex meta tag, and
// a crawler blocked by robots.txt never sees it.
writeFileSync("robots.txt", `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`);

const today = new Date().toISOString().slice(0, 10);
writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(PAGES).map(sl => `  <url>
    <loc>${ORIGIN}/${sl}.html</loc>
    <lastmod>${today}</lastmod>
  </url>`).join("\n")}
</urlset>
`);
console.log("built robots.txt + sitemap.xml");
console.log(`${Object.keys(PAGES).length} shared pages · ${Object.keys(GEO_MIN).length} geos wired · ${RATED.length} offices with real Google ratings`);
