"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateTransaction } from "@/app/actions/transactions"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { ALL_CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants/categories"

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
  user_id: string
  account_id: string
  category_id: string
  amount: number
  description: string
  is_income: boolean
  created_at: string
  updated_at: string | null
  account: Account
  category: Category
}

interface TransactionEditFormProps {
  transaction: Transaction
  accounts: Account[]
  categories?: Category[]
}

export function TransactionEditForm({ transaction, accounts, categories = ALL_CATEGORIES }: TransactionEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transactionType, setTransactionType] = useState<"expense" | "income">(
    transaction.is_income ? "income" : "expense",
  )

  const [formData, setFormData] = useState({
    description: transaction.description,
    amount: transaction.amount.toString(),
    account_id: transaction.account_id,
    category_id: transaction.category_id,
    created_at: new Date(transaction.created_at).toISOString().split("T")[0],
  })

  // Filter categories based on selected type (income or expense)
  const filteredCategories = categories.filter((category) =>
    transactionType === "income" ? category.is_income : !category.is_income,
  )

  // Update category selection when transaction type changes
  useEffect(() => {
    // If the current category doesn't match the transaction type, reset it
    const currentCategory = categories.find((c) => c.id === formData.category_id)
    if (currentCategory && currentCategory.is_income !== (transactionType === "income")) {
      setFormData((prev) => ({ ...prev, category_id: "" }))
    }
  }, [transactionType, categories, formData.category_id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTransactionTypeChange = (value: string) => {
    setTransactionType(value as "expense" | "income")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataObj = new FormData()

      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value)
      })

      // Add transaction type
      formDataObj.append("is_income", String(transactionType === "income"))

      await updateTransaction(transaction.id, formDataObj)

      toast({
        title: "Transaction updated",
        description: "Your transaction has been updated successfully.",
      })

      router.push(`/transactions/${transaction.id}`)
    } catch (error) {
      console.error("Error updating transaction:", error)
      toast({
        title: "Error",
        description: "Failed to update transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Edit Transaction</CardTitle>
          <CardDescription>Update the details of your transaction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_type">Transaction Type</Label>
              <Select value={transactionType} onValueChange={handleTransactionTypeChange}>
                <SelectTrigger id="transaction_type">
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_id">Account</Label>
              <Select value={formData.account_id} onValueChange={(value) => handleSelectChange("account_id", value)}>
                <SelectTrigger id="account_id">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => handleSelectChange("category_id", value)}>
                <SelectTrigger id="category_id">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.length === 0 ? (
                    <SelectItem value="" disabled>
                      No matching categories found
                    </SelectItem>
                  ) : (
                    filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="created_at">Date</Label>
            <Input
              id="created_at"
              name="created_at"
              type="date"
              value={formData.created_at}
              onChange={handleInputChange}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Transaction"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

