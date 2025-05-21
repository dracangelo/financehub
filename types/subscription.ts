export type SubscriptionRecurrence = 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'yearly';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export type SubscriptionCategory = 
  'entertainment' | 
  'utilities' | 
  'software' | 
  'health' | 
  'education' | 
  'food' | 
  'transportation' | 
  'housing' | 
  'insurance' | 
  'investments' | 
  'other';

export interface SubscriptionCategoryInfo {
  id: string;
  name: SubscriptionCategory;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  service_provider: string | null;
  description: string | null;
  category: SubscriptionCategory;
  amount: number;
  currency: string;
  recurrence: SubscriptionRecurrence;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  roi_expected: number | null;
  roi_actual: number | null;
  roi_notes: string | null;
  created_at: string;
  updated_at: string;
  next_renewal_date?: string; // Optional property for the next renewal date
  client_side?: boolean; // Flag to indicate if this is a client-side only subscription
}

export interface SubscriptionFormData {
  name: string;
  service_provider: string | null;
  description: string | null;
  category: SubscriptionCategory;
  amount: number;
  currency: string;
  recurrence: SubscriptionRecurrence;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  roi_expected: number | null;
  roi_notes: string | null;
}

export interface SubscriptionUsageLog {
  id: string;
  subscription_id: string;
  user_id: string;
  used_on: string;
  note: string | null;
  created_at: string;
}

export interface SubscriptionPriceChange {
  id: string;
  subscription_id: string;
  old_amount: number;
  new_amount: number;
  changed_at: string;
  reason: string | null;
}

export interface OverlappingSubscription {
  overlapping_id: string;
  name: string;
  start_date: string;
  end_date: string | null;
}

export interface ROICalculation {
  subscription_id: string;
  total_cost: number;
  expected_return: number;
  actual_return: number | null;
  roi_percentage: number;
  roi_ratio: number;
  monthly_cost: number;
  annual_cost: number;
  break_even_months: number | null;
}

export interface PotentialDuplicateSubscription {
  id: string;
  user_id: string;
  subscription1_id: string;
  subscription1_name: string;
  subscription2_id: string;
  subscription2_name: string;
  similarity_score: number;
  created_at: string;
}
