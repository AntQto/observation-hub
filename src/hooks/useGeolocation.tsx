
import { useState, useEffect } from 'react';

interface GeolocationState {
  coords: {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  };
  timestamp: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coords: {
      latitude: null,
      longitude: null,
      accuracy: null,
    },
    timestamp: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: 'La géolocalisation n\'est pas supportée par ce navigateur.'
      }));
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const successHandler = (position: GeolocationPosition) => {
      setState({
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        },
        timestamp: position.timestamp,
        loading: false,
        error: null,
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: `Erreur de géolocalisation: ${error.message}`
      }));
    };

    // Obtenir la position actuelle
    navigator.geolocation.getCurrentPosition(
      successHandler,
      errorHandler,
      geoOptions
    );

    // Demander la permission si nécessaire
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'denied') {
          setState(prevState => ({
            ...prevState,
            loading: false,
            error: 'La permission de géolocalisation a été refusée.'
          }));
        }
      });
    }
  }, []);

  return state;
}
