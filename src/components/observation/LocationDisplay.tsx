
import React from 'react';
import { MapPin } from "lucide-react";

interface LocationDisplayProps {
  geolocation: {
    coords: {
      latitude: number | null;
      longitude: number | null;
      accuracy: number | null;
    };
    loading: boolean;
    error: string | null;
  };
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ geolocation }) => {
  if (geolocation.loading) {
    return (
      <div className="bg-primary/10 p-3 rounded-md flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 text-primary" />
        <span>Récupération de la position...</span>
      </div>
    );
  }
  
  if (geolocation.error) {
    return (
      <div className="bg-primary/10 p-3 rounded-md flex items-center gap-2 text-sm">
        <MapPin className="h-4 w-4 text-destructive" />
        <span className="text-destructive">{geolocation.error}</span>
      </div>
    );
  }
  
  return (
    <div className="bg-primary/10 p-3 rounded-md flex items-center gap-2 text-sm">
      <MapPin className="h-4 w-4 text-primary" />
      <span>
        Position: {geolocation.coords.latitude?.toFixed(6)}, {geolocation.coords.longitude?.toFixed(6)} 
        {geolocation.coords.accuracy && (
          <span className="text-xs text-muted-foreground ml-1">
            (précision: ±{Math.round(geolocation.coords.accuracy)}m)
          </span>
        )}
      </span>
    </div>
  );
};

export default LocationDisplay;
