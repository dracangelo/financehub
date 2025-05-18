"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, Trash2, ExternalLink, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from "@/app/actions/notifications"
import { Notification } from "@/types/notification"
import { useAuthRefresh } from "@/components/auth/auth-refresh-provider"

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { refreshToken, isRefreshing } = useAuthRefresh()

  // Use the auth refresh hook instead of a local function

  // Fetch notifications
  const fetchData = async () => {
    setLoading(true)
    try {
      // First, ensure the database structure is set up
      try {
        await fetch(`/api/database/notifications-setup`)
      } catch (setupError) {
        console.error("Error setting up notification database structure:", setupError)
      }

      // Then try to seed some sample notifications if none exist
      try {
        await fetch(`/api/notifications/seed`)
      } catch (seedError) {
        console.error("Error seeding sample notifications:", seedError)
      }
      
      // Try to get notifications
      try {
        const { notifications, error } = await getNotifications()
        
        if (error) {
          // Check if it's an auth error
          if (error.includes('JWT') || error.includes('token is expired') || error.includes('auth')) {
            // Try to refresh the token
            const refreshed = await refreshToken()
            if (refreshed) {
              // Try again after token refresh
              const retryResult = await getNotifications()
              if (!retryResult.error) {
                setNotifications(retryResult.notifications)
                setUnreadCount(retryResult.notifications.filter(n => !n.is_read).length)
                setError(null)
                setLoading(false)
                return
              }
            }
            // If we get here, refresh didn't help
            setError("Authentication error. Please refresh the page and try again.")
          } else {
            setError(error)
          }
          setNotifications([])
        } else {
          setNotifications(notifications)
          setUnreadCount(notifications.filter(n => !n.is_read).length)
          setError(null)
        }
      } catch (err) {
        console.error("Error fetching notifications:", err)
        // Try to refresh the token in case it's an auth error
        await refreshToken()
        setError("Failed to load notifications. Please try refreshing the page.")
        setNotifications([])
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError("An unexpected error occurred")
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  // Refresh notifications
  const handleRefresh = async () => {
    const success = await refreshToken()
    if (success) {
      toast.success("Session refreshed successfully")
      fetchData()
    } else {
      toast.error("Failed to refresh session")
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    const result = await markNotificationAsRead(id)
    
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount(count => count - 1)
    } else {
      toast.error("Failed to mark notification as read")
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead()
    
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      toast.success("All notifications marked as read")
    } else {
      toast.error("Failed to mark all notifications as read")
    }
  }

  // Delete notification
  const handleDeleteNotification = async (id: string) => {
    const result = await deleteNotification(id)
    
    if (result.success) {
      const notification = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (notification && !notification.is_read) {
        setUnreadCount(count => count - 1)
      }
      toast.success("Notification deleted")
    } else {
      toast.error("Failed to delete notification")
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    if (type === "General Alert") return "🔔"
    if (type === "Reminder") return "⏰"
    if (type === "System Update") return "🔄"
    return "📢"
  }

  // Get notification type label
  const getNotificationTypeLabel = (type: string) => {
    return type || "General"
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="w-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="mb-4 text-4xl">😕</div>
        <h3 className="text-lg font-medium mb-2">Failed to load notifications</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="flex justify-center gap-3">
          <Button onClick={() => fetchData()}>Try Again</Button>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Session
          </Button>
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center p-4 gap-4">
            <Bell className="h-16 w-16 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium">No Notifications</h3>
            <p className="text-muted-foreground">
              You don't have any notifications yet. Notifications will appear here when you receive updates about your finances.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Your Notifications</h2>
          <p className="text-sm text-muted-foreground">
            You have {notifications.length} notification{notifications.length !== 1 ? 's' : ''} 
            {unreadCount > 0 ? `, ${unreadCount} unread` : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.map(notification => (
          <Card 
            key={notification.id} 
            className={`w-full hover:bg-accent/10 transition-colors ${
              notification.is_read ? "opacity-70" : "border-primary/50"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="text-2xl mt-1">
                  {getNotificationIcon(notification.notification_type || "General Alert")}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{notification.notification_type || "Notification"}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getNotificationTypeLabel(notification.notification_type || "")}</span>
                        <span>•</span>
                        <span>{new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!notification.is_read && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-medium">New</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          title="Mark as read"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm">
                    {notification.message}
                  </p>
                  {notification.link && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-xs flex items-center gap-1"
                      onClick={() => router.push(notification.link!)}
                    >
                      View details <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
