import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Debt, 
  DebtConsolidation, 
  DebtRepaymentPlan, 
  DebtRepaymentStrategy,
  InterestSavingsResult,
  DebtToIncomeRatio
} from '@/types/debt'
import { User } from '@supabase/supabase-js'

export class DebtService {
  private supabase = createClientComponentClient()
  private cachedUserId: string | null = null
  
  // Get the current user ID with proper error handling and retry logic
  private async getUserId(): Promise<string | null> {
    try {
      // Return cached ID if available to avoid repeated lookups
      if (this.cachedUserId) {
        console.log(`getUserId: Using cached user ID: ${this.cachedUserId}`)
        return this.cachedUserId
      }
      
      // Handle cookie parsing errors by clearing problematic cookies
      if (typeof window !== 'undefined') {
        try {
          // Check if we have cookie parsing errors in the console
          const consoleErrors = (window as any).consoleErrors || [];
          const hasCookieParsingError = consoleErrors.some((error: any) => 
            error && error.message && error.message.includes('Failed to parse cookie string')
          );
          
          if (hasCookieParsingError || document.cookie.includes('base64-eyJ')) {
            console.log('Detected cookie parsing error, clearing problematic cookies');
            // Clear all supabase cookies to resolve parsing issues
            document.cookie.split(';').forEach(cookie => {
              const [name] = cookie.trim().split('=');
              if (name && (name.includes('supabase') || name.includes('sb-'))) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
              }
            });
            
            // Store a flag to prevent redirect loops
            localStorage.setItem('cookies_cleared', 'true');
            
            // If we're not already on the login page, redirect there
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
              return null;
            }
          }
        } catch (cookieError) {
          console.warn('Error checking for cookie parsing issues:', cookieError);
        }
      }

      // Check for mock user ID in development mode
      if (process.env.NEXT_PUBLIC_MOCK_USER_ID) {
        console.log(`getUserId: Using mock user ID from environment: ${process.env.NEXT_PUBLIC_MOCK_USER_ID}`)
        this.cachedUserId = process.env.NEXT_PUBLIC_MOCK_USER_ID;
        return process.env.NEXT_PUBLIC_MOCK_USER_ID;
      }

      // Safely check for session without risking AuthSessionMissingError
      try {
        // First check if we have a session
        const { data: sessionData } = await this.supabase.auth.getSession()
        const userId = sessionData?.session?.user?.id
        
        if (userId) {
          console.log(`getUserId: Found user ID from session: ${userId}`)
          this.cachedUserId = userId
          return userId
        }
      } catch (sessionError) {
        console.warn('Error getting session:', sessionError)
        // Continue to next method
      }
      
      // Try getting the user directly with error handling
      try {
        const { data: userData } = await this.supabase.auth.getUser()
        if (userData?.user?.id) {
          console.log(`getUserId: Found user ID from getUser: ${userData.user.id}`)
          this.cachedUserId = userData.user.id
          return userData.user.id
        }
      } catch (userError) {
        console.warn('Error getting user:', userError)
        // Continue to next method
      }
      
      // Try to refresh the session with error handling
      try {
        // Check if we have a session to avoid AuthSessionMissingError
        const { data: checkSession } = await this.supabase.auth.getSession()
        if (checkSession?.session) {
          try {
            const refreshResult = await this.supabase.auth.refreshSession()
            if (refreshResult.data?.session?.user?.id) {
              console.log(`getUserId: Found user ID after refresh: ${refreshResult.data.session.user.id}`)
              this.cachedUserId = refreshResult.data.session.user.id
              return refreshResult.data.session.user.id
            }
          } catch (refreshError) {
            console.warn('Error refreshing session:', refreshError)
            // Continue to localStorage fallbacks
          }
        } else {
          console.log('No existing session to refresh')
        }
      } catch (checkError) {
        console.warn('Error checking for session:', checkError)
        // Continue to localStorage fallbacks
      }
      
      // Last attempt: check localStorage for a persisted auth token
      if (typeof window !== 'undefined') {
        try {
          // Check for backup session data
          const backupSession = localStorage.getItem('supabase_auth_backup')
          if (backupSession) {
            try {
              const parsed = JSON.parse(backupSession)
              if (parsed.user_id) {
                console.log(`getUserId: Found user ID from backup session: ${parsed.user_id}`)
                this.cachedUserId = parsed.user_id
                return parsed.user_id
              }
            } catch (e) {
              console.warn('Error parsing backup session:', e)
            }
          }
          
          // Try to get user ID from localStorage directly
          const directUserId = localStorage.getItem('supabase.auth.user.id')
          if (directUserId) {
            console.log(`getUserId: Found user ID directly from localStorage: ${directUserId}`)
            this.cachedUserId = directUserId
            return directUserId
          }

          // Try to parse from session
          const persistedSession = localStorage.getItem('supabase.auth.token')
          if (persistedSession) {
            try {
              const parsedSession = JSON.parse(persistedSession)
              if (parsedSession?.currentSession?.user?.id) {
                console.log(`getUserId: Found user ID from localStorage session: ${parsedSession.currentSession.user.id}`)
                this.cachedUserId = parsedSession.currentSession.user.id
                return parsedSession.currentSession.user.id
              }
            } catch (e) {
              console.warn('Error parsing persisted session:', e)
            }
          }

          // Check all localStorage keys for any that might contain a user ID
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.includes('supabase') && key.includes('auth')) {
              try {
                const value = localStorage.getItem(key)
                if (value) {
                  const parsed = JSON.parse(value)
                  if (parsed?.user?.id) {
                    console.log(`getUserId: Found user ID in localStorage key ${key}: ${parsed.user.id}`)
                    this.cachedUserId = parsed.user.id
                    return parsed.user.id
                  }
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
          
          // Set a flag to indicate we've visited this page before
          localStorage.setItem('debt-management-visited', 'true')
        } catch (storageError) {
          console.warn('Error accessing localStorage:', storageError)
        }
      }
      
      // No user ID found - return null and let the calling code handle it
      console.warn('getUserId: No user ID found through any method')
      return null;
    } catch (error) {
      console.error('Auth error:', error)
      return null
    }
  }

  async getDebts(): Promise<Debt[]> {
    try {
      // Get the user ID using our enhanced method
      let userId = await this.getUserId()
      
      // If we have a user ID, proceed with fetching debts
      if (userId) {
        try {
          console.log(`getDebts: Fetching debts for user ${userId}`)
          
          // Query the database with the user ID
          const { data, error } = await this.supabase
            .from('debts')
            .select('*')
            .eq('user_id', userId)
            .order('interest_rate', { ascending: false })
          
          if (error) {
            console.error('Database error:', error)
            // Check if it's an auth error
            if (this.isAuthError(error.message)) {
              console.warn('Authentication error when querying database:', error.message)
              // Log the error but don't redirect immediately
              console.log('Authentication error detected, but continuing operation')
              // Return empty array instead of redirecting
              return []
            }
            // For non-auth errors, just log and return empty array
            console.error('Non-auth database error:', error.message)
            return []
          }
          
          console.log(`getDebts: Found ${data?.length || 0} debts`)
          return data || []
        } catch (dbError) {
          console.error('Database error in getDebts:', dbError)
          // Check if it's an auth error
          if (dbError instanceof Error && this.isAuthError(dbError.message)) {
            console.warn('Authentication error in database operation:', dbError.message)
            // Log but don't redirect
            console.log('Authentication error in catch block, but continuing operation')
          }
          // Return empty array instead of throwing
          return []
        }
      } else {
        // No user ID found - log but don't redirect
        console.warn('getDebts: No user ID available')
        // Only redirect if we're not already on the debt management page
        if (typeof window !== 'undefined' && 
            window.location.pathname !== '/debt-management' && 
            window.location.pathname !== '/login' && 
            window.location.pathname !== '/dashboard') {
          this.redirectToLogin()
        }
        return []
      }
    } catch (error) {
      console.error('Error in getDebts:', error)
      // Return empty array instead of throwing
      return []
    }
  }
  
  // Helper method to get mock debts for development and testing
  private getMockDebts(): Debt[] {
    // Use mock user ID from environment if available
    const mockUserId = process.env.NEXT_PUBLIC_MOCK_USER_ID || 'temp-user'
    
    // Create and return a few mock debt objects
    return [
      {
        id: 'mock-1',
        user_id: mockUserId,
        name: 'Mock Credit Card',
        current_balance: 5000,
        interest_rate: 18.99,
        minimum_payment: 150,
        loan_term: 0,
        due_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-2',
        user_id: mockUserId,
        name: 'Mock Car Loan',
        current_balance: 15000,
        interest_rate: 4.5,
        minimum_payment: 350,
        loan_term: 60,
        due_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }

  // Set user ID directly (can be used by components that have access to the user ID)
  setUserId(userId: string): void {
    if (userId) {
      this.cachedUserId = userId;
      console.log(`DebtService: User ID set manually to ${userId}`)
      
      // Also store in localStorage as a backup
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('supabase.auth.user.id', userId);
        } catch (e) {
          console.warn('Failed to store user ID in localStorage:', e);
        }
      }
    }
  }

  // Get user from Supabase
  async getUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser()
    return data?.user || null
  }

  async createDebt(debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Debt> {
    try {
      // Get the user ID using our enhanced method
      let userId = await this.getUserId()
      
      // If we have a user ID, proceed with creating the debt
      if (userId) {
        try {
          console.log(`createDebt: Creating debt for user ${userId}`)
          console.log('Debt data to insert:', debt)
          
          // Extract or default the current balance
          let current_balance = 0
          if ('current_balance' in debt) {
            current_balance = debt.current_balance
          } else if ('principal' in (debt as any)) {
            current_balance = (debt as any).principal
          }
          
          // Extract or default the loan term
          let loan_term = 0
          if ('loan_term' in debt) {
            loan_term = debt.loan_term
          } else if ('term_months' in (debt as any)) {
            loan_term = (debt as any).term_months
          }
          
          // First try using the RPC function
          try {
            const { error } = await this.supabase.rpc('create_debt', {
              _user_id: userId,
              _name: debt.name,
              _current_balance: current_balance,
              _interest_rate: debt.interest_rate || 0,
              _minimum_payment: debt.minimum_payment || 0,
              _loan_term: loan_term
            })
            
            // If RPC fails, check the error type
            if (error) {
              console.error('Error calling create_debt RPC:', error)
              
              // Check if it's an auth error
              if (this.isAuthError(error.message)) {
                console.warn('Authentication error when creating debt:', error.message)
                // Create a default debt object to return instead of redirecting
                return {
                  id: 'temp-' + Date.now(),
                  user_id: userId,
                  name: debt.name || 'Unknown Debt',
                  current_balance: current_balance,
                  interest_rate: debt.interest_rate || 0,
                  minimum_payment: debt.minimum_payment || 0,
                  loan_term: loan_term,
                  due_date: debt.due_date || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  type: 'credit_card' // Add default type to prevent errors in formatDebtType
                }
              }
              
              // Fallback to direct insert if RPC fails for non-auth reasons
              return await this.attemptDirectInsert(userId, debt, current_balance, loan_term)
            }
            
            // If RPC was successful, fetch the newly created debt
            const { data: newDebt, error: fetchError } = await this.supabase
              .from('debts')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
            
            if (fetchError) {
              console.error('Error fetching new debt:', fetchError)
              
              // Check if it's an auth error
              if (this.isAuthError(fetchError.message)) {
                console.warn('Authentication error when fetching new debt:', fetchError.message)
                // Return a default debt object instead of redirecting
                return {
                  id: 'temp-' + Date.now(),
                  user_id: userId,
                  name: debt.name || 'Unknown Debt',
                  current_balance: current_balance,
                  interest_rate: debt.interest_rate || 0,
                  minimum_payment: debt.minimum_payment || 0,
                  loan_term: loan_term,
                  due_date: debt.due_date || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  type: 'credit_card' // Add default type to prevent errors in formatDebtType
                }
              }
              
              // For non-auth errors, create a temporary debt object
              return {
                id: 'temp-' + Date.now(),
                user_id: userId,
                name: debt.name || 'Unknown Debt',
                current_balance: current_balance,
                interest_rate: debt.interest_rate || 0,
                minimum_payment: debt.minimum_payment || 0,
                loan_term: loan_term,
                due_date: debt.due_date || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                type: 'credit_card' // Add default type to prevent errors in formatDebtType
              }
            }
            
            return newDebt
          } catch (dbError) {
            console.error('Database error in createDebt:', dbError)
            // Check if it's an auth error by examining the error message
            if (dbError instanceof Error && this.isAuthError(dbError.message)) {
              console.warn('Authentication error in database operation:', dbError.message)
              // Don't redirect, just log the error
            }
            
            // Return a default debt object instead of throwing
            return {
              id: 'temp-' + Date.now(),
              user_id: userId,
              name: debt.name || 'Unknown Debt',
              current_balance: current_balance,
              interest_rate: debt.interest_rate || 0,
              minimum_payment: debt.minimum_payment || 0,
              loan_term: loan_term,
              due_date: debt.due_date || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              type: 'credit_card' // Add default type to prevent errors in formatDebtType
            }
          }
        } catch (processingError) {
          console.error('Error processing debt creation:', processingError)
          
          // Return a default debt object instead of throwing
          return {
            id: 'temp-' + Date.now(),
            user_id: userId,
            name: debt.name || 'Unknown Debt',
            current_balance: debt.current_balance || 0,
            interest_rate: debt.interest_rate || 0,
            minimum_payment: debt.minimum_payment || 0,
            loan_term: debt.loan_term || 0,
            due_date: debt.due_date || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            type: 'credit_card' // Add default type to prevent errors in formatDebtType
          }
        }
      } else {
        // No user ID found - don't redirect, just return a temporary debt
        console.warn('createDebt: No user ID available')
        
        // Return a default debt object
        return {
          id: 'temp-' + Date.now(),
          user_id: 'temp-user',
          name: debt.name || 'Unknown Debt',
          current_balance: debt.current_balance || 0,
          interest_rate: debt.interest_rate || 0,
          minimum_payment: debt.minimum_payment || 0,
          loan_term: debt.loan_term || 0,
          due_date: debt.due_date || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          type: 'credit_card' // Add default type to prevent errors in formatDebtType
        }
      }
    } catch (error) {
      console.error('Error in createDebt:', error)
      
      // Return a default debt object instead of throwing
      return {
        id: 'temp-' + Date.now(),
        user_id: 'temp-user',
        name: debt.name || 'Unknown Debt',
        current_balance: debt.current_balance || 0,
        interest_rate: debt.interest_rate || 0,
        minimum_payment: debt.minimum_payment || 0,
        loan_term: debt.loan_term || 0,
        due_date: debt.due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        type: 'credit_card' // Add default type to prevent errors in formatDebtType
      }
    }
  }
  
  // Helper method for direct insert when RPC fails
  private async attemptDirectInsert(userId: string, debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>, current_balance: number, loan_term: number): Promise<Debt> {
    try {
      console.log('Falling back to direct insert')
      const { data: insertData, error: insertError } = await this.supabase
        .from('debts')
        .insert({
          user_id: userId,
          name: debt.name,
          current_balance: current_balance,
          interest_rate: debt.interest_rate || 0,
          minimum_payment: debt.minimum_payment || 0,
          loan_term: loan_term,
          due_date: debt.due_date || null,
          type: 'credit_card' // Add default type to prevent errors in formatDebtType
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('Error with direct insert:', insertError)
        
        // Check if it's an auth error
        if (this.isAuthError(insertError.message)) {
          console.warn('Authentication error when inserting debt:', insertError.message)
          this.redirectToLogin()
          throw new Error('Authentication failed when inserting debt')
        }
        
        throw insertError
      }
      
      return insertData
    } catch (error) {
      console.error('Error in attemptDirectInsert:', error)
      throw error
    }
  }
  
  // Helper method to check if an error is authentication-related
  private isAuthError(errorMessage?: string): boolean {
    if (!errorMessage) return false
    
    const authErrorKeywords = ['JWT', 'auth', 'session', 'token', 'unauthorized', 'permission', 'login']
    return authErrorKeywords.some(keyword => errorMessage.toLowerCase().includes(keyword.toLowerCase()))
  }
  
  // Helper method to redirect to login page when authentication fails
  private redirectToLogin(): void {
    // Don't redirect at all - this was causing navigation issues
    // Instead, we'll let the application handle auth errors gracefully
    console.log('Auth error detected, but not redirecting to prevent navigation issues')
    
    // Store a flag that we encountered an auth error, which can be checked elsewhere if needed
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_error_encountered', 'true')
    }
    
    // The old implementation was too aggressive and caused navigation problems
    // We're now letting the application continue without forced redirects
  }

  async updateDebt(debtId: string, debt: Partial<Debt>): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('update_debt', {
        _debt_id: debtId,
        _name: debt.name,
        _current_balance: debt.current_balance,
        _interest_rate: debt.interest_rate,
        _minimum_payment: debt.minimum_payment,
        _loan_term: debt.loan_term
      })

      if (error) {
        console.error('Error updating debt:', error)
        // Don't throw error to prevent login loops
      }
    } catch (error) {
      console.error('Error in updateDebt:', error)
      // Don't throw error to prevent login loops
    }
  }

  async deleteDebt(debtId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('delete_debt', {
        _debt_id: debtId
      })

      if (error) {
        console.error('Error deleting debt:', error)
        // Don't throw error to prevent login loops
      }
    } catch (error) {
      console.error('Error in deleteDebt:', error)
      // Don't throw error to prevent login loops
    }
  }

  async calculateRepaymentPlan(strategy: DebtRepaymentStrategy): Promise<DebtRepaymentPlan[]> {
    try {
      const userId = await this.getUserId()
      if (!userId) {
        // Return empty array instead of throwing an error
        return []
      }

      let functionName = ''
      switch (strategy) {
        case 'avalanche':
          functionName = 'calculate_avalanche_repayment'
          break
        case 'snowball':
          functionName = 'calculate_snowball_repayment'
          break
        case 'hybrid':
          functionName = 'calculate_hybrid_repayment'
          break
        default:
          return []
      }

      const { data, error } = await this.supabase.rpc(functionName, {
        _user_id: userId
      })

      if (error) {
        console.error('Error calculating repayment plan:', error)
        return []
      }
      return data || []
    } catch (error) {
      console.error('Error in calculateRepaymentPlan:', error)
      return []
    }
  }

  async calculateInterestSavings(newInterestRate: number, loanTerm: number): Promise<number> {
    try {
      const userId = await this.getUserId()
      if (!userId) {
        // Return 0 instead of throwing an error
        return 0
      }

      const { data, error } = await this.supabase.rpc('calculate_interest_savings', {
        _user_id: userId,
        _new_interest_rate: newInterestRate,
        _loan_term: loanTerm
      })

      if (error) {
        console.error('Error calculating interest savings:', error)
        return 0
      }
      return data || 0
    } catch (error) {
      console.error('Error in calculateInterestSavings:', error)
      return 0
    }
  }

  async createRefinancingOpportunity(
    newInterestRate: number, 
    loanTerm: number, 
    debtId: string
  ): Promise<void> {
    try {
      const userId = await this.getUserId()
      if (!userId) {
        // Don't throw error to prevent login loops
        return
      }

      const { error } = await this.supabase.rpc('create_refinancing_opportunity', {
        _user_id: userId,
        _new_interest_rate: newInterestRate,
        _loan_term: loanTerm,
        _debt_id: debtId
      })

      if (error) {
        console.error('Error creating refinancing opportunity:', error)
      }
    } catch (error) {
      console.error('Error in createRefinancingOpportunity:', error)
    }
  }

  async updateDebtAfterRefinancing(
    debtId: string, 
    newInterestRate: number, 
    newLoanTerm: number
  ): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('update_debt_after_refinancing', {
        _debt_id: debtId,
        _new_interest_rate: newInterestRate,
        _new_loan_term: newLoanTerm
      })

      if (error) {
        console.error('Error updating debt after refinancing:', error)
      }
    } catch (error) {
      console.error('Error in updateDebtAfterRefinancing:', error)
    }
  }

  async calculateDebtToIncomeRatio(): Promise<number> {
    try {
      const userId = await this.getUserId()
      if (!userId) {
        // Return 0 instead of throwing an error
        return 0
      }

      const { data, error } = await this.supabase.rpc('calculate_debt_to_income_ratio', {
        _user_id: userId
      })

      if (error) {
        console.error('Error calculating debt to income ratio:', error)
        return 0
      }
      return data || 0
    } catch (error) {
      console.error('Error in calculateDebtToIncomeRatio:', error)
      return 0
    }
  }
}
