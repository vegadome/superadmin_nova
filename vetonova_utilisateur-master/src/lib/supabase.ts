// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/src/constants/config';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

// Fonction pour obtenir l'URL de redirection correcte
export const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    // Pour le web
    return `${window.location.origin}/auth/callback`;
  }
  
  // Pour mobile - format attendu par Supabase
  // Note: Supabase s'attend à une URL complète, pas juste un scheme
  return 'vethome://auth/callback';
};

// Fonction pour créer une URL de deep link valide
export const createDeepLinkUrl = (path = 'auth/callback') => {
  // Format standard pour les deep links
  return `vethome://${path}`;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // IMPORTANT: Désactivé car on gère manuellement
    flowType: 'implicit', // Changé de 'pkce' à 'implicit' pour les mobile deep links
    debug: __DEV__,
  },
});

// Fonction pour extraire les paramètres d'authentification d'une URL
export const extractAuthParamsFromUrl = (url: string) => {
  try {
    console.log('🔗 Extraction des paramètres de:', url);
    
    // Gérer les URLs avec hash (#) ou query (?)
    let params: Record<string, string> = {};
    
    if (url.includes('#')) {
      // Format: scheme://...#access_token=xxx&refresh_token=yyy
      const hashPart = url.split('#')[1];
      const hashParams = new URLSearchParams(hashPart);
      hashParams.forEach((value, key) => {
        params[key] = value;
      });
    } else if (url.includes('?')) {
      // Format: scheme://...?access_token=xxx&refresh_token=yyy
      const queryPart = url.split('?')[1]?.split('#')[0];
      const queryParams = new URLSearchParams(queryPart);
      queryParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    console.log('📋 Paramètres extraits:', params);
    
    if (params.access_token && params.refresh_token) {
      return {
        access_token: params.access_token,
        refresh_token: params.refresh_token,
        expires_in: params.expires_in ? parseInt(params.expires_in) : undefined,
        token_type: params.token_type || 'bearer',
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erreur extraction params:', error);
    return null;
  }
};

// Fonction pour traiter un deep link d'authentification
export const handleAuthDeepLink = async (url: string) => {
  try {
    console.log('🔄 Traitement du deep link:', url);
    
    const authParams = extractAuthParamsFromUrl(url);
    
    if (authParams) {
      console.log('✅ Paramètres auth trouvés, mise à jour de la session...');
      
      const { data, error } = await supabase.auth.setSession({
        access_token: authParams.access_token,
        refresh_token: authParams.refresh_token,
      });
      
      if (error) {
        console.error('❌ Erreur setSession:', error);
        throw error;
      }
      
      console.log('🎉 Session mise à jour avec succès pour:', data.user?.email);
      return data;
    }
    
    console.log('⚠️  Aucun paramètre d\'auth trouvé dans l\'URL');
    return null;
    
  } catch (error) {
    console.error('❌ Erreur traitement deep link:', error);
    throw error;
  }
};

// Fonction pour vérifier si une URL peut être ouverte par l'app
export const canHandleUrl = (url: string) => {
  return url.startsWith('vethome://') || 
         url.includes('access_token') || 
         url.includes('refresh_token');
};

// Fonction utilitaire pour créer un lien de test
export const createTestAuthUrl = (token: string = 'test-token') => {
  return `vethome://auth/callback#access_token=${token}&refresh_token=${token}&expires_in=3600&token_type=bearer`;
};