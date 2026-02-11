import { supabase } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/useUserStore';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Banknote, Bell, CalendarDays, Camera, ChevronRight, FileText,
  Lock, LogOut, Map as MapIcon, Settings, Stethoscope, Zap
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert, Animated, Image, Platform, SafeAreaView, ScrollView,
  StyleSheet, Switch, Text, TouchableOpacity, View
} from 'react-native';


export default function ProfileScreen() {
  const { profile, setProfile } = useUserStore();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);
  
  const isVerified = profile?.verification_status === 'verified';

  // Charger l'URL signée au montage ou quand le profil change
  useEffect(() => {
    if (profile?.avatar_url) {
      getSignedUrl(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  const getSignedUrl = async (path: string) => {
    try {
      // On génère une URL valide 1 heure (3600s)
      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 3600);
      if (error) throw error;
      setSignedAvatarUrl(data.signedUrl);
    } catch (error) {
      console.error("Erreur URL signée:", error);
    }
  };

  const handleEditAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Désolé", "Nous avons besoin des permissions pour changer votre photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
    }
  };

 const uploadAvatar = async (uri: string) => {
    setUploading(true);
    try {
      // Utilise l'import legacy pour lire le fichier en base64
      const base64 = await FileSystem.readAsStringAsync(uri, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      
      const filePath = `${profile?.id}/avatar.jpg`;

      // Upload vers le bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), { 
          contentType: 'image/jpeg', 
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // Mise à jour du profil avec le chemin relatif
      const { data: updatedProfile, error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', profile?.id)
        .select()
        .single();

      if (dbError) throw dbError;
      
      setProfile(updatedProfile);
      
      // On regénère l'URL signée pour que l'affichage se mette à jour
      await getSignedUrl(filePath);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Photo mise à jour !");
    } catch (error: any) {
      console.error("Erreur complète détaillée:", error);
      Alert.alert("Erreur", error.message || "Impossible d'uploader l'image.");
    } finally {
      setUploading(false);
    }
  };

  // --- Logique UI (Toast, SignOut, etc.) ---
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({ message: '', icon: MapIcon });
  const translateY = React.useRef(new Animated.Value(-100)).current;

  const showToast = (message: string) => {
    setToastConfig({ message, icon: MapIcon });
    setToastVisible(true);
    Animated.spring(translateY, { toValue: 50, useNativeDriver: true, tension: 20, friction: 7 }).start();
    setTimeout(() => {
      Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }).start(() => setToastVisible(false));
    }, 3000);
  };

  const handleSignOut = async () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", style: "destructive", onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/welcome');
      }}
    ]);
  };

  const toggleMapVisibility = async (value: boolean) => {
    if (!isVerified) return Alert.alert("Validation requise", "L'accès à la carte sera disponible dès que votre profil sera validé.");
    if (isUpdating) return;
    setIsUpdating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { data, error } = await supabase.from('profiles').update({ show_map: value }).eq('id', profile?.id).select().single();
      if (error) throw error;
      setProfile(data);
      showToast(value ? "Onglet Carte activé !" : "Onglet Carte désactivé");
    } catch (error) {
      Alert.alert("Erreur", "Mise à jour impossible.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateRate = () => {
    if (!isVerified) return Alert.alert("Action bloquée", "Action disponible après validation.");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.prompt("Modifier mon tarif", "Nouveau taux horaire (€/h)", [
      { text: "Annuler", style: "cancel" },
      { text: "Enregistrer", onPress: async (newRate) => {
          if (!newRate || isNaN(Number(newRate))) return;
          const { data } = await supabase.from('profiles').update({ hourly_rate: parseFloat(newRate) }).eq('id', profile?.id).select().single();
          if (data) setProfile(data);
      }}
    ], 'plain-text', profile?.hourly_rate?.toString(), 'number-pad');
  };

  return (
    <SafeAreaView style={styles.container}>
      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY }] }]}>
          <View style={styles.toastContent}>
            <View style={styles.toastIconBg}><toastConfig.icon size={18} color="#6366f1" /></View>
            <Text style={styles.toastText}>{toastConfig.message}</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.headerBackground}>
          <View style={styles.header}>
            <View style={styles.avatarWrapper}>
              <Image 
                source={{ uri: signedAvatarUrl || 'https://i.pravatar.cc/150' }} 
                style={styles.avatar} 
              />
              <TouchableOpacity 
                style={styles.editBadge} 
                onPress={handleEditAvatar} 
                disabled={uploading}
              >
                {uploading ? <ActivityIndicator size="small" color="#6366f1" /> : <Camera size={14} color="#6366f1" />}
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{profile?.full_name || 'Infirmier'}</Text>
            <View style={[styles.badgePro, !isVerified && { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
              {isVerified ? <Stethoscope size={12} color="#fff" style={{marginRight: 5}} /> : <Lock size={12} color="#fff" style={{marginRight: 5}} />}
              <Text style={styles.badgeProText}>{isVerified ? "Infirmier Diplômé d'État" : "Vérification en cours..."}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statNumber}>{isVerified ? '24' : '--'}</Text><Text style={styles.statLabel}>Missions</Text></View>
          <View style={[styles.statCard, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f1f5f9' }]}><Text style={styles.statNumber}>{isVerified ? '168h' : '--'}</Text><Text style={styles.statLabel}>Heures</Text></View>
          <View style={styles.statCard}><Text style={[styles.statNumber, isVerified && {color: '#10b981'}]}>{isVerified ? '1.2k€' : '--'}</Text><Text style={styles.statLabel}>Gains</Text></View>
        </View>

        <Text style={styles.sectionLabel}>Ma Profession</Text>
        <View style={styles.card}>
          <MenuOption icon={Zap} title="Mon Tarif B2B" subtitle={isVerified ? `${profile?.hourly_rate || '45'}€ / h` : "En attente"} color="#6366f1" onPress={handleUpdateRate} requiresVerification={true} isVerified={isVerified} />
          <MenuOption icon={FileText} title="Mes Documents" subtitle={isVerified ? "Documents validés" : "Gérer mes justificatifs"} color="#6366f1" onPress={() => router.push('/profile/documents')} />
          <MenuOption icon={Banknote} title="Paiements & IBAN" color="#10b981" onPress={() => {}} requiresVerification={true} isVerified={isVerified} />
          <MenuOption icon={CalendarDays} title="Mon Planning" color="#f59e0b" onPress={() => {}} isLast={true} requiresVerification={true} isVerified={isVerified} />
        </View>

        <Text style={styles.sectionLabel}>Préférences & App</Text>
        <View style={styles.card}>
          <MenuOption icon={MapIcon} title="Mode Carte" subtitle="Afficher l'onglet carte" color="#0ea5e9" requiresVerification={true} isVerified={isVerified}
            rightElement={<Switch value={isVerified ? (profile?.show_map || false) : false} onValueChange={toggleMapVisibility} trackColor={{ false: "#e2e8f0", true: "#6366f1" }} disabled={isUpdating || !isVerified} />}
          />
          <MenuOption icon={Bell} title="Notifications" color="#ec4899" onPress={() => {}} />
          <MenuOption icon={Settings} title="Paramètres" color="#475569" onPress={() => {}} isLast={true} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Composant Interne MenuOption (simplifié)
const MenuOption = ({ icon: Icon, title, subtitle, color, onPress, isLast = false, rightElement, requiresVerification = false, isVerified }: any) => {
  const locked = requiresVerification && !isVerified;
  return (
    <TouchableOpacity 
      style={[styles.menuItem, isLast && { borderBottomWidth: 0 }, locked && { opacity: 0.5 }]} 
      onPress={locked ? () => Alert.alert("Validation requise", "Disponible après validation.") : onPress}
      disabled={!!rightElement && !onPress && !locked}
    >
      <View style={[styles.iconContainer, { backgroundColor: locked ? '#f1f5f9' : color + '15' }]}><Icon size={20} color={locked ? '#94a3b8' : color} /></View>
      <View style={styles.menuText}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}><Text style={styles.menuTitle}>{title}</Text>{locked && <Lock size={12} color="#94a3b8" style={{marginLeft: 6}} />}</View>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement ? rightElement : <ChevronRight size={18} color="#cbd5e1" />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  toastContainer: { position: 'absolute', top: 0, left: 20, right: 20, zIndex: 9999, alignItems: 'center' },
  toastContent: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 50, elevation: 5 },
  toastIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  headerBackground: { paddingTop: Platform.OS === 'ios' ? 20 : 40, paddingBottom: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  header: { alignItems: 'center' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
  editBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#fff', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 15 },
  badgePro: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  badgeProText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 24, paddingVertical: 20, marginTop: -30, marginBottom: 30, elevation: 10 },
  statCard: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '700', textTransform: 'uppercase' },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 25, marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 20, marginBottom: 25, paddingHorizontal: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, marginLeft: 15 },
  menuTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  menuSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginHorizontal: 20, padding: 18, borderRadius: 24, gap: 10, borderWidth: 1, borderColor: '#fee2e2' },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 16 },
});