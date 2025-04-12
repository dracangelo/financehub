"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { calculateESGScore } from "@/lib/investments/calculations"
import { ESGScoreChart } from "@/components/investments/esg-score-chart"
import { ESGInvestmentTable } from "@/components/investments/esg-investment-table"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"
import type { Investment } from "@/lib/investments/types"
import { fetchInvestments, fetchESGCategories, fetchExcludedSectors } from "@/app/actions/investments"

export default function ESGScreenerPage() {
  const [portfolio, setPortfolio] = useState<Investment[]>([])
  const [investmentUniverse, setInvestmentUniverse] = useState<Investment[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [minESGScore, setMinESGScore] = useState<number>(5)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [excludedSectorIds, setExcludedSectorIds] = useState<string[]>(["fossil_fuels", "weapons", "tobacco"])
  const [activeTab, setActiveTab] = useState<string>("portfolio")
  const [esgCategories, setESGCategories] = useState<{ id: string; name: string; category: string }[]>([])
  const [excludedSectors, setExcludedSectors] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data on component mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Fetch user's portfolio investments
        const userPortfolio = await fetchInvestments({ type: "portfolio" })
        setPortfolio(userPortfolio)

        // Fetch all available investments for screening
        const allInvestments = await fetchInvestments({ type: "universe" })
        setInvestmentUniverse(allInvestments)

        // Fetch ESG categories
        const categories = await fetchESGCategories()
        setESGCategories(categories)

        // Fetch excluded sectors
        const sectors = await fetchExcludedSectors()
        setExcludedSectors(sectors)
      } catch (error) {
        console.error("Error loading ESG data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Calculate portfolio ESG score
  const portfolioESGScore = calculateESGScore(portfolio)

  // Filter investments based on criteria
  const filteredInvestments = investmentUniverse.filter((investment) => {
    // Filter by search term
    if (
      searchTerm &&
      !investment.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !investment.ticker?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }

    // Filter by minimum ESG score
    if (investment.esgScore && investment.esgScore.total < minESGScore) {
      return false
    }

    // Filter by excluded sectors
    if (excludedSectorIds.includes(investment.sector_id)) {
      return false
    }

    // Filter by selected ESG categories
    if (selectedCategories.length > 0) {
      // This would require a more complex query in a real implementation
      // Here we're assuming the investment has a categories array
      const investmentCategories = investment.esg_categories || []
      if (!selectedCategories.some((cat) => investmentCategories.includes(cat))) {
        return false
      }
    }

    return true
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading ESG data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ESG Investment Screener</h1>
          <p className="text-muted-foreground mt-2">
            Find investments that align with your environmental, social, and governance values
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/investments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Investments
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio ESG Score</CardTitle>
            <CardDescription>Environmental, Social, and Governance ratings for your portfolio</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ESGScoreChart esgScore={portfolioESGScore} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ESG Summary</CardTitle>
            <CardDescription>Overview of your portfolio's ESG characteristics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Overall ESG Score</p>
              <div className="flex items-center mt-1">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(portfolioESGScore.totalESGScore / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 font-medium">{portfolioESGScore.totalESGScore.toFixed(1)}/10</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Environmental Score</p>
              <div className="flex items-center mt-1">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(portfolioESGScore.environmentalScore / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 font-medium">{portfolioESGScore.environmentalScore.toFixed(1)}/10</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Social Score</p>
              <div className="flex items-center mt-1">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${(portfolioESGScore.socialScore / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 font-medium">{portfolioESGScore.socialScore.toFixed(1)}/10</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Governance Score</p>
              <div className="flex items-center mt-1">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${(portfolioESGScore.governanceScore / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 font-medium">{portfolioESGScore.governanceScore.toFixed(1)}/10</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="portfolio">Current Portfolio</TabsTrigger>
          <TabsTrigger value="screener">ESG Screener</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio ESG Analysis</CardTitle>
              <CardDescription>ESG ratings for your current investments</CardDescription>
            </CardHeader>
            <CardContent>
              <ESGInvestmentTable investments={portfolio} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screener" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ESG Screening Criteria</CardTitle>
              <CardDescription>Define your ESG investment preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="search">Search by Name or Ticker</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search investments..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="min-esg-score">Minimum ESG Score: {minESGScore.toFixed(1)}</Label>
                </div>
                <Slider
                  id="min-esg-score"
                  min={0}
                  max={10}
                  step={0.1}
                  value={[minESGScore]}
                  onValueChange={(value) => setMinESGScore(value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Exclude Sectors</Label>
                <div className="grid grid-cols-2 gap-2">
                  {excludedSectors.map((sector) => (
                    <div key={sector.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sector-${sector.id}`}
                        checked={excludedSectorIds.includes(sector.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setExcludedSectorIds([...excludedSectorIds, sector.id])
                          } else {
                            setExcludedSectorIds(excludedSectorIds.filter((id) => id !== sector.id))
                          }
                        }}
                      />
                      <Label htmlFor={`sector-${sector.id}`}>{sector.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>ESG Focus Areas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {esgCategories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([...selectedCategories, category.id])
                          } else {
                            setSelectedCategories(selectedCategories.filter((id) => id !== category.id))
                          }
                        }}
                      />
                      <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ESG Investment Options</CardTitle>
              <CardDescription>Investments that match your ESG criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <ESGInvestmentTable investments={filteredInvestments} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

