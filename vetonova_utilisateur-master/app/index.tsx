import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // Animation d'entrée fluide
    opacity.value = withTiming(1, { duration: 1000 });
    scale.value = withTiming(1, { duration: 1000 });
    
    // Note: On ne met plus de router.replace ici.
    // Le RootLayout détectera quand l'app est prête et redirigera tout seul.
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', '#F1F5F9']}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <View style={styles.iconCircle}>
          <Ionicons name="medical" size={80} color="#3b82f6" />
        </View>
        <Text style={styles.title}>NurseNova</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BELGIUM B2B</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 45,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.2,
    shadowRadius: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -2,
  },
  badge: {
    marginTop: 10,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369a1',
    letterSpacing: 1,
  },
});