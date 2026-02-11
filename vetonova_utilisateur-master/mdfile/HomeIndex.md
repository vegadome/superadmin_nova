# Fichier `HomeIndex.tsx` - Vue d'accueil principal

## Description
Ce composant React Native/Expo représente l'écran d'accueil principal de l'application de mise en relation infirmier/missions médicales. Il affiche les missions disponibles autour de l'utilisateur avec un système de filtrage par catégorie.

## Fonctionnalités principales
- Affichage des missions disponibles dans le rayon d'intervention de l'utilisateur
- Système de vérification du profil infirmier (pending/verified)
- Filtrage des missions par catégorie (Tout, Hôpital, Domicile, etc.)
- Postulation instantanée aux missions
- Récupération de la position géographique de l'utilisateur
- Rafraîchissement par pull-to-refresh
- Feedback haptique pour les interactions

## Dépendances
```typescript
import { PendingVerification } from '@/src/components/share/PendingVerification';
import { supabase } from '@/src/lib/supabase';
import { findNearbyMissions } from '@/src/services/missionService';
import { useMissionStore } from '@/src/store/useMissionStore';
import { useUserStore } from '@/src/store/useUserStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Bell, Briefcase, ChevronRight, Filter, MapPin } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
```

## État et données

### Constantes
```typescript
const CATEGORIES = ["Tout", "Hôpital", "Domicile", "MRS", "Urgences", "Pédiatrie"];
```

### États locaux
- `loading` : État de chargement initial
- `refreshing` : État de rafraîchissement manuel
- `applyingId` : ID de la mission en cours de postulation
- `userLocation` : Coordonnées géographiques de l'utilisateur
- `activeFilter` : Catégorie de filtre active (défaut: "Tout")

### Données récupérées des stores
- `profile` : Profil utilisateur depuis `useUserStore`
- `userApplications` : Liste des missions auxquelles l'utilisateur a postulé
- `availableMissions` : Liste des missions disponibles

## Logique métier

### Vérification du profil
```typescript
const verificationStatus = profile?.verification_status || 'pending';
const isVerified = verificationStatus === 'verified';
```

### Chargement initial des données
```typescript
const initialLoad = async () => {
  setLoading(true);
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') {
    let loc = await Location.getCurrentPositionAsync({});
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setUserLocation(coords);
    await loadData(coords);
  } else {
    await useMissionStore.getState().fetchAvailableMissions();
  }
  setLoading(false);
};
```

### Postulation à une mission
```typescript
const handleApply = async (missionId: string) => {
  if (!profile) return;
  if (!isVerified) {
    Alert.alert("Accès restreint", "Votre profil doit être validé pour postuler.");
    return;
  }

  setApplyingId(missionId);
  try {
    const { error } = await supabase
      .from('mission_applications')
      .insert([{ mission_id: missionId, nurse_id: profile.id }]);
    if (error) throw error;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await fetchUserApplications(profile.id);
    Alert.alert("Succès", "Votre candidature a été transmise.");
  } catch (e) {
    Alert.alert("Erreur", "Impossible de postuler.");
  } finally {
    setApplyingId(null);
  }
};
```

### Filtrage des missions
```typescript
const filteredMissions = useMemo(() => {
  if (activeFilter === "Tout") return availableMissions;
  const searchStr = activeFilter.toLowerCase();
  return availableMissions.filter(m => 
    m.specialty?.toLowerCase().includes(searchStr) || 
    m.facility_name?.toLowerCase().includes(searchStr) ||
    m.facility_type?.toLowerCase().includes(searchStr)
  );
}, [availableMissions, activeFilter]);
```

## Interface utilisateur

### Structure principale
```
SafeAreaView
└── ScrollView (avec RefreshControl)
    ├── Header (avatar, nom, notifications)
    ├── Statistiques rapides (rayon, tarif)
    ├── Section de vérification (si non vérifié)
    ├── Filtres par catégorie (si vérifié)
    ├── Liste des missions filtrées
    └── Espace de padding
```

### Composants conditionnels
1. **Profil non vérifié** : Affiche le composant `PendingVerification`
2. **Profil vérifié** : Affiche les filtres et toutes les missions
3. **Chargement** : Affiche un indicateur d'activité
4. **Aucune mission** : Affiche un message d'absence

## Styles

Le composant utilise une palette de couleurs cohérente avec des dégradés pour les boutons principaux. Les éléments clés incluent :

- **Couleur primaire** : `#6366f1` (indigo)
- **Arrière-plan** : `#F8FAFC` (gris très clair)
- **Textes principaux** : `#1e293b` (gris foncé)
- **Textes secondaires** : `#64748b` (gris moyen)

### Design System
- **Bordures arrondies** : 14-28px selon l'élément
- **Élévations** : ombres douces pour la profondeur
- **Animations** : entrées/sorties fluides avec `react-native-reanimated`
- **Feedback haptique** : pour les interactions importantes

## Points d'attention

### Sécurité des données
- Les informations sensibles (adresses) sont masquées pour les profils non vérifiés
- Validation du statut de vérification avant la postulation

### Performance
- Utilisation de `useMemo` pour les calculs de filtrage
- Pagination virtuelle avec `.slice()` pour l'affichage limité
- Mémoïsation des callbacks avec `useCallback`

### Expérience utilisateur
- Feedback haptique sur les interactions
- Indicateurs visuels pendant les chargements
- Messages d'erreur et de succès
- Interface adaptative selon le statut de vérification

## Améliorations potentielles

1. **Cache local** : Stocker les missions récupérées pour un chargement plus rapide
2. **Recherche textuelle** : Ajouter une barre de recherche en plus des filtres
3. **Tri des missions** : Par distance, tarif, date, etc.
4. **Notifications push** : Alertes pour les nouvelles missions correspondant aux critères
5. **Mode hors-ligne** : Support basique sans géolocalisation

---

*Ce composant représente le cœur de l'application avec une logique complexe de gestion d'état, de géolocalisation et d'interactions utilisateur.*