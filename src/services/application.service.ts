import { supabase } from '@/src/lib/supabase';

export const applicationService = {
  // Récupérer les candidatures en attente avec détails mission et infirmier
  getPendingApplications: async () => {
    const { data, error } = await supabase
      .from('mission_applications')
      .select(`
        id,
        status,
        created_at,
        mission:mission_id ( facility_name, specialty, start_at ),
        nurse:nurse_id ( full_name, inami_number )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
};