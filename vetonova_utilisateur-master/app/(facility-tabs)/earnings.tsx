import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfWeek, startOfMonth, isWithinInterval, subDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart } from 'react-native-chart-kit'; // Import du graphique

const { width } = Dimensions.get('window');

export default function VetEarningsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ week: 0, month: 0, total: 0, count: 0 });
  const [chartData, setChartData] = useState<{labels: string[], datasets: {data: number[]} }>({
    labels: [],
    datasets: [{ data: [] }]
  });

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      // 1. RÉCUPÉRER L'ID DU VÉTO CONNECTÉ
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. FILTRER PAR VET_ID (Sécurité & Logique)
      const { data, error } = await supabase
        .from('appointments')
        .select('final_price, completed_at')
        .eq('status', 'completed')
        .eq('vet_id', user.id); // <--- AJOUT CRUCIAL

      if (error) throw error;

      if (data) {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);

        // --- LOGIQUE DU GRAPHIQUE ---
        const last7Days = [...Array(7)].map((_, i) => subDays(now, 6 - i));
        const labels = last7Days.map(d => format(d, 'ccc', { locale: fr }));
        const dailyAmounts = last7Days.map(day => {
          return data
            .filter(app => app.completed_at && isSameDay(new Date(app.completed_at), day))
            .reduce((sum, current) => sum + (Number(current.final_price) || 0), 0);
        });

        setChartData({
          labels,
          datasets: [{ data: dailyAmounts }]
        });

        // --- LOGIQUE DES STATS ---
        const totals = data.reduce((acc, curr) => {
          if (!curr.completed_at) return acc;
          const date = new Date(curr.completed_at);
          const price = Number(curr.final_price) || 0;
          
          if (isWithinInterval(date, { start: weekStart, end: now })) acc.week += price;
          if (isWithinInterval(date, { start: monthStart, end: now })) acc.month += price;
          acc.total += price;
          acc.count += 1;
          return acc;
        }, { week: 0, month: 0, total: 0, count: 0 });

        setStats(totals);
      }
    } catch (e) {
      console.error("Erreur stats:", e);
    } finally {
      setLoading(false);
    }
  };
  
  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#ffffff",
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`, // Indigo
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: { borderRadius: 16 }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#10b981" /></View>;

  return (
    <LinearGradient colors={['#f0f9ff', '#e0f2fe']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.headerTitle}>Mes Revenus</Text>

        {/* CARTE PRINCIPALE */}
        <BlurView intensity={60} tint="light" style={styles.mainCard}>
          <LinearGradient colors={['rgba(16, 185, 129, 0.05)', 'rgba(99, 102, 241, 0.05)']} style={styles.cardGradient}>
            <Text style={styles.labelLabel}>Ce mois-ci</Text>
            <Text style={styles.mainAmount}>{stats.month.toFixed(2)}€</Text>
            <View style={styles.badge}>
              <Ionicons name="trending-up" size={14} color="#10b981" />
              <Text style={styles.badgeText}>{stats.count} interventions</Text>
            </View>
          </LinearGradient>
        </BlurView>

        {/* GRAPHIQUE HEBDOMADAIRE (Glass) */}
        <Text style={styles.sectionTitle}>Activité 7 derniers jours</Text>
        <BlurView intensity={40} style={styles.chartCard}>
          <BarChart
            data={chartData}
            width={width - 64}
            height={180}
            yAxisLabel=""
            yAxisSuffix="€"
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            fromZero={true}
            style={{ marginVertical: 8, borderRadius: 16 }}
            showValuesOnTopOfBars={true}
          />
        </BlurView>

        <View style={styles.statsGrid}>
          <BlurView intensity={80} style={styles.smallCard}>
            <Ionicons name="calendar-outline" size={20} color="#6366f1" />
            <Text style={styles.smallLabel}>Semaine</Text>
            <Text style={styles.smallAmount}>{stats.week.toFixed(0)}€</Text>
          </BlurView>

          <BlurView intensity={80} style={styles.smallCard}>
            <Ionicons name="stats-chart-outline" size={20} color="#f59e0b" />
            <Text style={styles.smallLabel}>Total</Text>
            <Text style={styles.smallAmount}>{stats.total.toFixed(0)}€</Text>
          </BlurView>
        </View>

        {/* ANALYSE */}
        <View style={styles.infoSection}>
           <Text style={styles.sectionTitle}>Analyse</Text>
           <View style={styles.infoRow}>
              <View style={styles.iconCircle}>
                 <Ionicons name="cash-outline" size={20} color="#10b981" />
              </View>
              <View>
                 <Text style={styles.infoText}>Panier moyen</Text>
                 <Text style={styles.infoValue}>{(stats.total / (stats.count || 1)).toFixed(2)}€</Text>
              </View>
           </View>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 100 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1e293b', marginBottom: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainCard: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)', marginBottom: 24 },
  cardGradient: { padding: 32 },
  labelLabel: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  mainAmount: { fontSize: 44, fontWeight: '900', color: '#1e293b', marginVertical: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  badgeText: { color: '#059669', fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 16, marginTop: 10 },
  chartCard: { borderRadius: 24, padding: 8, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', overflow: 'hidden' },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  smallCard: { flex: 1, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.7)' },
  smallLabel: { fontSize: 12, color: '#64748b', marginTop: 8, fontWeight: '600' },
  smallAmount: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  infoSection: { marginTop: 0 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(255,255,255,0.4)', padding: 16, borderRadius: 20 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  infoText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#1e293b' }
});