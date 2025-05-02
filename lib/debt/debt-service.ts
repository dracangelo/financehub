import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Debt, 
  DebtConsolidation, 
  DebtRepaymentPlan, 
  DebtRepaymentStrategy,
  InterestSavingsResult,
  DebtToIncomeRatio
} from '@/types/debt'

export class DebtService {
  private supabase = createClientComponentClient()

  // Helper method to safely get the current user ID without throwing errors
  private async getUserId(): Promise<string | null> {
    try {
      // Get the session directly - this is the most reliable method
      const { data } = await this.supabase.auth.getSession()
      const userId = data?.session?.user?.id
      
      if (userId) {
        return userId
      }
      
      return null
    } catch (error) {
      console.error('Auth error:', error)
      return null
    }
  }

  async getDebts(): Promise<Debt[]> {
    try {
      // Try to get user directly from the session
      const { data: sessionData } = await this.supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id
      
      if (!userId) {
        console.log('getDebts: No authenticated user found')
        return []
      }
      
      console.log(`getDebts: Fetching debts for user ${userId}`)
      
      // Query the database with the user ID
      const { data, error } = await this.supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('interest_rate', { ascending: false })
      
      if (error) {
        console.error('Database error:', error)
        return []
      }
      
      console.log(`getDebts: Found ${data?.length || 0} debts`)
      return data || []
    } catch (error) {
      console.error('Error in getDebts:', error)
      return []
    }
  }

  async createDebt(debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Debt> {
    try {
      // Get the session directly
      const { data: sessionData } = await this.supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id
      
      if (!userId) {
        console.error('createDebt: No authenticated user found')
        throw new Error('User not authenticated')
      }
      
      console.log(`createDebt: Creating debt for user ${userId}`)
      
      // Create the debt
      const { error } = await this.supabase.rpc('create_debt', {
        _user_id: userId,
        _name: debt.name,
        _current_balance: debt.current_balance,
        _interest_rate: debt.interest_rate,
        _minimum_payment: debt.minimum_payment,
        _loan_term: debt.loan_term
      })

      if (error) {
        console.error('Error creating debt:', error)
        throw error
      }
      
      // Fetch the newly created debt
      const { data: newDebt, error: fetchError } = await this.supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (fetchError) {
        console.error('Error fetching new debt:', fetchError)
        throw fetchError
      }
      
      return newDebt
    } catch (error) {
      console.error('Error in createDebt:', error)
      throw error
    }
  }

  async updateDebt(debtId: string, debt: Partial<Debt>): Promise<void> {
    const { error } = await this.supabase.rpc('update_debt', {
      _debt_id: debtId,
      _name: debt.name,
      _current_balance: debt.current_balance,
      _interest_rate: debt.interest_rate,
      _minimum_payment: debt.minimum_payment,
      _loan_term: debt.loan_term
    })

    if (error) throw error
  }

  async deleteDebt(debtId: string): Promise<void> {
    const { error } = await this.supabase.rpc('delete_debt', {
      _debt_id: debtId
    })

    if (error) throw error
  }

  async calculateRepaymentPlan(strategy: DebtRepaymentStrategy): Promise<DebtRepaymentPlan[]> {
    const userId = await this.getUserId()
    if (!userId) {
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
        throw new Error('Invalid repayment strategy')
    }

    const { data, error } = await this.supabase.rpc(functionName, {
      _user_id: userId
    })

    if (error) throw error
    return data || []
  }

  async calculateInterestSavings(newInterestRate: number, loanTerm: number): Promise<number> {
    const userId = await this.getUserId()
    if (!userId) {
      return 0
    }

    const { data, error } = await this.supabase.rpc('calculate_interest_savings', {
      _user_id: userId,
      _new_interest_rate: newInterestRate,
      _loan_term: loanTerm
    })

    if (error) throw error
    return data || 0
  }

  async createRefinancingOpportunity(
    newInterestRate: number, 
    loanTerm: number, 
    debtId: string
  ): Promise<void> {
    const userId = await this.getUserId()
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const { error } = await this.supabase.rpc('create_refinancing_opportunity', {
      _user_id: userId,
      _new_interest_rate: newInterestRate,
      _loan_term: loanTerm,
      _debt_id: debtId
    })

    if (error) throw error
  }

  async updateDebtAfterRefinancing(
    debtId: string, 
    newInterestRate: number, 
    newLoanTerm: number
  ): Promise<void> {
    const { error } = await this.supabase.rpc('update_debt_after_refinancing', {
      _debt_id: debtId,
      _new_interest_rate: newInterestRate,
      _new_loan_term: newLoanTerm
    })

    if (error) throw error
  }

  async calculateDebtToIncomeRatio(): Promise<number> {
    const userId = await this.getUserId()
    if (!userId) {
      return 0
    }

    const { data, error } = await this.supabase.rpc('calculate_debt_to_income_ratio', {
      _user_id: userId
    })

    if (error) throw error
    return data || 0
  }
}
