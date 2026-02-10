'use client';

import { useEffect, useState } from 'react';
import { userService } from '@/src/services/user.service';
import { Search, Filter, Shield, Building2, UserCircle } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await userService.getAllUsers();
        setUsers(data);
        setFilteredUsers(data);
      } catch (err) {}
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  // Logique de filtrage et recherche
  useEffect(() => {
    let result = users;
    if (activeFilter !== 'all') {
      result = result.filter(u => u.role === activeFilter);
    }
    if (searchTerm) {
      result = result.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.facility_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredUsers(result);
  }, [searchTerm, activeFilter, users]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-bold flex items-center gap-1"><Shield size={12}/> Admin</span>;
      case 'facility': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold flex items-center gap-1"><Building2 size={12}/> Établissement</span>;
      default: return <span className="px-2 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs font-bold flex items-center gap-1"><UserCircle size={12}/> Infirmier</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Gestion des Utilisateurs</h1>
        <p className="text-zinc-500 text-sm">Consultez et modifiez les comptes de la plateforme.</p>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher un nom, un hôpital..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'user', 'facility', 'admin'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                activeFilter === f 
                ? 'bg-zinc-900 text-white' 
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'user' ? 'Infirmiers' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase">
            <tr>
              <th className="px-6 py-4">Nom / Entité</th>
              <th className="px-6 py-4">Rôle</th>
              <th className="px-6 py-4">Statut Véfif.</th>
              <th className="px-6 py-4">Créé le</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-zinc-900">{user.full_name || 'Sans nom'}</div>
                  {user.role === 'facility' && <div className="text-xs text-blue-600 font-medium">{user.facility_name}</div>}
                </td>
                <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    user.verification_status === 'verified' ? 'text-emerald-600 bg-emerald-50' : 
                    user.verification_status === 'pending' ? 'text-amber-600 bg-amber-50' : 'text-zinc-400 bg-zinc-100'
                  }`}>
                    {user.verification_status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button className="text-xs font-bold text-indigo-600 hover:underline">Modifier</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}