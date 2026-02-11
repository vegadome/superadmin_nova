import { PendingVerification } from '@/src/components/share/PendingVerification';
import { supabase } from '@/src/lib/supabase';
import { findNearbyMissions } from '@/src/services/missionService';
import { useMissionStore } from '@/src/store/useMissionStore';
import { useUserStore } from '@/src/store/useUserStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Bell, Briefcase, ChevronRight, Filter, Lock, MapPin } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CATEGORIES = ["Tout", "Hôpital", "Domicile", "MRS", "Urgences", "Pédiatrie"];

// --- COMPOSANT SKELETON ---
const MissionSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.missionHeader}>
      <View style={styles.skeletonIcon} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.skeletonLineShort} />
        <View style={styles.skeletonLineLong} />
      </View>
    </View>
    <View style={styles.skeletonFooter} />
  </View>
);

export default function HomeIndex() {
  const router = useRouter();
  const { profile, setProfile } = useUserStore();
  
  // États pour la photo de profil sécurisée
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);
  
  const verificationStatus = profile?.verification_status || 'pending';
  const isVerified = verificationStatus === 'verified';

  const { 
    userApplications, 
    fetchUserApplications,
    availableMissions,
    setAvailableMissions 
  } = useMissionStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [activeFilter, setActiveFilter] = useState("Tout");

  // --- LOGIQUE URL SIGNÉE (POUR BUCKET PRIVÉ) ---
  const getSignedAvatar = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 3600); // Valide 1 heure
      if (error) throw error;
      setSignedAvatarUrl(data.signedUrl);
    } catch (err) {
      console.error("Erreur récupération avatar signé:", err);
    }
  };

  useEffect(() => {
    if (profile?.avatar_url) {
      // Si c'est déjà une URL HTTP (pravatar), on l'utilise, sinon on signe le path
      if (profile.avatar_url.startsWith('http')) {
        setSignedAvatarUrl(profile.avatar_url);
      } else {
        getSignedAvatar(profile.avatar_url);
      }
    }
  }, [profile?.avatar_url]);

  // 1. ÉCOUTE DU CHANGEMENT DE STATUT ET PROFIL EN TEMPS RÉEL
  useEffect(() => {
    if (!profile?.id) return;

    const profileSubscription = supabase
      .channel(`profile_home_${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
        (payload) => {
          setProfile(payload.new as any);
          if ((payload.new as any).verification_status === 'verified' && verificationStatus !== 'verified') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Félicitations !", "Votre profil a été vérifié.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [profile?.id, verificationStatus]);

  // 2. CHARGEMENT INITIAL
  useEffect(() => {
    if (profile) initialLoad();
  }, [profile?.id, isVerified]);

  const loadData = async (coords: {latitude: number, longitude: number}) => {
    const radiusMeters = isVerified ? (profile?.intervention_radius || 30) * 1000 : 5000;
    try {
      const [missions] = await Promise.all([
        findNearbyMissions(coords.latitude, coords.longitude, radiusMeters),
        isVerified ? fetchUserApplications(profile?.id!) : Promise.resolve([])
      ]);
      setAvailableMissions(isVerified ? missions : missions.slice(0, 3));
    } catch (error) {
      console.error("Erreur chargement missions:", error);
    }
  };

  const initialLoad = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      let loc = await Location.getCurrentPositionAsync({});
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      await loadData(coords);
    } else {
      await useMissionStore.getState().fetchAvailableMissions();
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userLocation) {
      await loadData(userLocation);
    } else {
      await initialLoad();
    }
    setRefreshing(false);
  }, [profile, userLocation, isVerified]);

  const filteredMissions = useMemo(() => {
    if (activeFilter === "Tout") return availableMissions;
    const searchStr = activeFilter.toLowerCase();
    return availableMissions.filter(m => 
      m.specialty?.toLowerCase().includes(searchStr) || 
      m.facility_name?.toLowerCase().includes(searchStr)
    );
  }, [availableMissions, activeFilter]);

  const handleApply = async (missionId: string) => {
    if (!profile || !isVerified) return;
    setApplyingId(missionId);
    try {
      const { error } = await supabase
        .from('mission_applications')
        .insert([{ mission_id: missionId, nurse_id: profile.id }]);
      
      if (error) throw error;
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchUserApplications(profile.id);
      Alert.alert("Succès", "Votre candidature a été transmise.");
    } catch (e) {
      Alert.alert("Erreur", "Impossible de postuler.");
    } finally {
      setApplyingId(null);
    }
  };

  const navigateToDetails = (missionId: string) => {
    if (!isVerified) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Vérification requise", "Profil en cours d'examen.");
      return;
    }
    Haptics.selectionAsync();
    router.push({ pathname: '/share/facility-details', params: { missionId: missionId } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      >
        {/* HEADER - PHOTO MISE À JOUR ICI */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Pressable onPress={() => router.push('/profile')}>
              <Image 
                source={{ uri: signedAvatarUrl || 'https://i.pravatar.cc/150' }} 
                style={styles.avatar} 
              />
            </Pressable>
            <View>
              <Text style={styles.greetingText}>
                Infirmier {profile?.is_conventioned ? 'Conventionné' : 'Libéral'} 
              </Text>
              <Text style={styles.titleText}>{profile?.full_name?.split(' ')[0] || 'Praticien'}</Text>
            </View>
          </View>
          <Pressable style={styles.iconButton} onPress={() => router.push('/bookings')}>
            <Bell size={22} color="#1e293b" />
          </Pressable>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Rayon actif</Text>
            <Text style={styles.statValue}>{profile?.intervention_radius || 30} km</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#6366f1' }]}>
            <Text style={[styles.statLabel, { color: '#fff', opacity: 0.8 }]}>Tarif Horaire</Text>
            <Text style={[styles.statValue, { color: '#fff' }]}>{profile?.hourly_rate || 45}€/h</Text>
          </View>
        </View>

        {/* COMPOSANT DE VÉRIFICATION */}
        {!isVerified && (
          <Animated.View entering={FadeInDown} exiting={FadeOutUp}>
            <PendingVerification 
                userName={profile?.full_name?.split(' ')[0]} 
                status={verificationStatus as any}
                feedback={profile?.verification_feedback}
            />
            <Text style={styles.previewTitle}>Missions à proximité (Aperçu)</Text>
          </Animated.View>
        )}

        {/* FILTRES */}
        {isVerified && (
          <Animated.View entering={FadeInDown} style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <View style={styles.filterIconWrapper}><Filter size={16} color="#6366f1" /></View>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  onPress={() => { setActiveFilter(cat); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.filterChip, activeFilter === cat && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, activeFilter === cat && styles.filterTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* LISTE MISSIONS */}
        <View>
          {loading ? (
            <View>{[1, 2, 3].map(i => <MissionSkeleton key={i} />)}</View>
          ) : (
            <View>
              {filteredMissions.map((mission, index) => {
                const alreadyApplied = userApplications.includes(mission.id);
                return (
                  <Animated.View 
                    entering={FadeInDown.delay(index * 100)} 
                    key={mission.id} 
                    style={[
                        styles.missionCard, 
                        !isVerified && { opacity: 1 - index * 0.25, transform: [{ scale: 1 - index * 0.02 }] }
                    ]}
                  >
                    <Pressable onPress={() => navigateToDetails(mission.id)} disabled={!isVerified}>
                      <View style={styles.missionHeader}>
                        <View style={styles.facilityInfo}>
                          <View style={[styles.facilityIcon, !isVerified && { backgroundColor: '#f1f5f9' }]}>
                            {isVerified ? <Briefcase size={20} color="#6366f1" /> : <Lock size={20} color="#94a3b8" />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.facilityName, !isVerified && { color: '#94a3b8' }]}>
                                {isVerified ? mission.facility_name : "Établissement masqué"}
                            </Text>
                            <Text style={styles.specialtyTag}>{mission.specialty || 'Soins infirmiers'}</Text>
                          </View>
                        </View>
                        <View style={[styles.priceTag, !isVerified && { backgroundColor: '#f1f5f9' }]}>
                          <Text style={[styles.priceText, !isVerified && { color: '#94a3b8' }]}>{mission.hourly_rate}€/h</Text>
                        </View>
                      </View>
                      <View style={styles.detailsPreview}>
                        <View style={styles.previewItem}>
                          <MapPin size={14} color="#64748b" />
                          <Text style={styles.previewText}>
                            {isVerified ? (mission.address || 'Adresse disponible') : 'Localisation masquée'}
                          </Text>
                        </View>
                        {isVerified && <ChevronRight size={18} color="#cbd5e1" />}
                      </View>
                    </Pressable>

                    {isVerified && (
                      <TouchableOpacity 
                        onPress={() => alreadyApplied ? null : handleApply(mission.id)}
                        disabled={applyingId === mission.id || alreadyApplied}
                      >
                        <LinearGradient 
                          colors={alreadyApplied ? ['#10b981', '#059669'] : ['#6366f1', '#4f46e5']} 
                          style={styles.applyButton}
                          start={{x:0, y:0}} end={{x:1, y:0}}
                        >
                          <Text style={styles.applyButtonText}>
                            {alreadyApplied ? "Candidature envoyée" : "Postuler instantanément"}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                );
              })}

              {!isVerified && filteredMissions.length > 0 && (
                <LinearGradient
                  colors={['rgba(248,250,252,0)', 'rgba(248,250,252,1)', 'rgba(248,250,252,1)']}
                  style={styles.fomoOverlay}
                >
                  <TouchableOpacity style={styles.fomoButton} onPress={() => router.push('/profile')}>
                    <Text style={styles.fomoButtonText}>Débloquer les {availableMissions.length}+ missions</Text>
                  </TouchableOpacity>
                  <Text style={styles.fomoSubtext}>Validation de profil requise</Text>
                </LinearGradient>
              )}
            </View>
          )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingTop: Platform.OS === 'android' ? 45 : 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12, borderWidth: 2, borderColor: '#6366f1', backgroundColor: '#e2e8f0' },
  greetingText: { fontSize: 11, color: '#6366f1', fontWeight: '700', textTransform: 'uppercase' },
  titleText: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  iconButton: { padding: 12, backgroundColor: '#fff', borderRadius: 16, elevation: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 22, elevation: 2 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 4 },
  previewTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 20, marginBottom: 15, opacity: 0.6 },
  filterSection: { marginBottom: 25, marginHorizontal: -20 },
  filterScroll: { paddingHorizontal: 20 },
  filterIconWrapper: { backgroundColor: '#fff', padding: 12, borderRadius: 14, marginRight: 8, justifyContent: 'center' },
  filterChip: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginRight: 8, elevation: 2 },
  filterChipActive: { backgroundColor: '#6366f1' },
  filterText: { color: '#64748b', fontWeight: '700', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  missionCard: { backgroundColor: '#fff', borderRadius: 28, padding: 20, marginBottom: 16, elevation: 4 },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  facilityInfo: { flexDirection: 'row', gap: 12, flex: 1 },
  facilityIcon: { width: 46, height: 46, backgroundColor: '#eef2ff', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  facilityName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  specialtyTag: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  priceTag: { backgroundColor: '#f5f3ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  priceText: { color: '#4f46e5', fontWeight: '800', fontSize: 14 },
  detailsPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 12 },
  previewItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewText: { fontSize: 12, color: '#64748b' },
  applyButton: { paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 15 },
  applyButtonText: { color: '#fff', fontWeight: '700' },
  skeletonCard: { backgroundColor: '#fff', padding: 20, borderRadius: 28, marginBottom: 16, opacity: 0.6 },
  skeletonIcon: { width: 46, height: 46, backgroundColor: '#f1f5f9', borderRadius: 14, marginRight: 12 },
  skeletonLineShort: { width: '40%', height: 12, backgroundColor: '#f1f5f9', borderRadius: 6 },
  skeletonLineLong: { width: '70%', height: 12, backgroundColor: '#f1f5f9', borderRadius: 6 },
  skeletonFooter: { height: 35, backgroundColor: '#f8fafc', borderRadius: 12, marginTop: 15 },
  fomoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  fomoButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 22,
    elevation: 8,
  },
  fomoButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  fomoSubtext: { color: '#64748b', fontSize: 12, marginTop: 10, fontWeight: '600' }
});