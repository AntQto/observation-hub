
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronLeft, ChevronRight, CloudOff, Map } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Observation, deleteObservation, observationFields } from '@/lib/storage';
import { formatDate, paginateItems, getPageCount } from '@/lib/utils';
import { format } from 'date-fns';

interface ObservationListProps {
  observations: Observation[];
  onEdit?: (observation: Observation) => void;
}

const ObservationList: React.FC<ObservationListProps> = ({ observations, onEdit }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [observationToDelete, setObservationToDelete] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = 10;
  const pageCount = getPageCount(observations.length, ITEMS_PER_PAGE);
  const paginatedObservations = paginateItems<Observation>(
    // Trier les observations les plus récentes en premier
    [...observations].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    currentPage,
    ITEMS_PER_PAGE
  );
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  const handleEditClick = (observation: Observation) => {
    if (onEdit) {
      onEdit(observation);
    }
  };
  
  const handleDeleteClick = (id: string) => {
    setObservationToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (observationToDelete) {
      deleteObservation(observationToDelete);
      setDeleteDialogOpen(false);
      setObservationToDelete(null);
      toast.success("Observation supprimée");
      
      // Si nous supprimons le dernier élément d'une page, revenir à la page précédente
      if (paginatedObservations.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      // Déclencher l'événement pour que les autres composants puissent mettre à jour leur état
      window.dispatchEvent(new CustomEvent('observationsUpdated'));
    }
  };
  
  const formatDeviceTime = (timestamp?: number) => {
    if (!timestamp) return null;
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss');
  };
  
  const openLocationInMaps = (latitude: number | null, longitude: number | null) => {
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
    }
  };
  
  if (observations.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Aucune observation enregistrée.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Cliquez sur "Nouvelle observation" pour commencer.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {paginatedObservations.map((observation) => (
          <Card key={observation.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleEditClick(observation)}>
                      {observation.fields.title || 'Sans titre'}
                      <Pencil className="h-3.5 w-3.5 inline ml-1 opacity-70" />
                    </h3>
                    
                    {observation.synced === false && (
                      <span className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        <CloudOff className="h-3 w-3 mr-1" />
                        Non synchronisé
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {observation.fields.date && (
                      <div className="mb-1">{formatDate(observation.fields.date)}</div>
                    )}
                    {observation.deviceTimestamp && (
                      <div className="text-xs text-muted-foreground mb-1">
                        Horodatage: {formatDeviceTime(observation.deviceTimestamp)}
                      </div>
                    )}
                    
                    {observation.location && observation.location.latitude && observation.location.longitude && (
                      <div className="flex items-center mb-2 text-xs">
                        <button
                          onClick={() => openLocationInMaps(observation.location?.latitude || null, observation.location?.longitude || null)}
                          className="flex items-center text-primary hover:underline"
                        >
                          <Map className="h-3 w-3 mr-1" />
                          Coordonnées: {observation.location.latitude.toFixed(6)}, {observation.location.longitude.toFixed(6)}
                        </button>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      {observationFields
                        .filter(field => field.id !== 'title' && field.id !== 'date' && field.id !== 'description' && field.id !== 'notes')
                        .map(field => (
                          observation.fields[field.id] ? (
                            <div key={field.id} className="text-sm">
                              <span className="font-medium">{field.name}:</span>{' '}
                              {field.id === 'quantity' 
                                ? Number(observation.fields[field.id]).toString() 
                                : observation.fields[field.id]}
                            </div>
                          ) : null
                        ))}
                    </div>
                    
                    {observation.fields.description && (
                      <div className="mt-2">
                        <span className="font-medium">Description:</span>{' '}
                        {observation.fields.description.length > 100 
                          ? `${observation.fields.description.substring(0, 100)}...` 
                          : observation.fields.description}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  onClick={() => handleDeleteClick(observation.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {pageCount > 1 && (
        <div className="flex items-center justify-center mt-6 space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm mx-2">
            Page {currentPage} sur {pageCount}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pageCount}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'observation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette observation ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ObservationList;
