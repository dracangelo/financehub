"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/server"
import { revalidatePath } from "next/cache"

// Interface for merchant intelligence data
export interface MerchantIntelligence {
  id: string
  user_id: string
  merchant_name: string
  category_id?: string
  visit_count: number
  average_spend: number
  last_visit_date: string
  insights?: any
  created_at: string
}

// Get merchant intelligence for all merchants
export async function getMerchantIntelligence() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    const { data, error } = await supabase
      .from("merchant_intelligence")
      .select("*")
      .eq("user_id", user.id)
      .order("visit_count", { ascending: false })

    if (error) {
      console.error("Error fetching merchant intelligence:", error)
      throw new Error("Failed to fetch merchant intelligence")
    }

    return data || []
  } catch (error) {
    console.error("Error in getMerchantIntelligence:", error)
    throw error
  }
}

// Get merchant intelligence for a specific merchant
export async function getMerchantIntelligenceByName(merchantName: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    const { data, error } = await supabase
      .from("merchant_intelligence")
      .select("*")
      .eq("user_id", user.id)
      .eq("merchant_name", merchantName)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned"
      console.error("Error fetching merchant intelligence:", error)
      throw new Error("Failed to fetch merchant intelligence")
    }

    return data || null
  } catch (error) {
    console.error("Error in getMerchantIntelligenceByName:", error)
    throw error
  }
}

// Update merchant intelligence with new transaction data
export async function updateMerchantIntelligence(
  merchantName: string,
  amount: number,
  categoryId?: string
) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    const today = new Date().toISOString().split('T')[0]

    // Check if merchant already exists
    const { data: existingMerchant } = await supabase
      .from("merchant_intelligence")
      .select("*")
      .eq("user_id", user.id)
      .eq("merchant_name", merchantName)
      .single()

    let result

    if (existingMerchant) {
      // Update existing merchant
      const visitCount = existingMerchant.visit_count || 1
      const newVisitCount = visitCount + 1
      const newAverageSpend = (existingMerchant.average_spend * visitCount + amount) / newVisitCount

      const { data, error } = await supabase
        .from("merchant_intelligence")
        .update({
          category_id: categoryId || existingMerchant.category_id,
          visit_count: newVisitCount,
          average_spend: newAverageSpend,
          last_visit_date: today
        })
        .eq("id", existingMerchant.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating merchant intelligence:", error)
        throw new Error("Failed to update merchant intelligence")
      }

      result = data
    } else {
      // Create new merchant
      const { data, error } = await supabase
        .from("merchant_intelligence")
        .insert({
          user_id: user.id,
          merchant_name: merchantName,
          category_id: categoryId,
          visit_count: 1,
          average_spend: amount,
          last_visit_date: today
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating merchant intelligence:", error)
        throw new Error("Failed to create merchant intelligence")
      }

      result = data
    }

    return result
  } catch (error) {
    console.error("Error in updateMerchantIntelligence:", error)
    throw error
  }
}

// Generate insights for a merchant
export async function generateMerchantInsights(merchantName: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // Get all expenses for this merchant
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("merchant_name", merchantName)
      .order("spent_at", { ascending: false })

    if (expensesError) {
      console.error("Error fetching expenses for merchant:", expensesError)
      throw new Error("Failed to fetch expenses for merchant")
    }

    if (!expenses || expenses.length === 0) {
      return { message: "No expenses found for this merchant" }
    }

    // Calculate insights
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const avgAmount = totalSpent / expenses.length
    
    // Analyze time patterns
    const timeOfDayCounts = expenses.reduce((counts, expense) => {
      const timeOfDay = expense.time_of_day
      counts[timeOfDay] = (counts[timeOfDay] || 0) + 1
      return counts
    }, {})
    
    const mostFrequentTimeOfDay = Object.entries(timeOfDayCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])[0]

    // Analyze frequency
    const dateVisits = expenses.map(expense => {
      const date = new Date(expense.spent_at)
      return date.toISOString().split('T')[0]
    })
    
    const uniqueDates = [...new Set(dateVisits)]
    const daysBetweenVisits = []
    
    if (uniqueDates.length > 1) {
      uniqueDates.sort()
      for (let i = 1; i < uniqueDates.length; i++) {
        const date1 = new Date(uniqueDates[i-1])
        const date2 = new Date(uniqueDates[i])
        const diffTime = Math.abs(date2.getTime() - date1.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        daysBetweenVisits.push(diffDays)
      }
    }
    
    const avgDaysBetweenVisits = daysBetweenVisits.length > 0 
      ? daysBetweenVisits.reduce((sum, days) => sum + days, 0) / daysBetweenVisits.length 
      : null
    
    // Determine if this might be a recurring expense
    const isRecurringCandidate = avgDaysBetweenVisits !== null && 
      daysBetweenVisits.length >= 2 &&
      Math.max(...daysBetweenVisits) - Math.min(...daysBetweenVisits) < 5 // Low variance in days between visits
    
    // Generate frequency description
    let frequencyDescription = "irregular"
    if (isRecurringCandidate) {
      if (avgDaysBetweenVisits >= 25 && avgDaysBetweenVisits <= 35) {
        frequencyDescription = "monthly"
      } else if (avgDaysBetweenVisits >= 6 && avgDaysBetweenVisits <= 8) {
        frequencyDescription = "weekly"
      } else if (avgDaysBetweenVisits >= 13 && avgDaysBetweenVisits <= 16) {
        frequencyDescription = "bi-weekly"
      } else if (avgDaysBetweenVisits >= 85 && avgDaysBetweenVisits <= 95) {
        frequencyDescription = "quarterly"
      }
    }
    
    // Create insights object
    const insights = {
      total_visits: expenses.length,
      total_spent: totalSpent,
      average_amount: avgAmount,
      most_frequent_time: mostFrequentTimeOfDay,
      visit_frequency: frequencyDescription,
      avg_days_between_visits: avgDaysBetweenVisits,
      is_recurring_candidate: isRecurringCandidate,
      last_visit_date: expenses[0].spent_at
    }
    
    // Update merchant intelligence with insights
    const { data: merchantData, error: merchantError } = await supabase
      .from("merchant_intelligence")
      .select("id")
      .eq("user_id", user.id)
      .eq("merchant_name", merchantName)
      .single()
      
    if (merchantError && merchantError.code !== "PGRST116") {
      console.error("Error fetching merchant intelligence:", merchantError)
      throw new Error("Failed to fetch merchant intelligence")
    }
    
    if (merchantData) {
      // Update existing merchant with insights
      await supabase
        .from("merchant_intelligence")
        .update({
          insights: insights
        })
        .eq("id", merchantData.id)
    } else {
      // Create new merchant intelligence with insights
      await supabase
        .from("merchant_intelligence")
        .insert({
          user_id: user.id,
          merchant_name: merchantName,
          average_spend: avgAmount,
          visit_count: expenses.length,
          last_visit_date: expenses[0].spent_at,
          insights: insights
        })
    }
    
    return insights
  } catch (error) {
    console.error("Error in generateMerchantInsights:", error)
    throw error
  }
}

// Get top merchants by spending
export async function getTopMerchantsBySpending(limit: number = 5) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    const { data, error } = await supabase
      .from("merchant_intelligence")
      .select("*")
      .eq("user_id", user.id)
      .order("average_spend", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching top merchants:", error)
      throw new Error("Failed to fetch top merchants")
    }

    return data || []
  } catch (error) {
    console.error("Error in getTopMerchantsBySpending:", error)
    throw error
  }
}

// Get merchant spending frequency network data
export async function getMerchantFrequencyNetwork() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // Get all merchants with intelligence data
    const { data: merchants, error: merchantsError } = await supabase
      .from("merchant_intelligence")
      .select("*")
      .eq("user_id", user.id)
      .order("visit_count", { ascending: false })

    if (merchantsError) {
      console.error("Error fetching merchants:", merchantsError)
      throw new Error("Failed to fetch merchants")
    }

    if (!merchants || merchants.length === 0) {
      return { nodes: [], links: [] }
    }

    // Get all expenses to analyze co-occurrence patterns
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("id, merchant_name, spent_at")
      .eq("user_id", user.id)
      .order("spent_at", { ascending: false })

    if (expensesError) {
      console.error("Error fetching expenses:", expensesError)
      throw new Error("Failed to fetch expenses")
    }

    // Group expenses by date to find merchants visited on the same day
    const expensesByDate = expenses.reduce((groups, expense) => {
      const date = new Date(expense.spent_at).toISOString().split('T')[0]
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(expense.merchant_name)
      return groups
    }, {})

    // Build co-occurrence matrix
    const coOccurrenceMap = {}
    
    Object.values(expensesByDate).forEach(merchantsOnDay => {
      // Only consider days with multiple merchants
      if (merchantsOnDay.length > 1) {
        for (let i = 0; i < merchantsOnDay.length; i++) {
          for (let j = i + 1; j < merchantsOnDay.length; j++) {
            const merchant1 = merchantsOnDay[i]
            const merchant2 = merchantsOnDay[j]
            
            if (merchant1 && merchant2 && merchant1 !== merchant2) {
              const key = [merchant1, merchant2].sort().join('__')
              coOccurrenceMap[key] = (coOccurrenceMap[key] || 0) + 1
            }
          }
        }
      }
    })

    // Build network graph data
    const nodes = merchants.map(merchant => ({
      id: merchant.merchant_name,
      value: merchant.visit_count,
      averageSpend: merchant.average_spend
    }))

    const links = Object.entries(coOccurrenceMap)
      .filter(([_, value]) => value > 1) // Only include links with multiple co-occurrences
      .map(([key, value]) => {
        const [source, target] = key.split('__')
        return {
          source,
          target,
          value
        }
      })

    return {
      nodes,
      links
    }
  } catch (error) {
    console.error("Error in getMerchantFrequencyNetwork:", error)
    throw error
  }
}
