import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service Worker + Web Push
if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.register('/sw.js').then(async (reg) => {
    const vapidRes = await fetch(`${import.meta.env.VITE_API_URL}/notifications/vapid-key`);
    const { publicKey } = await vapidRes.json();
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });
    await fetch(`${import.meta.env.VITE_API_URL}/notifications/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ endpoint: sub.endpoint, p256dh: btoa(Array.from(new Uint8Array(sub.getKey('p256dh'))).map(b => String.fromCharCode(b)).join('')), auth: btoa(Array.from(new Uint8Array(sub.getKey('auth'))).map(b => String.fromCharCode(b)).join('')) }),
    });
  }).catch(() => {});
}
