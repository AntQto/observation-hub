
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

export function backgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 'SyncManager' in window;
}

export async function requestBackgroundSync(): Promise<boolean> {
  if (!backgroundSyncSupported()) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
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

// Nous conservons ces variables et fonctions pour les composants qui en dépendent
// mais nous ne les utilisons plus pour gérer l'installation manuellement
let deferredPrompt: any = null;

export function listenForInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Nous n'empêchons plus l'affichage de la bannière native d'installation
    console.log('Bannière d\'installation détectée');
    deferredPrompt = e;
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('Application installée avec succès');
    deferredPrompt = null;
  });
}

export async function promptInstall(checkOnly = false): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }
  
  if (checkOnly) {
    return true;
  }
  
  try {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return choiceResult.outcome === 'accepted';
  } catch (error) {
    console.error('Erreur avec le prompt d\'installation:', error);
    deferredPrompt = null;
    return false;
  }
}
