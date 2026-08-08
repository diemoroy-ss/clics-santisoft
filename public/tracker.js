/**
 * Clics Anti-Fraud Tracker v1.0
 * Ultraliviano: < 3KB minificado
 * Instalación: <script src="https://clics.santisoft.cl/tracker.js" data-site-key="SK_..." async></script>
 */
(function () {
  'use strict';

  // ── Configuración ──────────────────────────────────────────────────────────
  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var SITE_KEY   = script.getAttribute('data-site-key');
  var ENDPOINT   = (script.getAttribute('data-endpoint') || 'https://clics.santisoft.cl') + '/api/v1/track';
  var SESSION_MS = parseInt(script.getAttribute('data-session-timeout') || '30000', 10);

  if (!SITE_KEY) {
    console.warn('[Clics] Missing data-site-key attribute. Tracking disabled.');
    return;
  }

  // ── State ──────────────────────────────────────────────────────────────────
  var startTime    = Date.now();
  var mouseEvents  = 0;
  var sent         = false;

  // ── Params de URL ──────────────────────────────────────────────────────────
  function getParam(name) {
    try {
      var url = new URL(window.location.href);
      return url.searchParams.get(name) || undefined;
    } catch (e) {
      return undefined;
    }
  }

  // ── Fingerprint simple del navegador ──────────────────────────────────────
  function getFingerprint() {
    var parts = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      typeof navigator.deviceMemory !== 'undefined' ? navigator.deviceMemory : 0,
      navigator.platform || '',
    ];
    // FNV-1a hash simple (sin crypto, rápido)
    var hash = 2166136261;
    var str  = parts.join('|');
    for (var i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash  = (hash * 16777619) >>> 0;
    }
    return hash.toString(16);
  }

  // ── Contador de interacciones ─────────────────────────────────────────────
  function onInteract() { mouseEvents++; }

  document.addEventListener('mousemove', onInteract, { passive: true });
  document.addEventListener('touchstart', onInteract, { passive: true });
  document.addEventListener('scroll',    onInteract, { passive: true });
  document.addEventListener('click',     onInteract, { passive: true });
  document.addEventListener('keydown',   onInteract, { passive: true });

  // ── Envío del beacon ──────────────────────────────────────────────────────
  function sendBeacon() {
    if (sent) return;
    sent = true;

    var sessionTime = Math.round((Date.now() - startTime) / 1000);

    var payload = JSON.stringify({
      siteKey:     SITE_KEY,
      gclid:       getParam('gclid'),
      fbclid:      getParam('fbclid'),
      fingerprint: getFingerprint(),
      sessionTime: sessionTime,
      mouseEvents: mouseEvents,
      referer:     document.referrer || undefined,
      screenRes:   screen.width + 'x' + screen.height,
      userAgent:   navigator.userAgent,
      timestamp:   Date.now(),
    });

    // Intentar con sendBeacon primero (no bloqueante)
    if (navigator.sendBeacon) {
      var blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }

    // Fallback: fetch asíncrono
    try {
      fetch(ENDPOINT, {
        method:       'POST',
        headers:      { 'Content-Type': 'application/json' },
        body:         payload,
        keepalive:    true,
        credentials:  'omit',
      }).catch(function () {});
    } catch (e) {}
  }

  // ── Enviar cuando el usuario abandona la página ────────────────────────────
  window.addEventListener('pagehide',         sendBeacon, { passive: true });
  window.addEventListener('beforeunload',     sendBeacon);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') sendBeacon();
  });

  // ── Enviar también después de SESSION_MS (para sesiones largas) ────────────
  setTimeout(sendBeacon, SESSION_MS);

  // ── Envío inmediato si hay gclid en la URL (viene de Google Ads) ───────────
  if (getParam('gclid')) {
    setTimeout(function () {
      if (!sent) {
        var sessionTime = Math.round((Date.now() - startTime) / 1000);
        var payload = JSON.stringify({
          siteKey:     SITE_KEY,
          gclid:       getParam('gclid'),
          fbclid:      getParam('fbclid'),
          fingerprint: getFingerprint(),
          sessionTime: sessionTime,
          mouseEvents: mouseEvents,
          referer:     document.referrer || undefined,
          screenRes:   screen.width + 'x' + screen.height,
          userAgent:   navigator.userAgent,
          timestamp:   Date.now(),
        });

        if (navigator.sendBeacon) {
          var blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon(ENDPOINT, blob);
        }
      }
    }, 1500); // 1.5s después de cargar la página
  }

})();
