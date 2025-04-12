"use client"

import type React from "react"

import { useState } from "react"
import { Bot, Send, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface FinancialAssistantProps {
  title?: string
  description?: string
}

export function FinancialAssistant({
  title = "Financial Assistant",
  description = "Ask questions about your finances and get personalized advice",
}: FinancialAssistantProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your financial assistant. How can I help you today?",
    },
  ])

  const handleSend = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        role: "assistant",
        content: getAssistantResponse(input),
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-[340px] px-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 mb-4 ${
                message.role === "assistant" ? "items-start" : "items-start flex-row-reverse"
              }`}
            >
              <Avatar className={message.role === "user" ? "bg-primary" : "bg-muted"}>
                <AvatarFallback>{message.role === "user" ? <User size={18} /> : <Bot size={18} />}</AvatarFallback>
              </Avatar>
              <div
                className={`rounded-lg px-3 py-2 max-w-[80%] ${
                  message.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex w-full gap-2">
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
            <Send size={18} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

// Helper function to generate responses based on user input
function getAssistantResponse(input: string): string {
  const inputLower = input.toLowerCase()

  if (inputLower.includes("budget") || inputLower.includes("spending")) {
    return "Based on your recent transactions, you're spending more on dining out than your monthly budget allows. Consider reducing restaurant expenses by 15% to stay on track."
  }

  if (inputLower.includes("save") || inputLower.includes("saving")) {
    return "To improve your savings, I recommend the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. Based on your income, you should aim to save about $500 per month."
  }

  if (inputLower.includes("invest") || inputLower.includes("investment")) {
    return "Looking at your risk profile and goals, I'd suggest increasing your index fund allocation. Your current portfolio has a 7.2% annual return, which is slightly below the market average."
  }

  if (inputLower.includes("debt") || inputLower.includes("loan")) {
    return "Your current debt-to-income ratio is 32%. I recommend focusing on paying off your high-interest credit card debt first, which would save you approximately $340 in interest this year."
  }

  if (inputLower.includes("income") || inputLower.includes("earn")) {
    return "Your income has increased by 5.3% compared to last year. Great job! Consider allocating this increase to your retirement contributions to maximize tax benefits."
  }

  return "I'm here to help with your financial questions. You can ask about your budget, savings, investments, debt management, or income analysis."
}

