
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { isAppInstallable, promptInstall, listenForInstallPrompt } from '@/serviceWorkerRegistration';

const InstallPWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  
  useEffect(() => {
    // Vérifier si l'app est installable au montage du composant
    const checkInstallable = async () => {
      const installable = await isAppInstallable();
      setIsInstallable(installable);
    };
    
    checkInstallable();
    
    // Écouter l'événement beforeinstallprompt
    listenForInstallPrompt();
    
    // Écouter l'événement custom appInstallable
    const handleAppInstallable = () => {
      setIsInstallable(true);
    };
    
    window.addEventListener('appInstallable', handleAppInstallable);
    
    // Nettoyer à la fin
    return () => {
      window.removeEventListener('appInstallable', handleAppInstallable);
    };
  }, []);
  
  const handleInstallClick = async () => {
    const installed = await promptInstall();
    if (installed) {
      setIsInstallable(false);
    }
  };
  
  if (!isInstallable) return null;
  
  return (
    <Button 
      onClick={handleInstallClick}
      variant="outline"
      className="text-sm h-9 gap-1"
    >
      <Download className="h-4 w-4" />
      <span>Installer l'app</span>
    </Button>
  );
};

export default InstallPWA;
