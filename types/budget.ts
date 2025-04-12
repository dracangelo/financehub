export type BudgetModelType = "traditional" | "50-30-20" | "zero-based" | "envelope"
export type RiskLevel = "low" | "medium" | "high"

export interface BudgetCategory {
  name: string
  percentage: number
  amount: number
  subcategories?: BudgetCategory[]
  priority?: number
  historical?: {
    average: number
    frequency: number
  }
}

export interface BudgetModel {
  type: BudgetModelType
  name: string
  description: string
  categories: BudgetCategory[]
  totalBudget: number
  savingsTarget: number
  riskLevel: RiskLevel
  insights?: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    risks: string[]
  }
  adjustments?: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
  predictions?: {
    savingsGrowth: any
    debtReduction: any
    goalAchievement: any
    riskFactors: string[]
  }
}

export interface FinancialGoal {
  type: "savings" | "debt_reduction" | "investment"
  target: number
  deadline?: Date
  priority: number
  currentProgress: number
}

export interface BudgetTemplate {
  id: string
  name: string
  description: string
  type: BudgetModelType
  categories: BudgetCategory[]
  defaultAllocation: {
    [key: string]: number // category name -> percentage
  }
  recommendedIncome: {
    min: number
    max: number
  }
  timeline: string // e.g., "6 months", "1 year"
  tags: string[]
}
