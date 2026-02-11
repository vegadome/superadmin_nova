import { supabase } from '@/src/lib/supabase';
import { useMissionStore } from '@/src/store/useMissionStore';
import { useUserStore } from '@/src/store/useUserStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function PatientsScreen() {
  const router = useRouter();
  const { profile } = useUserStore();
  
  const { 
    activeMission, 
    patientsInFacility, 
    fetchPatientsForMission, 
    endMission 
  } = useMissionStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 1. Vérifier si la candidature est acceptée dans la DB
  const checkAuthorization = async () => {
    if (!activeMission || !profile) {
      setIsAuthorized(false);
      setIsVerifying(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('mission_applications')
        .select('status')
        .eq('mission_id', activeMission.id)
        .eq('nurse_id', profile.id)
        .single();

      if (data && data.status === 'accepted') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (err) {
      console.error("Erreur vérification accès:", err);
      setIsAuthorized(false);
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. Charger les patients si autorisé
  const loadData = async () => {
    await checkAuthorization();
    
    if (activeMission?.requester_id && isAuthorized) {
      setIsLoading(true);
      try {
        await fetchPatientsForMission(activeMission.requester_id);
      } catch (error) {
        console.error("Erreur sync patients:", error);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [activeMission?.id, isAuthorized]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleConfirmEndMission = () => {
    const earnings = activeMission ? (activeMission.hourly_rate * 8).toFixed(2) : "0.00"; 
    const facilityName = activeMission?.facility_name;

    Alert.alert(
      "Terminer la vacation ?",
      "En validant, vous n'aurez plus accès aux dossiers médicaux.",
      [
        { text: "Continuer", style: "cancel" },
        { 
          text: "Terminer", 
          style: "destructive", 
          onPress: () => {
            endMission();
            router.push({
              pathname: "/booking/mission-summary",
              params: { 
                facility: facilityName,
                earnings: earnings,
                duration: "8h00"
              }
            }); 
          } 
        }
      ]
    );
  };

  const filteredPatients = useMemo(() => {
    return patientsInFacility.filter(p => 
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.niss?.includes(searchQuery)
    );
  }, [patientsInFacility, searchQuery]);

  // Écran de chargement initial / vérification
  if (isVerifying) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#6366f1" size="large" />
        <Text style={styles.loadingText}>Vérification des accès sécurisés...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6366f1']} />
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting} numberOfLines={1}>
              {isAuthorized ? activeMission?.facility_name : "Accès Restreint"}
            </Text>
            <Text style={styles.title}>Patients</Text>
          </View>
          
          {isAuthorized && activeMission && (
            <View style={styles.badgeActive}>
              <View style={styles.pulseDot} />
              <Text style={styles.badgeText}>{activeMission.department || 'Service'}</Text>
            </View>
          )}
        </View>

        {isAuthorized && activeMission ? (
          <>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un nom ou NISS..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#cbd5e1" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.statsRowGrid}>
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatValue}>{patientsInFacility.length}</Text>
                <Text style={styles.miniStatLabel}>Admis</Text>
              </View>
              <View style={styles.miniStatCard}>
                <Text style={[styles.miniStatValue, {color: '#6366f1'}]}>
                  {filteredPatients.length}
                </Text>
                <Text style={styles.miniStatLabel}>Résultats</Text>
              </View>
            </View>

            <View style={styles.listContainer}>
              {isLoading && !refreshing ? (
                <View style={styles.loadingState}>
                  <ActivityIndicator color="#6366f1" size="large" />
                  <Text style={styles.loadingText}>Chargement des dossiers...</Text>
                </View>
              ) : filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <TouchableOpacity 
                    key={patient.id} 
                    style={styles.patientCard}
                    onPress={() => router.push({
                      pathname: "/profile/history",
                      params: { patientId: patient.id }
                    })}
                  >
                    <View style={styles.avatarContainer}>
                       <LinearGradient colors={['#f1f5f9', '#e2e8f0']} style={styles.avatarGradient}>
                         <Ionicons name="person" size={24} color="#64748b" />
                       </LinearGradient>
                    </View>
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>{patient.last_name} {patient.first_name}</Text>
                      <View style={styles.nissRow}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={14} color="#94a3b8" />
                        <Text style={styles.nissText}>NISS: {patient.niss || 'Non renseigné'}</Text>
                      </View>
                    </View>
                    <View style={styles.actionSection}>
                      <View style={styles.viewBadge}>
                         <Text style={styles.viewBadgeText}>Dossier</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="account-search-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>Aucun résultat</Text>
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={styles.summaryCard} 
              onPress={handleConfirmEndMission}
            >
              <LinearGradient colors={['#ef4444', '#b91c1c']} style={styles.summaryGradient}>
                <View style={styles.summaryContent}>
                  <View style={styles.summaryTextSection}>
                    <Text style={styles.summaryTitle}>Fin de vacation</Text>
                    <Text style={styles.summaryDesc}>Terminer ma mission</Text>
                  </View>
                  <MaterialCommunityIcons name="logout" size={24} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noMissionState}>
            <View style={styles.noMissionIconBg}>
              <MaterialCommunityIcons name="shield-lock-outline" size={60} color="#6366f1" />
            </View>
            <Text style={styles.emptyTitle}>Accès Verrouillé</Text>
            <Text style={styles.emptyText}>
              {activeMission 
                ? "Votre candidature est en cours d'examen. Les dossiers patients seront accessibles dès que l'établissement aura validé votre profil."
                : "Le registre des patients est uniquement accessible durant une vacation acceptée et active."}
            </Text>
            <TouchableOpacity style={styles.goButton} onPress={() => router.push('/')}>
              <Text style={styles.goButtonText}>Voir mes missions</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { fontSize: 13, color: '#64748b', fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  badgeActive: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E0E7FF' },
  badgeText: { color: '#4338ca', fontWeight: '800', fontSize: 12 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, height: 50, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1e293b', fontWeight: '500' },
  statsRowGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  miniStatCard: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 18, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
  miniStatValue: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  miniStatLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  listContainer: { minHeight: 150 },
  patientCard: { backgroundColor: '#fff', borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  avatarContainer: { width: 52, height: 52, borderRadius: 16, overflow: 'hidden' },
  avatarGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  patientInfo: { flex: 1, marginLeft: 15 },
  patientName: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  nissRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  nissText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  actionSection: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewBadge: { backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  viewBadgeText: { color: '#6366f1', fontSize: 11, fontWeight: '700' },
  loadingState: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 15, color: '#64748b', fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' },
  noMissionState: { alignItems: 'center', padding: 30, marginTop: 40 },
  noMissionIconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  goButton: { marginTop: 25, backgroundColor: '#6366f1', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 16 },
  goButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  summaryCard: { marginTop: 30 },
  summaryGradient: { borderRadius: 24, padding: 20 },
  summaryContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTextSection: { flex: 1 },
  summaryTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  summaryDesc: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
});