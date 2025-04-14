import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { CashflowForecast } from "@/lib/cashflow-utils"
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight 
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface AccountSummary {
  totalBalance: number
  accountCount: number
  currencyBreakdown: { [key: string]: number }
  typeBreakdown: { [key: string]: number }
}

interface CashflowSummary extends Omit<CashflowForecast, 'monthOverMonth'> {
  monthOverMonth: {
    income: number
    expenses: number
  }
}

interface DashboardCardsProps {
  accountSummary: AccountSummary
  cashflowSummary: CashflowSummary
}

export function DashboardCards({ accountSummary, cashflowSummary }: DashboardCardsProps) {
  // Calculate additional metrics
  const totalAssets = accountSummary.totalBalance;
  const totalLiabilities = 0; // This would need to be fetched from a liabilities source
  const netWorth = totalAssets - totalLiabilities;
  
  // Calculate budget utilization
  const budgetUtilization = cashflowSummary.projectedExpenses > 0 
    ? Math.min(100, Math.round((cashflowSummary.projectedExpenses / cashflowSummary.projectedIncome) * 100)) 
    : 0;
  
  // Determine financial status
  const financialStatus = cashflowSummary.netCashflow >= 0 ? 'Positive' : 'Negative';
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(accountSummary.totalBalance)}</div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Across {accountSummary.accountCount} accounts</p>
            <div className="text-xs font-medium text-green-600">Net Worth: {formatCurrency(netWorth)}</div>
          </div>
          {Object.keys(accountSummary.typeBreakdown).length > 0 && (
            <div className="mt-3">
              <div className="flex justify-between items-center text-xs mb-1">
                <span>Account Types</span>
              </div>
              <div className="space-y-1">
                {Object.entries(accountSummary.typeBreakdown).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{type}</span>
                    <span>{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projected Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">+{formatCurrency(cashflowSummary.projectedIncome)}</div>
          <div className="mt-2 flex items-center space-x-1">
            {cashflowSummary.monthOverMonth.income >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-600" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-600" />
            )}
            <p className={`text-xs ${cashflowSummary.monthOverMonth.income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {cashflowSummary.monthOverMonth.income >= 0 ? '+' : ''}
              {cashflowSummary.monthOverMonth.income}% from last month
            </p>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span>Income Sources</span>
              <span className="text-muted-foreground">Monthly Estimate</span>
            </div>
            <div className="h-[60px] overflow-y-auto space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Primary Income</span>
                <span className="text-green-600">+{formatCurrency(cashflowSummary.projectedIncome * 0.8)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Other Sources</span>
                <span className="text-green-600">+{formatCurrency(cashflowSummary.projectedIncome * 0.2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projected Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">-{formatCurrency(cashflowSummary.projectedExpenses)}</div>
          <div className="mt-2 flex items-center space-x-1">
            {cashflowSummary.monthOverMonth.expenses <= 0 ? (
              <ArrowDownRight className="h-3 w-3 text-green-600" />
            ) : (
              <ArrowUpRight className="h-3 w-3 text-red-600" />
            )}
            <p className={`text-xs ${cashflowSummary.monthOverMonth.expenses <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {cashflowSummary.monthOverMonth.expenses >= 0 ? '+' : ''}
              {cashflowSummary.monthOverMonth.expenses}% from last month
            </p>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between items-center text-xs mb-1">
              <span>Budget Utilization</span>
              <span className="text-muted-foreground">{budgetUtilization}%</span>
            </div>
            <Progress 
              value={budgetUtilization} 
              className="h-2" 
              indicatorClassName={
                budgetUtilization < 70 ? "bg-green-600" : 
                budgetUtilization < 90 ? "bg-yellow-500" : 
                "bg-red-600"
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {budgetUtilization < 70 ? "On track" : 
               budgetUtilization < 90 ? "Approaching limit" : 
               "Over budget"}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Cashflow</CardTitle>
          <BarChart3 className={`h-4 w-4 ${cashflowSummary.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${cashflowSummary.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {cashflowSummary.netCashflow >= 0 ? '+' : ''}{formatCurrency(cashflowSummary.netCashflow)}
          </div>
          <div className="mt-2 flex items-center space-x-1">
            <PiggyBank className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Savings Rate: {Math.round(cashflowSummary.savingsRate)}%
            </p>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium">Financial Status:</span>
              <span className={`text-xs font-medium ${financialStatus === 'Positive' ? 'text-green-600' : 'text-red-600'}`}>
                {financialStatus} Cashflow
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {financialStatus === 'Positive' 
                ? "You're earning more than spending" 
                : "Your expenses exceed your income"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
