import * as Location from 'expo-location';
import { supabase } from '@/src/lib/supabase';
import { useEffect } from 'react';

export const useLocationTracking = (userId: string, isOnline: boolean) => {
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      // 1. Demander les permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // 2. S'abonner aux changements de position
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Mise à jour tous les 10 mètres pour économiser la batterie
          timeInterval: 5000,   // Ou toutes les 5 secondes
        },
        async (location) => {
          const { latitude, longitude } = location.coords;

          // 3. Envoyer à Supabase (Format PostGIS)
          const point = `POINT(${longitude} ${latitude})`;
          
          await supabase
            .from('profiles')
            .update({ last_location: point })
            .eq('id', userId);
            
          console.log("📍 Position mise à jour");
        }
      );
    };

    if (isOnline) {
      startTracking();
    } else {
      subscription?.remove();
    }

    return () => subscription?.remove();
  }, [isOnline, userId]);
};