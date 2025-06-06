"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getAuthenticatedUser } from "@/lib/auth"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function getBudgets() {
  console.log("SERVER_SIDE getBudgets - Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SERVER_SIDE getBudgets - Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Loaded" : "NOT LOADED OR EMPTY");
  try {
    console.log("Starting getBudgets function")
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return []
    }

    // Get the current user with the secure method
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      console.error("Error getting authenticated user:", userError || "No user found")
      return []
    }
    
    const user = userData.user

    console.log("Authenticated user ID:", user.id)

    // First get all budgets for the user
    console.log("Fetching budgets for user ID:", user.id)
    const { data: budgets, error: budgetsError } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })

    if (budgetsError) {
      console.error("Error fetching budgets:", budgetsError)
      return []
    }

    console.log("Budgets found:", budgets?.length || 0)

    if (!budgets || budgets.length === 0) {
      console.log("No budgets found, returning empty array")
      return []
    }

    // Then get all categories for these budgets
    const budgetIds = budgets.map(budget => budget.id)
    console.log("Budget IDs to fetch categories for:", budgetIds)
    
    try {
      console.log("Attempting to fetch budget categories")
      
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("budget_categories")
        .select("*")
        .in("budget_id", budgetIds)

      console.log("Categories query completed")

      if (categoriesError) {
        console.error("Error fetching budget categories:", categoriesError)
        // Still return budgets even if categories fail
        return budgets
      }

      const categories = categoriesData || []
      console.log("Categories found:", categories.length)
      
      if (categories.length === 0) {
        console.log("No categories found for these budgets.")
        return budgets
      } else {
        console.log("Sample category data:", categories[0])
      }

      // Get budget items for all categories
      const categoryIds = categories.map(category => category.id);
      console.log("Category IDs for fetching items:", categoryIds);

      let itemsData: any[] = [];
      let itemsError: any = null;

      if (categoryIds.length > 0) {
        const { data, error } = await supabase
          .from("budget_items")
          .select("*")
          .in("category_id", categoryIds);
        itemsData = data || [];
        itemsError = error;
      } else {
        console.log("No category IDs found, skipping budget_items fetch.");
      }

      if (itemsError) {
        console.error("Error fetching budget items:", itemsError);
        console.error("Error fetching budget items (stringified):", JSON.stringify(itemsError, null, 2));
      }

      const items = itemsData; // Already defaulted to [] if query skipped or data is null
      console.log(`Found ${items.length} budget items for all categories`)

      // Group categories by budget_id
      const categoriesByBudget: { [key: string]: any[] } = {}
      categories.forEach(category => {
        if (!categoriesByBudget[category.budget_id]) {
          categoriesByBudget[category.budget_id] = []
        }
        categoriesByBudget[category.budget_id].push(category)
      })

      // Group items by category_id
      const itemsByCategory: { [key: string]: any[] } = {}
      items.forEach(item => {
        if (!itemsByCategory[item.category_id]) {
          itemsByCategory[item.category_id] = []
        }
        itemsByCategory[item.category_id].push(item)
      })

      // Process each budget to include its categories and items
      const processedBudgets = budgets.map(budget => {
        const rawBudgetCategoriesForThisBudget = categoriesByBudget[budget.id] || [];
        console.log(`Processing budget ${budget.id} with ${rawBudgetCategoriesForThisBudget.length} raw budget_categories entries`);

        // Prepare the nested structure for display (if BudgetList needs it)
        const parentDisplayCategories = rawBudgetCategoriesForThisBudget.filter(cat => !cat.parent_category_id);
        const subDisplayCategories = rawBudgetCategoriesForThisBudget.filter(cat => cat.parent_category_id);

        const subDisplayCategoriesByParent: { [key: string]: any[] } = {};
        subDisplayCategories.forEach(subcat => {
          if (subcat.parent_category_id) { // Ensure parent_category_id exists
            if (!subDisplayCategoriesByParent[subcat.parent_category_id]) {
              subDisplayCategoriesByParent[subcat.parent_category_id] = [];
            }
            subDisplayCategoriesByParent[subcat.parent_category_id].push(subcat);
          }
        });

        const itemsByParentDisplayCategory: { [key: string]: any[] } = {};
        parentDisplayCategories.forEach(pCat => {
          itemsByParentDisplayCategory[pCat.id] = itemsByCategory[pCat.id] || [];
        });

        const itemsBySubDisplayCategory: { [key: string]: any[] } = {};
        subDisplayCategories.forEach(sCat => {
          itemsBySubDisplayCategory[sCat.id] = itemsByCategory[sCat.id] || [];
        });

        const displayCategoriesStructure = parentDisplayCategories.map(pCat => ({
          ...pCat, // Includes id, name, amount_allocated, budget_id, category_id, parent_category_id etc. from budget_categories table
          items: itemsByParentDisplayCategory[pCat.id] || [],
          subcategories: (subDisplayCategoriesByParent[pCat.id] || []).map(sCat => ({
            ...sCat, // Includes id, name, amount_allocated, budget_id, category_id, parent_category_id etc.
            items: itemsBySubDisplayCategory[sCat.id] || [],
          })),
        }));

        // Calculate total allocated amount
        let totalAllocated = 0
        
        // Organize subcategories under their parent categories
        const categoriesWithSubs = parentDisplayCategories.map(parent => {
          const children = subDisplayCategories.filter(sub => sub.parent_category_id === parent.id)
          const categoryItems = itemsByParentDisplayCategory[parent.id] || []
          
          // Calculate total amount for this category (from items or direct allocation)
          let categoryTotal = 0
          if (categoryItems.length > 0) {
            categoryTotal = categoryItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
          }
          
          totalAllocated += categoryTotal
          
          // Process subcategories
          const processedChildren = children.map(child => {
            const childItems = itemsBySubDisplayCategory[child.id] || []
            const childTotal = childItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
            totalAllocated += childTotal
            
            return {
              ...child,
              items: childItems,
              amount: childTotal
            }
          })
          
          return {
            ...parent,
            subcategories: processedChildren.length > 0 ? processedChildren : undefined,
            items: categoryItems,
            amount: categoryTotal
          }
        })
        
        return {
          ...budget,
          categories: categoriesWithSubs,
          total_allocated: totalAllocated
        }
      })

      return processedBudgets
    } catch (innerError) {
      console.error("Exception in categories fetch:", innerError)
      return budgets
    }
  } catch (error) {
    console.error("Unexpected error in getBudgets:", error)
    return []
  }
}

export async function getBudgetById(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // Get the current user with the secure method
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      throw new Error("Authentication required")
    }
    
    const user = userData.user

    // Get the budget
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select()
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (budgetError) {
      console.error("Error fetching budget:", budgetError)
      throw new Error("Failed to fetch budget")
    }

    if (!budget) {
      throw new Error("Budget not found")
    }

    // Get the budget categories
    console.log(`Fetching categories for budget ${id}`)
    const { data: categories, error: categoriesError } = await supabase
      .from("budget_categories")
      .select("id, name, parent_category_id, budget_id")
      .eq("budget_id", id)

    if (categoriesError) {
      console.error("Error fetching budget categories:", categoriesError)
      return budget
    }

    if (!categories || categories.length === 0) {
      console.log("No categories found for this budget")
      return {
        ...budget,
        categories: []
      }
    }

    console.log(`Found ${categories.length} categories for budget ${id}`)

    // Get budget items for all categories
    const categoryIds = categories.map(category => category.id)
    const { data: itemsData, error: itemsError } = await supabase
      .from("budget_items")
      .select("*")
      .in("category_id", categoryIds)

    if (itemsError) {
      console.error("Error fetching budget items:", itemsError)
    }

    const items = itemsData || []
    
    // Group items by category_id
    const itemsByCategory: { [key: string]: any[] } = {}
    items.forEach(item => {
      if (!itemsByCategory[item.category_id]) {
        itemsByCategory[item.category_id] = []
      }
      itemsByCategory[item.category_id].push(item)
    })

    // Separate parent categories and subcategories
    const parentCategories = categories.filter(cat => !cat.parent_category_id)
    const subcategories = categories.filter(cat => cat.parent_category_id)

    console.log(`Found ${parentCategories.length} parent categories and ${subcategories.length} subcategories`)

    // Organize subcategories under their parent categories
    const categoriesWithSubs = parentCategories.map(parent => {
      const children = subcategories.filter(sub => sub.parent_category_id === parent.id)
      const categoryItems = itemsByCategory[parent.id] || []
      
      // Calculate total amount for this category from items
      const categoryTotal = categoryItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
      
      // Calculate percentage for UI display based on budget income
      const percentage = budget.income > 0 ? (categoryTotal / budget.income) * 100 : 0
      
      return {
        ...parent,
        percentage: percentage, // Add percentage for UI
        amount: categoryTotal, // Add amount for UI compatibility
        items: categoryItems,
        subcategories: children.length > 0 ? children.map(child => {
          const childItems = itemsByCategory[child.id] || []
          const childTotal = childItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
          
          // Calculate subcategory percentage based on parent category amount
          const subPercentage = categoryTotal > 0 ? 
            (childTotal / categoryTotal) * 100 : 0
            
          return {
            ...child,
            percentage: subPercentage, // Add percentage for UI
            amount: childTotal, // Add amount for UI compatibility
            items: childItems
          }
        }) : []
      }
    })

    return {
      ...budget,
      categories: categoriesWithSubs
    }
  } catch (error) {
    console.error("Error in getBudgetById:", error)
    throw error
  }
}

export async function createBudget(budgetData: any) {
  try {
    console.log("Starting createBudget with data:", budgetData)
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // Get the current user with the secure method
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      throw new Error("Authentication required")
    }
    
    const user = userData.user

    // Prepare budget data for insertion based on new schema
    const budgetInsertData: {
      user_id: string;
      name: string;
      description?: string;
      model?: string;
      start_date: string;
      end_date: string;
      is_active?: boolean;
    } = {
      user_id: user.id,
      name: budgetData.name,
      start_date: budgetData.start_date,
      end_date: budgetData.end_date || new Date(new Date(budgetData.start_date).getTime() + 30*24*60*60*1000).toISOString().split('T')[0], // Default to 30 days after start date
      model: budgetData.model || 'traditional',
      is_active: true
      // Note: Budget amount will be stored in budget items, not in the budget table
    }
    
    // Add description if provided
    if (budgetData.description) {
      budgetInsertData.description = budgetData.description
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

    // Process and insert all categories and subcategories
    const allCategories = [];
    const categoryMap = new Map(); // Map to store category name to ID mapping
    const budgetItems = []; // Store all budget items
    
    // Extract parent categories and their subcategories
    console.log(`Processing ${budgetData.categories.length} categories for budget ${budget.id}`);
    
    // First pass: Create all main categories and build the mapping
    for (const category of budgetData.categories) {
      // Skip subcategories in the first pass - we'll handle them in the second pass
      if (category.parent_category_id) {
        continue;
      }
      
      // Log the category we're about to insert
      console.log(`Inserting main category: ${category.name}`);
      
      // Insert parent category - using the new schema fields
      const { data: budgetCategory, error: categoryError } = await supabase
        .from("budget_categories")
        .insert({
          budget_id: budget.id,
          name: category.name,
          description: category.description || null,
          parent_category_id: null // No parent for top-level categories
        })
        .select()
        .single()

      if (categoryError) {
        console.error("Error creating category:", categoryError)
        throw categoryError
      }
      
      console.log(`Successfully inserted main category with ID: ${budgetCategory.id}`);
      
      // Add to our collection of all categories
      allCategories.push(budgetCategory);
      
      // Store in our map for subcategory linking
      categoryMap.set(category.name, budgetCategory.id);
      
      // Create budget item for this category if it has an amount
      if (category.amount || category.amount_allocated) {
        const amount = category.amount || category.amount_allocated || 0;
        
        // Create budget item
        const { data: budgetItem, error: itemError } = await supabase
          .from("budget_items")
          .insert({
            category_id: budgetCategory.id,
            amount: amount,
            actual_amount: 0, // Default to 0 for new items
            notes: `Auto-created for category ${category.name}`
          })
          .select()
          .single()
          
        if (itemError) {
          console.error("Error creating budget item:", itemError)
          throw itemError
        }
        
        budgetItems.push(budgetItem);
      }
    }
    
    // Second pass: Create all subcategories using the parent IDs from the map
    for (const category of budgetData.categories) {
      // Only process subcategories in the second pass
      if (!category.parent_category_id) {
        continue;
      }
      
      // Get the parent ID - either from the provided parent_category_id or from our map
      let parentId = category.parent_category_id;
      if (typeof parentId === 'string' && !parentId.includes('-')) {
        // If it's a name rather than an ID, look it up in our map
        parentId = categoryMap.get(parentId);
      }
      
      if (!parentId) {
        console.error(`Parent category not found for subcategory ${category.name}`);
        continue; // Skip this subcategory if parent not found
      }
      
      console.log(`Inserting subcategory: ${category.name} under parent ID: ${parentId}`);
      
      const { data: insertedSubcategory, error: subcategoryError } = await supabase
        .from("budget_categories")
        .insert({
          budget_id: budget.id,
          parent_category_id: parentId, // Link to parent category
          name: category.name,
          description: category.description || null
        })
        .select()
        .single()

      if (subcategoryError) {
        console.error("Error creating subcategory:", subcategoryError)
        throw subcategoryError
      }
      
      console.log(`Successfully inserted subcategory with ID: ${insertedSubcategory.id}`);
      
      // Add to our collection of all categories
      allCategories.push(insertedSubcategory);
      
      // Create budget item for this subcategory if it has an amount
      if (category.amount || category.amount_allocated) {
        const amount = category.amount || category.amount_allocated || 0;
        
        // Create budget item
        const { data: budgetItem, error: itemError } = await supabase
          .from("budget_items")
          .insert({
            category_id: insertedSubcategory.id,
            amount: amount,
            actual_amount: 0, // Default to 0 for new items
            notes: `Auto-created for subcategory ${category.name}`
          })
          .select()
          .single()
          
        if (itemError) {
          console.error("Error creating budget item:", itemError)
          throw itemError
        }
        
        budgetItems.push(budgetItem);
      }
    }

    console.log(`Total categories saved: ${allCategories.length}`);
    console.log(`Total budget items saved: ${budgetItems.length}`);

    // Return the created budget with its categories and items
    return {
      ...budget,
      categories: allCategories,
      items: budgetItems
    }
  } catch (error) {
    console.error("Error in createBudget:", error)
    throw error
  }
}

export async function updateBudget(id: string, budgetData: any) {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // Get the current user with the secure method
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      throw new Error("Authentication required")
    }
    
    const user = userData.user

    // Verify budget belongs to user
    const { data: existingBudget, error: verifyError } = await supabase
      .from("budgets")
      .select()
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (verifyError || !existingBudget) {
      console.error("Error verifying budget ownership:", verifyError)
      throw verifyError || new Error("Budget not found or access denied")
    }

    // Prepare budget data for update based on new schema
    const budgetUpdateData: {
      name: string;
      description?: string;
      model?: string;
      start_date: string;
      end_date: string;
      is_active?: boolean;
    } = {
      name: budgetData.name,
      start_date: budgetData.start_date,
      end_date: budgetData.end_date || new Date(new Date(budgetData.start_date).getTime() + 30*24*60*60*1000).toISOString().split('T')[0] // Default to 30 days after start date
      // Note: Budget amount will be stored in budget items, not in the budget table
    }
    
    // Add optional fields if provided
    if (budgetData.description) {
      budgetUpdateData.description = budgetData.description
    }
    
    if (budgetData.model) {
      budgetUpdateData.model = budgetData.model
    }
    
    if (budgetData.is_active !== undefined) {
      budgetUpdateData.is_active = budgetData.is_active
    }
    
    // Update budget first
    const { data: updatedBudget, error: updateError } = await supabase
      .from("budgets")
      .update(budgetUpdateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating budget:", updateError)
      throw updateError
    }

    // Instead of deleting all categories, we'll fetch existing ones to preserve allocations
    const { data: existingCategories, error: fetchCategoriesError } = await supabase
      .from("budget_categories")
      .select("*, budget_items(*)")
      .eq("budget_id", id)

    if (fetchCategoriesError) {
      console.error("Error fetching existing categories:", fetchCategoriesError)
      throw fetchCategoriesError
    }
    
    // Create a map of existing categories with their allocations for quick lookup
    const existingCategoryMap = new Map();
    existingCategories?.forEach(category => {
      // Calculate total allocation from budget items
      const totalAllocation = category.budget_items?.reduce((sum: number, item: { amount: string | number }) => sum + (parseFloat(String(item.amount)) || 0), 0) || 0;
      existingCategoryMap.set(category.id, {
        ...category,
        amount_allocated: totalAllocation
      });
    });

    // Identify categories to be removed
    const incomingCategoryIdsFromPayload = new Set(budgetData.categories.map((c: any) => c.id).filter((id: any) => id));

    if (existingCategories) {
      for (const existingCat of existingCategories) {
        if (!incomingCategoryIdsFromPayload.has(existingCat.id)) {
          console.log(`Category ${existingCat.name} (ID: ${existingCat.id}) is marked for deletion from budget ${id}`);
          
          // First, delete its budget_items
          const { error: deleteItemsError } = await supabase
            .from("budget_items")
            .delete()
            .eq("category_id", existingCat.id);

          if (deleteItemsError) {
            console.error(`Error deleting items for category ${existingCat.id}:`, deleteItemsError);
            // Potentially throw error or handle, for now, we log and continue
          }

          // Then, delete the budget_category itself
          const { error: deleteCategoryError } = await supabase
            .from("budget_categories")
            .delete()
            .eq("id", existingCat.id);

          if (deleteCategoryError) {
            console.error(`Error deleting budget_category ${existingCat.id}:`, deleteCategoryError);
            // Potentially throw error or handle
          }
        }
      }
    }

    // Process and insert/update all categories and subcategories from the payload
    const allCategories = [];
    
    console.log(`Processing ${budgetData.categories.length} categories from payload for budget ${id}`);
    
    for (const category of budgetData.categories) {
      // Check if this category already exists
      const existingCategory = category.id ? existingCategoryMap.get(category.id) : null;
      
      // Determine the amount to use - prioritize the incoming amount, but fall back to existing amount
      let categoryAmount = parseFloat(category.amount || category.amount_allocated || 0);
      
      // If we have an existing category and the new amount is 0, use the existing amount
      if (existingCategory && categoryAmount === 0) {
        categoryAmount = existingCategory.amount_allocated || 0;
      }
      
      console.log(`Processing category: ${category.name} with amount ${categoryAmount}`);
      
      // If the category exists, update it; otherwise, insert a new one
      let budgetCategory;
      
      if (existingCategory) {
        // Update the existing category
        const { data: updatedCategory, error: updateError } = await supabase
          .from("budget_categories")
          .update({
            name: category.name,
            description: category.description || null,
            parent_category_id: null, // No parent for top-level categories
          })
          .eq("id", existingCategory.id)
          .select()
          .single();
          
        if (updateError) {
          console.error("Error updating category:", updateError);
          throw updateError;
        }
        
        budgetCategory = updatedCategory;
        console.log(`Updated existing category with ID: ${budgetCategory.id}`);
      } else {
        // Insert a new category
        const { data: newCategory, error: insertError } = await supabase
          .from("budget_categories")
          .insert({
            budget_id: id,
            name: category.name,
            description: category.description || null,
            parent_category_id: null, // No parent for top-level categories
          })
          .select()
          .single();
          
        if (insertError) {
          console.error("Error creating category:", insertError);
          throw insertError;
        }
        
        budgetCategory = newCategory;
        console.log(`Created new category with ID: ${budgetCategory.id}`);
      }
      
      // Add to our collection of all categories
      allCategories.push(budgetCategory);
      
      // Handle budget items for this category
      if (categoryAmount > 0) {
        // Check if there's an existing budget item for this category
        const existingItems = existingCategory?.budget_items || [];
        
        if (existingItems.length > 0) {
          // Update the first existing item
          const { error: updateItemError } = await supabase
            .from("budget_items")
            .update({
              amount: categoryAmount,
              notes: `Updated for category ${category.name}`
            })
            .eq("id", existingItems[0].id);
            
          if (updateItemError) {
            console.error("Error updating budget item:", updateItemError);
            throw updateItemError;
          }
          
          console.log(`Updated budget item with amount ${categoryAmount} for category ${category.name}`);
        } else {
          // Create a new budget item
          const { error: insertItemError } = await supabase
            .from("budget_items")
            .insert({
              category_id: budgetCategory.id,
              amount: categoryAmount,
              actual_amount: 0, // Default to 0 for new items
              notes: `Auto-created for category ${category.name}`
            });
            
          if (insertItemError) {
            console.error("Error creating budget item:", insertItemError);
            throw insertItemError;
          }
          
          console.log(`Created budget item with amount ${categoryAmount} for category ${category.name}`);
        }
      }

      // Insert subcategories if they exist
      if (category.subcategories && category.subcategories.length > 0) {
        console.log(`Processing ${category.subcategories.length} subcategories for category ${budgetCategory.id}`);
        
        for (const subcategory of category.subcategories) {
          const subCategoryAmount = parseFloat(subcategory.amount || subcategory.amount_allocated || 0);
          console.log(`Inserting subcategory: ${subcategory.name} with amount ${subCategoryAmount}`);
          
          const { data: insertedSubcategory, error: subcategoryError } = await supabase
            .from("budget_categories")
            .insert({
              budget_id: id,
              parent_category_id: budgetCategory.id, // Link to parent category
              name: subcategory.name,
              description: subcategory.description || null,
              // No category_id as it might not exist in our schema
              id: subcategory.id || undefined // Preserve original ID if it exists
            })
            .select()
            .single()

          if (subcategoryError) {
            console.error("Error creating subcategory:", subcategoryError)
            throw subcategoryError
          }
          
          console.log(`Successfully inserted subcategory with ID: ${insertedSubcategory?.id || 'unknown'}`);
          
          // Create budget item for this subcategory to store the amount
          if (subCategoryAmount > 0) {
            const { data: budgetItem, error: itemError } = await supabase
              .from("budget_items")
              .insert({
                category_id: insertedSubcategory.id,
                amount: subCategoryAmount,
                actual_amount: 0, // Default to 0 for new items
                notes: `Auto-created for subcategory ${subcategory.name}`
              })
              .select()
              .single()
              
            if (itemError) {
              console.error("Error creating budget item for subcategory:", itemError)
              throw itemError
            }
            
            console.log(`Created budget item with amount ${subCategoryAmount} for subcategory ${subcategory.name}`);
          }
        }
      }
    }

    console.log(`Total categories saved: ${allCategories.length}`);

    // Return the updated budget with its categories
    return {
      ...updatedBudget,
      budget_categories: allCategories
    }
  } catch (error) {
    console.error("Error in updateBudget:", error)
    throw error
  }
}

export async function deleteBudget(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // Get the current user with the secure method
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      throw new Error("Authentication required")
    }
    
    const user = userData.user

    // Verify budget belongs to user
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (budgetError || !budget) {
      console.error("Error verifying budget ownership:", budgetError)
      throw budgetError || new Error("Budget not found or access denied")
    }

    // Delete the budget - this should cascade to categories and items due to foreign key constraints
    const { error: deleteError } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Error deleting budget:", deleteError)
      throw deleteError
    }

    // Revalidate paths
    revalidatePath("/budgets")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteBudget:", error)
    throw error
  }
}

// Add missing budget category functions

/**
 * Creates a new budget category
 */
export async function createBudgetCategory(data: {
  budget_id: string;
  category_id: string;
  amount_allocated: number;
}) {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // Get the current user with the secure method
    const user = await getAuthenticatedUser()
    
    if (!user) {
      throw new Error("Authentication required")
    }

    // Verify budget belongs to user
    const { data: budget, error: budgetError } = await supabase
      .from("budgets")
      .select("*")
      .eq("id", data.budget_id)
      .eq("user_id", user.id)
      .single()

    if (budgetError || !budget) {
      console.error("Error verifying budget ownership:", budgetError)
      throw budgetError || new Error("Budget not found or access denied")
    }

    // Create the budget category
    const { data: budgetCategory, error: createError } = await supabase
      .from("budget_categories")
      .insert({
        budget_id: data.budget_id,
        category_id: data.category_id,
        amount_allocated: data.amount_allocated
      })
      .select("*, categories(*)")
      .single()

    if (createError) {
      console.error("Error creating budget category:", createError)
      throw createError
    }

    // Revalidate paths
    revalidatePath(`/budgets/${data.budget_id}`)
    revalidatePath("/budgets")
    revalidatePath("/dashboard")

    return budgetCategory
  } catch (error) {
    console.error("Error in createBudgetCategory:", error)
    throw error
  }
}

/**
 * Updates an existing budget category
 */
export async function updateBudgetCategory(id: string, data: {
  amount_allocated: number;
}) {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // Get the current user with the secure method
    const user = await getAuthenticatedUser()
    
    if (!user) {
      throw new Error("Authentication required")
    }

    // Get the budget category to verify ownership
    const { data: categoryData, error: categoryError } = await supabase
      .from("budget_categories")
      .select("*, budgets!inner(user_id)")
      .eq("id", id)
      .single()

    if (categoryError || !categoryData) {
      console.error("Error fetching budget category:", categoryError)
      throw categoryError || new Error("Budget category not found")
    }

    // Verify the budget belongs to the user
    if (categoryData.budgets.user_id !== user.id) {
      throw new Error("Unauthorized: This budget does not belong to you")
    }

    // Update the budget category
    const { data: updatedCategory, error: updateError } = await supabase
      .from("budget_categories")
      .update({
        amount_allocated: data.amount_allocated,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select("*, categories(*)")
      .single()

    if (updateError) {
      console.error("Error updating budget category:", updateError)
      throw updateError
    }

    // Get the budget ID for path revalidation
    const budgetId = categoryData.budget_id

    // Revalidate paths
    revalidatePath(`/budgets/${budgetId}`)
    revalidatePath("/budgets")
    revalidatePath("/dashboard")

    return updatedCategory
  } catch (error) {
    console.error("Error in updateBudgetCategory:", error)
    throw error
  }
}

/**
 * Deletes a budget category
 */
export async function deleteBudgetCategory(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      throw new Error("Failed to create Supabase client")
    }

    // Get the current user with the secure method
    const user = await getAuthenticatedUser()
    
    if (!user) {
      throw new Error("Authentication required")
    }

    // Get the budget category to verify ownership and get budget_id for revalidation
    const { data: categoryData, error: categoryError } = await supabase
      .from("budget_categories")
      .select("*, budgets!inner(user_id)")
      .eq("id", id)
      .single()

    if (categoryError || !categoryData) {
      console.error("Error fetching budget category:", categoryError)
      throw categoryError || new Error("Budget category not found")
    }

    // Verify the budget belongs to the user
    if (categoryData.budgets.user_id !== user.id) {
      throw new Error("Unauthorized: This budget does not belong to you")
    }

    // Store the budget ID for path revalidation
    const budgetId = categoryData.budget_id

    // Delete the budget category
    const { error: deleteError } = await supabase
      .from("budget_categories")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Error deleting budget category:", deleteError)
      throw deleteError
    }

    // Revalidate paths
    revalidatePath(`/budgets/${budgetId}`)
    revalidatePath("/budgets")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteBudgetCategory:", error)
    throw error
  }
}
