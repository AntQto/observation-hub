import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, FileDown } from "lucide-react";
import ObservationList from '@/components/ObservationList';
import ObservationModal from '@/components/ObservationModal';
import { getObservations, initializeStorage, exportObservationsAsCSV } from '@/lib/storage';
import { downloadFile } from '@/lib/utils';
import { toast } from "sonner";

const Index = () => {
  const [observations, setObservations] = useState([]);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  useEffect(() => {
    initializeStorage();
    loadObservations();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      loadObservations();
    };

    window.addEventListener('storage', handleStorageChange);
    
    window.addEventListener('observationsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('observationsUpdated', handleStorageChange);
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

  const handleExportCSV = () => {
    const csv = exportObservationsAsCSV();
    
    if (!csv) {
      toast.error('No data to export');
      return;
    }
    
    downloadFile(csv, `observations-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    toast.success('Observations exported successfully');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 glass-morphism border-b border-border/40 backdrop-blur-md">
        <div className="container px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg font-medium">Observations</h1>
          <div className="ml-auto flex items-center space-x-3">
            <Button 
              onClick={handleExportCSV}
              variant="outline"
              className="text-sm h-9 gap-1"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Export Data</span>
            </Button>
            <Button 
              onClick={() => setIsNewModalOpen(true)}
              className="text-sm h-9 gap-1"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Observation</span>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-fade-in">
            <ObservationList observations={observations} />
          </div>
        </div>
      </main>
      
      <ObservationModal
        open={isNewModalOpen}
        onOpenChange={handleNewModalOpenChange}
      />
    </div>
  );
};

export default Index;
