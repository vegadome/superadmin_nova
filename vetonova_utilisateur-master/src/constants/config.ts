// Variables d'environnement Supabase
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';
export const MAPBOX_API = process.env.MAPBOX_ACCESS_TOKEN || '';
export const STRIPE_API = process.env.STRIPE_ACCESS_TOKEN || '';

// Vérifier que stripe est définit
if (!STRIPE_API) {
  console.warn(
    '⚠️ Variables Stripe non définies. ' +
    'Assure-toi d\'avoir STRIPE_ACCESS_TOKEN dans ton .env'
  );
}

// Vérifier que mapbox est définit
if (!MAPBOX_API) {
  console.warn(
    '⚠️ Variables MapBox non définies. ' +
    'Assure-toi d\'avoir MAPBOX_ACCESS_TOKEN dans ton .env'
  );
}

// Vérifier que les variables sont définies
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Variables Supabase non définies. ' +
    'Assure-toi d\'avoir EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans ton .env'
  );
}

// Configuration de l'application
export const APP_SCHEME = 'vethome';
export const APP_NAME = 'VetoHome';

// URLs de redirection pour l'authentification
export const getAuthRedirectUrl = () => {
  // En web
  if (typeof window !== 'undefined' && window?.location?.origin) {
    return `${window.location.origin}/auth/callback`;
  }
  
  // En développement Expo Go
  if (__DEV__) {
    // Essaie de détecter l'adresse IP locale
    return 'exp://127.0.0.1:8081/--/(auth)/verify';
  }
  
  // En production (builds iOS/Android)
  return `${APP_SCHEME}://(auth)/verify`;
};

// Fonction pour obtenir l'URL de base de redirection (sans le chemin)
export const getBaseRedirectUrl = () => {
  if (typeof window !== 'undefined' && window?.location?.origin) {
    return window.location.origin;
  }
  
  if (__DEV__) {
    return 'exp://127.0.0.1:8081';
  }
  
  return `${APP_SCHEME}://`;
};

// Fonction pour formater l'URL de redirection complète
export const getFormattedRedirectUrl = (path = '/(auth)/verify') => {
  const baseUrl = getBaseRedirectUrl();
  
  // Pour Expo Go, ajouter le préfixe --/
  if (baseUrl.includes('exp://') && !baseUrl.includes('--/')) {
    return `${baseUrl}/--${path}`;
  }
  
  return `${baseUrl}${path}`;
};