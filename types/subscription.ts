export type SubscriptionFrequency = 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface SubscriptionCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  vendor: string | null;
  description: string | null;
  category_id: string | null;
  amount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  next_renewal_date: string;
  auto_renew: boolean;
  status: SubscriptionStatus;
  usage_rating: number | null;
  notes: string | null;
  last_renewed_at: string | null;
  cancel_url: string | null;
  support_contact: string | null;
  created_at: string;
  updated_at: string;
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

export interface PotentialDuplicateSubscription {
  user_id: string;
  vendor: string;
  subscription_ids: string[];
  duplicate_count: number;
}
