'use client';

import { useEffect, useState } from 'react';
import { userService } from '@/src/services/user.service';
import { Check, X, Eye, Clock, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

export default function VerificationPage() {
  const [nurses, setNurses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNurse, setSelectedNurse] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const loadNurses = async () => {
    // On récupère la session actuelle
    const { data: { session } } = await supabase.auth.getSession();
    
    // Si pas de session, on ne cherche même pas
    if (!session) return;

    setLoading(true);
    try {
      const data = await userService.getPendingNurses();
      console.log("Données chargées dans le state:", data);
      setNurses(data);
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNurses(); }, []);

  const handleAction = async (id: string, status: 'verified' | 'rejected') => {
    try {
      setLoading(true);
      await userService.updateVerificationStatus(id, status, status === 'rejected' ? rejectReason : undefined);
      
      // Notification visuelle
      alert(status === 'verified' ? "Infirmier validé et notifié !" : "Dossier rejeté et motif envoyé.");
      
      setSelectedNurse(null);
      setIsRejecting(false);
      setRejectReason('');
      loadNurses();
    } catch (err) {
      alert("Erreur technique lors de la validation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Hub de Vérification</h1>
          <p className="text-zinc-500">Dossiers infirmiers en attente de validation.</p>
        </div>
        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Clock size={14} /> {nurses.length} À TRAITER
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Infirmier</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">INAMI / VISA</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Inscription</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-zinc-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {nurses.map((nurse) => (
              <tr key={nurse.id} className="hover:bg-zinc-50 transition-colors group">
                <td className="px-6 py-4 font-medium text-zinc-900">{nurse.full_name || "Sans nom"}</td>
                <td className="px-6 py-4 text-sm text-zinc-600">
                  <div className="font-mono">N° {nurse.inami_number || "---"}</div>
                  <div className="text-[10px] text-zinc-400 uppercase font-bold">
                    Visa: {nurse.has_visa_permanent ? "✅ OK" : "❌ Manquant"}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500">
                  {new Date(nurse.created_at).toLocaleDateString('fr-BE')}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedNurse(nurse)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Eye size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {nurses.length === 0 && !loading && (
          <div className="p-20 text-center text-zinc-400 italic">Tous les dossiers sont validés.</div>
        )}
      </div>

      {/* MODALE DE DÉTAILS ET DÉCISION */}
      {selectedNurse && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-zinc-200">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-tight">Vérification de Profil</h2>
              <button onClick={() => { setSelectedNurse(null); setIsRejecting(false); }} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Grid d'infos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Nom Complet</label>
                  <p className="font-semibold text-zinc-900">{selectedNurse.full_name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Numéro INAMI</label>
                  <p className="font-mono font-bold text-indigo-600">{selectedNurse.inami_number || 'Non fourni'}</p>
                </div>
              </div>

              {/* Accès aux fichiers du Bucket */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-2">
                  <FileText size={12}/> Document de qualification
                </label>
                {(selectedNurse.visa_url || selectedNurse.inami_card_path) ? (
                  <a 
                    href={selectedNurse.visa_url} 
                    target="_blank" 
                    className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl group hover:bg-indigo-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg shadow-sm">
                        <FileText className="text-indigo-600" size={20} />
                      </div>
                      <span className="text-sm font-semibold text-indigo-900">Voir la carte INAMI / VISA</span>
                    </div>
                    <ExternalLink size={16} className="text-indigo-400 group-hover:text-indigo-600" />
                  </a>
                ) : (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">Aucun document téléversé.</span>
                  </div>
                )}
              </div>

              {/* Zone de Refus (Feedback) */}
              {isRejecting && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-bold text-rose-500 uppercase">Motif du refus (Sera envoyé à l'infirmier)</label>
                  <textarea 
                    autoFocus
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ex: Le document est illisible ou expiré..."
                    className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500 outline-none min-h-[100px]"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-100">
                {!isRejecting ? (
                  <>
                    <button 
                      onClick={() => setIsRejecting(true)}
                      className="flex-1 py-4 text-rose-600 font-bold text-sm hover:bg-rose-50 rounded-2xl transition-all"
                    >
                      Refuser le dossier
                    </button>
                    <button 
                      onClick={() => handleAction(selectedNurse.id, 'verified')}
                      className="flex-1 py-4 bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 rounded-2xl transition-all shadow-xl shadow-zinc-200 flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> Approuver l'infirmier
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsRejecting(false)}
                      className="px-6 py-4 text-zinc-500 font-bold text-sm"
                    >
                      Annuler
                    </button>
                    <button 
                      disabled={!rejectReason}
                      onClick={() => handleAction(selectedNurse.id, 'rejected')}
                      className="flex-1 py-4 bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-rose-200"
                    >
                      Confirmer le refus
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}