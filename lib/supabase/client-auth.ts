import { getClientSupabaseClient } from './client';

/**
 * Get the authenticated user on the client side
 * Uses getUser() for secure authentication and falls back to getSession() if needed
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = getClientSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not available');
      return null;
    }

    // First try to get the user (most secure method)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.warn('Failed to get user, falling back to session:', userError?.message);
      // Fall back to getSession if getUser fails
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    }

    return user;
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error);
    return null;
  }
}

/**
 * Ensure the user is authenticated
 * Redirects to login if not authenticated
 */
export async function ensureAuthenticated(redirectTo = '/login') {
  const user = await getAuthenticatedUser();
  if (!user) {
    // Using window.location for client-side redirect
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
    return false;
  }
  return true;
}

export const authUtils = {
  getAuthenticatedUser,
  ensureAuthenticated,
};
