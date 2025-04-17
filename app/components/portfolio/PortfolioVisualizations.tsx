'use client'

import React, { useState } from 'react'
import { PerformanceChart } from './PerformanceChart'
import { CorrelationHeatmap } from './CorrelationHeatmap'
import { EfficientFrontier } from './EfficientFrontier'
import { FeeAnalysis } from './FeeAnalysis'
import { MarketContext } from './MarketContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getPortfolioPerformance, getPortfolioCorrelation, getEfficientFrontier, getInvestmentFees, getMarketContext, saveDashboardPreferences, getDashboardPreferences } from '@/app/actions/investments'
import { seedInvestmentData } from '@/app/actions/seed-investment-data'
import { Loader2, RefreshCw } from 'lucide-react'

export default function PortfolioVisualizations() {
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('all')
  const [preferences, setPreferences] = useState({
    risk_display_mode: 'simple',
    preferred_view: 'simplified',
    show_market_context: true
  })
  
  // State for all the data
  const [performanceData, setPerformanceData] = useState({
    performanceData: [],
    totalReturn: 0,
    annualizedReturn: 0,
    startValue: 0,
    endValue: 0
  })
  
  const [correlationData, setCorrelationData] = useState({
    assets: [],
    correlationMatrix: []
  })
  
  const [frontierData, setFrontierData] = useState({
    frontierPoints: [],
    currentPortfolio: null
  })
  
  const [feeData, setFeeData] = useState({
    feeImpact: [],
    feesByType: {},
    totalAnnualFees: 0,
    potentialSavings: 0
  })
  
  const [marketData, setMarketData] = useState({
    currentIndicators: [],
    historicalData: {},
    showMarketContext: true
  })

  // Load all data on initial render
  React.useEffect(() => {
    loadAllData()
    loadPreferences()
  }, [])

  // Load user preferences
  const loadPreferences = async () => {
    const userPreferences = await getDashboardPreferences()
    setPreferences(userPreferences)
  }

  // Load all data
  const loadAllData = async () => {
    setLoading(true)
    try {
      const [performance, correlation, frontier, fees, market] = await Promise.all([
        getPortfolioPerformance(timeframe),
        getPortfolioCorrelation(),
        getEfficientFrontier(),
        getInvestmentFees(),
        getMarketContext()
      ])
      
      setPerformanceData(performance)
      setCorrelationData(correlation)
      setFrontierData(frontier)
      setFeeData(fees)
      setMarketData(market)
    } catch (error) {
      console.error("Error loading portfolio data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle timeframe change
  const handleTimeframeChange = async (newTimeframe: 'week' | 'month' | 'quarter' | 'year' | 'all') => {
    setTimeframe(newTimeframe)
    try {
      const performance = await getPortfolioPerformance(newTimeframe)
      setPerformanceData(performance)
    } catch (error) {
      console.error("Error loading performance data:", error)
    }
  }

  // Handle preference changes
  const handlePreferenceChange = async (key: string, value: any) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    try {
      await saveDashboardPreferences(newPreferences)
      
      // If market context preference changed, update the data
      if (key === 'show_market_context') {
        const market = await getMarketContext()
        setMarketData(market)
      }
    } catch (error) {
      console.error("Error saving preferences:", error)
    }
  }

  // Seed sample data
  const handleSeedData = async () => {
    setSeeding(true)
    try {
      const result = await seedInvestmentData()
      if (result.success) {
        // Reload all data after seeding
        await loadAllData()
      }
    } catch (error) {
      console.error("Error seeding investment data:", error)
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Portfolio</h1>
          <p className="text-muted-foreground">
            Visualize and analyze your investment performance and allocation
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            variant="outline" 
            onClick={loadAllData}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Data
          </Button>
          
          <Button 
            variant="default" 
            onClick={handleSeedData}
            disabled={seeding}
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              "Generate Sample Data"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Preferences</CardTitle>
          <CardDescription>Customize how your investment data is displayed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="show-market-context" 
                checked={preferences.show_market_context}
                onCheckedChange={(checked) => handlePreferenceChange('show_market_context', checked)}
              />
              <Label htmlFor="show-market-context">Show Market Context</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="risk-display">Risk Display Mode</Label>
              <Select 
                value={preferences.risk_display_mode}
                onValueChange={(value) => handlePreferenceChange('risk_display_mode', value)}
              >
                <SelectTrigger id="risk-display">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferred-view">Preferred View</Label>
              <Select 
                value={preferences.preferred_view}
                onValueChange={(value) => handlePreferenceChange('preferred_view', value)}
              >
                <SelectTrigger id="preferred-view">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simplified">Simplified</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="efficient-frontier">Efficient Frontier</TabsTrigger>
          <TabsTrigger value="fees">Fee Analysis</TabsTrigger>
          <TabsTrigger value="market">Market Context</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <PerformanceChart 
              performanceData={performanceData.performanceData}
              totalReturn={performanceData.totalReturn}
              annualizedReturn={performanceData.annualizedReturn}
              startValue={performanceData.startValue}
              endValue={performanceData.endValue}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="allocation" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <CorrelationHeatmap 
              assets={correlationData.assets}
              correlationMatrix={correlationData.correlationMatrix}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="efficient-frontier" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <EfficientFrontier 
              frontierPoints={frontierData.frontierPoints}
              currentPortfolio={frontierData.currentPortfolio}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="fees" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <FeeAnalysis 
              feeImpact={feeData.feeImpact}
              feesByType={feeData.feesByType}
              totalAnnualFees={feeData.totalAnnualFees}
              potentialSavings={feeData.potentialSavings}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <MarketContext 
              currentIndicators={marketData.currentIndicators}
              historicalData={marketData.historicalData}
              showMarketContext={marketData.showMarketContext}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
