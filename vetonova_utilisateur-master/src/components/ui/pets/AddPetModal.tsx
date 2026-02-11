import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { supabase } from '@/src/lib/supabase'; // Import Supabase
import { useUserStore } from '@/src/store/useUserStore'; // Import Store
import * as Haptics from 'expo-haptics';

const SPECIES = [
  { id: 'dog', label: 'Chien', icon: 'dog' },
  { id: 'cat', label: 'Chat', icon: 'cat' },
  { id: 'bird', label: 'Oiseau', icon: 'bird' },
  { id: 'rabbit', label: 'NAC', icon: 'rabbit' },
];

export default function AddPetModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const { profile, fetchUserPets } = useUserStore();
  const [selectedSpecies, setSelectedSpecies] = useState('dog');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Validation de base
    if (!name.trim()) {
      alert("Veuillez donner un nom à votre animal");
      return;
    }

    if (!profile?.id) {
      console.error("Profil non trouvé. Vérifiez la session utilisateur.");
      return;
    }

    setLoading(true);
    
    try {
      console.log("Envoi des données à Supabase...");
      
      const { data, error } = await supabase
        .from('pets')
        .insert([
          {
            owner_id: profile.id,
            name: name.trim(),
            species: selectedSpecies, // Vérifie que ton ENUM SQL accepte exactement 'dog', 'cat', etc.
            age: 0,
            weight: 0,
            medical_notes: breed.trim(), // On enregistre la race dans medical_notes selon ton schéma
          },
        ])
        .select(); // On force le retour pour vérifier que l'objet est créé

      if (error) {
        console.error('Détails erreur Supabase:', error);
        throw error;
      }

      console.log("Animal enregistré avec succès:", data);

      // Rafraîchir Zustand
      await fetchUserPets(profile.id);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset & Fermeture
      setName('');
      setBreed('');
      onClose();
      
    } catch (error: any) {
      console.error('Erreur handleSave:', error.message);
      alert(`Erreur: ${error.message || 'Impossible d’enregistrer'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Nouvel Animal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Espèce</Text>
            <View style={styles.speciesGrid}>
              {SPECIES.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.speciesItem,
                    selectedSpecies === s.id && styles.selectedSpeciesItem
                  ]}
                  onPress={() => setSelectedSpecies(s.id)}
                >
                  <MaterialCommunityIcons 
                    name={s.icon as any} 
                    size={32} 
                    color={selectedSpecies === s.id ? "#6366f1" : "#94a3b8"} 
                  />
                  <Text style={[
                    styles.speciesLabel,
                    selectedSpecies === s.id && styles.selectedSpeciesLabel
                  ]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.sectionLabel}>Nom de l'animal</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Ex: Rex, Pixel..."
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.sectionLabel}>Race</Text>
                <TextInput 
                  style={styles.input}
                  placeholder="Ex: Golden Retriever, Siamois..."
                  placeholderTextColor="#94a3b8"
                  value={breed}
                  onChangeText={setBreed}
                />
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.saveButton, loading && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer l'animal</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ... styles identiques

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, 
  },
  footer: {
   
    paddingBottom: 110, 
    paddingHorizontal: 24,
    marginTop: 20,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  speciesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  speciesItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSpeciesItem: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  speciesLabel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
  selectedSpeciesLabel: { color: '#6366f1' },
  form: { gap: 20, marginBottom: 32 },
  inputGroup: {},
  input: {
    backgroundColor: '#f8fafc',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});