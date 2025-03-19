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

export function isAppInstallable(): Promise<boolean> {
  return new Promise((resolve) => {
    if (deferredPrompt) {
      resolve(true);
      return;
    }
    
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      resolve(false);
      return;
    }
    
    const isSupported = 
      'serviceWorker' in navigator && 
      window.isSecureContext;
    
    resolve(isSupported);
  });
}

let deferredPrompt: any = null;

export function listenForInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    console.log('App can be installed! Prompt event saved.');
    // Dispatch a custom event to notify components that the app is installable
    window.dispatchEvent(new CustomEvent('appInstallable'));
  });
  
  // Also listen for the appinstalled event
  window.addEventListener('appinstalled', () => {
    console.log('App was installed');
    deferredPrompt = null;
  });
}

export async function promptInstall(checkOnly = false): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('No installation prompt available');
    return false;
  }
  
  // If we're just checking, return true without prompting
  if (checkOnly) {
    return true;
  }
  
  console.log('Showing installation prompt...');
  try {
    // Show the prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    console.log('User choice result:', choiceResult.outcome);
    
    // Clear the saved prompt regardless of outcome
    deferredPrompt = null;
    
    return choiceResult.outcome === 'accepted';
  } catch (error) {
    console.error('Error showing install prompt:', error);
    deferredPrompt = null;
    return false;
  }
}
