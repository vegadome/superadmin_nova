import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { supabase } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/useUserStore';
import { STRIPE_API } from '@/src/constants/config';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { profile, setProfile } = useUserStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileData) setProfile(profileData);
      } else {
        setProfile(null);
      }
      setIsReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

 useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    // Si pas de profil et pas dans l'auth, on va au welcome
    if (!profile && !inAuthGroup) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (profile) {
      // Si profil incomplet -> Onboarding
      if (!profile.full_name) {
        const target = profile.is_nurse ? '/(auth)/onboarding-nurse' : '/(auth)/onboarding-facility';
        // ON VERIFIE SI ON N'Y EST PAS DEJA pour éviter le "double écran"
        if (segments[1] !== target.split('/').pop()) {
          router.replace(target);
        }
        return;
      }

      // Redirection vers les Tabs
      const currentLayout = segments[0];
      if (profile.is_nurse && currentLayout !== '(tabs)') {
        router.replace('/(tabs)');
      } else if (!profile.is_nurse && currentLayout !== '(facility-tabs)') {
        router.replace('/(facility-tabs)');
      }
    }
  }, [profile, segments, isReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StripeProvider publishableKey={STRIPE_API}>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(facility-tabs)" options={{ gestureEnabled: false }} />
            </Stack>
            <StatusBar style="dark" />
          </StripeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}