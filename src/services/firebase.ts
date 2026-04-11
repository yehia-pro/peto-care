import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

// Firebase configuration from environment variables
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
const appId = import.meta.env.VITE_FIREBASE_APP_ID

// Check if Firebase is enabled (all required config present)
export const isFirebaseEnabled = !!(apiKey && authDomain && projectId && storageBucket && messagingSenderId && appId)

let app: ReturnType<typeof initializeApp> | null = null
let messaging: ReturnType<typeof getMessaging> | null = null

if (isFirebaseEnabled) {
  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  }

  try {
    app = initializeApp(firebaseConfig)
    messaging = getMessaging(app)
  } catch (e) {
    console.error('Firebase initialization failed:', e)
  }
}

export { app, messaging }
export default app
