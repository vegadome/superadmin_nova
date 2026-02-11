// @/src/components/share/PendingVerification.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AlertCircle, ArrowRight, Clock } from 'lucide-react-native';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface PendingVerificationProps {
  userName?: string;
  status: 'pending' | 'rejected' | 'verified'; // Ajout de verified pour la sécurité
  feedback?: string;
}

export const PendingVerification = ({ userName, status, feedback }: PendingVerificationProps) => {
  const router = useRouter();
  
  // Si par erreur le composant est appelé alors que l'utilisateur est vérifié, on ne rend rien
  if (status === 'verified') return null;

  const isRejected = status === 'rejected';

  const handleAction = () => {
    if (isRejected) {
      // Redirige vers la page de profil pour corriger les documents
      router.push('/profile');
    } else {
      Alert.alert(
        "Vérification en cours", 
        "Notre équipe vérifie vos documents (Diplôme, Visa, INAMI). Ce processus prend généralement moins de 24h."
      );
    }
  };

  return (
    <Animated.View entering={FadeInDown} style={styles.container}>
      <LinearGradient 
        colors={isRejected ? ['#FEF2F2', '#FEE2E2'] : ['#FFFBEB', '#FEF3C7']} 
        style={[styles.card, isRejected && styles.cardRejected]}
      >
        <View style={[styles.iconCircle, isRejected && styles.iconCircleRejected]}>
          {isRejected ? (
            <AlertCircle size={26} color="#DC2626" />
          ) : (
            <Clock size={26} color="#D97706" />
          )}
        </View>

        <Text style={[styles.title, isRejected && styles.titleRejected]}>
          {isRejected ? "Action requise" : "Vérification en cours"}
        </Text>

        <Text style={[styles.description, isRejected && styles.descriptionRejected]}>
          {isRejected 
            ? (feedback || "Certains documents ne sont pas conformes. Veuillez les soumettre à nouveau pour activer votre compte.")
            : `Ravi de vous voir, ${userName || 'Praticien'} ! Votre profil est en cours d'examen par nos équipes. Vous recevrez une notification dès validation.`}
        </Text>

        <TouchableOpacity 
          style={[styles.supportButton, isRejected && styles.buttonRejected]}
          onPress={handleAction}
          activeOpacity={0.8}
        >
          <Text style={[styles.supportText, isRejected && styles.supportTextRejected]}>
            {isRejected ? "Corriger mes documents" : "En savoir plus"}
          </Text>
          {isRejected && <ArrowRight size={14} color="#FFF" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10, width: '100%' },
  card: { padding: 24, borderRadius: 28, borderWidth: 1, borderColor: '#FDE68A', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardRejected: { borderColor: '#FECACA' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 3, shadowOpacity: 0.1 },
  iconCircleRejected: { backgroundColor: '#FFF' },
  title: { fontSize: 20, fontWeight: '800', color: '#92400E', marginBottom: 8 },
  titleRejected: { color: '#991B1B' },
  description: { fontSize: 14, color: '#B45309', textAlign: 'center', lineHeight: 22, marginBottom: 20, paddingHorizontal: 10 },
  descriptionRejected: { color: '#B91C1C' },
  supportButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, 
    paddingHorizontal: 22, 
    backgroundColor: 'rgba(255,255,255,0.7)', 
    borderRadius: 16 
  },
  buttonRejected: { backgroundColor: '#DC2626' },
  supportText: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  supportTextRejected: { color: '#FFF' }
});