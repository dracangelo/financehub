"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
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
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { notifications: [], error: "Database connection error" }
    }
    
    // Get current user
    const { data, error: userError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { notifications: [], error: "User not authenticated" }
    }
    
    // Get notifications
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
    
    if (error) {
      console.error("Error fetching notifications:", error)
      return { notifications: [], error: error.message }
    }
    
    return { notifications: notifications as Notification[], error: null }
  } catch (error) {
    console.error("Unexpected error in getNotifications:", error)
    return { notifications: [], error: "An unexpected error occurred" }
  }
}

// Create a new notification
export async function createNotification(params: CreateNotificationParams) {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Database connection error" }
    }

    // Create admin client to bypass RLS
    const adminClient = createAdminSupabaseClient()
    
    if (!adminClient) {
      console.error("Failed to create admin client")
      return { success: false, error: "Could not create notification" }
    }

    // Create notification using admin client
    const { data, error } = await adminClient
      .from("notifications")
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        data: params.data || null,
        read: false,
        emailed: false,
      })
      .select()
      .single()
    
    if (error) {
      console.error("Error creating notification:", error)
      return { success: false, error: error.message }
    }
    
    // Check if user wants email notifications
    const { data: preferences, error: prefError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", params.userId)
      .single()
    
    if (!prefError && preferences && preferences.email_notifications) {
      // Send email notification
      await sendEmailNotification({
        userId: params.userId,
        subject: params.title,
        message: params.message,
        html: `<h1>${params.title}</h1><p>${params.message}</p>${params.link ? `<a href="${params.link}">View Details</a>` : ''}`,
      })
    }
    
    revalidatePath("/notifications")
    return { success: true, notification: data as Notification }
  } catch (error) {
    console.error("Unexpected error in createNotification:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Mark a notification as read
export async function markNotificationAsRead(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Database connection error" }
    }
    
    // Get current user
    const { data, error: userError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, error: "User not authenticated" }
    }
    
    // Update notification
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", user.id)
    
    if (error) {
      console.error("Error marking notification as read:", error)
      return { success: false, error: error.message }
    }
    
    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in markNotificationAsRead:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Database connection error" }
    }
    
    // Get current user
    const { data, error: userError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, error: "User not authenticated" }
    }
    
    // Update all notifications
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)
    
    if (error) {
      console.error("Error marking all notifications as read:", error)
      return { success: false, error: error.message }
    }
    
    revalidatePath("/notifications")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in markAllNotificationsAsRead:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Delete a notification
export async function deleteNotification(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Database connection error" }
    }
    
    // Get current user
    const { data, error: userError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, error: "User not authenticated" }
    }
    
    // Delete notification
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
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in deleteNotification:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Get user's notification preferences
export async function getNotificationPreferences() {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { preferences: null, error: "Database connection error" }
    }
    
    // Get current user
    const { data, error: userError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { preferences: null, error: "User not authenticated" }
    }
    
    // Get preferences
    const { data: preferences, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()
    
    if (error) {
      // If no preferences found, create them using admin client
      if (error.code === "PGRST116") {
        console.log("No notification preferences found, creating new preferences")
        
        // Create admin client to bypass RLS
        const adminClient = createAdminSupabaseClient()
        
        if (!adminClient) {
          console.error("Failed to create admin client")
          return { preferences: null, error: "Could not create notification preferences" }
        }
        
        // Create default preferences
        const defaultPreferences = {
          user_id: user.id,
          email_notifications: true,
          push_notifications: true,
          watchlist_alerts: true,
          budget_alerts: true,
          expense_reminders: true,
          bill_reminders: true,
          investment_updates: true
        }
        
        // Insert preferences using admin client
        const { data: newPreferences, error: insertError } = await adminClient
          .from("notification_preferences")
          .insert(defaultPreferences)
          .select()
          .single()
        
        if (insertError) {
          console.error("Error creating notification preferences with admin client:", insertError)
          return { preferences: null, error: "Failed to create notification preferences" }
        }
        
        console.log("Successfully created notification preferences")
        return { preferences: newPreferences as NotificationPreferences, error: null }
      }
      
      console.error("Error getting notification preferences:", error)
      return { preferences: null, error: error.message }
    }
    
    return { preferences: preferences as NotificationPreferences, error: null }
  } catch (error) {
    console.error("Unexpected error in getNotificationPreferences:", error)
    return { preferences: null, error: "An unexpected error occurred" }
  }
}

// Update user's notification preferences
export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Database connection error" }
    }
    
    // Get current user
    const { data, error: userError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, error: "User not authenticated" }
    }
    
    // Update preferences
    const { error } = await supabase
      .from("notification_preferences")
      .update(preferences)
      .eq("user_id", user.id)
    
    if (error) {
      console.error("Error updating notification preferences:", error)
      return { success: false, error: error.message }
    }
    
    revalidatePath("/settings/notifications")
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in updateNotificationPreferences:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Send an email notification
export async function sendEmailNotification(params: SendEmailParams) {
  try {
    const supabase = await createServerSupabaseClient()
    
    if (!supabase) {
      console.error("Failed to create Supabase client")
      return { success: false, error: "Database connection error" }
    }
    
    // Get user's email
    const { data, error: userError } = await supabase.auth.getUser()
    const user = data?.user
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return { success: false, error: "User not authenticated" }
    }
    
    const userEmail = user.email
    
    if (!userEmail) {
      console.error("User has no email address")
      return { success: false, error: "User has no email address" }
    }
    
    // In a real app, you would send an actual email here
    // For now, we'll just log it
    console.log(`Sending email to ${userEmail}:`)
    console.log(`Subject: ${params.subject}`)
    console.log(`Message: ${params.message}`)
    
    if (params.html) {
      console.log(`HTML: ${params.html}`)
    }
    
    // In a real implementation, you would use a service like SendGrid, AWS SES, etc.
    // Example with SendGrid:
    /*
    const msg = {
      to: userEmail,
      from: 'noreply@financehub.com',
      subject: params.subject,
      text: params.message,
      html: params.html || params.message,
    }
    await sendgrid.send(msg)
    */
    
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in sendEmailNotification:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
