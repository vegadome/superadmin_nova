'use client';

import { useEffect, useState } from 'react';
import { userService } from '@/src/services/user.service';
import { 
  Check, 
  X, 
  Eye, 
  Clock, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  RotateCw,
  ZoomIn 
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

function ZoomableImage({ src, rotation, onRotate, label, icon: Icon, isAspectVideo = false }: any) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!src) return (
    <div className="aspect-square bg-zinc-100 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-zinc-200">
      <p className="text-zinc-400 text-[10px] font-bold uppercase">Image manquante</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          {Icon && <Icon size={14}/>} {label}
        </label>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className={`p-1 rounded-lg transition-all ${isZoomed ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100'}`}
          >
            <ZoomIn size={16} />
          </button>
          <button 
            type="button"
            onClick={onRotate} 
            className="text-indigo-600 p-1 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      <div className={`relative overflow-hidden border-2 transition-all duration-300 ${
          isAspectVideo ? 'aspect-video rounded-3xl' : 'aspect-square rounded-[2rem]'
        } ${isZoomed ? 'scale-[1.05] border-indigo-400 shadow-2xl z-20 ring-4 ring-indigo-50' : 'border-zinc-200 bg-zinc-50'}`}
      >
        <img 
          src={src} 
          style={{ 
            transform: `rotate(${rotation}deg) ${isZoomed ? 'scale(1.8)' : 'scale(1)'}`, 
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
          className={`w-full h-full object-contain mx-auto ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => setIsZoomed(!isZoomed)}
          alt={label}
        />
        {!isZoomed && (
          <a href={src} target="_blank" className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur shadow-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink size={16} className="text-zinc-600" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function VerificationPage() {
  const [nurses, setNurses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNurse, setSelectedNurse] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rotations, setRotations] = useState({ inami: 0, idCard: 0, selfie: 0 });

  const loadNurses = async () => {
    setLoading(true);
    try {
      const data = await userService.getPendingNurses();
      setNurses(data);
    } catch (err) { 
      console.error("Erreur de chargement:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadNurses(); }, []);

  const handleRotate = (key: keyof typeof rotations) => {
    setRotations(prev => ({ ...prev, [key]: (prev[key] + 90) % 360 }));
  };

  const handleAction = async (id: string, status: 'verified' | 'rejected') => {
    try {
      setLoading(true);
      await userService.updateVerificationStatus(id, status, status === 'rejected' ? rejectReason : undefined);
      setSelectedNurse(null);
      setIsRejecting(false);
      setRejectReason('');
      setRotations({ inami: 0, idCard: 0, selfie: 0 });
      loadNurses();
    } catch (err) { 
      alert("Erreur lors de la mise à jour"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Vérification des prestataires</h1>
          <p className="text-zinc-500 text-sm font-medium">Validation des documents d'identité et INAMI.</p>
        </div>
        <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 shadow-sm uppercase">
          <Clock size={14} /> {nurses.length} Dossiers en attente
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Infirmier</th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">N° INAMI</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {nurses.map((nurse) => (
              <tr key={nurse.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-zinc-900">{nurse.full_name}</td>
                <td className="px-6 py-4 font-mono text-sm text-indigo-600">{nurse.inami_number}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setSelectedNurse(nurse)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                    <Eye size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {nurses.length === 0 && !loading && (
          <div className="p-20 text-center text-zinc-400 font-medium">Tous les dossiers ont été traités.</div>
        )}
      </div>

      {selectedNurse && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] max-w-3xl w-full shadow-2xl overflow-hidden border border-zinc-200 max-h-[90vh] flex flex-col">
            
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-30">
              <h2 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">Dossier : {selectedNurse.full_name}</h2>
              <button onClick={() => { setSelectedNurse(null); setIsRejecting(false); }} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto">
              {/* Carte INAMI - Utilise inami_url transformé par le service */}
              <ZoomableImage 
                label="Carte Professionnelle INAMI"
                icon={FileText}
                src={selectedNurse.inami_url}
                rotation={rotations.inami}
                onRotate={() => handleRotate('inami')}
                isAspectVideo={true}
              />

              <div className="grid grid-cols-2 gap-6">
                <ZoomableImage 
                  label="Recto Carte ID"
                  icon={ShieldCheck}
                  src={selectedNurse.id_card_url}
                  rotation={rotations.idCard}
                  onRotate={() => handleRotate('idCard')}
                />
                <ZoomableImage 
                  label="Selfie de Contrôle"
                  icon={ShieldCheck}
                  src={selectedNurse.selfie_url}
                  rotation={rotations.selfie}
                  onRotate={() => handleRotate('selfie')}
                />
              </div>

              {isRejecting && (
                <div className="space-y-3 p-6 bg-rose-50 rounded-3xl border border-rose-100 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-bold text-rose-500 uppercase">Motif du rejet (visible par l'infirmier)</label>
                  <textarea 
                    autoFocus
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-4 bg-white border border-rose-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-rose-500 min-h-[100px]"
                    placeholder="Ex: La photo de la carte ID est trop floue..."
                  />
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-zinc-100 bg-white sticky bottom-0">
                {!isRejecting ? (
                  <>
                    <button onClick={() => setIsRejecting(true)} className="flex-1 py-4 text-rose-600 font-bold text-sm hover:bg-rose-50 rounded-2xl transition-all">Rejeter</button>
                    <button onClick={() => handleAction(selectedNurse.id, 'verified')} className="flex-[2] py-4 bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all">
                      <Check size={18} /> Valider le profil
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setIsRejecting(false); setRejectReason(''); }} className="px-8 py-4 text-zinc-500 font-bold text-sm">Annuler</button>
                    <button disabled={!rejectReason} onClick={() => handleAction(selectedNurse.id, 'rejected')} className="flex-1 py-4 bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 rounded-2xl disabled:opacity-50">Confirmer le rejet</button>
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