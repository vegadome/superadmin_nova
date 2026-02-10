import { supabase } from '@/src/lib/supabase';

export const userService = {
  getPendingNurses: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_nurse', true)
      .eq('verification_status', 'pending');

    if (error) throw error;
    if (!data) return [];

    // On transforme chaque nurse pour récupérer des URLs valides
    const nursesWithUrls = await Promise.all(data.map(async (nurse) => {
      const transformed = { ...nurse };

      // Fonction pour générer une URL signée
      const generateSign = async (bucket: string, path: string | null) => {
        if (!path) return null;
        // On s'assure d'avoir un chemin propre (sans l'URL complète si elle y est)
        const cleanPath = path.includes('http') ? path.split('/').slice(-2).join('/') : path;
        
        const { data: signedData } = await supabase.storage
          .from(bucket)
          .createSignedUrl(cleanPath, 3600); // Valide 1 heure
          
        return signedData?.signedUrl || null;
      };

      transformed.inami_url = await generateSign('inami-cards', nurse.inami_card_path);
      transformed.id_card_url = await generateSign('identity-checks', nurse.id_card_path);
      transformed.selfie_url = await generateSign('identity-checks', nurse.selfie_path);

      return transformed;
    }));

    return nursesWithUrls;
  },

  updateVerificationStatus: async (userId: string, status: 'verified' | 'rejected', feedback?: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        verification_status: status,
        verification_feedback: feedback || null,
        identity_verified: status === 'verified',
        inami_verified: status === 'verified',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  }
};