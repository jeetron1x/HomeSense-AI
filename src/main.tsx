// Ensure window.fetch is writable and cannot throw getter-only assignment errors in iframe sandboxes
try {
  if (typeof window !== 'undefined') {
    const rawFetch = window.fetch;
    let activeFetch = rawFetch ? (...args: Parameters<typeof fetch>) => rawFetch.apply(window, args) : null;
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || desc.configurable || (desc.get && !desc.set)) {
      Object.defineProperty(window, 'fetch', {
        get() {
          return activeFetch;
        },
        set(fn) {
          activeFetch = fn;
        },
        configurable: true,
        enumerable: true,
      });
    }
  }
} catch {
  // Ignore
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
