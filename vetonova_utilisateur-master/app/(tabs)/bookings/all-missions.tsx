import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/useUserStore';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, CheckCircle2, Timer, Archive, Filter, FileText, Download } from 'lucide-react-native';

export default function BookingsAllMission() {
  const router = useRouter();
  const { profile } = useUserStore();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // État pour le filtre par mois (Format: "YYYY-MM")
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchMyBookings();
  }, [profile]);

  const fetchMyBookings = async () => {
    if (!profile) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('mission_applications')
      .select(`
        id,
        status,
        created_at,
        missions (
          id,
          facility_name,
          specialty,
          hourly_rate,
          status,
          start_at,
          end_at
        )
      `)
      .eq('nurse_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) setApplications(data);
    setLoading(false);
  };

  // Logique de filtrage
  const confirmedMissions = applications.filter(app => app.status === 'accepted' && app.missions.status !== 'completed');
  const pendingMissions = applications.filter(app => app.status === 'pending');
  
  const completedMissions = useMemo(() => {
    return applications.filter(app => {
      const isDone = app.missions.status === 'completed' || app.status === 'completed';
      const missionMonth = app.missions.start_at?.slice(0, 7);
      return isDone && (!selectedMonth || missionMonth === selectedMonth);
    });
  }, [applications, selectedMonth]);

  // Calcul du total des gains pour le mois sélectionné
  const monthlyEarnings = useMemo(() => {
    return completedMissions.reduce((acc, app) => acc + (app.missions.hourly_rate * 8), 0).toFixed(2);
  }, [completedMissions]);

  // Génération des options de mois (6 derniers mois)
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      options.push({
        label: d.toLocaleDateString('fr-FR', { month: 'short' }),
        fullLabel: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        value: d.toISOString().slice(0, 7)
      });
    }
    return options;
  }, []);

  // Fonction d'exportation (Simulation)
  const handleExportPDF = () => {
    const monthName = monthOptions.find(m => m.value === selectedMonth)?.fullLabel;
    Alert.alert(
      "Export PDF",
      `Voulez-vous générer le récapitulatif de vos prestations pour ${monthName} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Générer & Envoyer", 
          onPress: () => Alert.alert("Succès", "Le document a été généré et envoyé à votre adresse e-mail.") 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
            <Text style={styles.mainTitle}>Missions</Text>
            {completedMissions.length > 0 && (
                <Pressable style={styles.exportButton} onPress={handleExportPDF}>
                    <Download size={16} color="#6366f1" />
                    <Text style={styles.exportButtonText}>PDF</Text>
                </Pressable>
            )}
        </View>

        {/* SECTION : CONFIRMÉES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle2 size={18} color="#10b981" />
            <Text style={styles.sectionTitle}>À venir ({confirmedMissions.length})</Text>
          </View>
          {confirmedMissions.length === 0 ? (
            <Text style={styles.emptyText}>Aucune mission confirmée.</Text>
          ) : (
            confirmedMissions.map((app) => (
              <MissionItem key={app.id} mission={app.missions} status={app.status} onPress={() => {}} />
            ))
          )}
        </View>

        {/* SECTION : EN ATTENTE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Timer size={18} color="#f59e0b" />
            <Text style={styles.sectionTitle}>En attente ({pendingMissions.length})</Text>
          </View>
          {pendingMissions.length === 0 ? (
            <Text style={styles.emptyText}>Aucune postulation en cours.</Text>
          ) : (
            pendingMissions.map((app) => (
              <MissionItem key={app.id} mission={app.missions} status={app.status} onPress={() => {}} />
            ))
          )}
        </View>

        {/* SECTION : ARCHIVES */}
        <View style={styles.archiveSection}>
          <View style={styles.sectionHeaderBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Archive size={18} color="#64748b" />
                <Text style={styles.sectionTitle}>Archives</Text>
            </View>
            
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {monthOptions.map((opt) => (
                        <Pressable 
                            key={opt.value} 
                            onPress={() => setSelectedMonth(opt.value)}
                            style={[styles.monthChip, selectedMonth === opt.value && styles.monthChipActive]}
                        >
                            <Text style={[styles.monthText, selectedMonth === opt.value && styles.monthTextActive]}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>
          </View>

          {/* RÉSUMÉ FINANCIER DU MOIS */}
          {completedMissions.length > 0 && (
              <View style={styles.earningsBanner}>
                  <Text style={styles.earningsLabel}>Total du mois :</Text>
                  <Text style={styles.earningsValue}>{monthlyEarnings}€</Text>
              </View>
          )}

          {completedMissions.length === 0 ? (
            <Text style={styles.emptyText}>Aucun historique pour ce mois.</Text>
          ) : (
            completedMissions.map((app) => (
              <MissionItem 
                key={app.id} 
                mission={app.missions} 
                status="completed" 
                onPress={() => router.push({
                    pathname: "/booking/mission-summary",
                    params: { 
                        facility: app.missions.facility_name,
                        earnings: (app.missions.hourly_rate * 8).toFixed(2),
                        duration: "Prestation effectuée"
                    }
                })}
              />
            ))
          )}
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MissionItem({ mission, status, onPress }: { mission: any, status: string, onPress: () => void }) {
  const isAccepted = status === 'accepted';
  const isCompleted = status === 'completed';
  
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.card, 
        isAccepted && styles.cardAccepted,
        isCompleted && styles.cardCompleted,
        pressed && { opacity: 0.8 }
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.facilityName}>{mission.facility_name}</Text>
          <Text style={styles.specialty}>{mission.specialty}</Text>
        </View>
        <View style={[
            styles.statusBadge, 
            isAccepted ? styles.badgeGreen : isCompleted ? styles.badgeGray : styles.badgeOrange
        ]}>
          <Text style={[
              styles.statusBadgeText,
              isAccepted ? {color: '#166534'} : isCompleted ? {color: '#64748b'} : {color: '#92400e'}
          ]}>
            {isAccepted ? 'Confirmé' : isCompleted ? 'Terminé' : 'En attente'}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.iconText}>
          <Clock size={13} color="#94a3b8" />
          <Text style={styles.detailText}>
            {mission.start_at ? new Date(mission.start_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '--'}
          </Text>
        </View>
        <View style={styles.iconText}>
          <MapPin size={13} color="#94a3b8" />
          <Text style={styles.detailText}>{mission.facility_name.split(' ')[0]}</Text>
        </View>
        {isCompleted && (
            <View style={[styles.iconText, {marginLeft: 'auto'}]}>
                <Text style={styles.priceTag}>{(mission.hourly_rate * 8).toFixed(0)}€</Text>
            </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  exportButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E0E7FF' },
  exportButtonText: { color: '#6366f1', fontWeight: '700', fontSize: 13 },
  
  section: { marginBottom: 30 },
  archiveSection: { marginTop: 10, padding: 15, backgroundColor: '#F1F5F9', borderRadius: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  sectionHeaderBetween: { marginBottom: 15, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', paddingLeft: 10, fontSize: 13 },
  
  filterContainer: { marginTop: 5 },
  monthChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, marginRight: 8, backgroundColor: 'transparent' },
  monthChipActive: { backgroundColor: '#fff' },
  monthText: { fontSize: 13, color: '#94a3b8', fontWeight: '600', textTransform: 'capitalize' },
  monthTextActive: { color: '#6366f1', fontWeight: '800' },

  earningsBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#6366f1' },
  earningsLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  earningsValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardAccepted: { borderColor: '#10b981', borderLeftWidth: 4 },
  cardCompleted: { borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  facilityName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  specialty: { fontSize: 13, color: '#6366f1', fontWeight: '600', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeOrange: { backgroundColor: '#fef3c7' },
  badgeGray: { backgroundColor: '#f1f5f9' },
  
  detailsRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconText: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  priceTag: { fontSize: 14, fontWeight: '800', color: '#10b981' }
});