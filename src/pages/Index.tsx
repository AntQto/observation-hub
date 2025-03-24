
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, FileDown } from "lucide-react";
import ObservationList from '@/components/ObservationList';
import ObservationModal from '@/components/observation/ObservationModal';
import SyncStatus from '@/components/SyncStatus';
import InstallPWA from '@/components/InstallPWA';
import { getObservations, initializeStorage, exportObservationsAsCSV, triggerSync } from '@/lib/storage';
import { downloadFile } from '@/lib/utils';
import { toast } from "sonner";
import { backgroundSyncSupported } from '@/serviceWorkerRegistration';

const Index = () => {
  const [observations, setObservations] = useState([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await initializeStorage();
        await loadObservations();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    }
    
    init();
    
    // Écouter les messages du service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'TRIGGER_SYNC') {
        triggerSync();
      }
    });
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      loadObservations();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('observationsUpdated', handleStorageChange);
    window.addEventListener('syncCompleted', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('observationsUpdated', handleStorageChange);
      window.removeEventListener('syncCompleted', handleStorageChange);
    };
  }, []);

  const loadObservations = async () => {
    try {
      setIsLoading(true);
      const loadedObservations = await getObservations();
      setObservations(loadedObservations);
    } catch (error) {
      console.error('Erreur lors du chargement des observations:', error);
      toast.error('Erreur lors du chargement des observations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewModalOpenChange = (open: boolean) => {
    setIsNewModalOpen(open);
    if (!open) {
      loadObservations();
      window.dispatchEvent(new CustomEvent('observationsUpdated'));
    }
  };

  const handleEditObservation = (observation) => {
    setSelectedObservation(observation);
  };

  const handleEditModalClose = (open: boolean) => {
    if (!open) {
      setSelectedObservation(null);
      loadObservations();
      window.dispatchEvent(new CustomEvent('observationsUpdated'));
    }
  };

  const handleExportCSV = () => {
    const csv = exportObservationsAsCSV();
    
    if (!csv) {
      toast.error('Pas de données à exporter');
      return;
    }
    
    downloadFile(csv, `observations-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    toast.success('Observations exportées avec succès');
  };

  // Tenter une synchronisation en arrière-plan lorsque nous sommes en ligne
  useEffect(() => {
    const handleOnline = () => {
      if (backgroundSyncSupported()) {
        navigator.serviceWorker.ready
          .then(registration => {
            // Vérifier si sync est disponible avant de l'utiliser
            if ('sync' in registration) {
              // Essayer d'enregistrer une tâche de synchronisation en arrière-plan
              registration.sync.register('sync-observations')
                .catch(err => {
                  console.log('Échec de l\'enregistrement de la synchronisation en arrière-plan:', err);
                  // Synchronisation manuelle si échouée
                  triggerSync();
                });
            } else {
              // Fallback si sync n'est pas disponible
              triggerSync();
            }
          });
      } else {
        // Fallback si Background Sync n'est pas supporté
        triggerSync();
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    // Vérifier si nous sommes en ligne au montage
    if (navigator.onLine) {
      handleOnline();
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 glass-morphism border-b border-border/40 backdrop-blur-md">
        <div className="container px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg font-medium">Observations</h1>
          <SyncStatus />
          <div className="ml-auto flex items-center space-x-3">
            <InstallPWA />
            <Button 
              onClick={handleExportCSV}
              variant="outline"
              className="text-sm h-9 gap-1"
              disabled={isLoading}
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
            <Button 
              onClick={() => setIsNewModalOpen(true)}
              className="text-sm h-9 gap-1"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle observation</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-fade-in">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-pulse text-muted-foreground">Chargement des observations...</div>
              </div>
            ) : (
              <ObservationList 
                observations={observations} 
                onEdit={handleEditObservation}
              />
            )}
          </div>
        </div>
      </main>
      
      <ObservationModal
        open={isNewModalOpen}
        onOpenChange={handleNewModalOpenChange}
      />
      
      {selectedObservation && (
        <ObservationModal
          open={!!selectedObservation}
          onOpenChange={handleEditModalClose}
          observation={selectedObservation}
        />
      )}
    </div>
  );
};

export default Index;
