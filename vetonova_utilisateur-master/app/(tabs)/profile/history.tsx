import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, Linking, Alert, ActivityIndicator } from 'react-native';
import { useMissionStore } from '@/src/store/useMissionStore';
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { router } from 'expo-router';

export default function HistoryScreen() {
  const { pastAppointments, fetchPastAppointments } = useMissionStore();
  const [isLoading, setIsLoading] = useState(true);

  // 1. Chargement des données réelles au montage du composant
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchPastAppointments(user.id);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleOpenInvoice = async (url: string | null) => {
    if (!url) {
      Alert.alert("Information", "La facture n'est pas encore disponible.");
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert("Erreur", "Impossible d'ouvrir le document."));
  };

  const handleContactVet = (appointment: any) => {
    // On redirige vers l'écran de chat en passant l'ID du rendez-vous
    router.push({
      pathname: "/(chat)/conversation",
      params: { 
        appointmentId: appointment.id,
        recipientName: appointment.vet?.name 
      }
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.vetInfo}>
          <Image source={{ uri: item.vet?.photo_url || 'https://via.placeholder.com/150' }} style={styles.vetAvatar} />
          <View>
            <Text style={styles.nurseName}>{item.vet?.name || 'Vétérinaire'}</Text>
            <Text style={styles.dateText}>
              {item.scheduled_at ? format(new Date(item.scheduled_at), 'dd MMMM yyyy', { locale: fr }) : 'Date inconnue'}
            </Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Terminé</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardFooter}>
        <View style={styles.detailRow}>
          <Ionicons name="paw" size={16} color="#64748b" />
          <Text style={styles.detailText}>{item.pet?.name} • {item.service_type}</Text>
        </View>
        <Text style={styles.priceText}>{item.final_price || item.price_estimate}€</Text>
      </View>
      
      {/* 2. Groupe de boutons d'action */}
      <View style={styles.actionGroup}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.receiptButton, !item.invoice_url && styles.buttonDisabled]}
          onPress={() => handleOpenInvoice(item.invoice_url)}
        >
          <Ionicons name="document-text-outline" size={18} color={item.invoice_url ? "#6366f1" : "#94a3b8"} />
          <Text style={[styles.actionText, { color: item.invoice_url ? "#6366f1" : "#94a3b8" }]}>Facture</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.contactButton]}
          onPress={() => handleContactVet(item.vet?.name)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#10b981" />
          <Text style={[styles.actionText, { color: "#10b981" }]}>Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.subtitle}>{pastAppointments.length} interventions passées</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#6366f1" /></View>
      ) : (
        <FlatList
          data={pastAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>Aucun historique pour le moment</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  listContent: { padding: 20, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  vetInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vetAvatar: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#f1f5f9' },
  nurseName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  dateText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  priceText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  
  // Nouveau style pour les boutons côte à côte
  actionGroup: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  receiptButton: { backgroundColor: '#f5f3ff' },
  contactButton: { backgroundColor: '#f0fdf4' },
  buttonDisabled: { backgroundColor: '#f1f5f9' },
  actionText: { fontSize: 14, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', marginTop: 16, fontSize: 16 }
});