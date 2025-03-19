
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { promptInstall, listenForInstallPrompt } from '@/serviceWorkerRegistration';
import { toast } from "sonner";

const InstallPWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  
  useEffect(() => {
    // Écouter l'événement custom appInstallable
    const handleAppInstallable = () => {
      setIsInstallable(true);
    };
    
    window.addEventListener('appInstallable', handleAppInstallable);
    
    // Vérifier si nous avons déjà un prompt enregistré
    const checkInstallPrompt = async () => {
      const canInstall = await promptInstall(true); // Just check, don't prompt
      setIsInstallable(canInstall);
    };
    
    checkInstallPrompt();
    
    // Nettoyer à la fin
    return () => {
      window.removeEventListener('appInstallable', handleAppInstallable);
    };
  }, []);
  
  const handleInstallClick = async () => {
    try {
      const installed = await promptInstall();
      if (installed) {
        setIsInstallable(false);
        toast.success("Application installée avec succès!");
      } else {
        toast.error("L'installation a été annulée ou a échoué");
      }
    } catch (error) {
      console.error("Erreur lors de l'installation:", error);
      toast.error("Erreur lors de l'installation");
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
