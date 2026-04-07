import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/shared/ErrorBoundary';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Polyfill crypto.randomUUID for older Electron versions
if (typeof crypto.randomUUID !== 'function') {
  crypto.randomUUID = () =>
    ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
}

// Catch errors in event handlers (ErrorBoundary only covers render errors).
// Returning true prevents Electron from treating these as fatal renderer crashes.
window.addEventListener('error', (e) => {
  console.error('[Global error]', e.error ?? e.message);
  return true;
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled rejection]', e.reason);
  e.preventDefault();
});

const isElectron = navigator.userAgent.includes('Electron');
const Router = isElectron ? HashRouter : BrowserRouter;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router>
        <AppProvider>
          <App />
        </AppProvider>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
);

// Service workers require https:// — skip in Electron (file:// or with Electron UA)
if (!window.navigator.userAgent.includes('Electron')) {
  serviceWorkerRegistration.register();
}
