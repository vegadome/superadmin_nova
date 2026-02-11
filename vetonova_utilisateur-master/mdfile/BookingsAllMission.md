# Fichier `BookingsAllMission.tsx` - Écran des réservations et historiques

## Description
Ce composant React Native/Expo représente l'écran de gestion complète des missions de l'infirmier. Il regroupe toutes les postulations dans différentes catégories (confirmées, en attente, archivées) avec un système de filtrage mensuel et des fonctionnalités d'exportation.

## Fonctionnalités principales
- Vue consolidée de toutes les missions postulées
- Filtrage par statut (confirmées, en attente, archivées)
- Filtrage temporel des archives par mois
- Calcul automatique des gains mensuels
- Export PDF des prestations mensuelles
- Navigation vers les détails des missions terminées

## Dépendances
```typescript
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/useUserStore';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, CheckCircle2, Timer, Archive, Filter, FileText, Download } from 'lucide-react-native';
```

## État et données

### États locaux
- `applications` : Liste complète des postulations
- `loading` : État de chargement initial
- `selectedMonth` : Mois sélectionné pour le filtre des archives (format "YYYY-MM")

### Données récupérées des stores
- `profile` : Profil utilisateur depuis `useUserStore`

## Logique métier

### Récupération des données
```typescript
const fetchMyBookings = async () => {
  if (!profile) return;
  setLoading(true);
  
  const { data, error } = await supabase
    .from('mission_applications')
    .select(`
      id,
      status,
      created_at,
      missions (
        id,
        facility_name,
        specialty,
        hourly_rate,
        status,
        start_at,
        end_at
      )
    `)
    .eq('nurse_id', profile.id)
    .order('created_at', { ascending: false });

  if (data) setApplications(data);
  setLoading(false);
};
```

### Filtrage des missions
```typescript
const confirmedMissions = applications.filter(app => 
  app.status === 'accepted' && app.missions.status !== 'completed'
);

const pendingMissions = applications.filter(app => 
  app.status === 'pending'
);

const completedMissions = useMemo(() => {
  return applications.filter(app => {
    const isDone = app.missions.status === 'completed' || app.status === 'completed';
    const missionMonth = app.missions.start_at?.slice(0, 7);
    return isDone && (!selectedMonth || missionMonth === selectedMonth);
  });
}, [applications, selectedMonth]);
```

### Calcul des gains mensuels
```typescript
const monthlyEarnings = useMemo(() => {
  return completedMissions.reduce((acc, app) => 
    acc + (app.missions.hourly_rate * 8), 0
  ).toFixed(2);
}, [completedMissions]);
```

### Génération des options de mois
```typescript
const monthOptions = useMemo(() => {
  const options = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    options.push({
      label: d.toLocaleDateString('fr-FR', { month: 'short' }),
      fullLabel: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      value: d.toISOString().slice(0, 7)
    });
  }
  return options;
}, []);
```

### Export PDF
```typescript
const handleExportPDF = () => {
  const monthName = monthOptions.find(m => m.value === selectedMonth)?.fullLabel;
  Alert.alert(
    "Export PDF",
    `Voulez-vous générer le récapitulatif de vos prestations pour ${monthName} ?`,
    [
      { text: "Annuler", style: "cancel" },
      { 
        text: "Générer & Envoyer", 
        onPress: () => Alert.alert("Succès", "Le document a été généré et envoyé à votre adresse e-mail.") 
      }
    ]
  );
};
```

## Composants

### MissionItem
Composant réutilisable pour afficher une mission avec ses détails
```typescript
function MissionItem({ mission, status, onPress }: { 
  mission: any, 
  status: string, 
  onPress: () => void 
}) {
  const isAccepted = status === 'accepted';
  const isCompleted = status === 'completed';
  
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.card, 
        isAccepted && styles.cardAccepted,
        isCompleted && styles.cardCompleted,
        pressed && { opacity: 0.8 }
      ]}
    >
      {/* Structure de la carte mission */}
    </Pressable>
  );
}
```

## Interface utilisateur

### Structure principale
```
SafeAreaView
└── ScrollView
    ├── Header avec titre et bouton d'export
    │
    ├── Section "À venir"
    │   └── Liste des missions confirmées non terminées
    │       └── MissionItem (bordure verte)
    │
    ├── Section "En attente"
    │   └── Liste des missions en attente de validation
    │       └── MissionItem (bordure orange)
    │
    ├── Section "Archives" (avec fond gris clair)
    │   ├── En-tête avec sélecteur de mois (6 derniers mois)
    │   ├── Bannière des gains mensuels (conditionnelle)
    │   └── Liste des missions terminées
    │       └── MissionItem (avec prix et navigation)
    │
    └── Espace de padding
```

### États d'affichage
1. **Chargement** : Indicateur d'activité en plein écran
2. **Listes vides** : Messages d'état spécifiques à chaque section
3. **Données disponibles** : Affichage des missions par catégorie

## Design System

### Palette de couleurs
- **Couleur primaire** : `#6366f1` (indigo)
- **Arrière-plan principal** : `#F8FAFC` (gris très clair)
- **Section archives** : `#F1F5F9` (gris clair)
- **Textes titres** : `#0f172a` (gris très foncé)
- **Textes secondaires** : `#64748b` (gris moyen)
- **Badges** : 
  - Confirmé : `#dcfce7` (vert clair) / `#166534` (texte)
  - En attente : `#fef3c7` (jaune clair) / `#92400e` (texte)
  - Terminé : `#f1f5f9` (gris clair) / `#64748b` (texte)

### Composants visuels
- **Cartes missions** : Fond blanc avec bordures colorées selon le statut
- **Sélecteur de mois** : Chips horizontales avec état actif
- **Bannière gains** : Encart avec bordure gauche colorée
- **Bouton export** : Badge avec icône et texte

### Typographie
- **Titre principal** : 32px, poids 900
- **Titres de sections** : 13px, poids 800, uppercase
- **Noms établissements** : 16px, poids 700
- **Spécialités** : 13px, poids 600, couleur primaire
- **Détails** : 13px, poids 500, gris moyen

## Navigation et interactions

### Navigation depuis les missions terminées
```typescript
onPress={() => router.push({
  pathname: "/booking/mission-summary",
  params: { 
    facility: app.missions.facility_name,
    earnings: (app.missions.hourly_rate * 8).toFixed(2),
    duration: "Prestation effectuée"
  }
})}
```

### Sélection du mois
- Scroll horizontal sur les 6 derniers mois
- Mise à jour automatique de la liste filtrée
- Recalcul des gains mensuels

### Export PDF
- Bouton conditionnel (uniquement si missions terminées)
- Confirmation avec Alert
- Simulation d'envoi par email

## Points d'attention

### Performance
- Utilisation de `useMemo` pour les calculs de filtrage et de gains
- Mise en cache des options de mois
- Pagination virtuelle via ScrollView

### Expérience utilisateur
- Feedback visuel au press des cartes (opacity)
- Indicateurs de statut clairs (couleurs et icônes)
- Messages d'état informatifs pour les listes vides
- Interface adaptative aux différentes données

### Gestion des données
- Jointure Supabase pour récupérer les missions associées
- Filtrage côté client pour la performance
- Formatage des dates en français

## Évolutions potentielles

1. **Filtres avancés** : Par établissement, spécialité, gain minimum
2. **Recherche textuelle** : Dans les noms d'établissements
3. **Graphiques** : Visualisation des gains par mois
4. **Synchronisation** : Pull-to-refresh pour les nouvelles missions
5. **Notifications** : Alertes pour les changements de statut
6. **Partage** : Partage des prestations mensuelles
7. **Mode détaillé** : Vue calendrier des missions
8. **Statistiques** : Temps moyen par mission, établissements fréquentés

---

*Cet écran offre une vue complète et professionnelle de l'activité de l'infirmier avec un accent sur la gestion financière et l'historique des missions.*