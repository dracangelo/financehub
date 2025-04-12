"use client"

import { useEffect, useState } from "react"
import { InfoIcon } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { calculateIncomeDiversification } from "@/app/actions/income-sources"

export function DiversificationScore() {
  const [score, setScore] = useState<number | null>(null)
  const [data, setData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await calculateIncomeDiversification()
        setScore(result.score)
        setData(result.sources)
      } catch (err) {
        setError("Error fetching diversification score")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate colors and status based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
  }

  const getScoreStatus = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Needs Improvement"
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B6B", "#6B66FF"]

  if (loading) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Income Diversification</CardTitle>
          <CardDescription>How well your income is diversified</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !score || !data) {
    return (
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Income Diversification</CardTitle>
          <CardDescription>How well your income is diversified</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <p className="text-muted-foreground text-center">{error || "Failed to calculate income diversification"}</p>
        </CardContent>
      </Card>
    )
  }

  const scoreColor = getScoreColor(score)
  const scoreStatus = getScoreStatus(score)

  return (
    <Card className="dashboard-card animate-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Income Diversification</CardTitle>
            <CardDescription>How well your income is diversified</CardDescription>
          </div>
          <div className={`text-2xl font-bold ${scoreColor}`}>{score}/100</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-1/2">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full md:w-1/2 space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className={`text-xl font-semibold ${scoreColor}`}>{scoreStatus}</h3>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Your income diversification score is calculated based on the number of income sources and their
                      relative contribution to your total income.
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>

            <p className="text-sm text-muted-foreground">
              {score >= 80
                ? "Your income is well diversified across multiple sources, providing excellent financial stability."
                : score >= 60
                  ? "Your income has good diversification, but could benefit from adding more sources or balancing existing ones."
                  : score >= 40
                    ? "Your income diversification is fair, but you're relying too heavily on a few sources."
                    : "Your income lacks diversification, making you vulnerable to financial shocks if one source is disrupted."}
            </p>

            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {score < 80 && (
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Consider adding additional income streams to improve stability</span>
                  </li>
                )}
                {data.some((item) => item.amount / data.reduce((sum, i) => sum + i.amount, 0) > 0.5) && (
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Reduce reliance on your largest income source</span>
                  </li>
                )}
                {data.length < 3 && (
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Aim for at least 3-5 different income sources</span>
                  </li>
                )}
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Explore passive income opportunities to complement active income</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

