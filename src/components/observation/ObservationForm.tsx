
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Field, Observation, observationFields } from '@/lib/storage';
import ObservationFormField from './ObservationFormField';
import LocationDisplay from './LocationDisplay';

interface ObservationFormProps {
  observation?: Observation;
  onSubmit: (formData: Record<string, any>, date?: Date) => void;
  onCancel: () => void;
  geolocation: any;
  isEditMode: boolean;
}

const ObservationForm: React.FC<ObservationFormProps> = ({ 
  observation, 
  onSubmit, 
  onCancel,
  geolocation,
  isEditMode
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [date, setDate] = useState<Date | undefined>(undefined);

  // Initialize form data when observation changes
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
  }, [observation]);

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
    onSubmit(formData, date);
  };

  return (
    <div className="grid gap-6 py-4">
      {!isEditMode && <LocationDisplay geolocation={geolocation} />}
      
      {observationFields.map((field: Field) => (
        <ObservationFormField
          key={field.id}
          field={field}
          value={formData[field.id]}
          onChange={handleInputChange}
          date={field.type === 'date' ? date : undefined}
          onDateSelect={field.type === 'date' ? handleDateSelect : undefined}
        />
      ))}
      
      <div className="flex sm:justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="sm:inline-flex hidden"
        >
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit}>
          {isEditMode ? 'Update' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default ObservationForm;
