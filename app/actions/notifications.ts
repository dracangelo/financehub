"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Types
export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link?: string
  data?: any
  read: boolean
  emailed: boolean
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  watchlist_alerts: boolean
  budget_alerts: boolean
  expense_reminders: boolean
  bill_reminders: boolean
  investment_updates: boolean
  created_at: string
  updated_at: string
}

interface CreateNotificationParams {
  userId: string
  type: string
  title: string
  message: string
  link?: string
  data?: any
}

interface SendEmailParams {
  userId: string
  subject: string
  message: string
  html?: string
}

// Get user's notifications
export async function getNotifications() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { notifications: [], error: "User not authenticated" }
    }
    
    // Get notifications
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
    
    if (error) {
      console.error("Error fetching notifications:", error)
      return { notifications: [], error: error.message }
    }
    
    return { notifications: data as Notification[], error: null }
  } catch (error) {
    console.error("Unexpected error in getNotifications:", error)
    return { notifications: [], error: "An unexpected error occurred" }
  }
}

// Create a new notification
export async function createNotification(params: CreateNotificationParams) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        data: params.data,
        read: false,
        emailed: false
      })
      .select()
    
    if (error) {
      console.error("Error creating notification:", error)
      return { notification: null, error: error.message }
    }
    
    // Check notification preferences to see if we should send an email
    try {
      const { data: prefs, error: prefsError } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", params.userId)
        .single()
      
      if (!prefsError && prefs) {
        // Check if email notifications are enabled for this type
        const shouldSendEmail = prefs.email_notifications && 
          (
            (params.type.includes("watchlist") && prefs.watchlist_alerts) ||
            (params.type.includes("budget") && prefs.budget_alerts) ||
            (params.type.includes("expense") && prefs.expense_reminders) ||
            (params.type.includes("bill") && prefs.bill_reminders) ||
            (params.type.includes("investment") && prefs.investment_updates)
          )
        
        if (shouldSendEmail) {
          // Send email notification
          await sendEmailNotification({
            userId: params.userId,
            subject: params.title,
            message: params.message,
            html: `<p>${params.message}</p>${params.link ? `<p><a href="${process.env.NEXT_PUBLIC_BASE_URL}${params.link}">View in FinanceHub</a></p>` : ''}`
          })
          
          // Mark notification as emailed
          await supabase
            .from("notifications")
            .update({ emailed: true })
            .eq("id", data[0].id)
        }
      }
    } catch (prefsError) {
      console.error("Error checking notification preferences:", prefsError)
      // Continue without sending email
    }
    
    revalidatePath("/notifications")
    return { notification: data[0] as Notification, error: null }
  } catch (error) {
    console.error("Unexpected error in createNotification:", error)
    return { notification: null, error: "An unexpected error occurred" }
  }
}

// Mark a notification as read
export async function markNotificationAsRead(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, error: "User not authenticated" }
    }
    
    const { error } = await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
    
    if (error) {
      console.error("Error marking notification as read:", error)
      return { success: false, error: error.message }
    }
    
    revalidatePath("/notifications")
    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error in markNotificationAsRead:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, error: "User not authenticated" }
    }
    
    const { error } = await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("read", false)
    
    if (error) {
      console.error("Error marking all notifications as read:", error)
      return { success: false, error: error.message }
    }
    
    revalidatePath("/notifications")
    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error in markAllNotificationsAsRead:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Delete a notification
export async function deleteNotification(id: string) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, error: "User not authenticated" }
    }
    
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
    
    if (error) {
      console.error("Error deleting notification:", error)
      return { success: false, error: error.message }
    }
    
    revalidatePath("/notifications")
    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error in deleteNotification:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Get user's notification preferences
export async function getNotificationPreferences() {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { preferences: null, error: "User not authenticated" }
    }
    
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()
    
    if (error) {
      console.error("Error fetching notification preferences:", error)
      // If no preferences exist yet, create default preferences
      if (error.code === "PGRST116") {
        const defaultPreferences = {
          user_id: user.id,
          email_notifications: true,
          push_notifications: true,
          watchlist_alerts: true,
          budget_alerts: true,
          expense_reminders: true,
          bill_reminders: true,
          investment_updates: true
        };
        
        const { data: newPrefs, error: insertError } = await supabase
          .from("notification_preferences")
          .insert(defaultPreferences)
          .select()
          .single();
          
        if (insertError) {
          console.error("Error creating default preferences:", insertError);
          return { preferences: null, error: insertError.message };
        }
        
        return { preferences: newPrefs as NotificationPreferences, error: null };
      }
      
      return { preferences: null, error: error.message }
    }
    
    return { preferences: data as NotificationPreferences, error: null }
  } catch (error) {
    console.error("Unexpected error in getNotificationPreferences:", error)
    return { preferences: null, error: "An unexpected error occurred" }
  }
}

// Update user's notification preferences
export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, error: "User not authenticated" }
    }
    
    // Remove id and user_id from the update
    const { id, user_id, created_at, updated_at, ...updateData } = preferences as any
    
    const { error } = await supabase
      .from("notification_preferences")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
    
    if (error) {
      console.error("Error updating notification preferences:", error)
      return { success: false, error: error.message }
    }
    
    revalidatePath("/notifications")
    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error in updateNotificationPreferences:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Send an email notification
export async function sendEmailNotification(params: SendEmailParams) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get user's email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", params.userId)
      .single()
    
    if (userError) {
      // Try to get email from auth.users
      const { data, error } = await supabase.auth.admin.getUserById(params.userId)
      
      if (error || !data || !data.user) {
        console.error("Error getting user email:", error || "User not found")
        return { success: false, error: "User not found" }
      }
      
      // Use email from auth.users
      const userEmail = data.user.email
      
      if (!userEmail) {
        return { success: false, error: "User email not found" }
      }
      
      // For development, just log the email instead of sending it
      console.log(`[DEV] Would send email to ${userEmail}:`, {
        subject: params.subject,
        content: params.html || params.message
      });
      
      return { success: true, error: null }
    }
    
    const userEmail = userData.email
    
    if (!userEmail) {
      return { success: false, error: "User email not found" }
    }
    
    // For development, just log the email instead of sending it
    console.log(`[DEV] Would send email to ${userEmail}:`, {
      subject: params.subject,
      content: params.html || params.message
    });
    
    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error in sendEmailNotification:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
