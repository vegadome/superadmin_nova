import { supabase } from '@/src/lib/supabase';
import { create } from 'zustand';

// --- INTERFACE PATIENT ---

export interface Patient {
  id: string;
  name: string;
  first_name: string;
  birth_date?: string;
  ins_number?: string; // Numéro de sécurité sociale (NISS)
  address?: string;
  weight?: number; // Important pour certains dosages
  photo_url?: string;
  referring_doctor?: string; // Médecin traitant
  owner_id: string; // L'ID de l'infirmier/gestionnaire
}

interface UserState {
  profile: any | null; // Profil de l'infirmier (Nom, N° INAMI)
  patients: Patient[];
  setProfile: (profile: any) => void;
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  fetchUserPatients: (userId: string) => Promise<void>;
}

// --- STORE ---

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  patients: [],
  
  setProfile: (profile) => set({ profile }),
  
  setPatients: (patients) => set({ patients }),
  
  addPatient: (patient) => set((state) => ({ 
    patients: [patient, ...state.patients] 
  })),

  // Logique pour récupérer les patients depuis Supabase
  fetchUserPatients: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('patients') // Table renommée dans Supabase
        .select('*')
        .eq('owner_id', userId)
        .order('name', { ascending: true }); // Tri par nom plus logique pour des humains

      if (error) throw error;

      if (data) {
        set({ patients: data });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
    }
  },
}));