export interface Expense {
  id: string;
  user_id: string;
  merchant_id: string | null;
  amount: number;
  category: string | null;
  description: string;
  location: { type: string; coordinates: number[] } | null;
  spent_at: string;
  is_recurring: boolean;
  created_at?: string;
  updated_at?: string;
  merchant?: {
    id: string;
    name: string;
    category?: string | null;
  } | null;
}

export interface ExpenseFormData {
  merchant_name: string | null;
  amount: number;
  category: string | null;
  description: string;
  spent_at: string;
  latitude: number | null;
  longitude: number | null;
  is_recurring: boolean;
  notes: string | null;
}

export const ExpenseCategories = [
  "Food", 
  "Transportation", 
  "Housing", 
  "Entertainment", 
  "Utilities", 
  "Shopping", 
  "Health", 
  "Travel", 
  "Education", 
  "Other"
] as const;

export type ExpenseCategory = typeof ExpenseCategories[number];
