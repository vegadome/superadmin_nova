'use client';

import { 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  FileText, 
  CreditCard, 
  LogOut 
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/src/store/useAuthStore';

export function Sidebar() {
  const pathname = usePathname();
  const signOut = useAuthStore((state) => state.signOut);

  const navItems = [
    { name: 'Vue d’ensemble', href: '/', icon: LayoutDashboard },
    { name: 'Vérification', href: '/verification', icon: UserCheck },
    { name: 'Utilisateurs', href: '/users', icon: Users },
    { name: 'Missions', href: '/missions', icon: FileText },
    { name: 'Finance', href: '/finance', icon: CreditCard },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-zinc-100">
        <h2 className="text-lg font-bold text-indigo-600 tracking-tighter uppercase">InfiMatch Admin</h2>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active 
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100' 
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-100">
        <button
          onClick={() => {
            signOut();
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}