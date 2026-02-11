import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function MissionSummaryScreen() {
  const router = useRouter();
  const { facility, duration, earnings } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIconContainer}>
          <LinearGradient colors={['#10b981', '#059669']} style={styles.iconCircle}>
            <Ionicons name="checkmark" size={60} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Vacation terminée !</Text>
        <Text style={styles.subtitle}>Votre rapport de prestation a été transmis à {facility || "l'établissement"}.</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#6366f1" />
            <Text style={styles.statLabel}>Durée</Text>
            <Text style={styles.statValue}>{duration || '8h00'}</Text>
          </View>

          <View style={[styles.statCard, styles.statCardHighlight]}>
            <MaterialCommunityIcons name="cash" size={24} color="#10b981" />
            <Text style={styles.statLabel}>Gains estimés</Text>
            <Text style={[styles.statValue, {color: '#10b981'}]}>{earnings || '0.00'}€</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#64748b" />
          <Text style={styles.infoText}>
            L'accès aux données patients a été révoqué conformément au protocole de sécurité.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.mainButton}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Text style={styles.mainButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  successIconContainer: { marginBottom: 30 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statCard: { flex: 1, backgroundColor: '#f8fafc', padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  statCardHighlight: { borderColor: '#dcfce7', backgroundColor: '#f0fdf4' },
  statLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: 8 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 4 },
  infoBox: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 15, borderRadius: 16, gap: 10, alignItems: 'center', marginBottom: 40 },
  infoText: { flex: 1, fontSize: 13, color: '#64748b', lineHeight: 18 },
  mainButton: { backgroundColor: '#0f172a', width: '100%', paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
  mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});