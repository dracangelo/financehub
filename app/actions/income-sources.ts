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
      // Check if this user exists in our users table
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single()
      
      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "Results contain 0 rows" - that's expected if user doesn't exist
        console.error("Error checking for existing user:", checkError)
      }
      
      if (existingUser) {
        return user.id
      }
      
      // Try to create a user with minimal fields
      try {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({ id: user.id, email: user.email || "user@example.com" })
          .select("id")
          .single()
        
        if (insertError) {
          console.error("Error creating user with email:", insertError)
          // Try with just ID as a last resort
          const { data: minimalUser, error: minimalError } = await supabase
            .from("users")
            .insert({ id: user.id })
            .select("id")
            .single()
          
          if (minimalError) {
            console.error("Error creating user with just ID:", minimalError)
            throw new Error("Failed to create user record")
          }
          
          return minimalUser.id
        }
        
        return newUser.id
      } catch (insertError) {
        console.error("Error creating user:", insertError)
        throw new Error("Failed to create user record")
      }
    }
    
    // For demo purposes, use a fixed ID
    const demoUserId = "00000000-0000-0000-0000-000000000000"
    
    // Check if demo user exists
    const { data: existingDemoUser, error: checkDemoError } = await supabase
      .from("users")
      .select("id")
      .eq("id", demoUserId)
      .single()
    
    if (checkDemoError && checkDemoError.code !== "PGRST116") {
      console.error("Error checking for demo user:", checkDemoError)
    }
    
    if (existingDemoUser) {
      return demoUserId
    }
    
    // Create demo user with minimal fields
    try {
      const { data: newDemoUser, error: demoError } = await supabase
        .from("users")
        .insert({ id: demoUserId, email: "demo@example.com" })
        .select("id")
        .single()
      
      if (demoError) {
        console.error("Error creating demo user:", demoError)
        // Try with just ID as a last resort
        const { data: minimalDemoUser, error: minimalDemoError } = await supabase
          .from("users")
          .insert({ id: demoUserId })
          .select("id")
          .single()
        
        if (minimalDemoError) {
          console.error("Error creating demo user with just ID:", minimalDemoError)
          throw new Error("Failed to create demo user record")
        }
        
        return minimalDemoUser.id
      }
      
      return newDemoUser.id
    } catch (demoError) {
      console.error("Error creating demo user:", demoError)
      throw new Error("Failed to create demo user record")
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    throw new Error("Failed to get or create user")
  }
}

export async function getIncomeSources() {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()

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

export async function getIncomeSourceById(id: string) {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()

  // First, try to find the income source by ID without restricting by user_id
  const { data, error } = await supabase
    .from("income_sources")
    .select("*")
    .eq("id", id)
    
  if (error) {
    console.error("Error fetching income source:", error)
    throw new Error("Failed to fetch income source")
  }
  
  // If no data was found, return null
  if (!data || data.length === 0) {
    console.error("Income source not found:", id)
    return null
  }
  
  const incomeSource = data[0]
  
  // Check if the current user owns this income source
  if (incomeSource.user_id !== userId) {
    // For demo purposes, also check if it belongs to the demo user
    const demoUserId = "00000000-0000-0000-0000-000000000000"
    
    if (incomeSource.user_id !== demoUserId) {
      console.warn("User attempted to access income source they don't own:", id)
      // For security, don't reveal that the resource exists but isn't accessible
      return null
    }
    
    // If demo source, allow access
    console.log("Allowing access to demo income source:", id)
  }

  return incomeSource
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
  try {
    const userId = await getCurrentUserId()
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

    // Validate type against allowed values
    const allowedTypes = ['salary', 'bonus', 'freelance', 'rental', 'investment', 'passive', 'other']
    if (!allowedTypes.includes(type)) {
      throw new Error(`Invalid income type. Allowed types are: ${allowedTypes.join(', ')}`)
    }

    // Validate frequency against allowed values
    const allowedFrequencies = ['monthly', 'weekly', 'bi-weekly', 'annually', 'quarterly', 'daily', 'one-time']
    if (!allowedFrequencies.includes(frequency)) {
      throw new Error(`Invalid frequency. Allowed frequencies are: ${allowedFrequencies.join(', ')}`)
    }
    
    // First, check if the income source exists
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
      
      // Create a standard update payload
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
        is_taxable: isTaxable
      }
      
      // First try a regular insert
      const { error: insertError } = await supabase
        .from("income_sources")
        .insert(newIncomeSource)
      
      if (insertError) {
        console.error("Error creating income source:", insertError)
        
        // If regular insert fails, try with SQL
        const sqlQuery = `
          INSERT INTO income_sources (
            id, user_id, name, type, amount, frequency, currency, 
            start_date, end_date, notes, is_taxable
          ) VALUES (
            '${id}', 
            '${userId}', 
            '${name.replace(/'/g, "''")}', 
            '${type}', 
            ${amount}, 
            '${frequency}', 
            '${currency}', 
            ${startDate ? `'${startDate}'` : 'NULL'}, 
            ${endDate ? `'${endDate}'` : 'NULL'}, 
            ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
            ${isTaxable}
          )
        `
        
        try {
          const { error: sqlError } = await supabase.rpc('run_sql', { sql: sqlQuery })
          
          if (sqlError) {
            console.error("SQL insertion also failed:", sqlError)
            throw new Error("Failed to create income source after multiple attempts")
          }
        } catch (e) {
          console.error("Exception in SQL insert:", e)
          throw new Error("Failed to create income source")
        }
      }
      
      revalidatePath("/income")
      revalidatePath(`/income/sources`)
      revalidatePath(`/income/sources/${id}`)
      
      return { 
        id, 
        created: true,
        name,
        type,
        amount,
        currency,
        frequency 
      }
    }
    
    // Get the existing source
    const existingSource = existingSources[0]
    const originalUserId = existingSource.user_id
    
    // Check if user has permission to edit
    if (originalUserId !== userId) {
      const demoUserId = "00000000-0000-0000-0000-000000000000"
      
      if (originalUserId !== demoUserId) {
        console.error("Access denied for income source:", id)
        throw new Error("Access denied for this income source")
      }
    }
    
    // Standard update payload
    const updatePayload = {
      name,
      type,
      amount,
      frequency,
      currency,
      start_date: startDate,
      end_date: endDate,
      notes,
      is_taxable: isTaxable
    }
    
    // Try a standard update first
    const { error: updateError } = await supabase
      .from("income_sources")
      .update(updatePayload)
      .eq("id", id)
    
    if (updateError) {
      console.error("Error updating with standard method:", updateError)
      
      // Fall back to SQL update if standard update fails
      const sqlQuery = `
        UPDATE income_sources 
        SET 
          name = '${name.replace(/'/g, "''")}', 
          type = '${type}', 
          amount = ${amount}, 
          frequency = '${frequency}', 
          currency = '${currency}', 
          start_date = ${startDate ? `'${startDate}'` : 'NULL'}, 
          end_date = ${endDate ? `'${endDate}'` : 'NULL'}, 
          notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
          is_taxable = ${isTaxable}
        WHERE id = '${id}'
      `
      
      try {
        const { error: sqlError } = await supabase.rpc('run_sql', { sql: sqlQuery })
        
        if (sqlError) {
          console.error("SQL update also failed:", sqlError)
          
          // Try individual field updates as last resort
          console.log("Trying individual field updates")
          const updatePromises = [
            supabase.from("income_sources").update({ name }).eq("id", id),
            supabase.from("income_sources").update({ type }).eq("id", id),
            supabase.from("income_sources").update({ amount }).eq("id", id),
            supabase.from("income_sources").update({ frequency }).eq("id", id),
            supabase.from("income_sources").update({ currency }).eq("id", id),
            supabase.from("income_sources").update({ is_taxable: isTaxable }).eq("id", id)
          ]
          
          if (startDate) updatePromises.push(supabase.from("income_sources").update({ start_date: startDate }).eq("id", id))
          if (endDate) updatePromises.push(supabase.from("income_sources").update({ end_date: endDate }).eq("id", id))
          if (notes) updatePromises.push(supabase.from("income_sources").update({ notes }).eq("id", id))
          
          const results = await Promise.allSettled(updatePromises)
          const failedUpdates = results.filter(r => r.status === 'rejected')
          
          if (failedUpdates.length > 0) {
            console.error(`${failedUpdates.length} field updates failed`)
            throw new Error("Failed to update all fields of income source")
          }
        }
      } catch (e) {
        console.error("Exception in fallback update methods:", e)
        throw new Error("Failed to update income source")
      }
    }
    
    console.log("Successfully updated income source:", id)
    
    // Get the updated income source for the response
    const { data: updatedSource } = await supabase
      .from("income_sources")
      .select("*")
      .eq("id", id)
      .single()
    
    revalidatePath("/income")
    revalidatePath(`/income/sources`)
    revalidatePath(`/income/sources/${id}`)
    
    return { 
      id, 
      success: true,
      source: updatedSource || {
        name,
        type,
        amount,
        frequency,
        currency,
        start_date: startDate,
        end_date: endDate,
        is_taxable: isTaxable
      }
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
      case "quarterly":
        monthlyAmount /= 3
        break
      case "bi-weekly":
        monthlyAmount *= 2.17 // Average number of bi-weekly periods in a month
        break
      case "weekly":
        monthlyAmount *= 4.33 // Average number of weeks in a month
        break
      case "daily":
        monthlyAmount *= 30.42 // Average number of days in a month
        break
    }
    return sum + monthlyAmount
  }, 0)

  // Calculate breakdown and scores
  const breakdown = sources.map((source) => {
    // Normalize to monthly amount
    let monthlyAmount = source.amount
    switch (source.frequency) {
      case "annually":
        monthlyAmount /= 12
        break
      case "quarterly":
        monthlyAmount /= 3
        break
      case "bi-weekly":
        monthlyAmount *= 2.17
        break
      case "weekly":
        monthlyAmount *= 4.33
        break
      case "daily":
        monthlyAmount *= 30.42
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
  const sourceCountScore = Math.min(sources.length * 5, 25)
  const primaryDependencyScore = Math.max(25 - primaryDependency / 4, 0)
  const stabilityScoreNormalized = Math.min(stabilityScore * 2.5, 25)
  const growthPotentialNormalized = Math.min(growthPotential * 2.5, 25)

  const overallScore = sourceCountScore + primaryDependencyScore + stabilityScoreNormalized + growthPotentialNormalized

  return {
    overall_score: Math.round(overallScore),
    source_count: sources.length,
    primary_dependency: Math.round(primaryDependency),
    stability_score: Math.round((stabilityScoreNormalized / 25) * 100),
    growth_potential: Math.round((growthPotentialNormalized / 25) * 100),
    breakdown,
  }
}
