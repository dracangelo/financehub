import { Suspense } from "react"
import Link from "next/link"
import { getAccounts, getCategories } from "@/app/actions"
import { TransactionCreateForm } from "@/components/transactions/transaction-create-form"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

async function TransactionCreateContent() {
  const [accounts, categories] = await Promise.all([getAccounts(), getCategories()])

  return <TransactionCreateForm accounts={accounts} categories={categories} />
}

export default function TransactionCreatePage() {
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
        <h1 className="text-2xl font-bold tracking-tight">Create Transaction</h1>
        <p className="text-muted-foreground mt-2">Add a new financial transaction</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <TransactionCreateContent />
      </Suspense>
    </div>
  )
}

