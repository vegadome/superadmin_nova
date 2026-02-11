import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />
      
      <Stack.Screen 
        name="documents" 
        options={{ 
          title: 'Mes Justificatifs',
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          headerBackTitle: 'Retour',
          headerTintColor: '#6366f1', // Harmonisé avec ton thème Profile
          headerStyle: { backgroundColor: '#F8FAFC' } // Couleur de fond de l'app
        }} 
      />

      <Stack.Screen 
        name="history" 
        options={{ 
          title: 'Mon Historique',
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          headerBackTitle: 'Retour',
          headerTintColor: '#6366f1'
        }} 
      />
    </Stack>
  );
}