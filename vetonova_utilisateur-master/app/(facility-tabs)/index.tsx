import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Dimensions, Alert, Linking, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { calculateDistance } from '@/src/utils/geoUtils';
import { BillingModal } from '@/src/components/vet/billing/BillingModal';
import { View as MotiView, AnimatePresence } from 'moti';
import { supabase } from '@/src/lib/supabase';
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

export default function VetMissionsMap() {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [availableMissions, setAvailableMissions] = useState<any[]>([]);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [missionStatus, setMissionStatus] = useState<'idle' | 'en_route' | 'arrived'>('idle');
  const [showBilling, setShowBilling] = useState(false);
  const [vetProfile, setVetProfile] = useState<any>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '45%', '60%'], []);


  // --- 1. PERMISSIONS & NOTIFS ---
  useEffect(() => {
    (async () => {
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      const { status: geoStatus } = await Location.requestForegroundPermissionsAsync();
      if (notifStatus !== 'granted' || geoStatus !== 'granted') {
        Alert.alert("Autorisations requises", "La géolocalisation et les notifications sont nécessaires.");
      }
    })();
  }, []);

  // --- 2. GESTION DU STATUT ONLINE/OFFLINE (NETTOYAGE) ---
  useEffect(() => {
    const updateStatus = async (online: boolean) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          is_online: online,
          last_seen: new Date().toISOString(),
        }).eq('id', user.id);
      }
    };

    updateStatus(isOnline);

    // CLEANUP : Si le vétérinaire quitte l'écran ou ferme l'app
    return () => {
      updateStatus(false);
    };
  }, [isOnline]);

  // --- 3. TRACKING TEMPS RÉEL ---
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    const startTracking = async () => {
      locationSubscription = await Location.watchPositionAsync(
        { 
          accuracy: Location.Accuracy.Balanced, 
          distanceInterval: 30, 
          timeInterval: 20000 
        },
        async (newLocation) => {
          setLocation(newLocation);

          if (isOnline) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('profiles').update({
                last_lat: newLocation.coords.latitude,
                last_lng: newLocation.coords.longitude,
                last_seen: new Date().toISOString(), // Heartbeat pour le client
              }).eq('id', user.id);
            }
          }
        }
      );
    };

    startTracking();
    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [isOnline]);

  // --- 4. ÉCOUTE DES NOUVELLES MISSIONS ---
  useEffect(() => {
    if (!isOnline) {
      setAvailableMissions([]);
      Notifications.setBadgeCountAsync(0);
      return;
    }

    const channel = supabase
      .channel('pending-missions')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'appointments', 
        filter: 'status=eq.pending' 
      },
        async (payload) => {
          setAvailableMissions((current) => [...current, payload.new]);
          Notifications.setBadgeCountAsync(availableMissions.length + 1);
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "🐾 Nouvelle mission !",
              body: `${payload.new.service_type} à ${payload.new.address_name || 'proximité'}`,
              sound: 'default',
            },
            trigger: null,
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOnline, availableMissions.length]);

  // --- 5. NAVIGATION & ACTIONS ---
  // (Garder tes fonctions openNavigation, handleMainAction, finalizeMission telles quelles)
  const openNavigation = () => {
    if (!selectedMission) return;
    const lat = selectedMission.latitude;
    const lng = selectedMission.longitude;
    const label = encodeURIComponent(selectedMission.address_name || "Mission Vétérinaire");
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`
    });
    if (url) Linking.openURL(url);
  };

  const distanceToTarget = useMemo(() => {
    if (!location || !selectedMission || missionStatus === 'idle') return null;
    return calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      selectedMission.latitude || 48.8600,
      selectedMission.longitude || 2.3400
    );
  }, [location, selectedMission, missionStatus]);

  const handleMainAction = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (missionStatus === 'idle') {
      setMissionStatus('en_route');
      await updateMissionInSupabase('accepted');
      openNavigation();
    } 
    else if (missionStatus === 'en_route') {
      if (distanceToTarget && distanceToTarget <= 200) {
        setMissionStatus('arrived');
        await updateMissionInSupabase('arrived', { arrived_at: new Date().toISOString() });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Pas encore arrivé", `Vous êtes à ${Math.round(distanceToTarget || 0)}m.`);
      }
    }
    else if (missionStatus === 'arrived') {
      setShowBilling(true);
    }
  };

  const updateMissionInSupabase = async (status: string, extraData = {}) => {
    if (!selectedMission?.id) return;
    await supabase.from('appointments').update({ status, ...extraData }).eq('id', selectedMission.id);
  };

  const finalizeMission = async (finalPrice: number) => {
    try {
      await updateMissionInSupabase('completed', { final_price: finalPrice, completed_at: new Date().toISOString() });
      await supabase.from('medical_records').insert([{
          pet_id: selectedMission.pet_id,
          vet_id: selectedMission.vet_id,
          appointment_id: selectedMission.id,
          record_type: 'consultation',
          diagnosis: 'À compléter...',
          treatment: 'À compléter...',
      }]);
      setShowBilling(false);
      setMissionStatus('idle');
      setAvailableMissions(prev => prev.filter(m => m.id !== selectedMission.id));
      setSelectedMission(null);
      bottomSheetRef.current?.close();
      Alert.alert("Succès", "Mission clôturée.");
    } catch (e) {
      Alert.alert("Erreur", "Problème lors de la clôture.");
    }
  };

  // --- 6. FETCH PROFILE VETERINAIRE ---
  useEffect(() => {
    fetchVetProfile();
  }, []);

  const fetchVetProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setVetProfile(data);
    }
  };
  // Logique pour savoir si on applique le tarif weekend
  const isItWeekend = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6; // 0 = Dimanche, 6 = Samedi
  }, []);

  // Calcul du prix affiché dans le BottomSheet
  const displayPrice = useMemo(() => {
    if (!selectedMission) return 0;
    const base = selectedMission.price_estimate || 0;
    const surcharge = isItWeekend ? (vetProfile?.service_prices?.weekend_surcharge || 0) : 0;
    return parseInt(base) + parseInt(surcharge);
  }, [selectedMission, vetProfile, isItWeekend]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <AnimatePresence exitBeforeEnter>
          {showBilling ? (
            <MotiView key="billing" from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={StyleSheet.absoluteFill}>
              <BillingModal mission={selectedMission} onComplete={finalizeMission} />
            </MotiView>
          ) : (
            <MotiView key="map" from={{ opacity: 0 }} animate={{ opacity: 1 }} style={StyleSheet.absoluteFill}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={{
                  latitude: location?.coords.latitude || 48.8566,
                  longitude: location?.coords.longitude || 2.3522,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                showsUserLocation
                showsMyLocationButton={false}
              >
                {isOnline && missionStatus === 'idle' && availableMissions.map((m) => (
                  <Marker key={m.id} coordinate={{ latitude: m.latitude, longitude: m.longitude }}
                    onPress={() => { setSelectedMission(m); bottomSheetRef.current?.expand(); }}>
                    <View style={styles.markerContainer}>
                      <View style={styles.markerPulse} />
                      <View style={styles.markerPoint}><Ionicons name="medical" size={16} color="white" /></View>
                    </View>
                  </Marker>
                ))}
              </MapView>

              <BlurView intensity={90} tint="light" style={styles.header}>
                <View style={styles.statusRow}>
                  <View>
                    <Text style={styles.greeting}>Dr. Martin</Text>
                    <Text style={[styles.statusText, { color: isOnline ? '#10b981' : '#ef4444' }]}>
                      {isOnline ? '● En ligne' : '○ Hors ligne'}
                    </Text>
                  </View>
                  <Switch trackColor={{ false: '#cbd5e1', true: '#10b981' }} thumbColor={'#fff'}
                    onValueChange={() => setIsOnline(!isOnline)} value={isOnline} />
                </View>
              </BlurView>

              <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} 
                enablePanDownToClose={missionStatus === 'idle'} backgroundStyle={styles.sheetBackground}>
                <BottomSheetView style={styles.sheetContent}>
                  {selectedMission ? (
                    <>
                      <View style={styles.sheetHeader}>
                        <Text style={styles.missionPrice}>{displayPrice}€</Text>
                        {isItWeekend && <Text style={{color: '#6366f1', fontWeight: '700', fontSize: 12}}>(Inclus majoration weekend)</Text>}
                        <View style={[styles.tag, missionStatus !== 'idle' && styles.tagActive]}>
                          <Text style={[styles.tagText, missionStatus !== 'idle' && styles.tagTextActive]}>
                            {missionStatus === 'idle' ? 'NOUVEAU' : 'EN MISSION'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.petName}>{selectedMission.service_type}</Text>
                      
                      <TouchableOpacity style={styles.addressBox} onPress={openNavigation}>
                        <Ionicons name="navigate-circle" size={24} color="#6366f1" />
                        <Text style={styles.addressText} numberOfLines={2}>{selectedMission.address_name}</Text>
                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.acceptButton, 
                          missionStatus === 'en_route' && (distanceToTarget && distanceToTarget > 200 ? styles.disabledButton : styles.arrivalButton),
                          missionStatus === 'arrived' && styles.startServiceButton
                        ]} onPress={handleMainAction}>
                        <Text style={styles.acceptButtonText}>
                          {missionStatus === 'idle' && "ACCEPTER & NAVIGUER"}
                          {missionStatus === 'en_route' && (distanceToTarget && distanceToTarget <= 200 ? "CONFIRMER L'ARRIVÉE" : `EN ROUTE (${Math.round(distanceToTarget || 0)}m)`)}
                          {missionStatus === 'arrived' && "TERMINER L'INTERVENTION"}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.emptySheetText}>En attente de nouvelles demandes...</Text>
                  )}
                </BottomSheetView>
              </BottomSheet>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </GestureHandlerRootView>
  );
}

// Les styles restent identiques à ton code initial, avec l'ajout de styles pour addressBox si besoin
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  map: { width: width, height: height },
  header: { position: 'absolute', top: 60, left: 20, right: 20, padding: 16, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  statusText: { fontSize: 13, fontWeight: '600' },
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerPoint: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  markerPulse: { position: 'absolute', width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  sheetBackground: { borderRadius: 35, backgroundColor: '#fff' },
  sheetContent: { padding: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  missionPrice: { fontSize: 32, fontWeight: '900', color: '#1e293b' },
  tag: { backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  tagText: { color: '#10b981', fontSize: 12, fontWeight: '800' },
  tagActive: { backgroundColor: '#1e293b' },
  tagTextActive: { color: '#fff' },
  petName: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  addressBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  addressText: { color: '#475569', flex: 1, fontSize: 14, fontWeight: '600' },
  acceptButton: { backgroundColor: '#10b981', height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  disabledButton: { backgroundColor: '#94a3b8' },
  arrivalButton: { backgroundColor: '#f59e0b' },
  startServiceButton: { backgroundColor: '#6366f1' },
  acceptButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  emptySheetText: { textAlign: 'center', color: '#94a3b8', marginTop: 30 }
});