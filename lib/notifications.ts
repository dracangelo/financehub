"use server"

import { createNotification, getNotificationTypes } from "@/app/actions/notifications"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * Utility function to create notifications for various events in the application
 */
export async function notify({
  type,
  message
}: {
  type: string;
  message: string;
}) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, error: "User not authenticated" }
    }
    
    // Get notification types
    const { types, error: typesError } = await getNotificationTypes()
    
    if (typesError || types.length === 0) {
      console.error("Error getting notification types:", typesError)
      return { success: false, error: "Failed to get notification types" }
    }
    
    // Find the notification type ID based on the type name
    const notificationType = types.find(t => t.name === type) || types[0]
    
    const result = await createNotification({
      userId: user.id,
      notificationTypeId: notificationType.id,
      message
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
    type: "General Alert",
    message: `${companyName} (${ticker}) is now ${isAboveTarget ? "above" : "below"} your target price of $${targetPrice.toFixed(2)} at $${currentPrice.toFixed(2)}.`
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
    type: "General Alert",
    message: isOverBudget
      ? `You've spent $${spentAmount.toFixed(2)} on ${category}, which is $${(spentAmount - budgetAmount).toFixed(2)} over your budget of $${budgetAmount.toFixed(2)}.`
      : `You've spent $${spentAmount.toFixed(2)} on ${category}, which is ${percentage}% of your budget of $${budgetAmount.toFixed(2)}.`
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
    type: "Reminder",
    message: isDue
      ? `Your payment of $${amount.toFixed(2)} for ${expenseName} is due today.`
      : `Your payment of $${amount.toFixed(2)} for ${expenseName} is due in ${daysUntilDue} days on ${new Date(dueDate).toLocaleDateString()}.`
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
    type: "Reminder",
    message: isDue
      ? `Your bill of $${amount.toFixed(2)} for ${billName} is due today.`
      : `Your bill of $${amount.toFixed(2)} for ${billName} is due in ${daysUntilDue} days on ${new Date(dueDate).toLocaleDateString()}.`
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
      type: "General Alert",
      message: `You've received a dividend payment of $${amount.toFixed(2)} from ${investmentName}.`
    })
  } else {
    return notify({
      type: "General Alert",
      message: `Your investment in ${investmentName} has ${isPositive ? "increased" : "decreased"} by ${percentageChange}% (${isPositive ? "+" : "-"}$${amount.toFixed(2)}).`
    })
  }
}
