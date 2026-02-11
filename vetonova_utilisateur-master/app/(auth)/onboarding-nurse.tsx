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

export default function OnboardingNurseScreen() {
  const router = useRouter();
  const { setProfile } = useUserStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Étape 1 : Identité
  const [fullName, setFullName] = useState('');
  const [inamiNumber, setInamiNumber] = useState(''); 
  const [phoneNumber, setPhoneNumber] = useState('');

  // Étape 2 : Spécialités, Tarif & TVA
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState('45'); 
  const [vatNumber, setVatNumber] = useState('');
  
  // Étape 3 : Mobilité
  const [radius, setRadius] = useState('30');

  // Étape 4 : Photo Carte INAMI
  const [cardImage, setCardImage] = useState<string | null>(null);

  // Étape 5 : Vérification d'Identité (NOUVEAU)
  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const specialties = [
    { id: 'urg', name: 'Urgences / SIAMU', icon: 'flash' },
    { id: 'ger', name: 'Gériatrie / MRS', icon: 'heart' },
    { id: 'dom', name: 'Soins à domicile', icon: 'home' },
    { id: 'reanim', name: 'Réanimation', icon: 'pulse' },
    { id: 'bloc', name: 'Bloc Opératoire', icon: 'cut' },
  ];

  // --- VALIDATIONS ---

  const validateINAMI = (inami: string) => {
    const cleanInami = inami.replace(/\D/g, '');
    if (cleanInami.length !== 11) return false;
    const base = parseInt(cleanInami.substring(0, 9));
    const checksum = parseInt(cleanInami.substring(9, 11));
    return (97 - (base % 97)) === checksum;
  };

  const validateVAT = (vat: string) => {
    if (!vat) return true; 
    const b2bRegex = /^BE[01]\d{9}$/;
    return b2bRegex.test(vat.replace(/[\s.]/g, ''));
  };

  // --- LOGIQUE IMAGE ---

  const pickImage = async (target: 'inami' | 'idCard' | 'selfie') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission requise", "L'accès à la caméra est nécessaire.");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: target !== 'selfie',
      quality: 0.6,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (target === 'inami') setCardImage(uri);
      if (target === 'idCard') setIdCardImage(uri);
      if (target === 'selfie') setSelfieImage(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // --- LOGIQUE NAVIGATION ---

  const toggleSpecialty = (id: string) => {
    Haptics.selectionAsync();
    setSelectedSpecialties(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!fullName || !inamiNumber || !phoneNumber) return Alert.alert("Champs requis", "Remplissez tous les champs.");
      if (!validateINAMI(inamiNumber)) return Alert.alert("Erreur", "N° INAMI invalide.");
    }
    if (step === 4 && !cardImage) return Alert.alert("Erreur", "Photo INAMI manquante.");
    setStep(step + 1);
  };

  const handleFinish = async () => {
    if (!idCardImage || !selfieImage) {
      return Alert.alert("Documents manquants", "Veuillez fournir votre pièce d'identité et votre selfie.");
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée");
      const userId = session.user.id;
      const timestamp = Date.now();

      // Fonction d'upload réutilisable
      const uploadProcess = async (uri: string, bucket: string, fileName: string) => {
        const fileExt = uri.split('.').pop();
        const fullPath = `${userId}/${fileName}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', { uri, name: fullPath, type: `image/${fileExt}` } as any);
        
        const { error } = await supabase.storage.from(bucket).upload(fullPath, formData);
        if (error) throw error;
        return fullPath;
      };

      // Uploads asynchrones
      const [pathInami, pathId, pathSelfie] = await Promise.all([
        uploadProcess(cardImage!, 'inami-cards', `inami_${timestamp}`),
        uploadProcess(idCardImage, 'identity-checks', `id_card`),
        uploadProcess(selfieImage, 'identity-checks', `selfie`)
      ]);

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
        inami_card_path: pathInami,
        id_card_path: pathId,
        selfie_path: pathSelfie,
        verification_status: 'pending',
        identity_verified: false,
        updated_at: new Date(),
      };

      const { data, error } = await supabase.from('profiles').upsert(updates).select().single();
      if (error) throw error;
      
      setProfile(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
      
    } catch (e: any) {
      Alert.alert("Erreur lors de l'envoi", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={styles.progressHeader}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${(step / 5) * 100}%` }]} />
            </View>
            <Text style={styles.stepIndicator}>Étape {step} sur 5</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {step === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.iconCircle}><Ionicons name="medical" size={40} color="#3b82f6" /></View>
                <Text style={styles.title}>Votre Identité</Text>
                <TextInput placeholder="Nom complet" style={styles.input} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
                <TextInput placeholder="Numéro de téléphone" style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
                <TextInput placeholder="N° INAMI (11 chiffres)" style={styles.input} value={inamiNumber} onChangeText={setInamiNumber} keyboardType="numeric" maxLength={11} />
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContainer}>
                <Text style={styles.title}>Spécialités & TVA</Text>
                <View style={styles.specialtyGrid}>
                  {specialties.map((s) => (
                    <TouchableOpacity key={s.id} onPress={() => toggleSpecialty(s.id)} style={[styles.specialtyCard, selectedSpecialties.includes(s.id) && styles.activeCard]}>
                      <Ionicons name={s.icon as any} size={22} color={selectedSpecialties.includes(s.id) ? "#3b82f6" : "#94a3b8"} />
                      <Text style={styles.specialtyText}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.rateBox}>
                  <Text style={styles.subLabel}>Tarif (€/h)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={hourlyRate} onChangeText={setHourlyRate} />
                  <Text style={styles.subLabel}>TVA (Optionnel)</Text>
                  <TextInput placeholder="BE 0XXX..." style={styles.input} value={vatNumber} onChangeText={setVatNumber} />
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContainer}>
                <View style={styles.iconCircle}><Ionicons name="navigate" size={40} color="#3b82f6" /></View>
                <Text style={styles.title}>Mobilité</Text>
                <View style={styles.card}>
                  <Text style={styles.label}>Rayon d'action ({radius} km)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={radius} onChangeText={setRadius} maxLength={3} />
                </View>
              </View>
            )}

            {step === 4 && (
              <View style={styles.stepContainer}>
                <Text style={styles.title}>Carte INAMI</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('inami')}>
                  {cardImage ? <Image source={{ uri: cardImage }} style={styles.previewImage} /> : <Text style={styles.uploadText}>Cliquer pour capturer</Text>}
                </TouchableOpacity>
              </View>
            )}

            {step === 5 && (
              <View style={styles.stepContainer}>
                <View style={styles.iconCircle}><Ionicons name="shield-checkmark" size={40} color="#10b981" /></View>
                <Text style={styles.title}>Vérification Identité</Text>
                <Text style={styles.description}>Pour votre sécurité, nous validons votre identité manuellement.</Text>
                
                <Text style={styles.label}>1. Pièce d'identité (Recto)</Text>
                <TouchableOpacity style={[styles.uploadBox, {height: 140, marginBottom: 20}]} onPress={() => pickImage('idCard')}>
                  {idCardImage ? <Image source={{ uri: idCardImage }} style={styles.previewImage} /> : <Ionicons name="card-outline" size={30} color="#cbd5e1" />}
                </TouchableOpacity>

                <Text style={styles.label}>2. Selfie de contrôle</Text>
                <TouchableOpacity style={[styles.uploadBox, {height: 140}]} onPress={() => pickImage('selfie')}>
                  {selfieImage ? <Image source={{ uri: selfieImage }} style={styles.previewImage} /> : <Ionicons name="person-outline" size={30} color="#cbd5e1" />}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={() => step < 5 ? handleNextStep() : handleFinish()}
              disabled={loading}
            >
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.gradient}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>{step === 5 ? "Soumettre mon dossier" : "Continuer"}</Text>}
              </LinearGradient>
            </TouchableOpacity>
            
            {step > 1 && (
              <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backLink}>
                <Text style={styles.backLinkText}>Retour</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 24 },
  progressHeader: { marginTop: 60, marginBottom: 20 },
  progressContainer: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3 },
  progressBar: { height: 6, backgroundColor: '#3b82f6', borderRadius: 3 },
  stepIndicator: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8, fontWeight: '700' },
  scrollContent: { paddingVertical: 20 },
  stepContainer: { width: '100%' },
  iconCircle: { alignSelf: 'center', width: 80, height: 80, borderRadius: 30, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
  description: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#fff', height: 60, borderRadius: 15, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16 },
  specialtyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  specialtyCard: { width: '47%', backgroundColor: '#fff', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', gap: 8 },
  activeCard: { borderColor: '#3b82f6', backgroundColor: '#f0f9ff' },
  specialtyText: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  rateBox: { padding: 20, backgroundColor: '#fff', borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 10 },
  subLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginBottom: 5, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#e2e8f0' },
  uploadBox: { height: 200, backgroundColor: '#fff', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  uploadText: { color: '#94a3b8', fontWeight: '600' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  footer: { paddingBottom: 30 },
  nextButton: { height: 64, borderRadius: 20, overflow: 'hidden' },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  nextText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  backLink: { marginTop: 15, alignSelf: 'center' },
  backLinkText: { color: '#94a3b8', fontWeight: '600' }
});