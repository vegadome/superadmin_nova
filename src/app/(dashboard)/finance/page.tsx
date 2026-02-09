'use client';

import { useEffect, useState } from 'react';
import { financeService } from '@/src/services/finance.service';
import { Percent, Building2, Save, CheckCircle2 } from 'lucide-react';

export default function FinancePage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<number>(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getFacilitiesCommissions();
      setFacilities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpdate = async (id: string) => {
    try {
      // Conversion du pourcentage (ex: 12) en décimal (0.12)
      await financeService.updateCommissionRate(id, tempRate / 100);
      setEditingId(null);
      loadData();
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Gestion des Commissions</h1>
        <p className="text-zinc-500 text-sm">Ajustez les frais de service prélevés sur chaque établissement.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {facilities.map((facility) => (
          <div key={facility.id} className="bg-white p-6 rounded-2xl border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-indigo-200 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-50 rounded-xl text-zinc-400">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">{facility.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">{facility.type}</span>
                  {facility.is_verified && <CheckCircle2 size={14} className="text-emerald-500" />}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Commission Actuelle</p>
                {editingId === facility.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="number" 
                      className="w-20 p-2 border border-indigo-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={tempRate}
                      onChange={(e) => setTempRate(Number(e.target.value))}
                    />
                    <span className="font-bold text-zinc-600">%</span>
                  </div>
                ) : (
                  <p className="text-xl font-black text-indigo-600">
                    {(facility.commission_rate * 100).toFixed(1)}%
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                {editingId === facility.id ? (
                  <>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700"
                    >
                      Annuler
                    </button>
                    <button 
                      onClick={() => handleUpdate(facility.id)}
                      className="bg-zinc-900 text-white p-2 rounded-lg hover:bg-black transition-colors"
                    >
                      <Save size={18} />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setEditingId(facility.id);
                      setTempRate(facility.commission_rate * 100);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm"
                  >
                    <Percent size={14} /> Modifier
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {facilities.length === 0 && !loading && (
          <div className="text-center p-20 border-2 border-dashed border-zinc-100 rounded-3xl text-zinc-400">
            Aucun établissement trouvé.
          </div>
        )}
      </div>
    </div>
  );
}