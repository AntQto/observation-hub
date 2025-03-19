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

// Initialiser le stockage
export function initializeStorage(): void {
  if (!localStorage.getItem(OBSERVATIONS_KEY)) {
    localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify([]));
  }
  // Initialiser la file d'attente de synchronisation
  initSyncQueue();
}

// Enregistrer une observation
export function saveObservation(observation: Observation): void {
  const observations = getObservations();
  const existingIndex = observations.findIndex(o => o.id === observation.id);
  
  if (existingIndex >= 0) {
    // Mettre à jour l'observation existante
    observations[existingIndex] = {
      ...observation,
      updatedAt: new Date().toISOString(),
      synced: navigator.onLine
    };
    
    // Ajouter à la file de synchronisation si nous sommes hors ligne
    addToSyncQueue(observations[existingIndex], 'update');
  } else {
    // Ajouter une nouvelle observation
    const newObservation = {
      ...observation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: navigator.onLine
    };
    observations.push(newObservation);
    
    // Ajouter à la file de synchronisation si nous sommes hors ligne
    addToSyncQueue(newObservation, 'create');
  }
  
  localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(observations));
}

// Récupérer toutes les observations
export function getObservations(): Observation[] {
  const data = localStorage.getItem(OBSERVATIONS_KEY);
  return data ? JSON.parse(data) : [];
}

// Récupérer une seule observation par ID
export function getObservationById(id: string): Observation | undefined {
  const observations = getObservations();
  return observations.find(o => o.id === id);
}

// Supprimer une observation
export function deleteObservation(id: string): void {
  const observations = getObservations();
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
  const observations = getObservations();
  
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
export function triggerSync(): void {
  if (navigator.onLine) {
    synchronizeQueue();
  }
}
