# Fichier `LoginScreen.tsx` - Écran d'authentification

## Description
Ce composant React Native/Expo représente l'écran d'authentification universel de l'application NurseNova. Il permet la connexion et l'inscription pour deux types d'utilisateurs : les infirmiers indépendants (`nurse`) et les établissements de santé (`facility`).

## Fonctionnalités principales
- Authentification unique pour deux rôles distincts
- Interface adaptative selon le type d'utilisateur
- Inscription avec attribution automatique du rôle
- Connexion avec gestion automatique des sessions
- Interface utilisateur responsive avec gestion du clavier
- Design personnalisé selon le rôle

## Dépendances
```typescript
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
```

## État et données

### États locaux
- `email` : Adresse email saisie
- `password` : Mot de passe saisi
- `loading` : État de chargement pendant l'authentification
- `showPassword` : Visibilité du mot de passe (toggle)
- `isSignUp` : Mode inscription (défini par paramètre `signUp`)

### Paramètres de navigation
- `params.signUp` : Détermine si l'écran est en mode inscription (`true`) ou connexion
- `params.role` : Rôle de l'utilisateur (`nurse` ou `facility`), défaut: `facility`

### Initialisation des états
```typescript
const [isSignUp, setIsSignUp] = useState(params.signUp === 'true');
const role = params.role || 'facility'; // Rôles : 'nurse' ou 'facility'
```

## Logique métier

### Authentification
```typescript
const handleAuth = async () => {
  if (!email || !password) {
    Alert.alert('Champs requis', 'Veuillez remplir votre email et mot de passe.');
    return;
  }

  setLoading(true);
  try {
    if (isSignUp) {
      // Mode inscription
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: { data: { role: role } } // Attribution du rôle
      });
      if (error) throw error;
      if (!data?.session) {
        Alert.alert('Vérification', 'Vérifiez vos emails.');
        setLoading(false);
      }
    } else {
      // Mode connexion
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      if (error) throw error;
      // La redirection est gérée automatiquement par RootLayout
    }
  } catch (error: any) {
    setLoading(false); 
    Alert.alert('Erreur', error.message);
  }
};
```

### Points clés de l'authentification
1. **Inscription** : Crée un compte avec le rôle spécifié dans `user_metadata`
2. **Connexion** : Utilise `signInWithPassword` sans redirection manuelle
3. **Gestion des sessions** : Le `RootLayout` observe les changements de session et redirige automatiquement
4. **Validation** : Vérification basique des champs obligatoires

## Interface utilisateur

### Structure principale
```
View (container principal)
└── KeyboardAvoidingView (gestion du clavier)
    └── ScrollView (contenu scrollable)
        ├── Header Section
        │   ├── Logo circulaire avec dégradé
        │   ├── Titre "NurseNova"
        │   └── Sous-titre adaptatif selon rôle et mode
        │
        └── Form Container
            ├── Champ Email (avec icône)
            ├── Champ Mot de passe (avec icône et toggle)
            ├── Bouton principal (dégradé selon rôle)
            └── Bouton switch mode (inscription/connexion)
```

### Éléments adaptatifs

#### Logo et couleurs
- **Infirmier** (`role === 'nurse'`) :
  - Icône : `medical`
  - Couleur : `#3b82f6` (bleu)
  - Dégradé bouton : `['#3b82f6', '#2563eb']`
  - Bordure logo : `#3b82f633` (bleu transparent)

- **Établissement** (`role === 'facility`) :
  - Icône : `business`
  - Couleur : `#1e293b` (gris foncé)
  - Dégradé bouton : `['#1e293b', '#0f172a']`

#### Textes dynamiques
- **Sous-titre** :
  ```typescript
  {role === 'nurse' 
    ? 'Espace Infirmier Indépendant' 
    : (isSignUp ? 'Créez votre compte établissement' : 'Solutions de staffing médical B2B')
  }
  ```

- **Bouton principal** :
  ```typescript
  {loading ? 'Chargement...' : (isSignUp ? "Créer mon compte" : "Se connecter")}
  ```

- **Lien switch** :
  ```typescript
  {isSignUp ? "Déjà inscrit ? " : "Nouvel établissement ? "}
  ```

### Composants d'entrée

#### Champ Email
- Icône : `mail-outline`
- Placeholder : "Ex: sonya@gmail.be"
- Type clavier : `email-address`
- Auto-capitalization : `none`

#### Champ Mot de passe
- Icône : `lock-closed-outline`
- Placeholder : "••••••••"
- Toggle visibilité : icône `eye-outline` / `eye-off-outline`
- Secure text entry basculable

## Design System

### Palette de couleurs
- **Arrière-plan** : `#F8FAFC` (gris très clair)
- **Textes principaux** : `#0f172a` (gris très foncé)
- **Textes secondaires** : `#64748b` (gris moyen)
- **Labels** : `#1e293b` (gris foncé)
- **Placeholders** : `#cbd5e1` (gris clair)
- **Icônes** : `#94a3b8` (gris)
- **Cartes/inputs** : `#fff` (blanc) avec bordure `#e2e8f0`
- **Ombres** : Gris subtils avec touches de couleur selon le rôle

### Typographie
- **Titre** : 34px, poids 900, letter-spacing -1
- **Sous-titre** : 16px
- **Labels** : 14px, poids 700
- **Inputs** : 16px, poids 500
- **Bouton** : 18px, poids 700
- **Lien switch** : 15px

### Effets visuels
- **Logo circulaire** : Dégradé `['#f0f7ff', '#ffffff']` avec ombre portée
- **Inputs** : Élévation 2, ombre subtile, coins arrondis 18px
- **Bouton principal** : Élévation 8, ombre colorée selon rôle
- **Dégradés** : Linéaires pour les boutons et le logo

### Espacement et dimensions
- **Container** : Padding 24px
- **Inputs** : Hauteur 64px, padding horizontal 16px
- **Bouton** : Hauteur 64px, borderRadius 18px
- **Logo** : 90x90px, borderRadius 30px
- **Marges** : Cohérentes avec un système 8px de base

## Expérience utilisateur

### Gestion du clavier
- `KeyboardAvoidingView` : Adapte la hauteur selon la plateforme
- `ScrollView` : Permet le défilement sur petits écrans
- Retrait du clavier au tap en dehors des champs (géré par le parent)

### Feedback utilisateur
- **Validation** : Message d'alerte pour champs vides
- **Chargement** : Désactivation du bouton avec opacité réduite
- **Messages d'erreur** : Alertes avec description de l'erreur
- **Success** : Message de vérification email pour l'inscription

### Navigation fluide
- Switch entre inscription et connexion sans rechargement
- Redirection automatique après connexion réussie
- Interface adaptative selon le rôle

### Accessibilité
- Labels clairs pour tous les champs
- Toggle visibilité du mot de passe
- Contraste suffisant pour la lisibilité
- Taille de touche adéquate pour les interactions

## Points techniques

### Architecture d'authentification
1. **Supabase Auth** : Gestion complète des utilisateurs
2. **Rôles dans metadata** : Stocké dans `user_metadata.role`
3. **Redirection automatique** : Observateur de session dans RootLayout
4. **Séparation des flux** : Même écran pour deux rôles différents

### Gestion des erreurs
- Validation côté client des champs requis
- Capture des erreurs Supabase avec messages utilisateur-friendly
- Gestion propre des états de chargement

### Performance
- Évite les re-renders inutiles avec gestion d'état local
- Pas de requêtes supplémentaires après authentification
- Interface légère et rapide

## Évolutions potentielles

1. **SSO** : Connexion via Google, Apple, etc.
2. **Magic Link** : Connexion sans mot de passe
3. **Réinitialisation mot de passe** : Lien depuis cet écran
4. **Remember me** : Option "Se souvenir de moi"
5. **Validation email** : Vérification en temps réel du format
6. **Force mot de passe** : Indicateur de force du mot de passe
7. **Biométrie** : Authentification biométrique sur appareils supportés
8. **Multi-langues** : Support de plusieurs langues
9. **Dark mode** : Support du thème sombre
10. **Analytics** : Tracking des tentatives de connexion
11. **Rate limiting** : Protection contre les attaques par force brute
12. **CAPTCHA** : Protection supplémentaire pour l'inscription

---

*Cet écran d'authentification offre une expérience utilisateur moderne et sécurisée avec une interface adaptative selon le rôle de l'utilisateur et une intégration transparente avec Supabase Auth.*