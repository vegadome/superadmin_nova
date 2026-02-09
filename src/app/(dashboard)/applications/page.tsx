'use client';

import { useEffect, useState } from 'react';
import { applicationService } from '@/src/services/application.service';
import { Clock, User, Building2, ChevronRight, AlertCircle } from 'lucide-react';

export default function ApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await applicationService.getPendingApplications();
      setApps(data);
      setLoading(false);
    };
    load();
  }, []);

  const getTimeDiff = (date: string) => {
    const hours = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    return hours;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Flux des Candidatures</h1>
        <p className="text-zinc-500 text-sm">Surveillez la réactivité des établissements.</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Infirmier</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Mission / Établissement</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">Attente</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {apps.map((app) => {
                const hoursWaiting = getTimeDiff(app.created_at);
                return (
                  <tr key={app.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {app.nurse?.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{app.nurse?.full_name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{app.nurse?.inami_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-900 font-medium text-sm">
                        <Building2 size={14} className="text-zinc-400" />
                        {app.mission?.facility_name}
                      </div>
                      <p className="text-xs text-zinc-500">{app.mission?.specialty}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${hoursWaiting > 24 ? 'text-rose-500' : 'text-amber-500'}`}>
                        <Clock size={14} />
                        {hoursWaiting}h
                        {hoursWaiting > 24 && <AlertCircle size={14} className="animate-pulse" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {apps.length === 0 && !loading && (
          <div className="p-20 text-center text-zinc-400 italic">Aucune candidature en attente.</div>
        )}
      </div>
    </div>
  );
}