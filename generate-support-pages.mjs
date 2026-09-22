#!/usr/bin/env node
/**
 * Builds the shared support pages used as Google Ads sitelink destinations.
 *   node generate-support-pages.mjs
 * Shared, not per-city: the phone number, GTM container and "return to lander"
 * CTA adapt at runtime from ?geo=<slug> and ?ct=<case-type>, so one page serves
 * every market while CallRail still sees the right number. ?lang=es switches
 * the page to Spanish. Geo data is read from car-accident.html so numbers and
 * containers have exactly one source of truth.
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
const RATED = Object.entries(GEO_MIN).filter(([, v]) => v.stars).length;

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

const CSS = `:root{--ink:#152036;--navy:#153b66;--btn:#0f766e;--btn-dk:#0c5f59;--paper:#fff;--soft:#f7fafc;--line:#dfe6ee;--slate:#5b6b7f;--gold:#d9a520;
--font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--font);color:var(--ink);background:var(--paper);font-size:17px;line-height:1.62;-webkit-font-smoothing:antialiased}
a{color:var(--btn)}
.hd{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:10}
.hd-in{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px;max-width:900px;margin:0 auto}
.logo{text-decoration:none;line-height:1.1}
.logo b{display:block;color:var(--navy);font-size:1rem;font-weight:800;letter-spacing:.06em}
.logo b i{font-style:normal;color:var(--btn)}
.logo span{display:block;color:var(--slate);font-size:.54rem;font-weight:700;letter-spacing:.3em;text-transform:uppercase;margin-top:2px}
.hd-right{display:flex;align-items:center;gap:10px}
.hd-phone{text-align:right;text-decoration:none;line-height:1.15}
.hd-phone strong{display:block;color:var(--navy);font-size:1.05rem;font-weight:800;white-space:nowrap}
.hd-phone span{display:block;color:var(--slate);font-size:.62rem;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap}
.lang{font-family:var(--font);font-size:.7rem;font-weight:800;letter-spacing:.08em;color:var(--navy);background:none;border:2px solid var(--line);border-radius:8px;padding:8px 10px;cursor:pointer;text-transform:uppercase}
.lang:hover{border-color:var(--btn);color:var(--btn)}
main{max-width:900px;margin:0 auto;padding:40px 20px 10px}
.eyebrow{font-size:.68rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--btn)}
h1{font-size:clamp(1.9rem,5vw,2.6rem);font-weight:800;letter-spacing:-.02em;color:var(--navy);line-height:1.1;margin-top:8px}
.intro{margin-top:16px;font-size:1.06rem;color:#33435c;max-width:40em}
h2{font-size:1.3rem;font-weight:800;color:var(--navy);margin:34px 0 10px;letter-spacing:-.01em}
p{margin-bottom:12px}
ul{margin:0 0 14px 22px}li{margin-bottom:8px}
.box{background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin:20px 0}
.box p:last-child{margin-bottom:0}
.box.accent{border-left:4px solid var(--btn)}
.grid{display:grid;gap:14px;margin:20px 0}
.grid.auto{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
@media(min-width:760px){.grid.two{grid-template-columns:1fr 1fr}.grid.four{grid-template-columns:repeat(4,1fr)}}
.rcard{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px 16px;text-align:center}
.rcard b{display:block;font-size:1.45rem;font-weight:800;color:var(--navy);letter-spacing:-.02em}
.rcard b .of5{font-size:.8rem;font-weight:700;color:var(--slate)}
.rcard span{display:block;font-size:.8rem;font-weight:700;margin-top:4px}
.rcard em{display:inline-block;font-style:normal;font-size:.68rem;font-weight:700;color:var(--btn);background:rgba(15,118,110,.09);border-radius:6px;padding:3px 8px;margin-top:8px}
.tcard{background:#fff;border:1px solid var(--line);border-radius:12px;padding:20px}
.tstars{color:var(--gold);letter-spacing:.1em;font-size:.95rem}
.tcard p{margin:8px 0 10px;font-size:.98rem}
.tby{font-size:.78rem;font-weight:700;color:var(--slate)}
.person{display:grid;gap:16px;align-items:start}
@media(min-width:700px){.person{grid-template-columns:200px 1fr}}
.person img{width:100%;border-radius:12px;border:1px solid var(--line);display:block}
.person h3{font-size:1.1rem;color:var(--navy);font-weight:800}
.person .role{font-size:.76rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--btn);margin-bottom:8px}
.mono{aspect-ratio:600/802;max-width:200px;border-radius:12px;border:1px solid var(--line);background:linear-gradient(160deg,#1c4a7d,#153b66);color:#fff;display:flex;align-items:center;justify-content:center;font-size:2.6rem;font-weight:800;letter-spacing:.06em}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
.chip{font-size:.78rem;font-weight:700;color:var(--navy);background:var(--soft);border:1px solid var(--line);border-radius:999px;padding:7px 13px}
.stat{background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin:20px 0}
.stat b{color:var(--navy);font-size:1.5rem;font-weight:800;display:block}
.cta{background:var(--navy);color:#fff;margin-top:36px}
.cta-in{max-width:900px;margin:0 auto;padding:34px 20px 38px;text-align:center}
.cta h2{color:#fff;margin:0 0 6px}
.cta p{color:#c9d6e6;font-size:.95rem;margin-bottom:18px}
.btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:800;text-decoration:none;border-radius:12px;padding:15px 24px;font-size:1.02rem}
.btn-teal{background:var(--btn);color:#fff}.btn-teal:hover{background:var(--btn-dk)}
.btn-ghost{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.45)}
.btn-ghost:hover{border-color:#fff}
.fine{font-size:.74rem;color:var(--slate);margin-top:18px}
footer{background:var(--soft);border-top:1px solid var(--line);padding:26px 20px 34px;font-size:.74rem;color:var(--slate);line-height:1.6}
footer .fin{max-width:900px;margin:0 auto}
footer a{color:var(--slate)}
footer .legal{margin-top:10px}
.back{display:inline-block;margin-top:22px;font-weight:700;text-decoration:none;font-size:.9rem}`;

// attribute-safe: the copy below carries entities and quotes on purpose
const attr = v => String(v).replace(/"/g, "&quot;");
// text helper: element carrying both languages
const t = (tag, en, es, cls = "") =>
  `<${tag}${cls ? ` class="${cls}"` : ""} data-es="${attr(es)}">${en}</${tag}>`;

const PAGES = {
"no-fee": {
  title: "No Fee Unless We Win | Goldberg & Loren Injury Attorneys",
  desc: "You pay nothing up front and no attorney fee unless we recover money for you. Here is exactly how the contingency fee works — including the fine print.",
  eyebrow: ["How We Get Paid", "Cómo Cobramos"],
  h1: ["No Fee Unless We Win", "No Paga Si No Ganamos"],
  intro: ["You pay nothing up front — ever. We front every dollar it costs to build your case, and we only collect an attorney fee if we recover money for you.",
          "Usted no paga nada por adelantado — nunca. Nosotros cubrimos cada dólar que cuesta armar su caso y solo cobramos honorarios si recuperamos dinero para usted."],
  body: [
    t("h2", "What &ldquo;no fee&rdquo; actually means", "Qué significa realmente &laquo;sin honorarios&raquo;"),
    `<ul>
      ${t("li", "The case review is free, and there is no obligation to hire us.", "La evaluación del caso es gratis y no hay obligación de contratarnos.")}
      ${t("li", "We front every cost of building your case — investigators, records, experts, filing fees.", "Cubrimos cada costo de armar su caso — investigadores, expedientes, expertos, cuotas de presentación.")}
      ${t("li", "We only collect an attorney fee if we recover money for you. No recovery, no attorney fee.", "Solo cobramos honorarios si recuperamos dinero para usted. Sin recuperación, no hay honorarios.")}
      ${t("li", "You are never asked for money out of pocket while your case is going on.", "Nunca le pedimos dinero de su bolsillo mientras su caso está en curso.")}
    </ul>`,
    `<div class="box accent">${t("p", "<b>The fine print, plainly:</b> court costs and case expenses may apply, and they are explained clearly in your agreement before you sign anything.", "<b>La letra pequeña, en claro:</b> pueden aplicar costos judiciales y gastos del caso, y se explican claramente en su acuerdo antes de que usted firme.")}</div>`,
    t("h2", "Why having a lawyer changes the math", "Por qué tener abogado cambia las cuentas"),
    `<div class="stat"><b>4.4x</b>${t("p", "Crash victims with a lawyer recover <b>$77,600 on average vs. $17,600</b> without one, according to a Martindale-Nolo consumer study.", "Las víctimas con abogado recuperan <b>$77,600 en promedio vs. $17,600</b> sin uno, según un estudio de consumidores de Martindale-Nolo.")}</div>`,
    `<div class="chips">${t("span", "We front every cost", "Cubrimos todos los costos", "chip")}${t("span", "You talk to lawyers, not phone trees", "Habla con abogados, no con contestadoras", "chip")}${t("span", "50+ trials to verdict", "Más de 50 juicios a veredicto", "chip")}</div>`,
  ],
},
"reviews": {
  title: "Client Reviews | Goldberg & Loren Injury Attorneys",
  desc: "Real Google reviews from Goldberg & Loren injury clients, plus current client ratings by office. 20,000+ injury cases handled since 1994.",
  eyebrow: ["Client Reviews", "Reseñas de Clientes"],
  h1: ["What Our Clients Say", "Lo Que Dicen Nuestros Clientes"],
  intro: ["Reviews left by real clients on Google. We handle injury cases nationwide — here is what people say after working with our team.",
          "Reseñas dejadas por clientes reales en Google. Manejamos casos de lesiones en todo el país — esto es lo que dicen después de trabajar con nuestro equipo."],
  body: [
    `<div class="grid two">
      <div class="tcard"><div class="tstars" aria-label="5 out of 5 stars">★★★★★</div>${t("p", "&ldquo;I could not be more pleased with the personnel, process, and results I got from working with George Goldberg and his team.&rdquo;", "&laquo;No podría estar más satisfecha con el personal, el proceso y los resultados que obtuve trabajando con George Goldberg y su equipo.&raquo;")}${t("div", "Valerie Harris · Google Review", "Valerie Harris · Reseña de Google", "tby")}</div>
      <div class="tcard"><div class="tstars" aria-label="5 out of 5 stars">★★★★★</div>${t("p", "&ldquo;It was my first time needing to hire an attorney, and I was really happy with the entire process. Mr. Loren worked tirelessly for me while I recovered.&rdquo;", "&laquo;Era la primera vez que necesitaba contratar a un abogado y quedé muy contento con todo el proceso. El Sr. Loren trabajó sin descanso por mí mientras me recuperaba.&raquo;")}${t("div", "Charles Sanchez · Google Review", "Charles Sanchez · Reseña de Google", "tby")}</div>
      <div class="tcard"><div class="tstars" aria-label="5 out of 5 stars">★★★★★</div>${t("p", "&ldquo;Incredibly knowledgeable, great in court, and the settlement was way more than I expected.&rdquo;", "&laquo;Increíblemente conocedores, excelentes en corte, y el acuerdo fue mucho más de lo que esperaba.&raquo;")}${t("div", "Constance Sanchez · Google Review", "Constance Sanchez · Reseña de Google", "tby")}</div>
    </div>`,
    t("h2", "Client ratings by office", "Calificaciones por oficina"),
    `<div id="ratings" class="grid auto"></div>`,
    `<p class="fine" data-es="Las reseñas son de perfiles públicos de Google y reflejan la experiencia de esos clientes. Los resultados anteriores no garantizan un resultado similar; cada caso es único.">Reviews are from public Google profiles and reflect those clients' experiences. Prior results do not guarantee a similar outcome; every case is unique.</p>`,
  ],
},
"settlements": {
  title: "Recent Settlements & Results | Goldberg & Loren",
  desc: "Real settlements Goldberg & Loren recovered for injury clients — $4.5M, $8.7M, $14M — and how quickly each one resolved. $550M+ recovered since 1994.",
  eyebrow: ["Results", "Resultados"],
  h1: ["Recent Settlements", "Acuerdos Recientes"],
  intro: ["Insurance companies profit by dragging cases out. These are real recoveries for our clients — and how fast each one resolved.",
          "Las aseguradoras ganan alargando los casos. Estas son recuperaciones reales para nuestros clientes — y qué tan rápido se resolvió cada una."],
  body: [
    `<div class="grid four">
      <div class="rcard"><b>$4,500,000</b>${t("span", "Car Accident", "Accidente de Auto")}${t("em", "Settled in 215 days", "Resuelto en 215 días")}</div>
      <div class="rcard"><b>$8,700,000</b>${t("span", "Trucking Accident", "Accidente de Camión")}${t("em", "Settled in 270 days", "Resuelto en 270 días")}</div>
      <div class="rcard"><b>$14,000,000</b>${t("span", "Construction Accident", "Accidente de Construcción")}${t("em", "Settled in 289 days", "Resuelto en 289 días")}</div>
      <div class="rcard"><b>$2,500,000</b>${t("span", "Pedestrian Accident", "Accidente Peatonal")}${t("em", "Settled in 193 days", "Resuelto en 193 días")}</div>
    </div>`,
    `<div class="box accent">${t("p", "When an insurer insisted the policy limit was the most our client could ever get, we recovered <b>$1,025,000 — $750,000 more than their &ldquo;maximum&rdquo;</b> — for an 8-year-old rear-ended by a commercial vehicle.", "Cuando una aseguradora insistió en que el límite de la póliza era lo máximo que nuestro cliente podría recibir, recuperamos <b>$1,025,000 — $750,000 más que su &laquo;máximo&raquo;</b> — para un niño de 8 años impactado por detrás por un vehículo comercial.")}</div>`,
    t("h2", "Across the firm", "En todo el bufete"),
    `<div class="grid two">
      <div class="stat"><b>$550M+</b>${t("p", "Recovered for injury victims since 1994.", "Recuperados para víctimas de lesiones desde 1994.")}</div>
      <div class="stat"><b>20,000+</b>${t("p", "Injury cases handled since 1994.", "Casos de lesiones manejados desde 1994.")}</div>
    </div>`,
    `<p class="fine" data-es="Los resultados anteriores no garantizan un resultado similar. Cada caso es único y los resultados dependen de los hechos y de la ley aplicable.">Prior results do not guarantee a similar outcome. Every case is unique and results depend on the facts and the applicable law.</p>`,
  ],
},
"case-review": {
  title: "Free 24/7 Case Review | Goldberg & Loren Injury Attorneys",
  desc: "Talk to a real person about your injury case right now. Free, confidential, and no obligation — 24 hours a day, 7 days a week.",
  eyebrow: ["Open 24/7", "Abierto 24/7"],
  h1: ["Free Case Review — 24/7", "Evaluación Gratis — 24/7"],
  intro: ["Call now and a real person — not a phone tree — hears what happened and tells you where you stand. Free, confidential, and no obligation.",
          "Llame ahora y una persona real — no una contestadora — escucha qué pasó y le dice dónde está parado. Gratis, confidencial y sin compromiso."],
  body: [
    `<div class="btns" style="justify-content:flex-start;margin:22px 0">
      <a class="btn btn-teal js-tel" href="tel:+15129603887" data-tel="1">${t("span", "Call <span class=\"js-tel-text\">(512) 960-3887</span> Now", "Llame al <span class=\"js-tel-text\">(512) 960-3887</span> Ahora")}</a>
    </div>`,
    t("h2", "What happens when you call", "Qué pasa cuando llama"),
    `<ul>
      ${t("li", "<b>You talk. 60 seconds.</b> A real person hears what happened and tells you where you stand — free, no pressure.", "<b>Usted habla. 60 segundos.</b> Una persona real escucha qué pasó y le dice dónde está parado — gratis, sin presión.")}
      ${t("li", "<b>We take it from here.</b> Every adjuster call, every deadline, the evidence, and help coordinating your medical care.", "<b>Nosotros seguimos desde ahí.</b> Cada llamada del ajustador, cada plazo, la evidencia y ayuda para coordinar su atención médica.")}
      ${t("li", "<b>You get paid.</b> We push for the maximum, and you owe no attorney fee unless we recover for you.", "<b>Usted recibe su pago.</b> Buscamos el máximo, y no debe honorarios a menos que recuperemos para usted.")}
    </ul>`,
    `<div class="box">${t("p", "<b>Prefer to type?</b> The 60-second case review form asks three quick questions and sends straight to our intake team.", "<b>¿Prefiere escribir?</b> El formulario de 60 segundos hace tres preguntas rápidas y llega directo a nuestro equipo de admisión.")}<p style="margin-top:10px"><a class="js-form-link" href="car-accident.html#case-form" data-es="Abrir el formulario gratuito →">Open the free case review form →</a></p></div>`,
  ],
},
"maximize-compensation": {
  title: "Maximize Your Injury Compensation | Goldberg & Loren",
  desc: "Insurers settle low and fast by design. How Goldberg & Loren build injury cases that pay in full — and why represented victims recover 4.4x more on average.",
  eyebrow: ["Why We Win", "Por Qué Ganamos"],
  h1: ["Maximize Your Compensation", "Maximice Su Compensación"],
  intro: ["First offers are low by design. We build the case the insurer hopes you never build — and we do it on our dime.",
          "Las primeras ofertas son bajas por diseño. Construimos el caso que la aseguradora espera que usted nunca construya — y lo hacemos con nuestro dinero."],
  body: [
    `<div class="stat"><b>4.4x</b>${t("p", "Crash victims with a lawyer recover <b>$77,600 on average vs. $17,600</b> without one, according to a Martindale-Nolo consumer study.", "Las víctimas con abogado recuperan <b>$77,600 en promedio vs. $17,600</b> sin uno, según un estudio de consumidores de Martindale-Nolo.")}</div>`,
    t("h2", "We know the insurance playbook", "Conocemos el manual de las aseguradoras"),
    t("p", "Founding partner George Goldberg spent his first two years in practice defending airlines and insurance companies in injury litigation, before switching sides in 1996. He learned every delay tactic and every lowball script. When the adjuster calls with a low offer, he already knows their next three moves.",
        "El socio fundador George Goldberg pasó sus primeros dos años de práctica defendiendo a aerolíneas y aseguradoras en litigios por lesiones, antes de cambiar de bando en 1996. Aprendió cada táctica de demora y cada guion de ofertas bajas. Cuando el ajustador llama con una oferta baja, él ya sabe sus próximos tres movimientos."),
    t("h2", "What we do that raises the number", "Lo que hacemos y sube la cifra"),
    `<ul>
      ${t("li", "Preserve the evidence before it disappears — camera footage gets erased and witnesses move.", "Preservamos la evidencia antes de que desaparezca — los videos se borran y los testigos se mudan.")}
      ${t("li", "Document every loss: medical bills, lost wages, future treatment, and what the crash took from your life.", "Documentamos cada pérdida: gastos médicos, salarios perdidos, tratamiento futuro y lo que el accidente le quitó.")}
      ${t("li", "Handle every adjuster call and deadline so nothing you say gets used to cut your claim.", "Manejamos cada llamada del ajustador y cada plazo para que nada de lo que usted diga reduzca su reclamo.")}
      ${t("li", "Try the case when they won't pay fairly — our senior trial partner has taken 50+ cases to verdict.", "Llevamos el caso a juicio cuando no quieren pagar justamente — nuestro socio litigante sénior ha llevado más de 50 casos a veredicto.")}
    </ul>`,
    `<div class="box accent">${t("p", "<b>Before you accept anything:</b> signing usually ends your claim permanently, even if your injuries get worse. A free review costs you nothing and tells you what your claim is actually worth.", "<b>Antes de aceptar algo:</b> firmar normalmente termina su reclamo de forma permanente, incluso si sus lesiones empeoran. Una evaluación gratuita no le cuesta nada y le dice cuánto vale realmente su reclamo.")}</div>`,
  ],
},
"our-team": {
  title: "Meet Your Team | Goldberg & Loren Injury Attorneys",
  desc: "Meet the Goldberg & Loren injury team: a founding partner who spent two years defending insurers, and a senior trial partner with 50+ verdicts and a CPA.",
  eyebrow: ["Your Team", "Su Equipo"],
  h1: ["Meet Your Team", "Conozca a Su Equipo"],
  extraSchema: [
    { "@context": "https://schema.org", "@type": "Person", name: "George Z. Goldberg",
      jobTitle: "Founding & Managing Partner", worksFor: { "@id": ORIGIN + "/#firm" },
      alumniOf: [{ "@type": "CollegeOrUniversity", name: "University of Miami School of Law" },
                 { "@type": "CollegeOrUniversity", name: "Emory University" }],
      sameAs: "https://goldbergloren.com/attorney-george-goldberg/",
      description: "Founding and managing partner. Spent his first two years in practice at an aviation defense firm, defending airlines and insurance companies in injury litigation, before opening his own injury firm in 1996." },
    { "@context": "https://schema.org", "@type": "Person", name: "James M. Loren",
      jobTitle: "Senior Partner", worksFor: { "@id": ORIGIN + "/#firm" },
      sameAs: "https://goldbergloren.com/attorney-james-loren/",
      description: "Senior partner and the firm's most senior trial lawyer. 20+ years in practice with 50+ cases tried to verdict nationwide. Certified Public Accountant." }
  ],
  intro: ["A dedicated personal injury team — one partner who used to defend insurance companies, and one who takes them to trial.",
          "Un equipo dedicado a lesiones personales — un socio que antes defendía a las aseguradoras y otro que las lleva a juicio."],
  body: [
    `<div class="person" style="margin-top:24px">
      <img src="img/george-goldberg.jpg" alt="George Z. Goldberg, founding partner of Goldberg &amp; Loren" width="600" height="802" loading="lazy">
      <div><h3>George Z. Goldberg</h3>${t("div", "Founding &amp; Managing Partner", "Socio Fundador y Administrador", "role")}
      ${t("p", "George spent his first two years in practice on the other side — at an aviation defense firm, defending airlines and insurance companies in injury litigation. He learned every delay tactic and every lowball script, then switched sides and opened his own injury firm in 1996. When an adjuster calls with a low offer, he already knows their next three moves.", "George pasó sus primeros dos años de práctica del otro lado — en un bufete de defensa de aviación, defendiendo a aerolíneas y aseguradoras en litigios por lesiones. Aprendió cada táctica de demora y cada guion de ofertas bajas, luego cambió de bando y abrió su propio bufete de lesiones en 1996. Cuando un ajustador llama con una oferta baja, él ya sabe sus próximos tres movimientos.")}
      ${t("p", "He earned his law degree from the University of Miami School of Law in 1994, magna cum laude, and as managing partner he still stays involved in the direction of the firm's major cases.", "Obtuvo su título de abogado en la Facultad de Derecho de la Universidad de Miami en 1994, magna cum laude, y como socio administrador sigue involucrado en la dirección de los casos principales del bufete.")}</div>
    </div>`,
    `<div class="person" style="margin-top:8px">
      <div class="mono" aria-hidden="true">JL</div>
      <div><h3>James Loren</h3>${t("div", "Senior Partner · 50+ Trials to Verdict", "Socio Sénior · Más de 50 Juicios a Veredicto", "role")}
      ${t("p", "When insurers still won't pay, James takes them to court. He has tried over 50 cases to verdict across the country in more than 20 years of practice, including in federal court in Texas. Adjusters track which firms fold before trial and which ones don't — this isn't a firm that folds.", "Cuando las aseguradoras aun así no quieren pagar, James las lleva a corte. Ha llevado más de 50 casos a veredicto en todo el país en más de 20 años de práctica, incluyendo en corte federal en Texas. Los ajustadores saben qué bufetes se rinden antes del juicio y cuáles no — este no es un bufete que se rinde.")}
      ${t("p", "He is also a Certified Public Accountant, which matters more than it sounds: valuing a claim is an accounting problem before it is an argument — lost earnings, future treatment, life-care costs. He reads the insurer's numbers as fluently as their lawyers do.", "También es Contador Público Certificado, lo cual importa más de lo que parece: valorar un reclamo es un problema contable antes de ser un argumento — salarios perdidos, tratamiento futuro, costos de cuidado de por vida. Él lee los números de la aseguradora con la misma fluidez que sus abogados.")}</div>
    </div>`,
    t("h2", "The firm behind them", "El bufete detrás de ellos"),
    `<div class="grid two">
      <div class="stat"><b>20,000+</b>${t("p", "Injury cases handled since 1994.", "Casos de lesiones manejados desde 1994.")}</div>
      <div class="stat"><b>21 / 16</b>${t("p", "Offices in 16 states, with national intake open 24/7.", "Oficinas en 16 estados, con admisión nacional abierta 24/7.")}</div>
    </div>`,
    `<div class="chips">${t("span", "We front every cost", "Cubrimos todos los costos", "chip")}${t("span", "You talk to lawyers, not phone trees", "Habla con abogados, no con contestadoras", "chip")}${t("span", "No fee unless we win", "No paga si no ganamos", "chip")}</div>`,
  ],
},
};

const page = (slug, p) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index,follow">
<meta name="theme-color" content="#ffffff">
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
<header class="hd">
  <div class="hd-in">
    <span class="logo"><b>GOLDBERG <i>&amp;</i> LOREN</b><span>Personal Injury Attorneys</span></span>
    <div class="hd-right">
      <a class="hd-phone js-tel" href="tel:+15129603887"><strong class="js-tel-text">(512) 960-3887</strong><span data-es="Abierto 24/7 · Consulta Gratis">Open 24/7 · Free Consult</span></a>
      <button class="lang" id="lang-toggle" type="button">ES</button>
    </div>
  </div>
</header>

<main>
  <p class="eyebrow" data-es="${attr(p.eyebrow[1])}">${p.eyebrow[0]}</p>
  <h1 data-es="${attr(p.h1[1])}">${p.h1[0]}</h1>
  <p class="intro" data-es="${attr(p.intro[1])}">${p.intro[0]}</p>
  ${p.body.join("\n  ")}
  <a class="back js-form-link" href="car-accident.html" data-es="← Volver a la evaluación gratuita">&larr; Back to the free case review</a>
</main>

<section class="cta">
  <div class="cta-in">
    <h2 data-es="Hable con una persona real ahora">Talk to a real person now</h2>
    <p data-es="Gratis, confidencial y sin compromiso. Abierto 24/7.">Free, confidential, and no obligation. Open 24/7.</p>
    <div class="btns">
      <a class="btn btn-teal js-tel" href="tel:+15129603887"><span data-es="Llame al">Call</span> <span class="js-tel-text">(512) 960-3887</span></a>
      <a class="btn btn-ghost js-form-link" href="car-accident.html#case-form" data-es="Evaluación gratuita en línea">Free case review online</a>
    </div>
  </div>
</section>

<footer>
  <div class="fin">
    <p data-es="Publicidad de Abogados. Esta página contiene información general y no constituye asesoría legal. Contactar al bufete no crea una relación abogado-cliente. Los resultados anteriores no garantizan un resultado similar; cada caso es único. &laquo;No paga si no ganamos&raquo; significa que no hay honorarios de abogado a menos que recuperemos para usted — pueden aplicar costos judiciales y gastos del caso. Abogado responsable de este anuncio: George Z. Goldberg. Los abogados tienen licencia por estado; no todos los abogados tienen licencia en todos los estados.">Attorney Advertising. This page is for general information only and is not legal advice. Contacting the firm does not create an attorney-client relationship. Prior results do not guarantee a similar outcome; every case is unique. "No fee unless we win" means no attorney fees unless we recover for you — court costs and case expenses may apply. Attorney responsible for this advertisement: George Z. Goldberg. Attorneys are licensed by state; not all attorneys are licensed in every state.</p>
    <p class="legal">&copy; <span id="yr"></span> Goldberg &amp; Loren. <a href="privacy-policy.html">Privacy Policy</a> &middot; <a href="terms.html">Terms of Use</a> &middot; <a href="mailto:intakes@goldbergloren.com">intakes@goldbergloren.com</a></p>
  </div>
</footer>

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
    if (GEO[gp]) geoSlug = gp;
    var cp = (q.get("ct") || "").toLowerCase();
    if (CASES.indexOf(cp) > -1) ct = cp;
  }
  var g = GEO[geoSlug];

  document.querySelectorAll("a.js-tel").forEach(function(a){ a.href = "tel:" + g.phone; });
  document.querySelectorAll(".js-tel-text").forEach(function(s){ s.textContent = g.display; });

  var qs = "?geo=" + encodeURIComponent(geoSlug);
  document.querySelectorAll("a.js-form-link").forEach(function(a){
    var hash = a.getAttribute("href").indexOf("#") > -1 ? "#case-form" : "";
    a.href = ct + ".html" + qs + hash;
  });

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
  document.addEventListener("click", function(e){ if (e.target.closest("a.js-tel")) track("call_click"); });

  var ratings = document.getElementById("ratings");
  if (ratings) {
    var html = "";
    Object.keys(GEO).forEach(function(k){
      var r = GEO[k];
      if (!r.stars || !r.city) return;
      html += '<div class="rcard"><b>' + r.stars + '<span class="of5">/5</span></b>' +
              '<span>' + r.city + '</span>' +
              '<em data-count="' + r.count + '">' + r.count + ' Google reviews</em></div>';
    });
    ratings.innerHTML = html;
  }

  function setLang(l){
    var es = l === "es";
    document.querySelectorAll("[data-es]").forEach(function(el){
      if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.innerHTML);
      el.innerHTML = es ? el.getAttribute("data-es") : el.getAttribute("data-en");
    });
    document.documentElement.lang = es ? "es" : "en";
    document.getElementById("lang-toggle").textContent = es ? "EN" : "ES";
    LANG = l;
    document.querySelectorAll(".js-tel-text").forEach(function(s){ s.textContent = g.display; });
    document.querySelectorAll("#ratings em[data-count]").forEach(function(el){
      el.textContent = el.getAttribute("data-count") + (es ? " reseñas de Google" : " Google reviews");
    });
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
console.log(`${Object.keys(PAGES).length} shared pages · ${Object.keys(GEO_MIN).length} geos wired · ${RATED} offices with real Google ratings`);
