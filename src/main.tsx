import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register offline Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Amit HyperWall] Service Worker active:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Amit HyperWall] Service Worker registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
