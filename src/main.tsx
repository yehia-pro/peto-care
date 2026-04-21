import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n.ts' // Import i18n configuration
import './index.css'
import { Toaster } from 'sonner'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    fetch('/firebase-messaging-sw.js', { method: 'HEAD' })
      .then(() => navigator.serviceWorker.register('/firebase-messaging-sw.js'))
      .then((registration) => {
        console.log('Service Worker registered:', registration)

        // Listen for new SW version — reload page to apply update immediately
        registration.addEventListener('updatefound', () => {
          const newSW = registration.installing
          if (!newSW) return

          newSW.addEventListener('statechange', () => {
            // New SW installed and old one is still controlling
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available — reloading to apply update...')
              window.location.reload()
            }
          })
        })
      })
      .catch((error) => console.debug('Service Worker not available:', error))
  })

  // If SW controller changes (new SW took over), reload once
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      console.log('[SW] Controller changed — reloading page')
      window.location.reload()
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem', fontFamily: 'Arial' }}>جاري التحميل...</div>}>
      <App />
    </Suspense>
    <Toaster
      position="top-center"
      richColors
      dir="rtl"
      toastOptions={{
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #334155',
          fontFamily: "'Cairo', 'Tajawal', sans-serif",
        },
        classNames: {
          success: 'toast-success',
          error: 'toast-error',
        },
      }}
    />
  </React.StrictMode>
)