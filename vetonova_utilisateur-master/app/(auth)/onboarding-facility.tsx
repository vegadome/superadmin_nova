import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, 
  ScrollView, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/src/store/useUserStore';
import { supabase } from '@/src/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function OnboardingFacilityScreen() {
  const router = useRouter();
  const { setProfile } = useUserStore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Étape 1 : Contact Responsable
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Étape 2 : Détails Établissement
  const [facilityName, setFacilityName] = useState('');
  const [facilityType, setFacilityType] = useState('hospital');
  const [vatNumber, setVatNumber] = useState(''); // Numéro BCE/TVA

  const isStep1Valid = managerName.trim().length >= 3 && phone.trim().length >= 10;
  const isStep2Valid = facilityName.trim().length >= 2 && vatNumber.trim().length >= 8;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(step + 1);
    Keyboard.dismiss();
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée");

      // 1. Mise à jour du profil établissement
      const { data: updatedProfile, error: profileErr } = await supabase
        .from('profiles')
        .upsert({ 
          id: session.user.id,
          full_name: managerName.trim(), 
          phone_number: phone.trim(),
          is_nurse: false, // C'est un établissement
          facility_name: facilityName.trim(),
          facility_type: facilityType,
          vat_number: vatNumber.trim(),
          updated_at: new Date()
        })
        .select()
        .single();

      if (profileErr) throw profileErr;

      if (updatedProfile) setProfile(updatedProfile);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(facility-tabs)'); 

    } catch (e: any) {
      Alert.alert("Erreur", "Impossible de configurer l'établissement. Vérifiez vos informations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          
          <View style={styles.progressHeader}>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
            </View>
            <Text style={styles.stepIndicator}>Configuration Établissement • {step}/3</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              {step === 1 && (
                <View style={styles.stepContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="person-badge" size={40} color="#1e293b" />
                  </View>
                  <Text style={styles.title}>Responsable du Staffing</Text>
                  <Text style={styles.subtitle}>Identifiez-vous en tant que gestionnaire ou cadre infirmier.</Text>
                  
                  <TextInput 
                    placeholder="Votre Nom et Prénom" 
                    style={styles.input} 
                    value={managerName} 
                    onChangeText={setManagerName}
                  />
                  <TextInput 
                    placeholder="Ligne directe / Mobile" 
                    style={styles.input} 
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              )}

              {step === 2 && (
                <View style={styles.stepContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="business" size={40} color="#1e293b" />
                  </View>
                  <Text style={styles.title}>Votre Établissement</Text>
                  <Text style={styles.subtitle}>Ces informations figureront sur vos demandes de missions.</Text>
                  
                  <TextInput 
                    placeholder="Nom de l'établissement (ex: CHU Liège)" 
                    style={styles.input} 
                    value={facilityName}
                    onChangeText={setFacilityName}
                  />

                  <TextInput 
                    placeholder="Numéro BCE / TVA (Belgique)" 
                    style={styles.input} 
                    value={vatNumber}
                    onChangeText={setVatNumber}
                  />
                  
                  <View style={styles.typeRow}>
                    {[
                      { id: 'hospital', label: 'Hôpital', icon: 'medkit' },
                      { id: 'mrs', label: 'MR-S', icon: 'home' },
                      { id: 'clinic', label: 'Clinique', icon: 'fitness' }
                    ].map((t) => (
                      <TouchableOpacity 
                        key={t.id} 
                        onPress={() => {
                          Haptics.selectionAsync();
                          setFacilityType(t.id);
                        }}
                        style={[styles.typeBtn, facilityType === t.id && styles.typeBtnActive]}
                      >
                        <Ionicons name={t.icon as any} size={24} color={facilityType === t.id ? "#fff" : "#94a3b8"} />
                        <Text style={[styles.typeLabel, facilityType === t.id && styles.typeLabelActive]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {step === 3 && (
                <View style={styles.stepContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="rocket" size={40} color="#1e293b" />
                  </View>
                  <Text style={styles.title}>Prêt à recruter !</Text>
                  <Text style={styles.subtitle}>
                    Votre compte est configuré. Vous pouvez maintenant publier vos besoins en renfort infirmier.
                  </Text>
                  <View style={styles.summaryCard}>
                    <Ionicons name="shield-checkmark" size={24} color="#1e293b" />
                    <Text style={styles.summaryText}>Accès sécurisé NurseNova Pro</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.nextButton, ((step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)) && styles.buttonDisabled]} 
              onPress={() => step < 3 ? handleNext() : handleFinish()}
              disabled={loading || (step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
            >
              <LinearGradient 
                colors={['#1e293b', '#0f172a']} 
                style={styles.gradient}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextText}>{step === 3 ? "Ouvrir mon tableau de bord" : "Suivant"}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  progressHeader: { marginTop: 60, marginBottom: 20 },
  progressContainer: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginBottom: 10 },
  progressBar: { height: 6, backgroundColor: '#1e293b', borderRadius: 3 },
  stepIndicator: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textAlign: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingBottom: 40 },
  stepContainer: { alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 28, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  input: { width: '100%', backgroundColor: '#fff', height: 64, borderRadius: 18, paddingHorizontal: 20, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  typeRow: { flexDirection: 'row', gap: 10, marginTop: 10, width: '100%' },
  typeBtn: { flex: 1, height: 90, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  typeBtnActive: { borderColor: '#1e293b', backgroundColor: '#1e293b' },
  typeLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginTop: 5 },
  typeLabelActive: { color: '#fff' },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f1f5f9', padding: 20, borderRadius: 16, marginTop: 20 },
  summaryText: { color: '#1e293b', fontWeight: '700' },
  footer: { paddingBottom: 30 },
  nextButton: { height: 64, width: '100%', borderRadius: 20, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.3 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  nextText: { color: '#fff', fontSize: 17, fontWeight: '700' }
});