"use client"

import { InvestmentList } from "@/components/investments/investment-list"

export function InvestmentAnalyticsWidget() {
  // Optionally, you could fetch initial investments server-side and pass as prop
  return (
    <div className="bg-background rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Investment Portfolio Analytics</h2>
      <InvestmentList />
    </div>
  )
}
