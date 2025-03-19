
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { register as registerServiceWorker, listenForInstallPrompt } from './serviceWorkerRegistration'

// Enregistrer le service worker pour le support hors ligne
registerServiceWorker();

// Écouter l'événement d'installation mais laisser le navigateur gérer naturellement
listenForInstallPrompt();

createRoot(document.getElementById("root")!).render(<App />);
