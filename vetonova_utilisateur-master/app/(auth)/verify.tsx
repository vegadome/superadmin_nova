import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Alert,
  Linking,
  Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase, extractAuthParamsFromUrl } from '@/src/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { useUserStore } from '@/src/store/useUserStore';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Vérification de votre email...');
  const { setProfile } = useUserStore();

  useEffect(() => {
    handleDeepLinkVerification();
    
    // Écouter les deep links entrants pendant que l'écran est ouvert
    const subscription = Linking.addEventListener('url', handleIncomingDeepLink);
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const handleIncomingDeepLink = async (event: { url: string }) => {
    console.log('Deep link entrant détecté:', event.url);
    await processDeepLink(event.url);
  };

  const handleDeepLinkVerification = async () => {
    try {
      console.log('Params reçus:', params);
      
      // 1. Vérifier s'il y a des paramètres dans l'URL (pour web ou deep link direct)
      if (params?.access_token || params?.refresh_token) {
        console.log('Tokens détectés dans les params');
        await processParamsAuth(params);
        return;
      }
      
      // 2. Vérifier s'il y a un deep link initial
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && (initialUrl.includes('access_token') || initialUrl.includes('refresh_token'))) {
        console.log('Deep link initial détecté:', initialUrl);
        await processDeepLink(initialUrl);
        return;
      }
      
      // 3. Vérifier la session existante (pour les retours à l'app)
      await checkExistingSession();
      
    } catch (error: any) {
      console.error('Erreur vérification:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const processDeepLink = async (url: string) => {
    try {
      setMessage('Traitement du lien de connexion...');
      
      const tokens = extractAuthParamsFromUrl(url);
      if (!tokens?.access_token || !tokens?.refresh_token) {
        throw new Error('Lien invalide - tokens manquants');
      }
      
      console.log('Tokens extraits du deep link');
      await setSessionFromTokens(tokens);
      
    } catch (error: any) {
      console.error('Erreur traitement deep link:', error);
      handleError(error);
    }
  };

  const processParamsAuth = async (params: any) => {
    try {
      setMessage('Authentification en cours...');
      
      const tokens = {
        access_token: params.access_token as string,
        refresh_token: params.refresh_token as string,
        token_type: params.token_type as string,
        expires_in: params.expires_in ? parseInt(params.expires_in as string) : undefined,
      };
      
      await setSessionFromTokens(tokens);
      
    } catch (error: any) {
      console.error('Erreur traitement params:', error);
      handleError(error);
    }
  };

  const setSessionFromTokens = async (tokens: any) => {
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    if (error) throw error;
    
    console.log('Session établie pour:', data.user?.email);
    
    // Créer ou mettre à jour le profil
    await handleUserProfile(data.user);
    
    setMessage('Connexion réussie ! Redirection...');
    
    // Petite pause pour afficher le message
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 1000);
  };

  const checkExistingSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('Erreur session:', error);
      setMessage('Session expirée. Veuillez vous reconnecter.');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
      return;
    }

    if (session?.user) {
      console.log('Session existante trouvée pour:', session.user.email);
      await handleUserProfile(session.user);
      setMessage('Connexion restaurée ! Redirection...');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } else {
      setMessage('Aucune session active. Redirection vers la connexion...');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    }
  };

  const handleUserProfile = async (user: any) => {
    if (!user) return;
    
    try {
      // Vérifier si le profil existe
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Profil existant
        setProfile(profile);
      } else {
        // Nouvel utilisateur - créer un profil minimal
        const newProfile = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(newProfile);

        if (!profileError) {
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Erreur profil:', error);
      // Continue même si le profil échoue
    }
  };

  const handleError = (error: any) => {
    const errorMessage = error.message || 'Le lien est peut-être expiré ou invalide.';
    setMessage(`Erreur: ${errorMessage}`);
    
    Alert.alert(
      'Erreur de connexion',
      errorMessage + '\n\nVeuillez réessayer.',
      [
        { 
          text: 'OK', 
          onPress: () => router.replace('/(auth)/login') 
        }
      ]
    );
  };

  // Méthode de secours pour le web
  const handleManualRedirect = () => {
    if (Platform.OS === 'web') {
      // Sur le web, on peut essayer de rediriger manuellement
      const currentUrl = window.location.href;
      if (currentUrl.includes('#access_token=')) {
        // Convertir l'URL hash en query params
        const hash = window.location.hash.substring(1);
        window.location.href = `/${window.location.pathname}?${hash}`;
      }
    }
  };

  return (
    <LinearGradient colors={['#0F2027', '#203A43']} style={styles.container}>
      <GlassCard style={styles.card}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.message}>{message}</Text>
        
        {Platform.OS === 'web' && (
          <Text style={styles.webHint}>
            Si la redirection ne fonctionne pas, essayez de rafraîchir la page.
          </Text>
        )}
        
        {loading && (
          <Text style={styles.hint}>
            Cette opération peut prendre quelques secondes...
          </Text>
        )}
      </GlassCard>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    padding: 30,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: 400,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    lineHeight: 22,
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  webHint: {
    color: '#4ECDC4',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 8,
  },
});