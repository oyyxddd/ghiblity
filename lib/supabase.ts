import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 如果没有 Supabase 环境变量，创建一个空的客户端
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 检查 Supabase 是否可用
export const isSupabaseAvailable = !!(supabaseUrl && supabaseAnonKey);

// Database types
export interface AvatarGeneration {
  id: string;
  user_email?: string;
  original_image_base64: string;
  generated_image_url?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  created_at: string;
  updated_at: string;
  error_message?: string;
} 