'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { 
  Subscription, 
  SubscriptionCategory, 
  SubscriptionUsageLog, 
  SubscriptionPriceChange,
  PotentialDuplicateSubscription 
} from '@/types/subscription';

// Create a Supabase client for server components
const getSupabase = () => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
};

// Get the current authenticated user
const getCurrentUser = async () => {
  const supabase = getSupabase();
  // Using getUser() instead of getSession() for security as per memory
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  
  return user;
};

// Get all subscription categories
export async function getSubscriptionCategories(): Promise<SubscriptionCategory[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('subscription_categories')
    .select('*')
    .order('name');
    
  if (error) {
    throw new Error(`Failed to fetch subscription categories: ${error.message}`);
  }
  
  return data || [];
}

// Get all subscriptions for the current user
export async function getUserSubscriptions(): Promise<Subscription[]> {
  const user = await getCurrentUser();
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('next_renewal_date');
    
  if (error) {
    throw new Error(`Failed to fetch subscriptions: ${error.message}`);
  }
  
  return data || [];
}

// Get a specific subscription by ID
export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  const user = await getCurrentUser();
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No subscription found
    }
    throw new Error(`Failed to fetch subscription: ${error.message}`);
  }
  
  return data;
}

// Create a new subscription
export async function createSubscription(subscription: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
  const user = await getCurrentUser();
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      ...subscription,
      user_id: user.id
    })
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
  
  revalidatePath('/subscriptions');
  return data;
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
  
  const { data, error } = await supabase
    .from('subscription_usage_logs')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .eq('user_id', user.id)
    .order('used_on', { ascending: false });
    
  if (error) {
    throw new Error(`Failed to fetch subscription usage logs: ${error.message}`);
  }
  
  return data || [];
}

// Get price change history for a subscription
export async function getSubscriptionPriceChanges(subscriptionId: string): Promise<SubscriptionPriceChange[]> {
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
    throw new Error('Subscription not found or you do not have permission to view price changes');
  }
  
  const { data, error } = await supabase
    .from('subscription_price_changes')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('changed_at', { ascending: false });
    
  if (error) {
    throw new Error(`Failed to fetch subscription price changes: ${error.message}`);
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
