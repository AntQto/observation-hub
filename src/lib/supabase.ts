
import { createClient } from '@supabase/supabase-js';
import type { Observation } from './storage';

// Créer un client Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérifier si les clés d'API sont définies
if (!supabaseUrl || !supabaseKey) {
  console.error('Les variables d\'environnement Supabase ne sont pas définies');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

// Fonction pour initialiser la table des observations si nécessaire
export async function initSupabase() {
  // Cette fonction pourrait être utilisée pour vérifier et initialiser la structure de la base de données
  // Pour l'instant, nous allons nous contenter de vérifier si nous pouvons nous connecter
  try {
    const { data, error } = await supabase.from('observations').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.error('Erreur lors de l\'initialisation de Supabase:', error);
    }
    return !error;
  } catch (err) {
    console.error('Erreur lors de la connexion à Supabase:', err);
    return false;
  }
}

// Récupérer toutes les observations depuis Supabase
export async function fetchObservations(): Promise<Observation[]> {
  const { data, error } = await supabase
    .from('observations')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Erreur lors de la récupération des observations:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    fields: JSON.parse(item.fields || '{}'),
    location: item.location ? {
      latitude: item.location.latitude,
      longitude: item.location.longitude,
      accuracy: item.location.accuracy
    } : undefined,
    deviceTimestamp: item.deviceTimestamp,
    synced: true
  }));
}

// Ajouter ou mettre à jour une observation dans Supabase
export async function saveObservationToSupabase(observation: Observation): Promise<boolean> {
  // Préparer les données pour Supabase
  const supabaseData = {
    id: observation.id,
    createdAt: observation.createdAt,
    updatedAt: observation.updatedAt,
    fields: JSON.stringify(observation.fields),
    location: observation.location,
    deviceTimestamp: observation.deviceTimestamp
  };

  // Vérifier si l'observation existe déjà
  const { data: existingData, error: checkError } = await supabase
    .from('observations')
    .select('id')
    .eq('id', observation.id)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Erreur lors de la vérification de l\'observation:', checkError);
    return false;
  }

  // Insérer ou mettre à jour selon le cas
  let result;
  if (!existingData) {
    // Créer une nouvelle observation
    result = await supabase
      .from('observations')
      .insert(supabaseData);
  } else {
    // Mettre à jour une observation existante
    result = await supabase
      .from('observations')
      .update(supabaseData)
      .eq('id', observation.id);
  }

  if (result.error) {
    console.error('Erreur lors de la sauvegarde de l\'observation:', result.error);
    return false;
  }

  return true;
}

// Supprimer une observation dans Supabase
export async function deleteObservationFromSupabase(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('observations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur lors de la suppression de l\'observation:', error);
    return false;
  }

  return true;
}
