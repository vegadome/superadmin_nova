import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function VetScheduleScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchedule = async () => {
    // On récupère les missions qui ne sont pas encore terminées ni annulées
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        pets (name, species, breed)
      `)
      .in('status', ['pending', 'accepted'])
      .order('scheduled_at', { ascending: true });

    if (error) console.error(error);
    else setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule().then(() => setRefreshing(false));
  };

  const renderAppointment = ({ item, index }: { item: any, index: number }) => {
    const isAccepted = item.status === 'accepted';
    
    return (
      <View style={styles.timelineRow}>
        {/* Colonne Heure */}
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>
            {item.scheduled_at ? format(new Date(item.scheduled_at), 'HH:mm') : '--:--'}
          </Text>
          <View style={[styles.line, index === appointments.length - 1 && { backgroundColor: 'transparent' }]} />
        </View>

        {/* Carte Rendez-vous */}
        <TouchableOpacity style={[styles.card, isAccepted && styles.cardAccepted]}>
          <View style={styles.cardHeader}>
            <Text style={styles.petName}>{item.pets?.name || 'Consultation'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: isAccepted ? '#10b981' : '#f59e0b' }]}>
              <Text style={styles.statusBadgeText}>{isAccepted ? 'Confirmé' : 'En attente'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text style={styles.infoText} numberOfLines={1}>{item.address_name || 'Adresse non spécifiée'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="paw-outline" size={16} color="#64748b" />
            <Text style={styles.infoText}>{item.pets?.species} • {item.service_type}</Text>
          </View>

          {isAccepted && (
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="navigate-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Ouvrir l'itinéraire</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  return (
    <View style={styles.container}>
      <BlurView intensity={90} style={styles.header}>
        <Text style={styles.title}>Mon Agenda</Text>
        <Text style={styles.subtitle}>
          {format(new Date(), "EEEE d MMMM", { locale: fr })}
        </Text>
      </BlurView>

      <FlatList
        data={appointments}
        renderItem={renderAppointment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-clear-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Aucun rendez-vous prévu pour le moment.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', textTransform: 'capitalize', marginTop: 4 },
  listContent: { padding: 20, paddingBottom: 100 },
  
  // Timeline Design
  timelineRow: { flexDirection: 'row', marginBottom: 5 },
  timeColumn: { alignItems: 'center', width: 60, marginRight: 10 },
  timeText: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  line: { width: 2, flex: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  
  // Card Design
  card: { 
    flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: '#f1f5f9'
  },
  cardAccepted: { borderColor: '#d1fae5', backgroundColor: '#f0fdf4' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  petName: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  infoText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  
  // Action Button
  actionButton: { 
    flexDirection: 'row', backgroundColor: '#6366f1', marginTop: 12, 
    padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 
  },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', marginTop: 16, textAlign: 'center', fontSize: 16 }
});