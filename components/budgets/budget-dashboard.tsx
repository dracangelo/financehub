"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BudgetTemplateCard } from "./templates/budget-template-card"
import { InteractiveTreemap } from "./visualizations/interactive-treemap"
import { InteractiveWaterfall } from "./visualizations/interactive-waterfall"
import { BudgetProgressTracker } from "./progress/budget-progress-tracker"
import { BudgetSharingDialog } from "./shared/budget-sharing-dialog"
import { LIFE_EVENT_TEMPLATES } from "@/lib/budget/templates/life-events"
import { LIFESTYLE_TEMPLATES } from "@/lib/budget/templates/lifestyle"
import { AlertCircle, BarChart3, LineChart, PieChart, Share2, Target, TrendingUp, TrendingDown, Percent, DollarSign, ArrowUpRight, ArrowDownRight, Info, Plus, Check } from "lucide-react"
import { getBudgetById, createBudget, getBudgets } from "@/app/actions/budgets"
import { formatCurrency } from "@/lib/utils/formatting"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// Helper function to get category colors based on percentage of budget
function getCategoryColor(amount: number, totalBudget: number): string {
  const percentage = (amount / totalBudget) * 100;
  
  if (percentage > 30) return "#ef4444"; // Red - large allocation
  if (percentage > 20) return "#f97316"; // Orange - medium allocation
  if (percentage > 10) return "#eab308"; // Yellow - moderate allocation
  return "#22c55e"; // Green - small allocation
}

interface BudgetDashboardProps {
  budgetId: string
  categories: any[]
  currentMembers: any[]
}

export function BudgetDashboard({ budgetId, categories, currentMembers }: BudgetDashboardProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [budget, setBudget] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>(budgetId)
  const [availableBudgets, setAvailableBudgets] = useState<any[]>([])
  const [spendingTrends, setSpendingTrends] = useState<any[]>([])
  const [budgetHealth, setBudgetHealth] = useState<string>("healthy") // 'healthy', 'warning', 'critical'
  const [timeframe, setTimeframe] = useState<string>("monthly")

  // Fetch all available budgets for the dropdown
  useEffect(() => {
    async function fetchAvailableBudgets() {
      try {
        console.log('BudgetDashboard: Fetching all available budgets');
        // This would typically be a server action to get all budgets
        // For now, we'll use the getBudgets function to fetch all budgets
        const allBudgets = await getBudgets();
        console.log('BudgetDashboard: Fetched all budgets:', allBudgets);
        
        if (allBudgets && allBudgets.length > 0) {
          setAvailableBudgets(allBudgets);
          
          // If we have a budgetId but no budget loaded yet, find it in the fetched budgets
          if (selectedBudgetId && !budget) {
            const selectedBudget = allBudgets.find(b => b.id === selectedBudgetId);
            if (selectedBudget) {
              console.log('BudgetDashboard: Found selected budget in fetched budgets:', selectedBudget);
              setBudget(selectedBudget);
            }
          }
        } else if (budget && allBudgets && !allBudgets.some(b => b.id === budget.id)) {
          // If we have a current budget but it's not in the list, add it
          setAvailableBudgets([budget]);
        }
      } catch (err) {
        console.error("Error fetching available budgets:", err);
        // Fallback to using the current budget if available
        if (budget) {
          setAvailableBudgets([budget]);
        }
      }
    }
    
    fetchAvailableBudgets();
  }, [selectedBudgetId, budget])

  // Initial load of budget data when component mounts or budgetId prop changes
  useEffect(() => {
    console.log('BudgetDashboard: budgetId prop changed to:', budgetId);
    console.log('BudgetDashboard: current selectedBudgetId:', selectedBudgetId);
    
    // Always update the selectedBudgetId when the budgetId prop changes
    if (budgetId !== selectedBudgetId) {
      console.log('BudgetDashboard: Updating selectedBudgetId to match prop:', budgetId);
      setSelectedBudgetId(budgetId);
      
      // Always reload budget data when budgetId changes
      if (budgetId) {
        console.log('BudgetDashboard: Loading budget data for new budgetId');
        loadBudgetData(budgetId);
      }
    }
  }, [budgetId, selectedBudgetId]);
  
  // Function to load budget data by ID
  async function loadBudgetData(budgetId: string) {
    if (!budgetId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading budget data for ID:', budgetId);
      const budgetData = await getBudgetById(budgetId);
      console.log('Loaded budget data:', budgetData);
      
      // Check if we have valid budget data
      if (budgetData && budgetData.id) {
        setBudget(budgetData);
        
        // If we successfully loaded a budget, add it to available budgets if not already there
        setAvailableBudgets(prev => {
          if (!prev.some(b => b.id === budgetData.id)) {
            return [...prev, budgetData];
          }
          // If it exists, update it
          return prev.map(b => b.id === budgetData.id ? budgetData : b);
        });
      } else {
        console.error("Invalid budget data received");
        setError("Failed to load valid budget data");
      }
    } catch (err) {
      console.error("Error loading budget data:", err);
      setError("Failed to load budget data");
    } finally {
      setLoading(false);
    }
  }

  // Handle budget selection change
  const handleBudgetChange = (newBudgetId: string) => {
    console.log('BudgetDashboard: Budget selection changed to:', newBudgetId);
    
    if (newBudgetId !== selectedBudgetId) {
      setSelectedBudgetId(newBudgetId);
      
      // Always load fresh data from the server when budget selection changes
      // This ensures we have the most up-to-date data
      loadBudgetData(newBudgetId);
    }
  }

  // Handle template selection and auto-create a budget
  const handleTemplateSelect = async (templateId: string) => {
    try {
      setLoading(true);
      setSelectedTemplate(templateId);
      
      // Find the selected template from our template libraries
      const allTemplates = [...LIFE_EVENT_TEMPLATES, ...LIFESTYLE_TEMPLATES];
      const selectedTemplateData = allTemplates.find(t => t.id === templateId);
      
      if (!selectedTemplateData) {
        console.error("Template not found:", templateId);
        setLoading(false);
        return;
      }
      
      // Show toast notification that we're creating a budget
      toast.loading("Creating budget from template...");
      
      // Prepare budget data from template
      const defaultIncome = 5000; // Default income amount
      
      // Format the categories correctly for the API - only include main categories first
      const formattedCategories: Array<{
        name: string;
        amount_allocated: number;
      }> = [];
      
      // Process main categories only
      selectedTemplateData.categories.forEach(cat => {
        // Calculate the actual amount based on percentage
        const amount = Math.round((cat.percentage / 100) * defaultIncome);
        
        // Create the main category
        const mainCategory = {
          name: cat.name,
          amount_allocated: amount,
        };
        
        formattedCategories.push(mainCategory);
      });
      
      const newBudgetData = {
        name: `${selectedTemplateData.name} Budget`,
        amount: defaultIncome,
        start_date: new Date().toISOString().split('T')[0], // Today's date
        categories: formattedCategories
      };
      
      console.log("Prepared budget data:", newBudgetData);
      
      // Create the budget using the server action
      const newBudget = await createBudget(newBudgetData);
      console.log("Created budget:", newBudget);
      
      if (newBudget && newBudget.id) {
        // Set the newly created budget as the selected budget
        setSelectedBudgetId(newBudget.id);
        
        // Fetch the complete budget data
        const budgetData = await getBudgetById(newBudget.id);
        console.log("Fetched new budget data:", budgetData);
        
        if (budgetData) {
          setBudget(budgetData);
          
          // Add to available budgets
          setAvailableBudgets(prev => {
            // Make sure we don't add duplicates
            if (prev.some(b => b.id === budgetData.id)) {
              return prev;
            }
            return [...prev, budgetData];
          });
          
          // Show success notification
          toast.success(`Budget created from template: ${selectedTemplateData.name}`);
          
          // Navigate to the Overview tab
          setTimeout(() => {
            // Find the overview tab button and click it
            const tabButtons = document.querySelectorAll('[role="tab"]');
            tabButtons.forEach((button) => {
              if (button instanceof HTMLElement && button.getAttribute('value') === 'overview') {
                button.click();
              }
            });
          }, 100);
        }
      } else {
        toast.error("Failed to create budget from template");
        console.error("Failed to create budget from template");
        setError("Failed to create budget from template");
      }
    } catch (err) {
      toast.error("Error creating budget from template");
      console.error("Error creating budget from template:", err);
      setError("Failed to create budget from template");
    } finally {
      setLoading(false);
    }
  };

  // Function to load budget data
  async function loadBudgetData(budgetId: string) {
    try {
      setLoading(true);
      const budgetData = await getBudgetById(budgetId);
      console.log('Reloaded budget data:', budgetData);
      
      if (budgetData && budgetData.id) {
        setBudget(budgetData);
        
        // Update available budgets if needed
        setAvailableBudgets(prev => {
          if (!prev.some(b => b.id === budgetData.id)) {
            return [...prev, budgetData];
          }
          return prev.map(b => b.id === budgetData.id ? budgetData : b);
        });
      }
    } catch (err) {
      console.error("Error reloading budget data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate budget metrics
  const totalAllocated = budget?.categories?.reduce(
    (sum: number, category: any) => sum + (Number(category.amount_allocated) || 0), 
    0
  ) || 0
  
  // Ensure budget income is properly parsed as a number
  const budgetIncome = budget?.income ? Number(budget.income) : 0
  
  // Log budget metrics for debugging
  useEffect(() => {
    if (budget) {
      console.log('Budget income:', budget.income, 'Parsed income:', budgetIncome);
      console.log('Total allocated:', totalAllocated);
      console.log('Categories:', budget.categories);
      
      // Log each category's allocation for debugging
      if (budget.categories) {
        budget.categories.forEach((cat: any) => {
          console.log(`Category ${cat.name}: ${cat.amount_allocated} (${typeof cat.amount_allocated})`);
        });
      }
    }
  }, [budget, totalAllocated, budgetIncome]);
  
  const remainingBudget = budgetIncome - totalAllocated
  const allocationPercentage = budgetIncome > 0 ? (totalAllocated / budgetIncome) * 100 : 0
  
  // Generate simulated spending trends data
  useEffect(() => {
    if (budget && budget.categories && budget.categories.length > 0) {
      // Simulate spending trends based on budget categories
      const trends = budget.categories.map((category: any) => {
        // Simulate actual spending as a percentage of allocated amount
        const spendingFactor = Math.random() * 0.5 + 0.7; // 70-120% of allocated amount
        const allocated = category.amount_allocated || 0;
        const spent = allocated * spendingFactor;
        const remaining = allocated - spent;
        const percentSpent = allocated > 0 ? (spent / allocated) * 100 : 0;
        
        // Determine trend direction
        const trendDirection = spendingFactor > 1 ? 'over' : 'under';
        
        return {
          id: category.id,
          name: category.name,
          allocated,
          spent,
          remaining,
          percentSpent,
          trendDirection,
          variance: spent - allocated,
          status: percentSpent > 90 ? 'critical' : percentSpent > 75 ? 'warning' : 'healthy'
        };
      });
      
      setSpendingTrends(trends);
      
      // Calculate overall budget health
      const overBudgetCategories = trends.filter(t => t.trendDirection === 'over');
      const criticalCategories = trends.filter(t => t.status === 'critical');
      
      if (criticalCategories.length > 2 || (overBudgetCategories.length / trends.length) > 0.3) {
        setBudgetHealth('critical');
      } else if (criticalCategories.length > 0 || (overBudgetCategories.length / trends.length) > 0.2) {
        setBudgetHealth('warning');
      } else {
        setBudgetHealth('healthy');
      }
    } else {
      // Set empty spending trends if no budget categories are available
      setSpendingTrends([]);
      setBudgetHealth('healthy');
      console.log('No budget categories available for spending trends');
    }
  }, [budget]);
  
  // Get top spending categories
  const topSpendingCategories = [...(spendingTrends || [])]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);
  
  // Get categories that are over budget
  const overBudgetCategories = (spendingTrends || [])
    .filter(cat => cat.trendDirection === 'over')
    .sort((a, b) => b.variance - a.variance);

  // Use categories from budget creation for visualizations
  // First check if we have budget categories, if not use the provided categories prop
  const budgetHasCategories = budget?.categories && budget.categories.length > 0
  
  // Prepare data for visualizations
  const categoryData = budgetHasCategories ?      // Use categories from the budget if available
    budget.categories.map((category: any) => {
      // Calculate percentage based on the total budget
      const percentage = budgetIncome > 0 ? (category.amount_allocated / budgetIncome) * 100 : 0;
      
      return {
        id: category.id,
        name: category.name || "Unnamed Category",
        amount: category.amount_allocated || 0,
        percentage: percentage,
        color: getCategoryColor(category.amount_allocated || 0, budgetIncome || 1),
      };
    }) : 
    // Otherwise use the provided categories prop
    categories.map((category: any) => {
      // Calculate percentage based on the total budget
      const percentage = budgetIncome > 0 ? ((category.amount || 0) / budgetIncome) * 100 : 0;
      
      return {
        id: category.id,
        name: category.name || "Unnamed Category",
        amount: category.amount || 0,
        percentage: percentage,
        color: getCategoryColor(category.amount || 0, budgetIncome || 1),
      };
    });

  // Format data for the treemap
  const treemapData = {
    categories: categoryData,
    totalBudget: budgetIncome
  };

  // Format data for the waterfall chart
  const waterfallData = spendingTrends && spendingTrends.length > 0 ? 
    spendingTrends.map((trend) => ({
      category: trend.name,
      budgeted: trend.allocated,
      actual: trend.spent,
      variance: trend.variance
    })) : 
    // Fallback to using categoryData if spendingTrends is not available
    categoryData.map((cat: { name: string; amount: number }) => ({
      category: cat.name,
      budgeted: cat.amount,
      actual: cat.amount, // Default to same as budgeted when no spending data
      variance: 0
    }));

  // Add debugging to help identify loading issues
  useEffect(() => {
    if (budget) {
      console.log('Budget loaded:', budget);
      console.log('Categories:', budget.categories?.length || 0);
      console.log('TreemapData:', treemapData);
      console.log('WaterfallData:', waterfallData);
    }
  }, [budget, treemapData, waterfallData]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading budget data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!budget) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Budget Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Budget Selected</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Select or create a budget to view allocation details and insights.
          </p>
          <Button asChild>
            <a href="/budgets/manage/create">Create Budget</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (budget.categories?.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Budget Allocation</CardTitle>
            <CardDescription>
              {budget.name} - Total: {formatCurrency(budget.income || 0)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {availableBudgets.length > 1 && (
              <Select value={selectedBudgetId} onValueChange={handleBudgetChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a budget" />
                </SelectTrigger>
                <SelectContent>
                  {availableBudgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Categories Found</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Add categories to visualize your budget allocation.
          </p>
          <Button asChild>
            <a href={`/budgets/${selectedBudgetId}`}>Manage Budget Categories</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Budget Allocation</CardTitle>
          {budget && (
            <CardDescription>
              {budget.name} - Total: {formatCurrency(Number(budget.income) || 0)}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {availableBudgets.length > 1 && (
            <Select value={selectedBudgetId} onValueChange={handleBudgetChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a budget" />
              </SelectTrigger>
              <SelectContent>
                {availableBudgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <BudgetSharingDialog budgetId={selectedBudgetId} currentMembers={currentMembers} />
          <Button variant="outline" size="sm" asChild>
            <a href={`/budgets/${selectedBudgetId}`}>
              <Target className="h-4 w-4 mr-2" />
              Manage Categories
            </a>
          </Button>
        </div>
      </CardHeader>
      
      {/* Budget Health Indicator */}
      <div className="px-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Budget Health</h3>
          <Badge 
            variant={budgetHealth === 'critical' ? 'destructive' : budgetHealth === 'warning' ? 'warning' : 'success'}
            className="flex items-center gap-1"
          >
            {budgetHealth === 'critical' ? (
              <>
                <AlertCircle className="h-3 w-3" />
                Critical
              </>
            ) : budgetHealth === 'warning' ? (
              <>
                <TrendingUp className="h-3 w-3" />
                Warning
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3" />
                Healthy
              </>
            )}
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Categories over budget: {overBudgetCategories.length}</span>
            <span>Total variance: {formatCurrency(overBudgetCategories.reduce((sum, cat) => sum + cat.variance, 0))}</span>
          </div>
        </div>
      </div>
      
      {/* Budget Progress Summary */}
      <div className="px-6 pb-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Allocated: {formatCurrency(totalAllocated)}</span>
            <span>Remaining: {formatCurrency(remainingBudget)}</span>
          </div>
          <Progress value={allocationPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {allocationPercentage.toFixed(1)}% of budget allocated
          </p>
        </div>
      </div>
      
      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="grid grid-cols-4 p-0 bg-transparent h-12 border-b">
            <TabsTrigger value="overview" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              Overview
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              Categories
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              Insights
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="px-6 pb-6">
              <InteractiveTreemap data={treemapData} />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <div className="px-6 pb-6">
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3">Category</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="text-right p-3">% of Budget</th>
                      <th className="text-right p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget?.categories?.map((category: any) => {
                      // Calculate percentage based on the total budget
                      const percentage = budgetIncome > 0 ? 
                        ((category.amount_allocated || 0) / budgetIncome) * 100 : 0;
                      
                      // Find the spending trend for this category
                      const trend = spendingTrends.find(t => t.id === category.id);
                      
                      return (
                        <tr key={category.id} className="border-b">
                          <td className="p-3">{category.name}</td>
                          <td className="text-right p-3">{formatCurrency(category.amount_allocated || 0)}</td>
                          <td className="text-right p-3">
                            {percentage.toFixed(1)}%
                          </td>
                          <td className="text-right p-3">
                            {trend && (
                              <Badge 
                                variant={trend.status === 'critical' ? 'destructive' : 
                                        trend.status === 'warning' ? 'warning' : 'outline'}
                                className="flex items-center justify-center gap-1"
                              >
                                {trend.trendDirection === 'over' ? (
                                  <>
                                    <ArrowUpRight className="h-3 w-3" />
                                    Over
                                  </>
                                ) : (
                                  <>
                                    <ArrowDownRight className="h-3 w-3" />
                                    Under
                                  </>
                                )}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    }) || (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-muted-foreground">
                          No budget categories found
                        </td>
                      </tr>
                    )}
                    <tr className="font-medium bg-muted/30">
                      <td className="p-3">Total</td>
                      <td className="text-right p-3">{formatCurrency(totalAllocated)}</td>
                      <td className="text-right p-3">{allocationPercentage.toFixed(1)}%</td>
                      <td className="text-right p-3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Spending Categories */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Spending Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {topSpendingCategories.map((category, index) => (
                        <li key={category.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs">{index + 1}</span>
                            <span>{category.name}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-medium">{formatCurrency(category.spent)}</span>
                            <span className="text-xs text-muted-foreground">
                              {category.percentSpent.toFixed(1)}% of allocated
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                {/* Categories Over Budget */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Categories Over Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overBudgetCategories.length > 0 ? (
                      <ul className="space-y-3">
                        {overBudgetCategories.slice(0, 3).map((category) => (
                          <li key={category.id} className="flex items-center justify-between">
                            <span>{category.name}</span>
                            <div className="flex flex-col items-end">
                              <span className="font-medium text-destructive">
                                +{formatCurrency(category.variance)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {((category.variance / category.allocated) * 100).toFixed(1)}% over
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[120px] text-center">
                        <div className="rounded-full bg-success/20 p-2 mb-2">
                          <TrendingDown className="h-5 w-5 text-success" />
                        </div>
                        <p className="text-sm font-medium">All categories under budget</p>
                        <p className="text-xs text-muted-foreground">Great job managing your spending!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Budget Recommendations */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Budget Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {overBudgetCategories.length > 0 ? (
                        <div className="flex items-start gap-3 p-3 border rounded-md">
                          <div className="rounded-full bg-warning/20 p-2">
                            <Info className="h-5 w-5 text-warning" />
                          </div>
                          <div>
                            <h4 className="font-medium">Adjust your {overBudgetCategories[0].name} budget</h4>
                            <p className="text-sm text-muted-foreground">
                              Consider increasing your {overBudgetCategories[0].name} budget by at least {formatCurrency(overBudgetCategories[0].variance)} to match your actual spending patterns.
                            </p>
                          </div>
                        </div>
                      ) : null}
                      
                      {remainingBudget < 0 ? (
                        <div className="flex items-start gap-3 p-3 border rounded-md">
                          <div className="rounded-full bg-destructive/20 p-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <h4 className="font-medium">Over-allocation warning</h4>
                            <p className="text-sm text-muted-foreground">
                              You've allocated {formatCurrency(Math.abs(remainingBudget))} more than your total budget. Consider reducing some category allocations.
                            </p>
                          </div>
                        </div>
                      ) : allocationPercentage < 90 ? (
                        <div className="flex items-start gap-3 p-3 border rounded-md">
                          <div className="rounded-full bg-muted p-2">
                            <Info className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium">Unallocated funds</h4>
                            <p className="text-sm text-muted-foreground">
                              You have {formatCurrency(remainingBudget)} ({(100 - allocationPercentage).toFixed(1)}%) unallocated. Consider adding more categories or increasing existing allocations.
                            </p>
                          </div>
                        </div>
                      ) : null}
                      
                      <div className="flex items-start gap-3 p-3 border rounded-md">
                        <div className="rounded-full bg-success/20 p-2">
                          <TrendingDown className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <h4 className="font-medium">Savings opportunity</h4>
                          <p className="text-sm text-muted-foreground">
                            Consider allocating at least 20% of your budget to savings and investments for long-term financial health.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="mt-0">
            <div className="px-6 pb-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Create a Budget from Template</h3>
                <p className="text-sm text-muted-foreground">Select a template to automatically create a new budget with predefined categories.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {LIFE_EVENT_TEMPLATES.map(template => (
                  <div key={template.id} className="cursor-pointer" onClick={() => {
                    console.log('Template selected:', template.id);
                    handleTemplateSelect(template.id);
                  }}>
                    <BudgetTemplateCard 
                      template={template} 
                      isSelected={selectedTemplate === template.id}
                      onSelect={() => {
                        console.log('Template card clicked:', template.id);
                        handleTemplateSelect(template.id);
                      }} 
                    />
                  </div>
                ))}
                {LIFESTYLE_TEMPLATES.map(template => (
                  <div key={template.id} className="cursor-pointer" onClick={() => {
                    console.log('Template selected:', template.id);
                    handleTemplateSelect(template.id);
                  }}>
                    <BudgetTemplateCard 
                      template={template} 
                      isSelected={selectedTemplate === template.id}
                      onSelect={() => {
                        console.log('Template card clicked:', template.id);
                        handleTemplateSelect(template.id);
                      }} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
