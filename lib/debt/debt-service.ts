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
import Cookies from 'js-cookie'

export class DebtService {
  private supabase = createClientComponentClient()
  private cachedUserId: string | null = null
  private clientConfig: {
    useClientStorage: boolean
    attemptDatabaseOperations: boolean
    useCreateDebtFunction: boolean
  } | null = null
  
  // Set client ID for the request context
  private setClientHeaders(userId: string): void {
    try {
      // We can't directly modify Supabase headers, so we'll use cookies instead
      if (typeof window !== 'undefined') {
        // Set a cookie with the client ID
        document.cookie = `client-id=${userId}; path=/; max-age=86400; SameSite=Strict`
        
        // Also store in localStorage as a backup
        localStorage.setItem('debt-client-id', userId)
      }
    } catch (error) {
      console.warn('Failed to set client headers:', error)
    }
  }
  
  // Get client configuration from cookies or use defaults
  private getClientConfig(): {
    useClientStorage: boolean
    attemptDatabaseOperations: boolean
    useCreateDebtFunction: boolean
  } {
    if (this.clientConfig) {
      return this.clientConfig
    }
    
    try {
      if (typeof window !== 'undefined') {
        // Try to get the client configuration from cookies
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith('debt-client-config='))
          ?.split('=')?.[1]
        
        if (cookieValue) {
          try {
            const config = JSON.parse(decodeURIComponent(cookieValue))
            this.clientConfig = config
            console.log('Using client configuration from cookie:', config)
            return config
          } catch (parseError) {
            console.warn('Error parsing client configuration from cookie:', parseError)
          }
        }
      }
    } catch (error) {
      console.warn('Error getting client configuration from cookie:', error)
    }
    
    // Default configuration - prioritize client-side storage
    this.clientConfig = {
      useClientStorage: true,
      attemptDatabaseOperations: true,
      useCreateDebtFunction: false
    }
    
    console.log('Using default client configuration:', this.clientConfig)
    return this.clientConfig
  }
  
  // Helper method to ensure database schema is properly set up
  private async ensureDatabaseSetup(): Promise<void> {
    try {
      // First, call the database setup endpoint to ensure schema is ready
      const setupResponse = await fetch('/api/database/debt-setup')
      if (!setupResponse.ok) {
        const errorData = await setupResponse.json()
        console.warn('Database setup warning:', errorData)
      }
      
      // Then, update the RLS policies to be more permissive
      const rlsResponse = await fetch('/api/database/update-debts-rls')
      if (!rlsResponse.ok) {
        const errorData = await rlsResponse.json()
        console.warn('RLS update warning:', errorData)
      }
    } catch (error) {
      console.warn('Failed to run database setup:', error)
      // Continue anyway, as the main operation might still succeed
    }
  }
  
  // Get the current user ID with proper error handling and retry logic
  private async getUserId(): Promise<string | null> {
    try {
      // Return cached ID if available to avoid repeated lookups
      if (this.cachedUserId) {
        console.log(`getUserId: Using cached user ID: ${this.cachedUserId}`)
        return this.cachedUserId
      }
      
      // Check for client ID in cookies first
      const clientId = Cookies.get('client-id')
      if (clientId) {
        console.log(`getUserId: Using client ID from cookie: ${clientId}`)
        this.cachedUserId = clientId
        return clientId
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
        const refreshResult = await this.supabase.auth.refreshSession()
        if (refreshResult.data?.session?.user?.id) {
          console.log(`getUserId: Found user ID from refreshSession: ${refreshResult.data.session.user.id}`)
          this.cachedUserId = refreshResult.data.session.user.id
          return refreshResult.data.session.user.id
        }
      } catch (refreshError) {
        console.warn('Error refreshing session:', refreshError)
        // Continue to next method
      }
      
      // If all else fails, generate a default UUID
      console.log('getUserId: Using default UUID')
      const defaultUuid = '00000000-0000-0000-0000-000000000000'
      this.cachedUserId = defaultUuid
      
      // Store this ID in a cookie for future use
      Cookies.set('client-id', defaultUuid, { expires: 365 }) // 1 year expiration
      
      return defaultUuid
      
    } catch (error) {
      console.error('Error in getUserId:', error)
      return null
    }
  }

  async getDebts(): Promise<Debt[]> {
    try {
      const userId = await this.getUserId()
      if (!userId) {
        console.warn('No user ID available, returning empty debts array')
        return []
      }

      // Set client ID in cookies for better RLS handling
      this.setClientHeaders(userId)
      
      // Get client configuration
      const config = this.getClientConfig()

      // Get local debts first to ensure we have something to show
      const localDebts = this.getLocalDebts(userId)
      
      // If database operations are disabled, return only local debts
      if (!config.attemptDatabaseOperations) {
        console.log('Database operations disabled, using only local debts')
        return localDebts
      }
      
      try {
        console.log(`getDebts: Fetching debts for user ${userId}`)
        
        // Query the database with the user ID
        const { data, error } = await this.supabase
          .from('debts')
          .select('*')
          .eq('user_id', userId)
          .order('interest_rate', { ascending: false })
        
        if (error) {
          console.warn('Database error in getDebts:', error)
          console.log('Using only local debts due to database error')
          return localDebts
        }
        
        // Mark database debts
        const dbDebts = (data || []).map(debt => ({
          ...debt,
          isLocal: false
        }))
        
        // Combine both sources, removing duplicates by ID
        // If a debt exists in both DB and local, prefer the DB version
        const allDebts = [...dbDebts]
        for (const localDebt of localDebts) {
          if (!allDebts.some(debt => debt.id === localDebt.id)) {
            allDebts.push(localDebt)
          }
        }
        
        console.log(`getDebts: Found ${allDebts.length} total debts (${dbDebts.length} from DB, ${localDebts.length} local)`)
        
        return allDebts
      } catch (dbError) {
        console.warn('Database error in getDebts:', dbError)
        console.log('Using only local debts due to database error')
        return localDebts
      }
    } catch (error) {
      console.error('Error in getDebts:', error)
      return []
    }
  }
  
  // Helper method to get debts from localStorage
  private getLocalDebts(userId: string): Debt[] {
    try {
      if (typeof window === 'undefined') return []
      
      const localDebts = JSON.parse(localStorage.getItem('client-debts') || '[]') as Debt[]
      const userDebts = localDebts.filter(debt => debt.user_id === userId)
      
      // Mark all local debts with isLocal flag
      userDebts.forEach(debt => {
        debt.isLocal = true
      })
      
      // Try to sync local debts to the database if we have any
      if (userDebts.length > 0) {
        console.log(`Attempting to sync ${userDebts.length} local debts to database`)
        this.syncLocalDebtsToDatabase(userDebts, userId).catch((syncError: Error) => {
          console.warn('Failed to sync local debts to database:', syncError)
        })
      }
      
      return userDebts
    } catch (error) {
      console.error('Error getting local debts:', error)
      return []
    }
  }
  
  // Helper method to sync local debts to the database
  private async syncLocalDebtsToDatabase(localDebts: Debt[], userId: string): Promise<void> {
    if (localDebts.length === 0) return
    
    console.log(`Syncing ${localDebts.length} local debts to database`)
    
    // Set the client ID in cookies and localStorage
    this.setClientHeaders(userId)
    
    // Try to insert each local debt into the database
    for (const localDebt of localDebts) {
      try {
        // Check if this debt already exists in the database
        const { data: existingData, error: existingError } = await this.supabase
          .from('debts')
          .select('id')
          .eq('id', localDebt.id)
          .maybeSingle()
        
        // If the debt already exists in the database, skip it
        if (!existingError && existingData) {
          console.log(`Debt ${localDebt.id} already exists in database, skipping sync`)
          continue
        }
        
        // Insert the debt into the database
        const { error } = await this.supabase
          .from('debts')
          .insert({
            id: localDebt.id,
            user_id: userId,
            name: localDebt.name,
            type: localDebt.type || 'personal_loan',
            current_balance: localDebt.current_balance,
            interest_rate: localDebt.interest_rate,
            minimum_payment: localDebt.minimum_payment,
            loan_term: localDebt.loan_term,
            due_date: localDebt.due_date,
            created_at: localDebt.created_at,
            updated_at: new Date().toISOString()
          })
        
        if (error) {
          console.warn(`Failed to sync local debt ${localDebt.id} to database:`, error)
        } else {
          console.log(`Successfully synced local debt ${localDebt.id} to database`)
          
          // Remove this debt from localStorage after successful sync
          this.removeLocalDebt(localDebt.id)
        }
      } catch (error) {
        console.warn(`Error syncing local debt ${localDebt.id}:`, error)
      }
    }
  }
  
  // Helper method to remove a debt from localStorage
  private removeLocalDebt(debtId: string): void {
    try {
      if (typeof window === 'undefined') return
      
      const localDebts = JSON.parse(localStorage.getItem('client-debts') || '[]') as Debt[]
      const updatedDebts = localDebts.filter(debt => debt.id !== debtId)
      localStorage.setItem('client-debts', JSON.stringify(updatedDebts))
      
      console.log(`Removed debt ${debtId} from localStorage after database sync`)
    } catch (error) {
      console.warn('Error removing local debt:', error)
    }
  }
  
  // Helper method to update a debt in localStorage
  private updateLocalDebtInStorage(debtId: string, debt: Partial<Debt>): void {
    try {
      if (typeof window === 'undefined') return
      
      const localDebts = JSON.parse(localStorage.getItem('client-debts') || '[]') as Debt[]
      const debtIndex = localDebts.findIndex(d => d.id === debtId)
      
      if (debtIndex === -1) {
        console.warn(`Debt ${debtId} not found in local storage`)
        return
      }
      
      // Update the debt
      localDebts[debtIndex] = {
        ...localDebts[debtIndex],
        ...debt,
        updated_at: new Date().toISOString()
      }
      
      localStorage.setItem('client-debts', JSON.stringify(localDebts))
      console.log(`Successfully updated debt ${debtId} in local storage`)
    } catch (error) {
      console.error('Error updating local debt:', error)
    }
  }
  
  // Helper method to delete a debt from localStorage
  private deleteLocalDebtFromStorage(debtId: string): void {
    try {
      if (typeof window === 'undefined') return
      
      const localDebts = JSON.parse(localStorage.getItem('client-debts') || '[]') as Debt[]
      const updatedDebts = localDebts.filter(debt => debt.id !== debtId)
      
      localStorage.setItem('client-debts', JSON.stringify(updatedDebts))
      console.log(`Successfully deleted debt ${debtId} from local storage`)
    } catch (error) {
      console.error('Error deleting local debt:', error)
    }
  }

  // Helper method to ensure we have a valid user ID
  private async ensureUserId(): Promise<string> {
    const userId = await this.getUserId()
    if (!userId) {
      throw new Error('User ID is required for this operation')
    }
    return userId
  }

  // Set user ID directly (can be used by components that have access to the user ID)
  setUserId(userId: string): void {
    if (!userId) {
      console.warn('Attempted to set empty user ID')
      return
    }
    
    console.log(`setUserId: Setting user ID to ${userId}`)
    this.cachedUserId = userId
    
    // Also store in cookie for persistence across page loads
    Cookies.set('client-id', userId, { expires: 365 }) // 1 year expiration
  }

  // Get user from Supabase
  async getUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser()
    return data?.user || null
  }

  async createDebt(debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Debt> {
    try {
      const userId = await this.ensureUserId()
      
      // Get client configuration to determine the approach
      const config = this.getClientConfig()
      
      // Always create a client-side debt object first for reliability
      const clientDebt = this.createClientSideDebt(debt, userId)
      console.log('Created client-side debt object')
      
      // If client storage is the primary method, store it immediately
      if (config.useClientStorage) {
        this.storeDebtInLocalStorage(clientDebt)
        console.log('Stored debt in localStorage')
        
        // If database operations are enabled, try them in the background
        if (config.attemptDatabaseOperations) {
          setTimeout(() => {
            this.attemptDatabaseInsert(debt, userId, clientDebt.id, config.useCreateDebtFunction).catch(err => {
              console.warn('Background database insert failed:', err)
            })
          }, 100)
        }
        
        return clientDebt
      } else {
        // Database is the primary method
        try {
          // Try to insert into the database first
          const dbDebt = await this.attemptDatabaseInsert(debt, userId, clientDebt.id, config.useCreateDebtFunction)
          if (dbDebt) {
            console.log('Successfully created debt in database')
            return dbDebt
          }
        } catch (dbError) {
          console.warn('Database insert failed, falling back to client storage:', dbError)
        }
        
        // Fall back to client storage if database insert fails
        this.storeDebtInLocalStorage(clientDebt)
        console.log('Stored debt in localStorage as fallback')
        return clientDebt
      }
    } catch (error) {
      console.error('Error in createDebt:', error)
      throw error
    }
  }
  
  // Create a client-side debt object
  private createClientSideDebt(debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>, userId: string): Debt {
    const now = new Date().toISOString()
    return {
      id: `local-${crypto.randomUUID()}`,
      user_id: userId,
      name: debt.name,
      type: debt.type || 'personal_loan',
      current_balance: debt.current_balance,
      interest_rate: debt.interest_rate,
      minimum_payment: debt.minimum_payment,
      loan_term: debt.loan_term,
      due_date: debt.due_date,
      created_at: now,
      updated_at: now,
      isLocal: true
    }
  }
  
  // Store a debt in localStorage
  private storeDebtInLocalStorage(debt: Debt): void {
    try {
      if (typeof window === 'undefined') return
      
      const localDebts = JSON.parse(localStorage.getItem('client-debts') || '[]') as Debt[]
      localDebts.push(debt)
      localStorage.setItem('client-debts', JSON.stringify(localDebts))
    } catch (error) {
      console.error('Error storing debt in localStorage:', error)
    }
  }
  
  // Attempt to insert into database
  private async attemptDatabaseInsert(
    debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>, 
    userId: string, 
    localId: string,
    useCreateDebtFunction: boolean = false
  ): Promise<Debt | null> {
    try {
      // Try to use the RPC function if enabled
      if (useCreateDebtFunction) {
        const { data: rpcData, error: rpcError } = await this.supabase.rpc('create_debt', {
          _name: debt.name,
          _type: debt.type || 'personal_loan',
          _current_balance: debt.current_balance,
          _interest_rate: debt.interest_rate,
          _minimum_payment: debt.minimum_payment,
          _loan_term: debt.loan_term || null
        })
        
        if (!rpcError && rpcData) {
          console.log('Successfully created debt in database via RPC')
          
          // Try to fetch the created debt
          const { data: createdDebt, error: fetchError } = await this.supabase
            .from('debts')
            .select('*')
            .eq('id', rpcData)
            .single()
          
          if (!fetchError && createdDebt) {
            return createdDebt
          }
        } else {
          console.warn('RPC error in database insert:', rpcError)
        }
      }
      
      // Try direct insert
      const dbId = crypto.randomUUID()
      const { data: insertData, error: insertError } = await this.supabase
        .from('debts')
        .insert({
          id: dbId,
          name: debt.name,
          type: debt.type || 'personal_loan',
          current_balance: debt.current_balance,
          interest_rate: debt.interest_rate,
          minimum_payment: debt.minimum_payment,
          loan_term: debt.loan_term,
          due_date: debt.due_date,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (!insertError && insertData && insertData.length > 0) {
        console.log('Successfully created debt in database via direct insert')
        return insertData[0]
      } else {
        console.warn('Direct insert error in database insert:', insertError)
      }
      
      return null
    } catch (error) {
      console.warn('Error in database insert:', error)
      return null
    }
  }
  
  // This method is kept for backward compatibility but now just delegates to the client-side approach
  private async attemptDirectInsert(debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>, userId: string): Promise<Debt> {
    const clientDebt = this.createClientSideDebt(debt, userId)
    this.storeDebtInLocalStorage(clientDebt)
    return clientDebt;
  }
  
  // Helper method to check if an error is authentication-related
  private isAuthError(errorMessage?: string): boolean {
    if (!errorMessage) return false
    return errorMessage.includes('JWT') || 
           errorMessage.includes('auth') || 
           errorMessage.includes('Authentication') ||
           errorMessage.includes('permission denied') ||
           errorMessage.includes('not authorized')
  }
  
  // Helper method to redirect to login page when authentication fails
  private redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      // Check if we're already on the login page to prevent redirect loops
      if (window.location.pathname === '/login') {
        console.log('Already on login page, not redirecting')
        return
      }
      
      // Store the current path to redirect back after login
      const currentPath = window.location.pathname
      if (currentPath !== '/' && !currentPath.includes('/login')) {
        localStorage.setItem('redirectAfterLogin', currentPath)
      }
      
      console.log('Redirecting to login page')
      window.location.href = '/login'
    }
  }

  async updateDebt(debtId: string, debt: Partial<Debt>): Promise<void> {
    try {
      const userId = await this.ensureUserId()
      
      // Set client ID in cookies for better RLS handling
      this.setClientHeaders(userId)
      
      // Get client configuration
      const config = this.getClientConfig()
      
      // Always update local debt first for reliability
      this.updateLocalDebtInStorage(debtId, debt)
      console.log('Updated debt in localStorage')
      
      // If database operations are disabled, return after local update
      if (!config.attemptDatabaseOperations) {
        console.log('Database operations disabled, using only local update')
        return
      }
      
      // Try to update in the database
      try {
        const { error } = await this.supabase
          .from('debts')
          .update({
            ...debt,
            updated_at: new Date().toISOString()
          })
          .eq('id', debtId)
          .eq('user_id', userId)
        
        if (error) {
          console.warn('Database error in updateDebt:', error)
          console.log('Using only local update due to database error')
        } else {
          console.log('Successfully updated debt in database')
        }
      } catch (dbError) {
        console.warn('Database error in updateDebt:', dbError)
        console.log('Using only local update due to database error')
      }
    } catch (error) {
      console.error('Error in updateDebt:', error)
      throw error
    }
  }

  async deleteDebt(debtId: string): Promise<void> {
    try {
      const userId = await this.ensureUserId()
      
      // Set client ID in cookies for better RLS handling
      this.setClientHeaders(userId)
      
      // Get client configuration
      const config = this.getClientConfig()
      
      // Always delete from local storage first for reliability
      this.deleteLocalDebtFromStorage(debtId)
      console.log('Deleted debt from localStorage')
      
      // If database operations are disabled, return after local delete
      if (!config.attemptDatabaseOperations) {
        console.log('Database operations disabled, using only local delete')
        return
      }
      
      // Try to delete from the database
      try {
        const { error } = await this.supabase
          .from('debts')
          .delete()
          .eq('id', debtId)
          .eq('user_id', userId)
        
        if (error) {
          console.warn('Database error in deleteDebt:', error)
          console.log('Using only local delete due to database error')
        } else {
          console.log('Successfully deleted debt from database')
        }
      } catch (dbError) {
        console.warn('Database error in deleteDebt:', dbError)
        console.log('Using only local delete due to database error')
      }
    } catch (error) {
      console.error('Error in deleteDebt:', error)
      throw error
    }
  }

  async calculateRepaymentPlan(strategy: DebtRepaymentStrategy): Promise<DebtRepaymentPlan[]> {
    try {
      const userId = await this.ensureUserId()
      
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
      const userId = await this.ensureUserId()
      
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
      const userId = await this.ensureUserId()
      
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
      const userId = await this.ensureUserId()
      
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
  
  // Public method to force sync all local debts to the database
  async forceSync(): Promise<{ success: boolean; message: string }> {
    try {
      const userId = await this.ensureUserId()
      
      // Set client ID in cookies for better RLS handling
      this.setClientHeaders(userId)
      
      // Get client configuration
      const config = this.getClientConfig()
      
      // If database operations are disabled, return error
      if (!config.attemptDatabaseOperations) {
        return { success: false, message: 'Database operations are disabled' }
      }
      
      // Get local debts
      const localDebts = this.getLocalDebts(userId)
      if (localDebts.length === 0) {
        return { success: true, message: 'No local debts to sync' }
      }
      
      console.log(`Syncing ${localDebts.length} local debts to database`)
      
      // Try to insert each local debt into the database
      let successCount = 0
      let errorCount = 0
      
      for (const localDebt of localDebts) {
        try {
          // Try to use the RPC function if enabled
          if (config.useCreateDebtFunction) {
            const { data: rpcData, error: rpcError } = await this.supabase.rpc('create_debt', {
              _name: localDebt.name,
              _type: localDebt.type || 'personal_loan',
              _current_balance: localDebt.current_balance,
              _interest_rate: localDebt.interest_rate,
              _minimum_payment: localDebt.minimum_payment,
              _loan_term: localDebt.loan_term || null
            })
            
            if (!rpcError && rpcData) {
              console.log(`Successfully synced debt ${localDebt.id} to database via RPC`)
              successCount++
              
              // Remove from local storage after successful sync
              this.deleteLocalDebtFromStorage(localDebt.id)
              continue
            } else {
              console.warn(`RPC error syncing debt ${localDebt.id}:`, rpcError)
            }
          }
          
          // Fall back to direct insert
          const dbId = crypto.randomUUID()
          const { error } = await this.supabase.from('debts').insert({
            id: dbId,
            name: localDebt.name,
            type: localDebt.type,
            current_balance: localDebt.current_balance,
            interest_rate: localDebt.interest_rate,
            minimum_payment: localDebt.minimum_payment,
            loan_term: localDebt.loan_term,
            due_date: localDebt.due_date,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          
          if (error) {
            console.warn(`Error syncing debt ${localDebt.id}:`, error)
            errorCount++
          } else {
            console.log(`Successfully synced debt ${localDebt.id} to database via direct insert`)
            successCount++
            
            // Remove from local storage after successful sync
            this.deleteLocalDebtFromStorage(localDebt.id)
          }
        } catch (error) {
          console.warn(`Error syncing local debt ${localDebt.id}:`, error)
        }
      }
      
      console.log(`Force sync complete: ${successCount}/${localDebts.length} debts synced successfully`)
      if (errorCount === 0) {
        return { 
          success: true, 
          message: `Successfully synced ${successCount} debts to database` 
        }
      } else {
        return { 
          success: successCount > 0, 
          message: `Synced ${successCount} debts, but failed to sync ${errorCount} debts` 
        }
      }
    } catch (error) {
      console.error('Error in forceSync:', error)
      return { 
        success: false, 
        message: `Error syncing debts: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }
}
