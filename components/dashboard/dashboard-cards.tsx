import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { CashflowForecast } from "@/lib/cashflow-utils"

interface AccountSummary {
  totalBalance: number
  accountCount: number
  currencyBreakdown: { [key: string]: number }
  typeBreakdown: { [key: string]: number }
}

interface CashflowSummary extends CashflowForecast {
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
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(accountSummary.totalBalance)}</div>
          <p className="text-xs text-muted-foreground">Across {accountSummary.accountCount} accounts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projected Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{formatCurrency(cashflowSummary.projectedIncome)}</div>
          <p className="text-xs text-muted-foreground">
            {cashflowSummary.monthOverMonth.income >= 0 ? '+' : ''}
            {cashflowSummary.monthOverMonth.income}% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projected Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">-{formatCurrency(cashflowSummary.projectedExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {cashflowSummary.monthOverMonth.expenses >= 0 ? '+' : ''}
            {cashflowSummary.monthOverMonth.expenses}% from last month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Cashflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${cashflowSummary.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {cashflowSummary.netCashflow >= 0 ? '+' : ''}{formatCurrency(cashflowSummary.netCashflow)}
          </div>
          <p className="text-xs text-muted-foreground">
            Savings Rate: {Math.round(cashflowSummary.savingsRate)}%
          </p>
        </CardContent>
      </Card>
    </>
  )
}

