/*
 * lang-switch.js – sprogknap til Natur-fysik-kemi-mat
 * Michael Grant
 *
 * Indsæt denne linje lige før </body> på hver side:
 *     <script src="lang-switch.js" defer></script>
 *
 * Scriptet HUSKER læserens sprogvalg:
 *   - Når man besøger index-en.html eller klikker "English", huskes engelsk.
 *     Alle danske sider, man derefter åbner, vises automatisk på engelsk:
 *     den håndoversatte udgave, hvis den findes, ellers Google Translate.
 *   - Når man besøger index.html eller klikker "Dansk", huskes dansk igen.
 *
 * Når du har oversat en ny side, tilføjer du den blot i listen nedenfor.
 */
(function () {
  "use strict";

  // Dansk fil -> engelsk fil. Tilføj en linje, hver gang en side er oversat.
  var TRANSLATED = {
    "index.html": "index-en.html",
    "boeger.html": "boeger-en.html",
    "gyroskop-tippetop.html": "gyroskop-tippetop-en.html",
    "koblede-penduler.html": "koblede-penduler-en.html",
    "gyngen.html": "gyngen-en.html",
    "carnot.html": "carnot-en.html",
    "det-elektromagnetiske-spektrum.html": "det-elektromagnetiske-spektrum-en.html",
    "kartoffelmel-og-vand.html": "kartoffelmel-og-vand-en.html",
    "krydssoe.html": "krydssoe-en.html",
    "Periodisk Tabel 3.html": "periodisk-tabel-en.html",
    "Frossen soe lyde.html": "frossen-soe-lyde-en.html",
    "flokkens-visdom.html": "flokkens-visdom-en.html",
    "geometribog.html": "geometribog-en.html",
    "astrofotos.html": "astrofotos-en.html",
    "naturvidenskabelig-metode.html": "naturvidenskabelig-metode-en.html",
    "kategori-og-kongruensfejl.html": "kategori-og-kongruensfejl-en.html",
    "solure.html": "solure-en.html",
    "den-nye-ateismes-kategorifejl.html": "den-nye-ateismes-kategorifejl-en.html",
    "maanens-bane-af-et-fotografi.html": "maanens-bane-af-et-fotografi-en.html",
    "solformoerkelse-2027-globus.html": "solformoerkelse-2027-globus-en.html",
    "nordlys.html": "nordlys-en.html",
    "orkaner.html": "orkaner-en.html",
    "el-nino.html": "el-nino-en.html",
    "tornadoer.html": "tornadoer-en.html",
    "polarhvirvlen.html": "polar-vortex-en.html",
    "pladetektonik.html": "pladetektonik-en.html",
    "vulkaner.html": "vulkaner-en.html",
    "tsunami.html": "tsunami-en.html",
    "yellowstone.html": "yellowstone-en.html",
    "jupiters-baelter.html": "jupiters-baelter-en.html",
    "undervisningspakke_gauss_web_offline_skolebog.html": "undervisningspakke_gauss_web_offline_skolebog-en.html",
    "maanens-bane-to-metoder.html": "maanens-bane-to-metoder-en.html",
    "linse-og-diffraktion.html": "linse-og-diffraktion-en.html",
    "jordskaelv.html": "jordskaelv-en.html",
    "turbiner.html": "turbiner-en.html",
    "tidevand_3D.html": "tidevand_3D-en.html",
    "tidens-pil.html": "tidens-pil-en.html",
    "stirling.html": "stirling-en.html",
    "sol-jord-maane.html": "sol-jord-maane-en.html",
    "skov ekko.html": "skov-ekko-en.html",
    "esr.html": "esr-en.html",
    "kometbaneberegning.html": "kometbaneberegning-en.html",
    "lys-stof-vekselvirkning.html": "lys-stof-vekselvirkning-en.html",
    "lyriderne.html": "lyriderne-en.html",
    "den-hellige-grav.html": "den-hellige-grav-en.html",
    "damplokomotiv.html": "damplokomotiv-en.html",
    "alhambra.html": "alhambra-en.html",
    "gauss-banebestemmelse.html": "gauss-banebestemmelse-en.html",
    "solen.html": "solen-en.html",
    "arianismen-og-den-nikaenske-tro.html": "arianismen-og-den-nikaenske-tro-en.html",
    "kometbane-161P.html": "kometbane-161P-en.html",
    "baneberegning-161P.html": "baneberegning-161P-en.html",
    "kometbane-220P.html": "kometbane-220P-en.html",
    "keplers-ligning-aarstider.html": "keplers-ligning-aarstider-en.html",
    "solformorkelse-2027.html": "solformorkelse-2027-en.html",
    "maanens-bane-3d.html": "maanens-bane-3d-en.html",
    "solrotation.html": "solrotation-en.html",
    "schrodingers-kat.html": "schrodingers-kat-en.html",
    "Huyundai.html": "huyundai-en.html",
    "Plask.html": "plask-en.html",
    "Artemis2.html": "artemis2-en.html",
    "Fuelefficiency.html": "fuelefficiency-en.html",
    "Helium.html": "helium-en.html",
    "Lyd sysntesizer.html": "lyd-synthesizer-en.html",
    "Lyd analysator.html": "lyd-analysator-en.html",
    "kometbane.html": "kometbane-en.html",
    "Mixer.html": "mixer-en.html",
    "Gibbs.html": "gibbs-en.html",
    "Kernevåben2.html": "kernevaaben2-en.html",
    "Laser.html": "laser-en.html",
    "Newton8.html": "newton8-en.html",
    "brint udvidet Balmer 29 - n = 6 - 75 percent.html": "brint-balmer-en.html",
    "Saesonerne jorden maanen og solen.html": "saesonerne-en.html",
    "lyd4.html": "lyd4-en.html",
    "Polarisation.html": "polarisation-en.html",
    "Dybbøl2.html": "dybboel2-en.html",
    "solsystem.html": "solsystem-en.html",
    "Spektra.html": "spektra-en.html",
    "alhambra3d.html": "alhambra3d-en.html",
    "Rosenkrans.html": "rosenkrans-en.html",
    "Relativistisk akustik.html": "relativistisk-akustik-en.html",
    "Vinglas3D 3.html": "vinglas3d-en.html",
    "intetheden.html": "intetheden-en.html",
    "saltbatteri.html": "saltbatteri-en.html",
    "maanen.html": "maanen-en.html",
    "cognac.html": "cognac-en.html",
    "ris.html": "ris-en.html",
    "tablet.html": "tablet-en.html",
    "stegepan.html": "stegepan-en.html",
    "boenner-mod-fristelser.html": "boenner-mod-fristelser-en.html",
    "fuldkommen-anger.html": "fuldkommen-anger-en.html",
    "maskinen-der-laerer.html": "maskinen-der-laerer-en.html",
    "astronomi-og-astrofysik.html": "astronomi-og-astrofysik-en.html",
    "atomfysik.html": "atomfysik-en.html",
    "bayes.html": "bayes-en.html",
    "krydstabeller-og-traediagrammer.html": "krydstabeller-og-traediagrammer-en.html",
    "sandsynlighedsregning.html": "sandsynlighedsregning-en.html",
    "logik.html": "logik-en.html",
    "statistiske-fordelinger.html": "statistiske-fordelinger-en.html",
    "boelgeoptik.html": "boelgeoptik-en.html",
    "boldens-flugt.html": "boldens-flugt-en.html",
    "elektromagnetisme.html": "elektromagnetisme-en.html",
    "faststoffysik.html": "faststoffysik-en.html",
    "fluidmekanik.html": "fluidmekanik-en.html",
    "fysikstudiet.html": "fysikstudiet-en.html",
    "tank-og-vaeskebelastning.html": "tank-og-vaeskebelastning-en.html",
    "elektronik.html": "elektronik-en.html",
    "vektoranalyse.html": "vektoranalyse-en.html",
    "differentialligninger.html": "differentialligninger-en.html",
    "komplekse-funktioner.html": "komplekse-funktioner-en.html",
    "numerisk-matematik.html": "numerisk-matematik-en.html",
    "minoerne.html": "minoerne-en.html",
    "akustik-grundkursus.html": "akustik-grundkursus-en.html",
    "akustisk-kommunikation.html": "akustisk-kommunikation-en.html",
    "digitalelektronik.html": "digitalelektronik-en.html",
    "dth-kandidat.html": "dth-kandidat-en.html",
    "elektroakustik.html": "elektroakustik-en.html",
    "elektronmikroskopi.html": "elektronmikroskopi-en.html",
    "feltteori.html": "feltteori-en.html",
    "ikke-destruktiv-proevning.html": "ikke-destruktiv-proevning-en.html",
    "kemisk-grundkursus.html": "kemisk-grundkursus-en.html",
    "kredsloebsteori.html": "kredsloebsteori-en.html",
    "lydtransmission-i-roer.html": "lydtransmission-i-roer-en.html",
    "maskinstoej.html": "maskinstoej-en.html",
    "rumakustik.html": "rumakustik-en.html",
    "signalanalyse.html": "signalanalyse-en.html",
    "trafikstoej.html": "trafikstoej-en.html",
    "ultralyd.html": "ultralyd-en.html",
    "hamilton-mekanik.html": "hamilton-mekanik-en.html",
    "jordeffekt.html": "jordeffekt-en.html",
    "kernefysik.html": "kernefysik-en.html",
    "kontinuumsmekanik.html": "kontinuumsmekanik-en.html",
    "kort.html": "kort-en.html",
    "krisen-i-fysikken.html": "krisen-i-fysikken-en.html",
    "kvantemekanik.html": "kvantemekanik-en.html",
    "kvaternioner.html": "kvaternioner-en.html",
    "lagrange-mekanik.html": "lagrange-mekanik-en.html",
    "laserfysik.html": "laserfysik-en.html",
    "le-chatelier.html": "le-chatelier-en.html",
    "mach-mekanik.html": "mach-mekanik-en.html",
    "mindste-virkning.html": "mindste-virkning-en.html",
    "navier-stokes-vindtunnel.html": "navier-stokes-vindtunnel-en.html",
    "partikelfysik-og-gruppeteori.html": "partikelfysik-og-gruppeteori-en.html",
    "plasmafysik.html": "plasmafysik-en.html",
    "principia.html": "principia-en.html",
    "relativitetsteori.html": "relativitetsteori-en.html",
    "saturns-ringe.html": "saturns-ringe-en.html",
    "slaebetank.html": "slaebetank-en.html",
    "sort-sol.html": "sort-sol-en.html",
    "statistisk-mekanik.html": "statistisk-mekanik-en.html",
    "stoffers-egenskaber.html": "stoffers-egenskaber-en.html",
    "strengteori.html": "strengteori-en.html",
    "superledning-og-superfluiditet.html": "superledning-og-superfluiditet-en.html",
    "termodynamik.html": "termodynamik-en.html",
    "trelegemeproblemet.html": "trelegemeproblemet-en.html",
    "v-formation.html": "v-formation-en.html",
    "videnskab-og-samfund.html": "videnskab-og-samfund-en.html"
    // "optik.html": "optik-en.html",
  };

  var ORIGIN = "https://michaelhgrant.github.io";
  var KEY = "nfkm-lang";
  var loc = window.location;
  var onGoogle = /\.translate\.goog$/.test(loc.hostname);

  var parts = loc.pathname.split("/");
  var file = decodeURIComponent(parts.pop()) || "index.html";
  var dir = parts.join("/") + "/";

  var danishFile = null;
  for (var da in TRANSLATED) {
    if (TRANSLATED[da] === file) { danishFile = da; }
  }

  function getPref() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setPref(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // Fjern vores egen ?lang=… og Googles _x_tr_…-parametre fra en query-streng
  function cleanQuery(q) {
    q = q.replace(/([?&])(lang=[^&]*|_x_tr_[^&]*)/g, "$1").replace(/[?&]+$/, "")
         .replace(/\?&+/, "?").replace(/&&+/g, "&");
    return q === "?" ? "" : q;
  }
  function addParam(q, p) { return q ? q + "&" + p : "?" + p; }

  function googleUrl(path, q, hash) {
    var host = ORIGIN.replace("https://", "").replace(/-/g, "--").replace(/\./g, "-") + ".translate.goog";
    return "https://" + host + path + addParam(q, "_x_tr_sl=da&_x_tr_tl=en&_x_tr_hl=en") + hash;
  }

  var query = cleanQuery(loc.search);
  var asked = (/[?&]lang=(da|en)/.exec(loc.search) || [])[1];
  var pageLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
  var isEnglishPage = pageLang.indexOf("en") === 0;

  // ---------- 1. Læg sprogvalget fast ----------
  if (!onGoogle) {
    if (asked) {
      setPref(asked);
    } else if (danishFile) {
      setPref("en");                      // en håndoversat engelsk side
    } else if (file === "index.html") {
      setPref("da");                      // den danske forside
    }
  }
  var pref = onGoogle ? "en" : getPref();

  // ---------- 2. Send automatisk videre til engelsk ----------
  if (pref === "en" && !isEnglishPage && asked !== "da") {
    if (TRANSLATED[file]) {
      // Der findes en håndoversættelse – brug den, også fra Google-udgaven
      loc.replace((onGoogle ? ORIGIN : "") + dir + encodeURI(TRANSLATED[file]) + query + loc.hash);
      return;
    }
    if (!onGoogle) {
      loc.replace(googleUrl(loc.pathname, query, loc.hash));
      return;
    }
  }

  // ---------- 3. Vis knappen ----------
  // Forsiderne har sprogvalget i menuen og får ingen ekstra knap
  if (!onGoogle && document.querySelector("nav a.lang")) { return; }
  // Sider skrevet på engelsk fra starten (fx afhandlingen) får ingen knap
  if (!onGoogle && !danishFile && isEnglishPage) { return; }

  var href, label, lang;
  if (onGoogle) {
    href = ORIGIN + loc.pathname + addParam(query, "lang=da") + loc.hash;
    label = "🇩🇰 Dansk (original)";
    lang = "da";
  } else if (danishFile) {
    href = dir + encodeURI(danishFile) + addParam(query, "lang=da") + loc.hash;
    label = "🇩🇰 Dansk";
    lang = "da";
  } else if (TRANSLATED[file]) {
    href = dir + encodeURI(TRANSLATED[file]) + query + loc.hash;
    label = "🇬🇧 English";
    lang = "en";
  } else {
    href = loc.pathname + addParam(query, "lang=en") + loc.hash;
    label = "🇬🇧 English (machine translation)";
    lang = "en";
  }

  var a = document.createElement("a");
  a.href = href;
  a.textContent = label;
  a.lang = lang;
  a.className = "lang-switch notranslate";
  a.setAttribute("translate", "no");
  a.setAttribute("aria-label", lang === "en" ? "Read this page in English" : "Læs siden på dansk");

  var css = document.createElement("style");
  css.textContent =
    ".lang-switch{position:fixed;right:14px;bottom:14px;z-index:99999;" +
    "padding:7px 13px;border-radius:999px;font:600 13px/1.2 system-ui,sans-serif;" +
    "background:rgba(11,13,23,.88);color:#e8e6df;border:1px solid rgba(255,255,255,.25);" +
    "text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.35);backdrop-filter:blur(4px)}" +
    ".lang-switch:hover{background:#1c2140;color:#fff}" +
    "@media print{.lang-switch{display:none}}";

  document.head.appendChild(css);
  document.body.appendChild(a);
})();
