
export interface Field {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[]; // Pour les champs de sélection
}

export interface Observation {
  id: string;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, any>;
  location?: {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  };
  deviceTimestamp?: number;
  synced?: boolean; // Indicateur si l'observation est synchronisée
}

// Champs d'observation prédéfinis - dans une vraie application, vous pourriez les rendre configurables
export const observationFields: Field[] = [
  { id: 'title', name: 'Titre', type: 'text' },
  { id: 'date', name: 'Date', type: 'date' },
  { id: 'location', name: 'Lieu', type: 'text' },
  { id: 'species', name: 'Espèce', type: 'text' },
  { id: 'category', name: 'Catégorie', type: 'select', options: ['Mammifère', 'Oiseau', 'Reptile', 'Amphibien', 'Poisson', 'Insecte', 'Autre'] },
  { id: 'quantity', name: 'Quantité', type: 'number' },
  { id: 'behavior', name: 'Comportement', type: 'text' },
  { id: 'description', name: 'Description', type: 'text' },
  { id: 'notes', name: 'Notes', type: 'text' }
];

// Clés LocalStorage
const OBSERVATIONS_KEY = 'observations';

import { addToSyncQueue, initSyncQueue, synchronizeQueue } from './syncService';
import { initSupabase, fetchObservations as fetchSupabaseObservations } from './supabase';

// État d'initialisation de Supabase
let supabaseInitialized = false;

// Initialiser le stockage
export async function initializeStorage(): Promise<void> {
  if (!localStorage.getItem(OBSERVATIONS_KEY)) {
    localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify([]));
  }
  
  // Initialiser la file d'attente de synchronisation
  initSyncQueue();
  
  // Initialiser Supabase
  supabaseInitialized = await initSupabase();
  
  // Si Supabase est initialisé et que nous sommes en ligne, synchroniser les données
  if (supabaseInitialized && navigator.onLine) {
    try {
      // Récupérer les observations depuis Supabase
      const remoteObservations = await fetchSupabaseObservations();
      
      // Si nous avons des observations à distance, les fusionner avec les locales
      if (remoteObservations.length > 0) {
        const localObservations = getLocalObservations();
        
        // Créer un Map des observations locales pour faciliter la fusion
        const localObsMap = new Map(localObservations.map(obs => [obs.id, obs]));
        
        // Fusionner les observations distantes
        remoteObservations.forEach(remoteObs => {
          const localObs = localObsMap.get(remoteObs.id);
          
          // Si l'observation locale existe, comparer les dates de mise à jour
          if (localObs) {
            const remoteDate = new Date(remoteObs.updatedAt).getTime();
            const localDate = new Date(localObs.updatedAt).getTime();
            
            // Utiliser la plus récente
            if (remoteDate > localDate) {
              localObsMap.set(remoteObs.id, { ...remoteObs, synced: true });
            }
          } else {
            // Si l'observation n'existe pas localement, l'ajouter
            localObsMap.set(remoteObs.id, { ...remoteObs, synced: true });
          }
        });
        
        // Mettre à jour le stockage local avec les observations fusionnées
        localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(Array.from(localObsMap.values())));
      }
      
      // Synchroniser les observations locales non synchronisées
      synchronizeQueue();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du stockage avec Supabase:', error);
    }
  }
}

// Enregistrer une observation
export function saveObservation(observation: Observation): void {
  const observations = getLocalObservations();
  const existingIndex = observations.findIndex(o => o.id === observation.id);
  
  // Vérifier si nous sommes en ligne et si Supabase est initialisé
  const isOnlineAndInitialized = navigator.onLine && supabaseInitialized;
  
  if (existingIndex >= 0) {
    // Mettre à jour l'observation existante
    observations[existingIndex] = {
      ...observation,
      updatedAt: new Date().toISOString(),
      synced: isOnlineAndInitialized
    };
    
    // Ajouter à la file de synchronisation
    addToSyncQueue(observations[existingIndex], 'update');
  } else {
    // Ajouter une nouvelle observation
    const newObservation = {
      ...observation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: isOnlineAndInitialized
    };
    observations.push(newObservation);
    
    // Ajouter à la file de synchronisation
    addToSyncQueue(newObservation, 'create');
  }
  
  localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(observations));
}

// Récupérer toutes les observations locales
function getLocalObservations(): Observation[] {
  const data = localStorage.getItem(OBSERVATIONS_KEY);
  return data ? JSON.parse(data) : [];
}

// Récupérer toutes les observations (locales ou distantes selon la disponibilité)
export async function getObservations(): Promise<Observation[]> {
  // Si nous sommes en ligne et que Supabase est initialisé, essayer de récupérer les données à distance
  if (navigator.onLine && supabaseInitialized) {
    try {
      const remoteObservations = await fetchSupabaseObservations();
      
      // Si nous avons des observations à distance, les renvoyer
      if (remoteObservations.length > 0) {
        return remoteObservations;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des observations depuis Supabase:', error);
    }
  }
  
  // En cas d'échec ou hors ligne, renvoyer les observations locales
  return getLocalObservations();
}

// Récupérer une seule observation par ID
export async function getObservationById(id: string): Promise<Observation | undefined> {
  // Si nous sommes en ligne et que Supabase est initialisé, essayer de récupérer depuis la base de données
  if (navigator.onLine && supabaseInitialized) {
    try {
      const observations = await fetchSupabaseObservations();
      const observation = observations.find(o => o.id === id);
      
      if (observation) {
        return observation;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'observation depuis Supabase:', error);
    }
  }
  
  // En cas d'échec ou hors ligne, renvoyer l'observation locale
  const observations = getLocalObservations();
  return observations.find(o => o.id === id);
}

// Supprimer une observation
export function deleteObservation(id: string): void {
  const observations = getLocalObservations();
  const observationToDelete = observations.find(o => o.id === id);
  
  if (observationToDelete) {
    // Ajouter à la file de synchronisation avant suppression locale
    addToSyncQueue(observationToDelete, 'delete');
  }
  
  const updatedObservations = observations.filter(o => o.id !== id);
  localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(updatedObservations));
}

// Exporter les observations au format CSV
export function exportObservationsAsCSV(): string {
  const observations = getLocalObservations();
  
  if (observations.length === 0) {
    return '';
  }
  
  // Get all field IDs across all observations
  const allFieldIds = new Set<string>();
  observations.forEach(observation => {
    Object.keys(observation.fields).forEach(fieldId => {
      allFieldIds.add(fieldId);
    });
  });
  
  // Create header row
  const headerRow = ['id', 'createdAt', 'updatedAt', ...Array.from(allFieldIds)];
  
  // Create data rows
  const dataRows = observations.map(observation => {
    const row: string[] = [
      observation.id,
      observation.createdAt,
      observation.updatedAt
    ];
    
    // Add field values in the same order as the header
    for (let i = 3; i < headerRow.length; i++) {
      const fieldId = headerRow[i];
      const value = observation.fields[fieldId] || '';
      row.push(String(value));
    }
    
    return row;
  });
  
  // Combine header and data rows
  const allRows = [headerRow, ...dataRows];
  
  // Convert to CSV
  return allRows.map(row => row.map(cell => {
    // Escape quotes in cell values
    const escaped = String(cell).replace(/"/g, '""');
    // Wrap in quotes if cell contains commas, quotes, or newlines
    return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
  }).join(',')).join('\n');
}

// Déclencher une synchronisation manuelle
export async function triggerSync(): Promise<void> {
  if (navigator.onLine && supabaseInitialized) {
    await synchronizeQueue();
  }
}
