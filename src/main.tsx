import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n.ts' // Import i18n configuration
import './index.css'
import { Toaster } from 'sonner'

// Register service worker for PWA (optional - only if file exists)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Check if service worker file exists before registering
    fetch('/firebase-messaging-sw.js', { method: 'HEAD' })
      .then(() => {
        return navigator.serviceWorker.register('/firebase-messaging-sw.js')
      })
      .then((registration) => {
        console.log('Service Worker registered:', registration)
      })
      .catch((error) => {
        // Silently fail - service worker is optional
        console.debug('Service Worker not available:', error)
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem', fontFamily: 'Arial' }}>جاري التحميل...</div>}>
      <App />
    </Suspense>
    <Toaster position="top-center" richColors dir="rtl" />
  </React.StrictMode>
)