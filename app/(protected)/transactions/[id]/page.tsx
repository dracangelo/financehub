import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getTransactionById } from "@/app/actions/transactions"
import { TransactionDetail } from "@/components/transactions/transaction-detail"
import { DemoModeAlert } from "@/components/ui/demo-mode-alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface TransactionDetailPageProps {
  params: {
    id: string
  }
}

async function TransactionDetailContent({ id }: { id: string }) {
  try {
    const transaction = await getTransactionById(id)

    if (!transaction) {
      notFound()
    }

    return <TransactionDetail transaction={transaction} />
  } catch (error) {
    console.error("Error fetching transaction:", error)
    notFound()
  }
}

export default function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      <DemoModeAlert />

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/transactions">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Transactions
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <TransactionDetailContent id={params.id} />
      </Suspense>
    </div>
  )
}

