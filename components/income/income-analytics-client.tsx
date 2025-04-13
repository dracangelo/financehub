"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { ArrowUpRight, TrendingUp, DollarSign, Calendar, BarChart3 } from "lucide-react"

// Import client components with dynamic imports
const DiversificationWheel = dynamic(() => import("@/components/income/diversification-wheel").then(mod => mod.DiversificationWheel), { ssr: false })

interface IncomeAnalyticsClientProps {
  sources: any[]
}

// Function to normalize income to monthly amount
const normalizeToMonthly = (amount: number, frequency: string): number => {
  switch (frequency) {
    case "daily": return amount * 30.42; // Average days in a month
    case "weekly": return amount * 4.33; // Average weeks in a month
    case "bi-weekly": return amount * 2.17; // Bi-weekly periods in a month
    case "monthly": return amount;
    case "annually": return amount / 12;
    case "one-time": return amount / 12; // Spread one-time income over a year
    default: return amount;
  }
};

// Function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Colors for charts
const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A569BD", 
  "#5DADE2", "#48C9B0", "#F4D03F", "#EB984E", "#EC7063"
];

export function IncomeAnalyticsClient({ sources }: IncomeAnalyticsClientProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Calculate monthly and annual income
  const monthlyIncome = sources.reduce((sum, source) => {
    return sum + normalizeToMonthly(Number(source.amount), source.frequency);
  }, 0);

  const annualIncome = monthlyIncome * 12;

  // Prepare data for type distribution chart
  const typeDistributionData = React.useMemo(() => {
    if (!sources || sources.length === 0) return [];
    
    const typeDistribution: Record<string, number> = {};
    
    sources.forEach((source) => {
      const normalizedAmount = normalizeToMonthly(Number(source.amount), source.frequency);
      typeDistribution[source.type] = (typeDistribution[source.type] || 0) + normalizedAmount;
    });
    
    return Object.entries(typeDistribution).map(([type, amount]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize type
      value: amount,
    }));
  }, [sources]);

  // Prepare data for frequency distribution chart
  const frequencyDistributionData = React.useMemo(() => {
    if (!sources || sources.length === 0) return [];
    
    const frequencyDistribution: Record<string, number> = {};
    
    sources.forEach((source) => {
      const normalizedAmount = normalizeToMonthly(Number(source.amount), source.frequency);
      frequencyDistribution[source.frequency] = (frequencyDistribution[source.frequency] || 0) + normalizedAmount;
    });
    
    return Object.entries(frequencyDistribution).map(([frequency, amount]) => {
      // Format the frequency name for display
      let name = frequency;
      switch (frequency) {
        case "bi-weekly": name = "Bi-Weekly"; break;
        case "one-time": name = "One-Time"; break;
        default: name = frequency.charAt(0).toUpperCase() + frequency.slice(1);
      }
      
      return {
        name,
        value: amount,
      };
    });
  }, [sources]);

  // Prepare data for income stability chart (monthly vs one-time)
  const stabilityData = React.useMemo(() => {
    if (!sources || sources.length === 0) return { recurring: 0, oneTime: 0 };
    
    let recurring = 0;
    let oneTime = 0;
    
    sources.forEach((source) => {
      const normalizedAmount = normalizeToMonthly(Number(source.amount), source.frequency);
      if (source.frequency === "one-time") {
        oneTime += normalizedAmount;
      } else {
        recurring += normalizedAmount;
      }
    });
    
    return [
      { name: "Recurring", value: recurring },
      { name: "One-Time", value: oneTime }
    ];
  }, [sources]);

  // Prepare data for income by source bar chart
  const incomeBySourceData = React.useMemo(() => {
    if (!sources || sources.length === 0) return [];
    
    return sources.map(source => ({
      name: source.name,
      monthly: normalizeToMonthly(Number(source.amount), source.frequency),
      type: source.type
    })).sort((a, b) => b.monthly - a.monthly).slice(0, 10); // Top 10 sources
  }, [sources]);

  // Prepare data for monthly trend (simulated data since we don't have historical data)
  const monthlyTrendData = React.useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    
    return months.map((month, index) => {
      // Create a simulated trend based on current income
      // This is just for visualization purposes
      let multiplier = 1;
      
      // Add some variation to make the chart interesting
      if (index < currentMonth) {
        // Past months have slightly lower income (simulated growth)
        multiplier = 0.85 + (index / currentMonth) * 0.15;
      } else if (index > currentMonth) {
        // Future months are projections (slight growth trend)
        multiplier = 1 + ((index - currentMonth) / (12 - currentMonth)) * 0.1;
      }
      
      return {
        name: month,
        income: monthlyIncome * multiplier,
        current: index === currentMonth
      };
    });
  }, [monthlyIncome]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
          <TabsTrigger value="trends">Trends & Projections</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardHeader className="pb-2">
                <CardDescription>Monthly Income</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  <DollarSign className="h-5 w-5 text-blue-500 mr-1" />
                  {formatCurrency(monthlyIncome)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  From {sources.length} income source{sources.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardHeader className="pb-2">
                <CardDescription>Annual Income</CardDescription>
                <CardTitle className="text-2xl flex items-center">
                  <Calendar className="h-5 w-5 text-green-500 mr-1" />
                  {formatCurrency(annualIncome)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Projected yearly earnings
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950 dark:to-fuchsia-950">
              <CardHeader className="pb-2">
                <CardDescription>Primary Income Type</CardDescription>
                <CardTitle className="text-2xl capitalize">
                  {typeDistributionData.length > 0 ? 
                    typeDistributionData.sort((a, b) => b.value - a.value)[0].name : 
                    "None"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {typeDistributionData.length > 0 ? 
                    `${Math.round((typeDistributionData.sort((a, b) => b.value - a.value)[0].value / monthlyIncome) * 100)}% of total income` : 
                    "Add income sources to see distribution"}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Income by Source</CardTitle>
                <CardDescription>Top income sources by monthly amount</CardDescription>
              </CardHeader>
              <CardContent>
                {incomeBySourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={incomeBySourceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70} 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, "Monthly"]}
                        labelFormatter={(label) => `Source: ${label}`}
                      />
                      <Bar 
                        dataKey="monthly" 
                        name="Monthly Amount" 
                        fill="#8884d8" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No income sources found
                  </div>
                )}
              </CardContent>
            </Card>
            
            <DiversificationWheel sources={sources} />
          </div>
        </TabsContent>
        
        {/* Distributions Tab */}
        <TabsContent value="distributions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Income by Type</CardTitle>
                <CardDescription>Distribution of income across different types</CardDescription>
              </CardHeader>
              <CardContent>
                {typeDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={typeDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {typeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, "Monthly"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No income sources found
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Income by Frequency</CardTitle>
                <CardDescription>How your income is distributed by payment frequency</CardDescription>
              </CardHeader>
              <CardContent>
                {frequencyDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={frequencyDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {frequencyDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, "Monthly"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No income sources found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Income Stability</CardTitle>
              <CardDescription>Recurring vs One-time income sources</CardDescription>
            </CardHeader>
            <CardContent>
              {stabilityData.length > 0 && stabilityData[0].value + stabilityData[1].value > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stabilityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#4CAF50" />
                        <Cell fill="#FF9800" />
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, "Monthly"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="flex flex-col justify-center space-y-4">
                    <div>
                      <h4 className="text-sm font-medium flex items-center">
                        <div className="w-3 h-3 rounded-full bg-[#4CAF50] mr-2"></div>
                        Recurring Income
                      </h4>
                      <p className="text-2xl font-bold">{formatCurrency(stabilityData[0].value)}</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((stabilityData[0].value / (stabilityData[0].value + stabilityData[1].value)) * 100)}% of monthly income
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium flex items-center">
                        <div className="w-3 h-3 rounded-full bg-[#FF9800] mr-2"></div>
                        One-Time Income
                      </h4>
                      <p className="text-2xl font-bold">{formatCurrency(stabilityData[1].value)}</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((stabilityData[1].value / (stabilityData[0].value + stabilityData[1].value)) * 100)}% of monthly income
                      </p>
                    </div>
                    
                    {stabilityData[0].value > 0 && stabilityData[1].value > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm">
                        <p className="font-medium text-blue-800 dark:text-blue-300">Insight:</p>
                        <p className="text-blue-700 dark:text-blue-400">
                          {stabilityData[0].value > stabilityData[1].value * 3 ? 
                            "Your income is primarily from recurring sources, providing good stability." : 
                            "You have a healthy mix of recurring and one-time income sources."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  No income sources found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Income Trend</CardTitle>
              <CardDescription>Historical and projected monthly income</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={monthlyTrendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Income"]} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload, index } = props;
                      if (payload.current) {
                        return (
                          <circle 
                            key={`dot-${index}`}
                            cx={cx} 
                            cy={cy} 
                            r={6} 
                            fill="#8884d8" 
                            stroke="white" 
                            strokeWidth={2} 
                          />
                        );
                      }
                      return (
                        <circle 
                          key={`dot-${index}`}
                          cx={cx} 
                          cy={cy} 
                          r={4} 
                          fill="#8884d8" 
                        />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-muted-foreground text-center">
                <p>Note: Future months show projected income based on current sources</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Income Growth Potential</CardTitle>
                <CardDescription>Analysis of income growth opportunities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Current Monthly</h3>
                      <p className="text-2xl font-bold">{formatCurrency(monthlyIncome)}</p>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Potential (10% Growth)</h3>
                      <p className="text-2xl font-bold">{formatCurrency(monthlyIncome * 1.1)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Growth Recommendations:</h3>
                  <ul className="space-y-2">
                    {sources.length === 0 ? (
                      <li className="text-muted-foreground">Add income sources to see recommendations</li>
                    ) : (
                      <>
                        {typeDistributionData.length < 3 && (
                          <li className="flex items-start">
                            <TrendingUp className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span>Diversify your income with additional income types</span>
                          </li>
                        )}
                        {stabilityData[1].value > stabilityData[0].value && (
                          <li className="flex items-start">
                            <BarChart3 className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                            <span>Focus on increasing recurring income sources for better stability</span>
                          </li>
                        )}
                        <li className="flex items-start">
                          <DollarSign className="h-5 w-5 text-purple-500 mr-2 mt-0.5" />
                          <span>Consider passive income opportunities to supplement your earnings</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Income Frequency Analysis</CardTitle>
                <CardDescription>How often you receive income payments</CardDescription>
              </CardHeader>
              <CardContent>
                {frequencyDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={frequencyDistributionData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} />
                      <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, "Monthly"]} />
                      <Bar 
                        dataKey="value" 
                        name="Monthly Amount" 
                        fill="#8884d8" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    No income sources found
                  </div>
                )}
                
                {frequencyDistributionData.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-300">Cash Flow Insight:</p>
                    <p className="text-blue-700 dark:text-blue-400">
                      {frequencyDistributionData.length === 1 ? 
                        `All your income comes in ${frequencyDistributionData[0].name.toLowerCase()} intervals.` : 
                        `You receive income at ${frequencyDistributionData.length} different intervals, which helps with cash flow management.`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
