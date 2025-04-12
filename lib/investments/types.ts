export interface ESGScore {
  environmental: number
  social: number
  governance: number
  total: number
}

export interface Investment {
  id: string
  name: string
  ticker?: string
  type: "stock" | "etf" | "bond" | "mutual_fund" | "crypto" | "other"
  value: number
  costBasis: number
  price: number
  allocation: number
  expenseRatio?: number
  dividendYield?: number
  sector: string
  sector_id?: string
  region: string
  esgScore?: ESGScore
  esg_categories?: string[]
  taxLocation: "taxable" | "tax_deferred" | "tax_free"
  user_id?: string
  created_at?: string
  updated_at?: string
}

export interface PortfolioESGScore {
  environmentalScore: number
  socialScore: number
  governanceScore: number
  totalESGScore: number
}

