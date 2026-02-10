import { supabase } from '@/src/lib/supabase';

export const userService = {
  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, is_nurse, facility_name, created_at, verification_status')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
  // Récupérer les infirmiers en attente
  getPendingNurses: async () => {
  console.log("Tentative de récupération des infirmiers...");
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*') // On demande tout temporairement pour tester
    .eq('is_nurse', true)
    .eq('verification_status', 'pending');

  if (error) {
    console.error("ERREUR SUPABASE :", error.message);
    throw error;
  }

  console.log("DONNÉES BRUTES REÇUES :", data);

  if (!data || data.length === 0) {
    console.warn("Aucun infirmier trouvé avec is_nurse=true et status=pending");
    return [];
  }

  // Reconstruction des URLs pour le bucket 'inami-cards'
  return data.map(nurse => {
    if (nurse.inami_card_path) {
      const { data: publicUrl } = supabase.storage
        .from('inami-cards') 
        .getPublicUrl(nurse.inami_card_path);
      return { ...nurse, visa_url: publicUrl.publicUrl };
    }
    return nurse;
  });
},

  // Valider ou Rejeter un profil
  updateVerificationStatus: async (userId: string, status: 'verified' | 'rejected', feedback?: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        verification_status: status,
        verification_feedback: feedback 
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  }
};