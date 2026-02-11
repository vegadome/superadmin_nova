import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Calendar, Home, Map, User, Users } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { supabase } from '@/src/lib/supabase';
import { useMissionStore } from '@/src/store/useMissionStore';
import { useUserStore } from '@/src/store/useUserStore';

// 1. On définit la liste en dehors pour éviter les erreurs de scope
const MAIN_TABS = ['index', 'map/index', 'bookings', 'patients/index', 'profile'];

export default function TabLayout() {
  const { profile } = useUserStore();
  const fetchUserApplications = useMissionStore((state) => state.fetchUserApplications);

  useEffect(() => {
    if (!profile?.id) return;
    fetchUserApplications(profile.id);

    const channel = supabase
      .channel('sync-mission-apps')
      .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'mission_applications',
          filter: `nurse_id=eq.${profile.id}`,
        },
        () => fetchUserApplications(profile.id)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, 
      }}
      tabBar={(props) => {
        // 2. Filtrage intelligent des routes
        const visibleRoutes = props.state.routes.filter((route) => {
          const { options } = props.descriptors[route.key];
          
          // Masquer la carte si show_map est false
          if (route.name === 'map/index' && !profile?.show_map) return false;
          
          // Ne garder que les onglets principaux définis et ceux qui n'ont pas href: null
          return MAIN_TABS.includes(route.name) && options.href !== null;
        });

        return (
          <View style={styles.container}>
            <BlurView intensity={95} tint="extraLight" style={styles.blurContainer}>
              {visibleRoutes.map((route) => {
                const isFocused = props.state.index === props.state.routes.findIndex(r => r.key === route.key);

                const onPress = () => {
                  const event = props.navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    props.navigation.navigate(route.name);
                  }
                };

                const renderIcon = (color: string) => {
                  const size = 22;
                  switch (route.name) {
                    case 'index': return <Home size={size} color={color} />;
                    case 'map/index': return <Map size={size} color={color} />;
                    case 'patients/index': return <Users size={size} color={color} />;
                    case 'bookings': return <Calendar size={size} color={color} />;
                    case 'profile': return <User size={size} color={color} />;
                    default: return null;
                  }
                };

                return (
                  <Pressable 
                    key={route.key} 
                    onPress={onPress} 
                    style={[styles.tabItem, isFocused && styles.activeTab]}
                  >
                    {renderIcon(isFocused ? '#6366f1' : '#94a3b8')}
                  </Pressable>
                );
              })}
            </BlurView>
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen 
        name="map/index" 
        options={{
          href: profile?.show_map ? '/map/index' : null,
        } as any}
      />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="patients/index" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 30, left: 20, right: 20, alignItems: 'center' },
  blurContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 35,
    overflow: 'hidden',
    width: '100%',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  tabItem: { padding: 12, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  activeTab: { backgroundColor: 'rgba(99, 102, 241, 0.1)' }
});