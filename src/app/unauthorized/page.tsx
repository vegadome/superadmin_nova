'use client';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function Unauthorized() {
  const { profile, signOut } = useAuthStore();

  return (
    <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-bold text-red-600">Accès Refusé</h1>
      <p className="mt-2 text-gray-600">
        Votre compte ({profile?.full_name}) a le rôle : <strong>{profile?.role || 'aucun'}</strong>
      </p>
      <p className="text-sm text-gray-400 mt-1">L'accès Admin requiert le rôle "admin".</p>
      
      <button 
        onClick={() => {
          signOut();
          window.location.href = '/login';
        }}
        className="mt-6 rounded-lg bg-black px-4 py-2 text-white"
      >
        Se déconnecter et réessayer
      </button>
    </div>
  );
}