
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pen, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatDate, paginateItems, getPageCount } from '@/lib/utils';
import { Observation, Field, observationFields } from '@/lib/storage';
import ObservationModal from './ObservationModal';

interface ObservationListProps {
  observations: Observation[];
  visibleFields?: Field[];
  itemsPerPage?: number;
}

const ObservationList: React.FC<ObservationListProps> = ({ 
  observations,
  visibleFields = observationFields.slice(0, 5), // Show first 5 fields by default
  itemsPerPage = 20
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedObservation, setSelectedObservation] = useState<Observation | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate page information
  const totalItems = observations.length;
  const pageCount = getPageCount(totalItems, itemsPerPage);
  const paginatedObservations = paginateItems(observations, currentPage, itemsPerPage);

  // Change page
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pageCount) {
      setCurrentPage(newPage);
    }
  };

  // Handle edit
  const handleEditObservation = (observation: Observation) => {
    setSelectedObservation(observation);
    setIsModalOpen(true);
  };

  // Get display value for a field
  const getDisplayValue = (observation: Observation, fieldId: string) => {
    const value = observation.fields[fieldId];
    
    if (value === undefined || value === '') {
      return '-';
    }
    
    // Format date fields
    if (fieldId === 'date' && value) {
      return formatDate(value);
    }
    
    return value;
  };

  return (
    <div className="w-full">
      <div className="rounded-lg border neo-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              {visibleFields.map((field) => (
                <TableHead 
                  key={field.id}
                  className={cn(
                    "font-medium text-foreground/80",
                    field.id === 'title' && "w-[30%]"
                  )}
                >
                  {field.name}
                </TableHead>
              ))}
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedObservations.length > 0 ? (
              paginatedObservations.map((observation) => (
                <TableRow 
                  key={observation.id}
                  className="transition-colors hover:bg-muted/10"
                >
                  {visibleFields.map((field, fieldIndex) => (
                    <TableCell 
                      key={`${observation.id}-${field.id}`}
                      className={cn(
                        fieldIndex === 0 && "font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {fieldIndex === 0 && (
                          <button
                            onClick={() => handleEditObservation(observation)}
                            className="text-primary hover:text-primary/80 transition-colors inline-flex items-center"
                          >
                            {getDisplayValue(observation, field.id)}
                          </button>
                        )}
                        {fieldIndex !== 0 && getDisplayValue(observation, field.id)}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="text-right p-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditObservation(observation)}
                      className="h-8 w-8"
                    >
                      <Pen className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={visibleFields.length + 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  No observations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {`${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pageCount}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      <ObservationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        observation={selectedObservation}
      />
    </div>
  );
};

export default ObservationList;
