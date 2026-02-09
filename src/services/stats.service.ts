import { supabase } from '@/src/lib/supabase';

export const statsService = {
    getRevenueHistory: async () => {
        const { data, error } = await supabase
            .from('missions')
            .select('created_at, platform_fee_at_creation')
            .eq('status', 'completed')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Groupement par mois (ex: "Jan", "Feb"...)
        const monthlyData = data.reduce((acc: any, mission) => {
            const month = new Date(mission.created_at).toLocaleString('fr-FR', { month: 'short' });
            acc[month] = (acc[month] || 0) + Number(mission.platform_fee_at_creation);
            return acc;
        }, {});

        return Object.keys(monthlyData).map(month => ({
            name: month,
            revenue: monthlyData[month]
        }));
        },
    getDashboardStats: async () => {
        // 1. Récupérer les comptes (Infirmiers vs Pending)
        const { data: profiles } = await supabase
        .from('profiles')
        .select('verification_status, is_nurse');

        // 2. Récupérer les missions pour le CA et le volume
        const { data: missions } = await supabase
        .from('missions')
        .select('total_cost_estimate, platform_fee_at_creation, status');

        const pendingNurses = profiles?.filter(p => p.is_nurse && p.verification_status === 'pending').length || 0;
        const totalNurses = profiles?.filter(p => p.is_nurse).length || 0;
        const activeMissions = missions?.filter(m => m.status === 'open' || m.status === 'in_progress').length || 0;
        
        // CA InfiMatch (Somme des commissions sur les missions terminées ou payées)
        const totalRevenue = missions?.reduce((acc, m) => acc + (Number(m.platform_fee_at_creation) || 0), 0) || 0;

        return {
        pendingNurses,
        totalNurses,
        activeMissions,
        totalRevenue
        };
    }
};