
const CACHE_NAME = 'observation-app-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/src/main.tsx',
  '/src/index.css',
  '/manifest.json',
  '/apple-touch-icon.png'
];

// Installer le service worker et mettre en cache les ressources initiales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Mise en cache des ressources statiques');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activer et nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercepter les requêtes fetch et répondre avec des ressources en cache lorsque disponibles
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retourner la réponse depuis la version en cache
        if (response) {
          return response;
        }

        // Cloner la requête car c'est un flux qui ne peut être consommé qu'une fois
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Vérifier si nous avons reçu une réponse valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cloner la réponse car c'est un flux qui ne peut être consommé qu'une fois
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si la requête échoue (ex. hors ligne), essayer de servir une page générique
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Gérer la synchronisation en arrière-plan (Background Sync API)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-observations') {
    console.log('Tentative de synchronisation en arrière-plan');
    // Le service worker ne peut pas accéder directement au localStorage
    // Nous allons donc envoyer un message au client pour déclencher une synchronisation
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'TRIGGER_SYNC'
        });
      });
    });
  }
});

// Gérer les messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
