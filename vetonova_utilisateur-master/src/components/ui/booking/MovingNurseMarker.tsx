import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { Marker, AnimatedRegion } from 'react-native-maps';
import { Navigation } from 'lucide-react-native'; // Icône plus "navigation"
import { calculateDistance } from '@/src/utils/geoUtils';

interface MovingNurseMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  nurseName: string;
}

const getHeading = (start: any, end: any) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const lat1 = toRad(start.latitude);
  const lon1 = toRad(start.longitude);
  const lat2 = toRad(end.latitude);
  const lon2 = toRad(end.longitude);

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return bearing;
};

export const MovingNurseMarker = ({ coordinate, nurseName }: MovingNurseMarkerProps) => {
  // Initialisation de la région animée
  const animatedCoordinate = useRef(new AnimatedRegion({
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  })).current;

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevCoord = useRef(coordinate);

  useEffect(() => {
    const destination = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    // Animation de mouvement (Spring sur iOS pour plus de souplesse)
    if (Platform.OS === 'android') {
      (animatedCoordinate.timing as any)({
        toValue: destination,
        duration: 3500, // Durée ajustée pour correspondre au rafraîchissement GPS
        useNativeDriver: false,
      }).start();
    } else {
      (animatedCoordinate.spring as any)({
        toValue: destination,
        useNativeDriver: false,
        friction: 8,
      }).start();
    }

    // Calcul du cap (angle de rotation)
    const dist = calculateDistance(
      prevCoord.current.latitude, prevCoord.current.longitude,
      coordinate.latitude, coordinate.longitude
    );

    if (dist > 3) { // On baisse à 3m pour plus de réactivité
      const heading = getHeading(prevCoord.current, coordinate);
      Animated.timing(rotationAnim, {
        toValue: heading,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }

    prevCoord.current = coordinate;
  }, [coordinate]);

  useEffect(() => {
    // Animation de pulsation (effet radar)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.8, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotateData = rotationAnim.interpolate({
    inputRange: [-180, 180],
    outputRange: ['-180deg', '180deg'],
  });

  return (
    <Marker.Animated 
      coordinate={animatedCoordinate as any} 
      title={nurseName}
      flat 
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.container}>
        {/* L'effet de halo radar */}
        <Animated.View 
          style={[
            styles.pulse, 
            { 
              transform: [{ scale: pulseAnim }], 
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.8],
                outputRange: [0.6, 0]
              }) 
            }
          ]} 
        />
        
        {/* Le curseur de direction */}
        <Animated.View style={[styles.markerBadge, { transform: [{ rotate: rotateData }] }]}>
          <Navigation size={22} color="#fff" fill="#fff" />
        </Animated.View>
      </View>
    </Marker.Animated>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', width: 70, height: 70 },
  pulse: { 
    position: 'absolute', 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#6366f1' // Couleur Indigo pour matcher ton thème
  },
  markerBadge: {
    width: 40, height: 40, borderRadius: 20, 
    backgroundColor: '#6366f1', // Couleur principale
    borderWidth: 3, borderColor: '#fff', 
    justifyContent: 'center', alignItems: 'center',
    elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4
  },
});