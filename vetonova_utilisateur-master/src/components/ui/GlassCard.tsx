import { BlurView } from 'expo-blur';
import { StyleSheet, View, ViewStyle } from 'react-native';

export const GlassCard = ({ children, style }: { children: any, style?: ViewStyle }) => (
  <BlurView intensity={80} tint="light" style={[styles.glass, style]}>
    {children}
  </BlurView>
);

const styles = StyleSheet.create({
  glass: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});