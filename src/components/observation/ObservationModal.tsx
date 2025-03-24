
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Observation, saveObservation } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { toast } from "sonner";
import { useGeolocation } from '@/hooks/useGeolocation';
import ObservationForm from './ObservationForm';

interface ObservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  observation?: Observation;
}

const ObservationModal: React.FC<ObservationModalProps> = ({ 
  open, 
  onOpenChange,
  observation 
}) => {
  const isEditMode = !!observation;
  const geolocation = useGeolocation();

  const handleSubmit = (formData: Record<string, any>) => {
    // Create or update the observation
    const newObservation: Observation = {
      id: observation?.id || generateId(),
      createdAt: observation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: formData,
      // Add GPS coordinates and device timestamp
      location: !isEditMode ? {
        latitude: geolocation.coords.latitude,
        longitude: geolocation.coords.longitude,
        accuracy: geolocation.coords.accuracy,
      } : observation?.location,
      deviceTimestamp: !isEditMode ? Date.now() : observation?.deviceTimestamp
    };
    
    saveObservation(newObservation);
    toast.success(isEditMode ? "Observation updated!" : "New observation added!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">
            {isEditMode ? 'Edit Observation' : 'New Observation'}
          </DialogTitle>
        </DialogHeader>
        
        <ObservationForm
          observation={observation}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          geolocation={geolocation}
          isEditMode={isEditMode}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ObservationModal;
