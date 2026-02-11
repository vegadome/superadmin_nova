import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function EditRecordScreen() {
  const { recordId } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [imagePaths, setImagePaths] = useState<string[]>([]); // Chemins relatifs dans le bucket
  const [displayUrls, setDisplayUrls] = useState<string[]>([]); // URLs signées pour l'affichage

  useEffect(() => {
    fetchRecord();
  }, [recordId]);

  // Générer des URLs signées dès que les chemins d'images changent
  useEffect(() => {
    if (imagePaths.length > 0) {
      generateSignedUrls(imagePaths);
    }
  }, [imagePaths]);

  const fetchRecord = async () => {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (data) {
      setDiagnosis(data.diagnosis === 'À compléter par le vétérinaire' ? '' : data.diagnosis);
      setTreatment(data.treatment === 'À compléter' ? '' : data.treatment);
      setImagePaths(data.attachments_url || []);
    }
    setLoading(false);
  };

  const generateSignedUrls = async (paths: string[]) => {
    const { data, error } = await supabase.storage
      .from('medical-attachments')
      .createSignedUrls(paths, 3600); // Valide 1 heure

    if (data) {
      setDisplayUrls(data.map(item => item.signedUrl));
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setSaving(true);
    const fileName = `${recordId}/${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('medical-attachments')
      .upload(fileName, decode(asset.base64!), { 
        contentType: 'image/jpeg',
        upsert: true 
      });

    if (error) {
      Alert.alert("Erreur upload", error.message);
    } else {
      // On ajoute le chemin relatif à la liste
      setImagePaths(prev => [...prev, fileName]);
    }
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('medical_records')
      .update({
        diagnosis,
        treatment,
        attachments_url: imagePaths, // On enregistre les CHEMINS, pas les URLs signées
      })
      .eq('id', recordId);

    if (error) Alert.alert("Erreur", error.message);
    else router.back();
    setSaving(false);
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Édition du soin</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#6366f1" /> : <Text style={styles.saveBtn}>Enregistrer</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Diagnostic & Observations</Text>
      <TextInput
        style={styles.textArea}
        multiline
        placeholder="Décrivez l'état de l'animal..."
        value={diagnosis}
        onChangeText={setDiagnosis}
      />

      <Text style={styles.label}>Traitement prescrit</Text>
      <TextInput
        style={[styles.textArea, { height: 100 }]}
        multiline
        placeholder="Médicaments, doses, durée..."
        value={treatment}
        onChangeText={setTreatment}
      />

      <Text style={styles.label}>Photos & Documents</Text>
      <View style={styles.imageGrid}>
        {displayUrls.map((url, index) => (
          <Image key={index} source={{ uri: url }} style={styles.thumbnail} />
        ))}
        <TouchableOpacity style={styles.addImageBtn} onPress={pickImage} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#6366f1" />
          ) : (
            <>
              <Ionicons name="camera" size={30} color="#6366f1" />
              <Text style={styles.addImageText}>Ajouter</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 30 },
  title: { fontSize: 20, fontWeight: '800' },
  saveBtn: { color: '#6366f1', fontWeight: 'bold', fontSize: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 10, marginTop: 20 },
  textArea: { 
    backgroundColor: '#f8fafc', borderRadius: 15, padding: 15, 
    fontSize: 16, textAlignVertical: 'top', borderWidth: 1, borderColor: '#f1f5f9' 
  },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  thumbnail: { width: 100, height: 100, borderRadius: 12 },
  addImageBtn: { 
    width: 100, height: 100, borderRadius: 12, backgroundColor: '#eef2ff', 
    justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#6366f1' 
  },
  addImageText: { fontSize: 12, color: '#6366f1', fontWeight: '600', marginTop: 5 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});