import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle2, Plus, FileText } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { generateAndUploadInvoice } from '@/src/services/InvoiceService';
import { supabase } from '@/src/lib/supabase';

export const BillingModal = ({ mission, onComplete }: { mission: any, onComplete: (finalPrice: number) => void }) => {
  const [extraFees, setExtraFees] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const isWeekend = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }, []);

  const basePrice = mission?.price_estimate || 75;
  const weekendSurcharge = isWeekend ? (mission?.weekend_surcharge || 20) : 0;
  const total = basePrice + extraFees + weekendSurcharge;
  const platformFee = total * 0.15;
  const netEarnings = total - platformFee;

  const handleFinish = async () => {
    try {
      setIsUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // 1. On génère et on upload la facture simultanément
      // On récupère l'URL pour la stocker dans la table appointments
      const invoiceUrl = await generateAndUploadInvoice(mission, total, extraFees, weekendSurcharge);

      // 2. MISE À JOUR DU STATUT : On passe de 'confirmed' à 'completed'
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status: 'awaiting_payment',
          final_price: total,
          invoice_url: invoiceUrl,
          completed_at: new Date().toISOString() // On enregistre la fin précise du soin
        })
        .eq('id', mission.id);

      if (updateError) throw updateError;

      // 3. On notifie du succès
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // 4. On ferme la modale et on termine la mission localement
      onComplete(total);
    } catch (error: any) {
      console.error("Erreur clôture mission:", error);
      Alert.alert("Erreur", "Impossible de clôturer la mission : " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
            <View style={styles.successIcon}>
                <CheckCircle2 size={40} color="#fff" />
            </View>
            <Text style={styles.title}>Soin terminé</Text>
            <Text style={styles.subtitle}>Résumé pour {mission?.pet_name}</Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails de l'intervention</Text>
            <View style={styles.row}>
                <Text style={styles.label}>{mission?.service_type || 'Consultation'}</Text>
                <Text style={styles.value}>{basePrice}€</Text>
            </View>
            {isWeekend && (
                <View style={[styles.row, { marginTop: 12 }]}>
                    <Text style={styles.label}>Majoration Weekend</Text>
                    <Text style={styles.value}>+{weekendSurcharge}€</Text>
                </View>
            )}
            <TouchableOpacity 
                style={styles.addService}
                onPress={() => {
                  setExtraFees(prev => prev + 15);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
            >
                <Plus size={18} color="#10b981" />
                <Text style={styles.addServiceText}>Ajouter un acte (+15€)</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.earningsCard}>
          <View style={styles.row}>
            <Text style={styles.earningLabel}>Total payé par le client</Text>
            <Text style={styles.totalValue}>{total}€</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.netLabel}>Vos revenus nets</Text>
            <Text style={styles.netValue}>{netEarnings.toFixed(2)}€</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
            <FileText size={18} color="#64748b" />
            <Text style={styles.infoBoxText}>Le reçu PDF sera généré et sauvegardé automatiquement dans l'historique du client.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.finishButton, isUploading && styles.disabledButton]} 
          onPress={handleFinish}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.finishButtonText}>Valider et clôturer</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ... (Garder les styles identiques)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 140 },
  header: { alignItems: 'center', marginBottom: 32 },
  successIcon: { backgroundColor: '#10b981', padding: 15, borderRadius: 25, marginBottom: 15 },
  title: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 15, color: '#64748b' },
  section: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#94a3b8', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#475569', fontSize: 16 },
  value: { fontWeight: '700' },
  addService: { flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  addServiceText: { color: '#10b981', fontWeight: '700', marginLeft: 8 },
  earningsCard: { backgroundColor: '#1e293b', borderRadius: 28, padding: 24, marginBottom: 20 },
  earningLabel: { color: 'rgba(255,255,255,0.7)' },
  totalValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 18 },
  netLabel: { color: '#fff', fontWeight: '700' },
  netValue: { color: '#10b981', fontSize: 28, fontWeight: '900' },
  infoBox: { flexDirection: 'row', gap: 10, padding: 15, backgroundColor: '#f1f5f9', borderRadius: 15 },
  infoBoxText: { flex: 1, fontSize: 12, color: '#64748b' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 },
  finishButton: { backgroundColor: '#10b981', height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  disabledButton: { backgroundColor: '#94a3b8' },
  finishButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' }
});