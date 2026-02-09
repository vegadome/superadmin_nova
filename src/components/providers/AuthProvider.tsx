'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { supabase } from '@/src/lib/supabase';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Initial check
    checkAuth();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, [checkAuth]);

  return <>{children}</>;
}