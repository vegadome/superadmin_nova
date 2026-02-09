import { supabase } from '@/src/lib/supabase';

export const financeService = {
  // Récupérer les établissements et leurs commissions
  getFacilitiesCommissions: async () => {
    const { data, error } = await supabase
      .from('facilities')
      .select('id, name, type, commission_rate, is_verified')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Modifier le taux (ex: 0.12 pour 12%)
  updateCommissionRate: async (facilityId: string, newRate: number) => {
    const { error } = await supabase
      .from('facilities')
      .update({ commission_rate: newRate })
      .eq('id', facilityId);

    if (error) throw error;
    return true;
  }
};