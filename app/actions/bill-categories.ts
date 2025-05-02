"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function getBillCategories() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { categories: [] }
    }

    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }

    // Fetch bill categories from the bill_categories table
    const { data: categories, error } = await supabase
      .from("bill_categories")
      .select("*")
      .order("name")

    if (error) {
      console.error("Error fetching bill categories:", error)
      throw new Error("Failed to fetch bill categories")
    }

    return { categories: categories || [] }
  } catch (error) {
    console.error("Error in getBillCategories:", error)
    return { categories: [] }
  }
}

export async function createBillCategory(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      throw new Error("Failed to initialize Supabase client")
    }

    const name = formData.get("name") as string
    if (!name) {
      throw new Error("Category name is required")
    }

    const description = formData.get("description") as string || ""
    const icon = formData.get("icon") as string || null

    const { data: category, error } = await supabase
      .from("bill_categories")
      .insert({
        name,
        description,
        icon
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating bill category:", error)
      throw new Error("Failed to create bill category")
    }

    return { category }
  } catch (error) {
    console.error("Error in createBillCategory:", error)
    throw new Error("Failed to create bill category")
  }
}
