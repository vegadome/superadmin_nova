import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: 'transparent' },
      animation: 'slide_from_right',
    }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding-nurse" />
      {/* Ajouter d'autres écrans d'auth si nécessaire */}
    </Stack>
  );
}