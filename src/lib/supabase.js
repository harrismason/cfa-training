import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://xcklsgpwvkbofaxzjevu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhja2xzZ3B3dmtib2ZheHpqZXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDc0MjQsImV4cCI6MjA4OTY4MzQyNH0.BvXn8tRj9rmK1JEWj8C30lODUCIi6eZKX3eeUOECAT8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

export function getSupabase()     { return supabase; }
export function isSupabaseReady() { return true; }

// Auth helpers
export async function signInWithEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password) {
  return supabase.auth.signUp({ email, password });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/store-code` },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
