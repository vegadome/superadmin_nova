import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { Check } from 'lucide-react-native';

export const SuccessOverlay = () => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, { transform: [{ scale }], opacity }]}>
        <Check size={60} color="#fff" strokeWidth={4} />
      </Animated.View>
      <Animated.Text style={[styles.text, { opacity }]}>Vacation confirmée !</Animated.Text>
      <Animated.Text style={[styles.subtext, { opacity }]}>
        L'établissement vous attend.
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.9)', // Bleu nuit plus profond (Slate-900)
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981', // Vert émeraude (Standard médical de succès)
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 25,
    textAlign: 'center',
  },
  subtext: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});