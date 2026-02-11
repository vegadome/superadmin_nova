# Fichier `FacilityDetailsScreen.tsx` - Écran des détails d'établissement

## Description
Ce composant React Native/Expo représente l'écran détaillé d'une mission spécifique dans un établissement de santé. Il affiche toutes les informations nécessaires à l'infirmier pour postuler et comprend des fonctionnalités de géolocalisation et d'application.

## Fonctionnalités principales
- Affichage complet des détails d'une mission
- Intégration avec l'application de cartes pour le trajet
- Postulation en un clic avec gestion d'état
- Calcul automatique du gain estimé
- Design adaptatif avec footer fixe
- Gestion des erreurs et états de chargement

## Dépendances
```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMissionStore } from '@/src/store/useMissionStore'; 
import { useUserStore } from '@/src/store/useUserStore';
import { supabase } from '@/src/lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
```

## État et données

### États locaux
- `loading` : État de chargement des données
- `applying` : État de postulation en cours

### Données récupérées
- `missionId` : ID de la mission depuis les paramètres de navigation
- `profile` : Profil utilisateur depuis `useUserStore`
- `mission` : Données de la mission depuis `availableMissions`
- `isAlreadyApplied` : Vérification si l'utilisateur a déjà postulé
- `tabBarHeight` : Hauteur de la barre d'onglets pour l'adaptation du padding

## Logique métier

### Récupération de la mission
```typescript
useEffect(() => {
  if (mission) {
    setActiveMission(mission);
    setLoading(false);
  } else {
    setLoading(false);
  }
}, [missionId, mission]);
```

### Postulation à la mission
```typescript
const handleApply = async () => {
  if (!profile) return Alert.alert("Erreur", "Connectez-vous pour postuler.");
  setApplying(true);
  try {
    const { error } = await supabase
      .from('mission_applications')
      .insert([{ mission_id: missionId, nurse_id: profile.id }]);
    if (error) throw error;
    await fetchUserApplications(profile.id);
    Alert.alert("Succès", "Votre candidature a été envoyée !");
  } catch (e) {
    Alert.alert("Erreur", "Impossible d'envoyer la candidature.");
  } finally {
    setApplying(false);
  }
};
```

### Ouverture de l'application de cartes
```typescript
const handleOpenMaps = () => {
  if (mission?.lat && mission?.lng) {
    const label = encodeURIComponent(mission.facility_name);
    const url = Platform.OS === 'ios' 
      ? `maps://app?daddr=${mission.lat},${mission.lng}&q=${label}`
      : `google.navigation:q=${mission.lat},${mission.lng}`;
    Linking.openURL(url);
  }
};
```

### Calcul du prix total
```typescript
const totalEstimated = (mission.hourly_rate || 0) * (mission.estimated_duration_hours || 0);
```

## Interface utilisateur

### Structure principale
```
SafeAreaView
└── ScrollView (contenu principal)
│   ├── Header de navigation (bouton retour + badge statut)
│   ├── Section héro (icône, nom, tags)
│   ├── Ligne d'infos rapides (durée, taux, trajet)
│   ├── Section horaires du shift
│   ├── Section description de la prestation
│   ├── Badge B2B
│   └── Section localisation (adresse cliquable)
│
└── Footer fixe
    ├── Prix total estimé
    └── Bouton de postulation
```

### Sections détaillées

#### 1. Header de navigation
- Bouton retour avec design élégant (ombre portée)
- Badge de statut de la mission (vert si disponible)

#### 2. Section héro
- Icône adaptative selon le type d'établissement
- Nom de l'établissement en grand
- Tags pour le département et la spécialité

#### 3. Infos rapides
- **Durée** : Nombre d'heures estimées
- **Taux** : Taux horaire en €/h
- **Trajet** : Distance en km (cliquable pour ouvrir les cartes)

#### 4. Horaires du shift
- Date formatée en français ("Lundi 12 janvier")
- Heure de début formatée
- Design en boîte avec bordures subtiles

#### 5. Description
- Texte descriptif de la prestation
- Bordure gauche colorée pour mise en évidence
- Badge B2B pour indiquer le type de contrat

#### 6. Localisation
- Adresse de l'établissement
- Icône chevron pour indiquer l'action possible
- Ouvre l'application de cartes au clic

#### 7. Footer fixe
- Calcul du total estimé (taux × durée)
- Bouton de postulation avec états (normal, chargement, déjà postulé)

## Design System

### Palette de couleurs
- **Couleur primaire** : `#6366f1` (indigo)
- **Arrière-plan** : `#FFFFFF` (blanc)
- **Cartes et sections** : `#f8fafc` (gris très clair)
- **Textes principaux** : `#1e293b` (gris très foncé)
- **Textes secondaires** : `#64748b` (gris moyen)
- **Textes labels** : `#94a3b8` (gris clair)
- **Badge disponible** : `#dcfce7` (vert clair) / `#16a34a` (texte)
- **Bouton postuler** : `#6366f1` (indigo) → `#94a3b8` (gris si déjà postulé)

### Typographie
- **Nom établissement** : 24px, poids 800
- **Titres de sections** : 18px, poids 700
- **Textes descriptifs** : 15px, line-height 24px
- **Valeurs infos** : 14px, poids 700
- **Labels** : 11-12px, poids 600
- **Prix total** : 22px, poids 800
- **Bouton** : 16px, poids 700

### Icônes
- **Ionicons** : Pour les actions et états
- **MaterialCommunityIcons** : Pour les types d'établissements
- Taille cohérente (20-24px pour les actions, 50px pour l'icône principale)

## Expérience utilisateur

### États d'interface
1. **Chargement** : Indicateur d'activité en plein écran
2. **Erreur** : Message d'erreur avec bouton de retour
3. **Données complètes** : Affichage de toutes les informations
4. **Postulation** : Indicateur pendant l'envoi, feedback de succès/erreur
5. **Déjà postulé** : Bouton désactivé avec état visuel différent

### Interactions
- **Navigation** : Bouton retour natif avec effet de profondeur
- **Géolocalisation** : Ouverture de l'application de cartes adaptée à l'OS
- **Postulation** : Processus en un clic avec confirmation
- **Scroll** : Adaptation du padding pour la barre d'onglets

### Feedback
- Alertes pour les succès et erreurs
- États visuels clairs pour les boutons
- Animations subtiles sur les interactions

## Points techniques

### Adaptation à la barre d'onglets
```typescript
const tabBarHeight = useBottomTabBarHeight();
// Utilisé pour le padding du ScrollView et la position du footer
```

### Formatage des dates
```typescript
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
// Formatage en français avec localisation
```

### Géolocalisation cross-platform
```typescript
const url = Platform.OS === 'ios' 
  ? `maps://app?daddr=${mission.lat},${mission.lng}&q=${label}`
  : `google.navigation:q=${mission.lat},${mission.lng}`;
```

### Gestion des erreurs
- Mission introuvable avec bouton de retour
- Erreurs de connexion avec messages utilisateur
- Fallback pour les données manquantes

## Évolutions potentielles

1. **Favoris** : Ajouter aux favoris pour consultation ultérieure
2. **Partage** : Partager la mission avec des collègues
3. **Questions** : Formulaire de questions à l'établissement
4. **Évaluations** : Voir les avis sur l'établissement
5. **Documents** : Accès aux documents requis (protocoles, etc.)
6. **Contact** : Méthode de contact direct avec l'établissement
7. **Calendrier** : Ajouter au calendrier personnel
8. **Notifications** : Alertes pour les missions similaires
9. **Mode hors-ligne** : Cache des détails consultés
10. **Accessibilité** : Améliorations pour les lecteurs d'écran

---

*Cet écran offre une présentation complète et professionnelle des détails d'une mission avec une attention particulière à l'expérience utilisateur et aux fonctionnalités pratiques.*