# Fichier `PatientsScreen.tsx` - Écran de gestion des patients

## Description
Ce composant React Native/Expo représente l'écran de gestion des patients accessible aux infirmiers pendant une mission active. Il permet de consulter la liste des patients d'un établissement de santé après validation de la candidature.

## Fonctionnalités principales
- Vérification des autorisations d'accès aux données patients
- Recherche de patients par nom ou NISS (numéro de sécurité sociale)
- Affichage de la liste des patients avec accès à leur dossier médical
- Interface pour terminer une mission en cours
- Système de rafraîchissement manuel des données

## Dépendances
```typescript
import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  ActivityIndicator, 
  TextInput, 
  RefreshControl,
  Alert 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMissionStore } from '@/src/store/useMissionStore';
import { useUserStore } from '@/src/store/useUserStore';
import { supabase } from '@/src/lib/supabase';
```

## État et données

### États locaux
- `isLoading` : État de chargement des patients
- `isVerifying` : État de vérification des autorisations
- `isAuthorized` : Statut d'autorisation d'accès aux patients
- `searchQuery` : Terme de recherche pour filtrer les patients
- `refreshing` : État de rafraîchissement manuel

### Données récupérées des stores
- `profile` : Profil utilisateur depuis `useUserStore`
- `activeMission` : Mission actuellement en cours
- `patientsInFacility` : Liste des patients de l'établissement

## Logique métier

### Vérification d'autorisation
```typescript
const checkAuthorization = async () => {
  if (!activeMission || !profile) {
    setIsAuthorized(false);
    setIsVerifying(false);
    return;
  }

  try {
    const { data, error } = await supabase
      .from('mission_applications')
      .select('status')
      .eq('mission_id', activeMission.id)
      .eq('nurse_id', profile.id)
      .single();

    if (data && data.status === 'accepted') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  } catch (err) {
    console.error("Erreur vérification accès:", err);
    setIsAuthorized(false);
  } finally {
    setIsVerifying(false);
  }
};
```

### Chargement des données
```typescript
const loadData = async () => {
  await checkAuthorization();
  
  if (activeMission?.requester_id && isAuthorized) {
    setIsLoading(true);
    try {
      await fetchPatientsForMission(activeMission.requester_id);
    } catch (error) {
      console.error("Erreur sync patients:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }
};
```

### Filtrage des patients
```typescript
const filteredPatients = useMemo(() => {
  return patientsInFacility.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.niss?.includes(searchQuery)
  );
}, [patientsInFacility, searchQuery]);
```

### Fin de mission
```typescript
const handleConfirmEndMission = () => {
  const earnings = activeMission ? (activeMission.hourly_rate * 8).toFixed(2) : "0.00"; 
  const facilityName = activeMission?.facility_name;

  Alert.alert(
    "Terminer la vacation ?",
    "En validant, vous n'aurez plus accès aux dossiers médicaux.",
    [
      { text: "Continuer", style: "cancel" },
      { 
        text: "Terminer", 
        style: "destructive", 
        onPress: () => {
          endMission();
          router.push({
            pathname: "/booking/mission-summary",
            params: { 
              facility: facilityName,
              earnings: earnings,
              duration: "8h00"
            }
          }); 
        } 
      }
    ]
  );
};
```

## Interface utilisateur

### Structure principale
```
SafeAreaView
└── ScrollView (avec RefreshControl)
    ├── Header (nom établissement, statut)
    │   └── Badge de service/département
    ├── Barre de recherche (si autorisé)
    ├── Statistiques rapides (nombre patients)
    ├── Liste des patients filtrés OU
    │   ├── Indicateur de chargement
    │   ├── Carte patient (avatar, nom, NISS, bouton dossier)
    │   └── État vide si aucun résultat
    ├── Bouton "Fin de vacation" (dégradé rouge)
    │
    └── État "Accès verrouillé" (si non autorisé)
        ├── Icône de verrou
        ├── Explication
        └── Bouton "Voir mes missions"
```

### États d'interface conditionnels
1. **Vérification en cours** : Indicateur de chargement
2. **Accès autorisé** : Interface complète avec données patients
3. **Accès refusé** : Message explicatif avec redirection
4. **Aucun résultat** : État vide stylisé
5. **Chargement données** : Indicateur pendant le fetch

## Design System

### Palette de couleurs
- **Accent principal** : `#6366f1` (indigo)
- **Arrière-plan** : `#F8FAFC` (gris très clair)
- **Textes titres** : `#0f172a` (gris très foncé)
- **Textes secondaires** : `#64748b` (gris moyen)
- **État actif** : `#10b981` (vert pour le point pulsant)
- **Fin de mission** : Dégradé `#ef4444` → `#b91c1c` (rouge)

### Composants visuels
- **Cartes patients** : Fond blanc avec bordures subtiles `#F1F5F9`
- **Badges** : Arrière-plan coloré avec texte contrasté
- **Barre de recherche** : Champ stylisé avec icône intégrée
- **Boutons** : Dégradés linéaires pour les actions principales
- **Avatars patients** : Dégradé gris avec icône de personne

### Typographie
- **Titres principaux** : 32px, poids 900
- **Noms patients** : 17px, poids 700
- **Labels statistiques** : 12px, poids 600
- **Textes descriptifs** : 13-16px avec interligne adapté

## Sécurité et confidentialité

### Contrôles d'accès
1. Vérification en base de données du statut `accepted` dans `mission_applications`
2. Masquage complet des données patients si non autorisé
3. Messages explicatifs sur les raisons du refus d'accès

### Protection des données
- Affichage limité aux informations essentielles (nom, NISS)
- Accès au dossier médical complet via navigation séparée
- Terminaison de mission avec confirmation explicite

## Flux utilisateur

### Accès réussi
```
Vérification → Chargement patients → Recherche/filtrage → Consultation dossier → Fin de mission
```

### Accès refusé
```
Vérification → Message explicatif → Redirection vers écran missions
```

### Fin de mission
```
Confirmation Alert → Terminaison mission → Redirection vers récapitulatif
```

## Points d'attention

### Performance
- Utilisation de `useMemo` pour le filtrage des patients
- Rafraîchissement manuel sans rechargement complet
- Gestion propre des états de chargement

### Expérience utilisateur
- Feedback visuel pendant les opérations
- Messages d'erreur informatifs
- Interface adaptative aux différents états
- Navigation intuitive entre les écrans

### Évolutions potentielles
1. **Filtres avancés** : Par service, état de santé, etc.
2. **Synchronisation en temps réel** : WebSocket pour les nouvelles admissions
3. **Export de données** : Rapport de fin de mission
4. **Notifications** : Alertes pour cas urgents
5. **Mode hors-ligne** : Cache des dossiers consultés récemment

---

*Cet écran représente un module sécurisé d'accès aux données patients avec des contrôles d'autorisation stricts et une interface professionnelle adaptée au contexte médical.*