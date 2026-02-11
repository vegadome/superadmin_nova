import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useMissionStore, MedicalRecord } from '@/src/store/useMissionStore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PetMedicalHistory({ petId }: { petId: string }) {
  const { medicalRecords, fetchMedicalRecords } = useMissionStore();

  useEffect(() => {
    fetchMedicalRecords(petId);
  }, [petId]);

  const getRecordTheme = (type: string) => {
    switch (type) {
      case 'vaccine': return { icon: 'shield-check', color: '#10b981', label: 'Vaccin' };
      case 'surgery': return { icon: 'medical-bag', color: '#ef4444', label: 'Chirurgie' };
      case 'medication': return { icon: 'pill', color: '#f59e0b', label: 'Traitement' };
      default: return { icon: 'stethoscope', color: '#6366f1', label: 'Consultation' };
    }
  };

  const renderRecord = ({ item, index }: { item: MedicalRecord, index: number }) => {
    const theme = getRecordTheme(item.record_type);
    
    return (
      <View style={styles.timelineRow}>
        {/* Colonne de gauche : Ligne et Icône */}
        <View style={styles.timelineIndicators}>
          <View style={[styles.iconCircle, { backgroundColor: theme.color + '15' }]}>
            <MaterialCommunityIcons name={theme.icon as any} size={20} color={theme.color} />
          </View>
          {index !== medicalRecords.length - 1 && <View style={styles.verticalLine} />}
        </View>

        {/* Colonne de droite : Contenu du soin */}
        <View style={styles.recordCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.dateText}>
              {format(new Date(item.created_at), 'dd MMMM yyyy', { locale: fr })}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: theme.color }]}>
              <Text style={styles.typeBadgeText}>{theme.label}</Text>
            </View>
          </View>

          <Text style={styles.diagnosisText}>{item.diagnosis}</Text>
          
          {item.treatment && (
            <Text style={styles.treatmentText}>📋 {item.treatment}</Text>
          )}

          {item.weight_at_time && (
            <View style={styles.weightBadge}>
              <Ionicons name="fitness" size={12} color="#64748b" />
              <Text style={styles.weightText}>{item.weight_at_time} kg</Text>
            </View>
          )}

          {item.attachments_url?.length > 0 && (
            <View style={styles.attachmentContainer}>
              {item.attachments_url.map((_, i) => (
                <TouchableOpacity key={i} style={styles.docButton}>
                  <Ionicons name="document-text" size={16} color="#6366f1" />
                  <Text style={styles.docButtonText}>PJ {i + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={medicalRecords}
        keyExtractor={(item) => item.id}
        renderItem={renderRecord}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <Text style={styles.title}>Carnet de santé</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 25 },
  timelineRow: { flexDirection: 'row', minHeight: 120 },
  timelineIndicators: { alignItems: 'center', marginRight: 15, width: 40 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  verticalLine: { flex: 1, width: 2, backgroundColor: '#e2e8f0', marginVertical: 4 },
  recordCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  diagnosisText: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  treatmentText: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 10 },
  weightBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  weightText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  attachmentContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  docButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 5 },
  docButtonText: { fontSize: 12, fontWeight: '700', color: '#6366f1' }
});