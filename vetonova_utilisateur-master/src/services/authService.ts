import { supabase } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/useUserStore';

export const saveProfile = async (fullName: string, phone?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Utilisateur non connecté');

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: fullName,
    phone: phone || null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;

  // Mettre à jour le store
  useUserStore.getState().setProfile({
    id: user.id,
    full_name: fullName,
    phone,
    email: user.email,
  });

  return { success: true };
};