"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getAuthenticatedUser } from "@/lib/auth"

export async function getAccounts() {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase.from("accounts").select("*").eq("user_id", user.id).order("name")

  if (error) {
    console.error("Error fetching accounts:", error)
    return []
  }

  return data
}

export async function getAccountById(id: string) {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase.from("accounts").select("*").eq("id", id).eq("user_id", user.id).single()

  if (error) {
    console.error("Error fetching account:", error)
    return null
  }

  return data
}

export async function createAccount(formData: FormData) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get the user directly from Supabase auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      throw new Error("Authentication required")
    }

    // Log the user ID to verify it's in the correct format
    console.log("User ID:", user.id)
    
    // Check if the user ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(user.id)) {
      console.error("Invalid user ID format:", user.id)
      throw new Error("Invalid user ID format")
    }

    // Extract form data
    const name = formData.get("name") as string
    const type = formData.get("type") as string
    const balance = Number(formData.get("balance")) || 0
    const currency = (formData.get("currency") as string) || "USD"
    const institution = (formData.get("institution") as string) || ""
    const accountNumber = (formData.get("account_number") as string) || ""
    const notes = (formData.get("notes") as string) || ""
    const isActive = formData.get("is_active") === "true"

    // Validate required fields
    if (!name || !type) {
      throw new Error("Name and type are required")
    }

    // Log the data being inserted
    console.log("Creating account with data:", {
      user_id: user.id,
      name,
      type,
      balance,
      currency,
      institution,
      account_number: accountNumber,
      notes,
      is_active: isActive,
    })

    // Create account
    const { data, error } = await supabase
      .from("accounts")
      .insert({
        user_id: user.id,
        name,
        type,
        balance,
        currency,
        institution,
        account_number: accountNumber,
        notes,
        is_active: isActive,
      })
      .select()

    if (error) {
      console.error("Error creating account:", error)
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      throw new Error(`Failed to create account: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error("No data returned after account creation")
    }

    // Revalidate accounts page
    revalidatePath("/accounts")

    return data[0]
  } catch (error) {
    console.error("Error in createAccount:", error)
    throw error
  }
}

export async function updateAccount(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  // Extract form data
  const name = formData.get("name") as string
  const type = formData.get("type") as string
  const balance = Number.parseFloat(formData.get("balance") as string) || 0
  const currency = (formData.get("currency") as string) || "USD"
  const institution = (formData.get("institution") as string) || ""
  const accountNumber = (formData.get("account_number") as string) || ""
  const color = (formData.get("color") as string) || "#888888"
  const notes = (formData.get("notes") as string) || ""
  const isActive = formData.get("is_active") === "true"

  // Validate required fields
  if (!name || !type) {
    throw new Error("Name and type are required")
  }

  // Update account
  const { data, error } = await supabase
    .from("accounts")
    .update({
      name,
      type,
      balance,
      currency,
      institution,
      account_number: accountNumber,
      color,
      notes,
      is_active: isActive,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()

  if (error) {
    console.error("Error updating account:", error)
    throw new Error("Failed to update account")
  }

  // Revalidate accounts page
  revalidatePath("/accounts")

  return data[0]
}

export async function deleteAccount(id: string) {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  // Delete account
  const { error } = await supabase.from("accounts").delete().eq("id", id).eq("user_id", user.id)

  if (error) {
    console.error("Error deleting account:", error)
    throw new Error("Failed to delete account")
  }

  // Revalidate accounts page
  revalidatePath("/accounts")
}

export async function getAccountSummary() {
  const supabase = await createServerSupabaseClient()

  const user = await getAuthenticatedUser()

  if (!user) {
    return {
      totalBalance: 0,
      accountCount: 0,
      currencyBreakdown: {},
      typeBreakdown: {}
    }
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("type, balance, currency")
    .eq("user_id", user.id)
    .eq("is_active", true)

  if (error) {
    console.error("Error fetching account summary:", error)
    return {
      totalBalance: 0,
      accountCount: 0,
      currencyBreakdown: {},
      typeBreakdown: {}
    }
  }

  // Calculate total balance across all accounts
  let totalBalance = 0;
  const currencyBreakdown: Record<string, number> = {};
  const typeBreakdown: Record<string, number> = {};

  // Process the data
  data.forEach(account => {
    // Add to total balance (note: this assumes all currencies are converted to a base currency)
    totalBalance += account.balance;

    // Add to currency breakdown
    if (!currencyBreakdown[account.currency]) {
      currencyBreakdown[account.currency] = 0;
    }
    currencyBreakdown[account.currency] += account.balance;

    // Add to type breakdown
    if (!typeBreakdown[account.type]) {
      typeBreakdown[account.type] = 0;
    }
    typeBreakdown[account.type] += account.balance;
  });

  return {
    totalBalance,
    accountCount: data.length,
    currencyBreakdown,
    typeBreakdown
  }
}

