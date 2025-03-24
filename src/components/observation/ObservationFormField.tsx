
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Field } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface ObservationFormFieldProps {
  field: Field;
  value: any;
  onChange: (fieldId: string, value: any) => void;
  date?: Date;
  onDateSelect?: (date: Date | undefined) => void;
}

const ObservationFormField: React.FC<ObservationFormFieldProps> = ({ 
  field, 
  value, 
  onChange,
  date,
  onDateSelect
}) => {
  if (field.type === 'text') {
    // Use Textarea for description and notes
    if (field.id === 'description' || field.id === 'notes') {
      return (
        <div className="grid gap-2">
          <Label htmlFor={field.id} className="text-sm font-medium">
            {field.name}
          </Label>
          <Textarea
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(field.id, e.target.value)}
            className="rounded-md border-input"
            rows={3}
          />
        </div>
      );
    }
    
    // Regular text input for other text fields
    return (
      <div className="grid gap-2">
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.name}
        </Label>
        <Input
          id={field.id}
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="rounded-md border-input"
        />
      </div>
    );
  }
  
  if (field.type === 'number') {
    return (
      <div className="grid gap-2">
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.name}
        </Label>
        <Input
          id={field.id}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          className="rounded-md border-input"
        />
      </div>
    );
  }
  
  if (field.type === 'date' && onDateSelect) {
    return (
      <div className="grid gap-2">
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.name}
        </Label>
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
                onSelect={onDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }
  
  if (field.type === 'select' && field.options) {
    return (
      <div className="grid gap-2">
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.name}
        </Label>
        <Select
          value={value || ''}
          onValueChange={(value) => onChange(field.id, value)}
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
      </div>
    );
  }
  
  return null;
};

export default ObservationFormField;
