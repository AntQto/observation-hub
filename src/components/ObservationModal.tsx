
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Field, Observation, observationFields, saveObservation } from '@/lib/storage';
import { generateId, formatDate } from '@/lib/utils';
import { toast } from "@/components/ui/sonner";
import { cn } from '@/lib/utils';

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
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [date, setDate] = useState<Date | undefined>(undefined);
  const isEditMode = !!observation;

  // Initialize form data when the modal opens or observation changes
  useEffect(() => {
    if (observation) {
      setFormData(observation.fields);
      
      // Set date if it exists
      if (observation.fields.date) {
        setDate(new Date(observation.fields.date));
      }
    } else {
      // Reset form for new observation
      const initialData: Record<string, any> = {};
      observationFields.forEach(field => {
        initialData[field.id] = '';
      });
      setFormData(initialData);
      setDate(undefined);
    }
  }, [observation, open]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      handleInputChange('date', selectedDate.toISOString());
    }
  };

  const handleSubmit = () => {
    // Validate form data if needed
    const newObservation: Observation = {
      id: observation?.id || generateId(),
      createdAt: observation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fields: formData
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
        
        <div className="grid gap-6 py-4">
          {observationFields.map((field) => (
            <div key={field.id} className="grid gap-2">
              <Label htmlFor={field.id} className="text-sm font-medium">
                {field.name}
              </Label>
              
              {field.type === 'text' && (
                <Input
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="rounded-md border-input"
                />
              )}
              
              {field.type === 'number' && (
                <Input
                  id={field.id}
                  type="number"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="rounded-md border-input"
                />
              )}
              
              {field.id === 'description' && field.type === 'text' && (
                <Textarea
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="rounded-md border-input"
                  rows={3}
                />
              )}
              
              {field.id === 'notes' && field.type === 'text' && (
                <Textarea
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="rounded-md border-input"
                  rows={3}
                />
              )}
              
              {field.type === 'date' && (
                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? formatDate(date.toISOString()) : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              
              {field.type === 'select' && field.options && (
                <Select
                  value={formData[field.id] || ''}
                  onValueChange={(value) => handleInputChange(field.id, value)}
                >
                  <SelectTrigger className="rounded-md border-input">
                    <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
        
        <DialogFooter className="flex sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:inline-flex hidden"
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {isEditMode ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ObservationModal;
