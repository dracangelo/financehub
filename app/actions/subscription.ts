'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { 
  Subscription, 
  SubscriptionCategory, 
  SubscriptionCategoryInfo,
  SubscriptionUsageLog, 
  SubscriptionPriceChange,
  PotentialDuplicateSubscription 
} from '@/types/subscription';

// Create a Supabase client for server components
const getSupabase = async () => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
};

// Get the current authenticated user using the auth library
const getCurrentUser = async (request?: Request) => {
  try {
    // Import the getAuthenticatedUser function from the auth library
    const { getAuthenticatedUser } = await import('@/lib/auth');
    
    // Use the getAuthenticatedUser function to get the current user
    const user = await getAuthenticatedUser();
    
    if (user) {
      return user;
    }
    
    // If we're here, the user is not authenticated via the auth library
    // Try to get client ID from various sources for API routes
    if (request) {
      try {
        const cookieHeader = request.headers.get('cookie');
        if (cookieHeader) {
          // Use a simple regex match instead of trying to parse the cookie
          const clientIdMatch = cookieHeader.match(/client-id=([^;]+)/);
          if (clientIdMatch && clientIdMatch[1]) {
            return { id: clientIdMatch[1], email: null, role: 'anonymous' };
          }
        }
        
        // Check for client-id in headers
        const clientIdHeader = request.headers.get('x-client-id') || 
                              request.headers.get('X-Client-ID');
        if (clientIdHeader) {
          return { id: clientIdHeader, email: null, role: 'anonymous' };
        }
      } catch (cookieError) {
        console.error('Error parsing cookies:', cookieError);
      }
    }
    
    // If we still don't have a user, throw an error
    throw new Error('User not authenticated');
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('User not authenticated');
  }
};

// Get all subscription categories
export async function getSubscriptionCategories(): Promise<SubscriptionCategoryInfo[]> {
  try {
    const supabase = await getSupabase();
    
    const { data, error } = await supabase
      .from('subscription_categories')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching subscription categories:', error);
      return getDefaultCategories();
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception fetching subscription categories:', error);
    return getDefaultCategories();
  }
}

// Provide default categories when database access fails
function getDefaultCategories(): SubscriptionCategoryInfo[] {
  return [
    { id: 'entertainment', name: 'entertainment', description: 'Streaming services', icon: 'video', created_at: new Date().toISOString() },
    { id: 'software', name: 'software', description: 'Software subscriptions', icon: 'laptop', created_at: new Date().toISOString() },
    { id: 'education', name: 'education', description: 'Educational subscriptions', icon: 'book', created_at: new Date().toISOString() },
    { id: 'health', name: 'health', description: 'Health and fitness', icon: 'activity', created_at: new Date().toISOString() },
    { id: 'food', name: 'food', description: 'Food delivery services', icon: 'coffee', created_at: new Date().toISOString() },
    { id: 'utilities', name: 'utilities', description: 'Utility services', icon: 'zap', created_at: new Date().toISOString() },
    { id: 'other', name: 'other', description: 'Other subscriptions', icon: 'more-horizontal', created_at: new Date().toISOString() }
  ];
}

// Get all subscriptions for the current user - using admin client to bypass RLS
export async function getUserSubscriptions(): Promise<Subscription[]> {
  try {
    // Get the current user - this will throw an error if the user is not authenticated
    const user = await getCurrentUser();
    
    // Import supabaseAdmin which bypasses RLS policies
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    console.log('Fetching subscriptions for user:', user.id);
    
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Database error fetching subscriptions:', error);
      return [];
    }
    
    // Log success for debugging
    if (data && data.length > 0) {
      console.log(`Found ${data.length} subscriptions for user ${user.id}`);
    } else {
      console.log(`No subscriptions found for user ${user.id}`);
    }
    
    return data || [];
  } catch (error) {
    // Check if the error is due to authentication
    if (error instanceof Error && error.message === 'User not authenticated') {
      console.log('User not authenticated, returning empty subscriptions array');
    } else {
      console.error('Error fetching subscriptions:', error);
    }
    // Return an empty array as fallback
    return [];
  }
}

// Helper function to get client-side subscriptions
async function getClientSideSubscriptions(userId: string): Promise<Subscription[]> {
  // This is a server-side function, so we can't access localStorage directly
  // Instead, we return an empty array and let the client component handle it
  return [];
}

// Get a specific subscription by ID - using admin client to bypass RLS
export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  // Handle special cases for non-UUID IDs
  if (id === 'active') {
    // For special IDs like 'active', we'll return the first active subscription
    const subscriptions = await getUserSubscriptions();
    const activeSubscriptions = subscriptions.filter(sub => sub.is_active);
    
    // If there are active subscriptions, return the first one
    if (activeSubscriptions.length > 0) {
      return activeSubscriptions[0];
    }
    
    // If no active subscriptions, return a placeholder
    return {
      id: 'active',
      name: 'No Active Subscriptions',
      description: 'You have no active subscriptions',
      is_active: true,
      amount: 0,
      currency: 'USD',
      recurrence: 'monthly',
      user_id: '00000000-0000-0000-0000-000000000000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service_provider: null,
      category: 'other',
      start_date: new Date().toISOString(),
      end_date: null,
      roi_expected: 0,
      roi_actual: 0,
      roi_notes: null,
    };
  }
  
  // Validate if the ID is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.warn(`Invalid UUID format: ${id}`);
    return null;
  }
  
  try {
    const user = await getCurrentUser();
    
    // Import supabaseAdmin which bypasses RLS policies
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    console.log(`Fetching subscription with ID: ${id} for user: ${user.id}`);
    
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching subscription by ID:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return null;
  }
}

// Create a new subscription - always save to database using admin client to bypass RLS
export async function createSubscription(
  subscription: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Subscription> {
  const user = await getCurrentUser();
  
  try {
    // Import supabaseAdmin which bypasses RLS policies
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    console.log('Creating subscription for user:', user.id);
    
    // Clean up the subscription data to prevent invalid UUID errors
    const cleanedSubscription = { ...subscription };
    
    // Handle category as needed - convert category to category_id if necessary
    // This is a compatibility layer for different field naming conventions
    
    // Use supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        ...cleanedSubscription,
        user_id: user.id
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating subscription in database:', error);
      throw error;
    }
    
    revalidatePath('/subscriptions');
    return data;
  } catch (error: any) {
    console.error('Failed to create subscription:', error);
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
}

// Update an existing subscription
export async function updateSubscription(id: string, subscription: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Subscription> {
  const user = await getCurrentUser();
  const supabase = getSupabase();
  
  // First check if the subscription belongs to the user
  const { data: existingSubscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
    
  if (fetchError) {
    throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
  }
  
  if (!existingSubscription) {
    throw new Error('Subscription not found or you do not have permission to update it');
  }
  
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      ...subscription,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
  
  revalidatePath('/subscriptions');
  return data;
}

// Delete a subscription
export async function deleteSubscription(id: string): Promise<void> {
  const user = await getCurrentUser();
  const supabase = getSupabase();
  
  // First check if the subscription belongs to the user
  const { data: existingSubscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
    
  if (fetchError) {
    throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
  }
  
  if (!existingSubscription) {
    throw new Error('Subscription not found or you do not have permission to delete it');
  }
  
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id);
    
  if (error) {
    throw new Error(`Failed to delete subscription: ${error.message}`);
  }
  
  revalidatePath('/subscriptions');
}

// Log subscription usage
export async function logSubscriptionUsage(subscriptionId: string, usedOn: string, note?: string): Promise<SubscriptionUsageLog> {
  const user = await getCurrentUser();
  const supabase = getSupabase();
  
  // First check if the subscription belongs to the user
  const { data: existingSubscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('user_id', user.id)
    .single();
    
  if (fetchError) {
    throw new Error(`Failed to fetch subscription: ${fetchError.message}`);
  }
  
  if (!existingSubscription) {
    throw new Error('Subscription not found or you do not have permission to log usage');
  }
  
  const { data, error } = await supabase
    .from('subscription_usage_logs')
    .insert({
      subscription_id: subscriptionId,
      user_id: user.id,
      used_on: usedOn,
      note
    })
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to log subscription usage: ${error.message}`);
  }
  
  revalidatePath('/subscriptions');
  return data;
}

// Get usage logs for a subscription
export async function getSubscriptionUsageLogs(subscriptionId: string): Promise<SubscriptionUsageLog[]> {
  const user = await getCurrentUser();
  const supabase = getSupabase();
  
  // Check if the ID is a valid UUID format
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subscriptionId);
  
  if (!isValidUuid) {
    // If not a valid UUID, we might be viewing a filtered subscription
    // In this case, we'll return an empty array as we don't have a specific subscription ID
    return [];
  }
  
  const { data, error } = await supabase
    .from('subscription_usage_logs')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .eq('user_id', user.id)
    .order('used_on', { ascending: false });
    
  if (error) {
    console.error('Error fetching subscription usage logs:', error);
    return [];
  }
  
  return data || [];
}

// Get price change history for a subscription
export async function getSubscriptionPriceChanges(subscriptionId: string): Promise<SubscriptionPriceChange[]> {
  const user = await getCurrentUser();
  const supabase = getSupabase();
  
  // Check if the ID is a valid UUID format
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subscriptionId);
  
  if (!isValidUuid) {
    // If not a valid UUID, we might be viewing a filtered subscription
    // In this case, we'll return an empty array as we don't have a specific subscription ID
    return [];
  }
  
  // First check if the subscription belongs to the user
  const { data: existingSubscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('user_id', user.id)
    .single();
    
  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return []; // No subscription found, return empty array
    }
    console.error('Error checking subscription ownership:', fetchError);
    return [];
  }
  
  if (!existingSubscription) {
    return []; // Subscription not found or user doesn't have permission
  }
  
  const { data, error } = await supabase
    .from('subscription_price_changes')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('changed_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching subscription price changes:', error);
    return [];
  }
  
  return data || [];
}

// Get potential duplicate subscriptions
export async function getPotentialDuplicateSubscriptions(): Promise<PotentialDuplicateSubscription[]> {
  const user = await getCurrentUser();
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('potential_duplicate_subscriptions')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) {
    throw new Error(`Failed to fetch potential duplicate subscriptions: ${error.message}`);
  }
  
  return data || [];
}
