import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getTransactionById, getAccounts, getCategories } from "@/app/actions"
import { TransactionEditForm } from "@/components/transactions/transaction-edit-form"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface TransactionEditPageProps {
  params: {
    id: string
  }
}

async function TransactionEditContent({ id }: { id: string }) {
  try {
    const [transaction, accounts, categories] = await Promise.all([
      getTransactionById(id),
      getAccounts(),
      getCategories(),
    ])

    if (!transaction) {
      notFound()
    }

    return <TransactionEditForm transaction={transaction} accounts={accounts} categories={categories} />
  } catch (error) {
    console.error("Error fetching transaction data:", error)
    notFound()
  }
}

export default function TransactionEditPage({ params }: TransactionEditPageProps) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/transactions">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Transactions
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Transaction</h1>
        <p className="text-muted-foreground mt-2">Update transaction details</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <TransactionEditContent id={params.id} />
      </Suspense>
    </div>
  )
}

