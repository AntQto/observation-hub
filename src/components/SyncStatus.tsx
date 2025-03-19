
import React, { useState, useEffect } from 'react';
import { getPendingSyncCount, synchronizeQueue } from '@/lib/syncService';
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RotateCw } from "lucide-react";
import { toast } from "sonner";

const SyncStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(getPendingSyncCount());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Mettre à jour le statut en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Vous êtes de retour en ligne");
      // Tenter de synchroniser automatiquement
      handleSync();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Vous êtes hors ligne");
    };
    
    // Mettre à jour le compteur de synchronisation en attente
    const updatePendingCount = () => {
      setPendingCount(getPendingSyncCount());
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('syncCompleted', updatePendingCount);
    
    // Vérifier périodiquement s'il y a des éléments en attente
    const interval = setInterval(updatePendingCount, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('syncCompleted', updatePendingCount);
      clearInterval(interval);
    };
  }, []);
  
  // Synchroniser manuellement
  const handleSync = async () => {
    if (!isOnline) {
      toast.error("Impossible de synchroniser : vous êtes hors ligne");
      return;
    }
    
    setIsSyncing(true);
    try {
      await synchronizeQueue();
      setPendingCount(getPendingSyncCount());
      toast.success("Synchronisation terminée");
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      toast.error("Erreur de synchronisation");
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="ml-1 text-xs font-medium">
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      </div>
      
      {pendingCount > 0 && (
        <Button 
          variant="outline" 
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={handleSync}
          disabled={!isOnline || isSyncing}
        >
          <RotateCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          {pendingCount} en attente
        </Button>
      )}
    </div>
  );
};

export default SyncStatus;
