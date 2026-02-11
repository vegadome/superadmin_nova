import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Alert, ActivityIndicator } from 'react-native';
import { Phone, MessageCircle, X, Shield, CreditCard, CheckCircle, Clock } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { getRouteData } from '@/src/services/nurse/navigationService';
import { useStripe } from '@stripe/stripe-react-native'; 
import { supabase } from '@/src/lib/supabase';

interface TrackingProps {
  nurse: any;
  onCancel: () => void;
  nurseLocation: { latitude: number, longitude: number } | null;
  clientLocation: { latitude: number, longitude: number } | null;
  status: string;
  appointmentId: string;
}

export const TrackingScreen = ({ nurse, onCancel, nurseLocation, clientLocation, status, appointmentId }: TrackingProps) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const isArrived = status === 'arrived';
  const isAwaitingPayment = status === 'awaiting_payment';
  const themeColor = '#6366f1'; // Couleur Indigo pour le médical

  useEffect(() => {
    const updateRouteInfo = async () => {
      if (isArrived || isAwaitingPayment) {
        setMinutesLeft(0);
        setDistance("0");
        Animated.timing(progressAnim, { toValue: 1, duration: 1000, useNativeDriver: false }).start();
        return;
      }

      if (nurseLocation && clientLocation) {
        const data = await getRouteData(
          { lat: nurseLocation.latitude, lng: nurseLocation.longitude },
          { lat: clientLocation.latitude, lng: clientLocation.longitude }
        );

        if (data) {
          setMinutesLeft(data.duration);
          setDistance(data.distance);
          // On calcule la progression sur une base de 20 min max
          const progressValue = Math.max(0, Math.min(1, 1 - data.duration / 20));
          Animated.timing(progressAnim, { toValue: progressValue, duration: 1000, useNativeDriver: false }).start();
        }
      }
    };

    updateRouteInfo();
    const interval = setInterval(updateRouteInfo, 30000);
    return () => clearInterval(interval);
  }, [nurseLocation, status]);

  const handlePayment = async () => {
    try {
      setIsProcessingPayment(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { appointmentId }
      });

      if (error) throw error;

      const { error: stripeError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'Infirmier Connect',
        appearance: {
          colors: { primary: themeColor },
          borderRadius: 15,
        }
      });

      if (stripeError) throw stripeError;

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        Alert.alert("Paiement annulé", "Le règlement n'a pas été finalisé.");
      } else {
        await supabase
          .from('appointments')
          .update({ status: 'completed', payout_status: 'paid' })
          .eq('id', appointmentId);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Succès", "Paiement validé. Votre attestation de soins est disponible dans votre profil.");
        onCancel(); 
      }
    } catch (err: any) {
      Alert.alert("Erreur de paiement", err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Header Info Temps Réel */}
      {!isAwaitingPayment && (
        <View style={styles.headerWrapper}>
          <BlurView intensity={90} tint="dark" style={styles.header}>
            <View style={[styles.statusBadge, isArrived && styles.statusBadgeArrived]}>
              <View style={[styles.pulseDot, isArrived && styles.pulseDotArrived]} />
              <Text style={[styles.statusText, isArrived && styles.statusTextArrived]}>
                {isArrived ? 'INFIRMIER SUR PLACE' : 'INFIRMIER EN ROUTE'}
              </Text>
            </View>
            <View style={styles.etaContainer}>
               <Clock size={16} color="#fff" style={{marginRight: 6}} />
               <Text style={styles.etaText}>
                 {isArrived ? 'À votre porte' : (minutesLeft ? `${minutesLeft} min` : '-- min')}
               </Text>
            </View>
          </BlurView>
        </View>
      )}

      {!isAwaitingPayment && (
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, { width: progressBarWidth, backgroundColor: themeColor }, isArrived && { backgroundColor: '#10B981' }]} />
        </View>
      )}

      <View style={styles.bottomCard}>
        {isAwaitingPayment ? (
          /* SECTION FACTURATION FINALISÉE */
          <View style={styles.paymentContainer}>
            <View style={styles.paymentHeader}>
              <View style={[styles.checkBadge, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <CheckCircle size={32} color={themeColor} />
              </View>
              <Text style={styles.paymentTitle}>Soin terminé</Text>
              <Text style={styles.paymentSubtitle}>
                L'infirmier a clôturé la prestation. Le montant est basé sur la nomenclature INAMI 2026.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.payButton, { backgroundColor: themeColor }]} 
              onPress={handlePayment}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CreditCard size={22} color="#fff" />
                  <Text style={styles.payButtonText}>Régler et clôturer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* SECTION INFOS INFIRMIER */
          <>
            {isArrived && (
              <View style={styles.arrivalNotice}>
                <Text style={styles.arrivalTitle}>Votre infirmier est arrivé !</Text>
                <Text style={styles.arrivalSubtitle}>
                  Préparez votre carte d'identité (eID) et la prescription médicale éventuelle.
                </Text>
              </View>
            )}

            <View style={styles.nurseInfo}>
              <Image 
                source={{ uri: nurse?.photo_url || 'https://i.pravatar.cc/150?u=nurse' }} 
                style={styles.avatar} 
              />
              <View style={styles.nurseMeta}>
                <Text style={styles.nurseName}>{nurse?.name || 'Infirmier'}</Text>
                <View style={styles.verifyRow}>
                  <Shield size={14} color={isArrived ? "#10B981" : themeColor} />
                  <Text style={styles.verifyText}>
                    {isArrived ? "Sur place" : `Agréé INAMI • ${distance || '--'} km`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.chatButton}>
                <MessageCircle size={22} color="#1e293b" />
                <Text style={styles.actionText}>Message</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.callButton, isArrived && {backgroundColor: '#10B981'}]}>
                <Phone size={22} color="#fff" />
                <Text style={[styles.actionText, { color: '#fff' }]}>Appeler</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  headerWrapper: { position: 'absolute', top: -560, left: 20, right: 20 },
  header: { borderRadius: 24, padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(99, 102, 241, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1', marginRight: 8 },
  statusText: { color: '#6366f1', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  etaContainer: { flexDirection: 'row', alignItems: 'center' },
  etaText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  progressContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 15, overflow: 'hidden' },
  progressBar: { height: '100%' },
  bottomCard: { backgroundColor: '#fff', borderRadius: 32, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  
  paymentContainer: { alignItems: 'center' },
  paymentHeader: { alignItems: 'center', marginBottom: 25 },
  checkBadge: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  paymentTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  paymentSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  payButton: { width: '100%', height: 65, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  payButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  nurseInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: '#f8fafc' },
  nurseMeta: { flex: 1, marginLeft: 16 },
  nurseName: { fontSize: 19, fontWeight: '800', color: '#1e293b' },
  verifyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  verifyText: { fontSize: 13, color: '#64748b', marginLeft: 6 },
  closeButton: { padding: 8 },
  actionRow: { flexDirection: 'row', gap: 12 },
  chatButton: { flex: 1, height: 56, borderRadius: 18, backgroundColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  callButton: { flex: 1, height: 56, borderRadius: 18, backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontWeight: '700', fontSize: 15 },
  
  statusBadgeArrived: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  pulseDotArrived: { backgroundColor: '#10B981' },
  statusTextArrived: { color: '#10B981' },
  arrivalNotice: { backgroundColor: '#f0fdf4', padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#dcfce7' },
  arrivalTitle: { color: '#166534', fontWeight: '800', fontSize: 15 },
  arrivalSubtitle: { color: '#166534', fontSize: 13, marginTop: 4, opacity: 0.8 },
});