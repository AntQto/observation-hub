
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { register as registerServiceWorker, listenForInstallPrompt } from './serviceWorkerRegistration'

// Register the service worker for offline support
registerServiceWorker();

// Listen for the install prompt event
listenForInstallPrompt();

createRoot(document.getElementById("root")!).render(<App />);
