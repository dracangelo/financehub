"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { ALL_CATEGORIES } from "@/lib/constants/categories"
import { revalidatePath } from "next/cache"
import type { Category } from "@/types/finance"

export async function getCategories() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name")

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error in getCategories:", error)
    return []
  }
}

// Separate function for revalidation
async function revalidateCategories() {
  revalidatePath("/transactions")
  revalidatePath("/categories")
  revalidatePath("/dashboard")
  revalidatePath("/budgets")
}

export async function ensureStaticCategories() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return { success: false, message: "User not authenticated", categories: [] }
    }
    // Get existing categories
    const { data: existingCategories, error: fetchError } = await supabase
      .from("categories")
      .select(
        `id,
        user_id,
        name,
        color,
        icon,
        is_income,
        created_at,
        updated_at`
      )
      .eq("user_id", user.id)
      .order("name")

    if (fetchError) {
      console.error("Error fetching existing categories:", fetchError)
      return { success: false, message: "Failed to fetch existing categories", categories: [] }
    }

    // Create a map of existing categories for quick lookup
    const existingCategoryMap = new Map()
    existingCategories?.forEach(cat => {
      existingCategoryMap.set(`${cat.name}-${cat.is_income}`, cat.id)
    })

    // Prepare categories to insert with explicit typing
    interface CategoryToInsert {
      id: string;
      name: string;
      color: string;
      is_income: boolean;
      icon?: string;
      user_id: string;
    }
    
    const categoriesToInsert: CategoryToInsert[] = []

    // Check all categories
    ALL_CATEGORIES.forEach(category => {
      const key = `${category.name}-${category.is_income}`
      if (!existingCategoryMap.has(key)) {
        categoriesToInsert.push({
          ...category,
          user_id: user.id
        })
      }
    })

    // Insert missing categories if any
    if (categoriesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("categories")
        .insert(categoriesToInsert)

      if (insertError) {
        console.error("Error inserting categories:", insertError)
        return { success: false, message: "Failed to insert categories", categories: existingCategories || [] }
      }

      // Only revalidate if we actually inserted categories
      await revalidateCategories()
    }

    return { 
      success: true, 
      message: `${categoriesToInsert.length} categories created`,
      created: categoriesToInsert.length,
      categories: (existingCategories || []) as Category[]
    }
  } catch (error) {
    console.error("Error ensuring static categories:", error)
    return { success: false, message: "An unexpected error occurred", categories: [] }
  }
}

export async function initializeUserCategories(userId: string) {
  const supabase = await createServerSupabaseClient()
  
  // Convert ALL_CATEGORIES to database format
  const categoriesToInsert = ALL_CATEGORIES.map(category => ({
    id: crypto.randomUUID(), // Generate UUID
    user_id: userId,
    name: category.name,
    color: category.color,
    icon: category.icon || null,
    is_income: category.is_income
  }))

  const { error } = await supabase
    .from("categories")
    .insert(categoriesToInsert)

  if (error) {
    console.error("Error initializing categories:", error)
    throw error
  }
}

export async function getCategoryById(id: string) {
  // Find the category in our static categories
  return ALL_CATEGORIES.find(category => category.id === id) || null
}

export async function createCategory(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  // Extract form data
  const name = formData.get("name") as string
  const color = (formData.get("color") as string) || "#888888"
  const icon = (formData.get("icon") as string) || ""
  const isIncome = formData.get("is_income") === "true"

  // Validate required fields
  if (!name) {
    throw new Error("Name is required")
  }

  // Create category
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name,
      color,
      icon,
      is_income: isIncome,
    })
    .select()

  if (error) {
    console.error("Error creating category:", error)
    throw new Error("Failed to create category")
  }

  // Revalidate categories page
  revalidatePath("/categories")

  return data[0]
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  // Verify category belongs to user
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("user_id")
    .eq("id", id)
    .single()

  if (categoryError || !category || category.user_id !== user.id) {
    throw new Error("Category not found or access denied")
  }

  // Extract form data
  const name = formData.get("name") as string
  const color = (formData.get("color") as string) || "#888888"
  const icon = (formData.get("icon") as string) || ""
  const isIncome = formData.get("is_income") === "true"

  // Validate required fields
  if (!name) {
    throw new Error("Name is required")
  }

  // Update category
  const { data, error } = await supabase
    .from("categories")
    .update({
      name,
      color,
      icon,
      is_income: isIncome,
    })
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating category:", error)
    throw new Error("Failed to update category")
  }

  await revalidateCategories()

  return data[0]
}

export async function deleteCategory(id: string) {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  // Verify category belongs to user
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("user_id")
    .eq("id", id)
    .single()

  if (categoryError || !category || category.user_id !== user.id) {
    throw new Error("Category not found or access denied")
  }

  // Delete category
  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) {
    console.error("Error deleting category:", error)
    throw new Error("Failed to delete category")
  }

  // Revalidate categories page
  revalidatePath("/categories")

  return { success: true }
}

export async function getCategorySpending(period: "week" | "month" | "year" = "month") {
  try {
    const supabase = await createServerSupabaseClient();
    const user = await getAuthenticatedUser();

    if (!user) {
      return [];
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: string;

    if (period === "week") {
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);
      startDate = lastWeek.toISOString().split("T")[0];
    } else if (period === "month") {
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      startDate = lastMonth.toISOString().split("T")[0];
    } else {
      const lastYear = new Date(now);
      lastYear.setFullYear(now.getFullYear() - 1);
      startDate = lastYear.toISOString().split("T")[0];
    }

    const endDate = now.toISOString().split("T")[0];

    // Get transactions for the period
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(`
        amount,
        category_id,
        date
      `)
      .eq("user_id", user.id)
      .eq("is_income", false)
      .gte("date", startDate)
      .lte("date", endDate);

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      return [];
    }

    // Create a map to store category totals
    const categoryTotals = new Map<string, { total_amount: number; transaction_count: number }>();

    // Calculate totals for each category
    transactions.forEach(transaction => {
      const categoryId = transaction.category_id;
      if (!categoryId) return;

      if (!categoryTotals.has(categoryId)) {
        categoryTotals.set(categoryId, { total_amount: 0, transaction_count: 0 });
      }

      const categoryData = categoryTotals.get(categoryId)!;
      categoryData.total_amount += transaction.amount;
      categoryData.transaction_count += 1;
    });

    // Combine with static category data
    const spendingByCategory = ALL_CATEGORIES
      .filter(category => !category.is_income) // Only include expense categories
      .map(category => {
        const totals = categoryTotals.get(category.id) || { total_amount: 0, transaction_count: 0 };
        return {
          category_id: category.id,
          category_name: category.name,
          color: category.color,
          icon: category.icon,
          total_amount: totals.total_amount,
          transaction_count: totals.transaction_count
        };
      })
      .filter(category => category.transaction_count > 0) // Only include categories with transactions
      .sort((a, b) => b.total_amount - a.total_amount); // Sort by amount descending

    return spendingByCategory;
  } catch (error) {
    console.error("Error in getCategorySpending:", error);
    return [];
  }
}
