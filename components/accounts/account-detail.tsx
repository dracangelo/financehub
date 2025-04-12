"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils/formatting"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, Plus, Edit, Trash2 } from "lucide-react"
import { deleteAccount } from "@/app/actions/accounts"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string | null
}

interface Category {
  id: string
  name: string
  color: string
  is_income: boolean
}

interface Transaction {
  id: string
  description: string
  amount: number
  is_income: boolean
  created_at: string
  category: Category
}

interface AccountDetailProps {
  account: Account
  transactions: Transaction[]
}

export function AccountDetail({ account, transactions }: AccountDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteAccount(account.id)

      toast({
        title: "Account deleted",
        description: "The account has been deleted successfully.",
      })

      router.push("/accounts")
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    router.push(`/accounts/edit/${account.id}`)
  }

  // Calculate account statistics
  const totalIncome = transactions.filter((t) => t.is_income).reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions.filter((t) => !t.is_income).reduce((sum, t) => sum + t.amount, 0)

  const netFlow = totalIncome - totalExpenses

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{account.name}</h1>
        <p className="text-muted-foreground mt-2">{account.type} Account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(account.balance, { currency: account.currency })}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome, { currency: account.currency })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses, { currency: account.currency })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>View and manage account information</CardDescription>
            </div>
            <Badge variant={account.is_active ? "default" : "secondary"}>
              {account.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Account Type</dt>
              <dd className="mt-1 text-base">{account.type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Currency</dt>
              <dd className="mt-1 text-base">{account.currency}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="mt-1 text-base">{formatDate(new Date(account.created_at))}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
              <dd className="mt-1 text-base">
                {account.updated_at ? formatDate(new Date(account.updated_at)) : "Never"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Net Cash Flow</dt>
              <dd className={`mt-1 text-base font-medium ${netFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(netFlow, { currency: account.currency })}
              </dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Account
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Recent transactions for this account</CardDescription>
            </div>
            <Button asChild>
              <Link href={`/transactions/new?account=${account.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <TransactionTable transactions={transactions} />
            </TabsContent>

            <TabsContent value="income">
              <TransactionTable transactions={transactions.filter((t) => t.is_income)} />
            </TabsContent>

            <TabsContent value="expenses">
              <TransactionTable transactions={transactions.filter((t) => !t.is_income)} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <div className="font-medium">{account.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Balance: {formatCurrency(account.balance, { currency: account.currency })}
                </div>
              </div>
              {transactions.length > 0 && (
                <div className="mt-2 text-red-600">
                  Warning: This account has {transactions.length} transactions that will also be deleted.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No transactions found.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatDate(new Date(transaction.created_at))}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: transaction.category.color }}
                    />
                    {transaction.category.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {transaction.is_income ? (
                      <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                    )}
                    <span className={transaction.is_income ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/transactions/${transaction.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

