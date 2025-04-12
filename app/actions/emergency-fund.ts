"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/supabase/database.types"

// Get the current user ID from the session
async function getCurrentUserId() {
  const cookieStore = cookies()
  const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // For demo purposes, use a fixed ID if no session
  return session?.user?.id || "123e4567-e89b-12d3-a456-426614174000"
}

export async function getEmergencyFund() {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.from("emergency_fund").select("*").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" error
    console.error("Error fetching emergency fund:", error)
    throw new Error("Failed to fetch emergency fund")
  }

  return data || null
}

export async function createOrUpdateEmergencyFund(formData: FormData) {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()

  const targetAmount = Number.parseFloat(formData.get("target_amount") as string)
  const monthlyContribution = Number.parseFloat(formData.get("monthly_contribution") as string)
  const monthlyExpenses = Number.parseFloat(formData.get("monthly_expenses") as string)

  // Check if emergency fund already exists
  const { data: existingFund } = await supabase
    .from("emergency_fund")
    .select("id, current_amount")
    .eq("user_id", userId)
    .single()

  if (existingFund) {
    // Update existing fund
    const { error } = await supabase
      .from("emergency_fund")
      .update({
        target_amount: targetAmount,
        monthly_contribution: monthlyContribution,
        monthly_expenses: monthlyExpenses,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingFund.id)

    if (error) {
      console.error("Error updating emergency fund:", error)
      throw new Error("Failed to update emergency fund")
    }

    revalidatePath("/emergency-fund")
    return { id: existingFund.id }
  } else {
    // Create new fund
    const fundId = uuidv4()
    const { error } = await supabase.from("emergency_fund").insert({
      id: fundId,
      user_id: userId,
      current_amount: 0,
      target_amount: targetAmount,
      monthly_contribution: monthlyContribution,
      monthly_expenses: monthlyExpenses,
    })

    if (error) {
      console.error("Error creating emergency fund:", error)
      throw new Error("Failed to create emergency fund")
    }

    revalidatePath("/emergency-fund")
    return { id: fundId }
  }
}

export async function addEmergencyFundTransaction(formData: FormData) {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()

  // Get the emergency fund ID
  const { data: fund } = await supabase
    .from("emergency_fund")
    .select("id, current_amount")
    .eq("user_id", userId)
    .single()

  if (!fund) {
    throw new Error("Emergency fund not found")
  }

  const amount = Number.parseFloat(formData.get("amount") as string)
  const transactionType = formData.get("transaction_type") as string
  const description = (formData.get("description") as string) || null
  const date = (formData.get("date") as string) || new Date().toISOString().split("T")[0]

  // Update the emergency fund balance
  const newAmount = transactionType === "deposit" ? fund.current_amount + amount : fund.current_amount - amount

  if (transactionType === "withdrawal" && newAmount < 0) {
    throw new Error("Withdrawal amount exceeds current balance")
  }

  // Begin transaction
  const transactionId = uuidv4()

  // Add transaction record
  const { error: transactionError } = await supabase.from("emergency_fund_transactions").insert({
    id: transactionId,
    emergency_fund_id: fund.id,
    amount,
    transaction_type: transactionType,
    description,
    date,
  })

  if (transactionError) {
    console.error("Error adding emergency fund transaction:", transactionError)
    throw new Error("Failed to add emergency fund transaction")
  }

  // Update fund balance
  const { error: updateError } = await supabase
    .from("emergency_fund")
    .update({
      current_amount: newAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fund.id)

  if (updateError) {
    console.error("Error updating emergency fund balance:", updateError)
    throw new Error("Failed to update emergency fund balance")
  }

  revalidatePath("/emergency-fund")
  return { id: transactionId }
}

export async function getEmergencyFundTransactions(limit = 10) {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()

  // Get the emergency fund ID
  const { data: fund } = await supabase.from("emergency_fund").select("id").eq("user_id", userId).single()

  if (!fund) {
    return []
  }

  const { data, error } = await supabase
    .from("emergency_fund_transactions")
    .select("*")
    .eq("emergency_fund_id", fund.id)
    .order("date", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching emergency fund transactions:", error)
    throw new Error("Failed to fetch emergency fund transactions")
  }

  return data || []
}

export async function calculateEmergencyFundProgress() {
  const userId = await getCurrentUserId()
  const supabase = await createServerSupabaseClient()

  const { data: fund } = await supabase.from("emergency_fund").select("*").eq("user_id", userId).single()

  if (!fund) {
    return {
      currentAmount: 0,
      targetAmount: 0,
      monthsOfExpenses: 0,
      percentComplete: 0,
      monthlyContribution: 0,
      monthsToTarget: 0,
    }
  }

  const monthsOfExpenses = fund.monthly_expenses > 0 ? fund.current_amount / fund.monthly_expenses : 0

  const percentComplete = fund.target_amount > 0 ? (fund.current_amount / fund.target_amount) * 100 : 0

  const monthsToTarget =
    fund.monthly_contribution > 0 ? (fund.target_amount - fund.current_amount) / fund.monthly_contribution : 0

  return {
    currentAmount: fund.current_amount,
    targetAmount: fund.target_amount,
    monthsOfExpenses,
    percentComplete,
    monthlyContribution: fund.monthly_contribution,
    monthsToTarget,
  }
}

