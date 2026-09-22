#!/usr/bin/env node
/**
 * Austin car-accident HEADINGS TEST lander → austin-car-accident-attorneys.html
 *   node generate-austin-test.mjs
 *
 * The client supplied an exact H1/H2/H3 outline for an Austin car-accident page,
 * to be tested against the current Austin lander (the control,
 * car-accident-austin-tx.html). The variant is built FROM the baked control:
 * same design, hero, form, tracking and footer, so the test isolates content and
 * heading structure. Everything between the hero and the footer is rebuilt
 * around the client's outline, and the form-card title, success message and
 * footer column titles are demoted from h2/h3 to styled paragraphs so the page's
 * heading outline is exactly the client's — nothing more, nothing less. The
 * build fails if it isn't.
 *
 * Spanish: the landers' i18n ops are positional (".sec-h" #3 gets this text), so
 * every op for a removed section is dropped and all new content is addressed by
 * id instead. Call links are translated around their number (ft/lt ops) so
 * CallRail's swapped number survives a language change.
 *
 * Leads carry variant:"austin-headings", the thank-you redirect gains
 * &variant=austin-headings, and a page_variant event goes to the dataLayer.
 * Re-run after re-baking the Austin car page (node generate-geo.mjs car-accident.html --all).
 */
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "car-accident-austin-tx.html";
const OUT = "austin-car-accident-attorneys.html";
const VARIANT = "austin-headings";

// The client's outline, verbatim apart from capitalisation and two obvious
// fixes ("consultations" → "consultation"; "500 million dollars" → "$500 Million").
const OUTLINE = [
  ["h1", "Austin Car Accident Attorneys"],
  ["h2", "Types of Cases Our Austin Car Accident Attorneys Represent"],
  ["h3", "Red Light Accidents"],
  ["h3", "Car Crashes Involving Drunk Drivers"],
  ["h3", "Rear-End Accidents"],
  ["h3", "Rideshare Accidents"],
  ["h3", "Chain Reaction Auto Accidents"],
  ["h2", "Car Accident Attorneys in Austin, TX Open 24 Hours"],
  ["h2", "Why Turn to a Car Accident Attorney in Austin After a Crash"],
  ["h3", "No Fees Unless We Win"],
  ["h3", "Over $500 Million Won"],
  ["h3", "We Fight to Get You Paid While You Recover"],
  ["h3", "Award-Winning Accident Attorneys Serving Austin and All of Travis County"],
  ["h3", "Free Car Accident Consultations"],
  ["h2", "Schedule a Free Consultation with Our Austin Car Accident Attorneys"],
];

let html = readFileSync(SRC, "utf8");
let fail = false;
const count = (s, find) => s.split(find).length - 1;
function mustReplace(find, repl, what) {
  const n = typeof find === "string" ? count(html, find) : (html.match(new RegExp(find.source, "g")) || []).length;
  if (n !== 1) { console.error(`${SRC}: expected exactly 1 ${what}, found ${n}`); fail = true; return; }
  html = html.replace(find, () => repl);   // function form: no $-pattern expansion in dollar figures
}
const grab = (re, what) => { const m = html.match(re); if (!m) { console.error(`${SRC}: missing ${what}`); fail = true; return ""; } return m[1]; };

// ------------------------------------------------------------ pieces reused from the control
const TEL = grab(/class="btn btn-teal cta-call js-tel" href="tel:(\+\d+)"/, "hero call link");
const DISPLAY = grab(/<span class="js-tel-text">([^<]+)<\/span>/, "display number");
const PHONE_SVG = grab(/<a class="btn btn-teal cta-call js-tel"[^>]*>(<svg[\s\S]*?<\/svg>)/, "phone icon");
// the grid through its own closing tag, stopping short of the section's .wrap
const TESTIMONIALS = grab(/<section id="reviews">[\s\S]*?(<div class="tgrid">[\s\S]*?)\s*<\/div>\s*<\/section>/, "testimonial grid");
const OFFICE_LINE = grab(/(<p class="local-line" data-geo="office">[^<]*<\/p>)/, "office line");
const SOL_EN = grab(/<span data-geo="sol">([^<]*)<\/span>/, "statute-of-limitations answer");

// ------------------------------------------------------------ id-addressed bilingual helpers
const OPS = [];
let n = 0;
const nid = () => `ah${++n}`;
// whole-element swap — only for elements holding no call link or geo-baked span
const T = (tag, en, es, attrs = "") => { const id = nid(); OPS.push(["h", "#" + id, 0, es]);
  return `<${tag} id="${id}"${attrs ? " " + attrs : ""}>${en}</${tag}>`; };
// call button: translate the words around the number, never the number itself
// short: for narrow slots (the navy card), where the full label wraps
const callBtn = (cls = "", short = false) => { const id = nid();
  const tail = short ? [" Now", " ahora"] : [" Now — Free 24/7", " ahora — Gratis 24/7"];
  OPS.push(["ft", `#${id} > span`, 0, "Llame al "], ["lt", `#${id} > span`, 0, tail[1]]);
  return `<a id="${id}" class="btn btn-teal js-tel o24-call${cls}" href="tel:${TEL}">${PHONE_SVG}<span>Call <span class="js-tel-text">${DISPLAY}</span>${tail[0]}</span></a>`; };
const formLink = (en, es) => T("a", en, es, 'class="btn btn-ghost o24-form" href="#case-form"');
const step = (num, bEn, bEs, pEn, pEs) => { const id = nid(); OPS.push(["lt", "#" + id, 0, bEs]);
  return `<div class="step"><b id="${id}"><i>${num}</i>${bEn}</b>${T("p", pEn, pEs)}</div>`; };
const rcard = (amt, sEn, sEs, eEn, eEs) => `<div class="rcard"><b>${amt}</b>${T("span", sEn, sEs)}${T("em", eEn, eEs)}</div>`;
const faq = (qEn, qEs, aEn, aEs) => `<details>${T("summary", qEn, qEs)}${T("p", aEn, aEs)}</details>`;
const typeCard = (hEn, hEs, pEn, pEs) => `<article class="type-card">${T("h3", hEn, hEs)}${T("p", pEn, pEs)}</article>`;
const whyBlock = (hEn, hEs, inner, id = "") => `<div class="why-block"${id ? ` id="${id}"` : ""}>${T("h3", hEn, hEs)}${inner}</div>`;
const figId = nid(); OPS.push(["lt", "#" + figId, 0, "Socio Fundador"]);

// ------------------------------------------------------------ the rebuilt body
const BODY = `<section class="types" id="case-types">
  <div class="wrap">
    ${T("p", "Car Accident Cases", "Casos de Accidentes de Auto", 'class="eyebrow"')}
    ${T("h2", "Types of Cases Our Austin Car Accident Attorneys Represent", "Tipos de Casos Que Representan Nuestros Abogados de Accidentes de Auto en Austin", 'class="sec-h"')}
    ${T("p", "Every crash is different — and so is the way insurers try to minimize it. These are the car accident cases we handle for people across Austin and Travis County.", "Cada accidente es diferente — y también la forma en que las aseguradoras intentan minimizarlo. Estos son los casos de accidentes de auto que manejamos para personas en todo Austin y el condado de Travis.", 'class="sec-sub"')}
    <div class="tgrid6">
      ${typeCard("Red Light Accidents", "Accidentes por Pasarse la Luz Roja",
        "A driver who runs a red light usually hits the side of another car — and a side impact, or T-bone crash, leaves people with the least protection. Proving who had the light takes fast work: security and dash-cam footage and witness statements disappear within days, so we move to lock them down before the other driver's insurer argues the light was yellow.",
        "Un conductor que se pasa la luz roja normalmente choca contra el costado de otro auto — y un impacto lateral, o choque en T, deja a las personas con la menor protección. Probar quién tenía la luz exige actuar rápido: los videos de seguridad y de cámaras de tablero, y las declaraciones de testigos, desaparecen en días, así que actuamos para asegurarlos antes de que la aseguradora del otro conductor alegue que la luz estaba en amarillo.")}
      ${typeCard("Car Crashes Involving Drunk Drivers", "Choques Causados por Conductores Ebrios",
        "A criminal DWI case punishes the driver — it doesn't pay your medical bills. Your injury claim is separate, and it can reach beyond the driver's own policy: under Texas's dram shop law, a bar or restaurant that kept serving someone who was obviously intoxicated can share responsibility for the crash.",
        "Un caso penal por DWI castiga al conductor — pero no paga sus gastos médicos. Su reclamo por lesiones es aparte, y puede ir más allá de la póliza del conductor: bajo la ley de Texas sobre establecimientos que venden alcohol (dram shop), un bar o restaurante que siguió sirviéndole a alguien obviamente intoxicado puede compartir la responsabilidad del choque.")}
      ${typeCard("Rear-End Accidents", "Choques por Detrás",
        "Stop-and-go traffic on I-35, MoPac, and US-183 makes rear-end crashes an everyday event in Austin. The driver who hits from behind is usually at fault — but insurers still fight the injuries, because whiplash and back injuries often don't show up for a day or two. Get checked by a doctor, and let us deal with the adjuster.",
        "El tráfico de arranque y parada en la I-35, MoPac y la US-183 hace que los choques por detrás sean algo diario en Austin. El conductor que golpea por detrás normalmente tiene la culpa — pero las aseguradoras aun así disputan las lesiones, porque el latigazo cervical y las lesiones de espalda a menudo no aparecen hasta uno o dos días después. Hágase revisar por un médico y déjenos tratar con el ajustador.")}
      ${typeCard("Rideshare Accidents", "Accidentes de Uber y Lyft",
        "Hurt in an Uber or Lyft — as a passenger, another driver, or a pedestrian? Texas law requires $1,000,000 in liability coverage once a rideshare driver accepts a trip, and far less while the driver is only logged in and waiting. Which policy applies turns on what the app was doing at the moment of the crash — and the companies know it. We sort it out.",
        "¿Se lesionó en un Uber o Lyft — como pasajero, como otro conductor o como peatón? La ley de Texas exige $1,000,000 en cobertura de responsabilidad una vez que el conductor acepta un viaje, y mucho menos mientras solo está conectado esperando. Qué póliza aplica depende de lo que hacía la aplicación en el momento del choque — y las compañías lo saben. Nosotros lo resolvemos.")}
      ${typeCard("Chain Reaction Auto Accidents", "Accidentes en Cadena",
        "Multi-car pileups are the hardest crashes to untangle: several drivers, several insurers, and everyone pointing at someone else. Texas divides fault by percentage — you can still recover as long as you're not more than 50% responsible, with your award reduced by your share. We reconstruct the sequence of impacts so the blame lands where it belongs.",
        "Las carambolas de varios autos son los choques más difíciles de aclarar: varios conductores, varias aseguradoras y todos culpando a alguien más. Texas divide la culpa por porcentaje — usted aún puede recuperar siempre que su responsabilidad no sea mayor al 50%, y su compensación se reduce según su parte. Reconstruimos la secuencia de impactos para que la culpa recaiga donde corresponde.")}
      <div class="type-card type-cta">
        ${T("p", "Don't see your crash here?", "¿No ve su tipo de choque aquí?", 'class="tc-h"')}
        ${T("p", "Call anyway. A free review tells you where you stand — whatever kind of crash it was.", "Llame de todos modos. Una evaluación gratuita le dice dónde está parado — sin importar el tipo de choque.")}
        ${callBtn("", true)}
      </div>
    </div>
  </div>
</section>

<section class="open24" id="how-it-works">
  <div class="wrap">
    ${T("p", "Day or Night", "De Día o de Noche", 'class="eyebrow"')}
    ${T("h2", "Car Accident Attorneys in Austin, TX Open 24 Hours", "Abogados de Accidentes de Auto en Austin, TX, Abiertos las 24 Horas", 'class="sec-h"')}
    ${T("p", "Crashes don't keep business hours, and neither do we. Call day or night and a real person answers — 24 hours a day, 7 days a week. Se habla español.", "Los accidentes no respetan horarios de oficina, y nosotros tampoco. Llame de día o de noche y le contesta una persona real — las 24 horas, los 7 días de la semana. Hablamos español.", 'class="sec-sub"')}
    <div class="steps">
      ${step(1, "You talk. 60 seconds.", "Usted habla. 60 segundos.", "Call or tap the form. A real person — not a phone tree — hears what happened and tells you where you stand. Free, no obligation, no pressure.", "Llame o toque el formulario. Una persona real — no una contestadora — escucha qué pasó y le dice dónde está parado. Gratis, sin compromiso y sin presión.")}
      ${step(2, "We take it from here.", "Nosotros seguimos desde ahí.", "Every adjuster call, every deadline, the evidence, and help coordinating your medical care. We front every dollar it costs to build your case.", "Cada llamada del ajustador, cada plazo, la evidencia y ayuda para coordinar su atención médica. Cubrimos cada dólar que cuesta armar su caso.")}
      ${step(3, "You get paid.", "Usted recibe su pago.", "We push for the maximum and try the case if they won't pay it. No recovery, no attorney fee — and you are never out of pocket along the way.", "Buscamos el máximo y vamos a juicio si no quieren pagarlo. Sin recuperación, no hay honorarios — y usted nunca paga de su bolsillo.")}
    </div>
    ${T("div", "<b>Don't wait on the clock.</b> In Texas you generally have two years from the crash to file, but the evidence that proves your case — camera footage, skid marks, witnesses — disappears much sooner.", "<b>No espere.</b> En Texas generalmente tiene dos años desde el accidente para presentar su reclamo, pero la evidencia que prueba su caso — videos, marcas de frenado, testigos — desaparece mucho antes.", 'class="rhigh o24-note"')}
    <div class="o24-ctas">${callBtn()}${formLink("Or Start the 60-Second Form", "O Empiece el Formulario de 60 Segundos")}</div>
  </div>
</section>

<section class="why" id="why-us">
  <div class="wrap">
    ${T("p", "Why Hire Us", "Por Qué Contratarnos", 'class="eyebrow"')}
    ${T("h2", "Why Turn to a Car Accident Attorney in Austin After a Crash", "Por Qué Acudir a un Abogado de Accidentes de Auto en Austin Después de un Choque", 'class="sec-h"')}
    ${T("p", "The other driver's insurer has adjusters and lawyers working to pay you as little as possible. Here's what changes when you have your own team.", "La aseguradora del otro conductor tiene ajustadores y abogados trabajando para pagarle lo menos posible. Esto es lo que cambia cuando usted tiene su propio equipo.", 'class="sec-sub"')}

    ${whyBlock("No Fees Unless We Win", "Sin Honorarios a Menos Que Ganemos",
      T("p", "You pay nothing up front — ever. We front every cost of building your case, and we only collect an attorney fee if we recover money for you. No recovery, no attorney fee. (Court costs and case expenses may apply and are explained clearly in your agreement before you sign.)", "Usted no paga nada por adelantado — nunca. Cubrimos todos los costos de armar su caso y solo cobramos honorarios si recuperamos dinero para usted. Sin recuperación, no hay honorarios de abogado. (Pueden aplicar costos judiciales y gastos del caso, y se explican claramente en su acuerdo antes de firmar.)"))}

    ${whyBlock("Over $500 Million Won", "Más de $500 Millones Ganados", `
      ${T("p", "Since 1994 the firm has recovered $550M+ for injury victims and handled more than 20,000 cases. A few results:", "Desde 1994 el bufete ha recuperado $550M+ para víctimas de lesiones y ha manejado más de 20,000 casos. Algunos resultados:")}
      <div class="rgrid">
        ${rcard("$14,600,000", "Construction Accident", "Accidente de Construcción", "Settled in 289 days", "Resuelto en 289 días")}
        ${rcard("$8,750,000", "Premises Liability", "Lesiones en Propiedad Ajena", "Settled Aug. 2025", "Resuelto ago. 2025")}
        ${rcard("$4,500,000", "Car Accident", "Accidente de Auto", "Settled in 215 days", "Resuelto en 215 días")}
        ${rcard("$2,500,000", "Pedestrian Accident", "Accidente Peatonal", "Settled in 193 days", "Resuelto en 193 días")}
      </div>
      ${T("div", 'When an insurer insisted the policy limit was the most our client could ever get, we recovered <b>$1,025,000 — $750,000 more than their "maximum"</b> — for an 8-year-old rear-ended by a commercial vehicle.', "Cuando una aseguradora insistió en que el límite de la póliza era lo máximo que nuestro cliente podría recibir, recuperamos <b>$1,025,000 — $750,000 más que su «máximo»</b> — para un niño de 8 años impactado por detrás por un vehículo comercial.", 'class="rhigh"')}
      ${T("p", "Prior results do not guarantee a similar outcome. Every case is unique, and results depend on the facts and applicable law.", "Los resultados anteriores no garantizan un resultado similar. Cada caso es único y los resultados dependen de los hechos y de la ley aplicable.", 'class="fine"')}`, "results")}

    ${whyBlock("We Fight to Get You Paid While You Recover", "Luchamos para Que Le Paguen Mientras Se Recupera", `
      <div class="insider"><div class="grid">
        <figure><img src="img/george-goldberg.jpg" alt="George Goldberg, founding partner of Goldberg &amp; Loren" width="600" height="802" loading="lazy"><figcaption id="${figId}"><b>George Z. Goldberg</b>Founding Partner</figcaption></figure>
        <div>
          ${T("p", "Your job is to heal. Ours is everything else — every adjuster call, every deadline, the evidence, your medical records, and help coordinating your care.", "Su trabajo es sanar. El nuestro es todo lo demás — cada llamada del ajustador, cada plazo, la evidencia, sus expedientes médicos y ayuda para coordinar su atención.")}
          ${T("p", "Founding partner George Goldberg spent his first two years in practice defending airlines and insurance companies in injury litigation before switching sides in 1996 — so when the adjuster calls with a low offer, we already know their next three moves.", "El socio fundador George Goldberg pasó sus primeros dos años de práctica defendiendo a aerolíneas y aseguradoras en litigios por lesiones antes de cambiar de bando en 1996 — así que cuando el ajustador llama con una oferta baja, ya conocemos sus próximos tres movimientos.")}
          <div class="mult"><b>4.4x</b>${T("span", "Crash victims with a lawyer recover <b>$77,600 on average vs. $17,600</b> without one, according to a Martindale-Nolo consumer study.", "Las víctimas de accidentes con abogado recuperan <b>$77,600 en promedio vs. $17,600</b> sin uno, según un estudio de consumidores de Martindale-Nolo.")}</div>
        </div>
      </div></div>`, "attorneys")}

    ${whyBlock("Award-Winning Accident Attorneys Serving Austin and All of Travis County", "Abogados de Accidentes Premiados al Servicio de Austin y Todo el Condado de Travis", `
      ${T("p", "The firm's recognitions include a Martindale-Hubbell Distinguished peer rating, The National Trial Lawyers, and the Million Dollar Advocates Forum — and senior partner James Loren has tried more than 50 cases to verdict. Our Austin-area office is in Lakeway, and we represent clients across Austin and all of Travis County.", "Entre los reconocimientos del bufete están la calificación entre colegas Distinguished de Martindale-Hubbell, The National Trial Lawyers y el Million Dollar Advocates Forum — y el socio sénior James Loren ha llevado más de 50 casos a veredicto. Nuestra oficina del área de Austin está en Lakeway, y representamos a clientes en todo Austin y el condado de Travis.")}
      ${OFFICE_LINE}
      ${TESTIMONIALS}`, "reviews")}

    ${whyBlock("Free Car Accident Consultations", "Consultas Gratis para Accidentes de Auto", `
      ${T("p", "Your first conversation is free and confidential, and there's no obligation to hire us. Call any time, or tell us what happened in the 60-second form — either way, you'll know where you stand.", "Su primera conversación es gratis y confidencial, y no hay obligación de contratarnos. Llame a cualquier hora, o cuéntenos qué pasó en el formulario de 60 segundos — de cualquier forma, sabrá dónde está parado.")}
      <div class="faq faq-in" id="faq">
        ${faq("What does it cost to hire you?", "¿Cuánto cuesta contratarlos?", "Nothing up front — ever. The consultation is free, we front every cost of building your case, and we only collect an attorney fee if we recover money for you. No recovery, no attorney fee. (Court costs and case expenses may apply and are explained clearly in your agreement before you sign.)", "Nada por adelantado — nunca. La consulta es gratis, cubrimos todos los costos de armar su caso y solo cobramos honorarios si recuperamos dinero para usted. Sin recuperación, no hay honorarios de abogado. (Los costos judiciales y gastos del caso pueden aplicar y se explican claramente en su acuerdo antes de firmar.)")}
        ${faq("The insurance company already offered me money. Should I take it?", "La aseguradora ya me ofreció dinero. ¿Debo aceptarlo?", "Not before a free case review. First offers are low by design — adjusters are trained to settle before you know what your claim is worth. Signing usually ends your claim permanently, even if your injuries get worse. Let us look first; it costs you nothing.", "No antes de una evaluación gratuita. Las primeras ofertas son bajas por diseño — los ajustadores están entrenados para cerrar antes de que usted sepa cuánto vale su reclamo. Firmar normalmente termina su reclamo para siempre, aunque sus lesiones empeoren. Déjenos revisarlo primero; no le cuesta nada.")}
        ${faq("How much is my case worth?", "¿Cuánto vale mi caso?", "It depends on your medical bills, lost wages, future treatment, and what the crash has taken from your life. Insurers hope you'll guess low. A free case review gives you a realistic range before you accept anything.", "Depende de sus gastos médicos, salarios perdidos, tratamiento futuro y lo que el accidente le ha quitado. Las aseguradoras esperan que usted calcule de menos. Una evaluación gratuita le da un rango realista antes de aceptar nada.")}
        <details>${T("summary", "How long do I have to file?", "¿Cuánto tiempo tengo para presentar mi reclamo?")}<p><span data-geo="sol">${SOL_EN}</span></p></details>
        ${faq("Will I have to go to court?", "¿Tendré que ir a corte?", "Most cases settle without a trial. But insurers track which firms actually try cases — and pay more to avoid facing them. With 50+ trials taken to verdict, we negotiate from strength. If they won't pay fairly, we're ready.", "La mayoría de los casos se resuelven sin juicio. Pero las aseguradoras saben qué bufetes sí llegan a juicio — y pagan más para no enfrentarlos. Con más de 50 juicios a veredicto, negociamos desde la fuerza. Si no pagan lo justo, estamos listos.")}
        ${faq("What if I was partly at fault?", "¿Y si yo tuve parte de la culpa?", "You may still have a strong claim. In Texas you can recover as long as you're not more than 50% responsible — your recovery is simply reduced by your share. Don't accept the insurer's version of fault; get a free review first.", "Puede que aún tenga un caso sólido. En Texas puede recuperar compensación siempre que su responsabilidad no sea mayor al 50% — su recuperación simplemente se reduce según su parte. No acepte la versión de la aseguradora; primero obtenga una evaluación gratis.")}
      </div>`)}
  </div>
</section>

<section class="final">
  <div class="wrap">
    ${T("h2", 'Schedule a <span class="h1-teal">Free</span> Consultation with Our Austin Car Accident Attorneys', 'Programe una Consulta <span class="h1-teal">Gratis</span> con Nuestros Abogados de Accidentes de Auto en Austin', 'class="sec-h"')}
    ${T("p", "One call, 24/7. Nothing up front, nothing out of pocket, and no fee unless we win.", "Una llamada, 24/7. Nada por adelantado, nada de su bolsillo y sin honorarios a menos que ganemos.")}
    FINAL_CTAS
  </div>
</section>
`;

// the control's final call/form buttons are kept byte-for-byte: they are .cta-call[1]
// and .cta-form-link[1] in the positional ops, which stay valid because no other
// element on the page carries those classes
const FINAL_CTAS = grab(/<section class="final">[\s\S]*?(<div class="final-ctas">[\s\S]*?<\/div>)\s*<\/div>\s*<\/section>/, "final CTA buttons");

const CSS_ADD = `
/* ---- austin headings test: demoted titles keep their original look ---- */
.card-h{font-size:1.5rem;line-height:1.1;font-weight:800;letter-spacing:-.01em;color:var(--navy)}
.s-h{font-size:1.3rem;font-weight:700;margin-bottom:8px;color:var(--navy)}
.f-h{font-size:.68rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--navy);margin-bottom:11px}
.types,.why{background:var(--mist)}
.tgrid6{margin-top:26px;display:grid;gap:14px}
@media(min-width:720px){.tgrid6{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1040px){.tgrid6{grid-template-columns:repeat(3,1fr)}}
.type-card{background:#fff;border:1px solid var(--line);border-top:4px solid var(--btn);border-radius:14px;padding:22px 20px}
.type-card h3{font-size:1.08rem;font-weight:800;line-height:1.25;color:var(--navy)}
.type-card p{margin-top:8px;font-size:.9rem}
.type-cta{background:var(--navy);border-color:var(--navy);color:#fff;display:flex;flex-direction:column;justify-content:center;gap:12px}
.type-cta .tc-h{margin:0;font-size:1.1rem;font-weight:800;color:#fff}
.type-cta p{margin:0;color:rgba(255,255,255,.82)}
.type-cta .btn{align-self:flex-start}
.o24-call{padding:16px 20px;font-size:1.06rem}
.o24-call svg{width:20px;height:20px;flex:none}
.o24-form{padding:13px 22px;font-size:.88rem}
.o24-note{margin-top:18px}
.o24-ctas{margin-top:22px;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.why-block{background:#fff;border:1px solid var(--line);border-radius:16px;padding:26px 22px;margin-top:16px}
.why-block>h3{font-size:clamp(1.2rem,2.6vw,1.45rem);font-weight:800;line-height:1.2;color:var(--navy)}
.why-block>p{margin-top:10px}
.why-block .rgrid,.why-block .tgrid{margin-top:18px}
.why-block .insider .grid{margin-top:16px}
.why-block .local-line{margin-top:14px}
.faq-in{background:none;margin-top:6px}
@media(max-width:520px){.o24-ctas .btn,.type-cta .btn{width:100%;align-self:stretch}.why-block{padding:22px 16px}.why-block .rcard{padding:16px 8px}}
`;

// ------------------------------------------------------------ assemble
mustReplace(/<title>[^<]*<\/title>/, "<title>Austin Car Accident Attorneys | Free Consultation 24/7 | Goldberg &amp; Loren</title>", "title");
mustReplace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="Austin car accident attorneys, open 24 hours. Free consultation, no fees unless we win, and $550M+ recovered for injury victims since 1994.">', "meta description");
mustReplace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Austin Car Accident Attorneys | Goldberg & Loren">', "og:title");
mustReplace(/<h1>[\s\S]*?<\/h1>/, '<h1><span class="h1-pre"></span><em class="h1-city" data-geo="h1city">Austin</em><span class="h1-post"> Car Accident Attorneys</span></h1>', "h1");
mustReplace("<h2>What's Your Case Worth?</h2>", `<p class="card-h">What's Your Case Worth?</p>`, "form card heading");
mustReplace('<h3>Got it<span id="s-name"></span>.</h3>', '<p class="s-h">Got it<span id="s-name"></span>.</p>', "success heading");
for (const t of ["Practice Areas", "Locations"]) mustReplace(`<h3>${t}</h3>`, `<p class="f-h">${t}</p>`, `footer "${t}" heading`);
mustReplace("</style>", CSS_ADD + "</style>", "closing style tag");

const start = html.indexOf('<section class="results" id="results">');
const end = html.indexOf("</main>");
if (start < 0 || end < start || count(html, "</main>") !== 1) { console.error("could not find the body sections to replace"); fail = true; }
else html = html.slice(0, start) + BODY.replace("FINAL_CTAS", () => FINAL_CTAS) + html.slice(end);

mustReplace('payload._subject = "GoldbergandlorenPPC";', `payload._subject = "GoldbergandlorenPPC"; payload.variant = "${VARIANT}";`, "payload subject line");
mustReplace('"&ct=car-accident"', `"&ct=car-accident&variant=${VARIANT}"`, "thank-you ct param");
mustReplace("</body>", `<script>window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:"page_variant",variant:"${VARIANT}"});</script>\n</body>`, "closing body tag");

// ------------------------------------------------------------ Spanish ops
const I18N_RE = /(<script type="application\/json" id="i18n-es">)([\s\S]*?)(<\/script>)/;
const I18N = JSON.parse(html.match(I18N_RE)[2]);
// every positional op aimed at a section that no longer exists
const DROP = new Set([".eyebrow", ".sec-h", ".sec-sub", ".rcard span", ".rcard em", ".rhigh", ".fine",
  ".insider .grid p", ".mult > span", ".tick-chip", ".insider figcaption", ".faq summary", ".faq details p",
  ".final .h1-teal", ".step b", ".step p", ".final .sec-h", ".final p"]);
const RESELECT = { ".card h2": ".card .card-h", ".success h3": ".success .s-h", ".f-col h3": ".f-col .f-h" };
const before = I18N.ops.length;
let ops = I18N.ops.filter(o => !DROP.has(o[1])).map(o => RESELECT[o[1]] ? [o[0], RESELECT[o[1]], o[2], o[3]] : o);
// H1 — EN: "" + "Austin" + " Car Accident Attorneys"; ES: "Abogados de Accidentes de Auto" + " en Austin" (from geo data) + ""
ops = ops.map(o => o[1] === ".h1-pre" ? ["t", ".h1-pre", 0, "Abogados de Accidentes de Auto"]
                 : o[1] === ".h1-post" ? ["t", ".h1-post", 0, ""] : o);
I18N.ops = ops.concat(OPS);
I18N.title = "Abogados de Accidentes de Auto | Consulta Gratis 24/7 | Goldberg & Loren";
html = html.replace(I18N_RE, (_, a, __, c) => a + JSON.stringify(I18N).replace(/<\//g, "<\\/") + c);

// ------------------------------------------------------------ the outline must be exactly the client's
const decode = s => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, " ").trim();
const got = [...html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/g)].map(m => [m[1], decode(m[2])]);
const same = got.length === OUTLINE.length && got.every(([t, x], i) => t === OUTLINE[i][0] && x === OUTLINE[i][1]);
if (!same) {
  fail = true;
  console.error("heading outline does not match the client's:");
  for (let i = 0; i < Math.max(got.length, OUTLINE.length); i++)
    console.error(`  ${JSON.stringify(got[i] || null) === JSON.stringify(OUTLINE[i] || null) ? "ok " : "XX "} got ${JSON.stringify(got[i] || null)}  want ${JSON.stringify(OUTLINE[i] || null)}`);
}

if (fail) process.exit(1);
writeFileSync(OUT, html);
console.log(`built ${OUT} — outline matches (${got.length} headings), Spanish ops ${before} → ${I18N.ops.length} (${OPS.length} new, id-addressed)`);
