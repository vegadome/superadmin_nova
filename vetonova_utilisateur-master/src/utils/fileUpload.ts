import { supabase } from '@/src/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export const uploadImageToSupabase = async (uri: string, bucket: string, path: string) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { 
      encoding: FileSystem.EncodingType.Base64 
    });
    const fileData = decode(base64);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, fileData, { 
        contentType: 'image/jpeg', 
        upsert: true 
      });

    if (error) throw error;
    
    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};