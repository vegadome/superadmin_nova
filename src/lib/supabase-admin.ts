import { createClient } from '@supabase/supabase-js';

// UNIQUEMENT CÔTÉ SERVEUR (API Routes / Server Actions)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);