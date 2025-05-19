export interface Debt {
  id: string
  user_id: string
  name: string
  current_balance: number
  interest_rate: number
  minimum_payment: number
  loan_term?: number | null
  due_date: string | null
  created_at: string
  updated_at: string
  type?: string // Type of debt (e.g., credit_card, mortgage, personal_loan)
  isLocal?: boolean // Flag to indicate if debt is stored locally
}

export interface DebtConsolidation {
  id: string
  user_id: string
  total_debt_balance: number
  interest_rate: number
  loan_term?: number | null
  monthly_payment: number
  created_at: string
  updated_at: string
}

export type DebtRepaymentStrategy = "avalanche" | "snowball" | "hybrid"

export interface DebtRepaymentPlan {
  debt_id: string
  debt_name: string
  total_balance: number
  interest_rate: number
  monthly_payment: number
}

export interface InterestSavingsResult {
  current_interest: number
  refinanced_interest: number
  total_savings: number
}

export interface DebtToIncomeRatio {
  ratio: number
  total_debt: number
  annual_income: number
}

export interface DebtPayoffProjection {
  months_to_payoff: number
  total_interest_paid: number
  monthly_payment: number
  payoff_date: string
  payment_schedule: {
    month: number
    date: string
    payment: number
    principal: number
    interest: number
    remaining_balance: number
  }[]
}
