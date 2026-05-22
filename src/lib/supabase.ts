import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean helpers to check if the credentials provided are real and not default placeholders
export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-supabase-project') || supabaseAnonKey.includes('your-anon-key-here')) {
    return false;
  }
  try {
    // Basic URL validation
    new URL(supabaseUrl);
    return true;
  } catch {
    return false;
  }
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to get image URL from Supabase Storage bucket 'jugadores'
export const getPlayerPhotoUrl = (path: string): string => {
  if (!path) return '';
  // If it's already a full URL (Http), return it directly
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  if (!supabase) return '';
  
  const { data } = supabase.storage.from('jugadores').getPublicUrl(path);
  return data?.publicUrl || '';
};

// Helper to upload a file to Supabase Storage bucket 'jugadores'
export const uploadPlayerPhoto = async (file: File): Promise<string> => {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }

  // Create clean file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `fotos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('jugadores')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  return filePath; // Return the path within the bucket
};
