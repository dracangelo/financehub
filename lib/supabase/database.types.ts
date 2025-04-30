export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          full_name: string | null
          email: string | null
          phone: string | null
          avatar_url: string | null
          date_of_birth: string | null
          gender: string | null
          is_email_verified: boolean
          mfa_enabled: boolean
          mfa_type: string | null
          is_biometrics_enabled: boolean
          biometric_type: string | null
          suspicious_login_flag: boolean
          last_login_at: string | null
          session_timeout_minutes: number
          emergency_access_enabled: boolean
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          has_consented: boolean
          consent_updated_at: string | null
          privacy_level: string
          local_data_only: boolean
          allow_data_analysis: boolean
          data_retention_policy: string
          locale: string
          currency_code: string
          timezone: string
          theme: string
          date_format: string
          notification_preferences: Json
          onboarding_completed: boolean
          onboarding_step: string | null
          user_role: string
          permission_scope: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
          referral_code: string | null
          signup_source: string | null
          marketing_opt_in: boolean
          last_active_at: string | null
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: string | null
          is_email_verified?: boolean
          mfa_enabled?: boolean
          mfa_type?: string | null
          is_biometrics_enabled?: boolean
          biometric_type?: string | null
          suspicious_login_flag?: boolean
          last_login_at?: string | null
          session_timeout_minutes?: number
          emergency_access_enabled?: boolean
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          has_consented?: boolean
          consent_updated_at?: string | null
          privacy_level?: string
          local_data_only?: boolean
          allow_data_analysis?: boolean
          data_retention_policy?: string
          locale?: string
          currency_code?: string
          timezone?: string
          theme?: string
          date_format?: string
          notification_preferences?: Json
          onboarding_completed?: boolean
          onboarding_step?: string | null
          user_role?: string
          permission_scope?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          referral_code?: string | null
          signup_source?: string | null
          marketing_opt_in?: boolean
          last_active_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          gender?: string | null
          is_email_verified?: boolean
          mfa_enabled?: boolean
          mfa_type?: string | null
          is_biometrics_enabled?: boolean
          biometric_type?: string | null
          suspicious_login_flag?: boolean
          last_login_at?: string | null
          session_timeout_minutes?: number
          emergency_access_enabled?: boolean
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          has_consented?: boolean
          consent_updated_at?: string | null
          privacy_level?: string
          local_data_only?: boolean
          allow_data_analysis?: boolean
          data_retention_policy?: string
          locale?: string
          currency_code?: string
          timezone?: string
          theme?: string
          date_format?: string
          notification_preferences?: Json
          onboarding_completed?: boolean
          onboarding_step?: string | null
          user_role?: string
          permission_scope?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          referral_code?: string | null
          signup_source?: string | null
          marketing_opt_in?: boolean
          last_active_at?: string | null
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          balance: number
          currency: string
          is_active: boolean
          institution: string | null
          account_number: string | null
          notes: string | null
          color: string | null
          icon: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          name: string
          type: string
          balance: number
          currency: string
          is_active?: boolean
          institution?: string | null
          account_number?: string | null
          notes?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          balance?: number
          currency?: string
          is_active?: boolean
          institution?: string | null
          account_number?: string | null
          notes?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      asset_classes: {
        Row: {
          id: string
          user_id: string
          name: string
          target_allocation: number
          current_allocation: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          name: string
          target_allocation: number
          current_allocation: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_allocation?: number
          current_allocation?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          is_income: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          is_income: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          is_income?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      emergency_fund: {
        Row: {
          id: string
          user_id: string
          current_amount: number
          target_amount: number
          monthly_contribution: number
          monthly_expenses: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          current_amount: number
          target_amount: number
          monthly_contribution: number
          monthly_expenses: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          current_amount?: number
          target_amount?: number
          monthly_contribution?: number
          monthly_expenses?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      emergency_fund_transactions: {
        Row: {
          id: string
          emergency_fund_id: string
          amount: number
          transaction_type: string
          description: string | null
          date: string
          created_at: string
        }
        Insert: {
          id: string
          emergency_fund_id: string
          amount: number
          transaction_type: string
          description?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          emergency_fund_id?: string
          amount?: number
          transaction_type?: string
          description?: string | null
          date?: string
          created_at?: string
        }
      }
      income_sources: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          amount: number
          frequency: string
          currency: string
          start_date: string | null
          end_date: string | null
          is_taxable: boolean
          tax_category: string | null
          notes: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          name: string
          type: string
          amount: number
          frequency: string
          currency: string
          start_date?: string | null
          end_date?: string | null
          is_taxable: boolean
          tax_category?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: string
          amount?: number
          frequency?: string
          currency?: string
          start_date?: string | null
          end_date?: string | null
          is_taxable?: boolean
          tax_category?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      investments: {
        Row: {
          id: string
          user_id: string
          name: string
          ticker: string | null
          type: string
          value: number
          cost_basis: number
          asset_class_id: string
          allocation: number
          currency: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          name: string
          ticker?: string | null
          type: string
          value: number
          cost_basis: number
          asset_class_id: string
          allocation: number
          currency: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          ticker?: string | null
          type?: string
          value?: number
          cost_basis?: number
          asset_class_id?: string
          allocation?: number
          currency?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      merchant_analytics: {
        Row: {
          id: string
          merchant_name: string
          visit_count: number
          average_spend: number
          last_visit_date: string
          common_categories: string[]
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          merchant_name: string
          visit_count: number
          average_spend: number
          last_visit_date: string
          common_categories: string[]
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          merchant_name?: string
          visit_count?: number
          average_spend?: number
          last_visit_date?: string
          common_categories?: string[]
          created_at?: string
          updated_at?: string | null
        }
      }
      receipts: {
        Row: {
          id: string
          transaction_id: string
          image_url: string
          has_warranty: boolean
          warranty_end_date: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          transaction_id: string
          image_url: string
          has_warranty: boolean
          warranty_end_date?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          transaction_id?: string
          image_url?: string
          has_warranty?: boolean
          warranty_end_date?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      split_transactions: {
        Row: {
          id: string
          transaction_id: string
          amount: number
          description: string | null
          participant_name: string
          is_settled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          amount: number
          description?: string | null
          participant_name: string
          is_settled: boolean
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          amount?: number
          description?: string | null
          participant_name?: string
          is_settled?: boolean
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          category_id: string
          date: string
          amount: number
          description: string
          is_income: boolean
          merchant_name: string | null
          is_recurring: boolean
          recurrence_pattern: string | null
          time_of_day: string | null
          is_split: boolean
          latitude: number | null
          longitude: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          account_id: string
          category_id: string
          date: string
          amount: number
          description: string
          is_income: boolean
          merchant_name?: string | null
          is_recurring?: boolean
          recurrence_pattern?: string | null
          time_of_day?: string | null
          is_split?: boolean
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          category_id?: string
          date?: string
          amount?: number
          description?: string
          is_income?: boolean
          merchant_name?: string | null
          is_recurring?: boolean
          recurrence_pattern?: string | null
          time_of_day?: string | null
          is_split?: boolean
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

