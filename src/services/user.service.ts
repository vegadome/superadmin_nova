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
    const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, inami_number, created_at, avatar_url, has_visa_permanent, visa_url, id_card_url')
    .eq('is_nurse', true)
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
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