import { supabase } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/useUserStore';
import { decode } from 'base64-arraybuffer';
import { readAsStringAsync } from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import {
    ArrowRight, Camera, CheckCircle2,
    Clock,
    FileText,
    PartyPopper,
    Search,
    ShieldAlert,
    ShieldCheck
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function MyDocumentsScreen() {
    const router = useRouter();
    const { profile, setProfile } = useUserStore();
    const [uploading, setUploading] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});

    const documents = [
        { id: 'inami', title: 'Carte INAMI', dbField: 'inami_card_path', bucket: 'inami-cards' },
        { id: 'idCard', title: 'Pièce d\'identité (Recto)', dbField: 'id_card_path', bucket: 'identity-checks' },
        { id: 'selfie', title: 'Selfie de contrôle', dbField: 'selfie_path', bucket: 'identity-checks' },
    ];

    // --- VIEW : EN ATTENTE (PENDING) ---
    const PendingView = () => (
        <View style={styles.stateContainer}>
            <Stack.Screen options={{ headerTitle: "Vérification", headerShown: true }} />
            <View style={styles.iconCircleLarge}>
                <Search size={40} color="#6366f1" />
                <View style={styles.badgeBottom}>
                    <Clock size={16} color="#6366f1" />
                </View>
            </View>
            <Text style={styles.stateTitle}>Inspection en cours</Text>
            <Text style={styles.stateDescription}>
                Vos documents sont entre les mains de notre équipe. Nous vérifions la validité de vos informations sous 24h.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
                <Text style={styles.secondaryButtonText}>Retourner à l'accueil</Text>
            </TouchableOpacity>
        </View>
    );

    // --- VIEW : VALIDÉ (VERIFIED) ---
    const VerifiedView = () => (
        <View style={styles.stateContainer}>
            <Stack.Screen options={{ headerTitle: "Profil Vérifié", headerShown: true }} />
            <View style={[styles.iconCircleLarge, { backgroundColor: '#f0fdf4' }]}>
                <ShieldCheck size={48} color="#10b981" />
            </View>
            <Text style={styles.stateTitle}>Félicitations !</Text>
            <Text style={styles.stateDescription}>
                Votre profil a été vérifié avec succès. Vous avez désormais accès à l'intégralité des fonctionnalités de la plateforme.
            </Text>
            <TouchableOpacity style={styles.submitButton} onPress={() => router.back()}>
                <Text style={styles.submitButtonText}>Commencer</Text>
                <PartyPopper color="#fff" size={20} />
            </TouchableOpacity>
        </View>
    );

    // --- LOGIQUE DE CALCUL ---
    const stats = useMemo(() => {
        const uploadedCount = documents.filter(doc => {
            const remotePath = profile?.[doc.dbField];
            return (typeof remotePath === 'string' && remotePath.length > 5) || !!localPreviews[doc.id];
        }).length;
        return {
            count: uploadedCount,
            total: documents.length,
            percent: (uploadedCount / documents.length) * 100,
            isComplete: uploadedCount === documents.length
        };
    }, [profile, localPreviews]);

    // --- LOGIQUE D'UPLOAD ---
    const handlePickImage = async (docId: string, dbField: string, bucket: string) => {
        if (profile?.verification_status === 'pending' || profile?.verification_status === 'verified') return;
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Erreur", "Accès caméra refusé.");

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: docId !== 'selfie',
            quality: 0.5,
        });

        if (!result.canceled) {
            const selectedUri = result.assets[0].uri;
            setLocalPreviews(prev => ({ ...prev, [docId]: selectedUri }));
            uploadFile(selectedUri, docId, dbField, bucket);
        }
    };

    const uploadFile = async (uri: string, docId: string, dbField: string, bucket: string) => {
        setUploading(docId);
        try {
            const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
            const fileName = `${profile?.id}/${docId}.jpg`;
            const { error: storageError } = await supabase.storage.from(bucket).upload(fileName, decode(base64), { upsert: true, contentType: 'image/jpeg' });
            if (storageError) throw storageError;

            const { data: updatedProfile, error: dbError } = await supabase.from('profiles').update({ [dbField]: fileName }).eq('id', profile?.id).select().single();
            if (dbError) throw dbError;
            setProfile(updatedProfile);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error: any) {
            Alert.alert("Erreur", "Impossible d'envoyer l'image.");
        } finally {
            setUploading(null);
        }
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.from('profiles').update({ verification_status: 'pending' }).eq('id', profile?.id).select().single();
            if (error) throw error;
            setProfile(data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            Alert.alert("Erreur", "Échec de la soumission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER CONDITIONNEL ---
    if (profile?.verification_status === 'pending') return <PendingView />;
    if (profile?.verification_status === 'verified') return <VerifiedView />;

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerTitle: "Mes Documents", headerShown: true, headerShadowVisible: false }} />
            
            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>{stats.isComplete ? "Dossier complet" : `Progression : ${stats.count}/${stats.total}`}</Text>
                    <Text style={styles.progressSubtext}>{Math.round(stats.percent)}%</Text>
                </View>
                <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${stats.percent}%` }]} /></View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {profile?.verification_status === 'rejected' && (
                    <View style={styles.rejectedBanner}>
                        <ShieldAlert color="#ef4444" size={24} />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.rejectedTitle}>Documents refusés</Text>
                            <Text style={styles.rejectedSubtitle}>{profile?.verification_feedback}</Text>
                        </View>
                    </View>
                )}

                {documents.map((doc) => {
                    const hasImage = !!localPreviews[doc.id] || !!profile?.[doc.dbField];
                    return (
                        <View key={doc.id} style={styles.docCard}>
                            <View style={styles.docInfo}>
                                <View style={[styles.iconCircle, hasImage && { backgroundColor: '#eff6ff' }]}>
                                    {hasImage ? <CheckCircle2 size={18} color="#6366f1" /> : <FileText size={18} color="#94a3b8" />}
                                </View>
                                <Text style={styles.docTitle}>{doc.title}</Text>
                            </View>
                            <TouchableOpacity 
                                style={[styles.uploadZone, hasImage && styles.hasImageZone]} 
                                onPress={() => handlePickImage(doc.id, doc.dbField, doc.bucket)}
                            >
                                {uploading === doc.id ? <ActivityIndicator color="#6366f1" /> : 
                                 localPreviews[doc.id] ? <Image source={{ uri: localPreviews[doc.id] }} style={styles.previewImage} /> :
                                 hasImage ? <View style={styles.uploadPlaceholder}><CheckCircle2 size={24} color="#6366f1" /><Text style={styles.uploadTextTitle}>Modifier la photo</Text></View> :
                                 <View style={styles.uploadPlaceholder}><Camera size={24} color="#6366f1" /><Text style={styles.uploadTextTitle}>Prendre la photo</Text></View>}
                            </TouchableOpacity>
                        </View>
                    );
                })}

                {stats.isComplete && (
                    <TouchableOpacity style={styles.submitButton} onPress={handleFinalSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <><Text style={styles.submitButtonText}>Envoyer le dossier</Text><ArrowRight color="#fff" size={20} /></>}
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    // Styles États (Pending / Verified)
    stateContainer: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 40 },
    iconCircleLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    badgeBottom: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#fff', borderRadius: 12, padding: 4, elevation: 3 },
    stateTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
    stateDescription: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
    secondaryButton: { paddingVertical: 15, paddingHorizontal: 25, borderRadius: 15, backgroundColor: '#f8fafc' },
    secondaryButtonText: { color: '#64748b', fontWeight: '700' },
    
    // Formulaire
    progressContainer: { paddingHorizontal: 25, paddingTop: 10, marginBottom: 20 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressText: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
    progressSubtext: { fontSize: 14, fontWeight: '700', color: '#6366f1' },
    progressBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#6366f1' },
    scrollContent: { padding: 20, paddingBottom: 60 },
    rejectedBanner: { flexDirection: 'row', backgroundColor: '#fff1f2', padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#ffe4e6' },
    rejectedTitle: { color: '#9f1239', fontWeight: '800' },
    rejectedSubtitle: { color: '#e11d48', fontSize: 13 },
    docCard: { backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    docInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    iconCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    docTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
    uploadZone: { height: 140, borderRadius: 18, borderWidth: 2, borderColor: '#f1f5f9', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', overflow: 'hidden' },
    hasImageZone: { borderStyle: 'solid', borderColor: '#e2e8f0' },
    uploadPlaceholder: { alignItems: 'center' },
    uploadTextTitle: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#6366f1' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    submitButton: { backgroundColor: '#6366f1', flexDirection: 'row', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20, paddingHorizontal: 20 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', marginRight: 10 }
});