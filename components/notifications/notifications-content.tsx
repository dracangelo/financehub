"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, Trash2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  Notification, 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from "@/app/actions/notifications"

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch notifications
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { notifications, error } = await getNotifications()
        
        if (error) {
          setError(error)
          setNotifications([])
        } else {
          setNotifications(notifications)
          setUnreadCount(notifications.filter(n => !n.read).length)
          setError(null)
        }
      } catch (err) {
        console.error("Error fetching notifications:", err)
        setError("Failed to load notifications")
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Mark notification as read
  const handleMarkAsRead = async (id: string) => {
    const result = await markNotificationAsRead(id)
    
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
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
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
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
      if (notification && !notification.read) {
        setUnreadCount(count => count - 1)
      }
      toast.success("Notification deleted")
    } else {
      toast.error("Failed to delete notification")
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }
    
    if (notification.link) {
      router.push(notification.link)
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    if (type.includes("watchlist")) return "💹"
    if (type.includes("budget")) return "💰"
    if (type.includes("expense")) return "💸"
    if (type.includes("bill")) return "📅"
    if (type.includes("investment")) return "📈"
    return "🔔"
  }

  // Get notification type label
  const getNotificationTypeLabel = (type: string) => {
    if (type.includes("watchlist")) return "Watchlist"
    if (type.includes("budget")) return "Budget"
    if (type.includes("expense")) return "Expense"
    if (type.includes("bill")) return "Bill"
    if (type.includes("investment")) return "Investment"
    return "General"
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
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center p-4 gap-4">
            <Bell className="h-16 w-16 text-destructive opacity-20" />
            <h3 className="text-lg font-medium">Failed to Load Notifications</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
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
              notification.read ? "opacity-70" : "border-primary/50"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="text-2xl mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{notification.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getNotificationTypeLabel(notification.type)}</span>
                        <span>•</span>
                        <span>{new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!notification.read && (
                          <>
                            <span>•</span>
                            <span className="text-primary font-medium">New</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
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
