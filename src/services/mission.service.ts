import { supabase } from '@/src/lib/supabase';

export const missionService = {
  // Récupérer toutes les missions avec les infos du demandeur
  getAllMissions: async () => {
    const { data, error } = await supabase
      .from('missions')
      .select(`
        *,
        facilities ( name, type ),
        profiles:assigned_nurse_id ( full_name )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Annuler une mission (avec mise à jour du statut Stripe si nécessaire plus tard)
  cancelMission: async (missionId: string, paymentIntentId?: string) => {
    // 1. Si on a un ID Stripe, on déclenche le remboursement via l'Edge Function
    if (paymentIntentId) {
      const { data, error: edgeError } = await supabase.functions.invoke('refund-mission', {
        body: { missionId, paymentIntentId }
      });
      if (edgeError) throw new Error("Échec du remboursement Stripe");
    }

    // 2. On met à jour le statut en base de données
    const { error } = await supabase
      .from('missions')
      .update({ status: 'cancelled' })
      .eq('id', missionId);

    if (error) throw error;
    return true;
  },
  // Modifier le taux horaire ou la description
  updateMission: async (missionId: string, updates: any) => {
    const { error } = await supabase
      .from('missions')
      .update(updates)
      .eq('id', missionId);

    if (error) throw error;
    return true;
  }
};