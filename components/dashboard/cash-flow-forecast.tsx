"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Sample data for the cash flow forecast
const sampleData = [
  { month: "Jan", income: 5000, expenses: 3500, forecast: 1500 },
  { month: "Feb", income: 5200, expenses: 3700, forecast: 1500 },
  { month: "Mar", income: 5100, expenses: 3600, forecast: 1500 },
  { month: "Apr", income: 5300, expenses: 3800, forecast: 1500 },
  { month: "May", income: 5400, expenses: 3900, forecast: 1500 },
  { month: "Jun", income: 5500, expenses: 4000, forecast: 1500 },
  // Future months (forecast)
  { month: "Jul", income: null, expenses: null, forecast: 1600 },
  { month: "Aug", income: null, expenses: null, forecast: 1650 },
  { month: "Sep", income: null, expenses: null, forecast: 1700 },
]

interface CashFlowForecastProps {
  title?: string
  description?: string
  data?: any[]
}

// Changed from default export to named export
export function CashFlowForecast({
  title = "Cash Flow Forecast",
  description = "Projected cash flow for the next 3 months",
  data = sampleData,
}: CashFlowForecastProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                activeDot={{ r: 8 }}
                strokeWidth={2}
                name="Income"
              />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#6366f1"
                strokeDasharray="5 5"
                strokeWidth={2}
                name="Forecast"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

