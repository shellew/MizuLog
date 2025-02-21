const CACHE_NAME = "mizulog-cache-v1";
const urlsToCache = [
    "/",
    "/static/css/style.css",
    "/static/js/main.js",
    "/static/icons/icon-192.png",
    "/static/icons/icon-512.png"
];

// インストールイベント: キャッシュを削除
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});

// fetch: キャッシュから応答
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response => {
            return response || fetch(event.request);
        }))
    );
});

// activate: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheName) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});