import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getBudgetById, getCategories } from "@/app/actions"
import { BudgetDetail } from "@/components/budgets/budget-detail"
import { DemoModeAlert } from "@/components/ui/demo-mode-alert"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic"

interface BudgetDetailPageProps {
  params: {
    id: string
  }
}

async function BudgetDetailContent({ id }: { id: string }) {
  try {
    const budget = await getBudgetById(id)
    const categories = await getCategories()

    if (!budget) {
      notFound()
    }

    return <BudgetDetail budget={budget} categories={categories} />
  } catch (error) {
    console.error("Error fetching budget:", error)
    notFound()
  }
}

export default function BudgetDetailPage({ params }: BudgetDetailPageProps) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      <DemoModeAlert />

      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <BudgetDetailContent id={params.id} />
      </Suspense>
    </div>
  )
}

