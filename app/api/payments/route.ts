import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

// Schema for payment validation
const paymentSchema = z.object({
  amount: z.number().min(0, "Amount must be a positive number"),
  date: z.string().transform(str => new Date(str)),
  status: z.enum(["completed", "pending", "failed"]).default("pending"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
  subscriptionId: z.string().optional(),
  billId: z.string().optional(),
})

// GET /api/payments - Get all payments for the current user
export async function GET(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const subscriptionId = searchParams.get("subscriptionId")
    const billId = searchParams.get("billId")
    
    const where: any = {
      userId: session.user.id,
    }
    
    if (subscriptionId) {
      where.subscriptionId = subscriptionId
    }
    
    if (billId) {
      where.billId = billId
    }
    
    const payments = await db.payment.findMany({
      where,
      orderBy: {
        date: "desc",
      },
      include: {
        subscription: true,
        bill: true,
      },
    })
    
    return NextResponse.json(payments)
  } catch (error) {
    console.error("[PAYMENTS_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// POST /api/payments - Create a new payment
export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const body = await req.json()
    const validatedData = paymentSchema.parse(body)
    
    // Check if subscription or bill exists and belongs to user
    if (validatedData.subscriptionId) {
      const subscription = await db.subscription.findUnique({
        where: {
          id: validatedData.subscriptionId,
          userId: session.user.id,
        },
      })
      
      if (!subscription) {
        return new NextResponse("Subscription not found", { status: 404 })
      }
    }
    
    if (validatedData.billId) {
      const bill = await db.bill.findUnique({
        where: {
          id: validatedData.billId,
          userId: session.user.id,
        },
      })
      
      if (!bill) {
        return new NextResponse("Bill not found", { status: 404 })
      }
    }
    
    const payment = await db.payment.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    })
    
    // Update subscription or bill status if payment is completed
    if (validatedData.status === "completed") {
      if (validatedData.subscriptionId) {
        await db.subscription.update({
          where: {
            id: validatedData.subscriptionId,
          },
          data: {
            nextBillingDate: new Date(
              new Date(validatedData.date).setMonth(
                new Date(validatedData.date).getMonth() + 1
              )
            ),
          },
        })
      }
      
      if (validatedData.billId) {
        await db.bill.update({
          where: {
            id: validatedData.billId,
          },
          data: {
            status: "paid",
          },
        })
      }
    }
    
    return NextResponse.json(payment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 })
    }
    
    console.error("[PAYMENTS_POST]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 