import { 
  Users, 
  UserCheck, 
  AlertCircle, 
  TrendingUp 
} from 'lucide-react';

export default function DashboardPage() {
  // Plus tard, ces données viendront de tes services (Supabase)
  const stats = [
    { label: 'Infirmiers en attente', value: '12', icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Infirmiers', value: '148', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Missions ouvertes', value: '24', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Alertes documents', value: '3', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Tableau de bord</h1>
        <p className="text-zinc-500 text-sm">Bienvenue dans votre espace de gestion InfiMatch.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
              <p className="text-3xl font-bold text-zinc-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Section Rapid Actions ou Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 min-h-[300px]">
          <h3 className="font-semibold text-zinc-900 mb-4">Activités récentes</h3>
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-sm italic">
            Flux d'activité bientôt disponible...
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-zinc-200">
          <h3 className="font-semibold text-zinc-900 mb-4">Raccourcis</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border border-zinc-100 rounded-xl hover:bg-zinc-50 text-left transition-colors">
              <p className="font-medium text-sm">Vérifier les dossiers</p>
              <p className="text-xs text-zinc-500 mt-1">12 dossiers prioritaires</p>
            </button>
            <button className="p-4 border border-zinc-100 rounded-xl hover:bg-zinc-50 text-left transition-colors">
              <p className="font-medium text-sm">Rapport mensuel</p>
              <p className="text-xs text-zinc-500 mt-1">Générer le CSV</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}