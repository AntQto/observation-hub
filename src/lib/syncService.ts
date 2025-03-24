
import { Observation } from './storage';
import { saveObservationToSupabase, deleteObservationFromSupabase } from './supabase';

// Queue de synchronisation stockée localement
const SYNC_QUEUE_KEY = 'sync_queue';

// États possibles des observations dans la file d'attente
export enum SyncStatus {
  PENDING = 'pending',  // En attente de synchronisation
  SYNCING = 'syncing',  // En cours de synchronisation
  SYNCED = 'synced',    // Synchronisé avec succès
  FAILED = 'failed'     // Échec de synchronisation
}

export interface SyncQueueItem {
  id: string;           // ID de l'observation
  observation: Observation;  // Données de l'observation
  action: 'create' | 'update' | 'delete';  // Type d'action
  timestamp: number;    // Horodatage de l'action
  status: SyncStatus;   // État de synchronisation
  retryCount: number;   // Nombre de tentatives
}

// Initialiser la file d'attente de synchronisation
export function initSyncQueue(): void {
  if (!localStorage.getItem(SYNC_QUEUE_KEY)) {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify([]));
  }
}

// Ajouter un élément à la file d'attente
export function addToSyncQueue(observation: Observation, action: 'create' | 'update' | 'delete'): void {
  const queue = getSyncQueue();
  
  // Vérifier si l'observation est déjà dans la file d'attente
  const existingIndex = queue.findIndex(item => item.id === observation.id);
  
  if (existingIndex >= 0) {
    // Mettre à jour l'élément existant
    queue[existingIndex] = {
      ...queue[existingIndex],
      observation,
      action,
      timestamp: Date.now(),
      status: SyncStatus.PENDING,
    };
  } else {
    // Ajouter un nouvel élément
    queue.push({
      id: observation.id,
      observation,
      action,
      timestamp: Date.now(),
      status: SyncStatus.PENDING,
      retryCount: 0
    });
  }
  
  // Enregistrer la file d'attente mise à jour
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  
  // Déclencher la synchronisation si nous sommes en ligne
  if (navigator.onLine) {
    synchronizeQueue();
  }
}

// Récupérer la file d'attente de synchronisation
export function getSyncQueue(): SyncQueueItem[] {
  const data = localStorage.getItem(SYNC_QUEUE_KEY);
  return data ? JSON.parse(data) : [];
}

// Mettre à jour le statut d'un élément de la file d'attente
function updateQueueItemStatus(id: string, status: SyncStatus, retryCount?: number): void {
  const queue = getSyncQueue();
  const itemIndex = queue.findIndex(item => item.id === id);
  
  if (itemIndex >= 0) {
    queue[itemIndex].status = status;
    if (retryCount !== undefined) {
      queue[itemIndex].retryCount = retryCount;
    }
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  }
}

// Supprimer un élément de la file d'attente
function removeFromQueue(id: string): void {
  const queue = getSyncQueue();
  const updatedQueue = queue.filter(item => item.id !== id);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
}

// Fonction pour synchroniser une observation avec Supabase
async function synchronizeWithServer(item: SyncQueueItem): Promise<boolean> {
  try {
    console.log(`Synchronisation de l'observation ${item.id} (${item.action})`);
    
    if (item.action === 'delete') {
      return await deleteObservationFromSupabase(item.id);
    } else {
      // Pour les créations et les mises à jour
      return await saveObservationToSupabase(item.observation);
    }
  } catch (error) {
    console.error("Erreur de synchronisation:", error);
    return false;
  }
}

// Synchroniser toute la file d'attente
export async function synchronizeQueue(): Promise<void> {
  const queue = getSyncQueue();
  let hasUpdates = false;
  
  // Ne procéder que si nous sommes en ligne
  if (!navigator.onLine) {
    console.log("Appareil hors ligne, synchronisation reportée");
    return;
  }
  
  // Traiter les éléments en attente
  for (const item of queue) {
    if (item.status === SyncStatus.PENDING || item.status === SyncStatus.FAILED) {
      updateQueueItemStatus(item.id, SyncStatus.SYNCING);
      
      const success = await synchronizeWithServer(item);
      
      if (success) {
        removeFromQueue(item.id);
        hasUpdates = true;
      } else {
        updateQueueItemStatus(item.id, SyncStatus.FAILED, item.retryCount + 1);
      }
    }
  }
  
  // Si des modifications ont été effectuées, déclencher un événement
  if (hasUpdates) {
    window.dispatchEvent(new CustomEvent('syncCompleted'));
  }
}

// Obtenir le nombre d'éléments en attente de synchronisation
export function getPendingSyncCount(): number {
  const queue = getSyncQueue();
  return queue.filter(item => item.status === SyncStatus.PENDING || item.status === SyncStatus.FAILED).length;
}
