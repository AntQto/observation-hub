
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { promptInstall } from '@/serviceWorkerRegistration';
import { toast } from "sonner";

const InstallPWA = () => {
  // Le composant ne sera utilisé que comme fallback
  // si le navigateur ne propose pas automatiquement l'installation
  const [showFallbackButton, setShowFallbackButton] = useState(false);
  
  useEffect(() => {
    // Nous vérifions après un délai si nous avons reçu un événement beforeinstallprompt
    // Si c'est le cas, nous affichons notre bouton comme solution de secours
    const timer = setTimeout(() => {
      // Vérifier si nous avons un prompt d'installation en attente
      const checkInstallPrompt = async () => {
        const canInstall = await promptInstall(true); // Juste vérifier, ne pas afficher
        setShowFallbackButton(canInstall);
      };
      
      checkInstallPrompt();
    }, 5000); // Attendre 5 secondes pour voir si le navigateur affiche sa propre invite
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleInstallClick = async () => {
    try {
      const installed = await promptInstall();
      if (installed) {
        setShowFallbackButton(false);
        toast.success("Application installée avec succès!");
      } else {
        toast.error("L'installation a été annulée ou a échoué");
      }
    } catch (error) {
      console.error("Erreur lors de l'installation:", error);
      toast.error("Erreur lors de l'installation");
    }
  };
  
  if (!showFallbackButton) return null;
  
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
