# Fichier `MissionSummaryScreen.tsx` - Écran de synthèse de mission

## Description
Ce composant React Native/Expo représente l'écran de confirmation et de synthèse affiché après la fin d'une mission. Il résume les informations clés de la prestation effectuée et guide l'utilisateur vers l'écran d'accueil.

## Fonctionnalités principales
- Affichage des informations récapitulatives de la mission
- Confirmation visuelle de la fin de mission
- Présentation des gains estimés
- Message d'information sur la sécurité des données
- Navigation de retour vers l'accueil

## Dépendances
```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
```

## Données

### Paramètres de navigation
Les informations sont passées via les paramètres de navigation :
- `facility` : Nom de l'établissement
- `duration` : Durée de la prestation
- `earnings` : Gains estimés

### Récupération des paramètres
```typescript
const { facility, duration, earnings } = useLocalSearchParams();
```

## Interface utilisateur

### Structure principale
```
SafeAreaView
└── View (contenu centré)
    ├── Icône de succès animée (dégradé vert)
    ├── Titre principal "Vacation terminée !"
    ├── Sous-titre de confirmation
    ├── Conteneur de statistiques
    │   ├── Carte "Durée" (avec icône horloge)
    │   └── Carte "Gains estimés" (mise en évidence)
    ├── Boîte d'information (sécurité données)
    └── Bouton principal "Retour à l'accueil"
```

### Composants visuels

#### Icône de succès
- Dégradé linéaire vert (`#10b981` → `#059669`)
- Cercle de 120px avec ombre portée
- Icône checkmark blanche (60px)

#### Cartes de statistiques
1. **Durée** :
   - Icône : `clock-outline`
   - Fond : `#f8fafc` (gris très clair)
   - Bordure : `#f1f5f9`

2. **Gains estimés** :
   - Icône : `cash`
   - Fond : `#f0fdf4` (vert très clair)
   - Bordure : `#dcfce7`
   - Texte en vert (`#10b981`)

#### Boîte d'information
- Icône `information-circle-outline`
- Fond : `#f1f5f9` (gris clair)
- Texte explicatif sur la sécurité des données

#### Bouton principal
- Fond noir (`#0f172a`)
- Texte blanc
- Arrondi 18px
- Pleine largeur

## Design System

### Palette de couleurs
- **Succès** : `#10b981` → `#059669` (dégradé vert)
- **Arrière-plan** : `#fff` (blanc pur)
- **Textes principaux** : `#0f172a` (gris très foncé)
- **Textes secondaires** : `#64748b` (gris moyen)
- **Textes labels** : `#94a3b8` (gris clair)
- **Accent primaire** : `#6366f1` (indigo pour l'icône durée)

### Typographie
- **Titre** : 28px, poids 900
- **Sous-titre** : 16px, line-height 24px
- **Valeurs statistiques** : 20px, poids 800
- **Labels** : 12px, poids 700, uppercase
- **Texte info** : 13px, line-height 18px
- **Bouton** : 16px, poids 700

### Espacement et dimensions
- **Padding contenu** : 30px
- **Espacement vertical** : Marges progressives (30px, 40px)
- **Cartes statistiques** : Flexibles avec gap de 15px
- **Icône succès** : 120x120px, rayon 60px
- **Bouton principal** : Hauteur 18px de padding vertical

## Navigation

### Flux utilisateur
```
Fin de mission → MissionSummaryScreen → Retour à l'accueil
```

### Action du bouton principal
```typescript
onPress={() => router.replace('/(tabs)/home')}
```
- Utilisation de `replace` pour empêcher le retour à cet écran
- Redirection vers l'onglet d'accueil principal

## Messages et contenu

### Titre et sous-titre
- **Titre** : "Vacation terminée !" (ton positif et conclusif)
- **Sous-titre** : Confirmation de transmission du rapport avec nom de l'établissement

### Message de sécurité
```typescript
"L'accès aux données patients a été révoqué conformément au protocole de sécurité."
```
- Met en avant les mesures de protection des données
- Rassure sur la conformité réglementaire
- Justifie la fin d'accès aux informations patients

### Labels
- **Durée** : "Durée" (format libre, ex: "8h00")
- **Gains** : "Gains estimés" (précision sur le caractère estimatif)

## Expérience utilisateur

### Feedback visuel
- Icône de succès proéminente avec effet de profondeur
- Hiérarchie visuelle claire (titre → sous-titre → statistiques → action)
- Contraste suffisant pour la lisibilité
- États interactifs implicites (bouton unique)

### Clarté de l'information
- Données essentielles uniquement
- Regroupement logique des informations
- Texte concis et actionnable

### Navigation intuitive
- Une seule action possible (retour à l'accueil)
- Pas de confusion sur les étapes suivantes
- Flux linéaire et prévisible

## Points techniques

### Composants Expo
- `LinearGradient` : Pour l'effet visuel sur l'icône
- `Ionicons` / `MaterialCommunityIcons` : Bibliothèque d'icônes cohérente
- `useLocalSearchParams` : Récupération des paramètres de navigation

### Accessibilité
- Contrastes suffisants pour le texte
- Taille de texte appropriée
- Labels descriptifs pour les icônes
- Action unique évidente

### Responsive design
- Layout basé sur flexbox
- Dimensions proportionnelles
- Adaptable à différentes tailles d'écran

## Évolutions potentielles

1. **Détails supplémentaires** : Date, service spécifique, coordonnées établissement
2. **Options de partage** : Partager le récapitulatif
3. **Évaluation** : Demander un feedback sur la mission
4. **Documentation** : Lien vers la facture ou le rapport détaillé
5. **Prochaine étape** : Suggestions de missions similaires
6. **Animation** : Effet de confetti ou animation du checkmark
7. **Personnalisation** : Message personnalisé selon l'établissement
8. **Statistiques** : Comparaison avec les missions précédentes

---

*Cet écran de synthèse offre une conclusion satisfaisante à l'expérience de mission avec un design épuré, des informations clés et une transition fluide vers l'écran d'accueil.*