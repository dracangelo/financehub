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

  async getDebts(): Promise<Debt[]> {
    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.user.id)
      .order('interest_rate', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createDebt(debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Debt> {
    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase.rpc('create_debt', {
      _user_id: user.user.id,
      _name: debt.name,
      _current_balance: debt.current_balance,
      _interest_rate: debt.interest_rate,
      _minimum_payment: debt.minimum_payment,
      _loan_term: debt.loan_term
    })

    if (error) throw error
    
    // Fetch the newly created debt
    const { data: newDebt, error: fetchError } = await this.supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (fetchError) throw fetchError
    return newDebt
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
    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

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
      _user_id: user.user.id
    })

    if (error) throw error
    return data || []
  }

  async calculateInterestSavings(newInterestRate: number, loanTerm: number): Promise<number> {
    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase.rpc('calculate_interest_savings', {
      _user_id: user.user.id,
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
    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const { error } = await this.supabase.rpc('create_refinancing_opportunity', {
      _user_id: user.user.id,
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
    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase.rpc('calculate_debt_to_income_ratio', {
      _user_id: user.user.id
    })

    if (error) throw error
    return data || 0
  }
}
