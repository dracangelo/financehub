"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AddInvestmentForm } from "@/components/investments/add-investment-form"
import { DeleteInvestment } from "@/components/investments/delete-investment"
import { formatCurrency } from "@/lib/utils/formatting"
import { BarChart, Pencil, RefreshCw } from "lucide-react"
import { getInvestments } from "@/app/actions/investments"
import { getTaxLossHarvestingOpportunities, getBenchmarkComparisons, getDividendReinvestmentProjection } from "@/app/actions/investment-analytics"

interface Investment {
  id: string
  name: string
  ticker?: string
  type: string
  value: number
  costBasis: number
  allocation: number
  account?: string
  category?: string
  currency?: string
  quantity?: number
  currentPrice?: number
  initialPrice?: number
}

interface InvestmentListProps {
  initialInvestments?: Investment[]
}

export function InvestmentList({ initialInvestments }: InvestmentListProps) {
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments || [])
  const [isLoading, setIsLoading] = useState(!initialInvestments)
  const [taxLossOpportunities, setTaxLossOpportunities] = useState<any[] | null>(null)
  const [benchmark, setBenchmark] = useState<any | null>(null)
  const [dividendProjection, setDividendProjection] = useState<any[] | null>(null)
  const [activeTab, setActiveTab] = useState("portfolio")
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!initialInvestments) {
      fetchInvestments()
    }
    
    // Fetch additional data for other tabs
    fetchTaxLossOpportunities()
    fetchBenchmarkComparisons()
    fetchDividendProjections()
  }, [initialInvestments])

  const fetchInvestments = async () => {
    setIsLoading(true)
    try {
      const data = await getInvestments()
      if (data && Array.isArray(data)) {
        const formattedInvestments = data.map((inv) => ({
          id: inv.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
          name: inv.name || "Unnamed Investment",
          ticker: inv.ticker || undefined,
          type: inv.type || "Other",
          value: parseFloat(inv.value) || 0,
          costBasis: parseFloat(inv.cost_basis) || 0,
          allocation: parseFloat(inv.allocation) || 0,
          account: inv.accounts?.name || (inv.account_id ? "Unknown Account" : undefined),
          currency: inv.currency || "USD",
          category: inv.categories?.name || (inv.category_id ? "Unknown Category" : undefined),
          quantity: inv.quantity,
          currentPrice: inv.current_price,
          initialPrice: inv.initial_price
        }))
        setInvestments(formattedInvestments)
      } else {
        console.error("Invalid data format from getInvestments:", data)
        setInvestments([])
      }
    } catch (error) {
      console.error("Error fetching investments:", error)
      setInvestments([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTaxLossOpportunities = async () => {
    try {
      const data = await getTaxLossHarvestingOpportunities()
      setTaxLossOpportunities(data)
    } catch (error) {
      console.error("Error fetching tax loss opportunities:", error)
      setTaxLossOpportunities([])
    }
  }

  const fetchBenchmarkComparisons = async () => {
    try {
      const data = await getBenchmarkComparisons()
      setBenchmark(data)
    } catch (error) {
      console.error("Error fetching benchmark comparisons:", error)
      setBenchmark(null)
    }
  }

  const fetchDividendProjections = async () => {
    try {
      const data = await getDividendReinvestmentProjection()
      setDividendProjection(data)
    } catch (error) {
      console.error("Error fetching dividend projections:", error)
      setDividendProjection([])
    }
  }

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchInvestments()
    setIsRefreshing(false)
  }

  // Sort investments by value (largest first)
  const sortedInvestments = [...investments].sort((a, b) => b.value - a.value)

  // Calculate total portfolio value
  const totalValue = investments.reduce((sum, inv) => sum + (inv.value || 0), 0)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        <TabsTrigger value="taxloss">Tax Loss Harvesting</TabsTrigger>
        <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
        <TabsTrigger value="dividends">Dividend Reinvestment</TabsTrigger>
      </TabsList>
      <TabsContent value="portfolio">
        {isLoading ? (
          <div>Loading investments...</div>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Investments</CardTitle>
                <CardDescription>
                  Manage your investment portfolio
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <AddInvestmentForm onInvestmentAdded={handleRefresh} />
              </div>
            </CardHeader>
            <CardContent>
              {investments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <p className="mb-4 text-muted-foreground">
                    You don't have any investments yet.
                  </p>
                  <AddInvestmentForm
                    className="mt-2"
                    onInvestmentAdded={handleRefresh}
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Cost Basis</TableHead>
                      <TableHead className="text-right">Return</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedInvestments.map((investment) => {
                      // Calculate return values
                      const value = investment.value || 0
                      const costBasis = investment.costBasis || 0
                      const returnAmount = value - costBasis
                      const returnPercent = costBasis > 0 ? (returnAmount / costBasis) * 100 : 0
                      const isPositive = returnAmount >= 0

                      return (
                        <TableRow key={investment.id}>
                          <TableCell>
                            <div className="font-medium">{investment.name}</div>
                            {investment.ticker && (
                              <div className="text-xs text-muted-foreground">
                                {investment.ticker}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{investment.type}</Badge>
                          </TableCell>
                          <TableCell>
                            {investment.account || "Default"}
                          </TableCell>
                          <TableCell>
                            {investment.category ? (
                              <Badge>
                                {investment.category}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {investment.quantity ? investment.quantity.toLocaleString() : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {investment.currentPrice 
                              ? formatCurrency(investment.currentPrice, investment.currency || "USD") 
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(value, investment.currency || "USD")}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(costBasis, investment.currency || "USD")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className={
                                isPositive ? "text-green-600" : "text-red-600"
                              }
                            >
                              {isPositive ? "+" : ""}
                              {formatCurrency(returnAmount, investment.currency || "USD")}
                              <span className="ml-1 text-xs">
                                ({isPositive ? "+" : ""}
                                {returnPercent.toFixed(2)}%)
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center space-x-2">
                              <Link href={`/investments/${investment.id}`} passHref>
                                <Button variant="ghost" size="sm">
                                  <BarChart className="h-4 w-4" />
                                </Button>
                              </Link>
                              <AddInvestmentForm 
                                investment={investment} 
                                isEditMode={true} 
                                onInvestmentAdded={handleRefresh}
                              />
                              <DeleteInvestment 
                                investmentId={investment.id} 
                                investmentName={investment.name}
                                onInvestmentDeleted={handleRefresh}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex w-full flex-col space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Total Portfolio Value:</span>
                  <span className="font-bold">
                    {formatCurrency(totalValue, "USD")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {investments.length} investment{investments.length !== 1 ? "s" : ""}
                </div>
              </div>
            </CardFooter>
          </Card>
        )}
      </TabsContent>
      <TabsContent value="taxloss">
        {taxLossOpportunities === null ? (
          <div>Loading tax loss harvesting opportunities...</div>
        ) : taxLossOpportunities.length > 0 ? (
          <div>
            <h3 className="text-lg font-medium mb-4">Tax Loss Harvesting Opportunities</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investment</TableHead>
                  <TableHead>Current Loss</TableHead>
                  <TableHead>Tax Savings</TableHead>
                  <TableHead>Alternative</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxLossOpportunities.map((opportunity, index) => (
                  <TableRow key={index}>
                    <TableCell>{opportunity.investment}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(opportunity.loss)}</TableCell>
                    <TableCell>{formatCurrency(opportunity.taxSavings)}</TableCell>
                    <TableCell>{opportunity.alternative}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No tax loss harvesting opportunities found at this time.</p>
          </div>
        )}
      </TabsContent>
      <TabsContent value="benchmark">
        {benchmark === null ? (
          <div>Loading benchmark comparisons...</div>
        ) : benchmark ? (
          <div>
            <h3 className="text-lg font-medium mb-4">Benchmark Comparisons</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benchmark</TableHead>
                  <TableHead>1 Month</TableHead>
                  <TableHead>3 Months</TableHead>
                  <TableHead>YTD</TableHead>
                  <TableHead>1 Year</TableHead>
                  <TableHead>3 Years</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Your Portfolio</TableCell>
                  <TableCell className={benchmark.portfolio && benchmark.portfolio.oneMonth >= 0 ? "text-green-600" : "text-red-600"}>
                    {benchmark.portfolio?.oneMonth || 0}%
                  </TableCell>
                  <TableCell className={benchmark.portfolio && benchmark.portfolio.threeMonths >= 0 ? "text-green-600" : "text-red-600"}>
                    {benchmark.portfolio?.threeMonths || 0}%
                  </TableCell>
                  <TableCell className={benchmark.portfolio && benchmark.portfolio.ytd >= 0 ? "text-green-600" : "text-red-600"}>
                    {benchmark.portfolio?.ytd || 0}%
                  </TableCell>
                  <TableCell className={benchmark.portfolio && benchmark.portfolio.oneYear >= 0 ? "text-green-600" : "text-red-600"}>
                    {benchmark.portfolio?.oneYear || 0}%
                  </TableCell>
                  <TableCell className={benchmark.portfolio && benchmark.portfolio.threeYears >= 0 ? "text-green-600" : "text-red-600"}>
                    {benchmark.portfolio?.threeYears || 0}%
                  </TableCell>
                </TableRow>
                {benchmark.indices && Array.isArray(benchmark.indices) ? benchmark.indices.map((index, i) => (
                  <TableRow key={i}>
                    <TableCell>{index.name}</TableCell>
                    <TableCell className={index.oneMonth >= 0 ? "text-green-600" : "text-red-600"}>
                      {index.oneMonth}%
                    </TableCell>
                    <TableCell className={index.threeMonths >= 0 ? "text-green-600" : "text-red-600"}>
                      {index.threeMonths}%
                    </TableCell>
                    <TableCell className={index.ytd >= 0 ? "text-green-600" : "text-red-600"}>
                      {index.ytd}%
                    </TableCell>
                    <TableCell className={index.oneYear >= 0 ? "text-green-600" : "text-red-600"}>
                      {index.oneYear}%
                    </TableCell>
                    <TableCell className={index.threeYears >= 0 ? "text-green-600" : "text-red-600"}>
                      {index.threeYears}%
                    </TableCell>
                  </TableRow>
                )) : null}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Benchmark comparison data is not available.</p>
          </div>
        )}
      </TabsContent>
      <TabsContent value="dividends">
        {dividendProjection === null ? (
          <div>Loading dividend reinvestment projections...</div>
        ) : dividendProjection.length > 0 ? (
          <div>
            <h3 className="text-lg font-medium mb-4">Dividend Reinvestment Projection</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Starting Value</TableHead>
                  <TableHead>Dividends</TableHead>
                  <TableHead>Growth</TableHead>
                  <TableHead>Ending Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dividendProjection.map((year, index) => (
                  <TableRow key={index}>
                    <TableCell>{year.year}</TableCell>
                    <TableCell>{formatCurrency(year.startingValue)}</TableCell>
                    <TableCell>{formatCurrency(year.dividends)}</TableCell>
                    <TableCell>{formatCurrency(year.growth)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(year.endingValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No dividend-paying investments found in your portfolio.</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
