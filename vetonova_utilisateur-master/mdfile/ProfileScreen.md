# Fichier `ProfileScreen.tsx` - Écran de profil utilisateur

## Description
Ce composant React Native/Expo représente l'écran de profil personnel de l'infirmier. Il permet de gérer les informations professionnelles, les préférences d'application, et d'accéder aux différentes fonctionnalités liées au compte.

## Fonctionnalités principales
- Affichage du profil utilisateur avec photo
- Gestion des préférences (notamment activation/désactivation du mode carte)
- Modification du taux horaire B2B
- Accès aux documents professionnels et informations de paiement
- Système de notifications toast animées
- Déconnexion sécurisée

## Dépendances
```typescript
import { supabase } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/useUserStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Banknote,
  Bell,
  CalendarDays,
  Camera,
  ChevronRight,
  FileText,
  LogOut,
  Map as MapIcon,
  Settings,
  Stethoscope,
  Zap
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Animated, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
```

## État et données

### États locaux
- `isUpdating` : État de mise à jour des préférences
- `toastVisible` : Visibilité du toast de notification
- `toastConfig` : Configuration du toast (message, icône)

### Données récupérées des stores
- `profile` : Profil utilisateur depuis `useUserStore`
- `setProfile` : Fonction pour mettre à jour le profil

### Animation
- `translateY` : Référence animée pour l'animation du toast

## Logique métier

### Système de notifications Toast
```typescript
const showToast = (message: string, isEnabled: boolean) => {
  setToastConfig({
    message,
    icon: MapIcon
  });
  setToastVisible(true);
  
  // Animation d'entrée (spring)
  Animated.spring(translateY, {
    toValue: 50,
    useNativeDriver: true,
    tension: 20,
    friction: 7
  }).start();

  // Fermeture automatique après 3 secondes
  setTimeout(() => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true
    }).start(() => setToastVisible(false));
  }, 3000);
};
```

### Gestion du mode carte
```typescript
const toggleMapVisibility = async (value: boolean) => {
  if (isUpdating) return;
  
  setIsUpdating(true);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ show_map: value })
      .eq('id', profile?.id)
      .select()
      .single();

    if (error) throw error;
    
    setProfile(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Affichage du toast de confirmation
    showToast(
      value ? "Onglet Carte activé avec succès !" : "Onglet Carte désactivé",
      value
    );

  } catch (error) {
    Alert.alert("Erreur", "Impossible de mettre à jour vos préférences.");
  } finally {
    setIsUpdating(false);
  }
};
```

### Modification du taux horaire
```typescript
const handleUpdateRate = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  Alert.prompt(
    "Modifier mon tarif",
    "Entrez votre nouveau taux horaire B2B (€/h)",
    [
      { text: "Annuler", style: "cancel" },
      {
        text: "Enregistrer",
        onPress: async (newRate) => {
          if (!newRate || isNaN(Number(newRate))) return;
          try {
            const { data, error } = await supabase
              .from('profiles')
              .update({ hourly_rate: parseFloat(newRate) })
              .eq('id', profile?.id)
              .select()
              .single();
            if (error) throw error;
            setProfile(data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            Alert.alert("Erreur", "Impossible de mettre à jour le tarif.");
          }
        }
      }
    ],
    'plain-text',
    profile?.hourly_rate?.toString(),
    'number-pad'
  );
};
```

### Déconnexion
```typescript
const handleSignOut = async () => {
  Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
    { text: "Annuler", style: "cancel" },
    { 
      text: "Déconnexion", 
      style: "destructive", 
      onPress: async () => {
        await supabase.auth.signOut();
        router.replace('/(auth)/welcome');
      } 
    }
  ]);
};
```

## Composants réutilisables

### MenuOption
```typescript
const MenuOption = ({ icon: Icon, title, subtitle, color, onPress, isLast = false, rightElement }: any) => (
  <TouchableOpacity 
    style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]} 
    onPress={onPress}
    disabled={!!rightElement && !onPress}
  >
    <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
      <Icon size={20} color={color} />
    </View>
    <View style={styles.menuText}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement ? rightElement : <ChevronRight size={18} color="#cbd5e1" />}
  </TouchableOpacity>
);
```

## Interface utilisateur

### Structure principale
```
SafeAreaView
└── ScrollView
    ├── Toast animé (conditionnel)
    ├── Header avec dégradé
    │   ├── Avatar utilisateur avec badge d'édition
    │   ├── Nom complet
    │   └── Badge "Infirmier Diplômé d'État"
    ├── Cartes de statistiques (3 colonnes)
    │   ├── Missions complétées
    │   ├── Total heures
    │   └── Gains du mois
    ├── Section "Ma Profession"
    │   └── Carte avec options :
    │       ├── Mon Tarif B2B (avec édition)
    │       ├── Mes Documents
    │       ├── Paiements & IBAN
    │       └── Mon Planning
    ├── Section "Préférences & App"
    │   └── Carte avec options :
    │       ├── Mode Carte (switch)
    │       ├── Notifications
    │       └── Paramètres
    ├── Bouton de déconnexion
    └── Version de l'application
```

### Design System

#### Palette de couleurs
- **Couleur primaire** : `#6366f1` → `#4f46e5` (dégradé header)
- **Arrière-plan** : `#F8FAFC` (gris très clair)
- **Cartes et éléments** : `#fff` (blanc)
- **Textes titres** : `#1e293b` (gris très foncé)
- **Textes secondaires** : `#94a3b8` (gris moyen)
- **Toast** : `#1e293b` (fond) avec texte blanc
- **Déconnexion** : `#ef4444` (rouge)

#### Typographie
- **Nom utilisateur** : 24px, poids 800
- **Titres de sections** : 13px, poids 800, uppercase
- **Titres menu** : 16px, poids 700
- **Sous-titres menu** : 12px, poids 500
- **Statistiques** : 20px, poids 900

#### Effets visuels
- **Dégradés** : Header et boutons d'action
- **Ombres** : Cartes de statistiques et éléments flottants
- **Bordures** : Subtiles pour séparer les sections
- **Animations** : Toast avec spring et timing

## Expérience utilisateur

### Feedback haptique
- Impact léger lors du toggle du mode carte
- Impact moyen lors de la modification du tarif
- Notification de succès après actions réussies

### Interactions
- **Avatar** : Badge d'édition pour modifier la photo
- **Tarif B2B** : Prompt pour modification avec clavier numérique
- **Mode Carte** : Switch avec feedback visuel et haptique
- **Déconnexion** : Confirmation avec Alert

### Éléments d'interface
1. **Toast animé** : Notifications non-intrusives en haut de l'écran
2. **Cartes de statistiques** : Positionnées en overlay sur le header
3. **MenuOption** : Composant réutilisable pour les items de menu
4. **Badge professionnel** : Indicateur de statut dans le header

## Points techniques

### Animation du Toast
- Utilisation de `Animated.spring` pour l'entrée (effet rebond)
- Utilisation de `Animated.timing` pour la sortie
- Gestion automatique de la visibilité (3 secondes)

### Gestion des couleurs
- Transparence hexadécimale (`color + '15'` pour 8% d'opacité)
- Dégradés linéaires pour les éléments visuels importants

### Sécurité
- Déconnexion avec confirmation
- Mise à jour sécurisée via Supabase avec validation des données
- Redirection vers l'écran d'accueil après déconnexion

## Améliorations potentielles

1. **Édition de l'avatar** : Intégration avec la galerie ou l'appareil photo
2. **Thème sombre** : Support du mode sombre
3. **Langues** : Support multi-langues
4. **Statistiques avancées** : Graphiques des gains/missions
5. **Backup des données** : Export des informations professionnelles
6. **Authentification à deux facteurs** : Renforcement de la sécurité
7. **Intégration calendrier** : Synchronisation avec Google Calendar/Apple Calendar

---

*Cet écran de profil offre une interface professionnelle et complète pour la gestion du compte infirmier, avec un design moderne et des interactions soignées.*