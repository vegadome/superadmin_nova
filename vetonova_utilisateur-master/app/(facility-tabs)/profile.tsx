import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Switch, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/src/store/useUserStore';

const AVAILABLE_SERVICES = [
  { id: '1', name: 'Consultation', icon: 'medical' },
  { id: '2', name: 'Vaccination', icon: 'shield-checkmark' },
  { id: '3', name: 'Urgence', icon: 'flash' },
  { id: '4', name: 'Chirurgie', icon: 'cut' },
];

export default function VetProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [userAuth, setUserAuth] = useState<any>(null);
  
  // States pour l'édition
  const [isOnline, setIsOnline] = useState(true);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLicense, setEditLicense] = useState('');
  const [editRadius, setEditRadius] = useState('');
  
  // States pour les données JSONB
  const [editPrices, setEditPrices] = useState<any>({});
  const [weekendSurcharge, setWeekendSurcharge] = useState('0');
  const [editAvailability, setEditAvailability] = useState<any>({ week: '', weekend: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserAuth(user);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setProfile(data);
        
        // Initialisation des champs
        setEditName(data.full_name || '');
        setEditPhone(data.phone_number || '');
        setEditLicense(data.vet_license || '');
        setEditRadius(data.intervention_radius?.toString() || '20');
        
        // Gestion Service Prices + Surcharge
        const prices = data.service_prices || {};
        setEditPrices(prices);
        setWeekendSurcharge(prices.weekend_surcharge?.toString() || '0');
        
        // Gestion Horaires
        setEditAvailability(data.availability || { week: '09:00 - 19:00', weekend: 'Urgences' });
      }
    } catch (error) {
      console.error("Erreur fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = (serviceId: string, val: string) => {
    setEditPrices((prev: any) => ({ ...prev, [serviceId]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          phone_number: editPhone,
          vet_license: editLicense,
          intervention_radius: parseInt(editRadius),
          service_prices: {
            ...editPrices,
            weekend_surcharge: weekendSurcharge // On réinjecte la surcharge dans l'objet
          },
          availability: editAvailability,
          updated_at: new Date()
        })
        .eq('id', userAuth.id);

      if (error) throw error;
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
      fetchProfile();
      Alert.alert("Succès", "Profil professionnel mis à jour.");
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    // Récupère l'action pour vider le profil depuis ton store
    const { setProfile } = useUserStore.getState(); 

    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { 
        text: "Déconnexion", 
        style: "destructive", 
        onPress: async () => {
          try {
          // 1. On déconnecte la session Supabase
          await supabase.auth.signOut();
          
          // 2. IMPORTANT : On vide le store local immédiatement
          // Cela force le RootLayout à repasser profile à null
          setProfile(null); 
          
          // 3. On redirige vers l'accueil
          router.replace('/(auth)/welcome');
          
          // Optionnel : Un petit retour haptique pour confirmer
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          Alert.alert("Erreur", "Impossible de vous déconnecter proprement.");
        }
      } 
    }
  ]);
};

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#10b981" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* HEADER ACTIONS */}
        <View style={styles.topActions}>
          {isEditing && (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
          )}
          <TouchableOpacity 
              style={[styles.editBtn, isEditing && styles.saveBtn]} 
              onPress={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name={isEditing ? "checkmark-done" : "construct-outline"} size={20} color="#fff" />
                <Text style={styles.editBtnText}>{isEditing ? "Enregistrer" : "Mode Édition"}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}` }} 
              style={styles.avatar} 
            />
          </View>
          
          {isEditing ? (
              <TextInput 
                  style={styles.nameInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Nom complet"
              />
          ) : (
              <Text style={styles.userName}>{profile?.full_name}</Text>
          )}
          <Text style={styles.userEmail}>{userAuth?.email}</Text>
        </View>

        {/* STATUS CARD */}
        <BlurView intensity={80} style={styles.statusCard}>
          <View>
            <Text style={styles.statusTitle}>Visibilité Client</Text>
            <Text style={[styles.statusSub, { color: isOnline ? '#10b981' : '#ef4444' }]}>
                {isOnline ? '● En ligne (Visible)' : '○ Hors ligne'}
            </Text>
          </View>
          <Switch 
            value={isOnline} 
            onValueChange={setIsOnline}
            trackColor={{ false: "#cbd5e1", true: "#10b981" }}
          />
        </BlurView>

        {/* MA CARTE PRO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Infos Professionnelles</Text>
          <View style={styles.card}>
            <EditItem icon="call-outline" label="Téléphone" value={editPhone} onChange={setEditPhone} isEditing={isEditing} color="#10b981" keyboardType="phone-pad" />
            <EditItem icon="ribbon-outline" label="N° Matricule" value={editLicense} onChange={setEditLicense} isEditing={isEditing} color="#f59e0b" />
            <EditItem icon="navigate-outline" label="Rayon d'action (km)" value={editRadius} onChange={setEditRadius} isEditing={isEditing} color="#ec4899" keyboardType="numeric" />
          </View>
        </View>

        {/* TARIFS & SURCHARGE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tarification & Weekend</Text>
          <View style={styles.card}>
            {AVAILABLE_SERVICES.map((service) => {
              const isSelected = profile?.selected_services?.includes(service.id);
              if (!isSelected && !isEditing) return null;
              return (
                <View key={service.id} style={styles.priceItem}>
                  <View style={styles.priceInfo}>
                    <Ionicons name={service.icon as any} size={20} color={isSelected ? "#10b981" : "#cbd5e1"} />
                    <Text style={[styles.priceName, !isSelected && {color: '#cbd5e1'}]}>{service.name}</Text>
                  </View>
                  {isEditing ? (
                    <View style={styles.priceInputRow}>
                      <TextInput 
                        style={styles.priceInput}
                        value={editPrices[service.id]}
                        onChangeText={(v) => handleUpdatePrice(service.id, v)}
                        keyboardType="numeric"
                      />
                      <Text style={styles.euroText}>€</Text>
                    </View>
                  ) : (
                    <Text style={styles.priceValue}>{editPrices[service.id] || '--'} €</Text>
                  )}
                </View>
              );
            })}

            {/* MAJORATION WEEKEND */}
            <View style={[styles.priceItem, { borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 5 }]}>
              <View style={styles.priceInfo}>
                <Ionicons name="calendar-outline" size={20} color="#6366f1" />
                <Text style={[styles.priceName, {color: '#6366f1'}]}>Majoration Weekend</Text>
              </View>
              {isEditing ? (
                <View style={styles.priceInputRow}>
                  <Text style={styles.plusText}>+</Text>
                  <TextInput 
                    style={[styles.priceInput, {borderColor: '#6366f1'}]}
                    value={weekendSurcharge}
                    onChangeText={setWeekendSurcharge}
                    keyboardType="numeric"
                  />
                  <Text style={styles.euroText}>€</Text>
                </View>
              ) : (
                <Text style={[styles.priceValue, {color: '#6366f1'}]}>+ {weekendSurcharge} €</Text>
              )}
            </View>
          </View>
        </View>

        {/* HORAIRES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planning</Text>
          <View style={styles.card}>
             <View style={styles.hourItem}>
                <Text style={styles.hourLabel}>Semaine (Lun-Ven)</Text>
                {isEditing ? (
                  <TextInput 
                    style={styles.hourInput} 
                    value={editAvailability.week} 
                    onChangeText={(v) => setEditAvailability({...editAvailability, week: v})} 
                  />
                ) : (
                  <Text style={styles.hourValue}>{profile?.availability?.week || 'Non renseigné'}</Text>
                )}
             </View>
             <View style={[styles.hourItem, {marginTop: 10}]}>
                <Text style={styles.hourLabel}>Weekend (Sam-Dim)</Text>
                {isEditing ? (
                  <TextInput 
                    style={styles.hourInput} 
                    value={editAvailability.weekend} 
                    onChangeText={(v) => setEditAvailability({...editAvailability, weekend: v})} 
                  />
                ) : (
                  <Text style={styles.hourValue}>{profile?.availability?.weekend || 'Urgences'}</Text>
                )}
             </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const EditItem = ({ icon, label, value, onChange, isEditing, color, keyboardType = "default" }: any) => (
    <View style={styles.item}>
      <View style={[styles.iconContainer, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemLabel}>{label}</Text>
        {isEditing ? (
            <TextInput style={styles.inputField} value={value} onChangeText={onChange} keyboardType={keyboardType} />
        ) : (
            <Text style={styles.itemValue}>{value || 'Non renseigné'}</Text>
        )}
      </View>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 60, gap: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, gap: 8 },
  saveBtn: { backgroundColor: '#10b981' },
  editBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  cancelBtn: { justifyContent: 'center', paddingHorizontal: 15, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  cancelBtnText: { color: '#64748b', fontWeight: '700' },
  header: { alignItems: 'center', marginBottom: 25 },
  avatarWrapper: { marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  userName: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  nameInput: { fontSize: 20, fontWeight: '700', color: '#6366f1', borderBottomWidth: 2, borderBottomColor: '#6366f1', minWidth: 220, textAlign: 'center' },
  userEmail: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  statusCard: { marginHorizontal: 20, padding: 20, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: '#fff' },
  statusTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  statusSub: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  section: { marginTop: 25, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, marginLeft: 8 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 12 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  iconContainer: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemContent: { flex: 1 },
  itemLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  itemValue: { fontSize: 15, fontWeight: '700', color: '#334155' },
  inputField: { fontSize: 15, fontWeight: '700', color: '#6366f1', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  priceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  priceInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceName: { fontSize: 15, fontWeight: '600', color: '#334155' },
  priceValue: { fontSize: 16, fontWeight: '800', color: '#10b981' },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  priceInput: { width: 60, height: 35, backgroundColor: '#f8fafc', borderRadius: 8, textAlign: 'center', fontWeight: '800', color: '#6366f1', borderWidth: 1, borderColor: '#e2e8f0' },
  euroText: { fontWeight: '700', color: '#94a3b8' },
  plusText: { fontWeight: '800', color: '#6366f1' },
  hourItem: { paddingHorizontal: 5 },
  hourLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 5 },
  hourValue: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  hourInput: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', color: '#6366f1' },
  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 22, gap: 15 },
  actionText: { fontSize: 16, fontWeight: '700' },
});