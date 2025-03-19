
export function register(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/serviceWorker.js';
      
      navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
          console.log('Service Worker enregistré: ', registration);
          
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('Un nouveau contenu est disponible et sera utilisé lorsque toutes les fenêtres de cette page seront fermées.');
                } else {
                  console.log('Le contenu est mis en cache pour une utilisation hors ligne.');
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('Erreur lors de l\'enregistrement du service worker:', error);
        });
    });
  }
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}

// Vérifier si le navigateur supporte la synchronisation en arrière-plan
export function backgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 'SyncManager' in window;
}

// Demander une synchronisation en arrière-plan
export async function requestBackgroundSync(): Promise<boolean> {
  if (!backgroundSyncSupported()) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    // Vérifier si sync est disponible avant de l'utiliser
    if ('sync' in registration) {
      await registration.sync.register('sync-observations');
      return true;
    }
    return false;
  } catch (err) {
    console.error('Erreur lors de l\'enregistrement de la synchronisation en arrière-plan:', err);
    return false;
  }
}
