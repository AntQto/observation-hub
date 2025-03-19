
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, FileDown } from "lucide-react";
import ObservationList from '@/components/ObservationList';
import ObservationModal from '@/components/ObservationModal';
import SyncStatus from '@/components/SyncStatus';
import { getObservations, initializeStorage, exportObservationsAsCSV, triggerSync } from '@/lib/storage';
import { downloadFile } from '@/lib/utils';
import { toast } from "sonner";

const Index = () => {
  const [observations, setObservations] = useState([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState(null);

  useEffect(() => {
    initializeStorage();
    loadObservations();
    
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

  const loadObservations = () => {
    const loadedObservations = getObservations();
    setObservations(loadedObservations);
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
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
          .then(registration => {
            // Essayer d'enregistrer une tâche de synchronisation en arrière-plan
            registration.sync.register('sync-observations')
              .catch(err => {
                console.log('Échec de l\'enregistrement de la synchronisation en arrière-plan:', err);
                // Synchronisation manuelle si échouée
                triggerSync();
              });
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
            <Button 
              onClick={handleExportCSV}
              variant="outline"
              className="text-sm h-9 gap-1"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
            <Button 
              onClick={() => setIsNewModalOpen(true)}
              className="text-sm h-9 gap-1"
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
            <ObservationList 
              observations={observations} 
              onEdit={handleEditObservation}
            />
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
