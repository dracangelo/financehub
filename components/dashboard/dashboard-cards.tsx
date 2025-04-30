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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30 dark:to-transparent">
          <CardTitle className="text-sm font-medium flex items-center">
            <Wallet className="h-4 w-4 text-blue-500 mr-2" />
            Total Balance
          </CardTitle>
          <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
            <Wallet className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{formatCurrency(accountSummary.totalBalance)}</div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Across {accountSummary.accountCount} accounts</p>
            <div className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
              Net Worth: {formatCurrency(netWorth)}
            </div>
          </div>
          {Object.keys(accountSummary.typeBreakdown).length > 0 && (
            <div className="mt-4 pt-3 border-t border-dashed">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-medium">Account Types</span>
              </div>
              <div className="space-y-2">
                {Object.entries(accountSummary.typeBreakdown).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between text-xs bg-muted/40 p-1.5 rounded">
                    <span className="capitalize font-medium">{type}</span>
                    <span className="font-semibold">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-transparent dark:from-green-950/30 dark:to-transparent">
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
            Projected Income
          </CardTitle>
          <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-green-600">+{formatCurrency(cashflowSummary.projectedIncome)}</div>
          <div className="mt-2 flex items-center space-x-1 bg-muted/30 p-1.5 rounded">
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
          
          <div className="mt-4 pt-3 border-t border-dashed">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-medium">Income Sources</span>
              <span className="text-muted-foreground">Monthly Estimate</span>
            </div>
            <div className="h-[60px] overflow-y-auto space-y-2 pr-1">
              <div className="flex items-center justify-between text-xs bg-muted/40 p-1.5 rounded">
                <span className="font-medium">Primary Income</span>
                <span className="text-green-600 font-semibold">+{formatCurrency(cashflowSummary.projectedIncome * 0.8)}</span>
              </div>
              <div className="flex items-center justify-between text-xs bg-muted/40 p-1.5 rounded">
                <span className="font-medium">Other Sources</span>
                <span className="text-green-600 font-semibold">+{formatCurrency(cashflowSummary.projectedIncome * 0.2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/30 dark:to-transparent">
          <CardTitle className="text-sm font-medium flex items-center">
            <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
            Projected Expenses
          </CardTitle>
          <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-red-600">-{formatCurrency(cashflowSummary.projectedExpenses)}</div>
          <div className="mt-2 flex items-center space-x-1 bg-muted/30 p-1.5 rounded">
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
          
          <div className="mt-4 pt-3 border-t border-dashed">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-medium">Budget Utilization</span>
              <span className="text-muted-foreground">{budgetUtilization}%</span>
            </div>
            <Progress 
              value={budgetUtilization} 
              className="h-2.5 rounded-full" 
              indicatorClassName={
                budgetUtilization < 70 ? "bg-green-600" : 
                budgetUtilization < 90 ? "bg-yellow-500" : 
                "bg-red-600"
              }
            />
            <p className="mt-2 text-xs text-muted-foreground flex items-center justify-center bg-muted/40 p-1.5 rounded mt-2">
              {budgetUtilization < 70 ? (
                <><span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>On track</>
              ) : budgetUtilization < 90 ? (
                <><span className="h-2 w-2 rounded-full bg-yellow-500 mr-1.5"></span>Approaching limit</>
              ) : (
                <><span className="h-2 w-2 rounded-full bg-red-500 mr-1.5"></span>Over budget</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-950/30 dark:to-transparent">
          <CardTitle className="text-sm font-medium flex items-center">
            <BarChart3 className="h-4 w-4 text-purple-500 mr-2" />
            Net Cashflow
          </CardTitle>
          <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-full">
            <BarChart3 className={`h-4 w-4 text-purple-500`} />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className={`text-2xl font-bold ${cashflowSummary.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {cashflowSummary.netCashflow >= 0 ? '+' : ''}{formatCurrency(cashflowSummary.netCashflow)}
          </div>
          <div className="mt-2 flex items-center space-x-1 bg-muted/30 p-1.5 rounded">
            <PiggyBank className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Savings Rate: {Math.round(cashflowSummary.savingsRate)}%
            </p>
          </div>
          
          <div className="mt-4 pt-3 border-t border-dashed">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium">Financial Status:</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${financialStatus === 'Positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {financialStatus} Cashflow
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground bg-muted/40 p-1.5 rounded flex items-center">
              <span className={`h-2 w-2 rounded-full ${financialStatus === 'Positive' ? 'bg-green-500' : 'bg-red-500'} mr-1.5`}></span>
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
