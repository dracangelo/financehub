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
export async function getCurrentUserId(request?: Request): Promise<string> {
  try {
    // PRIORITY 1: Get authenticated user ID from the session cookie
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const authCookie = cookieStore.get('sb-oummldjpaqapqhblwjzq-auth-token');
      
      if (authCookie?.value) {
        try {
          let cookieValue = authCookie.value;
          
          // Handle base64-encoded cookies
          if (cookieValue.startsWith('base64-')) {
            try {
              console.log('Decoding base64-encoded cookie');
              const base64Value = cookieValue.substring(7); // Remove 'base64-' prefix
              cookieValue = Buffer.from(base64Value, 'base64').toString('utf-8');
              console.log('Successfully decoded base64 cookie');
            } catch (decodeError) {
              console.error('Error decoding base64 cookie:', decodeError);
              throw new Error('Failed to decode base64 cookie');
            }
          }
          
          // Parse the cookie value
          let parsedCookie;
          try {
            parsedCookie = JSON.parse(cookieValue);
          } catch (jsonError) {
            console.error('Error parsing cookie as JSON:', jsonError);
            console.log('Cookie value that failed to parse:', cookieValue.substring(0, 50) + '...');
            throw new Error('Failed to parse cookie as JSON');
          }
          
          if (parsedCookie && parsedCookie.length > 0) {
            // Extract user ID from the JWT token
            const token = parsedCookie[0];
            if (token) {
              try {
                // Decode the JWT token to get the user ID
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                  if (payload && payload.sub) {
                    console.log(`Using authenticated user ID from cookie: ${payload.sub}`);
                    return payload.sub;
                  }
                }
              } catch (tokenError) {
                console.error('Error decoding JWT token:', tokenError);
              }
            }
          }
        } catch (cookieParseError) {
          console.error('Error parsing auth cookie:', cookieParseError);
        }
      }
      
      // PRIORITY 2: Try the server component client
      const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
      
      const supabase = createServerComponentClient({
        cookies: () => cookieStore
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id) {
        console.log(`Using authenticated user ID from server: ${user.id}`);
        return user.id;
      }
    } catch (serverError) {
      console.error('Error getting user from server:', serverError);
    }
    
    // PRIORITY 3: Check for client ID in request cookies/headers
    if (request) {
      // Try to get client ID from cookies
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const clientIdMatch = cookieHeader.match(/client-id=([^;]+)/);
        if (clientIdMatch && clientIdMatch[1] && clientIdMatch[1].trim() !== '') {
          console.log(`Using client ID from cookie: ${clientIdMatch[1]}`);
          return clientIdMatch[1];
        }
      }
      
      // Try to get client ID from headers
      const clientId = request.headers.get('client-id');
      if (clientId && clientId.trim() !== '') {
        console.log(`Using client ID from header: ${clientId}`);
        return clientId;
      }
    }
    
    // PRIORITY 4: Get user ID directly from the subscriptions table
    try {
      // Look for subscriptions created by this user
      const { data: subscriptions, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!subError && subscriptions && subscriptions.length > 0 && subscriptions[0].user_id) {
        console.log(`Using user ID from subscriptions table: ${subscriptions[0].user_id}`);
        return subscriptions[0].user_id;
      }
    } catch (subError) {
      console.error('Error getting user ID from subscriptions:', subError);
    }
    
    // PRIORITY 5: Get a real user from the database (not the default UUID)
    try {
      const { data: existingUsers, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!userError && existingUsers && existingUsers.length > 0) {
        console.log(`Using existing user ID from database: ${existingUsers[0].id}`);
        return existingUsers[0].id;
      }
    } catch (dbError) {
      console.error('Error getting user from database:', dbError);
    }
    
    // PRIORITY 6: Create a new user as last resort
    try {
      const consistentId = crypto.randomUUID();
      console.log(`Created new consistent user ID: ${consistentId}`);
      
      try {
        const result = await supabaseAdmin
          .from('users')
          .insert({
            id: consistentId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (result.error) {
          console.error('Error storing new user ID:', result.error);
        } else {
          console.log('Successfully stored new user ID in database');
        }
      } catch (insertError: unknown) {
        console.error('Exception storing new user ID:', insertError);
      }
      
      return consistentId;
    } catch (createError) {
      console.error('Error creating new user ID:', createError);
    }
    
    // ABSOLUTE LAST RESORT: Use default UUID
    console.warn('WARNING: Using default UUID as absolute last resort');
    return '00000000-0000-0000-0000-000000000000';
  } catch (error) {
    console.error('Error getting user ID:', error);
    return '00000000-0000-0000-0000-000000000000';
  }
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

