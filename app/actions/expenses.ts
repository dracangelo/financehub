"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/auth/server"
import { revalidatePath } from "next/cache"
import { ALL_CATEGORIES, Category } from "@/lib/constants/categories"
import { notFound } from "next/navigation"
import { Expense } from "@/types/expense"
import { formatExpense, formatExpenseForCalendar, getExpenseSummaryByDay } from "@/lib/expense-utils"

// Interface for location search parameters
export interface LocationSearchParams {
  latitude: number;
  longitude: number;
  radiusMeters?: number; // Default will be 1000 meters (1km)
  locationName?: string; // Optional location name for display
}

// Get all expenses with location data
export async function getExpenses(locationSearch?: LocationSearchParams) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      console.log("No authenticated user found")
      return []
    }

    // Build the query
    let query = supabase
      .from("expenses")
      .select(`
        *,
        categories:expense_categories(id, name, parent_id),
        splits:split_expenses(id, shared_with_user, amount, note)
      `)
      .eq("user_id", user.id)
    
    // Add location filter if provided
    if (locationSearch && locationSearch.latitude && locationSearch.longitude) {
      const radius = locationSearch.radiusMeters || 1000; // Default to 1km if not specified
      const point = `POINT(${locationSearch.longitude} ${locationSearch.latitude})`;
      
      // Use PostGIS ST_DWithin to find expenses within the radius
      // Note: ST_DWithin with geography type measures in meters
      query = query.filter(
        'location_geo', 
        'st_dwithin', 
        `CAST(ST_SetSRID(ST_GeomFromText('${point}'), 4326) AS geography),${radius}`
      );
    }
    
    // Execute the query
    const { data: expenseData, error } = await query
      .order("expense_date", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error fetching expenses:", error)
      return []
    }

    // Process the data to ensure consistent date field usage
    const processedData = (expenseData || []).map(expense => ({
      ...expense,
      // Add spent_at field using expense_date for compatibility with components
      spent_at: expense.expense_date,
      // Normalize the date field for the calendar and timeline
      date: expense.expense_date
    }))

    return processedData;
  } catch (error) {
    console.error("Unexpected error in getExpenses:", error)
    return []
  }
}

// Search expenses by location with enhanced capabilities
export async function searchExpensesByLocation(params: LocationSearchParams) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      console.log("No authenticated user found")
      return []
    }

    // Build the query
    let query = supabase
      .from("expenses")
      .select(`
        *,
        categories:expense_categories(id, name, parent_id),
        splits:split_expenses(id, shared_with_user, amount, note)
      `)
      .eq("user_id", user.id)
    
    // Add location filter if provided
    if (params && params.latitude && params.longitude) {
      const radius = params.radiusMeters || 1000; // Default to 1km if not specified
      const point = `POINT(${params.longitude} ${params.latitude})`;
      
      // Use PostGIS ST_DWithin to find expenses within the radius
      query = query.filter(
        'location_geo', 
        'st_dwithin', 
        `CAST(ST_SetSRID(ST_GeomFromText('${point}'), 4326) AS geography),${radius}`
      );
    }
    
    // Add location name filter if provided
    if (params && params.locationName) {
      // Try to match against location_name or notes fields that might contain location info
      query = query.or(`location_name.ilike.%${params.locationName}%,notes.ilike.%${params.locationName}%,merchant.ilike.%${params.locationName}%`);
    }
    
    // Execute the query
    const { data, error } = await query
      .order("expense_date", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error searching expenses by location:", error)
      return []
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error in searchExpensesByLocation:", error)
    return []
  }
}

// Get expense by ID
export async function getExpenseById(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        categories:expense_categories(id, name, parent_id),
        splits:split_expenses(id, shared_with_user, amount, note)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching expense:", error)
      throw new Error("Failed to fetch expense")
    }

    if (!data) {
      notFound()
    }

    return data as Expense
  } catch (error) {
    console.error("Error in getExpenseById:", error)
    throw new Error("Failed to fetch expense")
  }
}

// Create a new expense with advanced features
export async function createExpense(expenseData: {
  merchant: string;
  amount: number;
  currency?: string;
  category_ids?: string[];
  budget_item_id?: string | null;
  expense_date: Date;
  location_name?: string | null;
  recurrence?: string;
  is_impulse?: boolean;
  notes?: string | null;
  receipt_url?: string | null;
  warranty_expiration_date?: Date | null;
}) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // Prepare the expense data for insertion
    const insertData = {
      user_id: user.id,
      merchant: expenseData.merchant,
      amount: expenseData.amount,
      currency: expenseData.currency || "USD",
      budget_item_id: expenseData.budget_item_id || null,
      expense_date: expenseData.expense_date.toISOString(),
      location_name: expenseData.location_name || null,
      recurrence: expenseData.recurrence || "none",
      is_impulse: expenseData.is_impulse || false,
      notes: expenseData.notes || null,
      receipt_url: expenseData.receipt_url || null,
      warranty_expiration_date: expenseData.warranty_expiration_date?.toISOString() || null,
    }

    // Insert the expense
    const { data, error } = await supabase
      .from("expenses")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("Error creating expense:", error)
      throw new Error("Failed to create expense")
    }

    // Add category links if provided
    if (expenseData.category_ids && expenseData.category_ids.length > 0 && data.id) {
      // First, check if the categories exist in the expense_categories table
      // and create them if they don't
      for (const categoryId of expenseData.category_ids) {
        // Check if the category exists
        const { data: existingCategory, error: checkError } = await supabase
          .from("expense_categories")
          .select("id")
          .eq("id", categoryId)
          .maybeSingle()
        
        if (checkError) {
          console.error("Error checking if category exists:", checkError)
          continue
        }
        
        // If the category doesn't exist, create it
        if (!existingCategory) {
          // Get the category name from the constants
          const categoryInfo = ALL_CATEGORIES.find((cat: Category) => cat.id === categoryId)
          
          if (!categoryInfo) {
            console.error(`Category with ID ${categoryId} not found in constants`)
            continue
          }
          
          console.log(`Creating missing category with ID: ${categoryId}`)
          
          // Create the category with minimal fields to avoid schema cache errors
          // Deliberately not including the color field to avoid schema cache errors
          const { error: createError } = await supabase
            .from("expense_categories")
            .upsert({
              id: categoryId,
              user_id: user.id,
              name: categoryInfo.name
              // No color field - this avoids the schema cache error
            }, { onConflict: 'id', ignoreDuplicates: true })
          
          if (createError) {
            console.error(`Error creating category ${categoryId}:`, createError)
            // Continue with the process even if there's an error
            // This allows the application to work even with schema mismatches
          }
        }
      }
      
      // Now create the category links
      const categoryLinks = expenseData.category_ids.map(categoryId => ({
        expense_id: data.id,
        category_id: categoryId
      }))

      const { error: categoryLinkError } = await supabase
        .from("expense_category_links")
        .insert(categoryLinks)

      if (categoryLinkError) {
        console.error("Error linking categories to expense:", categoryLinkError)
      }
    }

    // Revalidate the expenses page
    revalidatePath("/expenses")
    revalidatePath("/dashboard")

    return data
  } catch (error) {
    console.error("Error in createExpense:", error)
    throw new Error("Failed to create expense")
  }
}

// Update an existing expense with enhanced features
export async function updateExpense(id: string, expenseData: {
  merchant?: string;
  amount?: number;
  currency?: string;
  category_ids?: string[];
  budget_item_id?: string | null;
  expense_date?: Date;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  recurrence?: string;
  is_impulse?: boolean;
  notes?: string | null;
  receipt_url?: string | null;
  warranty_expiration_date?: Date | null;
}) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    console.log("Updating expense with data:", expenseData)

    // Extract basic expense data directly from the input object
    const merchant = expenseData.merchant || null
    const amount = typeof expenseData.amount === 'number' ? expenseData.amount : parseFloat(expenseData.amount || '0')
    const currency = expenseData.currency || 'USD'
    const category_ids = expenseData.category_ids || null
    const budget_item_id = expenseData.budget_item_id || null
    const expense_date = expenseData.expense_date
    const location_name = expenseData.location_name || null
    const latitude = expenseData.latitude || null
    const longitude = expenseData.longitude || null
    const recurrence = expenseData.recurrence || null
    const is_impulse = !!expenseData.is_impulse
    const notes = expenseData.notes || null
    const warranty_expiration_date = expenseData.warranty_expiration_date || null
    const receipt_url = expenseData.receipt_url || null

    // First, get the existing expense to compare changes
    const { data: existingExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
      
    if (fetchError) {
      console.error("Error fetching existing expense:", fetchError)
      throw new Error("Failed to fetch existing expense")
    }

    if (!existingExpense) {
      throw new Error("Expense not found")
    }
    
    // Validate required fields - check if values exist or use existing values as fallback
    // This allows partial updates where not all fields are required
    const finalAmount = isNaN(amount) ? existingExpense.amount : amount;
    const finalExpenseDate = expense_date || existingExpense.expense_date;
    
    if (!finalAmount) {
      throw new Error("Missing required field: amount")
    }
    
    if (!finalExpenseDate) {
      throw new Error("Missing required field: expense_date")
    }

    // Prepare update data
    const updateData: any = {
      merchant,
      amount: finalAmount,
      currency,
      budget_item_id,
      expense_date: finalExpenseDate,
      location_name,
      recurrence,
      is_impulse,
      notes,
      warranty_expiration_date: warranty_expiration_date ? new Date(warranty_expiration_date).toISOString() : null,
      receipt_url,
    }
    
    // Add location_geo if latitude and longitude are provided
    if (latitude && longitude) {
      // PostGIS requires a point in the format: POINT(longitude latitude)
      // Note: PostGIS uses longitude first, then latitude
      updateData.location_geo = `POINT(${longitude} ${latitude})`
      console.log("Setting location_geo to:", updateData.location_geo)
    }
    const { data, error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating expense:", error)
      throw new Error("Failed to update expense")
    }
    
    // Update category links if provided
    if (category_ids && category_ids.length > 0) {
      try {
        // First, ensure all categories exist in the expense_categories table
        for (const categoryId of category_ids) {
          // Check if category exists
          let { data: existingCategory } = await supabase
            .from("expense_categories")
            .select("id")
            .eq("id", categoryId)
            .single();

          // If category doesn't exist, create it with a default name based on the ID
          if (!existingCategory) {
            console.log(`Creating missing category with ID: ${categoryId}`);
            const categoryName = `Category ${categoryId.substring(categoryId.length - 2)}`;
            
            try {
              const { error: createError } = await supabase
                .from("expense_categories")
                .insert({
                  id: categoryId,
                  name: categoryName,
                  description: `Auto-created category for ID ${categoryId}`,
                  color: '#' + Math.floor(Math.random()*16777215).toString(16) // Random color
                });
                
              if (!createError) {
                console.log(`Successfully created category: ${categoryName} with ID: ${categoryId}`);
                
                // Verify the category was created by checking again
                // This helps ensure the category is fully created before we try to link it
                let retries = 3;
                while (retries > 0) {
                  const { data: verifyCategory } = await supabase
                    .from("expense_categories")
                    .select("id")
                    .eq("id", categoryId)
                    .single();
                    
                  if (verifyCategory) {
                    console.log(`Verified category ${categoryId} exists in database`);
                    break;
                  }
                  
                  // Wait a short time before retrying
                  console.log(`Waiting for category ${categoryId} to be available... (${retries} retries left)`);
                  await new Promise(resolve => setTimeout(resolve, 500));
                  retries--;
                }
              } else {
                console.error(`Error creating category ${categoryId}:`, createError);
              }
            } catch (createError) {
              console.error(`Error creating category ${categoryId}:`, createError);
              // Continue anyway, the insert might fail if another process created it concurrently
            }
          }
        }

        // Delete existing category links
        const { error: deleteError } = await supabase
          .from("expense_category_links")
          .delete()
          .eq("expense_id", id);
          
        if (deleteError) {
          console.error("Error deleting existing category links:", deleteError);
        }

        // Try to insert new category links with retries
        const categoryLinks = category_ids.map(categoryId => ({
          expense_id: id,
          category_id: categoryId
        }));

        let linkSuccess = false;
        let retryCount = 3;
        
        while (!linkSuccess && retryCount > 0) {
          const { error: categoryLinkError } = await supabase
            .from("expense_category_links")
            .insert(categoryLinks);

          if (categoryLinkError) {
            console.error(`Error linking categories to expense (retry ${4-retryCount}/3):`, categoryLinkError);
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount--;
          } else {
            console.log(`Successfully linked ${category_ids.length} categories to expense`);
            linkSuccess = true;
          }
        }
        
        if (!linkSuccess) {
          console.error("Failed to link categories after multiple retries");
          
          // As a last resort, try inserting categories one by one
          console.log("Attempting to link categories individually...");
          for (const link of categoryLinks) {
            const { error: singleLinkError } = await supabase
              .from("expense_category_links")
              .insert([link]);
              
            if (singleLinkError) {
              console.error(`Failed to link category ${link.category_id}:`, singleLinkError);
            } else {
              console.log(`Successfully linked category ${link.category_id}`);
            }
          }
        }
      } catch (error) {
        console.error("Error in category linking process:", error);
        // Continue with the update, just don't update categories
      }
    }

    // Revalidate the expenses page
    revalidatePath("/expenses")
    revalidatePath(`/expenses/${id}`)
    revalidatePath("/dashboard")

    return data
  } catch (error) {
    console.error("Error in updateExpense:", error)
    throw new Error("Failed to update expense")
  }
}

// Delete an expense with comprehensive cleanup
export async function deleteExpense(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }

    // First, get the expense details to handle related data
    const { data: expense, error: fetchError } = await supabase
      .from("expenses")
      .select("id, merchant, amount")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching expense for deletion:", fetchError)
      throw new Error("Failed to fetch expense for deletion")
    }

    // Handle receipt cleanup first
    try {
      // Get receipt info
      const { data: receiptData } = await supabase
        .from("receipts")
        .select("id, image_url")
        .eq("expense_id", id)

      if (receiptData && receiptData.length > 0) {
        // Delete receipt files from storage
        for (const receipt of receiptData) {
          if (receipt.image_url) {
            // Extract the path from the URL
            const urlParts = receipt.image_url.split('/')
            const storagePath = urlParts.slice(-3).join('/')
            
            // Delete the file
            await supabase.storage
              .from('receipts')
              .remove([storagePath])
          }
        }

        // Delete receipt records
        await supabase
          .from("receipts")
          .delete()
          .eq("expense_id", id)
      }
    } catch (receiptError) {
      console.error("Error cleaning up receipts:", receiptError)
      // Continue with deletion even if receipt cleanup fails
    }

    // Handle split expense cleanup
    try {
      await supabase
        .from("split_expenses")
        .delete()
        .eq("expense_id", id)
    } catch (splitError) {
      console.error("Error cleaning up expense splits:", splitError)
      // Continue with deletion even if split cleanup fails
    }

    // Handle voice memo cleanup
    try {
      // Get voice memo info
      const { data: memoData } = await supabase
        .from("voice_memos")
        .select("id, audio_url")
        .eq("expense_id", id)

      if (memoData && memoData.length > 0) {
        // Delete audio files from storage
        for (const memo of memoData) {
          if (memo.audio_url) {
            // Extract the path from the URL
            const urlParts = memo.audio_url.split('/')
            const storagePath = urlParts.slice(-3).join('/')
            
            // Delete the file
            await supabase.storage
              .from('voice_memos')
              .remove([storagePath])
          }
        }

        // Delete voice memo records
        await supabase
          .from("voice_memos")
          .delete()
          .eq("expense_id", id)
      }
    } catch (memoError) {
      console.error("Error cleaning up voice memos:", memoError)
      // Continue with deletion even if memo cleanup fails
    }

    // Finally, delete the expense
    const { data, error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting expense:", error)
      throw new Error("Failed to delete expense")
    }

    // Revalidate all paths that display expense data
    revalidatePath("/expenses")
    revalidatePath("/dashboard")

    return { success: true, message: "Expense and all related data deleted successfully" }
  } catch (error) {
    console.error("Error in deleteExpense:", error)
    throw error
  }
}

// Get expenses by time period
export async function getExpensesByPeriod(period: "current" | "day" | "week" | "month" | "year" = "month") {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate: string

    if (period === "current") {
      // Current month: from the 1st day of the current month to now
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate = firstDayOfMonth.toISOString().split("T")[0]
    } else if (period === "day") {
      startDate = now.toISOString().split("T")[0]
    } else if (period === "week") {
      const lastWeek = new Date(now)
      lastWeek.setDate(now.getDate() - 7)
      startDate = lastWeek.toISOString().split("T")[0]
    } else if (period === "month") {
      const lastMonth = new Date(now)
      lastMonth.setMonth(now.getMonth() - 1)
      startDate = lastMonth.toISOString().split("T")[0]
    } else {
      const lastYear = new Date(now)
      lastYear.setFullYear(now.getFullYear() - 1)
      startDate = lastYear.toISOString().split("T")[0]
    }

    // Query expenses directly with date range - use expense_date field
    const { data: expenseData, error: expenseError } = await supabase
      .from("expenses")
      .select(`
        *,
        categories:expense_categories(id, name, parent_id),
        splits:split_expenses(id, shared_with_user, amount, note)
      `)
      .eq("user_id", user.id)
      .gte("expense_date", startDate)
      .order("expense_date", { ascending: false })

    if (expenseError) {
      console.error("Error fetching expenses by period:", expenseError)
      return []
    }

    // Process the data to ensure consistent date field usage
    const processedData = expenseData.map(expense => ({
      ...expense,
      // Add spent_at field using expense_date for compatibility with components
      spent_at: expense.expense_date,
      // Normalize the date field for the calendar and timeline
      date: expense.expense_date
    }))

    return processedData
  } catch (error) {
    console.error("Unexpected error in getExpensesByPeriod:", error)
    return []
  }
}

// Get expenses by category
export async function getExpensesByCategory(categoryId: string | null) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    if (!categoryId) {
      return []
    }

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        categories:expense_categories(id, name, parent_id),
        splits:split_expenses(id, shared_with_user, amount, note)
      `)
      .eq("user_id", user.id)
      .eq("category_id", categoryId)
      .order("expense_date", { ascending: false })

    if (error) {
      console.error("Error fetching expenses by category:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getExpensesByCategory:", error)
    return []
  }
}

// Get expenses by merchant
export async function getExpensesByMerchant(merchant: string) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        categories:expense_categories(id, name, parent_id),
        splits:split_expenses(id, shared_with_user, amount, note)
      `)
      .eq("user_id", user.id)
      .ilike("merchant", `%${merchant}%`)
      .order("expense_date", { ascending: false })

    if (error) {
      console.error("Error fetching expenses by merchant:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getExpensesByMerchant:", error)
    return []
  }
}

// Get expenses with location data
export async function getExpensesWithLocation() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        categories:expense_categories(id, name, parent_id),
        splits:split_expenses(id, shared_with_user, amount, note)
      `)
      .eq("user_id", user.id)
      .not("location_geo", "is", null)
      .order("expense_date", { ascending: false })

    if (error) {
      console.error("Error fetching expenses with location:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getExpensesWithLocation:", error)
    return []
  }
}

// Get recurring expenses
// Create a split expense record
export async function createSplitExpense(splitData: {
  expense_id: string;
  shared_with_user: string;
  amount: number;
  note?: string | null;
}) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      throw new Error("Authentication required")
    }
    
    // Since the shared_with_name column doesn't exist in the database schema,
    // we'll store the name in the note field as we did before
    console.log(`Creating split expense with: ${splitData.shared_with_user}, amount: ${splitData.amount}`);

    // Combine the name and note in the note field
    const combinedNote = `Split with: ${splitData.shared_with_user}${splitData.note ? ` - ${splitData.note}` : ''}`;
    
    // First check if the expense exists
    console.log(`Checking if expense exists with ID: ${splitData.expense_id}`)
    const { data: expenseExists, error: expenseCheckError } = await supabase
      .from("expenses")
      .select("id")
      .eq("id", splitData.expense_id)
      .maybeSingle()
    
    if (expenseCheckError) {
      console.error("Error checking if expense exists:", expenseCheckError)
      throw new Error("Failed to check if expense exists")
    }
    
    if (!expenseExists) {
      console.error(`Expense does not exist with ID: ${splitData.expense_id} - cannot create split expense`)
      throw new Error(`Expense with ID ${splitData.expense_id} does not exist`)
    }
    
    // Insert the split expense record
    const { data, error } = await supabase
      .from("split_expenses")
      .insert({
        expense_id: splitData.expense_id,
        shared_with_user: user.id, // Required for database relation
        amount: splitData.amount,
        note: combinedNote // Store the person's name in the note field
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating split expense:", error)
      throw new Error("Failed to create split expense")
    }

    return data
  } catch (error) {
    console.error("Error in createSplitExpense:", error)
    throw new Error("Failed to create split expense")
  }
}

export async function getRecurringExpenses() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        categories:expense_categories(id, name, parent_id),
        splits:split_expenses(id, shared_with_user, amount, note)
      `)
      .eq("user_id", user.id)
      .neq("recurrence", "none")
      .order("expense_date", { ascending: false })

    if (error) {
      console.error("Error fetching recurring expenses:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Unexpected error in getRecurringExpenses:", error)
    return []
  }
}

// Get split expenses
export async function getSplitExpenses() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("split_transactions")
      .select(`
        *,
        transaction:transactions(id, description, amount, date, account:accounts(id, name)),
        participants:split_participants(id, name, amount, status, payment_date)
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching split expenses:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getSplitExpenses:", error)
    return []
  }
}

// Get time-of-day analysis
export async function getTimeOfDayAnalysis() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    // Get all expenses with time_of_day
    const { data, error } = await supabase
      .from("expenses")
      .select("amount, spent_at, isImpulse, category")
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching time of day data:", error)
      return []
    }

    // Group by time of day
    const timeOfDayGroups: Record<string, { total: number, count: number, impulse_count: number }> = {
      'Morning': { total: 0, count: 0, impulse_count: 0 },
      'Afternoon': { total: 0, count: 0, impulse_count: 0 },
      'Evening': { total: 0, count: 0, impulse_count: 0 },
      'Late Night': { total: 0, count: 0, impulse_count: 0 }
    }

    // Determine time of day for each expense
    data.forEach(expense => {
      const hour = new Date(expense.spent_at).getHours()
      let timeOfDay = 'Afternoon' // Default
      
      if (hour >= 0 && hour < 6) {
        timeOfDay = 'Late Night'
      } else if (hour >= 6 && hour < 12) {
        timeOfDay = 'Morning'
      } else if (hour >= 12 && hour < 18) {
        timeOfDay = 'Afternoon'
      } else {
        timeOfDay = 'Evening'
      }
      
      if (timeOfDayGroups[timeOfDay]) {
        timeOfDayGroups[timeOfDay].total += expense.amount
        timeOfDayGroups[timeOfDay].count += 1
        if (expense.isImpulse) {
          timeOfDayGroups[timeOfDay].impulse_count += 1
        }
      }
    })

    // Convert to array format for visualization
    return Object.entries(timeOfDayGroups).map(([time, stats]) => ({
      time_of_day: time,
      total_amount: stats.total,
      transaction_count: stats.count,
      impulse_count: stats.impulse_count,
      impulse_percentage: stats.count > 0 ? (stats.impulse_count / stats.count) * 100 : 0,
      average_amount: stats.count > 0 ? stats.total / stats.count : 0
    }))
  } catch (error) {
    console.error("Unexpected error in getTimeOfDayAnalysis:", error)
    return []
  }
}

// Get recurring patterns - helper function
async function getRecurringPatterns() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    // Get recurring patterns
    const { data: patterns, error: patternsError } = await supabase
      .from("recurring_patterns")
      .select(`
        *,
        merchant:merchants(id, name, category)
      `)
      .eq("user_id", user.id)

    if (patternsError) {
      console.error("Error fetching recurring patterns:", patternsError)
      return []
    }

    // Get the most recent expense for each recurring pattern
    const enhancedPatterns = await Promise.all(patterns.map(async (pattern) => {
      const { data: recentExpenses, error: expensesError } = await supabase
        .from("expenses")
        .select("id, amount, spent_at")
        .eq("user_id", user.id)
        .eq("merchant_id", pattern.merchant_id)
        .eq("is_recurring", true)
        .order("spent_at", { ascending: false })
        .limit(1)

      if (expensesError || !recentExpenses || recentExpenses.length === 0) {
        return pattern
      }

      return {
        ...pattern,
        last_expense: recentExpenses[0],
        next_due_days: Math.ceil(
          (new Date(pattern.next_due).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      }
    }))

    return enhancedPatterns
  } catch (error) {
    console.error("Unexpected error in getRecurringExpenses:", error)
    return []
  }
}

// Get merchant intelligence data
export async function getMerchantIntelligence(merchantId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return { data: null, error: new Error("Supabase client not initialized") }
    }

    const user = await getAuthenticatedUser()

    if (!user) {
      return null
    }

    // Get merchant details
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", merchantId)
      .single()

    if (merchantError) {
      console.error("Error fetching merchant:", merchantError)
      return null
    }

    // Get all expenses for this merchant
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("amount, spent_at, isImpulse, category")
      .eq("user_id", user.id)
      .eq("merchant_id", merchantId)
      .order("spent_at", { ascending: false })

    if (expensesError) {
      console.error("Error fetching merchant expenses:", expensesError)
      return null
    }

    // Calculate intelligence metrics
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const averageSpend = totalSpent / (expenses.length || 1)
    const impulseCount = expenses.filter(exp => exp.isImpulse).length
    const impulsePercentage = (impulseCount / (expenses.length || 1)) * 100

    // Analyze spending frequency
    const dates = expenses.map(exp => new Date(exp.spent_at).toISOString().split('T')[0])
    const uniqueDates = [...new Set(dates)]
    const frequencyDays = dates.length > 1 ? 
      Math.round((new Date(dates[0]).getTime() - new Date(dates[dates.length - 1]).getTime()) / (1000 * 60 * 60 * 24 * (uniqueDates.length - 1))) : 
      0

    // Update merchant insights
    const insights = {
      total_spent: totalSpent,
      average_spend: averageSpend,
      visit_count: expenses.length,
      impulse_percentage: impulsePercentage,
      frequency_days: frequencyDays,
      last_visit: dates[0],
      categories: [...new Set(expenses.map(exp => exp.category))]
    }

    await supabase
      .from("merchants")
      .update({
        avg_monthly_spend: averageSpend,
        insights
      })
      .eq("id", merchantId)

    return {
      merchant,
      insights
    }
  } catch (error) {
    console.error("Unexpected error in getMerchantIntelligence:", error)
    return null
  }
}

// Get expenses with location data for map visualization
async function getExpensesWithLocationForMap() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return []
    }
    
    const user = await getAuthenticatedUser()

    if (!user) {
      return []
    }

    // Get expenses with location data
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        id,
        amount,
        category,
        description,
        location,
        spent_at,
        merchant_id,
        isImpulse
      `)
      .eq("user_id", user.id)
      .not("location", "is", null)
      .order("spent_at", { ascending: false })

    if (error) {
      console.error("Error fetching expenses with location:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Unexpected error in getExpensesWithLocation:", error)
    return []
  }
}

// Helper function to analyze recurring patterns
async function analyzeRecurringPattern(
  userId: string,
  description: string,
  amount: number,
  categoryId: string,
  date: string,
  frequency: string,
  intervals: number[],
  avgInterval: number,
  similarTransactions: any[]
) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return
    }
    
    // Calculate confidence based on consistency of intervals
    const stdDev = calculateStandardDeviation(intervals)
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev / avgInterval) * 50))

    // Calculate next expected date
    const lastDate = new Date(similarTransactions[0].date)
    let nextDate = new Date(lastDate)

    if (frequency === "weekly") {
      nextDate.setDate(lastDate.getDate() + 7)
    } else if (frequency === "bi-weekly") {
      nextDate.setDate(lastDate.getDate() + 14)
    } else if (frequency === "monthly") {
      nextDate.setMonth(lastDate.getMonth() + 1)
    } else if (frequency === "quarterly") {
      nextDate.setMonth(lastDate.getMonth() + 3)
    } else if (frequency === "yearly") {
      nextDate.setFullYear(lastDate.getFullYear() + 1)
    }

    // Check if pattern already exists
    const { data: existingPattern } = await supabase
      .from("recurring_patterns")
      .select("*")
      .eq("user_id", userId)
      .eq("merchant", description)
      .single()

    if (existingPattern) {
      // Update existing pattern
      await supabase
        .from("recurring_patterns")
        .update({
          amount,
          category_id: categoryId,
          frequency,
          confidence,
          last_transaction_date: date,
          next_expected_date: nextDate.toISOString().split("T")[0],
        })
        .eq("id", existingPattern.id)
    } else {
      // Create new pattern
      await supabase.from("recurring_patterns").insert({
        user_id: userId,
        merchant: description,
        category_id: categoryId,
        amount,
        frequency,
        confidence,
        last_transaction_date: date,
        next_expected_date: nextDate.toISOString().split("T")[0],
      })
    }
  } catch (error) {
    console.error("Error analyzing recurring pattern:", error)
  }
}

// Helper function to analyze time of day
async function analyzeTimeOfDay(
  userId: string,
  transactionId: string,
  timeOfDay: string,
  dayOfWeek: number
) {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return
    }

    // Determine if this is an impulse purchase based on time of day and day of week
    // This is a simple heuristic - evening and weekend purchases are more likely to be impulse
    const isImpulse =
      (timeOfDay === "evening" || timeOfDay === "night") && (dayOfWeek === 0 || dayOfWeek === 6)

    // Create time analysis record
    await supabase.from("time_analysis").insert({
      user_id: userId,
      transaction_id: transactionId,
      time_of_day: timeOfDay,
      day_of_week: getDayName(dayOfWeek),
      isImpulse,
    })

    // Update transaction with impulse flag
    await supabase
      .from("transactions")
      .update({ isImpulse })
      .eq("id", transactionId)
  } catch (error) {
    console.error("Error analyzing time of day:", error)
  }
}

// Helper function to update merchant intelligence
async function updateMerchantIntelligence(
  userId: string,
  merchant: string,
  amount: number,
  date: string,
  categoryId: string | null
) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check if merchant already exists
    const { data: existingMerchant } = await supabase
      .from("merchant_intelligence")
      .select("*")
      .eq("user_id", userId)
      .eq("merchant_name", merchant)
      .single()

    if (existingMerchant) {
      // Update existing merchant
      const visitCount = existingMerchant.visit_count || 1
      const newVisitCount = visitCount + 1
      const newAverageSpend = (existingMerchant.average_spend * visitCount + amount) / newVisitCount

      await supabase
        .from("merchant_intelligence")
        .update({
          category_id: categoryId,
          visit_count: newVisitCount,
          average_spend: newAverageSpend,
          last_visit_date: date,
        })
        .eq("id", existingMerchant.id)
    } else {
      // Create new merchant
      await supabase.from("merchant_intelligence").insert({
        user_id: userId,
        merchant_name: merchant,
        category_id: categoryId,
        visit_count: 1,
        average_spend: amount,
        last_visit_date: date,
      })
    }
  } catch (error) {
    console.error("Error updating merchant intelligence:", error)
  }
}

// Helper function to calculate standard deviation
function calculateStandardDeviation(values: number[]): number {
  const n = values.length
  const mean = values.reduce((sum, value) => sum + value, 0) / n
  const squareDiffs = values.map((value) => {
    const diff = value - mean
    return diff * diff
  })
  const avgSquareDiff = squareDiffs.reduce((sum, value) => sum + value, 0) / n
  return Math.sqrt(avgSquareDiff)
}

// Helper function to get day name
function getDayName(day: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  return days[day]
}

// Utility functions have been moved to lib/expense-utils.ts