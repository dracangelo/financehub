// Legacy client - redirects to the new module structure
import { supabase, createClient } from "./supabase/index"
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export { supabase, createClient }

// Add a deprecation warning
console.warn(
  "lib/supabase.ts is deprecated. Use lib/supabase/client for client components and lib/supabase/server for server components.",
)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with the service role key for server-side operations
export const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

// Create a Supabase client for client-side operations (uses anon key)
export const supabaseClient = createSupabaseClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to get the current user's ID from the session
export async function getCurrentUserId() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.user?.id;
}

// Helper function to check if a user is authenticated
export async function isAuthenticated() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return !!session;
}

// Helper function to get the current user's session
export async function getSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session;
}

