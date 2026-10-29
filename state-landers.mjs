/**
 * Rep-style keyword landers for more states, in the design of the PPC rep's Arizona pages.
 * Not run on its own: generate-rep-landers.mjs builds these pages with the Arizona ones, through
 * the same steps (tracking, partners' photo, rental-car heading, forms, JSON-LD, title, checks).
 *
 * Each state gets what the rep gave Arizona: per area, one page per ad-group keyword (9 keywords,
 * the rep's Arizona set), at /{st}/{area}/{keyword}/, plus 7 sitelink pages at /{st}/{page}/.
 * The drafts below are written in the rep's draft format, so the build treats them exactly like
 * the rep's Arizona drafts. The page's headings carry its keyword for ad relevance:
 *   H1  the keyword and the city ("Car Accident Attorney in Nashville, TN")
 *   H2  the keyword's case type and the city in every section heading, the FAQ titled by the H1
 * Areas and keywords come from search-volume research (CAMPAIGN-URLS-PPC-REP.md lists them).
 *
 * Every legal statement cites the statute or case it rests on, and every figure its official
 * source (each page's footer lists them). PHONE: placeholder numbers in the fictional 555-01xx
 * range until the firm assigns real ones; change `phone` and `display` below and rebuild.
 */
import { readFileSync } from "node:fs";

const BASE = "https://results.goldbergloren.com/";
// the rep's Arizona draft whose stylesheet every page shares
const DESIGN = "rep-landers/az/tucson-metro/car-accident-lawyer-tucson.html";

const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>`;
const PHONE_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>`;
const esc = s => s.replace(/&(?![a-z#0-9]+;)/gi, "&amp;").replace(/"/g, "&quot;");
const cap = s => s.replace(/(^|[\s-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
const an = s => (/^[aeiou]/i.test(s) ? "an " : "a ") + s;
const first = s => s[0].toUpperCase() + s.slice(1);

export const STATES = {
  TN: {
    abbr: "TN", name: "Tennessee", slug: "tn",
    // PLACEHOLDER until the firm assigns a Tennessee number (555-0100 is reserved for fiction)
    phone: "+16155550100", display: "(615) 555-0100", phonePlaceholder: true,
    // licensed in Tennessee (Board of Professional Responsibility no. 024218)
    attorney: "George Z. Goldberg",
    gtm: "GTM-NK6KTLNL", trackFrom: "car-accident-dallas-tx.html", callTracking: "",
    law: {
      remote: "Tennessee car and truck crash claims. Free review by phone or video, 24/7.",
      officeLine: "Serving clients across Tennessee",
      faultCard: "Even partly. Under Tennessee's modified comparative fault rule, you can recover if you were less than 50% at fault; your award is reduced by your share.{s3}",
      insuranceCard: "The other driver's liability policy, and often your own uninsured motorist coverage.",
      deadlineFaq: "Usually one year from the crash to file a personal injury lawsuit (Tenn. Code Ann. § 28-3-104).{s2} Suits against a city or county generally have to be filed within 12 months too (Tenn. Code Ann. § 29-20-305). Call early.",
      faultFaq: "Tennessee uses modified comparative fault. You can recover if you were less than 50% at fault, and your award is reduced by your share (McIntyre v. Balentine, 833 S.W.2d 52 (Tenn. 1992)).{s3}",
      uninsuredFaq: "Your own uninsured motorist coverage may pay. Tennessee isn't a no-fault state, so the at-fault driver's insurer is usually the main source.",
      damagesLead: "Every case is different. These are damages Tennessee injury claims commonly include. Tennessee limits non-economic damages in most injury cases to $750,000, or $1,000,000 for catastrophic injuries (Tenn. Code Ann. § 29-39-102).{s6}",
      wrongfulDeath: "Claims for families who lost a loved one (Tenn. Code Ann. §§ 20-5-106, 20-5-107).",
      reportLine: "City police, the county sheriff or the Tennessee Highway Patrol files it.",
      deadlines: [["1 year", "To file most injury lawsuits (Tenn. Code Ann. § 28-3-104).{s2}"], ["12 months", "To sue a city or county (Tenn. Code Ann. § 29-20-305)."], ["Right away", "To preserve video, vehicle data and witness memories."]],
      faqs: [
        ["How long do I have to file a car accident claim in Tennessee?", "Usually one year from the crash (Tenn. Code Ann. § 28-3-104).{s2} Suits against a city or county generally have to be filed within 12 months too (Tenn. Code Ann. § 29-20-305)."],
        ["What if I was partly at fault?", "Tennessee uses modified comparative fault: you can recover if you were less than 50% at fault, and your award is reduced by your share (McIntyre v. Balentine, 833 S.W.2d 52 (Tenn. 1992)).{s3}"],
        ["Is Tennessee a no-fault state?", "No. Tennessee is an at-fault state, so the at-fault driver's liability insurer usually pays. Your own uninsured motorist coverage may also apply."],
        ["Does Tennessee cap injury damages?", "Non-economic damages in most injury cases are capped at $750,000, or $1,000,000 for catastrophic injuries; medical bills and lost wages aren't capped (Tenn. Code Ann. § 29-39-102).{s6}"],
      ],
      corridors: ["I-40", "I-24", "I-65", "I-75", "I-81", "I-26", "I-55", "I-840"],
      sources: {
        1: `Tennessee Department of Safety &amp; Homeland Security, Tennessee Traffic Crashes by Year, Type and County 2010–2025 (2025 data preliminary): <a href="https://www.tn.gov/content/dam/tn/safety/documents/crash_stats/Crash_Type.pdf" rel="nofollow noopener">tn.gov (PDF)</a>`,
        2: `Tenn. Code Ann. § 28-3-104 (one-year limitation for personal injury): <a href="https://law.justia.com/codes/tennessee/title-28/chapter-3/part-1/section-28-3-104/" rel="nofollow noopener">law.justia.com</a>`,
        3: `McIntyre v. Balentine, 833 S.W.2d 52 (Tenn. 1992) (modified comparative fault): <a href="https://law.justia.com/cases/tennessee/supreme-court/1992/833-s-w-2d-52-2.html" rel="nofollow noopener">law.justia.com</a>`,
        6: `Tenn. Code Ann. § 29-39-102 (non-economic damages): <a href="https://law.justia.com/codes/tennessee/title-29/chapter-39/section-29-39-102/" rel="nofollow noopener">law.justia.com</a>`,
      },
    },
    areas: [
      { slug: "nashville", name: "Nashville", city: "Nashville", kw: "nashville", second: { name: "Franklin", kw: "franklin-tn" },
        local: "From I-40, I-24, I-65, I-440 and Briley Parkway, crashes are common across Nashville, Davidson County and Franklin.",
        truckLocal: "I-40, I-24 and I-65 meet in Nashville, so drivers on the interstates and Briley Parkway share the road with heavy trucks every day.",
        report: "Metro Nashville Police or the Tennessee Highway Patrol",
        stat: "State crash data counts 8,629 injury crashes in Davidson County in 2025 (preliminary)." },
      { slug: "memphis", name: "Memphis", city: "Memphis", kw: "memphis", second: { name: "Germantown", kw: "germantown-tn" },
        local: "From I-40, I-240, I-55 and I-269, crashes are common across Memphis, Shelby County and Germantown.",
        truckLocal: "I-40 and I-55 cross the Mississippi at Memphis, so drivers on I-240 and the bridges share the road with heavy trucks every day.",
        report: "the Memphis Police Department, the Shelby County Sheriff's Office or the Tennessee Highway Patrol",
        stat: "State crash data counts 6,757 injury crashes in Shelby County in 2025 (preliminary)." },
      { slug: "knoxville", name: "Knoxville", city: "Knoxville", kw: "knoxville", second: { name: "Maryville", kw: "maryville-tn" },
        local: "From I-40, I-75, I-640, Alcoa Highway and Kingston Pike, crashes are common across Knoxville, Knox County and Maryville.",
        truckLocal: "I-40 and I-75 run together through Knoxville, so drivers on the interstates and Alcoa Highway share the road with heavy trucks every day.",
        report: "the Knoxville Police Department, the Knox County Sheriff's Office or the Tennessee Highway Patrol",
        stat: "State crash data counts 2,696 injury crashes in Knox County in 2025 (preliminary)." },
      { slug: "chattanooga", name: "Chattanooga", city: "Chattanooga", kw: "chattanooga", second: { name: "Cleveland", kw: "cleveland-tn" },
        local: "From I-24, I-75, US-27 and TN-153, crashes are common across Chattanooga, Hamilton County and Cleveland.",
        truckLocal: "I-24 and I-75 meet in Chattanooga, so drivers on the interstates and US-27 share the road with heavy trucks every day.",
        report: "the Chattanooga Police Department, the Hamilton County Sheriff's Office or the Tennessee Highway Patrol",
        stat: "State crash data counts 2,651 injury crashes in Hamilton County in 2025 (preliminary)." },
      { slug: "rutherford-county", name: "Rutherford County", city: "Murfreesboro", kw: "murfreesboro", second: { name: "Smyrna", kw: "smyrna-tn" },
        local: "From I-24, I-840 and US-231, crashes are common across Murfreesboro, Smyrna and La Vergne.",
        truckLocal: "I-24 between Nashville and Chattanooga runs through Murfreesboro, so drivers here share the road with heavy trucks every day.",
        report: "the Murfreesboro Police Department, the Rutherford County Sheriff's Office or the Tennessee Highway Patrol",
        stat: "State crash data counts 2,436 injury crashes in Rutherford County in 2025 (preliminary)." },
    ],
  },
  GA: {
    abbr: "GA", name: "Georgia", slug: "ga",
    phone: "+14045550100", display: "(404) 555-0100", phonePlaceholder: true,
    // licensed in Georgia (State Bar of Georgia, admitted 2010), as on the Arizona pages
    attorney: "James M. Loren",
    gtm: "GTM-NK6KTLNL", trackFrom: "car-accident-dallas-tx.html", callTracking: "",
    law: {
      remote: "Georgia car and truck crash claims. Free review by phone or video, 24/7.",
      officeLine: "Serving clients across Georgia",
      faultCard: "Even partly. Under Georgia's modified comparative negligence rule, you can recover if you were less than 50% at fault; your award is reduced by your share.{s3}",
      insuranceCard: "The other driver's liability policy, and often your own uninsured/underinsured motorist coverage.",
      deadlineFaq: "Usually two years from the crash to file a personal injury lawsuit (O.C.G.A. § 9-3-33).{s2} Claims against a city need written notice within six months (O.C.G.A. § 36-33-5), and against a county or the State within twelve months (O.C.G.A. §§ 36-11-1, 50-21-26). Call early.",
      faultFaq: "Georgia uses modified comparative negligence. You can recover if you were less than 50% at fault, and your award is reduced by your share (O.C.G.A. § 51-12-33).{s3}",
      uninsuredFaq: "Your own uninsured/underinsured motorist coverage may pay. Georgia isn't a no-fault state, so the at-fault driver's insurer is usually the main source.",
      damagesLead: "Every case is different. These are damages Georgia injury claims commonly include. Georgia doesn't cap compensatory damages in car crash cases; punitive damages are generally capped at $250,000, with exceptions such as drunk driving (O.C.G.A. § 51-12-5.1).{s6}",
      wrongfulDeath: "Claims for families who lost a loved one (O.C.G.A. § 51-4-2).",
      reportLine: "City or county police, the sheriff or the Georgia State Patrol files it.",
      deadlines: [["2 years", "To file most injury lawsuits (O.C.G.A. § 9-3-33).{s2}"], ["6 months", "To give a city written notice of a claim (O.C.G.A. § 36-33-5)."], ["Right away", "To preserve video, vehicle data and witness memories."]],
      faqs: [
        ["How long do I have to file a car accident claim in Georgia?", "Usually two years from the crash (O.C.G.A. § 9-3-33).{s2} Claims against a city need written notice within six months (O.C.G.A. § 36-33-5), and against a county or the State within twelve months (O.C.G.A. §§ 36-11-1, 50-21-26)."],
        ["What if I was partly at fault?", "Georgia uses modified comparative negligence: you can recover if you were less than 50% at fault, and your award is reduced by your share (O.C.G.A. § 51-12-33).{s3}"],
        ["Is Georgia a no-fault state?", "No. Georgia is an at-fault state, so the at-fault driver's liability insurer usually pays. Your own uninsured/underinsured motorist coverage may also apply."],
        ["Does Georgia cap injury damages?", "Georgia doesn't cap compensatory damages in car crash cases. Punitive damages are generally capped at $250,000, with exceptions such as drunk driving (O.C.G.A. § 51-12-5.1).{s6}"],
      ],
      corridors: ["I-75", "I-85", "I-20", "I-16", "I-95", "I-285", "I-575", "I-985"],
      sources: {
        2: `O.C.G.A. § 9-3-33 (two-year limitation for personal injury): <a href="https://law.justia.com/codes/georgia/title-9/chapter-3/article-2/section-9-3-33/" rel="nofollow noopener">law.justia.com</a>`,
        3: `O.C.G.A. § 51-12-33 (comparative negligence): <a href="https://law.justia.com/codes/georgia/title-51/chapter-12/article-2/section-51-12-33/" rel="nofollow noopener">law.justia.com</a>`,
        6: `O.C.G.A. § 51-12-5.1 (punitive damages): <a href="https://law.justia.com/codes/georgia/title-51/chapter-12/article-1/section-51-12-5-1/" rel="nofollow noopener">law.justia.com</a>`,
      },
    },
    areas: [
      { slug: "atlanta", name: "Atlanta", city: "Atlanta", kw: "atlanta", second: { name: "Decatur", kw: "decatur-ga" },
        local: "From I-75, I-85, I-20, I-285, GA-400 and the Downtown Connector, crashes are common across Atlanta, Decatur and the metro area.",
        truckLocal: "I-75, I-85 and I-20 meet in Atlanta and I-285 rings it, so drivers here share the road with heavy trucks every day.",
        report: "the Atlanta Police Department, county police or the Georgia State Patrol" },
      { slug: "cobb-county", name: "Cobb County", city: "Marietta", kw: "marietta", second: { name: "Kennesaw", kw: "kennesaw" },
        local: "From I-75, I-285, I-575 and Cobb Parkway, crashes are common across Marietta, Kennesaw and Smyrna.",
        truckLocal: "I-75 and I-575 carry freight through Cobb County, so drivers around Marietta share the road with heavy trucks every day.",
        report: "the Marietta Police Department, the Cobb County Police Department or the Georgia State Patrol" },
      { slug: "gwinnett-county", name: "Gwinnett County", city: "Lawrenceville", kw: "lawrenceville", second: { name: "Duluth", kw: "duluth-ga" },
        local: "From I-85, I-985, GA-316 and Peachtree Industrial Boulevard, crashes are common across Lawrenceville, Duluth and Gwinnett County.",
        truckLocal: "I-85 and I-985 carry freight through Gwinnett County, so drivers around Lawrenceville and Duluth share the road with heavy trucks every day.",
        report: "the Gwinnett County Police Department, city police or the Georgia State Patrol" },
      { slug: "north-fulton", name: "North Fulton", city: "Alpharetta", kw: "alpharetta", second: { name: "Roswell", kw: "roswell-ga" },
        local: "From GA-400, Holcomb Bridge Road and Old Milton Parkway, crashes are common across Alpharetta, Roswell and Milton.",
        truckLocal: "GA-400 carries commuters and delivery trucks through Alpharetta and Roswell every day.",
        report: "the Alpharetta Department of Public Safety, the Roswell Police Department or the Georgia State Patrol" },
      { slug: "augusta", name: "Augusta", city: "Augusta", kw: "augusta", second: { name: "Evans", kw: "evans-ga" },
        local: "From I-20, I-520 and Washington Road, crashes are common across Augusta, Evans and Martinez.",
        truckLocal: "I-20 between Atlanta and Columbia, South Carolina runs through Augusta, so drivers here share the road with heavy trucks every day.",
        report: "the Richmond County Sheriff's Office or the Georgia State Patrol" },
      { slug: "macon", name: "Macon", city: "Macon", kw: "macon", second: { name: "Warner Robins", kw: "warner-robins" },
        local: "From I-75, I-16 and I-475, crashes are common across Macon, Warner Robins and Middle Georgia.",
        truckLocal: "I-75 and I-16 meet in Macon, so drivers in Middle Georgia share the road with heavy trucks every day.",
        report: "the Bibb County Sheriff's Office, the Warner Robins Police Department or the Georgia State Patrol" },
      { slug: "savannah", name: "Savannah", city: "Savannah", kw: "savannah", second: { name: "Pooler", kw: "pooler-ga" },
        local: "From I-16, I-95, the Truman Parkway and US-80, crashes are common across Savannah, Pooler and Chatham County.",
        truckLocal: "Trucks serving the Port of Savannah fill I-16 and I-95, so drivers around Savannah and Pooler share the road with them every day.",
        report: "the Savannah Police Department, the Chatham County Police Department or the Georgia State Patrol" },
      { slug: "athens", name: "Athens", city: "Athens", kw: "athens-ga", second: { name: "Watkinsville", kw: "watkinsville" },
        local: "From the Athens Perimeter (Loop 10), US-78, US-441 and GA-316, crashes are common across Athens, Clarke County and Watkinsville.",
        truckLocal: "GA-316 and US-441 carry trucks through Athens, so drivers on the Perimeter share the road with them every day.",
        report: "the Athens-Clarke County Police Department or the Georgia State Patrol" },
    ],
  },
};

// the rep's Arizona keyword set, per area: the city, the secondary city, and near-me
const keywords = a => [
  { keyword: `auto-accident-lawyer-${a.kw}`, noun: "auto accident", who: "lawyer" },
  { keyword: `car-accident-attorney-${a.kw}`, noun: "car accident", who: "attorney" },
  { keyword: "car-accident-attorney-near-me", noun: "car accident", who: "attorney", near: true },
  { keyword: `car-accident-lawyer-${a.kw}`, noun: "car accident", who: "lawyer" },
  { keyword: "car-accident-lawyer-near-me", noun: "car accident", who: "lawyer", near: true },
  { keyword: `car-accident-lawyer-${a.second.kw}`, noun: "car accident", who: "lawyer", second: true },
  { keyword: `semi-truck-accident-lawyer-${a.kw}`, noun: "semi-truck accident", who: "lawyer", truck: true },
  { keyword: "truck-accident-attorney-near-me", noun: "truck accident", who: "attorney", truck: true, near: true },
  { keyword: `truck-accident-lawyer-${a.kw}`, noun: "truck accident", who: "lawyer", truck: true },
];
const SITELINKS = ["about-goldberg-loren", "{state}-car-accident-faqs", "free-case-review", "injuries-we-handle",
  "no-fee-unless-we-win", "truck-accident-claims", "what-to-do-after-a-crash"];

export function statePages() {
  const out = [];
  for (const [group, S] of Object.entries(STATES)) {
    for (const a of S.areas)
      for (const k of keywords(a)) {
        const dir = `${S.slug}/${a.slug}/${k.keyword}`;
        out.push({ group, kind: "keyword", design: "simple", area: a.slug, areaName: a.name, keyword: k.keyword, dir, url: `${dir}/`,
          cs: k.truck ? "truck-accident" : "car-accident", geo: `${S.slug}-${a.slug}`, variant: `${S.slug}-${a.slug}-${k.keyword}`,
          src: "state-landers.mjs", draft: () => keywordDraft(S, a, k, `${dir}/`) });
      }
    for (const t of SITELINKS) {
      const page = t.replace("{state}", S.name.toLowerCase()), dir = `${S.slug}/${page}`;
      out.push({ group, kind: "sitelink", design: "simple", page, dir, url: `${dir}/`, cs: /truck/.test(page) ? "truck-accident" : "car-accident",
        geo: S.slug, variant: `${S.slug}-${page}`, src: "state-landers.mjs", draft: () => sitelinkDraft(S, t.replace("{state}-", ""), `${dir}/`) });
    }
  }
  return out;
}

// ---- shared pieces, in the rep's draft markup

const css = () => readFileSync(DESIGN, "utf8").match(/<style>[\s\S]*?<\/style>/)[0];
const legalJson = S => JSON.stringify({ "@context": "https://schema.org", "@graph": [{ "@type": "LegalService",
  name: "Goldberg & Loren, Personal Injury Attorneys", url: "https://goldbergloren.com/", telephone: S.phone,
  address: { "@type": "PostalAddress", streetAddress: "211 Ranch Rd 620 S, Suite #230", addressLocality: "Lakeway", addressRegion: "TX", postalCode: "78734", addressCountry: "US" },
  areaServed: { "@type": "State", name: S.name }, knowsLanguage: ["en", "es"] }] });
const head = (S, { title, desc, url, depth, preload }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex,nofollow">
<link rel="canonical" href="${BASE}${url}">
${preload ? `<link rel="preload" as="image" href="${depth}assets/gl-logo.svg">\n` : ""}<script type="application/ld+json">${legalJson(S)}</script>
${css()}</head>
<body>`;
const header = (S, depth) => `<header><div class="w"><a href="#top"><img src="${depth}assets/gl-logo.svg" width="204" height="30" alt="Goldberg &amp; Loren, Injury Attorneys"></a>
<a class="hphone" href="tel:${S.phone}"><small>Free · Open 24/7</small>${S.display}</a><a class="hcall" href="tel:${S.phone}">CALL NOW</a></div></header>`;
const callband = S => `<a class="callband" href="tel:${S.phone}"><span class="ring">${PHONE_ICON}</span><span><small>Tap to call · Open 24/7 · Free</small><b>${S.display}</b></span></a>`;
const fields = (id, truck) => ` <div class="row"><label class="sr" for="${id}-fn">First name</label><input id="${id}-fn" placeholder="First name" autocomplete="given-name"><label class="sr" for="${id}-ln">Last name</label><input id="${id}-ln" placeholder="Last name" autocomplete="family-name"></div>
 <div class="row"><label class="sr" for="${id}-ph">Mobile phone</label><input id="${id}-ph" type="tel" inputmode="tel" placeholder="Mobile phone" autocomplete="tel"><label class="sr" for="${id}-zip">ZIP code</label><input id="${id}-zip" inputmode="numeric" placeholder="ZIP code" autocomplete="postal-code"></div>
 <label class="sr" for="${id}-em">Email</label><input id="${id}-em" type="email" placeholder="Email (optional)" autocomplete="email">
 <label class="sr" for="${id}-ct">Case type</label><select id="${id}-ct"><option${truck ? "" : " selected"}>Car accident</option><option${truck ? " selected" : ""}>Truck / 18-wheeler accident</option><option>Motorcycle accident</option><option>Pedestrian or bicycle</option><option>Rideshare (Uber/Lyft)</option><option>Other injury</option></select>
 <label class="sr" for="${id}-d">What happened</label><textarea id="${id}-d" placeholder="Briefly, what happened? (optional)"></textarea>
 <p class="consent">By submitting, you agree Goldberg &amp; Loren may call or text the number above about your case, including by automated means. Consent isn't required to hire us. Msg &amp; data rates may apply; reply STOP to opt out. Submitting this form does not create an attorney-client relationship. <a href="https://goldbergloren.com/privacy-policy/">Privacy Policy</a></p>
 <button class="btn gold" type="submit">See if I have a case →</button>`;
const form = (id, title, lead, truck) => ` <form class="f" id="${id}" onsubmit="return false" aria-label="${esc(title)}">
 <h2>${title}</h2><p class="fs">${lead}</p>
${fields(id, truck)}
</form>`;
const checks = items => `<ul class="checks">${items.map(t => `<li>${CHECK}${t}</li>`).join("")}</ul>`;
// footnotes: copy carries {sN} tokens; a page cites the sources it has and lists only those
function footnotes(html, src) {
  const order = [];
  html = html.replace(/\{s(\d)\}/g, (_, n) => {
    if (!src[n]) return "";
    if (!order.includes(n)) order.push(n);
    return `<sup><a href="#s${n}">${order.indexOf(n) + 1}</a></sup>`;
  });
  return html.replace("<!--SOURCES-->", order.map(n => `<li id="s${n}">${src[n]}</li>`).join(""));
}
const footer = (S, depth) => `<footer><div class="w">
 <img src="${depth}assets/gl-logo.svg" width="163" height="24" alt="Goldberg &amp; Loren">
 <p>Goldberg &amp; Loren, Personal Injury Attorneys · Principal office: 211 Ranch Rd 620 S, Suite #230, Lakeway, TX 78734 · ${S.law.officeLine} · <a href="tel:${S.phone}">${S.display}</a> · intakes@goldbergloren.com</p>
 <p>Attorney Advertising. Attorney responsible for this advertisement: ${S.attorney}. This page is general information, not legal advice. Prior results do not guarantee a similar outcome. "No fee unless we win" means no attorney fee unless we recover for you; case expenses may apply.${S.law.adNotice ? " " + S.law.adNotice : ""} · <a href="https://goldbergloren.com/privacy-policy/">Privacy Policy</a> · © 2026</p>
 <p style="margin-bottom:0">Sources:</p><ol class="srcs"><!--SOURCES--></ol>
</div></footer>
<div class="mbar"><a class="btn gold" href="tel:${S.phone}">${PHONE_ICON}Call free 24/7</a><a class="btn nav" href="#case-form">Free review</a></div>
</body></html>`;
const TRUST = `<div class="trust"><div class="w">
 <div class="t"><b>$550M+</b><span>recovered since 1994</span></div>
 <div class="t"><b>20,000+</b><span>injury cases handled</span></div>
 <div class="t"><b>30+ yrs</b><span>fighting insurers</span></div>
 <div class="t"><b>50+</b><span>trials to verdict</span></div>
</div></div>`;
// the firm's published reviews (the live landers'), from Texas clients; the build labels them so
const REVIEWS = `<div class="revs">
  <div class="rev"><div class="st">★★★★★</div><p>"Incredibly knowledgeable, great in court, and the settlement was way more than I expected."</p><small>Constance Sanchez · Client review</small></div>
  <div class="rev"><div class="st">★★★★★</div><p>"I could not be more pleased with the personnel, process, and results I got from working with George Goldberg and his team."</p><small>Valerie Harris · Client review</small></div>
  <div class="rev"><div class="st">★★★★★</div><p>"It was my first time needing to hire an attorney, and I was really happy with the entire process. Mr. Loren worked tirelessly for me while I recovered."</p><small>Charles Sanchez · Client review</small></div>
 </div>`;

// federal trucking rules every truck page leans on
const FEDERAL = {
  4: `49 CFR Parts 390–396 (Federal Motor Carrier Safety Regulations): <a href="https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B" rel="nofollow noopener">ecfr.gov</a>`,
  5: `49 CFR § 387.9 (minimum financial responsibility, $750,000 for general freight): <a href="https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-387/subpart-A/section-387.9" rel="nofollow noopener">ecfr.gov</a>`,
};

// ---- one page per keyword

function keywordDraft(S, a, k, url) {
  const L = S.law, depth = "../../";
  const city = k.second ? a.second.name : a.city;
  const where = `${city}, ${S.abbr}`;
  const Noun = cap(k.noun), Who = cap(k.who), kw = `${k.noun} ${k.who}`;
  const h1 = k.near ? `${Noun} ${Who} Near Me in ${where}` : `${Noun} ${Who} in ${where}`;
  const crash = k.truck ? "truck crash" : k.noun;
  const desc = k.near
    ? `Looking for ${an(kw)} near you in ${where}? Talk to Goldberg &amp; Loren free, by phone or video, 24/7. No fee unless we win.`
    : `Hurt in ${an(crash)} in ${where}? ${first(an(kw))} at Goldberg &amp; Loren can take on the insurer for you. Free review, no fee unless we win. Call 24/7.`;
  const sub = k.near
    ? `Looking for ${an(kw)} near you? You don't need to drive to an office: we meet ${a.city}-area clients by phone or video, 24/7.`
    : `Hurt in ${an(crash)} in ${where}? Talk to a Goldberg &amp; Loren ${kw} today. Free, 24/7.`;
  const local = `${k.truck ? a.truckLocal : a.local}${a.stat ? " " + a.stat + "{s1}" : ""}`;
  const steps = k.truck
    ? [["Call 911 and get checked out.", "Truck-crash injuries are often worse than they first feel."], ["Photograph the truck.", "Get the company name, USDOT number and trailer number."],
       ["Get the crash report.", `It's usually filed by ${a.report}. We can get it for you.`], ["Don't talk to the trucking company's insurer", "or sign anything they send."],
       ["Keep every bill and receipt,", "and track the work you miss."], ["Call a lawyer fast.", "We can send a preservation letter for the truck's ECM data and driver logs."]]
    : [["Call 911 and get checked out.", "Go to the ER or urgent care, even if you feel okay."], ["Take photos.", "Cars, plates, the scene, your injuries. Get witness names."],
       ["Get the crash report.", `It's usually filed by ${a.report}. We can get it for you.`], ["Don't give a recorded statement", "to the other driver's insurance company."],
       ["Keep every bill and receipt,", "and track the days of work you miss."], ["Talk to a lawyer before you sign anything.", "A release ends your claim."]];
  const chips = k.truck
    ? ["Jackknife crashes", "Rollovers", "Underride collisions", "Rear-ended by a semi", "Wide-turn &amp; blind-spot crashes", "Tire blowouts &amp; brake failure", "Unsecured or shifting cargo", "Delivery &amp; box trucks"]
    : ["Rear-end crashes", "Intersection &amp; T-bone", "Head-on collisions", "Highway pileups", "Hit-and-run / uninsured driver", "Uber, Lyft &amp; delivery drivers", "Drunk or distracted drivers", "Work-zone crashes"];
  const faqs = [
    k.near ? [`Do I need ${an(kw)} near me?`, `Not necessarily. What matters is a lawyer who knows ${S.name} law and answers fast. We meet ${a.city}-area clients by phone or video, 24/7, so you don't have to travel. ${S.name} cases are handled by attorney ${S.attorney}.`]
           : ["Do I have to come to an office?", `No. We meet ${a.city}-area clients by phone or video, 24/7, so you don't have to travel. ${S.name} cases are handled by attorney ${S.attorney}.`],
    [`How long do I have to file a claim in ${S.name}?`, L.deadlineFaq],
    ["What if I was partly at fault?", L.faultFaq],
    k.truck ? ["Who can be held responsible for a truck crash?", `Possibly the driver, the motor carrier, the trailer or cargo loader, or a maintenance company. Federal rules on driver hours and inspections (49 CFR Parts 390–396) often matter.{s4}`]
            : ["What if the other driver had no insurance?", L.uninsuredFaq],
    ["What does it cost?", "Nothing up front. The case review is free, and we only collect a fee if we recover money for you. Case expenses are explained before you sign."],
  ];
  return footnotes(`${head(S, { title: `${h1} | Free Case Review 24/7 | Goldberg & Loren`, desc, url, depth, preload: true })}
<!-- ${S.abbr} SKAG page for keyword "${k.keyword.replace(/-/g, " ")}" (${a.name}). Drafted by state-landers.mjs. -->
${header(S, depth)}
<main id="top">
<section class="hero"><div class="w"><div class="box">
 <div>
  <div class="pitch">
   <img src="${depth}assets/george-goldberg.jpg" width="300" height="401" alt="George Z. Goldberg, founding partner, Goldberg &amp; Loren" fetchpriority="high">
   <div>
    <span class="stat">$550M+ recovered since 1994</span>
    <h1>${h1}</h1>
    <p class="sub">${sub}</p>
    ${checks(["No fee unless we win", "Phone &amp; video consultations", "Se habla español"])}
   </div>
  </div>
  <p class="local">${local}</p>
 </div>
 ${callband(S)}
${form("case-form", `Free ${city} ${Noun} Review`, "Takes about a minute. No obligation.", k.truck)}
</div></div></section>
${TRUST}

<section class="s"><div class="w">
 <h2 class="h">Do You Have ${an(`${city} ${Noun}`)} Case?</h2>
 <p class="lead">Most strong claims have three things in common.</p>
 <div class="g3"><div class="card"><div class="ic">1</div><b>You were hurt</b><p>Injuries, medical bills, missed work or a wrecked vehicle. Even if pain showed up days later.</p></div><div class="card"><div class="ic">2</div><b>Someone else was at fault</b><p>${L.faultCard}</p></div><div class="card"><div class="ic">3</div>${k.truck
    ? `<b>There's a trucking company to pay</b><p>Interstate carriers must carry at least $750,000 in liability coverage, far more than a car driver.{s5}</p>`
    : `<b>There's insurance to pay</b><p>${L.insuranceCard}</p>`}</div></div>
 <a class="btn gold cta-inline" href="#case-form">Find out free →</a>
</div></section>

<section class="s alt"><div class="w">
 <h2 class="h">What to Do After ${an(k.truck ? "Truck Crash" : Noun)} in ${city}</h2>
 <p class="lead">Short on time? Do these, then call us. We handle the rest.</p>
 <ol class="steps">${steps.map(([b, t]) => `<li><span><b>${b}</b> ${t}</span></li>`).join("")}</ol>
</div></section>

<section class="s"><div class="w">
 <h2 class="h">${k.truck ? "Truck Crashes" : `${Noun}s`} Our ${city} ${Who}s Handle</h2>
 <ul class="chips">${chips.map(c => `<li>${c}</li>`).join("")}</ul>
</div></section>

<section class="s alt"><div class="w">
 <h2 class="h">What ${an(`${S.name} ${k.truck ? "Truck Accident" : Noun}`)} Claim Can Recover</h2>
 <p class="lead">${L.damagesLead}</p>
 <div class="g3 dm"><div class="card"><b>Medical bills</b><p>ER, surgery, therapy and the care you'll need in the future.</p></div><div class="card"><b>Lost wages</b><p>Time missed from work, and lost earning ability if you can't go back.</p></div><div class="card"><b>Pain &amp; suffering</b><p>Physical pain, emotional distress and loss of enjoyment of life.</p></div><div class="card"><b>Permanent injury &amp; scarring</b><p>Lasting impairment or disfigurement.</p></div><div class="card"><b>Property damage</b><p>Repair or replacement of your vehicle, plus a rental.</p></div><div class="card"><b>Wrongful death</b><p>${L.wrongfulDeath}</p></div></div>
</div></section>

<section class="s"><div class="w">
 <h2 class="h">What Our Clients Say</h2>
 ${REVIEWS}
 <p style="font-size:12.5px;color:var(--slate)">Results depend on each case's facts.</p>
</div></section>

<section class="fee" id="start"><div class="w">
 <div><p class="big">No fee<br><em>unless we win.</em></p><p>You pay nothing up front. We only get paid if we recover money for you.</p><p style="color:var(--gold-light);font-weight:700">Call ${S.display} · Open 24/7 · Se habla español</p></div>
${form("case-form-2", `Talk to ${an(`${city} ${Noun} ${Who}`)}`, "Tell us a little about what happened. A real person will reach out.", k.truck)}
</div></section>

<section class="s faq"><div class="w" style="max-width:860px">
 <h2 class="h">${h1}: FAQs</h2>
 ${faqs.map(([q, a2]) => `<details><summary>${q}</summary><p>${a2}</p></details>`).join("")}
</div></section>
</main>
${footer(S, depth)}`, { ...L.sources, ...FEDERAL, 1: a.stat ? a.statSource || L.sources[1] : null });
}

// ---- sitelink pages

function sitelinkDraft(S, t, url) {
  const L = S.law, depth = "../";
  const P = SITELINK_PAGES[t](S);
  return footnotes(`${head(S, { title: `${P.title} | Goldberg & Loren`, desc: P.desc, url, depth, preload: false })}
<!-- ${S.abbr} sitelink page "${P.title}". Drafted by state-landers.mjs. -->
${header(S, depth)}
<main id="top">
<section class="hero"><div class="w"><div class="box">
 <div><div class="pitch"><img src="${depth}assets/george-goldberg.jpg" width="300" height="401" alt="George Z. Goldberg, founding partner, Goldberg &amp; Loren">
  <div><span class="stat">$550M+ recovered since 1994</span><h1>${P.title}</h1><p class="sub">${P.desc}</p>
  ${checks(["No fee unless we win", "Phone &amp; video consultations", "Se habla español"])}</div></div>
  <p class="local">${L.remote}</p></div>
 ${callband(S)}
${form("case-form", `Free ${S.name} Accident Review`, "Takes about a minute. No obligation.", t === "truck-accident-claims")}
</div></div></section>
${P.body}
</main>
${footer(S, depth)}`, { ...L.sources, ...FEDERAL, 1: null });
}

// ---- sitelink pages: the rep's Arizona set, with each state's own facts

const cta = `<a class="btn gold cta-inline" href="#case-form">Get my free review →</a>`;
const cards = list => `<div class="g3">${list.map(([b, t]) => `<div class="card"><b>${b}</b><p>${t}</p></div>`).join("")}</div>`;
const SITELINK_PAGES = {
  "about-goldberg-loren": S => ({ title: `About Goldberg &amp; Loren in ${S.name}`, desc: `Personal injury lawyers since 1994, now helping ${S.name} crash victims.`,
    body: `<section class="s"><div class="w"><h2 class="h">Who We Are</h2>${cards([["Since 1994", "Founded by George Z. Goldberg."], ["$550M+ recovered", "For injured clients."], ["20,000+ cases", "Injury cases handled."]])}${cta}</div></section><section class="s alt"><div class="w"><h2 class="h">How We Work With ${S.name} Clients</h2><p class="lead">We meet ${S.name} clients by phone or video, 24/7, and deal with the insurance companies for you. ${S.name} cases are handled by attorney ${S.attorney}.</p>${cta}</div></section>` }),
  "car-accident-faqs": S => ({ title: `${S.name} Car Accident FAQs`, desc: `Straight answers about deadlines, fault and insurance in ${S.name}.`,
    body: `<section class="s faq"><div class="w"><h2 class="h">${S.name} Car Accident Questions</h2><div class="faq">${S.law.faqs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}<details><summary>Do I have to come to an office?</summary><p>No. We meet ${S.name} clients by phone or video, 24/7. ${S.name} cases are handled by attorney ${S.attorney}.</p></details><details><summary>What does it cost?</summary><p>Nothing up front. We only collect a fee if we recover money for you. Case expenses are explained before you sign.</p></details></div>${cta}</div></section>` }),
  "free-case-review": S => ({ title: `Free ${S.name} Accident Case Review`, desc: `Hurt in a ${S.name} crash? Tell us what happened. A real person reviews it and calls you back, free.`,
    body: `<section class="s"><div class="w"><h2 class="h">How the Free Review Works</h2><p class="lead">Three short steps, no obligation.</p>${cards([["1. Tell us what happened", "Use the form or call. It takes about a minute."], ["2. We review it", "We look at fault, insurance and your injuries."], ["3. You decide", "If we can help, we explain your options. No pressure."]])}${cta}</div></section>` }),
  "injuries-we-handle": S => ({ title: `${S.name} Crash Injuries We Handle`, desc: `Serious or "minor," crash injuries can change your life. Find out what your ${S.name} claim may be worth.`,
    body: `<section class="s"><div class="w"><h2 class="h">Common Crash Injuries</h2>${cards([["Neck &amp; back injuries", "Whiplash, herniated discs, spinal damage."], ["Traumatic brain injury", "Concussions and lasting cognitive harm."], ["Broken bones", "Fractures that may need surgery or hardware."], ["Spinal cord injury", "Paralysis and long-term care needs."], ["Burns &amp; scarring", "Permanent disfigurement."], ["Wrongful death", S.law.wrongfulDeath]])}${cta}</div></section>` }),
  "no-fee-unless-we-win": S => ({ title: `No Fee Unless We Win in ${S.name}`, desc: `${S.name} crash victims pay nothing up front. We only get paid if we recover money for you.`,
    body: `<section class="s"><div class="w"><h2 class="h">How Our Contingency Fee Works</h2>${cards([["$0 to start", "No retainer and no hourly bills."], ["Paid from the recovery", "Our fee is a percentage of what we recover, agreed in writing."], ["Case expenses explained", "We explain how costs are handled before you sign."]])}${cta}</div></section>` }),
  "truck-accident-claims": S => ({ title: `${S.name} Truck Accident Claims`, desc: `Hit by a semi, box truck or delivery van in ${S.name}? Trucking companies move fast. So do we.`,
    body: `<section class="s"><div class="w"><h2 class="h">Why Truck Claims Are Different</h2><p class="lead">More parties, more insurance, more evidence to protect.</p>${cards([["Several possible defendants", "Driver, motor carrier, cargo loader or maintenance company."], ["Federal safety rules", "Hours-of-service and inspection rules (49 CFR Parts 390–396) can show fault.{s4}"], ["Data that can disappear", "ECM \"black box\" data and driver logs. A preservation letter helps keep them."]])}${cta}</div></section><section class="s alt"><div class="w"><h2 class="h">${S.name} Truck Corridors</h2><ul class="chips">${S.law.corridors.map(c => `<li>${c}</li>`).join("")}</ul>${cta}</div></section>` }),
  "what-to-do-after-a-crash": S => ({ title: `What To Do After a Car Accident in ${S.name}`, desc: `Crashed in ${S.name}? Do these six things, then call us. We handle the rest.`,
    body: `<section class="s"><div class="w"><h2 class="h">6 Steps After ${an(S.name)} Crash</h2><p class="lead">Short on time? Start at the top.</p><ol class="steps"><li><span><b>Call 911 and get checked out.</b> Go to the ER or urgent care, even if you feel okay.</span></li><li><span><b>Take photos.</b> Vehicles, plates, the scene and your injuries. Get witness names.</span></li><li><span><b>Get the crash report.</b> ${S.law.reportLine} We can request it.</span></li><li><span><b>Don't give a recorded statement</b> to the other driver's insurer.</span></li><li><span><b>Keep every bill and receipt</b>, and track the work you miss.</span></li><li><span><b>Talk to a lawyer before you sign anything.</b> A release ends your claim.</span></li></ol>${cta}</div></section><section class="s alt"><div class="w"><h2 class="h">${S.name} Deadlines to Know</h2>${cards(S.law.deadlines)}${cta}</div></section>` }),
};

