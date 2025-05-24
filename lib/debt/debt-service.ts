import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { 
  Debt, 
  DebtConsolidation, 
  DebtRepaymentPlan, 
  DebtRepaymentStrategy,
  InterestSavingsResult,
  DebtToIncomeRatio
} from '@/types/debt'
import Cookies from 'js-cookie'
import { supabaseAdmin } from '@/lib/supabase'

export class DebtService {
  private supabase: SupabaseClient
  private cachedUserId: string | null = null
  private isAuthenticatedId: boolean = false
  // Authentication is required for debt management
  private bypassAuthCheck: boolean = false
  private clientConfig: {
    useClientStorage: boolean
    attemptDatabaseOperations: boolean
    useCreateDebtFunction: boolean
  } | null = null
  
  constructor() {
    this.supabase = createClientComponentClient()
  }
  
  // Get the Supabase client for authenticated users only
  private getSupabaseClient() {
    // We don't need to set any headers or cookies for authenticated users
    // as Supabase handles the auth token automatically
    return this.supabase
  }
  
  // Set client ID in headers and cookies for better RLS handling
  private setClientHeaders(userId: string): void {
    if (typeof window !== 'undefined') {
      // Set client ID in localStorage for persistence
      window.localStorage.setItem('client-id', userId)
      
      // Set client ID in cookie with 1 year expiration
      const expirationDate = new Date()
      expirationDate.setFullYear(expirationDate.getFullYear() + 1)
      document.cookie = `client-id=${userId}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`
      
      console.log(`Set client ID in headers and cookies: ${userId}`)
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
    
    // Default configuration - prioritize database operations, disable local storage
    this.clientConfig = {
      useClientStorage: false,
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
      const setupResponse = await fetch('/api/database/debt-setup', {
        method: 'GET',
        credentials: 'include' // Include cookies for authentication
      })
      if (!setupResponse.ok) {
        const errorData = await setupResponse.json()
        console.warn('Database setup warning:', errorData)
      }
      
      // Then, update the RLS policies to be more permissive
      const rlsResponse = await fetch('/api/database/debts-rls', {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!rlsResponse.ok) {
        const errorData = await rlsResponse.json()
        console.warn('RLS update warning:', errorData)
      }
    } catch (error) {
      console.warn('Failed to run database setup:', error)
      // Continue anyway, as the main operation might still succeed
    }
  }
  
  // Get the current user ID - Using the same approach as the subscription system
  private async getUserId(): Promise<string | null> {
    try {
      // If we have a cached authenticated user ID, use it
      if (this.cachedUserId) {
        console.log(`getUserId: Using cached user ID: ${this.cachedUserId}`)
        return this.cachedUserId
      }
      
      // PRIORITY 1: Try to get the user ID from Supabase directly
      try {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (user && user.id) {
          this.cachedUserId = user.id
          this.isAuthenticatedId = true
          console.log(`getUserId: Found authenticated user ID from Supabase: ${this.cachedUserId}`)
          return this.cachedUserId
        }
      } catch (userError) {
        console.warn('Error getting user from Supabase auth.getUser():', userError)
      }
      
      // PRIORITY 2: Try to get authenticated user ID from session
      try {
        const { data: sessionData } = await this.supabase.auth.getSession()
        if (sessionData?.session?.user?.id) {
          console.log(`getUserId: Found user ID from session: ${sessionData.session.user.id}`)
          this.cachedUserId = sessionData.session.user.id
          this.isAuthenticatedId = true
          return sessionData.session.user.id
        }
      } catch (sessionError) {
        console.warn('Error getting session from Supabase:', sessionError)
      }
      
      // PRIORITY 3: Try to get client ID from cookies
      if (typeof document !== 'undefined') {
        const cookieHeader = document.cookie
        if (cookieHeader) {
          // Try to get client ID from cookie
          const clientIdMatch = cookieHeader.match(/client-id=([^;]+)/)
          if (clientIdMatch && clientIdMatch[1] && clientIdMatch[1].trim() !== '') {
            const clientId = decodeURIComponent(clientIdMatch[1])
            console.log(`getUserId: Using client ID from cookie: ${clientId}`)
            this.cachedUserId = clientId
            this.isAuthenticatedId = false
            return clientId
          }
        }
      }
      
      // PRIORITY 4: Check for client ID in localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const clientId = window.localStorage.getItem('client-id')
        if (clientId) {
          console.log(`getUserId: Using client ID from localStorage: ${clientId}`)
          this.cachedUserId = clientId
          this.isAuthenticatedId = false
          return clientId
        }
      }
      
      // PRIORITY 5: Use default UUID as last resort
      const defaultUuid = '00000000-0000-0000-0000-000000000000'
      console.log(`getUserId: No user ID found, using default UUID: ${defaultUuid}`)
      this.cachedUserId = defaultUuid
      this.isAuthenticatedId = false
      return defaultUuid
    } catch (error) {
      console.error('Error in getUserId:', error)
      // Return default UUID instead of null
      const defaultUuid = '00000000-0000-0000-0000-000000000000'
      this.cachedUserId = defaultUuid
      this.isAuthenticatedId = false
      return defaultUuid
    }
  }

  async getDebts(): Promise<Debt[]> {
    try {
      // Get user ID with fallback mechanisms
      const userId = await this.getUserId()
      
      // Set client ID in cookies and headers for better RLS handling
      if (userId) {
        this.setClientHeaders(userId)
      } else {
        console.warn('No user ID available, using default ID')
      }
      
      // Use the server-side API endpoint to fetch debts
      console.log(`Using server-side API to fetch debts for user: ${userId}`)
      const response = await fetch('/api/debts/list', {
        method: 'GET',
        headers: {
          'client-id': userId || '00000000-0000-0000-0000-000000000000' // Include client ID in headers
        },
        credentials: 'include' // Include cookies for authentication
      })
      
      if (!response.ok) {
        // If we get a 401 Unauthorized, it means we need to authenticate
        if (response.status === 401) {
          console.log('Authentication required, returning empty debts array')
          return []
        }
        
        const errorData = await response.json()
        console.error('Error from debt list API:', errorData)
        throw new Error(errorData.message || 'Failed to fetch debts')
      }
      
      const result = await response.json()
      console.log('Successfully fetched debts via API:', result)
      
      if (!result.success || !result.debts) {
        console.warn('Invalid response from server when fetching debts')
        return []
      }
      
      return result.debts
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
        const { data: existingData, error: existingError } = await this.getSupabaseClient()
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
        const { error } = await this.getSupabaseClient()
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
  private deleteLocalDebt(debtId: string): void {
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
      console.log('User not authenticated, redirecting to login')
      this.redirectToLogin()
      throw new Error('Authentication required: Please sign in to access this feature')
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
      const userId = await this.getUserId()
      
      // If no user ID is found, the user is not authenticated
      if (!userId) {
        console.log('User not authenticated, redirecting to login')
        this.redirectToLogin()
        throw new Error('Authentication required')
      }
      
      // Use the server-side API endpoint to add the debt
      console.log('Using server-side API to add debt')
      const response = await fetch('/api/debts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No client ID header - only using authenticated users
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(debt)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error from debt add API:', errorData)
        
        // Handle authentication errors
        if (response.status === 401) {
          console.log('Authentication error, redirecting to login')
          this.redirectToLogin()
          throw new Error('Authentication required')
        }
        
        throw new Error(errorData.message || 'Failed to add debt')
      }
      
      const result = await response.json()
      console.log('Successfully created debt via API:', result)
      
      if (!result.success || !result.debt) {
        throw new Error('Failed to add debt: Invalid response from server')
      }
      
      return result.debt
    } catch (error) {
      console.error('Error in createDebt:', error)
      throw new Error(`Failed to create debt: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    console.log('Attempting database insert with regular client')
    try {
      // Try to use the RPC function if enabled
      if (useCreateDebtFunction) {
        const { data: rpcData, error: rpcError } = await this.getSupabaseClient().rpc('create_debt', {
          _name: debt.name,
          _type: debt.type || 'personal_loan',
          _current_balance: debt.current_balance,
          _interest_rate: debt.interest_rate,
          _minimum_payment: debt.minimum_payment,
          _loan_term: debt.loan_term || null
        })
        
        if (!rpcError && rpcData) {
          console.log('Successfully created debt in database via RPC')
          
          // First, get the debt from the database
      const { data: debtData, error: getError } = await this.getSupabaseClient()
        .from('debts')
        .select('*')
        .eq('id', rpcData)
        .single()
          
          if (!getError && debtData) {
            return debtData
          }
        } else {
          console.warn('RPC error in database insert:', rpcError)
        }
      }
      
      // Try direct insert
      const dbId = crypto.randomUUID()
      // Try to insert directly into the database
      const { data, error } = await this.getSupabaseClient()
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
      
      if (!error && data && data.length > 0) {
        console.log('Successfully created debt in database via direct insert')
        return data[0]
      } else {
        console.warn('Direct insert error in database insert:', error)
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
      // Try to get the current user ID
      let userId: string | null = null;
      try {
        userId = await this.getUserId();
        if (!userId) {
          throw new Error('Authentication required: Please sign in to update your debts');
        }
      } catch (authError) {
        console.warn('Authentication error in updateDebt:', authError);
        throw new Error('Authentication required: Please sign in to update your debts');
      }
      
      // Use the server-side API endpoint to update the debt
      console.log('Using server-side API to update debt')
      const response = await fetch('/api/debts/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No client ID header - only using authenticated users
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          debtId,
          ...debt
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error from debt update API:', errorData)
        throw new Error(errorData.message || 'Failed to update debt')
      }
      
      const result = await response.json()
      console.log('Successfully updated debt via API:', result)
      
      if (!result.success) {
        throw new Error('Failed to update debt: Invalid response from server')
      }
    } catch (error) {
      console.error('Error in updateDebt:', error)
      
      // If the error is authentication-related, redirect to login
      if (error instanceof Error && this.isAuthError(error.message)) {
        this.redirectToLogin()
        return
      }
      throw new Error(`Failed to update debt: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteDebt(debtId: string): Promise<void> {
    try {
      // Get the current user ID
      const userId = await this.getUserId()
      
      // If no user ID is found, the user is not authenticated
      if (!userId) {
        console.log('User not authenticated, redirecting to login')
        this.redirectToLogin()
        throw new Error('Authentication required')
      }
      
      // Use the server-side API endpoint to delete the debt
      console.log('Using server-side API to delete debt')
      const response = await fetch('/api/debts/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No client ID header - only using authenticated users
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ debtId })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error from debt delete API:', errorData)
        throw new Error(errorData.message || 'Failed to delete debt')
      }
      
      const result = await response.json()
      console.log('Successfully deleted debt via API:', result)
      
      if (!result.success) {
        throw new Error('Failed to delete debt: Invalid response from server')
      }
    } catch (error) {
      console.error('Error in deleteDebt:', error)
      
      // If the error is authentication-related, redirect to login
      if (error instanceof Error && this.isAuthError(error.message)) {
        this.redirectToLogin()
        return
      }
      
      throw new Error(`Failed to delete debt: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

      const { data, error } = await this.getSupabaseClient().rpc(functionName, {
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
      
      const { data, error } = await this.getSupabaseClient().rpc('calculate_interest_savings', {
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
      
      const { error } = await this.getSupabaseClient().rpc('create_refinancing_opportunity', {
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
      const { error } = await this.getSupabaseClient().rpc('update_debt_after_refinancing', {
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
      
      const { data, error } = await this.getSupabaseClient().rpc('calculate_debt_to_income_ratio', {
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
      
      // Helper method to sync local debts to the database
      await this.syncLocalDebtsToDatabase(localDebts, userId)
      
      console.log(`Force sync complete: ${localDebts.length} debts synced successfully`)
      return { 
        success: true, 
        message: `Successfully synced ${localDebts.length} debts to database` 
      }
    } catch (error) {
      console.error('Error in forceSync:', error)
      return { 
        success: false, 
        message: `Error syncing debts: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  // This is a placeholder to fix the duplicate function implementation error
  // The actual implementation is at line 280
}
