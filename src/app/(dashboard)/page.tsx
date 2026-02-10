'use client';

import { useEffect, useState } from 'react';
import { statsService } from '@/src/services/stats.service';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  Loader2,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Chargement parallèle des stats de base et de l'historique du graphique
        const [basicStats, history] = await Promise.all([
          statsService.getDashboardStats(),
          statsService.getRevenueHistory()
        ]);
        setStats(basicStats);
        setChartData(history);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
      <p className="text-zinc-500 text-sm font-medium">Chargement de vos statistiques...</p>
    </div>
  );

  const cards = [
    { label: 'Infirmiers en attente', value: stats?.pendingNurses || 0, icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Infirmiers', value: stats?.totalNurses || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Missions Actives', value: stats?.activeMissions || 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'CA InfiMatch', value: `${(stats?.totalRevenue || 0).toLocaleString()}€`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8 p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Vue d'ensemble</h1>
          <p className="text-zinc-500 text-sm">Analyse de l'activité et des revenus d'InfiMatch.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 bg-white px-4 py-2 rounded-2xl border border-zinc-200 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          LIVE DATA
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
            <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon size={24} />
            </div>
            <p className="text-sm font-medium text-zinc-500">{card.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-black text-zinc-900 tracking-tight">{card.value}</p>
              <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-lg">
                <ArrowUpRight size={12} className="mr-0.5" /> +12%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAPHIQUE DE REVENUS RECHARTS */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-zinc-100 shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Croissance des Revenus</h3>
              <p className="text-zinc-500 text-sm">Commissions nettes prélevées sur les missions terminées.</p>
            </div>
            <select className="text-xs font-bold border-zinc-200 rounded-lg bg-zinc-50 p-2 outline-none">
              <option>6 derniers mois</option>
              <option>Cette année</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  tickFormatter={(value) => `${value}€`}
                />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Actions & Sidebar Dashboard */}
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-3xl p-6 text-white shadow-xl shadow-zinc-200">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-400" /> Actions rapides
            </h3>
            <div className="space-y-3">
              <button className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-left transition-all group">
                <p className="text-xs font-bold text-indigo-300 uppercase">Vérification</p>
                <p className="text-sm font-medium mt-1 group-hover:translate-x-1 transition-transform">
                  Vérifier {stats?.pendingNurses || 0} nouveaux dossiers
                </p>
              </button>
              <button className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-left transition-all group">
                <p className="text-xs font-bold text-emerald-300 uppercase">Support</p>
                <p className="text-sm font-medium mt-1 group-hover:translate-x-1 transition-transform">
                  Répondre aux messages
                </p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-4">Statut Plateforme</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl">
                <span className="text-sm text-zinc-600">Serveurs</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Opérationnel
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl">
                <span className="text-sm text-zinc-600">Stripe Connect</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Actif
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}