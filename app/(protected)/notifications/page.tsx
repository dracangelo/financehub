import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

async function NotificationsContent() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>
      <p className="text-muted-foreground">
        Manage your notification preferences here. This page is under development.
      </p>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-2">Manage your notification preferences and alerts</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <NotificationsContent />
      </Suspense>
    </div>
  )
}

