/*
 * lang-switch.js – sprogknap til Natur-fysik-kemi-mat
 * Michael Grant
 *
 * Indsæt denne linje lige før </body> på hver side:
 *     <script src="lang-switch.js" defer></script>
 *
 * Knappen vælger selv sit mål:
 *   - Dansk side MED håndoversat engelsk udgave  -> den engelske fil
 *   - Dansk side UDEN engelsk udgave             -> Google Translate-udgaven
 *   - Engelsk side (-en.html)                    -> den danske original
 *   - Google Translate-udgaven                   -> den danske original
 *
 * Når du har oversat en ny side, tilføjer du den blot i listen nedenfor.
 */
(function () {
  "use strict";

  // Dansk fil -> engelsk fil. Tilføj en linje, hver gang en side er oversat.
  var TRANSLATED = {
    "index.html": "index-en.html"
    // "optik.html": "optik-en.html",
    // "krydssoe.html": "krydssoe-en.html",
  };

  var ORIGIN = "https://michaelhgrant.github.io";
  var loc = window.location;
  var onGoogle = /\.translate\.goog$/.test(loc.hostname);

  // Filnavnet på den aktuelle side ("" eller ".../" betyder index.html)
  var parts = loc.pathname.split("/");
  var file = decodeURIComponent(parts.pop()) || "index.html";
  var dir = parts.join("/") + "/";

  // Find den danske fil, hvis vi står på en engelsk side
  var danishFile = null;
  for (var da in TRANSLATED) {
    if (TRANSLATED[da] === file) { danishFile = da; }
  }

  // Siden har allerede et sprogvalg i menuen (forsiderne) -> gør intet
  if (!onGoogle && document.querySelector("nav a.lang")) { return; }

  // Siden er skrevet på engelsk fra starten (fx afhandlingen) -> ingen knap
  var pageLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
  if (!onGoogle && !danishFile && pageLang.indexOf("en") === 0) { return; }

  var href, label, lang;

  if (onGoogle) {
    // Tilbage til originalen, uden Googles _x_tr-parametre
    var q = loc.search.replace(/[?&]_x_tr_[^&]*/g, "").replace(/^&/, "?");
    href = ORIGIN + loc.pathname + (q === "?" ? "" : q) + loc.hash;
    label = "🇩🇰 Dansk (original)";
    lang = "da";
  } else if (danishFile) {
    href = dir + encodeURI(danishFile) + loc.search + loc.hash;
    label = "🇩🇰 Dansk";
    lang = "da";
  } else if (TRANSLATED[file]) {
    href = dir + encodeURI(TRANSLATED[file]) + loc.search + loc.hash;
    label = "🇬🇧 English";
    lang = "en";
  } else {
    // Ingen håndoversættelse endnu -> Google Translate
    var host = loc.hostname.replace(/-/g, "--").replace(/\./g, "-") + ".translate.goog";
    var sep = loc.search ? "&" : "?";
    href = "https://" + host + loc.pathname + loc.search + sep +
           "_x_tr_sl=da&_x_tr_tl=en&_x_tr_hl=en" + loc.hash;
    label = "🇬🇧 English (machine translation)";
    lang = "en";
  }

  var a = document.createElement("a");
  a.href = href;
  a.textContent = label;
  a.lang = lang;
  a.className = "lang-switch notranslate";   // Google må ikke oversætte knappen
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
