import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '@/src/store/useUserStore';
import { useMissionStore } from '@/src/store/useMissionStore';
import * as Haptics from 'expo-haptics';

// Services mis à jour selon la nomenclature INAMI 2026 (Circulaire OA no 2025/311)
const SERVICES = [
  { 
    id: 'soins_courants', 
    label: 'Soins Courants', 
    icon: 'medical', 
    price: '31.00€', // Basé sur le code 424852 indexé
    description: 'Injections, pansements, etc.',
    color: '#6366f1'
  },
  { 
    id: 'toilette', 
    label: 'Toilette', 
    icon: 'water', 
    price: '12.95€', // Basé sur le code 424815 indexé
    description: 'Aide à l\'hygiène quotidienne',
    color: '#4ECDC4'
  },
  { 
    id: 'diabete', 
    label: 'Suivi Diabète', 
    icon: 'fitness', 
    price: '8.58€', // Basé sur le code 424793 indexé
    description: 'Glycémie et insuline',
    color: '#F59E0B'
  },
  { 
    id: 'palliatif', 
    label: 'Soins Palliatifs', 
    icon: 'heart', 
    price: '45.00€',
    description: 'Accompagnement spécifique',
    color: '#A78BFA'
  },
];

interface BookingSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  onBookingConfirmed?: (data: any) => void;
}

export const BookingSheet: React.FC<BookingSheetProps> = ({ 
  sheetRef, 
  onBookingConfirmed 
}) => {
  const { profile } = useUserStore(); // On utilise le profil de l'infirmier
  const { 
    selectedVet, // L'établissement sélectionné sur la carte
    selectedService, 
    setBooking 
  } = useMissionStore();

  const snapPoints = useMemo(() => ['50%', '85%'], []);

  // Estimation du temps de trajet pour l'infirmier
  const travelTime = useMemo(() => {
    if (!selectedVet?.dist_meters) return '15 min';
    const mins = Math.round(selectedVet.dist_meters / 600) + 2; 
    return `${mins} min`;
  }, [selectedVet]);

  const handleServiceSelect = useCallback((serviceLabel: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBooking({ selectedService: serviceLabel });
  }, [setBooking]);

  const handleConfirm = useCallback(async () => {
    const serviceObj = SERVICES.find(s => s.label === selectedService) || SERVICES[0];
    const numericPrice = parseFloat(serviceObj.price.replace('€', ''));

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sheetRef.current?.close();
    
    if (onBookingConfirmed) {
      onBookingConfirmed({
        serviceType: selectedService || 'Soins Courants',
        estimatedPrice: numericPrice,
        nurseId: profile?.id,
        establishmentId: selectedVet?.id
      });
    }
  }, [selectedService, selectedVet, profile, sheetRef, onBookingConfirmed]);

  const renderBackdrop = useCallback((props: any) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  ), []);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundComponent={({ style }) => (
        <BlurView intensity={95} tint="dark" style={[style, styles.glassBackground]} />
      )}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Postuler à la vacation</Text>
          {selectedVet && (
            <View style={styles.etaContainer}>
               <Ionicons name="car" size={16} color="#4ECDC4" />
               <Text style={styles.etaText}>Trajet estimé : {travelTime}</Text>
            </View>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          
          {/* RÉCAPITULATIF PROFIL */}
          <Text style={styles.sectionTitle}>Votre profil actif</Text>
          <View style={styles.profileSummary}>
            <Image 
              source={{ uri: profile?.avatar_url || 'https://i.pravatar.cc/150' }} 
              style={styles.nurseAvatar} 
            />
            <View>
              <Text style={styles.nurseName}>{profile?.full_name || 'Infirmier'}</Text>
              <Text style={styles.nurseStatus}>N° INAMI : {profile?.inami_number || 'Validé'}</Text>
            </View>
          </View>

          {/* SECTION SERVICE */}
          <Text style={styles.sectionTitle}>Prestation principale demandée</Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map(service => (
              <TouchableOpacity
                key={service.id}
                onPress={() => handleServiceSelect(service.label)}
                style={[
                  styles.serviceCard,
                  selectedService === service.label && { 
                    borderColor: service.color, 
                    backgroundColor: service.color + '30',
                    borderWidth: 2 
                  }
                ]}
              >
                <Ionicons name={service.icon as any} size={24} color={service.color} />
                <Text style={styles.serviceLabel}>{service.label}</Text>
                <Text style={styles.servicePrice}>{service.price}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Ionicons name="document-text" size={18} color="#94a3b8" />
              <Text style={styles.infoText}>Tarifs indexés (INAMI 01/01/2026)</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.infoRow}>
              <Ionicons name="shield-check" size={18} color="#4ECDC4" />
              <Text style={styles.infoText}>Assurance Responsabilité Civile OK</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <View>
              <Text style={styles.confirmButtonText}>Envoyer ma candidature</Text>
              <Text style={styles.selectedSubtext}>
                Vers : {selectedVet?.name || 'Établissement'}
              </Text>
            </View>
            <Ionicons name="send" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  glassBackground: { borderRadius: 35, overflow: 'hidden', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.3)', width: 50 },
  content: { flex: 1, padding: 24 },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  etaContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8, 
    backgroundColor: 'rgba(78, 205, 196, 0.15)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  etaText: { color: '#4ECDC4', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  sectionTitle: { 
    color: '#94a3b8', 
    fontSize: 11, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    marginBottom: 12, 
    marginTop: 15, 
    letterSpacing: 1.5 
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 20,
    marginBottom: 10
  },
  nurseAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  nurseName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nurseStatus: { color: '#4ECDC4', fontSize: 12, fontWeight: '500' },
  servicesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  serviceCard: { 
    width: '48%', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    alignItems: 'center' 
  },
  serviceLabel: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 8 },
  servicePrice: { color: '#6366f1', fontSize: 14, fontWeight: '800', marginTop: 4 },
  infoBox: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 22, 
    padding: 18, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { color: '#94a3b8', marginLeft: 12, fontSize: 13 },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  footer: { position: 'absolute', bottom: 30, left: 24, right: 24 },
  confirmButton: { 
    backgroundColor: '#6366f1', // Indigo plus pro
    height: 70, 
    borderRadius: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 25,
  },
  confirmButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  selectedSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },
});