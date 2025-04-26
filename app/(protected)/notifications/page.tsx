import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationsContent } from "@/components/notifications/notifications-content"
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-2">Manage your notification preferences and view your notification history</p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <NotificationsContent />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <NotificationPreferencesForm />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
