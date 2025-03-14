
export interface Field {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[]; // For select fields
}

export interface Observation {
  id: string;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, any>;
}

// Predefined observation fields - in a real app you might want to make these configurable
export const observationFields: Field[] = [
  { id: 'title', name: 'Title', type: 'text' },
  { id: 'date', name: 'Date', type: 'date' },
  { id: 'location', name: 'Location', type: 'text' },
  { id: 'category', name: 'Category', type: 'select', options: ['Flora', 'Fauna', 'Weather', 'Other'] },
  { id: 'description', name: 'Description', type: 'text' },
  { id: 'quantity', name: 'Quantity', type: 'number' },
  { id: 'notes', name: 'Notes', type: 'text' }
];

// LocalStorage keys
const OBSERVATIONS_KEY = 'observations';

// Initial data
export function initializeStorage(): void {
  if (!localStorage.getItem(OBSERVATIONS_KEY)) {
    localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify([]));
  }
}

// Save an observation
export function saveObservation(observation: Observation): void {
  const observations = getObservations();
  const existingIndex = observations.findIndex(o => o.id === observation.id);
  
  if (existingIndex >= 0) {
    // Update existing observation
    observations[existingIndex] = {
      ...observation,
      updatedAt: new Date().toISOString()
    };
  } else {
    // Add new observation
    observations.push({
      ...observation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(observations));
}

// Get all observations
export function getObservations(): Observation[] {
  const data = localStorage.getItem(OBSERVATIONS_KEY);
  return data ? JSON.parse(data) : [];
}

// Get a single observation by ID
export function getObservationById(id: string): Observation | undefined {
  const observations = getObservations();
  return observations.find(o => o.id === id);
}

// Delete an observation
export function deleteObservation(id: string): void {
  const observations = getObservations();
  const updatedObservations = observations.filter(o => o.id !== id);
  localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(updatedObservations));
}

// Export observations as CSV
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
