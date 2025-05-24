export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      account_balance_history: {
        Row: {
          account_id: string
          balance: number
          change_type: string
          id: string
          note: string | null
          recorded_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          balance: number
          change_type: string
          id?: string
          note?: string | null
          recorded_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          balance?: number
          change_type?: string
          id?: string
          note?: string | null
          recorded_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_balance_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_cash_flow_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_balance_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_balance_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "net_cash_position_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "account_balance_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_number: string | null
          account_type: string | null
          balance: number
          created_at: string | null
          currency: string | null
          id: string
          institution: string | null
          is_active: boolean | null
          is_primary: boolean | null
          name: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          balance?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          institution?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          name: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          balance?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          institution?: string | null
          is_active?: boolean | null
          is_primary?: boolean | null
          name?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_budget_generator_logs: {
        Row: {
          budget_id: string | null
          created_at: string | null
          id: string
          result_summary: string | null
        }
        Insert: {
          budget_id?: string | null
          created_at?: string | null
          id?: string
          result_summary?: string | null
        }
        Update: {
          budget_id?: string | null
          created_at?: string | null
          id?: string
          result_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_budget_generator_logs_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          acquisition_date: string | null
          asset_type: string
          created_at: string | null
          description: string | null
          id: string
          is_liquid: boolean | null
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          acquisition_date?: string | null
          asset_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_liquid?: boolean | null
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          acquisition_date?: string | null
          asset_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_liquid?: boolean | null
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      bill_payments: {
        Row: {
          amount_paid: number
          bill_id: string
          created_at: string | null
          id: string
          note: string | null
          payment_date: string
          payment_method: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          bill_id: string
          created_at?: string | null
          id?: string
          note?: string | null
          payment_date: string
          payment_method?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          bill_id?: string
          created_at?: string | null
          id?: string
          note?: string | null
          payment_date?: string
          payment_method?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      bill_price_changes: {
        Row: {
          bill_id: string
          changed_at: string | null
          id: string
          new_amount: number
          old_amount: number
          reason: string | null
        }
        Insert: {
          bill_id: string
          changed_at?: string | null
          id?: string
          new_amount: number
          old_amount: number
          reason?: string | null
        }
        Update: {
          bill_id?: string
          changed_at?: string | null
          id?: string
          new_amount?: number
          old_amount?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_price_changes_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          account_id: string | null
          amount_due: number
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          expected_payment_account: string | null
          frequency: Database["public"]["Enums"]["bill_frequency"] | null
          id: string
          is_automatic: boolean | null
          last_paid_date: string | null
          name: string
          next_due_date: string
          reminder_days: number | null
          status: Database["public"]["Enums"]["bill_status"] | null
          updated_at: string | null
          user_id: string
          vendor: string | null
        }
        Insert: {
          account_id?: string | null
          amount_due: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expected_payment_account?: string | null
          frequency?: Database["public"]["Enums"]["bill_frequency"] | null
          id?: string
          is_automatic?: boolean | null
          last_paid_date?: string | null
          name: string
          next_due_date: string
          reminder_days?: number | null
          status?: Database["public"]["Enums"]["bill_status"] | null
          updated_at?: string | null
          user_id: string
          vendor?: string | null
        }
        Update: {
          account_id?: string | null
          amount_due?: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expected_payment_account?: string | null
          frequency?: Database["public"]["Enums"]["bill_frequency"] | null
          id?: string
          is_automatic?: boolean | null
          last_paid_date?: string | null
          name?: string
          next_due_date?: string
          reminder_days?: number | null
          status?: Database["public"]["Enums"]["bill_status"] | null
          updated_at?: string | null
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_cash_flow_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "net_cash_position_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "bill_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      budget_adjustments: {
        Row: {
          amount_change: number
          created_at: string | null
          id: string
          item_id: string | null
          reason: string | null
          updated_at: string | null
        }
        Insert: {
          amount_change: number
          created_at?: string | null
          id?: string
          item_id?: string | null
          reason?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_change?: number
          created_at?: string | null
          id?: string
          item_id?: string | null
          reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_adjustments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_categories: {
        Row: {
          budget_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_category_id: string | null
          updated_at: string | null
        }
        Insert: {
          budget_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_bill_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_expense_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_goal_contributions"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_income_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_investment_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "budget_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          actual_amount: number | null
          amount: number
          category_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          actual_amount?: number | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_amount?: number | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "budget_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_scenarios: {
        Row: {
          budget_id: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          budget_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_scenarios_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          model: Database["public"]["Enums"]["budget_model_type"] | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          model?: Database["public"]["Enums"]["budget_model_type"] | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          model?: Database["public"]["Enums"]["budget_model_type"] | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          model: Database["public"]["Enums"]["budget_model_type"] | null
          name: string
          start_date: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          model?: Database["public"]["Enums"]["budget_model_type"] | null
          name: string
          start_date: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          model?: Database["public"]["Enums"]["budget_model_type"] | null
          name?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_temporary: boolean | null
          name: string
          parent_category_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_temporary?: boolean | null
          name: string
          parent_category_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_temporary?: boolean | null
          name?: string
          parent_category_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categorized_bill_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categorized_expense_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categorized_goal_contributions"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categorized_income_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categorized_investment_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      category_rules: {
        Row: {
          applies_to: string[]
          category_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          match_field: string
          match_operator: string
          match_value: string
          name: string
          priority: number | null
          user_id: string
        }
        Insert: {
          applies_to?: string[]
          category_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_field: string
          match_operator: string
          match_value: string
          name: string
          priority?: number | null
          user_id: string
        }
        Update: {
          applies_to?: string[]
          category_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_field?: string
          match_operator?: string
          match_value?: string
          name?: string
          priority?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_bill_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_expense_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_goal_contributions"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_income_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_investment_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      category_suggestions: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          suggested_category_id: string
          transaction_id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          suggested_category_id: string
          transaction_id: string
          transaction_type: string
          user_id: string
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          suggested_category_id?: string
          transaction_id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_suggestions_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_suggestions_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categorized_bill_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_suggestions_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categorized_expense_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_suggestions_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categorized_goal_contributions"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_suggestions_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categorized_income_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_suggestions_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categorized_investment_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      category_training_data: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          source_type: string
          transaction_text: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          source_type: string
          transaction_text: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          source_type?: string
          transaction_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_training_data_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_training_data_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_bill_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_training_data_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_expense_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_training_data_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_goal_contributions"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_training_data_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_income_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_training_data_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_investment_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "category_training_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_consolidations: {
        Row: {
          created_at: string | null
          id: string
          interest_rate: number
          loan_term: number
          monthly_payment: number
          total_debt_balance: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_rate?: number
          loan_term: number
          monthly_payment?: number
          total_debt_balance?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_rate?: number
          loan_term?: number
          monthly_payment?: number
          total_debt_balance?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_consolidations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      debt_tax_impact: {
        Row: {
          created_at: string | null
          debt_type: string
          id: string
          interest_paid: number
          potential_tax_deduction: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          debt_type: string
          id?: string
          interest_paid: number
          potential_tax_deduction: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          debt_type?: string
          id?: string
          interest_paid?: number
          potential_tax_deduction?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_tax_impact_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string | null
          current_balance: number
          due_date: string | null
          id: string
          interest_rate: number
          loan_term: number | null
          minimum_payment: number
          name: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_balance?: number
          due_date?: string | null
          id?: string
          interest_rate?: number
          loan_term?: number | null
          minimum_payment?: number
          name: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_balance?: number
          due_date?: string | null
          id?: string
          interest_rate?: number
          loan_term?: number | null
          minimum_payment?: number
          name?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      deduction_finder: {
        Row: {
          claimed_at: string | null
          created_at: string | null
          expense_category: string
          id: string
          is_claimed: boolean | null
          potential_deduction: number
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string | null
          expense_category: string
          id?: string
          is_claimed?: boolean | null
          potential_deduction: number
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string | null
          expense_category?: string
          id?: string
          is_claimed?: boolean | null
          potential_deduction?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deduction_finder_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      expense_category_links: {
        Row: {
          category_id: string
          expense_id: string
        }
        Insert: {
          category_id: string
          expense_id: string
        }
        Update: {
          category_id?: string
          expense_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_category_links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_category_links_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_splits: {
        Row: {
          amount: number
          created_at: string | null
          expense_id: string
          id: string
          notes: string | null
          shared_with_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          expense_id: string
          id?: string
          notes?: string | null
          shared_with_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          expense_id?: string
          id?: string
          notes?: string | null
          shared_with_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          budget_item_id: string | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          expense_date: string
          id: string
          is_impulse: boolean | null
          location_geo: unknown | null
          location_name: string | null
          merchant: string | null
          notes: string | null
          receipt_url: string | null
          recurrence: Database["public"]["Enums"]["recurrence_frequency"] | null
          split_amount: number | null
          split_with_name: string | null
          updated_at: string | null
          user_id: string | null
          warranty_expiration_date: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          budget_item_id?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          expense_date: string
          id?: string
          is_impulse?: boolean | null
          location_geo?: unknown | null
          location_name?: string | null
          merchant?: string | null
          notes?: string | null
          receipt_url?: string | null
          recurrence?:
            | Database["public"]["Enums"]["recurrence_frequency"]
            | null
          split_amount?: number | null
          split_with_name?: string | null
          updated_at?: string | null
          user_id?: string | null
          warranty_expiration_date?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          budget_item_id?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          expense_date?: string
          id?: string
          is_impulse?: boolean | null
          location_geo?: unknown | null
          location_name?: string | null
          merchant?: string | null
          notes?: string | null
          receipt_url?: string | null
          recurrence?:
            | Database["public"]["Enums"]["recurrence_frequency"]
            | null
          split_amount?: number | null
          split_with_name?: string | null
          updated_at?: string | null
          user_id?: string | null
          warranty_expiration_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_cash_flow_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "net_cash_position_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "expenses_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_bill_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_expense_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_goal_contributions"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_income_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_investment_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      external_assets: {
        Row: {
          created_at: string | null
          id: string
          last_synced_at: string | null
          metadata: Json | null
          provider: string | null
          symbol: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          provider?: string | null
          symbol?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          provider?: string | null
          symbol?: string | null
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          account_id: string | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          current_amount: number | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          name: string
          priority: number | null
          progress: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["goal_status"] | null
          target_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_amount?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          name: string
          priority?: number | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          current_amount?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          name?: string
          priority?: number | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_cash_flow_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "financial_goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_goals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "net_cash_position_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "financial_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_bill_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "financial_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_expense_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "financial_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_goal_contributions"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "financial_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_income_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "financial_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_investment_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "financial_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          amount: number
          contribution_date: string | null
          created_at: string | null
          goal_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contribution_date?: string | null
          created_at?: string | null
          goal_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          contribution_date?: string | null
          created_at?: string | null
          goal_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "financial_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_goal_summary"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "goal_contributions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      goal_milestones: {
        Row: {
          achieved_at: string | null
          created_at: string | null
          description: string | null
          goal_id: string
          id: string
          is_achieved: boolean | null
          name: string
          target_amount: number
          updated_at: string | null
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string | null
          description?: string | null
          goal_id: string
          id?: string
          is_achieved?: boolean | null
          name: string
          target_amount: number
          updated_at?: string | null
        }
        Update: {
          achieved_at?: string | null
          created_at?: string | null
          description?: string | null
          goal_id?: string
          id?: string
          is_achieved?: boolean | null
          name?: string
          target_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "financial_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_goal_summary"
            referencedColumns: ["goal_id"]
          },
        ]
      }
      goal_roundups: {
        Row: {
          created_at: string | null
          fixed_amount: number | null
          goal_id: string
          id: string
          is_enabled: boolean | null
          percentage: number | null
          roundup_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fixed_amount?: number | null
          goal_id: string
          id?: string
          is_enabled?: boolean | null
          percentage?: number | null
          roundup_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fixed_amount?: number | null
          goal_id?: string
          id?: string
          is_enabled?: boolean | null
          percentage?: number | null
          roundup_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_roundups_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "financial_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_roundups_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_goal_summary"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "goal_roundups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      goal_templates: {
        Row: {
          created_at: string | null
          default_image_url: string | null
          description: string | null
          duration_months: number | null
          id: string
          name: string
          recommended_monthly_saving: number | null
        }
        Insert: {
          created_at?: string | null
          default_image_url?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string
          name: string
          recommended_monthly_saving?: number | null
        }
        Update: {
          created_at?: string | null
          default_image_url?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string
          name?: string
          recommended_monthly_saving?: number | null
        }
        Relationships: []
      }
      income_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "income_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      income_deductions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          income_id: string | null
          name: string
          tax_class: Database["public"]["Enums"]["tax_type"]
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          income_id?: string | null
          name: string
          tax_class: Database["public"]["Enums"]["tax_type"]
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          income_id?: string | null
          name?: string
          tax_class?: Database["public"]["Enums"]["tax_type"]
        }
        Relationships: [
          {
            foreignKeyName: "income_deductions_income_id_fkey"
            columns: ["income_id"]
            isOneToOne: false
            referencedRelation: "incomes"
            referencedColumns: ["id"]
          },
        ]
      }
      income_hustles: {
        Row: {
          created_at: string | null
          hustle_amount: number
          hustle_name: string
          id: string
          income_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          hustle_amount: number
          hustle_name: string
          id?: string
          income_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          hustle_amount?: number
          hustle_name?: string
          id?: string
          income_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_hustles_income_id_fkey"
            columns: ["income_id"]
            isOneToOne: false
            referencedRelation: "incomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_hustles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      income_tax_impact: {
        Row: {
          created_at: string | null
          estimated_tax_impact: number
          id: string
          income_amount: number
          income_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          estimated_tax_impact: number
          id?: string
          income_amount: number
          income_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          estimated_tax_impact?: number
          id?: string
          income_amount?: number
          income_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_tax_impact_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string | null
          currency: string | null
          end_date: string | null
          id: string
          is_taxable: boolean | null
          monthly_equivalent_amount: number | null
          notes: string | null
          recurrence:
            | Database["public"]["Enums"]["income_recurrence_frequency"]
            | null
          source_name: string
          start_date: string
          tax_class: Database["public"]["Enums"]["tax_type"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          is_taxable?: boolean | null
          monthly_equivalent_amount?: number | null
          notes?: string | null
          recurrence?:
            | Database["public"]["Enums"]["income_recurrence_frequency"]
            | null
          source_name: string
          start_date: string
          tax_class?: Database["public"]["Enums"]["tax_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          is_taxable?: boolean | null
          monthly_equivalent_amount?: number | null
          notes?: string | null
          recurrence?:
            | Database["public"]["Enums"]["income_recurrence_frequency"]
            | null
          source_name?: string
          start_date?: string
          tax_class?: Database["public"]["Enums"]["tax_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incomes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_cash_flow_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "incomes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "net_cash_position_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "incomes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "income_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      investment_holdings: {
        Row: {
          acquired_at: string
          asset_class: Database["public"]["Enums"]["asset_class"]
          created_at: string | null
          currency: string | null
          current_price: number | null
          id: string
          name: string | null
          portfolio_id: string
          purchase_price: number
          sold_at: string | null
          status: string | null
          symbol: string
          units: number
          updated_at: string | null
        }
        Insert: {
          acquired_at: string
          asset_class: Database["public"]["Enums"]["asset_class"]
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          id?: string
          name?: string | null
          portfolio_id: string
          purchase_price: number
          sold_at?: string | null
          status?: string | null
          symbol: string
          units: number
          updated_at?: string | null
        }
        Update: {
          acquired_at?: string
          asset_class?: Database["public"]["Enums"]["asset_class"]
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          id?: string
          name?: string | null
          portfolio_id?: string
          purchase_price?: number
          sold_at?: string | null
          status?: string | null
          symbol?: string
          units?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_allocation_analysis"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "investment_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_snapshot_export"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "investment_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_rebalancing_suggestions"
            referencedColumns: ["portfolio_id"]
          },
        ]
      }
      investment_portfolios: {
        Row: {
          base_currency: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          target_allocation: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_currency?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          target_allocation?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_currency?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          target_allocation?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      investment_tax_lots: {
        Row: {
          acquired_at: string | null
          created_at: string | null
          id: string
          portfolio_id: string | null
          purchase_price: number | null
          short_term: boolean | null
          sold_at: string | null
          sold_price: number | null
          symbol: string | null
          units: number | null
          user_id: string | null
        }
        Insert: {
          acquired_at?: string | null
          created_at?: string | null
          id?: string
          portfolio_id?: string | null
          purchase_price?: number | null
          short_term?: boolean | null
          sold_at?: string | null
          sold_price?: number | null
          symbol?: string | null
          units?: number | null
          user_id?: string | null
        }
        Update: {
          acquired_at?: string | null
          created_at?: string | null
          id?: string
          portfolio_id?: string | null
          purchase_price?: number | null
          short_term?: boolean | null
          sold_at?: string | null
          sold_price?: number | null
          symbol?: string | null
          units?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_tax_lots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_allocation_analysis"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "investment_tax_lots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_tax_lots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "investment_snapshot_export"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "investment_tax_lots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolio_rebalancing_suggestions"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "investment_tax_lots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      investments: {
        Row: {
          account_id: string | null
          allocation: number | null
          amount_invested: number | null
          category_id: string | null
          cost_basis: number | null
          created_at: string | null
          currency: string | null
          current_price: number | null
          date_invested: string | null
          id: string
          initial_price: number | null
          investment_type: string | null
          name: string
          quantity: number | null
          ticker: string | null
          type: string | null
          updated_at: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          account_id?: string | null
          allocation?: number | null
          amount_invested?: number | null
          category_id?: string | null
          cost_basis?: number | null
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          date_invested?: string | null
          id?: string
          initial_price?: number | null
          investment_type?: string | null
          name: string
          quantity?: number | null
          ticker?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          account_id?: string | null
          allocation?: number | null
          amount_invested?: number | null
          category_id?: string | null
          cost_basis?: number | null
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          date_invested?: string | null
          id?: string
          initial_price?: number | null
          investment_type?: string | null
          name?: string
          quantity?: number | null
          ticker?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_cash_flow_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "investments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "net_cash_position_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "investments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_bill_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "investments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_expense_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "investments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_goal_contributions"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "investments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_income_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "investments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_investment_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      liabilities: {
        Row: {
          amount_due: number
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          interest_rate: number | null
          liability_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_due: number
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number | null
          liability_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_due?: number
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number | null
          liability_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liabilities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_tracker: {
        Row: {
          created_at: string | null
          date_recorded: string | null
          id: string
          net_worth: number
          total_assets: number
          total_liabilities: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date_recorded?: string | null
          id?: string
          net_worth: number
          total_assets: number
          total_liabilities: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          date_recorded?: string | null
          id?: string
          net_worth?: number
          total_assets?: number
          total_liabilities?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_tracker_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          bill_reminders: boolean | null
          budget_alerts: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          expense_reminders: boolean | null
          id: string
          investment_updates: boolean | null
          push_notifications: boolean | null
          updated_at: string | null
          user_id: string
          watchlist_alerts: boolean | null
        }
        Insert: {
          bill_reminders?: boolean | null
          budget_alerts?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          expense_reminders?: boolean | null
          id?: string
          investment_updates?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
          watchlist_alerts?: boolean | null
        }
        Update: {
          bill_reminders?: boolean | null
          budget_alerts?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          expense_reminders?: boolean | null
          id?: string
          investment_updates?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
          watchlist_alerts?: boolean | null
        }
        Relationships: []
      }
      notification_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portfolio_targets: {
        Row: {
          created_at: string | null
          id: string
          targets: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          targets: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          targets?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shared_budgets: {
        Row: {
          budget_id: string | null
          created_at: string | null
          id: string
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          budget_id?: string | null
          created_at?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          budget_id?: string | null
          created_at?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_budgets_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_budgets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      split_expenses: {
        Row: {
          amount: number
          created_at: string | null
          expense_id: string | null
          id: string
          note: string | null
          shared_with_user: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          expense_id?: string | null
          id?: string
          note?: string | null
          shared_with_user?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          expense_id?: string | null
          id?: string
          note?: string | null
          shared_with_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "split_expenses_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_expenses_shared_with_user_fkey"
            columns: ["shared_with_user"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      subscription_price_changes: {
        Row: {
          changed_at: string | null
          id: string
          new_amount: number
          old_amount: number
          reason: string | null
          subscription_id: string
        }
        Insert: {
          changed_at?: string | null
          id?: string
          new_amount: number
          old_amount: number
          reason?: string | null
          subscription_id: string
        }
        Update: {
          changed_at?: string | null
          id?: string
          new_amount?: number
          old_amount?: number
          reason?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_price_changes_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "potential_duplicate_subscriptions"
            referencedColumns: ["duplicate_subscription_id"]
          },
          {
            foreignKeyName: "subscription_price_changes_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "potential_duplicate_subscriptions"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "subscription_price_changes_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_usage_logs: {
        Row: {
          created_at: string | null
          id: string
          note: string | null
          subscription_id: string
          used_on: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note?: string | null
          subscription_id: string
          used_on: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string | null
          subscription_id?: string
          used_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "potential_duplicate_subscriptions"
            referencedColumns: ["duplicate_subscription_id"]
          },
          {
            foreignKeyName: "subscription_usage_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "potential_duplicate_subscriptions"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "subscription_usage_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          auto_renew: boolean | null
          cancel_url: string | null
          category: string | null
          category_id: string | null
          client_side: boolean | null
          created_at: string | null
          currency: string | null
          description: string | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["subscription_frequency"]
          id: string
          is_active: boolean | null
          last_renewed_at: string | null
          name: string
          next_renewal_date: string
          notes: string | null
          recurrence: string | null
          roi_actual: number | null
          roi_expected: number | null
          roi_notes: string | null
          service_provider: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          support_contact: string | null
          updated_at: string | null
          usage_rating: number | null
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount: number
          auto_renew?: boolean | null
          cancel_url?: string | null
          category?: string | null
          category_id?: string | null
          client_side?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["subscription_frequency"]
          id?: string
          is_active?: boolean | null
          last_renewed_at?: string | null
          name: string
          next_renewal_date: string
          notes?: string | null
          recurrence?: string | null
          roi_actual?: number | null
          roi_expected?: number | null
          roi_notes?: string | null
          service_provider?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          support_contact?: string | null
          updated_at?: string | null
          usage_rating?: number | null
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          auto_renew?: boolean | null
          cancel_url?: string | null
          category?: string | null
          category_id?: string | null
          client_side?: boolean | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["subscription_frequency"]
          id?: string
          is_active?: boolean | null
          last_renewed_at?: string | null
          name?: string
          next_renewal_date?: string
          notes?: string | null
          recurrence?: string | null
          roi_actual?: number | null
          roi_expected?: number | null
          roi_notes?: string | null
          service_provider?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          support_contact?: string | null
          updated_at?: string | null
          usage_rating?: number | null
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "subscription_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tax_advantaged_accounts: {
        Row: {
          account_type: string
          created_at: string | null
          id: string
          implemented_at: string | null
          is_implemented: boolean | null
          recommended_contribution: number
          suggested_tax_impact: number
          user_id: string
        }
        Insert: {
          account_type: string
          created_at?: string | null
          id?: string
          implemented_at?: string | null
          is_implemented?: boolean | null
          recommended_contribution: number
          suggested_tax_impact: number
          user_id: string
        }
        Update: {
          account_type?: string
          created_at?: string | null
          id?: string
          implemented_at?: string | null
          is_implemented?: boolean | null
          recommended_contribution?: number
          suggested_tax_impact?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_advantaged_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_deductions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          date_added: string | null
          description: string | null
          id: string
          max_amount: number | null
          name: string
          notes: string | null
          tax_year: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          date_added?: string | null
          description?: string | null
          id?: string
          max_amount?: number | null
          name: string
          notes?: string | null
          tax_year: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date_added?: string | null
          description?: string | null
          id?: string
          max_amount?: number | null
          name?: string
          notes?: string | null
          tax_year?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_deductions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_documents: {
        Row: {
          created_at: string | null
          document_type: string
          due_date: string | null
          file_metadata: Json | null
          file_name: string | null
          file_url: string | null
          id: string
          is_uploaded: boolean | null
          name: string
          notes: string | null
          status: string | null
          updated_at: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          due_date?: string | null
          file_metadata?: Json | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_uploaded?: boolean | null
          name: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          due_date?: string | null
          file_metadata?: Json | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_uploaded?: boolean | null
          name?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tax_filing_tracker: {
        Row: {
          created_at: string | null
          filed_at: string | null
          filing_status: string
          filing_year: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filed_at?: string | null
          filing_status: string
          filing_year: number
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          filed_at?: string | null
          filing_status?: string
          filing_year?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_filing_tracker_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_impact_predictions: {
        Row: {
          created_at: string | null
          estimated_tax_impact: number
          financial_decision: string
          id: string
          prediction_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          estimated_tax_impact: number
          financial_decision: string
          id?: string
          prediction_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          estimated_tax_impact?: number
          financial_decision?: string
          id?: string
          prediction_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_impact_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_optimization_recommendations: {
        Row: {
          created_at: string | null
          id: string
          implemented_at: string | null
          is_implemented: boolean | null
          recommendation_text: string
          recommendation_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          implemented_at?: string | null
          is_implemented?: boolean | null
          recommendation_text: string
          recommendation_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          implemented_at?: string | null
          is_implemented?: boolean | null
          recommendation_text?: string
          recommendation_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_optimization_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_professional_integrations: {
        Row: {
          contact_info: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          professional_name: string
          user_id: string
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          professional_name: string
          user_id: string
        }
        Update: {
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          professional_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_professional_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_recommendations: {
        Row: {
          action_items: string[] | null
          created_at: string | null
          deadline: string | null
          description: string
          id: string
          is_completed: boolean | null
          potential_savings: number | null
          priority: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_items?: string[] | null
          created_at?: string | null
          deadline?: string | null
          description: string
          id?: string
          is_completed?: boolean | null
          potential_savings?: number | null
          priority: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_items?: string[] | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          id?: string
          is_completed?: boolean | null
          potential_savings?: number | null
          priority?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_reports: {
        Row: {
          created_at: string | null
          generated_at: string | null
          id: string
          is_generated: boolean | null
          report_url: string
          report_year: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          is_generated?: boolean | null
          report_url: string
          report_year: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          generated_at?: string | null
          id?: string
          is_generated?: boolean | null
          report_url?: string
          report_year?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_timeline: {
        Row: {
          created_at: string | null
          description: string
          due_date: string
          id: string
          is_recurring: boolean | null
          recurrence_pattern: string | null
          status: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          status?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          status?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_timeline_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_category_splits: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          id: string
          note: string | null
          transaction_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          id?: string
          note?: string | null
          transaction_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          id?: string
          note?: string | null
          transaction_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_bill_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_expense_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_goal_contributions"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_income_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_investment_summary"
            referencedColumns: ["category_id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          note: string | null
          note_search: unknown | null
          tags: string[] | null
          transaction_date: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          note?: string | null
          note_search?: unknown | null
          tags?: string[] | null
          transaction_date?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          note?: string | null
          note_search?: unknown | null
          tags?: string[] | null
          transaction_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "account_cash_flow_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "net_cash_position_view"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string | null
          is_read: boolean | null
          link: string | null
          message: string
          notification_id: string
          notification_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          is_read?: boolean | null
          link?: string | null
          message: string
          notification_id?: string
          notification_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          is_read?: boolean | null
          link?: string | null
          message?: string
          notification_id?: string
          notification_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          allow_data_analysis: boolean | null
          avatar_url: string | null
          biometric_type: string | null
          consent_updated_at: string | null
          created_at: string | null
          currency_code: string | null
          data_retention_policy: string | null
          date_format: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          emergency_access_enabled: boolean | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          full_name: string | null
          gender: string | null
          has_consented: boolean | null
          id: string
          is_biometrics_enabled: boolean | null
          is_email_verified: boolean | null
          last_active_at: string | null
          last_login_at: string | null
          local_data_only: boolean | null
          locale: string | null
          marketing_opt_in: boolean | null
          mfa_enabled: boolean | null
          mfa_type: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          onboarding_step: string | null
          permission_scope: Json | null
          phone: string | null
          privacy_level: string | null
          referral_code: string | null
          session_timeout_minutes: number | null
          signup_source: string | null
          suspicious_login_flag: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_role: string | null
          username: string
        }
        Insert: {
          allow_data_analysis?: boolean | null
          avatar_url?: string | null
          biometric_type?: string | null
          consent_updated_at?: string | null
          created_at?: string | null
          currency_code?: string | null
          data_retention_policy?: string | null
          date_format?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_access_enabled?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          gender?: string | null
          has_consented?: boolean | null
          id: string
          is_biometrics_enabled?: boolean | null
          is_email_verified?: boolean | null
          last_active_at?: string | null
          last_login_at?: string | null
          local_data_only?: boolean | null
          locale?: string | null
          marketing_opt_in?: boolean | null
          mfa_enabled?: boolean | null
          mfa_type?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          permission_scope?: Json | null
          phone?: string | null
          privacy_level?: string | null
          referral_code?: string | null
          session_timeout_minutes?: number | null
          signup_source?: string | null
          suspicious_login_flag?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_role?: string | null
          username: string
        }
        Update: {
          allow_data_analysis?: boolean | null
          avatar_url?: string | null
          biometric_type?: string | null
          consent_updated_at?: string | null
          created_at?: string | null
          currency_code?: string | null
          data_retention_policy?: string | null
          date_format?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          emergency_access_enabled?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          gender?: string | null
          has_consented?: boolean | null
          id?: string
          is_biometrics_enabled?: boolean | null
          is_email_verified?: boolean | null
          last_active_at?: string | null
          last_login_at?: string | null
          local_data_only?: boolean | null
          locale?: string | null
          marketing_opt_in?: boolean | null
          mfa_enabled?: boolean | null
          mfa_type?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          permission_scope?: Json | null
          phone?: string | null
          privacy_level?: string | null
          referral_code?: string | null
          session_timeout_minutes?: number | null
          signup_source?: string | null
          suspicious_login_flag?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_role?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      watchlist: {
        Row: {
          alert_threshold: number | null
          alert_triggered: boolean | null
          created_at: string
          day_high: number | null
          day_low: number | null
          id: string
          last_updated: string | null
          name: string
          notes: string | null
          previous_close: number | null
          price: number | null
          price_alert_enabled: boolean | null
          price_change: number | null
          price_change_percent: number | null
          sector: string | null
          target_price: number | null
          ticker: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alert_threshold?: number | null
          alert_triggered?: boolean | null
          created_at?: string
          day_high?: number | null
          day_low?: number | null
          id?: string
          last_updated?: string | null
          name: string
          notes?: string | null
          previous_close?: number | null
          price?: number | null
          price_alert_enabled?: boolean | null
          price_change?: number | null
          price_change_percent?: number | null
          sector?: string | null
          target_price?: number | null
          ticker?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alert_threshold?: number | null
          alert_triggered?: boolean | null
          created_at?: string
          day_high?: number | null
          day_low?: number | null
          id?: string
          last_updated?: string | null
          name?: string
          notes?: string | null
          previous_close?: number | null
          price?: number | null
          price_alert_enabled?: boolean | null
          price_change?: number | null
          price_change_percent?: number | null
          sector?: string | null
          target_price?: number | null
          ticker?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      account_balances_summary: {
        Row: {
          account_type: string | null
          total_balance: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      account_cash_flow_view: {
        Row: {
          account_id: string | null
          account_name: string | null
          account_type: string | null
          total_inflow: number | null
          total_outflow: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      annual_tax_report: {
        Row: {
          email: string | null
          first_acquired: string | null
          gain_loss: number | null
          gain_type: string | null
          last_sold: string | null
          tax_year: number | null
          total_units: number | null
          user_id: string | null
        }
        Relationships: []
      }
      categorized_bill_summary: {
        Row: {
          category_id: string | null
          category_name: string | null
          total_billed: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categorized_expense_summary: {
        Row: {
          category_id: string | null
          category_name: string | null
          total_spent: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categorized_goal_contributions: {
        Row: {
          category_id: string | null
          category_name: string | null
          total_contributed: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categorized_income_summary: {
        Row: {
          category_id: string | null
          category_name: string | null
          total_earned: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incomes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categorized_investment_summary: {
        Row: {
          category_id: string | null
          category_name: string | null
          total_invested: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      current_net_worth: {
        Row: {
          current_net_worth: number | null
          total_assets: number | null
          total_liabilities: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_tax_impact_summary: {
        Row: {
          total_interest_paid: number | null
          total_tax_deduction: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debt_tax_impact_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      income_tax_impact_summary: {
        Row: {
          total_income: number | null
          total_tax_impact: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_tax_impact_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_allocation_analysis: {
        Row: {
          asset_class: Database["public"]["Enums"]["asset_class"] | null
          asset_value: number | null
          portfolio_id: string | null
          portfolio_name: string | null
          target_percent: number | null
        }
        Relationships: []
      }
      investment_snapshot_export: {
        Row: {
          acquired_at: string | null
          asset_class: Database["public"]["Enums"]["asset_class"] | null
          asset_name: string | null
          currency: string | null
          current_price: number | null
          portfolio_id: string | null
          portfolio_name: string | null
          purchase_price: number | null
          sold_at: string | null
          status: string | null
          symbol: string | null
          units: number | null
          unrealized_gain: number | null
        }
        Relationships: []
      }
      net_cash_position_view: {
        Row: {
          account_id: string | null
          account_name: string | null
          account_type: string | null
          net_cash_position: number | null
          total_inflow: number | null
          total_outflow: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      net_worth_history: {
        Row: {
          date_recorded: string | null
          net_worth: number | null
          total_assets: number | null
          total_liabilities: number | null
          user_id: string | null
        }
        Insert: {
          date_recorded?: string | null
          net_worth?: number | null
          total_assets?: number | null
          total_liabilities?: number | null
          user_id?: string | null
        }
        Update: {
          date_recorded?: string | null
          net_worth?: number | null
          total_assets?: number | null
          total_liabilities?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_tracker_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_rebalancing_suggestions: {
        Row: {
          actual_percent: number | null
          adjustment_needed: number | null
          asset_class: Database["public"]["Enums"]["asset_class"] | null
          current_value: number | null
          portfolio_id: string | null
          target_percent: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      potential_duplicate_subscriptions: {
        Row: {
          cost1: number | null
          cost2: number | null
          duplicate_subscription_id: string | null
          duplicate_subscription_name: string | null
          subscription_id: string | null
          subscription_name: string | null
        }
        Relationships: []
      }
      top_transaction_note_keywords: {
        Row: {
          keyword: string | null
          total_amount: number | null
          transaction_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      total_tax_optimization_summary: {
        Row: {
          debt_tax_savings: number | null
          income_tax_savings: number | null
          total_tax_savings: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_optimization_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_category_split_totals: {
        Row: {
          category_id: string | null
          total_split: number | null
          transaction_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_bill_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_expense_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_goal_contributions"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_income_summary"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "transaction_category_splits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categorized_investment_summary"
            referencedColumns: ["category_id"]
          },
        ]
      }
      transaction_note_search_view: {
        Row: {
          amount: number | null
          highlighted_note: string | null
          id: string | null
          note: string | null
          transaction_date: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          highlighted_note?: never
          id?: string | null
          note?: string | null
          transaction_date?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          highlighted_note?: never
          id?: string | null
          note?: string | null
          transaction_date?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goal_summary: {
        Row: {
          current_amount: number | null
          description: string | null
          goal_id: string | null
          milestones_completed: number | null
          name: string | null
          priority: number | null
          progress: number | null
          status: Database["public"]["Enums"]["goal_status"] | null
          target_amount: number | null
          total_milestones: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "annual_tax_report"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notification_history: {
        Row: {
          created_at: string | null
          is_read: boolean | null
          link: string | null
          message: string | null
          notification_id: string | null
          notification_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          notification_id?: string | null
          notification_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          notification_id?: string | null
          notification_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { oldname: string; newname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { tbl: unknown; col: string }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { tbl: unknown; att_name: string; geom: unknown; mode?: string }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          g1: unknown
          clip?: unknown
          tolerance?: number
          return_polygons?: boolean
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      add_missing_watchlist_columns: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
              new_srid_in: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
          | {
              schema_name: string
              table_name: string
              column_name: string
              new_srid: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
          | {
              table_name: string
              column_name: string
              new_srid: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
        Returns: string
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      calculate_avalanche_repayment: {
        Args: { _user_id: string }
        Returns: Json
      }
      calculate_debt_to_income_ratio: {
        Args: { _user_id: string }
        Returns: number
      }
      calculate_hybrid_repayment: {
        Args: { _user_id: string }
        Returns: Json
      }
      calculate_interest_savings: {
        Args: {
          _user_id: string
          _new_interest_rate: number
          _loan_term: number
        }
        Returns: number
      }
      calculate_snowball_repayment: {
        Args: { _user_id: string }
        Returns: Json
      }
      call_external_asset_update: {
        Args: { symbol: string; provider?: string }
        Returns: undefined
      }
      check_subscription_overlap: {
        Args: {
          p_user_id: string
          p_service_provider: string
          p_start_date: string
          p_end_date: string
          p_current_id?: string
        }
        Returns: {
          overlapping_id: string
          name: string
          start_date: string
          end_date: string
        }[]
      }
      check_watchlist_columns: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_debt: {
        Args: {
          _user_id: string
          _name: string
          _current_balance: number
          _interest_rate: number
          _minimum_payment: number
          _loan_term: number
        }
        Returns: undefined
      }
      create_default_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_documents_bucket: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_recurring_expenses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_recurring_incomes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_refinancing_opportunity: {
        Args: {
          _user_id: string
          _new_interest_rate: number
          _loan_term: number
          _debt_id: string
        }
        Returns: undefined
      }
      create_reports_bucket: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_reports_bucket_with_policies: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user_if_not_exists: {
        Args: { user_id: string; email: string }
        Returns: boolean
      }
      create_user_profile: {
        Args: {
          user_id: string
          user_email: string
          user_username: string
          user_full_name?: string
        }
        Returns: boolean
      }
      create_watchlist_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_debt: {
        Args: { _debt_id: string }
        Returns: undefined
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
            }
          | { schema_name: string; table_name: string; column_name: string }
          | { table_name: string; column_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      ensure_debts_columns_exist: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      exec_sql: {
        Args: { sql: string }
        Returns: undefined
      }
      execute_sql: {
        Args: { sql_query: string }
        Returns: undefined
      }
      fix_subscription_issues: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_watchlist_issues: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      income_diversification_score: {
        Args: { p_user_id: string }
        Returns: number
      }
      insert_watchlist_item_bypass_rls: {
        Args: { item_data: Json }
        Returns: {
          alert_threshold: number | null
          alert_triggered: boolean | null
          created_at: string
          day_high: number | null
          day_low: number | null
          id: string
          last_updated: string | null
          name: string
          notes: string | null
          previous_close: number | null
          price: number | null
          price_alert_enabled: boolean | null
          price_change: number | null
          price_change_percent: number | null
          sector: string | null
          target_price: number | null
          ticker: string | null
          updated_at: string
          user_id: string | null
        }[]
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: string
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          geomname: string
          coord_dimension: number
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      refresh_postgrest_schema: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_expenses_by_location_and_date_range: {
        Args: { search_location: string; start_date: string; end_date: string }
        Returns: {
          expense_id: string
          user_id: string
          merchant: string
          amount: number
          expense_date: string
          location_name: string
          location_geo: unknown
          receipt_url: string
          warranty_expiration_date: string
          recurrence: Database["public"]["Enums"]["recurrence_frequency"]
          is_impulse: boolean
          notes: string
        }[]
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              r: Record<string, unknown>
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              version: number
              geog: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
          | {
              version: number
              geom: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { geom: unknown; format?: string }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          geom: unknown
          bounds: unknown
          extent?: number
          buffer?: number
          clip_geom?: boolean
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; rel?: number; maxdecimaldigits?: number }
          | { geom: unknown; rel?: number; maxdecimaldigits?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
              with_boxes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
              with_boxes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { geom: unknown; fits?: boolean }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; radius: number; options?: string }
          | { geom: unknown; radius: number; quadsegs: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { geom: unknown; box: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_geom: unknown
          param_pctconvex: number
          param_allow_holes?: boolean
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { geom: unknown; tol?: number; toltype?: number; flags?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { g1: unknown; tolerance?: number; flags?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { geom: unknown; dx: number; dy: number; dz?: number; dm?: number }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; zvalue?: number; mvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          g: unknown
          tolerance?: number
          max_iter?: number
          fail_if_not_converged?: boolean
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { size: number; cell_i: number; cell_j: number; origin?: unknown }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { geom: unknown; flags?: number }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { letters: string; font?: Json }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { txtin: string; nprecision?: number }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; measure: number; leftrightoffset?: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          geometry: unknown
          frommeasure: number
          tomeasure: number
          leftrightoffset?: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { geometry: unknown; fromelevation: number; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { line: unknown; distance: number; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          mcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
          mcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { geog: unknown; distance: number; azimuth: number }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_x: number
          prec_y?: number
          prec_z?: number
          prec_m?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; vertex_fraction: number; is_outer?: boolean }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { size: number; cell_i: number; cell_j: number; origin?: unknown }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; maxvertices?: number; gridsize?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          zoom: number
          x: number
          y: number
          bounds?: unknown
          margin?: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { geom: unknown; from_proj: string; to_proj: string }
          | { geom: unknown; from_proj: string; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; wrap: number; move: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      sync_asset_from_finnhub: {
        Args: { symbol: string }
        Returns: undefined
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      update_account_balance: {
        Args: { p_account_id: string; p_amount: number }
        Returns: undefined
      }
      update_debt: {
        Args: {
          _debt_id: string
          _name: string
          _current_balance: number
          _interest_rate: number
          _minimum_payment: number
          _loan_term: number
        }
        Returns: undefined
      }
      update_debt_after_refinancing: {
        Args: {
          _debt_id: string
          _new_interest_rate: number
          _new_loan_term: number
        }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          schema_name: string
          table_name: string
          column_name: string
          new_srid_in: number
        }
        Returns: string
      }
    }
    Enums: {
      asset_class:
        | "stocks"
        | "bonds"
        | "crypto"
        | "real_estate"
        | "commodities"
        | "cash"
        | "collectibles"
        | "private_equity"
        | "etf"
        | "mutual_fund"
      bill_frequency:
        | "once"
        | "weekly"
        | "bi_weekly"
        | "monthly"
        | "quarterly"
        | "semi_annual"
        | "annual"
      bill_status: "unpaid" | "paid" | "overdue" | "cancelled"
      budget_model_type:
        | "traditional"
        | "zero_based"
        | "fifty_thirty_twenty"
        | "envelope"
        | "custom"
      goal_status: "active" | "paused" | "achieved" | "cancelled"
      income_recurrence_frequency:
        | "none"
        | "weekly"
        | "bi_weekly"
        | "monthly"
        | "quarterly"
        | "semi_annual"
        | "annual"
      recurrence_frequency:
        | "none"
        | "weekly"
        | "bi_weekly"
        | "monthly"
        | "quarterly"
        | "semi_annual"
        | "annual"
      subscription_frequency:
        | "weekly"
        | "bi_weekly"
        | "monthly"
        | "quarterly"
        | "semi_annual"
        | "annual"
      subscription_status: "active" | "paused" | "cancelled"
      tax_type: "none" | "pre_tax" | "post_tax"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      asset_class: [
        "stocks",
        "bonds",
        "crypto",
        "real_estate",
        "commodities",
        "cash",
        "collectibles",
        "private_equity",
        "etf",
        "mutual_fund",
      ],
      bill_frequency: [
        "once",
        "weekly",
        "bi_weekly",
        "monthly",
        "quarterly",
        "semi_annual",
        "annual",
      ],
      bill_status: ["unpaid", "paid", "overdue", "cancelled"],
      budget_model_type: [
        "traditional",
        "zero_based",
        "fifty_thirty_twenty",
        "envelope",
        "custom",
      ],
      goal_status: ["active", "paused", "achieved", "cancelled"],
      income_recurrence_frequency: [
        "none",
        "weekly",
        "bi_weekly",
        "monthly",
        "quarterly",
        "semi_annual",
        "annual",
      ],
      recurrence_frequency: [
        "none",
        "weekly",
        "bi_weekly",
        "monthly",
        "quarterly",
        "semi_annual",
        "annual",
      ],
      subscription_frequency: [
        "weekly",
        "bi_weekly",
        "monthly",
        "quarterly",
        "semi_annual",
        "annual",
      ],
      subscription_status: ["active", "paused", "cancelled"],
      tax_type: ["none", "pre_tax", "post_tax"],
    },
  },
} as const
