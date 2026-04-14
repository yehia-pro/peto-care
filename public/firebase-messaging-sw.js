importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyA1V6fhpsVNsW8OurUy8K1Ck595AHzKjeY",
    authDomain: "vet-care-e9c89.firebaseapp.com",
    projectId: "vet-care-e9c89",
    storageBucket: "vet-care-e9c89.firebasestorage.app",
    messagingSenderId: "371520487874",
    appId: "1:371520487874:web:0d6bde72368ca6861d565b"
});

const messaging = firebase.messaging();

// Force immediate activation — clears old SW cache on new deploy
self.addEventListener('install', (event) => {
    console.log('[SW] New version installing — skipping wait');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activated — claiming all clients');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('[SW] Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim())
    );
});


messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
