"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/supabase/database.types"

// Get the current user ID from the session
async function getCurrentUserId() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.id) {
      // Simply return the authenticated user ID
      // The RLS policies will handle access control
      return user.id
    }
    
    // For demo purposes, use a fixed ID when no user is authenticated
    // This should only happen in development
    console.warn("No authenticated user found, using demo user ID")
    return "00000000-0000-0000-0000-000000000000"
  } catch (error) {
    console.error("Error getting current user:", error)
    throw new Error("Failed to get current user")
  }
}

export async function getIncomeSources(timestamp?: number) {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()
  
  // Log timestamp for debugging
  console.log(`Fetching income sources at timestamp ${timestamp || Date.now()}`)

  const { data, error } = await supabase
    .from("income_sources")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching income sources:", error)
    throw new Error("Failed to fetch income sources")
  }

  return data || []
}

export async function getIncomeSourceById(id: string, timestamp?: number) {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createServerSupabaseClient()

    // Using timestamp or current time for cache-busting if needed
    const cacheParam = timestamp || Date.now()
    console.log(`Fetching income source ${id} at timestamp ${cacheParam}`)

    // First try to get the income source with exact user match
    const { data: exactMatchSource, error: exactMatchError } = await supabase
      .from("income_sources")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle()

    if (exactMatchError) {
      console.error("Error fetching income source with exact match:", exactMatchError)
      throw new Error("Failed to fetch income source")
    }

    // If found with exact match, return it
    if (exactMatchSource) {
      console.log("Income source found with exact user match:", exactMatchSource)
      return exactMatchSource
    }

    // If not found with exact match, try to get demo sources (for demo user)
    const demoUserId = "00000000-0000-0000-0000-000000000000"
    
    const { data: demoSource, error: demoError } = await supabase
      .from("income_sources")
      .select("*")
      .eq("id", id)
      .eq("user_id", demoUserId)
      .maybeSingle()

    if (demoError) {
      console.error("Error fetching demo income source:", demoError)
      throw new Error("Failed to fetch income source")
    }

    // If found as demo source, return it
    if (demoSource) {
      console.log("Income source found as demo source:", demoSource)
      return demoSource
    }

    // Not found at all
    console.error("Income source not found with ID:", id)
    return null
  } catch (error) {
    console.error("Error in getIncomeSourceById:", error)
    throw error
  }
}

export async function createIncomeSource(formData: FormData) {
  try {
    const userId = await getCurrentUserId()
    console.log("Creating income source for user:", userId)
    
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      console.error("Failed to create Supabase client")
      throw new Error("Database connection failed")
    }

    // Validate required fields
    const name = formData.get("name") as string
    if (!name) {
      throw new Error("Name is required")
    }

    const amountStr = formData.get("amount") as string
    const amount = Number(amountStr)
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Amount must be a positive number")
    }

    const type = formData.get("type") as string
    if (!type) {
      throw new Error("Type is required")
    }

    const frequency = formData.get("frequency") as string
    if (!frequency) {
      throw new Error("Frequency is required")
    }
    
    // Check against the allowed frequencies from the database constraint
    const allowedFrequencies = ['monthly', 'weekly', 'bi-weekly', 'annually', 'one-time']
    if (!allowedFrequencies.includes(frequency)) {
      console.error(`Invalid frequency: ${frequency}. Allowed frequencies are: ${allowedFrequencies.join(', ')}`)
      throw new Error(`Invalid frequency. Allowed frequencies are: ${allowedFrequencies.join(', ')}`)
    }

    // Format dates if provided
    const startDate = formData.get("start_date") as string
    const endDate = formData.get("end_date") as string
    const formattedStartDate = startDate ? new Date(startDate).toISOString().split('T')[0] : null
    const formattedEndDate = endDate ? new Date(endDate).toISOString().split('T')[0] : null

    // Only include fields that exist in the schema
    const notes = formData.get("notes") as string || null
    const currency = (formData.get("currency") as string) || "USD"

    // Create income source data object with only fields that exist in the database schema
    const incomeData = {
      user_id: userId,
      name,
      type,
      amount,
      frequency,
      currency,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      notes,
      is_active: true
    }

    console.log("Income source data to insert:", incomeData)

    // Insert the income source
    const { data, error } = await supabase
      .from("income_sources")
      .insert(incomeData)
      .select()

    if (error) {
      console.error("Error creating income source:", error)
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      throw new Error(`Failed to create income source: ${error.message}`)
    }

    console.log("Income source created successfully:", data)
    revalidatePath("/income")
    return { id: data[0].id }
  } catch (error) {
    console.error("Unexpected error in createIncomeSource:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to create income source: ${error.message}`)
    }
    throw new Error("Failed to create income source")
  }
}

export async function updateIncomeSource(id: string, formData: FormData) {
  console.log("updateIncomeSource called with ID:", id);
  console.log("Form data received:", Object.fromEntries(formData.entries()));
  
  try {
    const userId = await getCurrentUserId()
    console.log("Current user ID:", userId);
    
    const supabase = await createServerSupabaseClient()

    // Validate inputs before starting database operations
    const name = formData.get("name") as string
    if (!name || name.trim() === "") {
      throw new Error("Name is required")
    }

    const type = formData.get("type") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    if (isNaN(amount) || amount < 0) {
      throw new Error("Amount must be a valid positive number")
    }

    const frequency = formData.get("frequency") as string
    const currency = (formData.get("currency") as string) || "USD"
    const startDate = (formData.get("start_date") as string) || null
    const endDate = (formData.get("end_date") as string) || null
    const notes = (formData.get("notes") as string) || null
    const isTaxable = formData.get("is_taxable") === "true"

    console.log("Parsed form data:", {
      name, type, amount, frequency, currency, startDate, endDate, notes, isTaxable
    });

    // Validate type against allowed values
    const allowedTypes = ['salary', 'bonus', 'freelance', 'rental', 'investment', 'passive', 'other']
    if (!allowedTypes.includes(type)) {
      throw new Error(`Invalid income type. Allowed types are: ${allowedTypes.join(', ')}`)
    }

    // Validate frequency against allowed values
    const allowedFrequencies = ['monthly', 'weekly', 'bi-weekly', 'annually', 'one-time']
    if (!allowedFrequencies.includes(frequency)) {
      throw new Error(`Invalid frequency. Allowed frequencies are: ${allowedFrequencies.join(', ')}`)
    }
    
    // First, check if the income source exists
    console.log("Fetching existing income source with ID:", id);
    const { data: existingSources, error: fetchError } = await supabase
      .from("income_sources")
      .select("*")
      .eq("id", id)
      
    if (fetchError) {
      console.error("Error fetching income source:", fetchError)
      throw new Error("Database error while checking income source")
    }
    
    // If the source doesn't exist, create a new one
    if (!existingSources || existingSources.length === 0) {
      console.log("Income source not found, creating a new one:", id)
      
      // Create a new income source object - only include fields known to exist in the schema
      const newIncomeSource = {
        id,
        user_id: userId,
        name,
        type,
        amount,
        frequency,
        currency,
        start_date: startDate,
        end_date: endDate,
        notes,
        is_active: true,
        is_taxable: isTaxable
        // No updated_at field
      }
      
      console.log("Creating new income source:", newIncomeSource);
      
      // Insert the new income source using standard Supabase insert
      const { data: insertedData, error: insertError } = await supabase
        .from("income_sources")
        .insert(newIncomeSource)
        .select()
      
      if (insertError) {
        console.error("Error creating income source:", insertError)
        throw new Error("Failed to create income source: " + insertError.message)
      }
      
      // Force revalidation of relevant paths
      revalidatePath("/income")
      revalidatePath(`/income/sources`)
      revalidatePath(`/income/sources/${id}`)
      
      return { 
        id, 
        created: true,
        source: insertedData?.[0] || newIncomeSource
      }
    }
    
    // Get the existing source
    const existingSource = existingSources[0]
    console.log("Existing income source found:", existingSource);
    
    const originalUserId = existingSource.user_id
    
    // Check if user has permission to edit
    if (originalUserId !== userId) {
      const demoUserId = "00000000-0000-0000-0000-000000000000"
      
      if (originalUserId !== demoUserId) {
        console.error("Access denied for income source:", id, "Current user:", userId, "Source owner:", originalUserId)
        throw new Error("Access denied for this income source")
      }
    }
    
    // Let's try a completely different approach - create a new record and delete the old one
    console.log("Using create-and-replace approach to update income source with amount:", amount);
    
    try {
      // Create a new income source with the updated values
      const newSource = {
        id: uuidv4(), // Generate a new ID
        user_id: userId,
        name,
        type,
        amount,
        frequency,
        currency,
        is_taxable: isTaxable,
        start_date: startDate,
        end_date: endDate,
        notes,
        is_active: existingSource.is_active
      };
      
      console.log("Creating new income source with updated values:", newSource);
      
      // Insert the new record
      const { data: insertedData, error: insertError } = await supabase
        .from("income_sources")
        .insert(newSource)
        .select();
      
      if (insertError) {
        console.error("Error creating new income source:", insertError);
        throw new Error(`Failed to create new income source: ${insertError.message}`);
      }
      
      console.log("Successfully created new income source:", insertedData);
      
      // Delete the old record
      const { error: deleteError } = await supabase
        .from("income_sources")
        .delete()
        .eq("id", id);
      
      if (deleteError) {
        console.error("Error deleting old income source:", deleteError);
        // Continue anyway since we have the new record
      } else {
        console.log("Successfully deleted old income source");
      }
      
      // Return the ID of the new record for redirects
      id = newSource.id;
    } catch (replaceError) {
      console.error("Error in create-and-replace approach:", replaceError);
      throw new Error(`Failed to update income source: ${replaceError instanceof Error ? replaceError.message : 'Unknown error'}`);
    }
    
    // Fetch the updated income source
    const { data: initialUpdatedSource, error: fetchUpdatedError } = await supabase
      .from("income_sources")
      .select("*")
      .eq("id", id)
      .single();
    
    if (fetchUpdatedError) {
      console.error("Error fetching updated source:", fetchUpdatedError);
      throw new Error("Failed to retrieve the updated income source")
    }
    
    // Use a mutable variable to store the final result
    let finalSource = initialUpdatedSource;
    
    console.log("Successfully updated income source:", finalSource);
    
    // Force revalidation of all relevant paths
    revalidatePath("/income", "layout")
    revalidatePath("/income/sources", "layout")
    revalidatePath(`/income/sources/${id}`, "layout")
    revalidatePath(`/income/sources/${id}/edit`, "layout")
    revalidatePath("/", "layout") // Revalidate root for any dashboard components
    
    // Add a small delay to ensure the database has time to update
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Fetch the updated income source again after the delay
    const { data: finalUpdatedSource, error: finalFetchError } = await supabase
      .from("income_sources")
      .select("*")
      .eq("id", id)
      .single();
    
    if (finalFetchError) {
      console.error("Error fetching final updated source:", finalFetchError);
      // Continue with the previous result
    } else if (finalUpdatedSource) {
      console.log("Final updated income source:", finalUpdatedSource);
      finalSource = finalUpdatedSource;
    }
    
    return { 
      id, 
      success: true,
      source: finalSource
    }
  } catch (error) {
    console.error("Unexpected error in updateIncomeSource:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to update income source: ${error.message}`)
    }
    throw new Error("Failed to update income source")
  }
}

export async function deleteIncomeSource(id: string) {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from("income_sources").delete().eq("id", id).eq("user_id", userId)

  if (error) {
    console.error("Error deleting income source:", error)
    throw new Error("Failed to delete income source")
  }

  revalidatePath("/income")
  return { success: true }
}

export async function calculateIncomeDiversification() {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()

  const { data: sources, error } = await supabase.from("income_sources").select("*").eq("user_id", userId)

  if (error) {
    console.error("Error fetching income sources:", error)
    throw new Error("Failed to calculate income diversification")
  }

  if (!sources || sources.length === 0) {
    return {
      overall_score: 0,
      source_count: 0,
      primary_dependency: 0,
      stability_score: 0,
      growth_potential: 0,
      breakdown: [],
    }
  }

  // Calculate total income
  const totalIncome = sources.reduce((sum, source) => {
    // Normalize to monthly amount
    let monthlyAmount = source.amount
    switch (source.frequency) {
      case "annually":
        monthlyAmount /= 12
        break
      case "bi-weekly":
        monthlyAmount *= 2.17 // Average number of bi-weekly periods in a month
        break
      case "weekly":
        monthlyAmount *= 4.33 // Average number of weeks in a month
        break
      case "one-time":
        monthlyAmount /= 12 // Spread one-time income over a year
        break
      default:
        // Default to monthly
        break
    }
    return sum + monthlyAmount
  }, 0)

  // If total income is zero, return zero scores
  if (totalIncome <= 0) {
    return {
      overall_score: 0,
      source_count: sources.length,
      primary_dependency: 0,
      stability_score: 0,
      growth_potential: 0,
      breakdown: [],
    }
  }

  // Calculate breakdown and scores
  const breakdown = sources.map((source) => {
    // Normalize to monthly amount
    let monthlyAmount = source.amount
    switch (source.frequency) {
      case "annually":
        monthlyAmount /= 12
        break
      case "bi-weekly":
        monthlyAmount *= 2.17
        break
      case "weekly":
        monthlyAmount *= 4.33
        break
      case "one-time":
        monthlyAmount /= 12 // Spread one-time income over a year
        break
      default:
        // Default to monthly
        break
    }

    const percentage = (monthlyAmount / totalIncome) * 100

    // Calculate score contribution based on source type and percentage
    let scoreContribution = 0

    // Passive income gets higher score
    if (source.type === "passive" || source.type === "investment") {
      scoreContribution = percentage * 1.5
    }
    // Primary income gets lower score if it's too dominant
    else if (source.type === "primary" && percentage > 70) {
      scoreContribution = percentage * 0.5
    }
    // Side hustles get bonus points
    else if (source.type === "side-hustle") {
      scoreContribution = percentage * 1.2
    } else {
      scoreContribution = percentage
    }

    return {
      source_id: source.id,
      source_name: source.name,
      percentage,
      score_contribution: scoreContribution,
    }
  })

  // Sort by percentage descending
  breakdown.sort((a, b) => b.percentage - a.percentage)

  // Calculate primary dependency (percentage of largest income source)
  const primaryDependency = breakdown.length > 0 ? breakdown[0].percentage : 0

  // Calculate stability score based on income types
  const stabilityScore =
    sources.reduce((score, source) => {
      // Stable income types get higher scores
      if (source.type === "primary" || source.type === "passive") {
        return score + 10
      } else if (source.type === "investment") {
        return score + 5
      } else {
        return score + 3
      }
    }, 0) / sources.length

  // Calculate growth potential based on income types
  const growthPotential =
    sources.reduce((score, source) => {
      // Growth-oriented income types get higher scores
      if (source.type === "side-hustle" || source.type === "investment") {
        return score + 10
      } else if (source.type === "passive") {
        return score + 8
      } else if (source.type === "secondary") {
        return score + 6
      } else {
        return score + 3
      }
    }, 0) / sources.length

  // Calculate overall score (0-100)
  // Ensure at least some points for having income sources
  const sourceCountScore = Math.min(sources.length * 5, 25)
  
  // Adjust primary dependency score to be more generous
  // If primary dependency is less than 50%, give full points
  const primaryDependencyScore = primaryDependency < 50 
    ? 25 
    : Math.max(25 - ((primaryDependency - 50) / 2), 0)
  
  const stabilityScoreNormalized = Math.min(stabilityScore * 2.5, 25)
  const growthPotentialNormalized = Math.min(growthPotential * 2.5, 25)

  // Ensure minimum score of 10 if there are any income sources
  const overallScore = Math.max(
    sourceCountScore + primaryDependencyScore + stabilityScoreNormalized + growthPotentialNormalized,
    sources.length > 0 ? 10 : 0
  )

  console.log("Diversification calculation:", {
    sourceCountScore,
    primaryDependencyScore,
    stabilityScoreNormalized,
    growthPotentialNormalized,
    overallScore
  })

  return {
    overall_score: Math.round(overallScore),
    source_count: sources.length,
    primary_dependency: Math.round(primaryDependency),
    stability_score: Math.round((stabilityScoreNormalized / 25) * 100),
    growth_potential: Math.round((growthPotentialNormalized / 25) * 100),
    breakdown,
  }
}
