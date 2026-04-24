import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { NetworkProvider } from "./context/NetworkContext";
import { installFetchInterceptor, clearApiCache, clearPendingEntries } from "./service/fetchInterceptor";
import "./index.css";
import App from "./App.tsx";

// --- Install Fetch Interceptor FIRST (before any API calls) ---
installFetchInterceptor();

// --- Clear caches when sync completes (so fresh data is fetched) ---
window.addEventListener('offline-sync-complete', () => {
  clearApiCache();
  clearPendingEntries();
  console.log('[Offline] Cache + pending entries cleared after sync — fresh data will be fetched.');
});

// --- Register PWA Service Worker ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const { registerSW } = await import('virtual:pwa-register');
      registerSW({
        immediate: true,
        onRegisteredSW(swUrl, registration) {
          console.log('[PWA] Service Worker registered:', swUrl);
          // Check for updates every hour
          if (registration) {
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);
          }
        },
        onOfflineReady() {
          console.log('[PWA] App is ready for offline use.');
        },
      });
    } catch (err) {
      console.log('[PWA] Service worker registration skipped:', err);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <NetworkProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </NetworkProvider>
    </BrowserRouter>
  </StrictMode>,
);
