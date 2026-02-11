import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, SafeAreaView, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { MapPin, ShieldCheck, Stethoscope, Building2 } from 'lucide-react-native'; // Icônes médicales
import * as Haptics from 'expo-haptics';

export const MatchingScreen = ({ onCancel }: { onCancel: () => void }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation de pulsation du logo central
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
      ])
    ).start();

    // Animation du radar
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const interval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={95} tint="dark" style={styles.container}>
        <SafeAreaView style={styles.content}>
          
          {/* Radar Section */}
          <View style={styles.radarContainer}>
            {/* Cercles concentriques du radar */}
            <View style={styles.radarCircle} />
            <View style={[styles.radarCircle, { width: 180, height: 180 }]} />
            
            <Animated.View style={[styles.radarSweep, { transform: [{ rotate: spin }] }]} />
            
            <Animated.View style={[styles.mainIconContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Stethoscope size={42} color="#6366f1" />
            </Animated.View>

            {/* Points simulant les établissements qui reçoivent la notif */}
            <View style={[styles.hospitalDot, { top: '25%', left: '20%' }]}>
                <Building2 size={12} color="#fff" />
            </View>
            <View style={[styles.hospitalDot, { bottom: '30%', right: '25%' }]}>
                 <Building2 size={12} color="#fff" />
            </View>
          </View>

          {/* Text Section */}
          <View style={styles.textContainer}>
            <Text style={styles.searchingTitle}>Envoi de votre profil...</Text>
            <Text style={styles.searchingSubtitle}>
              L'établissement de santé analyse votre candidature pour cette vacation.
            </Text>
          </View>

          {/* Details Box */}
          <View style={styles.detailsBox}>
            <View style={styles.detailItem}>
              <MapPin size={18} color="#6366f1" />
              <Text style={styles.detailText}>Zone de Liège - Secteur Nord</Text>
            </View>
            <View style={styles.detailItem}>
              <ShieldCheck size={18} color="#4ECDC4" />
              <Text style={styles.detailText}>Profil certifié INAMI</Text>
            </View>
          </View>

          {/* Cancel Button */}
          <Pressable onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Retirer ma candidature</Text>
          </Pressable>

        </SafeAreaView>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 50 },
  radarContainer: { height: 300, width: 300, justifyContent: 'center', alignItems: 'center' },
  radarCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  radarSweep: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: 'transparent',
    borderLeftColor: 'rgba(99, 102, 241, 0.4)', // Couleur Indigo
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  mainIconContainer: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  hospitalDot: { 
    position: 'absolute', 
    width: 24, 
    height: 24, 
    backgroundColor: '#6366f1', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#6366f1', 
    shadowRadius: 10, 
    shadowOpacity: 0.5 
  },
  textContainer: { alignItems: 'center', paddingHorizontal: 40 },
  searchingTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 10 },
  searchingSubtitle: { color: '#94a3b8', fontSize: 16, textAlign: 'center', lineHeight: 22 },
  detailsBox: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 24, 
    padding: 20, 
    width: '85%', 
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailText: { color: '#cbd5e1', fontSize: 14, fontWeight: '500' },
  cancelButton: { padding: 15 },
  cancelText: { color: '#ef4444', fontWeight: '600', fontSize: 15, opacity: 0.8 },
});