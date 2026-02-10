'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/src/store/useAuthStore';
import { supabase } from '@/src/lib/supabase';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. On signale que le composant est monté côté client
    setMounted(true);

    // 2. Initial check
    checkAuth();

    // 3. Écoute des changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, [checkAuth]);

  // Tant que le composant n'est pas monté côté client, on évite de rendre
  // des éléments qui dépendent de l'état global pour éviter le mismatch.
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return <>{children}</>;
}