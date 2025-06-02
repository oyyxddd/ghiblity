import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface AvatarGeneration {
  id: string;
  user_email?: string;
  original_image_url: string;
  generated_image_url?: string;
  status: 'pending' | 'success' | 'failed';
  created_at: string;
  updated_at: string;
  error_message?: string;
} 