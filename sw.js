/* Iqra' 90 — service worker : cache hors-ligne (sauf audio des versets) */
const CACHE = "iqra90-v1";
const CORE = ["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  const url = new URL(e.request.url);
  if(e.request.method!=="GET") return;
  if(url.hostname.includes("everyayah.com")) return; // audio : toujours en direct, jamais mis en cache

  // Navigation / index : réseau d'abord (pour recevoir les mises à jour), cache en secours
  if(e.request.mode==="navigate" || url.pathname.endsWith("/index.html")){
    e.respondWith(
      fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(CACHE).then(c=>c.put("./index.html",cp)); return r; })
        .catch(()=>caches.match("./index.html"))
    );
    return;
  }
  // Le reste (icônes, polices) : cache d'abord, réseau en secours avec mise en cache
  e.respondWith(
    caches.match(e.request).then(hit=> hit || fetch(e.request).then(r=>{
      if(r && (r.type==="basic"||r.type==="cors") && r.status===200){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); }
      return r;
    }).catch(()=>hit))
  );
});
