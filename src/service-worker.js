/* eslint-disable no-restricted-globals */
// CFA Training Tracker — Workbox Service Worker
// CRA v5 uses InjectManifest to inject self.__WB_MANIFEST into this file at build time.

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

clientsClaim();

// Precache all build assets (injected by Workbox at build time).
precacheAndRoute(self.__WB_MANIFEST);

// App-Shell routing: all navigation requests serve index.html.
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }) => {
    if (request.mode !== 'navigate') return false;
    if (url.pathname.startsWith('/_')) return false;
    if (url.pathname.match(fileExtensionRegexp)) return false;
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Cache same-origin non-static resources with stale-while-revalidate.
registerRoute(
  ({ url }) =>
    url.origin === self.location.origin &&
    !url.pathname.startsWith('/static'),
  new StaleWhileRevalidate({
    cacheName: 'cfa-runtime-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50 })],
  })
);

// Allow the app to trigger a fast update via registration.waiting.postMessage.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
