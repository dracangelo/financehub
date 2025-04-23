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
      return { categories: [] }
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name")

    if (error) {
      console.error("Error fetching categories:", error)
      
      // If table doesn't exist, create it and initialize with default categories
      if (error.code === "42P01") {
        console.log("Categories table doesn't exist, creating it...")
        await ensureCategoriesTableExists()
        
        // Initialize categories for the user
        await initializeUserCategories(user.id)
        
        // Return default categories
        return { 
          categories: ALL_CATEGORIES.map(category => ({
            ...category,
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        }
      }
      
      return { categories: [] }
    }

    return { categories: data }
  } catch (error) {
    console.error("Error in getCategories:", error)
    return { categories: [] }
  }
}

// Separate function for revalidation
async function revalidateCategories() {
  revalidatePath("/transactions")
  revalidatePath("/categories")
  revalidatePath("/dashboard")
  revalidatePath("/budgets")
}

// Ensure the categories table exists
async function ensureCategoriesTableExists() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Try to create the table using RPC
    try {
      await supabase.rpc('create_categories_table')
      console.log("Successfully created categories table using RPC")
      return true
    } catch (rpcError) {
      console.error("Error creating categories table using RPC:", rpcError)
      
      // If RPC fails, try direct SQL
      try {
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS categories (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users(id),
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            icon TEXT,
            is_income BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Add indexes
          CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);
          
          -- Enable RLS
          ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Users can view their own categories"
            ON categories FOR SELECT
            USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can insert their own categories"
            ON categories FOR INSERT
            WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY "Users can update their own categories"
            ON categories FOR UPDATE
            USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can delete their own categories"
            ON categories FOR DELETE
            USING (auth.uid() = user_id);
        `
        
        await supabase.rpc('exec_sql', { sql: createTableSQL })
        console.log("Successfully created categories table using direct SQL")
        return true
      } catch (sqlError) {
        console.error("Error creating categories table using direct SQL:", sqlError)
        return false
      }
    }
  } catch (error) {
    console.error("Error ensuring categories table exists:", error)
    return false
  }
}

export async function ensureStaticCategories() {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      return { success: false, message: "User not authenticated", categories: [] }
    }
    
    // Ensure categories table exists
    await ensureCategoriesTableExists()
    
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
      
      // If table doesn't exist despite our attempt to create it
      if (fetchError.code === "42P01") {
        return { 
          success: false, 
          message: "Categories table couldn't be created", 
          categories: ALL_CATEGORIES.map(cat => ({...cat, user_id: user.id})) 
        }
      }
      
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
      created_at: string;
      updated_at: string;
    }
    
    const now = new Date().toISOString()
    const categoriesToInsert: CategoryToInsert[] = []

    // Check all categories
    ALL_CATEGORIES.forEach(category => {
      const key = `${category.name}-${category.is_income}`
      if (!existingCategoryMap.has(key)) {
        categoriesToInsert.push({
          ...category,
          user_id: user.id,
          created_at: now,
          updated_at: now
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
  try {
    const supabase = await createServerSupabaseClient()
    
    // Convert ALL_CATEGORIES to database format
    const now = new Date().toISOString()
    const categoriesToInsert = ALL_CATEGORIES.map(category => ({
      id: crypto.randomUUID(), // Generate UUID
      user_id: userId,
      name: category.name,
      color: category.color,
      icon: category.icon || null,
      is_income: category.is_income,
      created_at: now,
      updated_at: now
    }))

    const { error } = await supabase
      .from("categories")
      .insert(categoriesToInsert)

    if (error) {
      console.error("Error initializing categories:", error)
      // Return false but don't throw, to allow graceful degradation
      return false
    }
    
    return true
  } catch (error) {
    console.error("Error in initializeUserCategories:", error)
    return false
  }
}

export async function getCategoryById(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()
    
    if (!user) {
      // If not authenticated, just return static category
      return ALL_CATEGORIES.find(category => category.id === id) || null
    }
    
    // Try to get from database first
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
    
    if (error) {
      // If not found in database, check static categories
      return ALL_CATEGORIES.find(category => category.id === id) || null
    }
    
    return data
  } catch (error) {
    console.error("Error in getCategoryById:", error)
    // Find the category in our static categories as fallback
    return ALL_CATEGORIES.find(category => category.id === id) || null
  }
}

export async function createCategory(formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }
    
    // Ensure categories table exists
    await ensureCategoriesTableExists()

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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error("Error creating category:", error)
      throw new Error("Failed to create category")
    }

    // Revalidate categories page
    revalidatePath("/categories")

    return data[0]
  } catch (error) {
    console.error("Error in createCategory:", error)
    throw error
  }
}

export async function updateCategory(id: string, formData: FormData) {
  try {
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

    if (categoryError) {
      // If table doesn't exist, return error
      if (categoryError.code === "42P01") {
        throw new Error("Categories table doesn't exist")
      }
      
      // If category not found, return error
      if (categoryError.code === "PGRST116") {
        throw new Error("Category not found")
      }
      
      throw new Error(`Database error: ${categoryError.message}`)
    }
    
    if (!category || category.user_id !== user.id) {
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
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating category:", error)
      throw new Error("Failed to update category")
    }

    await revalidateCategories()

    return data[0]
  } catch (error) {
    console.error("Error in updateCategory:", error)
    throw error
  }
}

export async function deleteCategory(id: string) {
  try {
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

    if (categoryError) {
      // If table doesn't exist, return success (nothing to delete)
      if (categoryError.code === "42P01") {
        return { success: true }
      }
      
      // If category not found, return success (nothing to delete)
      if (categoryError.code === "PGRST116") {
        return { success: true }
      }
      
      throw new Error(`Database error: ${categoryError.message}`)
    }

    if (!category || category.user_id !== user.id) {
      throw new Error("Category not found or access denied")
    }

    // Check if category is in use by transactions
    const { count, error: countError } = await supabase
      .from("transactions")
      .select("id", { count: 'exact', head: true })
      .eq("category_id", id)
    
    if (countError && countError.code !== "42P01") {
      console.error("Error checking if category is in use:", countError)
      throw new Error("Failed to check if category is in use")
    }
    
    if (count && count > 0) {
      throw new Error("Cannot delete category that is in use by transactions")
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
  } catch (error) {
    console.error("Error in deleteCategory:", error)
    throw error
  }
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
      
      // If table doesn't exist, return empty array
      if (transactionsError.code === "42P01") {
        return [];
      }
      
      throw new Error(`Database error: ${transactionsError.message}`);
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

    // Get user categories
    const { data: userCategories, error: categoriesError } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_income", false);
    
    // Combine categories from database and static categories
    const allCategories = categoriesError || !userCategories || userCategories.length === 0
      ? ALL_CATEGORIES.filter(category => !category.is_income)
      : userCategories;

    // Combine with category data
    const spendingByCategory = allCategories
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
