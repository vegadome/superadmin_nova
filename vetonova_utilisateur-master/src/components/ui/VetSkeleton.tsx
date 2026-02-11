import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

export const VetSkeleton = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.image, { opacity }]} />
      <View style={styles.info}>
        <Animated.View style={[styles.line, { width: '60%', opacity }]} />
        <Animated.View style={[styles.line, { width: '40%', height: 12, marginTop: 10, opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    marginBottom: 20,
    overflow: 'hidden',
    height: 280,
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: '#E2E8F0',
  },
  info: {
    padding: 20,
  },
  line: {
    height: 20,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
  },
});