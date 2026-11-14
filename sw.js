/* TO DO BIM : fonctionnement hors ligne. Change VERSION à chaque mise à jour des fichiers. */
const VERSION = "todo-bim-cloud-v18";
const FILES = ["./", "./index.html", "./config.js", "./firebase-bundle.js", "./manifest.webmanifest", "./xlsx.core.min.js", "./exceljs.min.js", "./jspdf.umd.min.js",
  "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;  // Firebase passe directement par le réseau
  const fresh = req.mode === "navigate" || url.pathname.endsWith("/config.js") || url.pathname.endsWith("/index.html");
  e.respondWith(caches.open(VERSION).then(async cache => {
    if (fresh) {  // réseau d'abord (mises à jour immédiates), cache si hors ligne
      try { const res = await fetch(req); if (res && res.ok) cache.put(req, res.clone()); return res; }
      catch (err) { return (await cache.match(req, {ignoreSearch: true})) || (await cache.match("./index.html")) || new Response("", {status: 504}); }
    }
    const hit = await cache.match(req, {ignoreSearch: true});
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response("", {status: 504});
  }));
});
