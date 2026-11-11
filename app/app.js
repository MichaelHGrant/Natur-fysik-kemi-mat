/* mhgfysik.dk – app-funktioner
 * 1) registrerer service workeren (offline + installérbar)
 * 2) styrer "Installer som app"-knappen (#app-install)
 * 3) viser en diskret opfordring til at støtte siden ved at købe en bog,
 *    når siden kører som installeret app (højst én gang om ugen)
 */
(function () {
  var en = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var T = en ? {
    support: 'This app is free. If you find it useful, you can support the work by buying one of my books.',
    books: 'See the books', close: 'Close',
    done: 'The app is installed – find it on your home screen.'
  } : {
    support: 'Appen er gratis. Har du glæde af den, kan du støtte arbejdet ved at købe en af mine bøger.',
    books: 'Se bøgerne', close: 'Luk',
    done: 'Appen er installeret – du finder den på din hjemmeskærm.'
  };
  var booksUrl = en ? '/boeger-en.html' : '/boeger.html';

  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

  // 1) Service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  // 2) Installér-boksen (#app-install): knap hvis browseren tilbyder det, ellers vejledning
  var H = en ? {
    ios: 'On iPhone/iPad: open the site in <b>Safari</b>, tap the Share button (square with an arrow) and choose <b>“Add to Home Screen”</b>.',
    android: 'On Android: open the site in <b>Chrome</b>, tap the menu <b>⋮</b> at the top right and choose <b>“Install app”</b> (or “Add to Home screen”).',
    mac: 'In Safari on a Mac: choose <b>File → Add to Dock</b>. In Chrome or Edge: click the install icon at the right end of the address bar.',
    desktop: 'In Chrome or Edge: click the install icon at the right end of the address bar, or open the menu <b>⋮</b> and choose <b>“Install mhgfysik”</b>.',
    firefox: 'Firefox cannot install web apps on a computer – open mhgfysik.dk in Chrome or Edge instead. On Android, Firefox can: menu <b>⋮</b> → “Install”.',
    ready: 'Click the button to install mhgfysik – with its own icon, full screen and offline use. The app is free; if you find it useful, please support the work by buying one of the books.'
  } : {
    ios: 'På iPhone/iPad: åbn siden i <b>Safari</b>, tryk på Del-knappen (firkanten med en pil) og vælg <b>“Føj til hjemmeskærm”</b>.',
    android: 'På Android: åbn siden i <b>Chrome</b>, tryk på menuen <b>⋮</b> øverst til højre og vælg <b>“Installer app”</b> (eller “Føj til startskærm”).',
    mac: 'I Safari på Mac: vælg <b>Arkiv → Føj til Dock</b>. I Chrome eller Edge: klik på installér-ikonet yderst til højre i adresselinjen.',
    desktop: 'I Chrome eller Edge: klik på installér-ikonet yderst til højre i adresselinjen, eller åbn menuen <b>⋮</b> og vælg <b>“Installer mhgfysik”</b>.',
    firefox: 'Firefox kan ikke installere web-apps på en computer – åbn mhgfysik.dk i Chrome eller Edge i stedet. På Android kan Firefox godt: menu <b>⋮</b> → “Installer”.',
    ready: 'Tryk på knappen for at installere mhgfysik – med eget ikon, i fuld skærm og med offline-brug. Appen er gratis; har du glæde af den, så støt gerne arbejdet ved at købe en af bøgerne.'
  };
  var deferred = null;
  function el(id) { return document.getElementById(id); }
  function showButton() {
    var btn = el('app-install-btn'), msg = el('app-install-msg');
    if (btn) btn.hidden = false;
    if (msg) msg.innerHTML = H.ready;
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    if (document.readyState !== 'loading') showButton();
  });
  window.addEventListener('appinstalled', function () {
    var msg = el('app-install-msg'); if (msg) msg.innerHTML = T.done;
    var btn = el('app-install-btn'); if (btn) btn.hidden = true;
  });
  document.addEventListener('DOMContentLoaded', function () {
    var box = el('app-install');
    if (!box) return;
    if (standalone) { box.hidden = true; return; }
    var ua = navigator.userAgent;
    var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var msg = el('app-install-msg');
    if (deferred) showButton();
    else if (msg) {
      msg.innerHTML = isIOS ? H.ios
        : /android/i.test(ua) ? H.android
        : /firefox/i.test(ua) ? H.firefox
        : (/macintosh/i.test(ua) && !/chrome|edg/i.test(ua)) ? H.mac
        : H.desktop;
    }
    var btn = el('app-install-btn');
    if (btn) btn.addEventListener('click', function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.finally(function () { deferred = null; });
    });
  });

  // 3) Støt-med-en-bog – kun i den installerede app, højst en gang om ugen
  if (!standalone) return;
  if (location.pathname.indexOf('boeger') !== -1) return;
  var last = parseInt(store('mhg-support-shown') || '0', 10);
  var WEEK = 7 * 24 * 3600 * 1000;
  if (Date.now() - last < WEEK) return;

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      var bar = document.createElement('div');
      bar.setAttribute('role', 'note');
      bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));' +
        'z-index:99999;max-width:560px;margin:0 auto;padding:14px 16px;border-radius:12px;' +
        'background:#1a140a;border:1px solid #f5c878;color:#e0e0e0;font:15px/1.45 system-ui,sans-serif;' +
        'box-shadow:0 6px 24px rgba(0,0,0,.5);display:flex;gap:12px;align-items:center;flex-wrap:wrap';
      bar.innerHTML = '<span style="flex:1 1 240px">📚 ' + T.support + '</span>' +
        '<a href="' + booksUrl + '" style="background:#f5c878;color:#1a140a;padding:8px 14px;border-radius:8px;' +
        'text-decoration:none;font-weight:600;white-space:nowrap">' + T.books + '</a>' +
        '<button type="button" aria-label="' + T.close + '" style="background:none;border:0;color:#a0a0a8;' +
        'font-size:22px;cursor:pointer;padding:0 4px">×</button>';
      bar.querySelector('button').onclick = function () { bar.remove(); };
      document.body.appendChild(bar);
      store('mhg-support-shown', String(Date.now()));
    }, 4000);
  });
})();
