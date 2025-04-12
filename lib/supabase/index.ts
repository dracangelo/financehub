// This file provides a unified interface for Supabase clients
// and helps with migration from the legacy client

import { createServerSupabaseClient, supabase as serverSupabase } from "./server"
import { createSupabaseClient } from "./client"
import { supabase as browserSupabase } from "./client"

// Export the server client
export const createClient = createServerSupabaseClient
export const supabase = serverSupabase

// Export the browser client
export const createBrowserClient = createSupabaseClient
export const browserSupabaseClient = browserSupabase

// Add a deprecation warning for direct imports
if (typeof window !== "undefined") {
  console.warn(
    "Importing from lib/supabase directly is deprecated. Use lib/supabase/client for client components and lib/supabase/server for server components.",
  )
}

