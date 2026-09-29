#!/usr/bin/env node
/**
 * NEW TAGs landers — the client's H1/H2/H3 outline, for every city × case type.
 *   node generate-tag-landers.mjs
 *
 * Each page is built FROM its baked control lander (e.g. car-accident-dallas-tx.html
 * → dallas-car-accident-attorneys.html): same design, hero, form, phone number and
 * tracking, so a split test isolates content and heading structure. Everything
 * between the hero and the footer is rebuilt around the outline the client gave
 * for Austin, generalised:
 *
 *   H1  {City} {Case} Attorneys
 *   H2  Types of Cases Our {City} {Case} Attorneys Represent        (5 × H3, per case type)
 *   H2  {Case} Attorneys in {City}, {ST} Open 24 Hours
 *   H2  Why Turn to a {Case} Attorney in {City} After a Crash        (5 × H3)
 *   H2  Schedule a Free Consultation with Our {City} {Case} Attorneys
 *
 * Titles that were h2/h3 on the control (form card, success message, footer
 * columns) become styled paragraphs, so each page's outline is exactly that —
 * the build fails on any drift. State law in the copy (fault rules, dram shop,
 * filing years, rideshare coverage) comes from the STATES table, stated generally;
 * local roads and the county come from MARKETS. A new market fails the build until
 * it has a MARKETS row.
 *
 * Spanish: the landers' i18n ops are positional, so ops aimed at removed sections
 * are dropped and all new content is addressed by id. Call buttons translate around
 * the number, so CallRail's swapped number survives a language change.
 *
 * Leads carry variant:"{city}-headings" (Austin's original tag, extended), the
 * thank-you redirect gains &variant=…, and a page_variant event goes to the dataLayer.
 *
 * Group C: every page also gets a twin, {city}-{case}-attorneys-photo.html, that is
 * the same page plus the partners' photo (after the call buttons on phones, standing
 * behind the form on desktop), tagged "{city}-headings-photo". Nothing else differs,
 * so B vs C measures the photo alone.
 *
 * Re-run after re-baking the landers (node generate-geo.mjs <master>.html --all).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const master = readFileSync(new URL("car-accident.html", import.meta.url), "utf8");  // importable from any cwd
const GEOS = JSON.parse(master.match(/<script type="application\/json" id="geo-data">([\s\S]*?)<\/script>/)[1]);

// ---------------------------------------------------------------- state law, stated generally
const FAULT = {
  le50: (n, e) => [`${n} divides fault by percentage — you can still recover as long as you're not more than 50% responsible, with your award reduced by your share.`,
                   `${e} divide la culpa por porcentaje — usted aún puede recuperar siempre que su responsabilidad no sea mayor al 50%, y su compensación se reduce según su parte.`,
                   `In ${n} you can recover as long as you're not more than 50% responsible — your recovery is simply reduced by your share.`,
                   `En ${e} puede recuperar compensación siempre que su responsabilidad no sea mayor al 50% — su recuperación simplemente se reduce según su parte.`],
  lt50: (n, e) => [`${n} divides fault by percentage — you can still recover as long as you're less than 50% responsible, with your award reduced by your share.`,
                   `${e} divide la culpa por porcentaje — usted aún puede recuperar siempre que su responsabilidad sea menor al 50%, y su compensación se reduce según su parte.`,
                   `In ${n} you can recover as long as you're less than 50% responsible — your recovery is simply reduced by your share.`,
                   `En ${e} puede recuperar compensación siempre que su responsabilidad sea menor al 50% — su recuperación simplemente se reduce según su parte.`],
  pure: (n, e) => [`${n} uses pure comparative fault — you can recover even if you were mostly to blame, with your award reduced by your share.`,
                   `${e} aplica la culpa comparativa pura — usted puede recuperar aunque haya tenido la mayor parte de la culpa, y su compensación se reduce según su parte.`,
                   `In ${n} you can recover even if you were mostly at fault — your recovery is simply reduced by your share.`,
                   `En ${e} puede recuperar compensación aunque haya tenido la mayor parte de la culpa — su recuperación simplemente se reduce según su parte.`],
};
// where a bar's liability for over-serving an adult is limited (CA, NV, FL), point at UM/UIM instead
const DRAM = {
  TX: ["under Texas's dram shop law, a bar or restaurant that kept serving someone who was obviously intoxicated can share responsibility for the crash.",
       "bajo la ley de Texas sobre establecimientos que venden alcohol (dram shop), un bar o restaurante que siguió sirviéndole a alguien obviamente intoxicado puede compartir la responsabilidad del choque."],
  OR: ["under Oregon law, a bar or restaurant that kept serving someone who was visibly intoxicated can share responsibility for the crash.",
       "bajo la ley de Oregón, un bar o restaurante que siguió sirviéndole a alguien visiblemente intoxicado puede compartir la responsabilidad del choque."],
  ID: ["under Idaho law, a bar or restaurant that kept serving someone who was obviously intoxicated can share responsibility for the crash.",
       "bajo la ley de Idaho, un bar o restaurante que siguió sirviéndole a alguien obviamente intoxicado puede compartir la responsabilidad del choque."],
  ND: ["under North Dakota law, a bar or restaurant that knowingly kept serving someone who was obviously intoxicated can share responsibility for the crash.",
       "bajo la ley de Dakota del Norte, un bar o restaurante que a sabiendas siguió sirviéndole a alguien obviamente intoxicado puede compartir la responsabilidad del choque."],
  UM: ["your own uninsured or underinsured motorist coverage, for example, may pay what the driver's insurer won't.",
       "su propia cobertura contra conductores sin seguro o con seguro insuficiente, por ejemplo, puede pagar lo que la aseguradora del conductor no pague."],
};
const RIDESHARE = {
  TX: ["Texas law requires $1,000,000 in liability coverage once a rideshare driver accepts a trip, and far less while the driver is only logged in and waiting.",
       "La ley de Texas exige $1,000,000 en cobertura de responsabilidad una vez que el conductor acepta un viaje, y mucho menos mientras solo está conectado esperando."],
  CO: ["Uber and Lyft keep at least $1,000,000 in liability coverage in place once a driver accepts a trip, and far less while the driver is only logged in and waiting.",
       "Uber y Lyft mantienen al menos $1,000,000 en cobertura de responsabilidad una vez que el conductor acepta un viaje, y mucho menos mientras solo está conectado esperando."],
};
const STATES = {
  TX: { n: "Texas", e: "Texas", years: ["two", "dos"], dui: "DWI", fault: "le50", dram: "TX", rs: "TX" },
  CA: { n: "California", e: "California", years: ["two", "dos"], dui: "DUI", fault: "pure", dram: "UM", rs: "CO" },
  NV: { n: "Nevada", e: "Nevada", years: ["two", "dos"], dui: "DUI", fault: "le50", dram: "UM", rs: "CO" },
  OR: { n: "Oregon", e: "Oregón", years: ["two", "dos"], dui: "DUI", fault: "le50", dram: "OR", rs: "CO" },
  ID: { n: "Idaho", e: "Idaho", years: ["two", "dos"], dui: "DUI", fault: "lt50", dram: "ID", rs: "CO" },
  ND: { n: "North Dakota", e: "Dakota del Norte", years: ["six", "seis"], dui: "DUI", fault: "lt50", dram: "ND", rs: "CO" },
  FL: { n: "Florida", e: "Florida", years: ["two", "dos"], dui: "DUI", fault: "le50", dram: "UM", rs: "CO" },
};

// ---------------------------------------------------------------- per market: state, busy roads (EN/ES), county
const MARKETS = {
  "portland-or":          ["OR", "I-5, I-84, and I-205", "la I-5, la I-84 y la I-205", "Multnomah County", "el Condado de Multnomah", "el condado de Multnomah"],
  "los-angeles-ca":       ["CA", "the 405, the 101, and I-10", "la 405, la 101 y la I-10", "Los Angeles County", "el Condado de Los Ángeles", "el condado de Los Ángeles"],
  "las-vegas-nv":         ["NV", "I-15, US-95, and the 215 Beltway", "la I-15, la US-95 y la 215", "Clark County", "el Condado de Clark", "el condado de Clark"],
  "fresno-ca":            ["CA", "Highway 99, Highway 41, and Highway 180", "la autopista 99, la 41 y la 180", "Fresno County", "el Condado de Fresno", "el condado de Fresno"],
  "boise-id":             ["ID", "I-84, the Connector, and Fairview Avenue", "la I-84, el Connector y Fairview Avenue", "Ada County", "el Condado de Ada", "el condado de Ada"],
  "fargo-nd":             ["ND", "I-94, I-29, and 13th Avenue South", "la I-94, la I-29 y la 13th Avenue South", "Cass County", "el Condado de Cass", "el condado de Cass"],
  "midland-tx":           ["TX", "I-20, Loop 250, and Highway 191", "la I-20, el Loop 250 y la autopista 191", "Midland County", "el Condado de Midland", "el condado de Midland"],
  "austin-tx":            ["TX", "I-35, MoPac, and US-183", "la I-35, MoPac y la US-183", "Travis County", "el Condado de Travis", "el condado de Travis"],
  "san-antonio-tx":       ["TX", "I-35, I-10, and Loop 410", "la I-35, la I-10 y el Loop 410", "Bexar County", "el Condado de Bexar", "el condado de Bexar"],
  "dallas-tx":            ["TX", "I-35E, I-30, and US-75", "la I-35E, la I-30 y la US-75", "Dallas County", "el Condado de Dallas", "el condado de Dallas"],
  "downtown-dallas-tx":   ["TX", "I-35E, I-30, and Woodall Rodgers", "la I-35E, la I-30 y la Woodall Rodgers", "Dallas County", "el Condado de Dallas", "el condado de Dallas"],
  "arlington-tx":         ["TX", "I-30, I-20, and Highway 360", "la I-30, la I-20 y la autopista 360", "Tarrant County", "el Condado de Tarrant", "el condado de Tarrant"],
  "dallas-fort-worth-tx": ["TX", "I-35, I-30, and I-635", "la I-35, la I-30 y la I-635", "North Texas", "el Norte de Texas", "el norte de Texas"],
  "fort-worth-tx":        ["TX", "I-35W, I-30, and Loop 820", "la I-35W, la I-30 y el Loop 820", "Tarrant County", "el Condado de Tarrant", "el condado de Tarrant"],
  "grapevine-tx":         ["TX", "Highway 114, Highway 121, and I-635", "la autopista 114, la 121 y la I-635", "Tarrant County", "el Condado de Tarrant", "el condado de Tarrant"],
  "rockwall-tx":          ["TX", "I-30, Highway 205, and Highway 66", "la I-30, la autopista 205 y la 66", "Rockwall County", "el Condado de Rockwall", "el condado de Rockwall"],
  "frisco-tx":            ["TX", "the Dallas North Tollway, Highway 121, and US-380", "el Dallas North Tollway, la autopista 121 y la US-380", "Collin County", "el Condado de Collin", "el condado de Collin"],
  "plano-tx":             ["TX", "US-75, the Dallas North Tollway, and the Bush Turnpike", "la US-75, el Dallas North Tollway y el Bush Turnpike", "Collin County", "el Condado de Collin", "el condado de Collin"],
  "celina-tx":            ["TX", "Preston Road and FM 455", "Preston Road y la FM 455", "Collin County", "el Condado de Collin", "el condado de Collin"],
  "prosper-tx":           ["TX", "US-380, Preston Road, and the Dallas North Tollway", "la US-380, Preston Road y el Dallas North Tollway", "Collin County", "el Condado de Collin", "el condado de Collin"],
  "mckinney-tx":          ["TX", "US-75, US-380, and Highway 121", "la US-75, la US-380 y la autopista 121", "Collin County", "el Condado de Collin", "el condado de Collin"],
  "plantation-fl":        ["FL", "I-595, State Road 7, and Broward Boulevard", "la I-595, la State Road 7 y Broward Boulevard", "Broward County", "el Condado de Broward", "el condado de Broward"],
};

// ---------------------------------------------------------------- per case type: labels + the five "types of cases"
// each type: [H3 EN, H3 ES, body EN, body ES]; m = market context, s = state context
const CASES = {
  "car-accident": {
    label: "Car Accident", lower: "car accident", es: "Auto", lowerEs: "accidentes de auto",
    eyebrow: ["Car Accident Cases", "Casos de Accidentes de Auto"],
    intro: ["Every crash is different — and so is the way insurers try to minimize it.", "Cada accidente es diferente — y también la forma en que las aseguradoras intentan minimizarlo."],
    types: (m, s) => [
      ["Red Light Accidents", "Accidentes por Pasarse la Luz Roja",
        "A driver who runs a red light usually hits the side of another car — and a side impact, or T-bone crash, leaves people with the least protection. Proving who had the light takes fast work: security and dash-cam footage and witness statements disappear within days, so we move to lock them down before the other driver's insurer argues the light was yellow.",
        "Un conductor que se pasa la luz roja normalmente choca contra el costado de otro auto — y un impacto lateral, o choque en T, deja a las personas con la menor protección. Probar quién tenía la luz exige actuar rápido: los videos de seguridad y de cámaras de tablero, y las declaraciones de testigos, desaparecen en días, así que actuamos para asegurarlos antes de que la aseguradora del otro conductor alegue que la luz estaba en amarillo."],
      ["Car Crashes Involving Drunk Drivers", "Choques Causados por Conductores Ebrios",
        `A criminal ${s.dui} case punishes the driver — it doesn't pay your medical bills. Your injury claim is separate, and it can reach beyond the driver's own policy: ${DRAM[s.dram][0]}`,
        `Un caso penal por ${s.dui} castiga al conductor — pero no paga sus gastos médicos. Su reclamo por lesiones es aparte, y puede ir más allá de la póliza del conductor: ${DRAM[s.dram][1]}`],
      ["Rear-End Accidents", "Choques por Detrás",
        `Stop-and-go traffic on ${m.roads} makes rear-end crashes an everyday event in ${m.city}. The driver who hits from behind is usually at fault — but insurers still fight the injuries, because whiplash and back injuries often don't show up for a day or two. Get checked by a doctor, and let us deal with the adjuster.`,
        `El tráfico de arranque y parada en ${m.roadsEs} hace que los choques por detrás sean algo diario en ${m.cityEs}. El conductor que golpea por detrás normalmente tiene la culpa — pero las aseguradoras aun así disputan las lesiones, porque el latigazo cervical y las lesiones de espalda a menudo no aparecen hasta uno o dos días después. Hágase revisar por un médico y déjenos tratar con el ajustador.`],
      ["Rideshare Accidents", "Accidentes de Uber y Lyft",
        `Hurt in an Uber or Lyft — as a passenger, another driver, or a pedestrian? ${RIDESHARE[s.rs][0]} Which policy applies turns on what the app was doing at the moment of the crash — and the companies know it. We sort it out.`,
        `¿Se lesionó en un Uber o Lyft — como pasajero, como otro conductor o como peatón? ${RIDESHARE[s.rs][1]} Qué póliza aplica depende de lo que hacía la aplicación en el momento del choque — y las compañías lo saben. Nosotros lo resolvemos.`],
      ["Chain Reaction Auto Accidents", "Accidentes en Cadena",
        `Multi-car pileups are the hardest crashes to untangle: several drivers, several insurers, and everyone pointing at someone else. ${s.faultText[0]} We reconstruct the sequence of impacts so the blame lands where it belongs.`,
        `Las carambolas de varios autos son los choques más difíciles de aclarar: varios conductores, varias aseguradoras y todos culpando a alguien más. ${s.faultText[1]} Reconstruimos la secuencia de impactos para que la culpa recaiga donde corresponde.`],
    ],
  },
  "truck-accident": {
    label: "Truck Accident", lower: "truck accident", es: "Camión", lowerEs: "accidentes de camión",
    eyebrow: ["Truck Accident Cases", "Casos de Accidentes de Camión"],
    intro: ["Truck crashes aren't just bigger car accidents — they involve federal safety rules, commercial insurers, and often more than one company that can share the blame.", "Los choques con camiones no son solo accidentes de auto más grandes — involucran normas federales de seguridad, aseguradoras comerciales y, a menudo, más de una compañía que puede compartir la culpa."],
    types: () => [
      ["Jackknife Accidents", "Accidentes de Camión en Tijera",
        "When a trailer swings out at an angle to the cab, it can sweep across several lanes at once. Jackknifes usually trace back to hard braking, speed, or an unbalanced load — and the truck's engine control module records the speed and braking data that proves it, if someone preserves it in time.",
        "Cuando el remolque se dobla en ángulo con la cabina, puede barrer varios carriles a la vez. Estos choques suelen deberse a frenadas bruscas, exceso de velocidad o una carga desbalanceada — y el módulo de control del motor del camión registra los datos de velocidad y frenado que lo prueban, si alguien los preserva a tiempo."],
      ["Underride Accidents", "Accidentes por Debajo del Remolque",
        "When a car slides beneath a trailer, the trailer bed can strike at windshield height — above the part of the car built to absorb a crash. These are among the most catastrophic crashes on the road, and they raise hard questions about the trailer's rear guard, its lighting, and its maintenance records.",
        "Cuando un auto se desliza por debajo de un remolque, la plataforma puede golpear a la altura del parabrisas — por encima de la parte del auto diseñada para absorber un choque. Están entre los choques más catastróficos, y plantean preguntas serias sobre la barrera trasera del remolque, sus luces y sus registros de mantenimiento."],
      ["Rollover Truck Accidents", "Volcaduras de Camión",
        "A loaded trailer carries its weight high, so taking a curve or an exit ramp too fast can tip the whole rig. Rollovers often scatter cargo and involve several vehicles. We look at the speed data, how the load was secured, and who loaded it — the shipper or loading company can share the blame.",
        "Un remolque cargado lleva el peso en alto, así que tomar una curva o una rampa de salida demasiado rápido puede volcar todo el camión. Las volcaduras a menudo riegan carga y afectan a varios vehículos. Revisamos los datos de velocidad, cómo se aseguró la carga y quién la cargó — el remitente o la compañía que cargó puede compartir la culpa."],
      ["Wide-Turn and Blind-Spot Accidents", "Accidentes por Giros Amplios y Puntos Ciegos",
        "Big rigs swing wide to turn and have blind spots on every side. When a driver turns across a lane without checking, or merges into a car that was there all along, the trucking company's training and safety records become evidence.",
        "Los camiones grandes abren mucho el giro y tienen puntos ciegos por todos lados. Cuando un conductor gira atravesando un carril sin revisar, o se incorpora sobre un auto que siempre estuvo ahí, los registros de capacitación y seguridad de la compañía se vuelven evidencia."],
      ["Accidents Involving Fatigued Truck Drivers", "Accidentes con Camioneros Fatigados",
        "Federal rules generally limit truck drivers to 11 hours of driving after 10 hours off duty, and electronic logs record every hour. Tight delivery schedules can push drivers past those limits. We demand the logs, dispatch records, and the company's pay policies before they can disappear.",
        "Las normas federales generalmente limitan a los camioneros a 11 horas de manejo después de 10 horas fuera de servicio, y los registros electrónicos anotan cada hora. Los horarios de entrega apretados pueden empujar a los conductores a pasar esos límites. Exigimos los registros, los despachos y las políticas de pago de la compañía antes de que desaparezcan."],
    ],
  },
  "motorcycle-accident": {
    label: "Motorcycle Accident", lower: "motorcycle accident", es: "Motocicleta", lowerEs: "accidentes de motocicleta",
    eyebrow: ["Motorcycle Accident Cases", "Casos de Accidentes de Motocicleta"],
    intro: ["Insurers often start by blaming the rider. We start with the evidence.", "Las aseguradoras a menudo empiezan culpando al motociclista. Nosotros empezamos con la evidencia."],
    types: (m) => [
      ["Left-Turn Motorcycle Accidents", "Accidentes de Motocicleta por Giros a la Izquierda",
        "One of the most common ways a car hits a motorcycle: a driver turns left across the rider's path, then says they never saw the bike. &ldquo;I didn't see him&rdquo; is an admission, not an excuse — and intersection video and witness statements can prove the rider was there to be seen.",
        "Una de las formas más comunes en que un auto golpea a una motocicleta: un conductor gira a la izquierda atravesando el camino del motociclista y luego dice que nunca vio la moto. «No lo vi» es una admisión, no una excusa — y los videos de la intersección y las declaraciones de testigos pueden probar que el motociclista estaba ahí para ser visto."],
      ["Lane-Change and Blind-Spot Accidents", "Accidentes por Cambio de Carril y Puntos Ciegos",
        "A motorcycle can disappear in a mirror's blind spot. When a driver changes lanes without a proper look, the rider has nowhere to go. We reconstruct the lane change from the damage, video, and witnesses.",
        "Una motocicleta puede desaparecer en el punto ciego de un espejo. Cuando un conductor se cambia de carril sin revisar bien, el motociclista no tiene a dónde ir. Reconstruimos el cambio de carril a partir de los daños, los videos y los testigos."],
      ["Rear-End Motorcycle Accidents", "Choques por Detrás a Motocicletas",
        `A bump that barely dents a car's bumper can throw a rider off the bike. Riders stopped at lights and in slowing traffic on ${m.roads} are especially exposed. The driver behind is usually at fault — and we make sure the injuries, not just the bike, get paid for.`,
        `Un golpe que apenas abolla la defensa de un auto puede lanzar al motociclista de la moto. Los motociclistas detenidos en semáforos y en el tráfico lento de ${m.roadsEs} están especialmente expuestos. El conductor de atrás normalmente tiene la culpa — y nos aseguramos de que se paguen las lesiones, no solo la moto.`],
      ["Road Hazard Accidents", "Accidentes por Peligros en la Vía",
        "Potholes, loose gravel, uneven pavement, and debris a car rolls right over can take a motorcycle down. Claims against a government agency or road contractor often carry short notice deadlines — sometimes just months — so call early.",
        "Los baches, la grava suelta, el pavimento disparejo y los escombros que un auto pasa sin problema pueden tumbar una motocicleta. Los reclamos contra una agencia de gobierno o un contratista de carreteras a menudo tienen plazos cortos de aviso — a veces de solo meses — así que llame pronto."],
      ["Hit-and-Run Motorcycle Accidents", "Accidentes de Motocicleta con Fuga",
        "When the driver flees, your own uninsured motorist coverage may pay what they won't — if the claim is reported and handled correctly. We track down video and witnesses to find the driver, and we deal with your insurer so it treats you fairly.",
        "Cuando el conductor huye, su propia cobertura contra conductores sin seguro puede pagar lo que ellos no pagan — si el reclamo se reporta y se maneja correctamente. Buscamos videos y testigos para encontrar al conductor, y tratamos con su aseguradora para que lo trate de forma justa."],
    ],
  },
  "rideshare-accident": {
    label: "Rideshare Accident", lower: "rideshare accident", es: "Uber y Lyft", lowerEs: "accidentes de Uber y Lyft",
    eyebrow: ["Rideshare Accident Cases", "Casos de Accidentes de Uber y Lyft"],
    intro: ["Uber and Lyft claims turn on details most people never think about — starting with what the driver's app was doing at the moment of the crash.", "Los reclamos contra Uber y Lyft dependen de detalles en los que casi nadie piensa — empezando por lo que hacía la aplicación del conductor en el momento del choque."],
    types: (m, s) => [
      ["Uber and Lyft Passenger Injuries", "Lesiones de Pasajeros de Uber y Lyft",
        "As a passenger you're almost never at fault — but that doesn't make the claim simple. Depending on who caused the crash, it may run against your driver's rideshare coverage, the other driver's insurer, or both. We sort out which policies apply and make them pay.",
        "Como pasajero, casi nunca tiene la culpa — pero eso no hace que el reclamo sea sencillo. Según quién causó el choque, puede ir contra la cobertura de viaje de su conductor, contra la aseguradora del otro conductor o contra ambas. Nosotros determinamos qué pólizas aplican y hacemos que paguen."],
      ["Accidents Caused by Rideshare Drivers", "Accidentes Causados por Conductores de Uber y Lyft",
        `Hit by someone driving for Uber or Lyft? Whether the company's coverage applies depends on the app's status at the moment of impact — logged off, waiting for a request, or on a trip. ${RIDESHARE[s.rs][0]}`,
        `¿Lo chocó alguien que manejaba para Uber o Lyft? Que aplique la cobertura de la compañía depende del estado de la aplicación en el momento del impacto — desconectada, esperando una solicitud o en un viaje. ${RIDESHARE[s.rs][1]}`],
      ["Pedestrian and Cyclist Rideshare Accidents", "Peatones y Ciclistas Atropellados por Conductores de Uber y Lyft",
        "Rideshare drivers spend their shifts watching an app, hunting for pickups, and stopping where they shouldn't. When a pedestrian or cyclist pays the price, the claim can reach the rideshare coverage as well as the driver's own policy, depending on the app's status.",
        "Los conductores de Uber y Lyft pasan su turno mirando una aplicación, buscando pasajeros y deteniéndose donde no deben. Cuando un peatón o ciclista paga las consecuencias, el reclamo puede alcanzar la cobertura de viaje además de la póliza propia del conductor, según el estado de la aplicación."],
      ["Rideshare Drivers Injured by Other Drivers", "Conductores de Uber y Lyft Lesionados por Otros Conductores",
        "Drive for Uber or Lyft and got hit? You have a claim against the driver who caused it — and depending on your app status, the rideshare company's own coverage may also come into play. Your personal auto insurer may try to deny the claim because you were working; we handle that fight too.",
        "¿Maneja para Uber o Lyft y lo chocaron? Tiene un reclamo contra el conductor que lo causó — y según el estado de su aplicación, la cobertura de la compañía también puede entrar en juego. Su aseguradora personal puede intentar negar el reclamo porque usted estaba trabajando; nosotros también damos esa pelea."],
      ["Pick-Up and Drop-Off Accidents", "Accidentes al Recoger y Dejar Pasajeros",
        "Sudden stops for a pickup, double-parking, and doors swung open into traffic cause crashes every day. These claims often turn on the trip record — the app shows when the ride was accepted and where the driver was — and we move to preserve it before it's gone.",
        "Las frenadas repentinas para recoger a alguien, el estacionarse en doble fila y las puertas que se abren hacia el tráfico causan choques todos los días. Estos reclamos a menudo dependen del registro del viaje — la aplicación muestra cuándo se aceptó el viaje y dónde estaba el conductor — y actuamos para preservarlo antes de que desaparezca."],
    ],
  },
};

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

// group C only: the partners' photo. Phones: in the hero flow right after the call buttons,
// fading out at the waist. Desktop: lifted into the form column, the card overlapping its base.
// The card's margin-top is a percentage of the column width, so it tracks the photo's height
// (624/960 = 65% of its width) at any viewport.
export const PHOTO_CSS = `
/* ---- group C: the partners' photo — after the call buttons on phones, behind the form on desktop ---- */
.hero-team{position:relative;z-index:0;margin:22px auto 0;max-width:460px}
.hero-team::before{content:"";position:absolute;left:5%;right:5%;top:10%;bottom:0;border-radius:999px 999px 0 0;background:linear-gradient(180deg,#e4f0ed 0%,rgba(242,245,249,0) 88%)}
.hero-team img{position:relative;display:block;width:100%;height:auto}
.hero-team figcaption{position:absolute;left:0;right:0;bottom:10px;z-index:1;display:flex;justify-content:space-between;gap:6px}
.tn{background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 6px 18px rgba(21,59,102,.16);padding:6px 11px 7px;line-height:1.2}
.tn b{display:block;font-size:.8rem;font-weight:800;color:var(--navy);white-space:nowrap}
.tn i{display:block;margin-top:2px;font-style:normal;font-size:.58rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--btn);white-space:nowrap}
@media(max-width:959px){.hero-team img{-webkit-mask-image:linear-gradient(#000 70%,transparent 97%);mask-image:linear-gradient(#000 70%,transparent 97%)}}
@media(max-width:374px){.tn{padding:5px 8px 6px}.tn b{font-size:.72rem}.tn i{font-size:.52rem;letter-spacing:.08em}}
@media(min-width:960px){
.hero-in{grid-template-rows:auto 1fr}
.hero-team{position:absolute;top:56px;right:20px;width:calc((100% - 76px) * .8 / 1.85);max-width:none;margin:0}
.hero-team figcaption{bottom:62px}
.hero-in>.card{z-index:1;margin-top:calc(65% - 50px)}
}
`;
export const PHOTO_FIGURE = `<figure class="hero-team">
        <img src="img/partners-720.webp" srcset="img/partners-480.webp 480w, img/partners-720.webp 720w, img/partners-960.webp 960w" sizes="(min-width: 960px) 480px, (min-width: 500px) 460px, calc(100vw - 40px)" width="960" height="624" alt="James M. Loren and George Z. Goldberg, partners of Goldberg &amp; Loren" fetchpriority="high">
        <figcaption><span class="tn"><b>James M. Loren</b><i id="tp1">Senior Partner</i></span><span class="tn"><b>George Z. Goldberg</b><i id="tp2">Founding Partner</i></span></figcaption>
      </figure>
      `;
export const PHOTO_OPS = [["t", "#tp1", 0, "Socio Sénior"], ["t", "#tp2", 0, "Socio Fundador"]];

// every positional Spanish op aimed at a section that no longer exists
const DROP = new Set([".eyebrow", ".sec-h", ".sec-sub", ".rcard span", ".rcard em", ".rhigh", ".fine",
  ".insider .grid p", ".mult > span", ".tick-chip", ".insider figcaption", ".faq summary", ".faq details p",
  ".final .h1-teal", ".step b", ".step p", ".final .sec-h", ".final p"]);
const RESELECT = { ".card h2": ".card .card-h", ".success h3": ".success .s-h", ".f-col h3": ".f-col .f-h" };

export const short = geo => geo.replace(/-[a-z]{2}$/, "");
export const outFile = (geo, cs) => `${short(geo)}-${cs}-attorneys.html`;
export const photoFile = (geo, cs) => `${short(geo)}-${cs}-attorneys-photo.html`;

// "Our Austin-area office is in Lakeway…" only where the market really has its own office
function officeSentence(g, m) {
  const o = (g.office || "").match(/^(.+?) office: .*?, ([^,]+), [A-Z]{2} \d{5}/);
  const tail = [`we represent clients across ${m.city} and all of ${m.area}.`, `representamos a clientes en todo ${m.cityEs} y ${m.areaEsBody}.`];
  if (o && (o[1] === m.city + "-area" || (o[1] === m.city && o[2] !== m.city)))
    return [`Our ${m.city}-area office is in ${o[2]}, and ${tail[0]}`, `Nuestra oficina del área de ${m.cityEs} está en ${o[2]}, y ${tail[1]}`];
  if (o && o[1] === m.city)
    return [`Our office is right here in ${m.city}, and ${tail[0]}`, `Nuestra oficina está aquí mismo en ${m.cityEs}, y ${tail[1]}`];
  return [`W${tail[0].slice(1)}`, `R${tail[1].slice(1)}`];
}

function build(geo, cs, photo = false) {
  const SRC = `${cs}-${geo}.html`, OUT = photo ? photoFile(geo, cs) : outFile(geo, cs);
  const VARIANT = `${short(geo)}-headings${photo ? "-photo" : ""}`;
  const g = GEOS[geo], C = CASES[cs];
  const [st, roads, roadsEs, area, areaEsH, areaEsBody] = MARKETS[geo];
  const S = STATES[st];
  const cityEs = g.h1city_es.replace(/^ en /, "");
  const m = { city: g.city, cityEs, roads, roadsEs, area, areaEsH, areaEsBody };
  const s = { ...S, faultText: FAULT[S.fault](S.n, S.e) };
  const deCity = cityEs.startsWith("el ") ? "del " + cityEs.slice(3) : "de " + cityEs;
  const L = C.label, city = g.city;

  let html = readFileSync(SRC, "utf8");
  let ok = true;
  const count = (str, find) => str.split(find).length - 1;
  const mustReplace = (find, repl, what) => {
    const n = typeof find === "string" ? count(html, find) : (html.match(new RegExp(find.source, "g")) || []).length;
    if (n !== 1) { console.error(`${SRC}: expected exactly 1 ${what}, found ${n}`); ok = false; return; }
    html = html.replace(find, () => repl);
  };
  const grab = (re, what) => { const x = html.match(re); if (!x) { console.error(`${SRC}: missing ${what}`); ok = false; return ""; } return x[1]; };

  // pieces reused from the control
  const TEL = grab(/class="btn btn-teal cta-call js-tel" href="tel:(\+\d+)"/, "hero call link");
  const DISPLAY = grab(/<span class="js-tel-text">([^<]+)<\/span>/, "display number");
  const PHONE_SVG = grab(/<a class="btn btn-teal cta-call js-tel"[^>]*>(<svg[\s\S]*?<\/svg>)/, "phone icon");
  const TESTIMONIALS = grab(/<section id="reviews">[\s\S]*?(<div class="tgrid">[\s\S]*?)\s*<\/div>\s*<\/section>/, "testimonial grid");
  const OFFICE_LINE = grab(/(<p class="local-line" data-geo="office">[^<]*<\/p>)/, "office line");
  const SOL_EN = grab(/<span data-geo="sol">([^<]*)<\/span>/, "statute-of-limitations answer");

  // id-addressed bilingual helpers
  const OPS = [];
  let n = 0;
  const nid = () => `ah${++n}`;
  const T = (tag, en, es, attrs = "") => { const id = nid(); OPS.push(["h", "#" + id, 0, es]);
    return `<${tag} id="${id}"${attrs ? " " + attrs : ""}>${en}</${tag}>`; };
  const callBtn = (cls = "", shortLabel = false) => { const id = nid();
    const tail = shortLabel ? [" Now", " ahora"] : [" Now — Free 24/7", " ahora — Gratis 24/7"];
    OPS.push(["ft", `#${id} > span`, 0, "Llame al "], ["lt", `#${id} > span`, 0, tail[1]]);
    return `<a id="${id}" class="btn btn-teal js-tel o24-call${cls}" href="tel:${TEL}">${PHONE_SVG}<span>Call <span class="js-tel-text">${DISPLAY}</span>${tail[0]}</span></a>`; };
  const formLink = (en, es) => T("a", en, es, 'class="btn btn-ghost o24-form" href="#case-form"');
  const step = (num, bEn, bEs, pEn, pEs) => { const id = nid(); OPS.push(["lt", "#" + id, 0, bEs]);
    return `<div class="step"><b id="${id}"><i>${num}</i>${bEn}</b>${T("p", pEn, pEs)}</div>`; };
  const rcard = (amt, sEn, sEs, eEn, eEs) => `<div class="rcard"><b>${amt}</b>${T("span", sEn, sEs)}${T("em", eEn, eEs)}</div>`;
  const faq = (qEn, qEs, aEn, aEs) => `<details>${T("summary", qEn, qEs)}${T("p", aEn, aEs)}</details>`;
  const typeCard = ([hEn, hEs, pEn, pEs]) => `<article class="type-card">${T("h3", hEn, hEs)}${T("p", pEn, pEs)}</article>`;
  const whyBlock = (hEn, hEs, inner, id = "") => `<div class="why-block"${id ? ` id="${id}"` : ""}>${T("h3", hEn, hEs)}${inner}</div>`;
  const figId = nid(); OPS.push(["lt", "#" + figId, 0, "Socio Fundador"]);

  const TYPES = C.types(m, s);
  const office = officeSentence(g, m);
  const OUTLINE = [
    ["h1", `${city} ${L} Attorneys`],
    ["h2", `Types of Cases Our ${city} ${L} Attorneys Represent`],
    ...TYPES.map(t => ["h3", t[0]]),
    ["h2", `${L} Attorneys in ${city}, ${st} Open 24 Hours`],
    ["h2", `Why Turn to a ${L} Attorney in ${city} After a Crash`],
    ["h3", "No Fees Unless We Win"], ["h3", "Over $500 Million Won"], ["h3", "We Fight to Get You Paid While You Recover"],
    ["h3", `Award-Winning Accident Attorneys Serving ${city} and All of ${area}`], ["h3", `Free ${L} Consultations`],
    ["h2", `Schedule a Free Consultation with Our ${city} ${L} Attorneys`],
  ];

  const BODY = `<section class="types" id="case-types">
  <div class="wrap">
    ${T("p", C.eyebrow[0], C.eyebrow[1], 'class="eyebrow"')}
    ${T("h2", `Types of Cases Our ${city} ${L} Attorneys Represent`, `Tipos de Casos Que Representan Nuestros Abogados de Accidentes de ${C.es} en ${cityEs}`, 'class="sec-h"')}
    ${T("p", `${C.intro[0]} These are the ${C.lower} cases we handle for people across ${city} and ${area}.`, `${C.intro[1]} Estos son los casos de ${C.lowerEs} que manejamos para personas en todo ${cityEs} y ${areaEsBody}.`, 'class="sec-sub"')}
    <div class="tgrid6">
      ${TYPES.map(typeCard).join("\n      ")}
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
    ${T("h2", `${L} Attorneys in ${city}, ${st} Open 24 Hours`, `Abogados de Accidentes de ${C.es} en ${cityEs}, ${st}, Abiertos las 24 Horas`, 'class="sec-h"')}
    ${T("p", "Crashes don't keep business hours, and neither do we. Call day or night and a real person answers — 24 hours a day, 7 days a week. Se habla español.", "Los accidentes no respetan horarios de oficina, y nosotros tampoco. Llame de día o de noche y le contesta una persona real — las 24 horas, los 7 días de la semana. Hablamos español.", 'class="sec-sub"')}
    <div class="steps">
      ${step(1, "You talk. 60 seconds.", "Usted habla. 60 segundos.", "Call or tap the form. A real person — not a phone tree — hears what happened and tells you where you stand. Free, no obligation, no pressure.", "Llame o toque el formulario. Una persona real — no una contestadora — escucha qué pasó y le dice dónde está parado. Gratis, sin compromiso y sin presión.")}
      ${step(2, "We take it from here.", "Nosotros seguimos desde ahí.", "Every adjuster call, every deadline, the evidence, and help coordinating your medical care. We front every dollar it costs to build your case.", "Cada llamada del ajustador, cada plazo, la evidencia y ayuda para coordinar su atención médica. Cubrimos cada dólar que cuesta armar su caso.")}
      ${step(3, "You get paid.", "Usted recibe su pago.", "We push for the maximum and try the case if they won't pay it. No recovery, no attorney fee — and you are never out of pocket along the way.", "Buscamos el máximo y vamos a juicio si no quieren pagarlo. Sin recuperación, no hay honorarios — y usted nunca paga de su bolsillo.")}
    </div>
    ${T("div", `<b>Don't wait on the clock.</b> In ${S.n} you generally have ${S.years[0]} years from the crash to file, but the evidence that proves your case — camera footage, skid marks, witnesses — disappears much sooner.`, `<b>No espere.</b> En ${S.e} generalmente tiene ${S.years[1]} años desde el accidente para presentar su reclamo, pero la evidencia que prueba su caso — videos, marcas de frenado, testigos — desaparece mucho antes.`, 'class="rhigh o24-note"')}
    <div class="o24-ctas">${callBtn()}${formLink("Or Start the 60-Second Form", "O Empiece el Formulario de 60 Segundos")}</div>
  </div>
</section>

<section class="why" id="why-us">
  <div class="wrap">
    ${T("p", "Why Hire Us", "Por Qué Contratarnos", 'class="eyebrow"')}
    ${T("h2", `Why Turn to a ${L} Attorney in ${city} After a Crash`, `Por Qué Acudir a un Abogado de Accidentes de ${C.es} en ${cityEs} Después de un Choque`, 'class="sec-h"')}
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

    ${whyBlock(`Award-Winning Accident Attorneys Serving ${city} and All of ${area}`, `Abogados de Accidentes Premiados al Servicio ${deCity} y Todo ${areaEsH}`, `
      ${T("p", `The firm's recognitions include a Martindale-Hubbell Distinguished peer rating, The National Trial Lawyers, and the Million Dollar Advocates Forum — and senior partner James Loren has tried more than 50 cases to verdict. ${office[0]}`, `Entre los reconocimientos del bufete están la calificación entre colegas Distinguished de Martindale-Hubbell, The National Trial Lawyers y el Million Dollar Advocates Forum — y el socio sénior James Loren ha llevado más de 50 casos a veredicto. ${office[1]}`)}
      ${OFFICE_LINE}
      ${TESTIMONIALS}`, "reviews")}

    ${whyBlock(`Free ${L} Consultations`, `Consultas Gratis para Accidentes de ${C.es}`, `
      ${T("p", "Your first conversation is free and confidential, and there's no obligation to hire us. Call any time, or tell us what happened in the 60-second form — either way, you'll know where you stand.", "Su primera conversación es gratis y confidencial, y no hay obligación de contratarnos. Llame a cualquier hora, o cuéntenos qué pasó en el formulario de 60 segundos — de cualquier forma, sabrá dónde está parado.")}
      <div class="faq faq-in" id="faq">
        ${faq("What does it cost to hire you?", "¿Cuánto cuesta contratarlos?", "Nothing up front — ever. The consultation is free, we front every cost of building your case, and we only collect an attorney fee if we recover money for you. No recovery, no attorney fee. (Court costs and case expenses may apply and are explained clearly in your agreement before you sign.)", "Nada por adelantado — nunca. La consulta es gratis, cubrimos todos los costos de armar su caso y solo cobramos honorarios si recuperamos dinero para usted. Sin recuperación, no hay honorarios de abogado. (Los costos judiciales y gastos del caso pueden aplicar y se explican claramente en su acuerdo antes de firmar.)")}
        ${faq("The insurance company already offered me money. Should I take it?", "La aseguradora ya me ofreció dinero. ¿Debo aceptarlo?", "Not before a free case review. First offers are low by design — adjusters are trained to settle before you know what your claim is worth. Signing usually ends your claim permanently, even if your injuries get worse. Let us look first; it costs you nothing.", "No antes de una evaluación gratuita. Las primeras ofertas son bajas por diseño — los ajustadores están entrenados para cerrar antes de que usted sepa cuánto vale su reclamo. Firmar normalmente termina su reclamo para siempre, aunque sus lesiones empeoren. Déjenos revisarlo primero; no le cuesta nada.")}
        ${faq("How much is my case worth?", "¿Cuánto vale mi caso?", "It depends on your medical bills, lost wages, future treatment, and what the crash has taken from your life. Insurers hope you'll guess low. A free case review gives you a realistic range before you accept anything.", "Depende de sus gastos médicos, salarios perdidos, tratamiento futuro y lo que el accidente le ha quitado. Las aseguradoras esperan que usted calcule de menos. Una evaluación gratuita le da un rango realista antes de aceptar nada.")}
        <details>${T("summary", "How long do I have to file?", "¿Cuánto tiempo tengo para presentar mi reclamo?")}<p><span data-geo="sol">${SOL_EN}</span></p></details>
        ${faq("Will I have to go to court?", "¿Tendré que ir a corte?", "Most cases settle without a trial. But insurers track which firms actually try cases — and pay more to avoid facing them. With 50+ trials taken to verdict, we negotiate from strength. If they won't pay fairly, we're ready.", "La mayoría de los casos se resuelven sin juicio. Pero las aseguradoras saben qué bufetes sí llegan a juicio — y pagan más para no enfrentarlos. Con más de 50 juicios a veredicto, negociamos desde la fuerza. Si no pagan lo justo, estamos listos.")}
        ${faq("What if I was partly at fault?", "¿Y si yo tuve parte de la culpa?", `You may still have a strong claim. ${s.faultText[2]} Don't accept the insurer's version of fault; get a free review first.`, `Puede que aún tenga un caso sólido. ${s.faultText[3]} No acepte la versión de la aseguradora; primero obtenga una evaluación gratis.`)}
      </div>`)}
  </div>
</section>

<section class="final">
  <div class="wrap">
    ${T("h2", `Schedule a <span class="h1-teal">Free</span> Consultation with Our ${city} ${L} Attorneys`, `Programe una Consulta <span class="h1-teal">Gratis</span> con Nuestros Abogados de Accidentes de ${C.es} en ${cityEs}`, 'class="sec-h"')}
    ${T("p", "One call, 24/7. Nothing up front, nothing out of pocket, and no fee unless we win.", "Una llamada, 24/7. Nada por adelantado, nada de su bolsillo y sin honorarios a menos que ganemos.")}
    FINAL_CTAS
  </div>
</section>
`;

  // the control's final call/form buttons are kept byte-for-byte: they are .cta-call[1]
  // and .cta-form-link[1] in the positional ops, which stay valid because no other
  // element on the page carries those classes
  const FINAL_CTAS = grab(/<section class="final">[\s\S]*?(<div class="final-ctas">[\s\S]*?<\/div>)\s*<\/div>\s*<\/section>/, "final CTA buttons");

  // assemble
  mustReplace(/<title>[^<]*<\/title>/, `<title>${city} ${L} Attorneys | Free Consultation 24/7 | Goldberg &amp; Loren</title>`, "title");
  mustReplace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${city} ${C.lower} attorneys, open 24 hours. Free consultation, no fees unless we win, and $550M+ recovered for injury victims since 1994.">`, "meta description");
  mustReplace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${city} ${L} Attorneys | Goldberg & Loren">`, "og:title");
  mustReplace(/<h1>[\s\S]*?<\/h1>/, `<h1><span class="h1-pre"></span><em class="h1-city" data-geo="h1city">${g.h1city}</em><span class="h1-post"> ${L} Attorneys</span></h1>`, "h1");
  mustReplace("<h2>What's Your Case Worth?</h2>", `<p class="card-h">What's Your Case Worth?</p>`, "form card heading");
  mustReplace('<h3>Got it<span id="s-name"></span>.</h3>', '<p class="s-h">Got it<span id="s-name"></span>.</p>', "success heading");
  for (const t of ["Practice Areas", "Locations"]) mustReplace(`<h3>${t}</h3>`, `<p class="f-h">${t}</p>`, `footer "${t}" heading`);
  mustReplace("</style>", CSS_ADD + "</style>", "closing style tag");
  if (photo) {
    mustReplace("</style>", PHOTO_CSS + "</style>", "closing style tag (photo)");
    mustReplace('<div class="benefits">', PHOTO_FIGURE + '<div class="benefits">', "hero benefits row");
  }

  const start = html.indexOf('<section class="results" id="results">');
  const end = html.indexOf("</main>");
  if (start < 0 || end < start || count(html, "</main>") !== 1) { console.error(`${SRC}: could not find the body sections to replace`); ok = false; }
  else html = html.slice(0, start) + BODY.replace("FINAL_CTAS", () => FINAL_CTAS) + html.slice(end);

  mustReplace('payload._subject = "GoldbergandlorenPPC";', `payload._subject = "GoldbergandlorenPPC"; payload.variant = "${VARIANT}";`, "payload subject line");
  mustReplace(`"&ct=${cs}"`, `"&ct=${cs}&variant=${VARIANT}"`, "thank-you ct param");
  mustReplace("</body>", `<script>window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:"page_variant",variant:"${VARIANT}"});</script>\n</body>`, "closing body tag");

  // Spanish ops
  const I18N_RE = /(<script type="application\/json" id="i18n-es">)([\s\S]*?)(<\/script>)/;
  const I18N = JSON.parse(html.match(I18N_RE)[2]);
  let ops = I18N.ops.filter(o => !DROP.has(o[1])).map(o => RESELECT[o[1]] ? [o[0], RESELECT[o[1]], o[2], o[3]] : o);
  // H1 — EN: "" + "{city}" + " {Case} Attorneys"; ES: "Abogados de Accidentes de {Caso}" + " en {ciudad}" (geo data) + ""
  ops = ops.map(o => o[1] === ".h1-pre" ? ["t", ".h1-pre", 0, `Abogados de Accidentes de ${C.es}`]
                   : o[1] === ".h1-post" ? ["t", ".h1-post", 0, ""] : o);
  I18N.ops = ops.concat(OPS, photo ? PHOTO_OPS : []);
  I18N.title = `Abogados de Accidentes de ${C.es} | Consulta Gratis 24/7 | Goldberg & Loren`;
  html = html.replace(I18N_RE, (_, a, __, c) => a + JSON.stringify(I18N).replace(/<\//g, "<\\/") + c);

  // the outline must be exactly the client's, generalised
  const decode = x => x.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, " ").trim();
  const got = [...html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/g)].map(x => [x[1], decode(x[2])]);
  if (!(got.length === OUTLINE.length && got.every(([t, x], i) => t === OUTLINE[i][0] && x === OUTLINE[i][1]))) {
    ok = false;
    console.error(`${OUT}: heading outline does not match:`);
    for (let i = 0; i < Math.max(got.length, OUTLINE.length); i++)
      if (JSON.stringify(got[i] || null) !== JSON.stringify(OUTLINE[i] || null))
        console.error(`  #${i + 1} got ${JSON.stringify(got[i] || null)} want ${JSON.stringify(OUTLINE[i] || null)}`);
  }
  if (ok) writeFileSync(OUT, html);
  return ok;
}

// control → variant URLs for setting up the Google Ads experiments; Texas first
function urlTable() {
  const BASE = "https://results.goldbergloren.com/";
  const geos = [...TAG_GEOS].sort((a, b) => (MARKETS[b][0] === "TX") - (MARKETS[a][0] === "TX"));
  const rows = geos.flatMap(geo => CASE_TYPES.map(cs =>
    `| ${GEOS[geo].city} | ${CASES[cs].label} | ${BASE}${cs}-${geo}.html | ${BASE}${outFile(geo, cs)} | ${BASE}${photoFile(geo, cs)} |`));
  return `# NEW TAGs landers — campaign URLs

Generated by \`node generate-tag-landers.mjs\` — don't edit by hand. How to run the
test and read the results: \`NEW-TAGS-LANDERS.md\`.

- **A · Control** — the live lander, unchanged. Leads carry no \`variant\`.
- **B · Headings** — rebuilt around the client's heading outline. Lead tag \`{city}-headings\`.
- **C · Headings + photo** — B plus the partners' photo, nothing else. Lead tag \`{city}-headings-photo\`.

Every group carries the same phone number and GTM container, so calls and form leads
are tracked the same way. Lead tags reach Formspree (\`variant\`) and GA4 (\`&variant=\` on
the thank-you URL) alongside the usual \`case_type\`. Add ?lang=es to any URL for Spanish.

| Market | Case type | A · Control (live) | B · Headings | C · Headings + photo |
|---|---|---|---|---|
${rows.join("\n")}
`;
}

// ---------------------------------------------------------------- run
// importable (build-hub.mjs reads outFile, photoFile and CASE_TYPES); only builds when run directly
export const CASE_TYPES = Object.keys(CASES);
export const TAG_GEOS = Object.keys(GEOS).filter(k => k !== "default");
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const missing = TAG_GEOS.filter(k => !MARKETS[k]);
  if (missing.length) { console.error(`add a MARKETS row (state, roads, county) for: ${missing.join(", ")}`); process.exit(1); }
  const names = new Set();
  for (const geo of TAG_GEOS) for (const cs of CASE_TYPES) for (const f of [outFile(geo, cs), photoFile(geo, cs)]) {
    if (names.has(f)) { console.error(`file name collision: ${f}`); process.exit(1); }
    names.add(f);
  }
  let built = 0, failed = 0;
  for (const geo of TAG_GEOS) for (const cs of CASE_TYPES) for (const photo of [false, true]) build(geo, cs, photo) ? built++ : failed++;
  if (failed) { console.error(`${failed} NEW TAGs lander(s) FAILED — nothing written for them`); process.exit(1); }
  writeFileSync("CAMPAIGN-URLS-NEW-TAGS.md", urlTable());
  console.log(`built ${built} NEW TAGs landers (${TAG_GEOS.length} markets × ${CASE_TYPES.length} case types × groups B and C); every outline matches; CAMPAIGN-URLS-NEW-TAGS.md updated`);
}
