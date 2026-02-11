import { supabase } from '@/src/lib/supabase';
import { Mission } from '../store/useMissionStore';

/**
 * Recherche géographique via la fonction RPC Supabase
 */
export const findNearbyMissions = async (
  lat: number, 
  lng: number, 
  radiusMeters: number
): Promise<Mission[]> => {
  const { data, error } = await supabase.rpc('get_nearby_missions', {
    user_lat: lat,
    user_long: lng,
    radius_meters: radiusMeters
  });

  if (error) {
    console.error("❌ Erreur RPC missionService:", error.message);
    return [];
  }

  // Mappe les résultats pour s'assurer qu'ils matchent l'interface Mission
  return (data as Mission[]) || [];
};

/**
 * Récupère les détails complets d'une mission
 */
export async function getMissionDetails(missionId: string): Promise<Mission | null> {
  if (!missionId) return null;

  const { data, error } = await supabase
    .from('missions')
    .select(`
      *,
      requester:requester_id (
        id,
        facility_name,
        facility_type,
        address
      )
    `)
    .eq('id', missionId)
    .single();

  if (error || !data) {
    console.error("❌ Erreur getMissionDetails:", error?.message);
    return null;
  }
  
  return data as Mission;
}