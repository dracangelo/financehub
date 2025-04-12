"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getAuthenticatedUser } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function getBudgets() {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the current user
    const user = await getAuthenticatedUser()

    if (!user) {
      console.log("User not authenticated in getBudgets")
      return []
    }

    const { data, error } = await supabase
      .from("budgets")
      .select(`
        *,
        budget_category:budget_categories(id, name, amount_allocated, parent_id)
      `)
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })

    if (error) {
      console.error("Error fetching budgets:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error in getBudgets:", error)
    return []
  }
}

export async function getBudgetById(id: string) {
  const supabase = await createServerSupabaseClient()

  // Get the current user
  const user = await getAuthenticatedUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from("budgets")
    .select(`
      *,
      budget_categories(id, name, amount_allocated, parent_id)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error) {
    console.error("Error fetching budget:", error)
    return null
  }

  return data
}

export async function createBudget(budgetData: any) {
  const supabase = await createServerSupabaseClient()

  // Get the current user
  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  // Validate input data
  if (!budgetData.name || !budgetData.amount || !budgetData.start_date || !budgetData.categories) {
    throw new Error("Name, amount, start date, and categories are required")
  }

  try {
    // Create budget first
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .insert({
        user_id: user.id,
        name: budgetData.name,
        amount: budgetData.amount,
        start_date: budgetData.start_date,
        end_date: budgetData.end_date,
        is_collaborative: false
      })
      .select()
      .single()

    if (budgetError || !budget) {
      throw budgetError || new Error("Failed to create budget")
    }

    // Create budget categories and subcategories
    for (const category of budgetData.categories) {
      const { data: budgetCategory, error: categoryError } = await supabase
        .from("budget_categories")
        .insert({
          budget_id: budget.id,
          name: category.name,
          amount_allocated: category.amount,
          percentage: category.percentage
        })
        .select()
        .single()

      if (categoryError || !budgetCategory) {
        // If category creation fails, delete the budget and all related categories
        await supabase.from("budgets").delete().eq("id", budget.id)
        throw categoryError || new Error("Failed to create budget category")
      }

      // Create subcategories if they exist
      if (category.subcategories && category.subcategories.length > 0) {
        for (const subcategory of category.subcategories) {
          const { error: subcategoryError } = await supabase
            .from("budget_categories")
            .insert({
              budget_id: budget.id,
              parent_id: budgetCategory.id,
              name: subcategory.name,
              amount_allocated: subcategory.amount,
              percentage: subcategory.percentage
            })

          if (subcategoryError) {
            // If subcategory creation fails, delete the budget and all related categories
            await supabase.from("budgets").delete().eq("id", budget.id)
            throw subcategoryError || new Error("Failed to create budget subcategory")
          }
        }
      }
    }

    // Return the budget with its category
    const { data: fullBudget, error: fullBudgetError } = await supabase
      .from("budgets")
      .select(`
        *,
        budget_category:budget_categories(id, name, amount_allocated, parent_id)
      `)
      .eq("id", budget.id)
      .single()

    if (fullBudgetError || !fullBudget) {
      throw fullBudgetError || new Error("Failed to fetch created budget")
    }

    // Revalidate budgets page
    revalidatePath("/budgets")

    return fullBudget
  } catch (error) {
    // Clean up any created resources if possible
    const err = error as any
    if (err?.message?.includes("budget_category")) {
      const budgetId = err?.details?.match(/budget_id: ([\w-]+)/)?.[1]
      if (budgetId) {
        await supabase.from("budgets").delete().eq("id", budgetId)
      }
    }
    console.error("Error in transaction:", error)
    throw new Error("Failed to create budget")
  }
}

export async function updateBudget(id: string, budgetData: any) {
  const supabase = await createServerSupabaseClient()

  // Get the current user
  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  // Verify budget belongs to user
  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (budgetError || !budget) {
    throw new Error("Budget not found or access denied")
  }

  // Validate input data
  if (!budgetData.name || !budgetData.amount || !budgetData.start_date || !budgetData.categories) {
    throw new Error("Name, amount, start date, and categories are required")
  }

  // Update budget
  const { data: updatedBudget, error: updateError } = await supabase
    .from("budgets")
    .update({
      name: budgetData.name,
      amount: budgetData.amount,
      start_date: budgetData.start_date,
      end_date: budgetData.end_date,
    })
    .eq("id", id)
    .select()
    .single()

  if (updateError || !updatedBudget) {
    throw updateError || new Error("Failed to update budget")
  }

  // Delete existing categories
  await supabase
    .from("budget_categories")
    .delete()
    .eq("budget_id", id)

  // Create new categories and subcategories
  for (const category of budgetData.categories) {
    const { data: budgetCategory, error: categoryError } = await supabase
      .from("budget_categories")
      .insert({
        budget_id: id,
        name: category.name,
        amount_allocated: category.amount,
        percentage: category.percentage
      })
      .select()
      .single()

    if (categoryError || !budgetCategory) {
      throw categoryError || new Error("Failed to update budget category")
    }

    // Create subcategories if they exist
    if (category.subcategories && category.subcategories.length > 0) {
      for (const subcategory of category.subcategories) {
        const { error: subcategoryError } = await supabase
          .from("budget_categories")
          .insert({
            budget_id: id,
            parent_id: budgetCategory.id,
            name: subcategory.name,
            amount_allocated: subcategory.amount,
            percentage: subcategory.percentage
          })

        if (subcategoryError) {
          throw subcategoryError || new Error("Failed to update budget subcategory")
        }
      }
    }
  }

  // Revalidate budgets page
  revalidatePath("/budgets")

  return updatedBudget
}

export async function deleteBudget(id: string) {
  const supabase = await createServerSupabaseClient()

  // Get the current user
  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  // Verify budget belongs to user
  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (budgetError || !budget) {
    throw new Error("Budget not found or access denied")
  }

  // Delete budget
  const { error } = await supabase.from("budgets").delete().eq("id", id)

  if (error) {
    console.error("Error deleting budget:", error)
    throw new Error("Failed to delete budget")
  }

  // Revalidate budgets page
  revalidatePath("/budgets")

  return true
}

export async function getBudgetProgress(budgetId: string) {
  const supabase = await createServerSupabaseClient()

  // Get the current user
  const user = await getAuthenticatedUser()

  if (!user) {
    return null
  }

  // Get budget details
  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", budgetId)
    .eq("user_id", user.id)
    .single()

  if (budgetError || !budget) {
    console.error("Error fetching budget:", budgetError)
    return null
  }

  // Calculate date range based on period
  const startDate = new Date(budget.start_date)
  let endDate = new Date()

  if (budget.end_date) {
    endDate = new Date(budget.end_date)
  }

  // Get transactions for this category within the date range
  const { data: transactions, error: transactionsError } = await supabase
    .from("transactions")
    .select("*")
    .eq("category_id", budget.category_id)
    .eq("user_id", user.id)
    .gte("date", startDate.toISOString())
    .lte("date", endDate.toISOString())

  if (transactionsError) {
    console.error("Error fetching transactions:", transactionsError)
    return null
  }

  // Calculate total spent
  const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  // Calculate remaining amount
  const remaining = budget.amount - totalSpent

  // Calculate percentage used
  const percentageUsed = (totalSpent / budget.amount) * 100

  return {
    budget,
    totalSpent,
    remaining,
    percentageUsed,
  }
}

