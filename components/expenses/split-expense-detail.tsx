"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils/formatting"
import { Check, Clock, Receipt, Send, Loader2 } from "lucide-react"
import { settleSplitExpense, sendSplitExpenseReminder } from "@/app/actions/split-expenses"
import { useToast } from "@/components/ui/use-toast"

interface Participant {
  id: string
  name: string
  avatar: string
  amount: number
  status: "paid" | "pending"
}

interface SplitExpense {
  id: string
  merchant: string
  category: string
  amount: number
  date: Date
  status: "active" | "settled"
  participants: Participant[]
}

interface SplitExpenseDetailProps {
  expense: SplitExpense
}

export function SplitExpenseDetail({ expense }: SplitExpenseDetailProps) {
  const [isSettling, setIsSettling] = useState(false)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const { toast } = useToast()

  // Calculate their share (the amount owed by the other person)
  const theirShare = expense.participants.find((p: { name: string }) => p.name !== "You")?.amount || 0
  
  // Calculate pending amount
  const pendingAmount = expense.participants
    .filter((p: { status: string }) => p.status === "pending")
    .reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
  
  // Get pending participants count
  const pendingParticipants = expense.participants.filter((p: { status: string }) => p.status === "pending").length
  
  // Check if you paid
  const youPaid = expense.participants.find((p: { name: string }) => p.name === "You")?.status === "paid"
  
  // Handle settling a split expense
  const handleSettleExpense = async (splitId: string) => {
    setIsSettling(true)
    try {
      await settleSplitExpense(splitId)
      toast({
        title: "Success",
        description: "Split expense has been settled.",
      })
    } catch (error) {
      console.error("Error settling split expense:", error)
      toast({
        title: "Error",
        description: "Failed to settle the split expense. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSettling(false)
    }
  }
  
  // Handle sending a reminder for a split expense
  const handleSendReminder = async (splitId: string) => {
    setIsSendingReminder(true)
    try {
      const result = await sendSplitExpenseReminder(splitId)
      toast({
        title: "Success",
        description: result.message || "Reminder sent successfully.",
      })
    } catch (error) {
      console.error("Error sending reminder:", error)
      toast({
        title: "Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingReminder(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{expense.merchant}</CardTitle>
            <CardDescription>{expense.category} • {formatDate(expense.date)}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(expense.amount)}</div>
            <div className="text-sm text-muted-foreground">
              Their share: {formatCurrency(theirShare)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Split Details</h3>
          <div className="space-y-2">
            {expense.participants.map((participant) => (
              <div key={participant.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={participant.avatar} alt={participant.name} />
                    <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{participant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(expense.amount / expense.participants.length).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(participant.amount)}</p>
                  </div>
                  {participant.status === "paid" ? (
                    <Badge variant="outline" className="text-emerald-500 border-emerald-200 bg-emerald-50">
                      <Check className="mr-1 h-3 w-3" />
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {expense.status === "active" && (
          <div>
            <h3 className="text-sm font-medium mb-2">Payment Status</h3>
            <div className="p-3 rounded-md bg-muted/50">
              {pendingParticipants > 0 ? (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>
                      <span className="font-medium">{pendingParticipants}</span> pending payment
                      {pendingParticipants > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="font-medium text-amber-500">
                    {formatCurrency(pendingAmount)}
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">All payments complete</span>
                  </div>
                  <div className="font-medium text-emerald-500">
                    {formatCurrency(expense.amount)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {expense.status === "active" && !youPaid && (
          <Button className="w-full">
            <Send className="mr-2 h-4 w-4" />
            Pay Your Share
          </Button>
        )}
        
        {expense.status === "active" && pendingParticipants > 0 && (
          <div className="flex gap-2 w-full">
            {/* Find a pending participant to send reminder to */}
            {expense.participants.find((p: { status: string }) => p.status === "pending") && (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  // Get the ID of the first pending participant
                  const pendingParticipant = expense.participants.find((p: { status: string }) => p.status === "pending");
                  if (pendingParticipant) {
                    handleSendReminder(pendingParticipant.id);
                  }
                }}
                disabled={isSendingReminder}
              >
                {isSendingReminder ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Reminder
              </Button>
            )}
            
            <Button 
              className="flex-1"
              onClick={() => handleSettleExpense(expense.id)}
              disabled={isSettling}
            >
              {isSettling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Mark as Settled
            </Button>
          </div>
        )}
        
        {expense.status === "settled" && (
          <Button variant="outline" className="w-full">
            <Receipt className="mr-2 h-4 w-4" />
            View Receipt
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
