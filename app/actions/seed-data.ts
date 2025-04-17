"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"

export async function seedInitialData(userId: string) {
  const supabase = await createServerSupabaseClient()

  // Check if user already has data
  const { count: transactionCount } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  if (transactionCount && transactionCount > 0) {
    return { success: true, message: "Data already exists for this user" }
  }

  // Create default categories
  const expenseCategories = [
    { name: "Housing", color: "#FF5733", icon: "home" },
    { name: "Transportation", color: "#33A8FF", icon: "car" },
    { name: "Food", color: "#33FF57", icon: "utensils" },
    { name: "Utilities", color: "#FF33A8", icon: "bolt" },
    { name: "Insurance", color: "#A833FF", icon: "shield" },
    { name: "Healthcare", color: "#FF3333", icon: "heart" },
    { name: "Entertainment", color: "#33FFA8", icon: "film" },
    { name: "Personal", color: "#FFA833", icon: "user" },
    { name: "Education", color: "#3357FF", icon: "book" },
    { name: "Savings", color: "#57FF33", icon: "piggy-bank" },
    { name: "Debt", color: "#FF3357", icon: "credit-card" },
    { name: "Gifts", color: "#A8FF33", icon: "gift" },
    { name: "Travel", color: "#33FFA8", icon: "plane" },
  ]

  const incomeCategories = [
    { name: "Salary", color: "#33FF57", icon: "briefcase" },
    { name: "Freelance", color: "#33A8FF", icon: "laptop" },
    { name: "Investments", color: "#FFA833", icon: "chart-line" },
    { name: "Gifts", color: "#A8FF33", icon: "gift" },
    { name: "Other Income", color: "#33FFA8", icon: "plus-circle" },
  ]

  const categoryIds: Record<string, string> = {}

  // Insert expense categories
  for (const category of expenseCategories) {
    const id = uuidv4()
    categoryIds[category.name] = id

    await supabase.from("categories").insert({
      id,
      user_id: userId,
      name: category.name,
      color: category.color,
      icon: category.icon,
      is_income: false,
    })
  }

  // Insert income categories
  for (const category of incomeCategories) {
    const id = uuidv4()
    categoryIds[category.name] = id

    await supabase.from("categories").insert({
      id,
      user_id: userId,
      name: category.name,
      color: category.color,
      icon: category.icon,
      is_income: true,
    })
  }

  // Create default accounts
  const accounts = [
    { name: "Checking Account", type: "checking", balance: 2500, currency: "USD" },
    { name: "Savings Account", type: "savings", balance: 10000, currency: "USD" },
    { name: "Credit Card", type: "credit", balance: -1500, currency: "USD" },
  ]

  const accountIds: Record<string, string> = {}

  for (const account of accounts) {
    const id = uuidv4()
    accountIds[account.name] = id

    await supabase.from("accounts").insert({
      id,
      user_id: userId,
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      is_active: true,
    })
  }

  // Create sample transactions
  const today = new Date()
  const transactions = [
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
      description: "Grocery Store",
      amount: 78.52,
      category: "Food",
      account: "Checking Account",
      is_income: false,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
      description: "Salary Deposit",
      amount: 2500,
      category: "Salary",
      account: "Checking Account",
      is_income: true,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
      description: "Electric Bill",
      amount: 145.3,
      category: "Utilities",
      account: "Checking Account",
      is_income: false,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
      description: "Restaurant",
      amount: 65.2,
      category: "Food",
      account: "Credit Card",
      is_income: false,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10),
      description: "Gas Station",
      amount: 48.75,
      category: "Transportation",
      account: "Credit Card",
      is_income: false,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15),
      description: "Internet Bill",
      amount: 89.99,
      category: "Utilities",
      account: "Checking Account",
      is_income: false,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 20),
      description: "Freelance Payment",
      amount: 750,
      category: "Freelance",
      account: "Checking Account",
      is_income: true,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 22),
      description: "Movie Tickets",
      amount: 32.5,
      category: "Entertainment",
      account: "Credit Card",
      is_income: false,
    },
    {
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 25),
      description: "Savings Transfer",
      amount: 500,
      category: "Savings",
      account: "Savings Account",
      is_income: true,
    },
  ]

  for (const tx of transactions) {
    await supabase.from("transactions").insert({
      id: uuidv4(),
      user_id: userId,
      account_id: accountIds[tx.account],
      category_id: categoryIds[tx.category],
      date: tx.date.toISOString().split("T")[0],
      amount: tx.amount,
      description: tx.description,
      is_income: tx.is_income,
    })
  }

  // Create sample income sources
  const incomeSources = [
    {
      name: "Full-time Job",
      type: "primary",
      amount: 5000,
      frequency: "monthly",
      is_taxable: true,
      tax_category: "w2",
    },
    {
      name: "Freelance Work",
      type: "side-hustle",
      amount: 1500,
      frequency: "monthly",
      is_taxable: true,
      tax_category: "1099",
    },
    {
      name: "Dividend Income",
      type: "passive",
      amount: 200,
      frequency: "quarterly",
      is_taxable: true,
      tax_category: "dividends",
    },
  ]

  for (const source of incomeSources) {
    await supabase.from("income_sources").insert({
      id: uuidv4(),
      user_id: userId,
      name: source.name,
      type: source.type,
      amount: source.amount,
      frequency: source.frequency,
      currency: "USD",
      is_taxable: source.is_taxable,
      tax_category: source.tax_category,
    })
  }

  // Create emergency fund
  const emergencyFundId = uuidv4()
  await supabase.from("emergency_fund").insert({
    id: emergencyFundId,
    user_id: userId,
    current_amount: 5000,
    target_amount: 15000,
    monthly_contribution: 500,
    monthly_expenses: 3000,
  })

  // Add emergency fund transactions
  const emergencyFundTransactions = [
    {
      amount: 2000,
      transaction_type: "deposit",
      description: "Initial deposit",
      date: new Date(today.getFullYear(), today.getMonth() - 2, 15),
    },
    {
      amount: 1500,
      transaction_type: "deposit",
      description: "Monthly contribution",
      date: new Date(today.getFullYear(), today.getMonth() - 1, 10),
    },
    {
      amount: 1500,
      transaction_type: "deposit",
      description: "Monthly contribution",
      date: new Date(today.getFullYear(), today.getMonth(), 5),
    },
  ]

  for (const tx of emergencyFundTransactions) {
    await supabase.from("emergency_fund_transactions").insert({
      id: uuidv4(),
      emergency_fund_id: emergencyFundId,
      amount: tx.amount,
      transaction_type: tx.transaction_type,
      description: tx.description,
      date: tx.date.toISOString().split("T")[0],
    })
  }

  // Create asset classes
  const assetClasses = [
    { name: "US Stocks", targetAllocation: 40, currentAllocation: 0 },
    { name: "International Stocks", targetAllocation: 20, currentAllocation: 0 },
    { name: "Bonds", targetAllocation: 30, currentAllocation: 0 },
    { name: "Real Estate", targetAllocation: 5, currentAllocation: 0 },
    { name: "Cash", targetAllocation: 5, currentAllocation: 0 },
  ]

  const assetClassIds: Record<string, string> = {}

  for (const ac of assetClasses) {
    const id = uuidv4()
    assetClassIds[ac.name] = id

    await supabase.from("asset_classes").insert({
      id,
      user_id: userId,
      name: ac.name,
      target_allocation: ac.targetAllocation,
      current_allocation: ac.currentAllocation,
    })
  }

  // Create investments
  const investments = [
    {
      name: "Total US Stock Market ETF",
      ticker: "VTI",
      type: "etf",
      value: 50000,
      cost_basis: 45000,
      asset_class: "US Stocks",
      allocation: 100,
    },
    {
      name: "Total International Stock ETF",
      ticker: "VXUS",
      type: "etf",
      value: 25000,
      cost_basis: 27000,
      asset_class: "International Stocks",
      allocation: 100,
    },
    {
      name: "Total Bond Market ETF",
      ticker: "BND",
      type: "etf",
      value: 35000,
      cost_basis: 34000,
      asset_class: "Bonds",
      allocation: 100,
    },
    {
      name: "Real Estate ETF",
      ticker: "VNQ",
      type: "etf",
      value: 5000,
      cost_basis: 4800,
      asset_class: "Real Estate",
      allocation: 100,
    },
    {
      name: "High-Yield Savings Account",
      ticker: null,
      type: "cash",
      value: 10000,
      cost_basis: 10000,
      asset_class: "Cash",
      allocation: 100,
    },
  ]

  for (const inv of investments) {
    await supabase.from("investments").insert({
      id: uuidv4(),
      user_id: userId,
      name: inv.name,
      ticker: inv.ticker,
      type: inv.type,
      value: inv.value,
      cost_basis: inv.cost_basis,
      asset_class_id: assetClassIds[inv.asset_class],
      allocation: inv.allocation,
      currency: "USD",
    })
  }

  // Update asset class current allocations
  const totalPortfolioValue = investments.reduce((sum, inv) => sum + inv.value, 0)

  for (const ac of assetClasses) {
    const acInvestments = investments.filter((inv) => inv.asset_class === ac.name)
    const acValue = acInvestments.reduce((sum, inv) => sum + inv.value, 0)
    const currentAllocation = (acValue / totalPortfolioValue) * 100

    await supabase
      .from("asset_classes")
      .update({ current_allocation: currentAllocation })
      .eq("id", assetClassIds[ac.name])
  }

  return { success: true, message: "Initial data seeded successfully" }
}
