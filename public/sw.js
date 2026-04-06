// ━━━ Cache versioning ━━━
const CACHE_VERSION = 'v1';
const PRECACHE_NAME = `precache-${CACHE_VERSION}`;
const RUNTIME_NAME = `runtime-${CACHE_VERSION}`;

// ━━━ Precache list ━━━
const PRECACHE_URLS = ['/', '/offline'];

// ━━━ Install: precache essential assets ━━━
self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

// ━━━ Activate: clean up old caches ━━━
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter((name) => name !== PRECACHE_NAME && name !== RUNTIME_NAME)
                        .map((name) => caches.delete(name))
                )
            )
    );
    self.clients.claim();
});

// ━━━ Listen for SKIP_WAITING message from the client ━━━
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ━━━ Fetch: route-based caching strategies ━━━
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;

    // Cache First — versioned static assets
    if (url.pathname.startsWith('/_next/static/')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Network First — HTML navigation
    if (request.mode === 'navigate') {
        event.respondWith(networkFirstWithOfflineFallback(request));
        return;
    }

    // Stale-While-Revalidate — images, fonts, public assets
    if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf)$/)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }
});

// ━━━ Strategy implementations ━━━

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(RUNTIME_NAME);
        cache.put(request, response.clone());
    }
    return response;
}

async function networkFirstWithOfflineFallback(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(RUNTIME_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return caches.match('/offline') || new Response('Offline', { status: 503 });
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(RUNTIME_NAME);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    return cached || fetchPromise;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PUSH NOTIFICATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

self.addEventListener('push', (event) => {
    if (!event.data) return;

    const { title, body, icon, badge, url } = event.data.json();
    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon: icon || '/web-app-manifest-192x192.png',
            badge: badge || '/web-app-manifest-192x192.png',
            data: { url: url || '/' },
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            return self.clients.openWindow(targetUrl);
        })
    );
});

// Auto re-subscribe when the browser refreshes the push subscription
self.addEventListener('pushsubscriptionchange', (event) => {
    event.waitUntil(
        self.registration.pushManager.subscribe(event.oldSubscription.options).then((newSub) =>
            fetch('/api/push/resubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    old: event.oldSubscription
                        ? JSON.parse(JSON.stringify(event.oldSubscription))
                        : null,
                    new: JSON.parse(JSON.stringify(newSub)),
                }),
            })
        )
    );
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BACKGROUND SYNC — clock actions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SYNC_TAG = 'sync-clock-actions';
const IDB_DB = 'horaswork-sync';
const IDB_STORE = 'pending-clock-actions';

self.addEventListener('sync', (event) => {
    if (event.tag === SYNC_TAG) {
        event.waitUntil(replayPendingClockActions());
    }
});

function openSyncDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_DB, 1);
        req.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(IDB_STORE, { keyPath: 'id' });
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

function getPendingActions(db) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).getAll();
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

function deletePendingAction(db, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const req = tx.objectStore(IDB_STORE).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e.target.error);
    });
}

async function replayPendingClockActions() {
    const db = await openSyncDB();
    const actions = await getPendingActions(db);

    for (const action of actions) {
        try {
            const res = await fetch('/api/clock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: action.action, clientTime: action.clientTime }),
            });
            if (res.ok || res.status === 400) {
                // 400 means duplicate (already clocked in) — safe to discard
                await deletePendingAction(db, action.id);
                // Notify open clients that the sync completed so they can refresh
                const clients = await self.clients.matchAll({ type: 'window' });
                for (const client of clients) {
                    client.postMessage({ type: 'SYNC_COMPLETE', action: action.action });
                }
            }
        } catch {
            // Network still unavailable — browser will retry the sync event
        }
    }
}
