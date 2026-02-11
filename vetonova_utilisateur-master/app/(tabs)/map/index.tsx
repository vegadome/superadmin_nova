import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Briefcase, ChevronRight, Filter, Lock, Target } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown } from 'react-native-reanimated';

// Services, Stores et Composants
import { PendingVerification } from '@/src/components/share/PendingVerification';
import { supabase } from '@/src/lib/supabase';
import { findNearbyMissions } from '@/src/services/missionService';
import { Mission, useMissionStore } from '@/src/store/useMissionStore';
import { useUserStore } from '@/src/store/useUserStore';
import { calculateDistance } from '@/src/utils/geoUtils';

const { width, height } = Dimensions.get('window');
const CATEGORIES = ["Tout", "Hôpital", "Domicile", "MRS", "Urgences", "Pédiatrie"];

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const tabBarHeight = useBottomTabBarHeight();
  
  const { profile, setProfile } = useUserStore();
  
  const verificationStatus = profile?.verification_status || 'pending';
  const isVerified = verificationStatus === 'verified';
  
  const { 
    availableMissions, 
    setAvailableMissions, 
    setActiveMission, 
    userApplications, 
    fetchUserApplications 
  } = useMissionStore();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showRecenter, setShowRecenter] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Tout");

  const radiusInKm = profile?.intervention_radius || 30;

  // 1. ÉCOUTE TEMPS RÉEL
  useEffect(() => {
    if (!profile?.id) return;

    const subscription = supabase
      .channel(`map_profile_check_${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
        (payload) => {
          setProfile(payload.new as any);
          if ((payload.new as any).verification_status === 'verified') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [profile?.id]);

  // 2. CHARGEMENT DES DONNÉES
  useEffect(() => {
    initMapData();
  }, [profile?.id, isVerified]);

  const initMapData = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    
    const current = await Location.getCurrentPositionAsync({});
    setLocation(current);

    if (profile?.id && isVerified) {
        await fetchUserApplications(profile.id);
    }
    
    const searchRadius = isVerified ? radiusInKm * 1000 : 5000;
    
    const data = await findNearbyMissions(
      current.coords.latitude, 
      current.coords.longitude, 
      searchRadius
    );
    
    if (data) {
        setAvailableMissions(isVerified ? data : data.slice(0, 5));
    }
  };

  const filteredMissions = useMemo(() => {
    return activeFilter === "Tout" ? availableMissions : availableMissions.filter(m => {
        const searchStr = activeFilter.toLowerCase();
        return m.specialty?.toLowerCase().includes(searchStr) || 
               m.facility_name?.toLowerCase().includes(searchStr);
    });
  }, [availableMissions, activeFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Tout: availableMissions.length };
    CATEGORIES.slice(1).forEach(cat => {
      const searchStr = cat.toLowerCase();
      counts[cat] = availableMissions.filter(m => 
        m.specialty?.toLowerCase().includes(searchStr) || 
        m.facility_name?.toLowerCase().includes(searchStr)
      ).length;
    });
    return counts;
  }, [availableMissions]);

  const handleApply = async (missionId: string) => {
    if (!isVerified || !profile) return;
    setApplyingId(missionId);
    try {
      const { error } = await supabase
        .from('mission_applications')
        .insert([{ mission_id: missionId, nurse_id: profile.id }]);
      if (error) throw error;
      await fetchUserApplications(profile.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de postuler.");
    } finally {
      setApplyingId(null);
    }
  };

  const handleMissionPress = (mission: Mission) => {
    if (!isVerified) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert("Profil en cours de validation", "Vous pourrez accéder aux détails des établissements dès que votre profil sera validé par nos équipes.");
        return;
    }
    setSelectedMission(mission);
    setActiveMission(mission); 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    mapRef.current?.animateToRegion({
      latitude: mission.lat - 0.005, 
      longitude: mission.lng,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    }, 400);
  };

  const handleMapPress = (e: any) => {
    if (e.nativeEvent.action !== 'marker-press' && selectedMission) {
      setSelectedMission(null);
    }
  };

  const recenterMap = () => {
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
      setShowRecenter(false);
    }
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          ref={mapRef}
          style={[styles.map, !isVerified && { opacity: 0.7 }]}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          scrollEnabled={isVerified}
          zoomEnabled={isVerified}
          pitchEnabled={false}
          rotateEnabled={false}
          showsMyLocationButton={false}
          onPress={handleMapPress}
          onRegionChangeComplete={() => isVerified && !selectedMission && setShowRecenter(true)}
          mapPadding={{ 
            top: 60, right: 10, left: 10, 
            bottom: selectedMission ? 340 + tabBarHeight : 100 + tabBarHeight 
          }}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Circle
            center={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            radius={isVerified ? radiusInKm * 1000 : 5000}
            strokeWidth={2}
            strokeColor="rgba(99, 102, 241, 0.3)"
            fillColor="rgba(99, 102, 241, 0.05)"
          />

          {filteredMissions.map((mission) => (
            <Marker
              key={mission.id}
              coordinate={{ latitude: mission.lat, longitude: mission.lng }}
              onPress={() => handleMissionPress(mission)}
              tracksViewChanges={false}
            >
              <View style={[styles.customMarker, selectedMission?.id === mission.id && styles.selectedMarker]}>
                <View style={[
                    styles.markerInner, 
                    selectedMission?.id === mission.id && styles.selectedMarkerInner, 
                    !isVerified && styles.lockedMarker
                ]}>
                  {isVerified ? (
                      <Briefcase size={18} color={selectedMission?.id === mission.id ? "#fff" : "#6366f1"} />
                  ) : (
                      <Lock size={16} color="#94a3b8" />
                  )}
                </View>
                <View style={[
                    styles.markerTriangle, 
                    selectedMission?.id === mission.id && styles.selectedTriangle, 
                    !isVerified && { borderBottomColor: '#f1f5f9' }
                ]} />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* OVERLAY DE VÉRIFICATION CORRIGÉ */}
      {!isVerified && (
        <View style={[styles.verificationOverlay, { paddingBottom: tabBarHeight }]} pointerEvents="box-none">
            <LinearGradient
                colors={['rgba(248,250,252,0)', 'rgba(248,250,252,0.8)', '#F8FAFC']}
                style={styles.mapGradient}
                pointerEvents="none"
            />
            <View style={styles.pendingContainer}>
                <PendingVerification 
                    userName={profile?.full_name?.split(' ')[0]} 
                    status={verificationStatus as any}
                    feedback={profile?.verification_feedback}
                />
            </View>
        </View>
      )}

      {/* FILTRES */}
      {isVerified && !selectedMission && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.topFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <View style={styles.filterIconWrapper}><Filter size={18} color="#6366f1" /></View>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat} 
                onPress={() => { setActiveFilter(cat); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.filterChip, activeFilter === cat && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, activeFilter === cat && styles.filterTextActive]}>{cat}</Text>
                <View style={[styles.countBadge, activeFilter === cat ? styles.countBadgeActive : styles.countBadgeInactive]}>
                    <Text style={[styles.countText, activeFilter === cat && styles.countTextActive]}>{categoryCounts[cat] || 0}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {isVerified && showRecenter && !selectedMission && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.recenterButton, { bottom: tabBarHeight + 110 }]}>
          <TouchableOpacity style={styles.recenterInner} onPress={recenterMap}>
            <Target size={20} color="#6366f1" />
            <Text style={styles.recenterText}>Ma position</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* CARTE DE DÉTAILS */}
      {isVerified && selectedMission && location && (
        <Animated.View 
          key={selectedMission.id} 
          entering={FadeInDown.duration(400).springify()} 
          exiting={FadeOutDown}
          style={[styles.missionCardContainer, { bottom: tabBarHeight + 20 }]}
        >
          <View style={styles.missionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.missionInfo}>
                <View style={styles.distanceBadge}>
                    <Text style={styles.distanceBadgeText}>
                      {(calculateDistance(location.coords.latitude, location.coords.longitude, selectedMission.lat, selectedMission.lng)/1000).toFixed(1)} km
                    </Text>
                </View>
                <Text style={styles.facilityName} numberOfLines={1}>{selectedMission.facility_name}</Text>
                <Text style={styles.missionType}>{selectedMission.specialty}</Text>
              </View>
              <TouchableOpacity 
                style={styles.detailsCircle}
                onPress={() => router.push({ pathname: "/share/facility-details", params: { missionId: selectedMission.id } })}
              >
                <ChevronRight size={24} color="#6366f1" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => handleApply(selectedMission.id)}
              disabled={applyingId === selectedMission.id || userApplications.includes(selectedMission.id)}
            >
              <LinearGradient 
                colors={userApplications.includes(selectedMission.id) ? ['#10b981', '#059669'] : ['#6366f1', '#4f46e5']} 
                style={styles.primaryAction}
                start={{x:0, y:0}} end={{x:1, y:0}}
              >
                {applyingId === selectedMission.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryActionText}>
                    {userApplications.includes(selectedMission.id) ? "Candidature envoyée" : `Postuler • ${selectedMission.hourly_rate}€/h`}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  map: { width: '100%', height: '100%' },
  mapGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  verificationOverlay: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    zIndex: 10001,
  },
  pendingContainer: { 
    width: '92%', 
    marginBottom: 20 // Un peu de marge au-dessus de la tab bar
  },
  topFilterContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: 0, right: 0, zIndex: 1000 },
  filterScroll: { paddingHorizontal: 20, alignItems: 'center', paddingBottom: 10 },
  filterIconWrapper: { backgroundColor: '#fff', padding: 12, borderRadius: 15, marginRight: 10, elevation: 4, shadowOpacity: 0.1 },
  filterChip: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 15, marginRight: 8, elevation: 4, shadowOpacity: 0.1 },
  filterChipActive: { backgroundColor: '#6366f1' },
  filterText: { color: '#64748b', fontWeight: '700', fontSize: 14, marginRight: 8 },
  filterTextActive: { color: '#fff' },
  countBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, minWidth: 20, alignItems: 'center' },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  countBadgeInactive: { backgroundColor: '#f1f5f9' },
  countText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  countTextActive: { color: '#fff' },
  customMarker: { alignItems: 'center' },
  markerInner: { backgroundColor: '#fff', padding: 10, borderRadius: 18, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5 },
  selectedMarkerInner: { backgroundColor: '#6366f1' },
  lockedMarker: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1' },
  markerTriangle: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#fff', transform: [{ rotate: '180deg' }], marginTop: -2 },
  selectedTriangle: { borderBottomColor: '#6366f1' },
  selectedMarker: { transform: [{ scale: 1.15 }] },
  missionCardContainer: { position: 'absolute', left: 16, right: 16, zIndex: 99999 },
  missionCard: { backgroundColor: '#fff', borderRadius: 32, padding: 24, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  missionInfo: { flex: 1 },
  distanceBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  distanceBadgeText: { color: '#3b82f6', fontSize: 11, fontWeight: '800' },
  facilityName: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  missionType: { fontSize: 14, color: '#6366f1', fontWeight: '600', marginTop: 2 },
  detailsCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },
  primaryAction: { height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  primaryActionText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  recenterButton: { position: 'absolute', alignSelf: 'center', zIndex: 999 },
  recenterInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, elevation: 8, shadowOpacity: 0.1 },
  recenterText: { marginLeft: 8, color: '#6366f1', fontWeight: '800', fontSize: 14 }
});