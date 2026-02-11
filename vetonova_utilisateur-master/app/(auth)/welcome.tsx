import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/login');
  };

  const handleSignUpNurse = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Role 'nurse' pour les prestataires
    router.push('/(auth)/login?signUp=true&role=nurse');
  };

  return (
    <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.container}>
      {/* HEADER AVEC LOGO MÉDICAL */}
      <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.header}>
        <LinearGradient colors={['#eff6ff', '#ffffff']} style={styles.logoCircle}>
          <Ionicons name="medical" size={60} color="#3b82f6" />
        </LinearGradient>
        <Text style={styles.title}>NurseNova</Text>
        <Text style={styles.subtitle}>
          Le matching intelligent entre soignants indépendants et établissements de santé.
        </Text>
      </Animated.View>

      {/* BOUTONS D'ACTION */}
      <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.buttonContainer}>
        
        {/* CONNEXION */}
        <TouchableOpacity style={styles.mainButton} onPress={handleLogin}>
          <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.gradientButton}>
            <Text style={styles.mainButtonText}>Se connecter</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.separatorContainer}>
          <View style={styles.line} />
          <Text style={styles.separatorText}>NOUVEAU SUR NURSENOVA ?</Text>
          <View style={styles.line} />
        </View>

        {/* INSCRIPTION INFIRMIER (Seul bouton restant) */}
        <TouchableOpacity style={[styles.secondaryButton, styles.nurseButton]} onPress={handleSignUpNurse}>
          <View style={styles.buttonContent}>
            <Ionicons name="person-add-outline" size={20} color="#3b82f6" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Créer un compte infirmier</Text>
          </View>
        </TouchableOpacity>

      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 8,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginBottom: 60, // Augmenté légèrement pour l'équilibre visuel
  },
  mainButton: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  separatorText: {
    marginHorizontal: 12,
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nurseButton: {
    borderColor: '#3b82f633',
    backgroundColor: '#f8faff',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '700',
  },
});