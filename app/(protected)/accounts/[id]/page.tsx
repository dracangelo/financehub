import { Suspense } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getAccountById, getTransactionsByAccount } from "@/app/actions"
import { AccountDetail } from "@/components/accounts/account-detail"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface AccountDetailPageProps {
  params: {
    id: string
  }
}

async function AccountDetailContent({ id }: { id: string }) {
  try {
    const [account, transactions] = await Promise.all([getAccountById(id), getTransactionsByAccount(id)])

    if (!account) {
      notFound()
    }

    return <AccountDetail account={account} transactions={transactions} />
  } catch (error) {
    console.error("Error fetching account:", error)
    notFound()
  }
}

export default function AccountDetailPage({ params }: AccountDetailPageProps) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-8">
      

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/accounts">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Accounts
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <AccountDetailContent id={params.id} />
      </Suspense>
    </div>
  )
}

