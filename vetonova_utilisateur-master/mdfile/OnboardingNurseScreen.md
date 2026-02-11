# Fichier `OnboardingNurseScreen.tsx` - Écran d'onboarding infirmier

## Description
Ce composant React Native/Expo représente le processus d'onboarding en 4 étapes pour les infirmiers souhaitant s'inscrire sur la plateforme. Il collecte toutes les informations nécessaires pour créer un profil professionnel complet et vérifié.

## Fonctionnalités principales
- Processus en 4 étapes avec barre de progression
- Validation en temps réel des données saisies (INAMI, TVA)
- Sélection des spécialités médicales avec feedback haptique
- Capture photo de la carte INAMI via l'appareil photo
- Configuration du taux horaire B2B et de la TVA
- Définition de la zone d'intervention géographique
- Upload sécurisé des documents vers Supabase Storage

## Dépendances
```typescript
import { supabase } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/useUserStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, Image,
  Keyboard,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
```

## État et données

### États de navigation
- `step` : Étape actuelle du processus (1-4)
- `loading` : État de chargement pendant la soumission finale

### Données des étapes

#### Étape 1 : Identité
- `fullName` : Nom complet de l'infirmier
- `inamiNumber` : Numéro INAMI (11 chiffres)
- `phoneNumber` : Numéro de téléphone

#### Étape 2 : Spécialités et configuration B2B
- `selectedSpecialties` : Liste des spécialités sélectionnées
- `hourlyRate` : Taux horaire B2B (défaut: 45€)
- `vatNumber` : Numéro de TVA (optionnel)

#### Étape 3 : Mobilité
- `radius` : Rayon d'intervention en km (défaut: 30)

#### Étape 4 : Photo
- `cardImage` : URI de la photo de la carte INAMI

### Données statiques
```typescript
const specialties = [
  { id: 'urg', name: 'Urgences / SIAMU', icon: 'flash' },
  { id: 'ger', name: 'Gériatrie / MRS', icon: 'heart' },
  { id: 'dom', name: 'Soins à domicile', icon: 'home' },
  { id: 'reanim', name: 'Réanimation', icon: 'pulse' },
  { id: 'bloc', name: 'Bloc Opératoire', icon: 'cut' },
];
```

## Logique métier

### Validation des données

#### Validation INAMI (algorithme belge)
```typescript
const validateINAMI = (inami: string) => {
  const cleanInami = inami.replace(/\D/g, '');
  if (cleanInami.length !== 11) return false;
  const base = parseInt(cleanInami.substring(0, 9));
  const checksum = parseInt(cleanInami.substring(9, 11));
  return (97 - (base % 97)) === checksum;
};
```

#### Validation numéro de TVA belge
```typescript
const validateVAT = (vat: string) => {
  if (!vat) return true; // Optionnel
  const b2bRegex = /^BE[01]\d{9}$/;
  return b2bRegex.test(vat.replace(/[\s.]/g, ''));
};
```

### Gestion des images
```typescript
const pickImage = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert("Permission requise", "L'accès à la caméra est nécessaire pour valider votre profil.");
    return;
  }

  let result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.7,
  });

  if (!result.canceled) {
    setCardImage(result.assets[0].uri);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};
```

### Navigation entre étapes
```typescript
const handleNextStep = () => {
  if (step === 1) {
    if (!fullName || !inamiNumber || !phoneNumber) {
      return Alert.alert("Données manquantes", "Veuillez remplir tous les champs.");
    }
    if (!validateINAMI(inamiNumber)) {
      return Alert.alert("Numéro INAMI invalide", "La clé de contrôle ou le format est incorrect.");
    }
  }
  setStep(step + 1);
};
```

### Finalisation de l'onboarding
```typescript
const handleFinish = async () => {
  if (!cardImage) {
    return Alert.alert("Preuve manquante", "Veuillez prendre une photo de votre carte INAMI.");
  }

  if (vatNumber && !validateVAT(vatNumber)) {
    return Alert.alert("Format TVA invalide", "Le format attendu est BE0XXXXXXXXX.");
  }

  setLoading(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Session expirée");

    const userId = session.user.id;

    // 1. Upload de l'image vers Supabase Storage
    const fileExt = cardImage.split('.').pop();
    const fileName = `${userId}/inami_card_${Date.now()}.${fileExt}`;
    
    const formData = new FormData();
    formData.append('file', {
      uri: cardImage,
      name: fileName,
      type: `image/${fileExt}`,
    } as any);

    const { error: uploadError } = await supabase.storage
      .from('inami-cards')
      .upload(fileName, formData);

    if (uploadError) throw uploadError;

    // 2. Mise à jour du profil avec statut non-vérifié par défaut
    const updates = {
      id: userId,
      full_name: fullName.trim(),
      phone_number: phoneNumber.trim(),
      inami_number: inamiNumber.replace(/\D/g, ''),
      vat_number: vatNumber.replace(/[\s.]/g, '').toUpperCase(),
      is_nurse: true,
      hourly_rate: parseFloat(hourlyRate), 
      specialties: selectedSpecialties,
      intervention_radius: parseInt(radius),
      inami_card_path: fileName,
      inami_verified: false,
      updated_at: new Date(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(updates)
      .select()
      .single();

    if (error) throw error;
    
    setProfile(data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
    
  } catch (e: any) {
    console.error("Erreur finalisation:", e);
    Alert.alert("Erreur", e.message);
  } finally {
    setLoading(false);
  }
};
```

## Interface utilisateur

### Structure principale
```
KeyboardAvoidingView (pour gérer le clavier)
└── TouchableWithoutFeedback (pour cacher le clavier)
    ├── Header avec progression
    │   ├── Barre de progression dynamique
    │   └── Indicateur d'étape
    │
    ├── ScrollView (contenu principal)
    │   └── Contenu conditionnel par étape
    │       ├── Étape 1 : Formulaire identité
    │       ├── Étape 2 : Spécialités et TVA
    │       ├── Étape 3 : Rayon d'intervention
    │       └── Étape 4 : Capture photo INAMI
    │
    └── Footer
        ├── Bouton principal (Continuer/Terminer)
        └── Lien "Retour" (si step > 1)
```

### Détails des étapes

#### Étape 1 : Identité
- Icône médicale
- Champs texte pour nom, téléphone, INAMI
- Validation visuelle de l'INAMI
- Texte d'aide contextuel

#### Étape 2 : Spécialités & TVA
- Grille de sélection des spécialités (2 colonnes)
- Configuration B2B (taux horaire)
- Champ pour le numéro de TVA avec validation
- Design en cartes interactives

#### Étape 3 : Mobilité
- Icône de navigation
- Carte avec champ pour le rayon d'action
- Affichage dynamique de la valeur

#### Étape 4 : Preuve INAMI
- Icône appareil photo
- Instructions claires
- Zone de capture photo avec preview
- Option pour reprendre la photo

## Design System

### Palette de couleurs
- **Couleur principale** : `#3b82f6` (bleu)
- **Arrière-plan** : `#F8FAFC` (gris très clair)
- **Textes principaux** : `#1e293b` (gris très foncé)
- **Textes secondaires** : `#64748b` (gris moyen)
- **Cartes et inputs** : `#fff` (blanc) avec bordure `#e2e8f0`
- **Bouton principal** : Dégradé `#3b82f6` → `#2563eb`
- **Erreurs** : `#ef4444` (rouge) avec fond `#fef2f2`
- **Spécialité active** : Bordure bleue avec fond `#f0f9ff`

### Typographie
- **Titres** : 24px, poids 800, centré
- **Labels** : 14px, poids 700
- **Sous-labels** : 10px, poids 800, uppercase, letter-spacing
- **Textes d'aide** : 12-14px, gris moyen
- **Bouton** : 18px, poids 700, blanc

### Composants visuels
- **Barre de progression** : Dynamique avec couleur bleue
- **Cartes spécialités** : Grille 2 colonnes avec états actif/inactif
- **Zone photo** : Bordure en pointillés avec placeholder
- **Bouton principal** : Dégradé linéaire avec coins arrondis

## Expérience utilisateur

### Feedback haptique
- `Haptics.selectionAsync()` : Sélection des spécialités
- `Haptics.notificationAsync()` : Photo prise avec succès, fin d'onboarding

### Gestion du clavier
- `KeyboardAvoidingView` : Adaptation selon la plateforme
- `TouchableWithoutFeedback` : Fermeture du clavier au tap extérieur

### Validation en temps réel
- Bordure rouge pour les champs invalides
- Messages d'erreur contextuels
- Validation INAMI et TVA côté client

### Navigation intuitive
- Indicateur de progression clair
- Bouton retour conditionnel
- Texte du bouton adaptatif ("Continuer"/"Terminer")

## Points techniques

### Upload d'image vers Supabase Storage
- Création d'un chemin unique par utilisateur
- Gestion des permissions camera
- Compression d'image (quality: 0.7)
- Upload via FormData avec type MIME approprié

### Sécurité des données
- Nettoyage des numéros (retrait des caractères non-numériques)
- Validation côté client pour réduire les requêtes serveur
- Statut `inami_verified: false` par défaut
- Stockage sécurisé des documents d'identité

### Gestion d'erreurs
- Permissions camera avec fallback
- Session utilisateur vérifiée
- Upload avec gestion d'erreur
- Messages d'erreur utilisateur-friendly

## Évolutions potentielles

1. **OCR INAMI** : Lecture automatique du numéro INAMI depuis la photo
2. **Pré-remplissage** : Récupération des données depuis une source officielle
3. **Multi-langues** : Support pour différentes langues
4. **Sauvegarde étape** : Reprendre l'onboarding plus tard
5. **Vérification en temps réel** : API pour vérifier la validité INAMI
6. **Tutoriel** : Guide visuel pour la prise de photo
7. **Prévisualisation profil** : Aperçu avant finalisation
8. **Intégration calendrier** : Définition des disponibilités
9. **Références** : Téléchargement de lettres de recommandation
10. **Signature électronique** : Acceptation des conditions

---

*Cet écran d'onboarding offre une expérience utilisateur fluide et professionnelle pour l'inscription des infirmiers, avec des validations robustes et une interface intuitive.*