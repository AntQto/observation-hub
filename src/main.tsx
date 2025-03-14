
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { register as registerServiceWorker } from './serviceWorkerRegistration'

// Register the service worker for offline support
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
