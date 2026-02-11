import { supabase } from '@/src/lib/supabase';
import { useMissionStore } from '@/src/store/useMissionStore';
import { useUserStore } from '@/src/store/useUserStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function FacilityDetailsScreen() {
  const router = useRouter();
  const { missionId } = useLocalSearchParams(); 
  const { profile } = useUserStore();
  
  const tabBarHeight = useBottomTabBarHeight();
  
  const { availableMissions, setActiveMission, userApplications, fetchUserApplications } = useMissionStore();
  
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const mission = availableMissions.find(m => m.id === missionId);
  const isAlreadyApplied = userApplications.includes(missionId as string);

  useEffect(() => {
    if (mission) {
      setActiveMission(mission);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [missionId, mission]);

  const handleApply = async () => {
    if (!profile) return Alert.alert("Erreur", "Connectez-vous pour postuler.");
    setApplying(true);
    try {
      const { error } = await supabase
        .from('mission_applications')
        .insert([{ mission_id: missionId, nurse_id: profile.id }]);
      if (error) throw error;
      await fetchUserApplications(profile.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès", "Votre candidature a été envoyée !");
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'envoyer la candidature.");
    } finally {
      setApplying(false);
    }
  };

  const handleCancelApplication = async () => {
    if (!profile || !missionId) return;

    Alert.alert(
      "Annuler la candidature",
      "Êtes-vous sûr de vouloir retirer votre candidature pour cette mission ?",
      [
        { text: "Garder ma place", style: "cancel" },
        { 
          text: "Oui, annuler", 
          style: "destructive",
          onPress: async () => {
            setApplying(true);
            try {
              const { error } = await supabase
                .from('mission_applications')
                .delete()
                .eq('mission_id', missionId)
                .eq('nurse_id', profile.id);
              
              if (error) throw error;
              await fetchUserApplications(profile.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (e) {
              Alert.alert("Erreur", "Impossible d'annuler la candidature.");
            } finally {
              setApplying(false);
            }
          }
        }
      ]
    );
  };

  const handleOpenMaps = () => {
    if (mission?.lat && mission?.lng) {
      const label = encodeURIComponent(mission.facility_name);
      const url = Platform.OS === 'ios' 
        ? `maps://app?daddr=${mission.lat},${mission.lng}&q=${label}`
        : `google.navigation:q=${mission.lat},${mission.lng}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!mission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Mission introuvable.</Text>
        <TouchableOpacity style={styles.backBtnLink} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalEstimated = (mission.hourly_rate || 0) * (mission.estimated_duration_hours || 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 140 }]}
      >
        <View style={styles.headerNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View style={[styles.badgeStatus, isAlreadyApplied && { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.badgeText, isAlreadyApplied && { color: '#16a34a' }]}>
              {isAlreadyApplied ? 'Candidature envoyée' : 'Disponible'}
            </Text>
          </View>
        </View>

        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name={mission.facility_type === 'Hôpital' ? 'hospital-building' : 'home-heart'} 
                size={50} 
                color="#6366f1" 
              />
          </View>
          <Text style={styles.facilityName}>{mission.facility_name}</Text>
          <View style={styles.tagContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>{mission.department || 'Service Général'}</Text></View>
            <View style={[styles.tag, { backgroundColor: '#eef2ff' }]}><Text style={[styles.tagText, { color: '#6366f1' }]}>{mission.specialty}</Text></View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Ionicons name="hourglass-outline" size={20} color="#64748b" />
            <Text style={styles.infoCardTitle}>Durée</Text>
            <Text style={styles.infoCardValue}>{mission.estimated_duration_hours || 0}h</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="wallet-outline" size={20} color="#64748b" />
            <Text style={styles.infoCardTitle}>Taux</Text>
            <Text style={styles.infoCardValue}>{mission.hourly_rate}€/h</Text>
          </View>
          <TouchableOpacity style={styles.infoCard} onPress={handleOpenMaps}>
            <Ionicons name="navigate-circle-outline" size={20} color="#6366f1" />
            <Text style={[styles.infoCardTitle, { color: '#6366f1' }]}>Trajet</Text>
            <Text style={styles.infoCardValue}>
              {mission.dist_meters ? (mission.dist_meters / 1000).toFixed(1) : '---'} km
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horaires du shift</Text>
          <View style={styles.detailBox}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#6366f1" />
              <Text style={styles.detailText}>
                {mission.scheduled_at ? format(new Date(mission.scheduled_at), "EEEE d MMMM", { locale: fr }) : 'Date à définir'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#6366f1" />
              <Text style={styles.detailText}>
                Début : {mission.scheduled_at ? format(new Date(mission.scheduled_at), "HH:mm") : '--:--'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>
              {mission.description_service || "Aucune consigne particulière spécifiée."}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <TouchableOpacity style={styles.addressBox} onPress={handleOpenMaps}>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressText} numberOfLines={2}>
                {mission.address || "Adresse non spécifiée"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* FOOTER FIXE */}
      <View style={[
        styles.footer, 
        { 
          height: isAlreadyApplied ? 110 + tabBarHeight : 80 + tabBarHeight,
          paddingBottom: tabBarHeight 
        }
      ]}>
        <View style={styles.footerContent}>
          <View style={styles.footerPrice}>
            <Text style={styles.footerLabel}>Total estimé (Brut)</Text>
            <Text style={styles.totalPrice}>{totalEstimated.toFixed(2)}€</Text>
          </View>
          
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={[
                styles.applyBtn, 
                isAlreadyApplied && styles.appliedBtn
              ]} 
              onPress={isAlreadyApplied ? undefined : handleApply}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  {isAlreadyApplied && <Ionicons name="checkmark-circle" size={20} color="#fff" style={{marginRight: 8}} />}
                  <Text style={styles.applyBtnText}>
                    {isAlreadyApplied ? 'Postulé' : 'Postuler'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Le lien d'annulation s'affiche maintenant au-dessus de la TabBar */}
            {isAlreadyApplied && !applying && (
              <TouchableOpacity 
                style={styles.cancelLink} 
                onPress={handleCancelApplication}
              >
                <Text style={styles.cancelLinkText}>Annuler ma candidature</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scrollContent: { paddingTop: 20 },
  headerNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 10 : 40,
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
  },
  badgeStatus: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#64748b', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  heroSection: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 20, marginBottom: 30 },
  iconContainer: {
    width: 100, height: 100, borderRadius: 30, backgroundColor: '#f5f3ff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16
  },
  facilityName: { fontSize: 24, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 12 },
  tagContainer: { flexDirection: 'row', gap: 8 },
  tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  infoRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 32 },
  infoCard: {
    flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9'
  },
  infoCardTitle: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  infoCardValue: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginTop: 2 },
  section: { paddingHorizontal: 24, marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  detailBox: { 
    backgroundColor: '#fff', borderRadius: 20, padding: 16, 
    borderWidth: 1, borderColor: '#f1f5f9', gap: 12, 
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailText: { fontSize: 15, color: '#334155', fontWeight: '500', textTransform: 'capitalize' },
  descriptionBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: '#6366f1' },
  descriptionText: { fontSize: 15, color: '#475569', lineHeight: 24 },
  addressBox: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', 
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' 
  },
  addressText: { fontSize: 14, color: '#475569', lineHeight: 20 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 20,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center', // Aligne le prix avec le bouton principal
    justifyContent: 'space-between',
  },
  footerPrice: {
    flex: 1,
  },
  footerLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  totalPrice: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  actionContainer: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    backgroundColor: '#6366f1',
    width: '100%',
    height: 52, // Un peu plus compact pour laisser de la place
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appliedBtn: {
    backgroundColor: '#10b981',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelLink: {
    marginTop: 8,
    paddingVertical: 4,
    width: '100%',
    alignItems: 'center',
  },
  cancelLinkText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  errorText: { color: '#64748b', marginBottom: 10 },
  backBtnLink: { padding: 10 },
  backBtnText: { color: '#6366f1', fontWeight: '700' }
});