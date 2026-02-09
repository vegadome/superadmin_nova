'use client';

import { useEffect, useState } from 'react';
import { missionService } from '@/src/services/mission.service';
import { 
  Search, 
  MoreVertical, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Edit3,
  ExternalLink
} from 'lucide-react';

export default function MissionsModerationPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadMissions = async () => {
    setLoading(true);
    try {
      const data = await missionService.getAllMissions();
      setMissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMissions(); }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return 'bg-emerald-100 text-emerald-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-rose-100 text-rose-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

    const handleCancel = async (mission: any) => {
        const confirmMsg = mission.stripe_payment_intent_id 
            ? "Cette mission a un paiement associé. L'annuler déclenchera un remboursement automatique sur Stripe. Confirmer ?"
            : "Voulez-vous annuler cette mission ?";

        if (window.confirm(confirmMsg)) {
            try {
            await missionService.cancelMission(mission.id, mission.stripe_payment_intent_id);
            alert("Mission annulée et remboursement initialisé.");
            loadMissions(); // Refresh
            } catch (err) {
            alert("Erreur : " + err.message);
            }
        }
    };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Modération des Missions</h1>
          <p className="text-zinc-500 text-sm">Surveillez et gérez les offres publiées sur la plateforme.</p>
        </div>
      </div>

      {/* Liste des missions */}
      <div className="grid grid-cols-1 gap-4">
        {missions.map((mission) => (
          <div key={mission.id} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getStatusStyle(mission.status)}`}>
                    {mission.status}
                  </span>
                  <h3 className="font-bold text-zinc-900">{mission.facility_name}</h3>
                </div>
                <p className="text-sm text-zinc-600 font-medium">{mission.specialty || 'Soins généraux'}</p>
              </div>
              
              <div className="flex gap-2">
                <button 
                    onClick={() => handleCancel(mission)} // On passe tout l'objet mission
                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                    <XCircle size={20} />
                </button>
                <button className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                  <Edit3 size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-50">
              <div className="flex items-center gap-2 text-zinc-500">
                <MapPin size={16} />
                <span className="text-xs truncate">{mission.location_name || 'Bruxelles'}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <Clock size={16} />
                <span className="text-xs">{mission.hourly_rate}€ / heure</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <AlertTriangle size={16} />
                <span className="text-xs font-medium text-amber-600">Com: {mission.platform_fee_at_creation}€</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-400 font-bold uppercase">Infirmier assigné</p>
                <p className="text-xs font-semibold text-zinc-900">
                  {mission.profiles?.full_name || 'En attente...'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}