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
    "koblede-penduler.html": "koblede-penduler-en.html"
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
