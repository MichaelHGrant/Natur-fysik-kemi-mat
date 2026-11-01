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
    ios: 'On iPhone/iPad: tap the Share button <b>⎋</b> in Safari, then “Add to Home Screen”.',
    done: 'The app is installed – find it on your home screen.'
  } : {
    support: 'Appen er gratis. Har du glæde af den, kan du støtte arbejdet ved at købe en af mine bøger.',
    books: 'Se bøgerne', close: 'Luk',
    ios: 'På iPhone/iPad: tryk på Del-knappen <b>⎋</b> i Safari og vælg “Føj til hjemmeskærm”.',
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

  // 2) Installér-knap
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    var box = document.getElementById('app-install');
    if (box) box.hidden = false;
  });
  window.addEventListener('appinstalled', function () {
    var msg = document.getElementById('app-install-msg');
    if (msg) msg.innerHTML = T.done;
    var btn = document.getElementById('app-install-btn');
    if (btn) btn.hidden = true;
  });
  document.addEventListener('DOMContentLoaded', function () {
    var box = document.getElementById('app-install');
    if (!box || standalone) return;
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
      box.hidden = false;
      var b = document.getElementById('app-install-btn'); if (b) b.hidden = true;
      var m = document.getElementById('app-install-msg'); if (m) m.innerHTML = T.ios;
    }
    var btn = document.getElementById('app-install-btn');
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
