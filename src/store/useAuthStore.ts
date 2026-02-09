import { create } from 'zustand';
import { supabase } from '@/src/lib/supabase';

interface AuthState {
  isAdmin: boolean;
  profile: any | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAdmin: false,
  profile: null,
  loading: true,

  checkAuth: async () => {
    set({ loading: true });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      set({ 
        profile, 
        isAdmin: profile?.role === 'admin', 
        loading: false 
      });
    } else {
      set({ profile: null, isAdmin: false, loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null, isAdmin: false });
  }
}));