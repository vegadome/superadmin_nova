import { supabase } from '@/src/lib/supabase';
import { Appointment } from '@/src/store/useMissionStore';

export async function createAppointment(
  appointment: Omit<Appointment, 'id' | 'created_at'>
): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        client_id: appointment.client_id,
        vet_id: appointment.vet_id,
        pet_id: appointment.pet_id,
        service_type: appointment.service_type,
        status: 'pending',
        location: appointment.location,
        scheduled_at: appointment.scheduled_at || new Date().toISOString(),
      })
      .select(`
        *,
        vet:vet_id (*),
        pet:pet_id (*)
      `)
      .single();

    if (error) {
      console.error('Erreur création rendez-vous:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

export async function getUserAppointments(userId: string): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        vet:vet_id (*),
        pet:pet_id (*)
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
}

export async function cancelAppointment(appointmentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur:', error);
    return false;
  }
}