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

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams(); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSignUp, setIsSignUp] = useState(params.signUp === 'true');
  
  // Le rôle est désormais fixé sur 'nurse' par défaut pour cette interface
  const role = 'nurse'; 

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir votre email et mot de passe.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: { data: { role: role } }
        });
        if (error) throw error;
        if (!data?.session) {
          Alert.alert('Vérification', 'Vérifiez vos emails pour confirmer votre inscription.');
          setLoading(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setLoading(false); 
      Alert.alert('Erreur', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.headerSection}>
            <LinearGradient colors={['#f0f7ff', '#ffffff']} style={styles.logoCircle}>
              <Ionicons 
                name="medical" 
                size={42} 
                color="#3b82f6" 
              />
            </LinearGradient>
            <Text style={styles.title}>NurseNova</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Inscription Infirmier Indépendant' : 'Connexion à votre espace'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email professionnel</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Ex: nom@domaine.be" 
                  placeholderTextColor="#cbd5e1"
                  style={styles.input}
                  onChangeText={setEmail}
                  value={email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput 
                  placeholder="••••••••" 
                  placeholderTextColor="#cbd5e1"
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  value={password}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleAuth} 
              style={[styles.mainButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              <LinearGradient 
                colors={['#3b82f6', '#2563eb']} 
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Chargement...' : (isSignUp ? "Créer mon compte" : "Se connecter")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setIsSignUp(!isSignUp)} 
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isSignUp ? "Déjà inscrit ? " : "Nouveau sur NurseNova ? "}
                <Text style={styles.switchTextBold}>
                  {isSignUp ? "Connectez-vous" : "Inscrivez-vous"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { 
    width: 90, height: 90, borderRadius: 30, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#3b82f633',
    elevation: 4, shadowColor: '#3b82f6', shadowOpacity: 0.1, shadowRadius: 10
  },
  title: { fontSize: 34, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 8, textAlign: 'center' },
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 18,
    paddingHorizontal: 16, height: 64,
    borderWidth: 1, borderColor: '#e2e8f0',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#0f172a', fontSize: 16, fontWeight: '500' },
  mainButton: { 
    height: 64, borderRadius: 18, overflow: 'hidden', marginTop: 10,
    elevation: 8, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 12
  },
  gradientButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  buttonDisabled: { opacity: 0.7 },
  switchButton: { marginTop: 28, alignItems: 'center' },
  switchText: { color: '#64748b', fontSize: 15 },
  switchTextBold: { color: '#3b82f6', fontWeight: '700' },
});