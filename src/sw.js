/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const appShellHandler = createHandlerBoundToURL('/index.html');
const RUNTIME_CACHE = 'runtime-cache-v1';

function isCacheableResponse(response) {
  if (!response) return false;
  if (response.type === 'error') return false;
  if (response.status === 206) return false;
  return response.status < 400;
}

async function saveToRuntimeCache(request, response) {
  if (!isCacheableResponse(response)) return;
  const cache = await caches.open(RUNTIME_CACHE);
  await cache.put(request, response.clone());
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(new Request(request, { cache: 'no-store' }));
          void saveToRuntimeCache(request, networkResponse).catch(() => {});
          return networkResponse;
        } catch {
          const cachedNavigation =
            (await caches.match(request, { ignoreSearch: true })) ||
            (await caches.match(url.pathname, { ignoreSearch: true }));
          if (cachedNavigation) return cachedNavigation;

          return appShellHandler({ event, request, url });
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
          const networkResponse = await fetch(new Request(request, { cache: 'no-store' }));
        void saveToRuntimeCache(request, networkResponse).catch(() => {});
        return networkResponse;
      } catch {
          const cachedAsset =
            (await caches.match(request, { ignoreSearch: true })) ||
            (await caches.match(url.pathname, { ignoreSearch: true }));
        if (cachedAsset) return cachedAsset;

        if (request.destination === 'document') {
          return appShellHandler({ event, request, url });
        }

        return Response.error();
      }
    })(),
  );
});
