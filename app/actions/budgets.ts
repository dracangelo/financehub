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
    console.log("User not authenticated in getBudgetById")
    return null
  }

  try {
    console.log(`Fetching budget with ID: ${id} for user: ${user.id}`)
    
    // First get the budget
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select(`*`)
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (budgetError) {
      console.error("Error fetching budget:", budgetError)
      return null
    }

    if (!budget) {
      console.log(`No budget found with ID: ${id}`)
      return null
    }

    console.log("Budget found:", budget)

    // Then get the budget categories - simplified query to avoid foreign key issues
    const { data: categories, error: categoriesError } = await supabase
      .from("budget_categories")
      .select(`*`)
      .eq("budget_id", id)

    if (categoriesError) {
      console.error("Error fetching budget categories:", categoriesError)
    }

    console.log("Categories found:", categories?.length || 0)

    // Return the budget with categories
    return {
      ...budget,
      budget_categories: categories || []
    }
  } catch (error) {
    console.error("Error in getBudgetById:", error)
    return null
  }
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
    // Prepare budget data with proper date handling
    const budgetInsertData: any = {
      user_id: user.id,
      name: budgetData.name,
      income: budgetData.amount,
      start_date: budgetData.start_date,
      is_collaborative: false
    }
    
    // Only include end_date if it's not empty
    if (budgetData.end_date && budgetData.end_date.trim() !== '') {
      budgetInsertData.end_date = budgetData.end_date
    }
    
    // Create budget first
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .insert(budgetInsertData)
      .select()
      .single()

    if (budgetError || !budget) {
      console.error("Error in transaction:", budgetError)
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

    // Revalidate budgets page
    revalidatePath("/budgets")

    return budget
  } catch (error) {
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

  // Validate input data
  if (!budgetData.name || !budgetData.amount || !budgetData.start_date || !budgetData.categories) {
    throw new Error("Name, amount, start date, and categories are required")
  }

  try {
    // Prepare budget data with proper date handling
    const budgetUpdateData: any = {
      name: budgetData.name,
      income: budgetData.amount,
      start_date: budgetData.start_date,
    }
    
    // Only include end_date if it's not empty
    if (budgetData.end_date && budgetData.end_date.trim() !== '') {
      budgetUpdateData.end_date = budgetData.end_date
    }
    
    // Update budget first
    const { data: updatedBudget, error: updateError } = await supabase
      .from("budgets")
      .update(budgetUpdateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError || !updatedBudget) {
      console.error("Error updating budget:", updateError)
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
        console.error("Error updating budget category:", categoryError)
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
            console.error("Error updating budget subcategory:", subcategoryError)
            throw subcategoryError || new Error("Failed to update budget subcategory")
          }
        }
      }
    }

    // Revalidate budgets page
    revalidatePath("/budgets")

    return updatedBudget
  } catch (error) {
    console.error("Error updating budget:", error)
    throw new Error("Failed to update budget")
  }
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

export async function createBudgetCategory(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  // Get the current user
  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  const budget_id = formData.get("budget_id") as string
  const name = formData.get("name") as string
  const amount_allocated = parseFloat(formData.get("amount_allocated") as string)

  if (!budget_id || !name || isNaN(amount_allocated)) {
    throw new Error("Budget ID, category name, and amount are required")
  }

  try {
    // Verify budget belongs to user
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("*")
      .eq("id", budget_id)
      .eq("user_id", user.id)
      .single()

    if (budgetError || !budget) {
      throw new Error("Budget not found or access denied")
    }

    // Create budget category without the percentage field
    const { data, error } = await supabase
      .from("budget_categories")
      .insert({
        budget_id,
        name,
        amount_allocated
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating budget category:", error)
      throw new Error("Failed to create budget category")
    }

    // Revalidate budgets page
    revalidatePath("/budgets")
    revalidatePath(`/budgets/${budget_id}`)

    return data
  } catch (error) {
    console.error("Error in createBudgetCategory:", error)
    throw new Error("Failed to create budget category")
  }
}

export async function updateBudgetCategory(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  // Get the current user
  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  const budget_id = formData.get("budget_id") as string
  const amount_allocated = parseFloat(formData.get("amount_allocated") as string)
  const percentage = formData.get("percentage") ? parseFloat(formData.get("percentage") as string) : null

  if (!budget_id || isNaN(amount_allocated)) {
    throw new Error("Budget ID and amount are required")
  }

  try {
    // Verify budget belongs to user
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("*")
      .eq("id", budget_id)
      .eq("user_id", user.id)
      .single()

    if (budgetError || !budget) {
      throw new Error("Budget not found or access denied")
    }

    // Update budget category
    const { data, error } = await supabase
      .from("budget_categories")
      .update({
        amount_allocated,
        percentage: percentage || null
      })
      .eq("id", id)
      .eq("budget_id", budget_id)
      .select()
      .single()

    if (error) {
      console.error("Error updating budget category:", error)
      throw new Error("Failed to update budget category")
    }

    // Revalidate budgets page
    revalidatePath("/budgets")
    revalidatePath(`/budgets/${budget_id}`)

    return data
  } catch (error) {
    console.error("Error in updateBudgetCategory:", error)
    throw new Error("Failed to update budget category")
  }
}

export async function deleteBudgetCategory(budget_id: string, id: string) {
  const supabase = await createServerSupabaseClient()

  // Get the current user
  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  try {
    // Verify budget belongs to user
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("*")
      .eq("id", budget_id)
      .eq("user_id", user.id)
      .single()

    if (budgetError || !budget) {
      throw new Error("Budget not found or access denied")
    }

    // Delete budget category
    const { error } = await supabase
      .from("budget_categories")
      .delete()
      .eq("id", id)
      .eq("budget_id", budget_id)

    if (error) {
      console.error("Error deleting budget category:", error)
      throw new Error("Failed to delete budget category")
    }

    // Revalidate budgets page
    revalidatePath("/budgets")
    revalidatePath(`/budgets/${budget_id}`)

    return true
  } catch (error) {
    console.error("Error in deleteBudgetCategory:", error)
    throw new Error("Failed to delete budget category")
  }
}
