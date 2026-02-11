import { supabase } from "@/src/lib/supabase";

export const testMissionRPC = async (userLat: number, userLng: number, radiusKm: number) => {
  console.log(`--- 🧪 Test RPC : Rayon ${radiusKm}km ---`);
  
  try {
    const { data, error } = await supabase.rpc('get_nearby_missions', {
      user_lat: userLat,
      user_long: userLng,
      radius_meters: radiusKm * 1000, // Conversion en mètres pour PostGIS
    });

    if (error) {
      console.error("❌ Erreur RPC:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.warn("⚠️ Aucune mission trouvée dans ce rayon via le RPC.");
      return;
    }

    console.log(`✅ ${data.length} missions trouvées.`);
    
    // On analyse la première mission pour vérifier les champs
    const first = data[0];
    console.log("Détails de la première mission brute :");
    console.table({
      ID: first.id,
      Etablissement: first.facility_name,
      Spécialité: first.specialty || 'VIDE',
      Département: first.department || 'VIDE',
      Distance_Mètres: Math.round(first.dist_meters) + 'm'
    });

  } catch (err) {
    console.error("❌ Erreur inattendue:", err);
  }
};