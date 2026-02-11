import { supabase } from '@/src/lib/supabase';
import { create } from 'zustand';

// --- INTERFACES ---

export interface Mission {
  id: string;
  facility_name: string;
  facility_type: string;
  specialty: string;        
  description_service?: string;
  address?: string;         
  department?: string;      
  hourly_rate: number;
  scheduled_at: string;     
  estimated_duration_hours: number; 
  total_price_estimated: number;    
  lat: number;
  lng: number;
  status: 'open' | 'accepted' | 'completed';
  requester_id: string | null;
  dist_meters?: number;     
}


export interface Patient {
  id: string;
  facility_id: string;
  first_name: string;
  last_name: string;
  niss?: string;
  medical_notes?: string;
}

interface MissionState {
  activeMission: Mission | null;
  selectedPatient: Patient | null;
  availableMissions: Mission[];
  userApplications: string[]; 
  patientsInFacility: Patient[];
  careRecords: any[];
  setActiveMission: (mission: Mission | null) => void; 
  setSelectedPatient: (patient: Patient | null) => void;
  setAvailableMissions: (missions: Mission[]) => void; 
  fetchAvailableMissions: () => Promise<void>;
  fetchUserApplications: (userId: string) => Promise<void>;
  fetchPatientsForMission: (facilityId: string) => Promise<void>;
  fetchCareRecords: (patientId: string) => Promise<void>;
  endMission: () => void;
  reset: () => void;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  activeMission: null,
  selectedPatient: null,
  availableMissions: [],
  userApplications: [],
  patientsInFacility: [],
  careRecords: [],

  setActiveMission: (mission) => {
    set({ activeMission: mission });
    if (mission?.requester_id) {
      get().fetchPatientsForMission(mission.requester_id);
    } else {
      set({ patientsInFacility: [] });
    }
  },

  setSelectedPatient: (patient) => set({ selectedPatient: patient }),
  setAvailableMissions: (missions) => set({ availableMissions: missions }),

  fetchAvailableMissions: async () => {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('status', 'open')
      .order('scheduled_at', { ascending: true });

    if (!error) {
      set({ availableMissions: (data as Mission[]) || [] });
    }
  },

  // ... Reste des méthodes fetch identiques ...
  fetchUserApplications: async (userId: string) => {
    if (!userId) return;
    const { data, error } = await supabase.from('mission_applications').select('mission_id').eq('nurse_id', userId);
    if (!error && data) set({ userApplications: data.map(app => app.mission_id) });
  },

  fetchPatientsForMission: async (facilityId: string) => {
    if (!facilityId) return;
    const { data, error } = await supabase.from('patients').select('*').eq('facility_id', facilityId).order('last_name', { ascending: true });
    if (!error) set({ patientsInFacility: data || [] });
  },

  fetchCareRecords: async (patientId: string) => {
    if (!patientId) return;
    const { data, error } = await supabase.from('care_records').select(`*, nurse:profiles(full_name)`).eq('patient_id', patientId).order('created_at', { ascending: false });
    if (!error) set({ careRecords: data || [] });
  },

  endMission: () => set({ activeMission: null, selectedPatient: null, patientsInFacility: [], careRecords: [] }),
  reset: () => set({ activeMission: null, selectedPatient: null, availableMissions: [], userApplications: [], patientsInFacility: [], careRecords: [] }),
}));
