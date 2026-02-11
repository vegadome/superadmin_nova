import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function VetHistoryScreen({ navigation }: any) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    // On récupère les records en joignant les infos du compagnon (pets)
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        pets (name, species)
      `)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchRecords().then(() => setRefreshing(false));
  }, []);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.recordCard}
      onPress={() => navigation.navigate('EditRecord', { recordId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.petName}>{item.pets?.name || 'Animal inconnu'}</Text>
          <Text style={styles.dateText}>
            {format(new Date(item.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
          </Text>
        </View>
        <Ionicons 
          name={item.diagnosis === 'À compléter par le vétérinaire' ? "alert-circle" : "checkmark-circle"} 
          size={24} 
          color={item.diagnosis === 'À compléter par le vétérinaire' ? "#f59e0b" : "#10b981"} 
        />
      </View>
      
      <Text style={styles.recordType}>{item.record_type.toUpperCase()}</Text>
      <Text style={styles.diagnosisPreview} numberOfLines={2}>
        {item.diagnosis}
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.editLink}>Modifier le compte-rendu</Text>
        <Ionicons name="chevron-forward" size={16} color="#6366f1" />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#6366f1" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historique des soins</Text>
      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun dossier médical trouvé.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  listContent: { paddingBottom: 100 },
  recordCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  petName: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  dateText: { fontSize: 13, color: '#64748b', marginTop: 2 },
  recordType: { 
    fontSize: 11, fontWeight: '800', color: '#6366f1', 
    backgroundColor: '#eef2ff', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginVertical: 10 
  },
  diagnosisPreview: { fontSize: 14, color: '#475569', lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  editLink: { fontSize: 14, fontWeight: '600', color: '#6366f1', marginRight: 5 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 50 }
});