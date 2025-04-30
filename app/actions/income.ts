"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"

// Get the current user ID from the session
async function getCurrentUserId() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      throw new Error("No authenticated user found")
    }
    
    return user.id
  } catch (error) {
    console.error("Error getting current user:", error)
    throw new Error("Failed to get current user")
  }
}

// Types based on the new income.sql schema
export type IncomeRecurrenceFrequency = 'none' | 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual'
export type TaxType = 'none' | 'pre_tax' | 'post_tax'

export interface Income {
  id: string
  user_id: string
  source_name: string
  amount: number
  currency: string
  category_id: string | null
  is_taxable: boolean
  tax_class: TaxType
  recurrence: IncomeRecurrenceFrequency
  start_date: string
  end_date: string | null
  notes: string | null
  monthly_equivalent_amount: number
  created_at: string
  updated_at: string
  category?: { id: string; name: string }
}

export interface IncomeCategory {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface IncomeDeduction {
  id: string
  income_id: string
  name: string
  amount: number
  tax_class: TaxType
  created_at: string
}

export interface IncomeHustle {
  id: string
  user_id: string
  income_id: string
  hustle_name: string
  hustle_amount: number
  created_at: string
}

// Get all income entries for the current user
export async function getIncomes(timestamp?: number) {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    throw new Error("Failed to create Supabase client")
  }
  
  console.log(`Fetching incomes at timestamp ${timestamp || Date.now()}`)

  const { data, error } = await supabase
    .from("incomes")
    .select(`
      *,
      category:income_categories(id, name)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching incomes:", error)
    throw new Error("Failed to fetch incomes")
  }

  return data || []
}

// Get a specific income by ID
export async function getIncomeById(id: string) {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    const { data, error } = await supabase
      .from("incomes")
      .select(`
        *,
        category:income_categories(id, name),
        deductions:income_deductions(*),
        hustles:income_hustles(*)
      `)
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching income:", error)
      throw new Error("Failed to fetch income")
    }

    return data
  } catch (error) {
    console.error("Error in getIncomeById:", error)
    throw error
  }
}

// Create default income categories for a user
async function createDefaultIncomeCategories(userId: string) {
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    throw new Error("Failed to create Supabase client")
  }

  const defaultCategories = [
    { name: "Salary", user_id: userId },
    { name: "Freelance", user_id: userId },
    { name: "Investments", user_id: userId },
    { name: "Rental", user_id: userId },
    { name: "Business", user_id: userId },
    { name: "Bonus", user_id: userId },
    { name: "Side Hustle", user_id: userId },
    { name: "Other", user_id: userId }
  ]

  const { data, error } = await supabase
    .from("income_categories")
    .insert(defaultCategories)
    .select()

  if (error) {
    console.error("Error creating default income categories:", error)
    return []
  }

  return data || []
}

// Get all income categories
export async function getIncomeCategories() {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()
  if (!supabase) {
    throw new Error("Failed to create Supabase client")
  }

  // Get existing categories
  const { data, error } = await supabase
    .from("income_categories")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching income categories:", error)
    throw new Error("Failed to fetch income categories")
  }

  // If no categories exist, create default ones
  if (!data || data.length === 0) {
    console.log("No income categories found, creating defaults")
    const defaultCategories = await createDefaultIncomeCategories(userId)
    return defaultCategories
  }

  return data
}

// Create a new income category
export async function createIncomeCategory(formData: FormData) {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    const name = formData.get("name") as string
    if (!name) {
      throw new Error("Name is required")
    }

    const parentId = formData.get("parent_id") as string || null

    const { data, error } = await supabase
      .from("income_categories")
      .insert({
        user_id: userId,
        name,
        parent_id: parentId
      })
      .select()

    if (error) {
      console.error("Error creating income category:", error)
      throw new Error(`Failed to create income category: ${error.message}`)
    }

    revalidatePath("/income")
    return { id: data[0].id }
  } catch (error) {
    console.error("Error in createIncomeCategory:", error)
    throw error
  }
}

// Create a new income entry
export async function createIncome(formData: FormData) {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // Validate required fields
    const sourceName = formData.get("source_name") as string
    if (!sourceName) {
      throw new Error("Source name is required")
    }

    const amountStr = formData.get("amount") as string
    const amount = Number(amountStr)
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Amount must be a positive number")
    }

    const recurrence = formData.get("recurrence") as IncomeRecurrenceFrequency
    if (!recurrence) {
      throw new Error("Recurrence is required")
    }

    const startDate = formData.get("start_date") as string
    if (!startDate) {
      throw new Error("Start date is required")
    }

    // Optional fields
    const categoryId = formData.get("category_id") as string || null
    const endDate = formData.get("end_date") as string || null
    const notes = formData.get("notes") as string || null
    const currency = formData.get("currency") as string || "USD"
    const isTaxable = formData.get("is_taxable") === "true"
    const taxClass = formData.get("tax_class") as TaxType || "post_tax"

    const incomeData = {
      user_id: userId,
      source_name: sourceName,
      amount,
      currency,
      category_id: categoryId,
      is_taxable: isTaxable,
      tax_class: taxClass,
      recurrence,
      start_date: startDate,
      end_date: endDate,
      notes
    }

    console.log("Income data to insert:", incomeData)

    const { data, error } = await supabase
      .from("incomes")
      .insert(incomeData)
      .select()

    if (error) {
      console.error("Error creating income:", error)
      throw new Error(`Failed to create income: ${error.message}`)
    }

    // Process deductions if any
    const deductionsJson = formData.get("deductions") as string
    if (deductionsJson) {
      try {
        const deductions = JSON.parse(deductionsJson)
        if (Array.isArray(deductions) && deductions.length > 0) {
          const deductionsToInsert = deductions.map(deduction => ({
            income_id: data[0].id,
            name: deduction.name,
            amount: deduction.amount,
            tax_class: deduction.tax_class
          }))

          const { error: deductionsError } = await supabase
            .from("income_deductions")
            .insert(deductionsToInsert)

          if (deductionsError) {
            console.error("Error adding deductions:", deductionsError)
          }
        }
      } catch (e) {
        console.error("Error parsing deductions:", e)
      }
    }

    // Process side hustles if any
    const hustlesJson = formData.get("hustles") as string
    if (hustlesJson) {
      try {
        const hustles = JSON.parse(hustlesJson)
        if (Array.isArray(hustles) && hustles.length > 0) {
          const hustlesToInsert = hustles.map(hustle => ({
            user_id: userId,
            income_id: data[0].id,
            hustle_name: hustle.name,
            hustle_amount: hustle.amount
          }))

          const { error: hustlesError } = await supabase
            .from("income_hustles")
            .insert(hustlesToInsert)

          if (hustlesError) {
            console.error("Error adding side hustles:", hustlesError)
          }
        }
      } catch (e) {
        console.error("Error parsing side hustles:", e)
      }
    }

    revalidatePath("/income")
    return { id: data[0].id }
  } catch (error) {
    console.error("Error in createIncome:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to create income: ${error.message}`)
    }
    throw new Error("Failed to create income")
  }
}

// Update an existing income
export async function updateIncome(id: string, formData: FormData) {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // First check if the income exists and belongs to the user
    const { data: existingIncome, error: fetchError } = await supabase
      .from("incomes")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (fetchError) {
      console.error("Error fetching income to update:", fetchError)
      throw new Error("Income not found or you don't have permission to update it")
    }

    // Prepare update data
    const updateData: Record<string, any> = {}

    // Process all possible fields
    const sourceName = formData.get("source_name") as string
    if (sourceName) updateData.source_name = sourceName

    const amountStr = formData.get("amount") as string
    if (amountStr) {
      const amount = Number(amountStr)
      if (!isNaN(amount) && amount > 0) {
        updateData.amount = amount
      }
    }

    const recurrence = formData.get("recurrence") as IncomeRecurrenceFrequency
    if (recurrence) updateData.recurrence = recurrence

    const startDate = formData.get("start_date") as string
    if (startDate) updateData.start_date = startDate

    const endDate = formData.get("end_date") as string
    updateData.end_date = endDate || null

    const categoryId = formData.get("category_id") as string
    updateData.category_id = categoryId || null

    const notes = formData.get("notes") as string
    updateData.notes = notes || null

    const currency = formData.get("currency") as string
    if (currency) updateData.currency = currency

    const isTaxable = formData.get("is_taxable")
    if (isTaxable !== null) {
      updateData.is_taxable = isTaxable === "true"
    }

    const taxClass = formData.get("tax_class") as TaxType
    if (taxClass) updateData.tax_class = taxClass

    console.log("Income data to update:", updateData)

    // Update the income
    const { error: updateError } = await supabase
      .from("incomes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)

    if (updateError) {
      console.error("Error updating income:", updateError)
      throw new Error(`Failed to update income: ${updateError.message}`)
    }

    // Handle deductions updates
    const deductionsJson = formData.get("deductions") as string
    if (deductionsJson) {
      try {
        // First delete existing deductions
        await supabase
          .from("income_deductions")
          .delete()
          .eq("income_id", id)

        // Then add new ones
        const deductions = JSON.parse(deductionsJson)
        if (Array.isArray(deductions) && deductions.length > 0) {
          const deductionsToInsert = deductions.map(deduction => ({
            income_id: id,
            name: deduction.name,
            amount: deduction.amount,
            tax_class: deduction.tax_class
          }))

          const { error: deductionsError } = await supabase
            .from("income_deductions")
            .insert(deductionsToInsert)

          if (deductionsError) {
            console.error("Error updating deductions:", deductionsError)
          }
        }
      } catch (e) {
        console.error("Error processing deductions update:", e)
      }
    }

    // Handle side hustles updates
    const hustlesJson = formData.get("hustles") as string
    if (hustlesJson) {
      try {
        // First delete existing hustles
        await supabase
          .from("income_hustles")
          .delete()
          .eq("income_id", id)

        // Then add new ones
        const hustles = JSON.parse(hustlesJson)
        if (Array.isArray(hustles) && hustles.length > 0) {
          const hustlesToInsert = hustles.map(hustle => ({
            user_id: userId,
            income_id: id,
            hustle_name: hustle.name,
            hustle_amount: hustle.amount
          }))

          const { error: hustlesError } = await supabase
            .from("income_hustles")
            .insert(hustlesToInsert)

          if (hustlesError) {
            console.error("Error updating side hustles:", hustlesError)
          }
        }
      } catch (e) {
        console.error("Error processing side hustles update:", e)
      }
    }

    revalidatePath("/income")
    return { success: true }
  } catch (error) {
    console.error("Error in updateIncome:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to update income: ${error.message}`)
    }
    throw new Error("Failed to update income")
  }
}

// Delete an income
export async function deleteIncome(id: string) {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // First check if the income exists and belongs to the user
    const { data: existingIncome, error: fetchError } = await supabase
      .from("incomes")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (fetchError) {
      console.error("Error fetching income to delete:", fetchError)
      throw new Error("Income not found or you don't have permission to delete it")
    }

    // Delete the income (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from("incomes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (deleteError) {
      console.error("Error deleting income:", deleteError)
      throw new Error(`Failed to delete income: ${deleteError.message}`)
    }

    revalidatePath("/income")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteIncome:", error)
    if (error instanceof Error) {
      throw new Error(`Failed to delete income: ${error.message}`)
    }
    throw new Error("Failed to delete income")
  }
}

// Calculate income diversification score using the database function
export async function calculateIncomeDiversification() {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    const { data, error } = await supabase
      .rpc('income_diversification_score', { p_user_id: userId })

    if (error) {
      console.error("Error calculating income diversification score:", error)
      throw new Error("Failed to calculate income diversification score")
    }

    return data || 0
  } catch (error) {
    console.error("Error in calculateIncomeDiversification:", error)
    throw error
  }
}

// Get total monthly income
export async function getTotalMonthlyIncome() {
  try {
    const userId = await getCurrentUserId()
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    const { data, error } = await supabase
      .from("incomes")
      .select("monthly_equivalent_amount")
      .eq("user_id", userId)

    if (error) {
      console.error("Error fetching monthly income:", error)
      throw new Error("Failed to fetch monthly income")
    }

    // Sum up all monthly equivalent amounts
    const total = data.reduce((sum, income) => sum + (income.monthly_equivalent_amount || 0), 0)
    return total
  } catch (error) {
    console.error("Error in getTotalMonthlyIncome:", error)
    throw error
  }
}
