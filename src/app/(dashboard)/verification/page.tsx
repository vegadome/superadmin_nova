import { UserCheck } from "lucide-react";

export default function VerificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Hub de Vérification</h1>
        <p className="text-zinc-500">Profils infirmiers en attente de validation administrative.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <div className="p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
            <UserCheck className="text-zinc-400" size={24} />
          </div>
          <h3 className="text-zinc-900 font-semibold">Aucun dossier en attente</h3>
          <p className="text-zinc-500 text-sm mt-1">Tous les infirmiers inscrits ont été traités.</p>
        </div>
      </div>
    </div>
  );
}