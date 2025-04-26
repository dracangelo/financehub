"use server"

import { createNotification } from "@/app/actions/notifications"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * Utility function to create notifications for various events in the application
 */
export async function notify({
  type,
  title,
  message,
  link,
  data
}: {
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: any;
}) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, error: "User not authenticated" }
    }
    
    const result = await createNotification({
      userId: user.id,
      type,
      title,
      message,
      link,
      data
    })
    
    return { success: !!result.notification, error: result.error }
  } catch (error) {
    console.error("Error creating notification:", error)
    return { success: false, error: "Failed to create notification" }
  }
}

/**
 * Create a watchlist notification when a price target is reached
 */
export async function notifyWatchlistAlert({
  ticker,
  companyName,
  currentPrice,
  targetPrice,
  isAboveTarget
}: {
  ticker: string;
  companyName: string;
  currentPrice: number;
  targetPrice: number;
  isAboveTarget: boolean;
}) {
  return notify({
    type: "watchlist_alert",
    title: `${ticker} ${isAboveTarget ? "Above" : "Below"} Target Price`,
    message: `${companyName} (${ticker}) is now ${isAboveTarget ? "above" : "below"} your target price of $${targetPrice.toFixed(2)} at $${currentPrice.toFixed(2)}.`,
    link: "/watchlist",
    data: { ticker, companyName, currentPrice, targetPrice, isAboveTarget }
  })
}

/**
 * Create a budget notification when a budget is over or approaching limit
 */
export async function notifyBudgetAlert({
  category,
  budgetAmount,
  spentAmount,
  percentage,
  isOverBudget
}: {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  isOverBudget: boolean;
}) {
  return notify({
    type: isOverBudget ? "budget_over_limit" : "budget_approaching_limit",
    title: isOverBudget ? `${category} Budget Exceeded` : `${category} Budget Approaching Limit`,
    message: isOverBudget
      ? `You've spent $${spentAmount.toFixed(2)} on ${category}, which is $${(spentAmount - budgetAmount).toFixed(2)} over your budget of $${budgetAmount.toFixed(2)}.`
      : `You've spent $${spentAmount.toFixed(2)} on ${category}, which is ${percentage}% of your budget of $${budgetAmount.toFixed(2)}.`,
    link: "/budgets",
    data: { category, budgetAmount, spentAmount, percentage, isOverBudget }
  })
}

/**
 * Create an expense reminder notification
 */
export async function notifyExpenseReminder({
  expenseName,
  dueDate,
  amount,
  isDue,
  daysUntilDue
}: {
  expenseName: string;
  dueDate: string;
  amount: number;
  isDue: boolean;
  daysUntilDue?: number;
}) {
  return notify({
    type: isDue ? "expense_due" : "expense_upcoming",
    title: isDue ? `${expenseName} Payment Due Today` : `${expenseName} Payment Due Soon`,
    message: isDue
      ? `Your payment of $${amount.toFixed(2)} for ${expenseName} is due today.`
      : `Your payment of $${amount.toFixed(2)} for ${expenseName} is due in ${daysUntilDue} days on ${new Date(dueDate).toLocaleDateString()}.`,
    link: "/expenses",
    data: { expenseName, dueDate, amount, isDue, daysUntilDue }
  })
}

/**
 * Create a bill reminder notification
 */
export async function notifyBillReminder({
  billName,
  dueDate,
  amount,
  isDue,
  daysUntilDue
}: {
  billName: string;
  dueDate: string;
  amount: number;
  isDue: boolean;
  daysUntilDue?: number;
}) {
  return notify({
    type: isDue ? "bill_due" : "bill_upcoming",
    title: isDue ? `${billName} Bill Due Today` : `${billName} Bill Due Soon`,
    message: isDue
      ? `Your bill of $${amount.toFixed(2)} for ${billName} is due today.`
      : `Your bill of $${amount.toFixed(2)} for ${billName} is due in ${daysUntilDue} days on ${new Date(dueDate).toLocaleDateString()}.`,
    link: "/bills",
    data: { billName, dueDate, amount, isDue, daysUntilDue }
  })
}

/**
 * Create an investment update notification
 */
export async function notifyInvestmentUpdate({
  investmentName,
  type,
  amount,
  percentageChange,
  isPositive
}: {
  investmentName: string;
  type: "dividend" | "performance";
  amount: number;
  percentageChange?: number;
  isPositive?: boolean;
}) {
  if (type === "dividend") {
    return notify({
      type: "investment_dividend",
      title: `Dividend Payment Received`,
      message: `You've received a dividend payment of $${amount.toFixed(2)} from ${investmentName}.`,
      link: "/investments",
      data: { investmentName, amount, type }
    })
  } else {
    return notify({
      type: "investment_performance",
      title: `${investmentName} ${isPositive ? "Up" : "Down"} ${percentageChange}%`,
      message: `Your investment in ${investmentName} has ${isPositive ? "increased" : "decreased"} by ${percentageChange}% (${isPositive ? "+" : "-"}$${amount.toFixed(2)}).`,
      link: "/investments",
      data: { investmentName, amount, percentageChange, isPositive, type }
    })
  }
}
