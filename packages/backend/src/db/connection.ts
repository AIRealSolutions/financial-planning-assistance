import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

let supabaseClient: SupabaseClient | null = null;

export const initializeDatabase = async (): Promise<SupabaseClient> => {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  try {
    const { data, error } = await supabaseClient.from('organizations').select('COUNT(*)').limit(1);
    if (error) {
      throw error;
    }
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }

  return supabaseClient;
};

export const getDatabase = (): SupabaseClient => {
  if (!supabaseClient) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return supabaseClient;
};

export const closeDatabase = async () => {
  if (supabaseClient) {
    // Supabase client cleanup if needed
    supabaseClient = null;
  }
};
