"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

// Types for budget recommendations
export interface BudgetCategory {
  id: string
  name: string
  recommended_amount: number
  confidence_score: number
  reasoning: string
}

export interface BudgetRecommendation {
  id: string
  user_id: string
  model_type: "traditional" | "zero-based" | "50-30-20" | "envelope"
  total_budget: number
  categories: BudgetCategory[]
  savings_target: number
  risk_level: "low" | "medium" | "high"
  adjustments: string[]
  created_at: string
}

/**
 * Analyzes user's transaction history to identify spending patterns
 */
async function analyzePastSpending(userId: string, months: number = 3) {
  try {
    const supabase = await createServerSupabaseClient()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    // Get transactions with their categories
    const { data: transactions, error } = await supabase
      .from("public.transactions")
      .select(`
        id,
        amount,
        date,
        is_income,
        category_id,
        categories:public.categories!inner(id, name, icon, color)
      `)
      .eq("user_id", userId)
      .gte("date", startDate.toISOString().split('T')[0])
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching transactions for budget analysis:", error)
      return { success: false, error: error.message, patterns: [] }
    }

    // Group transactions by category
    const categoryMap = new Map()
    
    transactions.forEach(tx => {
      if (tx.is_income) return // Skip income transactions for spending analysis
      
      const categoryId = tx.category_id
      const categoryName = tx.categories?.name || "Uncategorized"
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category_id: categoryId,
          category_name: categoryName,
          transactions: [],
          total_amount: 0,
          transaction_count: 0
        })
      }
      
      const category = categoryMap.get(categoryId)
      category.transactions.push({
        amount: Math.abs(tx.amount),
        date: tx.date
      })
      category.total_amount += Math.abs(tx.amount)
      category.transaction_count += 1
    })

    // Calculate patterns
    const patterns = []
    categoryMap.forEach(category => {
      // Calculate average amount
      const avgAmount = category.total_amount / category.transaction_count
      
      // Calculate frequency (transactions per month)
      const frequency = category.transaction_count / months
      
      // Try to detect typical day of month for recurring expenses
      let typicalDay = undefined
      if (category.transactions.length >= 2) {
        const days = category.transactions.map(t => new Date(t.date).getDate())
        const dayFrequency = {}
        
        days.forEach(day => {
          dayFrequency[day] = (dayFrequency[day] || 0) + 1
        })
        
        let maxFreq = 0
        Object.entries(dayFrequency).forEach(([day, freq]) => {
          if (Number(freq) > maxFreq) {
            maxFreq = Number(freq)
            typicalDay = Number(day)
          }
        })
        
        // Only set typical day if it occurs in at least 50% of months
        if (maxFreq < months * 0.5) {
          typicalDay = undefined
        }
      }
      
      patterns.push({
        category_id: category.category_id,
        category_name: category.category_name,
        average_amount: avgAmount,
        frequency: frequency,
        typical_day_of_month: typicalDay,
        monthly_spend: avgAmount * frequency
      })
    })

    return { success: true, patterns }
  } catch (error) {
    console.error("Error in analyzePastSpending:", error)
    return { success: false, error: error.message, patterns: [] }
  }
}

/**
 * Determines if a category is considered a "need" vs a "want"
 */
function isNeedCategory(categoryName: string) {
  const needCategories = [
    "rent", "mortgage", "housing", "utilities", "groceries", "food", "healthcare",
    "insurance", "transportation", "debt", "loan", "education", "childcare"
  ]
  
  return needCategories.some(need => 
    categoryName.toLowerCase().includes(need.toLowerCase())
  )
}

/**
 * Calculates a confidence score (0-1) for budget recommendations
 */
function calculateConfidenceScore(pattern: any) {
  let score = 0.5 // Base score

  // Higher confidence for recurring expenses
  if (pattern.typical_day_of_month !== undefined) {
    score += 0.3
  }

  // Higher confidence for consistent frequency
  if (pattern.frequency >= 0.9) { // Almost monthly
    score += 0.2
  }

  return Math.min(score, 1)
}

/**
 * Generates a human-readable explanation for a budget recommendation
 */
function generateReasoning(pattern: any, modelContext: string) {
  const monthly = pattern.monthly_spend
  const isRecurring = pattern.typical_day_of_month !== undefined

  if (isRecurring) {
    return `Regular expense occurring around day ${pattern.typical_day_of_month} of each month. Historical average: $${monthly.toFixed(2)}`
  }

  switch (modelContext) {
    case "need":
      return `Essential expense with monthly average of $${monthly.toFixed(2)}`
    case "want":
      return `Discretionary expense with monthly average of $${monthly.toFixed(2)}`
    case "zero-based":
      return `Historical monthly spending: $${monthly.toFixed(2)}`
    case "envelope":
      return `Suggested envelope amount based on ${pattern.frequency.toFixed(1)} transactions per month`
    default:
      return `Based on historical average of $${monthly.toFixed(2)} per month`
  }
}

/**
 * Generates budget recommendations based on spending history and income
 */
export async function generateBudgetRecommendation(
  monthlyIncome: number,
  modelType: "traditional" | "zero-based" | "50-30-20" | "envelope"
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }
    
    const userId = user.id
    
    // Get spending patterns
    const { success, patterns, error } = await analyzePastSpending(userId)
    
    if (!success) {
      return { success: false, error }
    }
    
    // Calculate total monthly spending
    const totalSpending = patterns.reduce((sum, p) => sum + p.monthly_spend, 0)
    
    // Calculate savings potential
    const savingsPotential = monthlyIncome - totalSpending
    const savingsTarget = Math.max(monthlyIncome * 0.2, savingsPotential) // Target at least 20% savings

    // Initialize recommendation
    const categories = []
    const adjustments = []
    let riskLevel = "medium"

    // Generate category recommendations based on model type
    switch (modelType) {
      case "50-30-20":
        // 50% needs, 30% wants, 20% savings
        const needs = patterns.filter(p => isNeedCategory(p.category_name))
        const wants = patterns.filter(p => !isNeedCategory(p.category_name))
        
        const needsBudget = monthlyIncome * 0.5
        const wantsBudget = monthlyIncome * 0.3

        // Allocate needs budget
        const totalNeedsSpending = needs.reduce((sum, p) => sum + p.monthly_spend, 0)
        needs.forEach(pattern => {
          const ratio = totalNeedsSpending > 0 ? pattern.monthly_spend / totalNeedsSpending : 0
          categories.push({
            id: pattern.category_id,
            name: pattern.category_name,
            recommended_amount: needsBudget * ratio,
            confidence_score: calculateConfidenceScore(pattern),
            reasoning: generateReasoning(pattern, "need")
          })
        })

        // Allocate wants budget
        const totalWantsSpending = wants.reduce((sum, p) => sum + p.monthly_spend, 0)
        wants.forEach(pattern => {
          const ratio = totalWantsSpending > 0 ? pattern.monthly_spend / totalWantsSpending : 0
          categories.push({
            id: pattern.category_id,
            name: pattern.category_name,
            recommended_amount: wantsBudget * ratio,
            confidence_score: calculateConfidenceScore(pattern),
            reasoning: generateReasoning(pattern, "want")
          })
        })
        break

      case "zero-based":
        // Allocate every dollar with priority on essential expenses
        let remainingBudget = monthlyIncome - savingsTarget
        const prioritizedPatterns = [...patterns].sort((a, b) => 
          (isNeedCategory(b.category_name) ? 1 : 0) - (isNeedCategory(a.category_name) ? 1 : 0)
        )

        prioritizedPatterns.forEach(pattern => {
          const monthlyAmount = pattern.monthly_spend
          const allocated = Math.min(monthlyAmount, remainingBudget)
          remainingBudget -= allocated

          categories.push({
            id: pattern.category_id,
            name: pattern.category_name,
            recommended_amount: allocated,
            confidence_score: calculateConfidenceScore(pattern),
            reasoning: generateReasoning(pattern, "zero-based")
          })
        })
        break

      case "envelope":
        // Similar to zero-based but with more emphasis on discretionary spending control
        patterns.forEach(pattern => {
          const monthlyAmount = pattern.monthly_spend
          const recommended = pattern.typical_day_of_month
            ? monthlyAmount // Keep consistent amount for recurring expenses
            : monthlyAmount * 0.9 // Reduce discretionary spending by 10%

          categories.push({
            id: pattern.category_id,
            name: pattern.category_name,
            recommended_amount: recommended,
            confidence_score: calculateConfidenceScore(pattern),
            reasoning: generateReasoning(pattern, "envelope")
          })
        })
        break

      default: // traditional
        // Base recommendations on historical spending with some optimization
        patterns.forEach(pattern => {
          const monthlyAmount = pattern.monthly_spend
          const recommended = monthlyAmount * 0.95 // Suggest 5% reduction as a starting point

          categories.push({
            id: pattern.category_id,
            name: pattern.category_name,
            recommended_amount: recommended,
            confidence_score: calculateConfidenceScore(pattern),
            reasoning: generateReasoning(pattern, "traditional")
          })
        })
    }

    // Add adjustment recommendations
    if (savingsPotential < 0) {
      riskLevel = "high"
      adjustments.push("Current spending exceeds income. Consider reducing discretionary expenses.")
    } else if (savingsPotential < monthlyIncome * 0.2) {
      riskLevel = "medium"
      adjustments.push("Savings rate below target. Look for opportunities to optimize spending.")
    } else {
      riskLevel = "low"
    }

    // Look for potential optimizations
    patterns.forEach(pattern => {
      if (pattern.monthly_spend > monthlyIncome * 0.3) {
        adjustments.push(
          `${pattern.category_name} spending is over 30% of income. Consider ways to reduce this expense.`
        )
      }
    })

    // Save recommendation to database
    const supabase = await createServerSupabaseClient()
    const recommendationId = uuidv4()
    
    const { error: saveError } = await supabase
      .from("public.budget_recommendations")
      .insert({
        id: recommendationId,
        user_id: userId,
        model_type: modelType,
        total_budget: monthlyIncome - savingsTarget,
        savings_target: savingsTarget,
        risk_level: riskLevel,
        adjustments: adjustments,
        monthly_income: monthlyIncome
      })
    
    if (saveError) {
      console.error("Error saving budget recommendation:", saveError)
      if (saveError.code === "42P01") { // Table doesn't exist
        return {
          success: true,
          recommendation: {
            id: recommendationId,
            user_id: userId,
            model_type: modelType,
            total_budget: monthlyIncome - savingsTarget,
            categories: categories,
            savings_target: savingsTarget,
            risk_level: riskLevel,
            adjustments: adjustments,
            created_at: new Date().toISOString()
          }
        }
      }
      return { success: false, error: saveError.message }
    }
    
    // Save category recommendations
    for (const category of categories) {
      const { error: categoryError } = await supabase
        .from("public.budget_recommendation_categories")
        .insert({
          id: uuidv4(),
          recommendation_id: recommendationId,
          category_id: category.id,
          recommended_amount: category.recommended_amount,
          confidence_score: category.confidence_score,
          reasoning: category.reasoning
        })
      
      if (categoryError && categoryError.code !== "42P01") {
        console.error("Error saving budget category recommendation:", categoryError)
      }
    }
    
    // Revalidate the budgets page
    revalidatePath("/budgets")
    
    return {
      success: true,
      recommendation: {
        id: recommendationId,
        user_id: userId,
        model_type: modelType,
        total_budget: monthlyIncome - savingsTarget,
        categories: categories,
        savings_target: savingsTarget,
        risk_level: riskLevel,
        adjustments: adjustments,
        created_at: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error("Error generating budget recommendation:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Gets saved budget recommendations for the current user
 */
export async function getSavedBudgetRecommendations() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }
    
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from("public.budget_recommendations")
      .select(`
        *,
        categories:public.budget_recommendation_categories(*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    
    if (error) {
      if (error.code === "42P01") { // Table doesn't exist
        return { success: true, recommendations: [] }
      }
      console.error("Error fetching budget recommendations:", error)
      return { success: false, error: error.message }
    }
    
    return { success: true, recommendations: data || [] }
  } catch (error) {
    console.error("Error in getSavedBudgetRecommendations:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
