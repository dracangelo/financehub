"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

// Get all investments for the current user
export async function getInvestments() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    const { data: investments, error } = await supabase
      .from("investments")
      .select(`
        *,
        categories:category_id (id, name, color),
        accounts:account_id (id, name, type)
      `)
      .eq("user_id", user.id)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching investments:", error)
      throw new Error("Failed to fetch investments")
    }

    return investments
  } catch (error) {
    console.error("Error in getInvestments:", error)
    throw new Error("Failed to fetch investments")
  }
}

// Get investment by ID
export async function getInvestmentById(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    const { data: investment, error } = await supabase
      .from("investments")
      .select(`
        *,
        categories:category_id (id, name, color),
        accounts:account_id (id, name, type)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching investment:", error)
      throw new Error("Failed to fetch investment")
    }

    // Get investment history
    const { data: history, error: historyError } = await supabase
      .from("investment_history")
      .select("*")
      .eq("investment_id", id)
      .order("date", { ascending: false })

    if (historyError) {
      console.error("Error fetching investment history:", historyError)
    }

    // Get investment transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("investment_transactions")
      .select("*")
      .eq("investment_id", id)
      .order("transaction_date", { ascending: false })

    if (transactionsError) {
      console.error("Error fetching investment transactions:", transactionsError)
    }

    return {
      investment,
      history: history || [],
      transactions: transactions || [],
    }
  } catch (error) {
    console.error("Error in getInvestmentById:", error)
    throw new Error("Failed to fetch investment")
  }
}

// Create a new investment
export async function createInvestment(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    const name = formData.get("name") as string
    const ticker = formData.get("ticker") as string
    const investment_type = formData.get("investment_type") as string
    const shares = Number.parseFloat(formData.get("shares") as string) || 0
    const purchase_price = Number.parseFloat(formData.get("purchase_price") as string) || 0
    const current_price = Number.parseFloat(formData.get("current_price") as string) || purchase_price
    const purchase_date = formData.get("purchase_date") as string
    const account_id = formData.get("account_id") as string
    const category_id = (formData.get("category_id") as string) || null
    const expense_ratio = Number.parseFloat(formData.get("expense_ratio") as string) || 0
    const dividend_yield = Number.parseFloat(formData.get("dividend_yield") as string) || 0
    const notes = (formData.get("notes") as string) || ""
    const esg_score = Number.parseInt(formData.get("esg_score") as string) || null
    const risk_level = (formData.get("risk_level") as string) || "medium"

    const { data: investment, error } = await supabase
      .from("investments")
      .insert({
        user_id: user.id,
        name,
        ticker,
        investment_type,
        shares,
        purchase_price,
        current_price,
        purchase_date,
        account_id,
        category_id,
        expense_ratio,
        dividend_yield,
        notes,
        esg_score,
        risk_level,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating investment:", error)
      throw new Error("Failed to create investment")
    }

    // Create initial investment history entry
    await supabase.from("investment_history").insert({
      investment_id: investment.id,
      date: purchase_date,
      price: purchase_price,
      shares,
    })

    // Create initial transaction
    await supabase.from("investment_transactions").insert({
      investment_id: investment.id,
      transaction_date: purchase_date,
      transaction_type: "buy",
      shares,
      price: purchase_price,
      total_amount: shares * purchase_price,
      notes: "Initial purchase",
    })

    revalidatePath("/investments")
    return investment
  } catch (error) {
    console.error("Error in createInvestment:", error)
    throw new Error("Failed to create investment")
  }
}

// Update an investment
export async function updateInvestment(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    const name = formData.get("name") as string
    const ticker = formData.get("ticker") as string
    const investment_type = formData.get("investment_type") as string
    const shares = Number.parseFloat(formData.get("shares") as string) || 0
    const current_price = Number.parseFloat(formData.get("current_price") as string) || 0
    const account_id = formData.get("account_id") as string
    const category_id = (formData.get("category_id") as string) || null
    const expense_ratio = Number.parseFloat(formData.get("expense_ratio") as string) || 0
    const dividend_yield = Number.parseFloat(formData.get("dividend_yield") as string) || 0
    const notes = (formData.get("notes") as string) || ""
    const esg_score = Number.parseInt(formData.get("esg_score") as string) || null
    const risk_level = (formData.get("risk_level") as string) || "medium"

    // Get current investment to check for price changes
    const { data: currentInvestment, error: fetchError } = await supabase
      .from("investments")
      .select("current_price")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      console.error("Error fetching current investment:", fetchError)
      throw new Error("Failed to update investment")
    }

    const { data: investment, error } = await supabase
      .from("investments")
      .update({
        name,
        ticker,
        investment_type,
        shares,
        current_price,
        account_id,
        category_id,
        expense_ratio,
        dividend_yield,
        notes,
        esg_score,
        risk_level,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating investment:", error)
      throw new Error("Failed to update investment")
    }

    // Create investment history entry if price changed
    if (currentInvestment.current_price !== current_price) {
      await supabase.from("investment_history").insert({
        investment_id: id,
        date: new Date().toISOString().split("T")[0],
        price: current_price,
        shares,
      })
    }

    revalidatePath("/investments")
    revalidatePath(`/investments/${id}`)
    return investment
  } catch (error) {
    console.error("Error in updateInvestment:", error)
    throw new Error("Failed to update investment")
  }
}

// Delete an investment
export async function deleteInvestment(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    const { error } = await supabase.from("investments").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting investment:", error)
      throw new Error("Failed to delete investment")
    }

    revalidatePath("/investments")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteInvestment:", error)
    throw new Error("Failed to delete investment")
  }
}

// Record a transaction for an investment
export async function recordInvestmentTransaction(id: string, formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    const transaction_date = formData.get("transaction_date") as string
    const transaction_type = formData.get("transaction_type") as string
    const shares = Number.parseFloat(formData.get("shares") as string)
    const price = Number.parseFloat(formData.get("price") as string)
    const total_amount = shares * price
    const notes = (formData.get("notes") as string) || ""

    // Get current investment details
    const { data: investment, error: investmentError } = await supabase
      .from("investments")
      .select("shares, current_price")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (investmentError) {
      console.error("Error fetching investment:", investmentError)
      throw new Error("Failed to record transaction")
    }

    // Calculate new shares based on transaction type
    let newShares = investment.shares
    if (transaction_type === "buy") {
      newShares += shares
    } else if (transaction_type === "sell") {
      newShares -= shares
      if (newShares < 0) {
        throw new Error("Cannot sell more shares than owned")
      }
    }

    // Record the transaction
    const { data: transaction, error } = await supabase
      .from("investment_transactions")
      .insert({
        investment_id: id,
        transaction_date,
        transaction_type,
        shares,
        price,
        total_amount,
        notes,
      })
      .select()
      .single()

    if (error) {
      console.error("Error recording transaction:", error)
      throw new Error("Failed to record transaction")
    }

    // Update investment shares
    const { error: updateError } = await supabase
      .from("investments")
      .update({
        shares: newShares,
        current_price: price, // Update current price to transaction price
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("Error updating investment shares:", updateError)
      throw new Error("Failed to update investment shares")
    }

    // Create investment history entry
    await supabase.from("investment_history").insert({
      investment_id: id,
      date: transaction_date,
      price,
      shares: newShares,
    })

    revalidatePath(`/investments/${id}`)
    return transaction
  } catch (error) {
    console.error("Error in recordInvestmentTransaction:", error)
    throw new Error("Failed to record transaction")
  }
}

// Get portfolio allocation
export async function getPortfolioAllocation() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    // Get all investments
    const { data: investments, error } = await supabase
      .from("investments")
      .select(`
        id,
        name,
        ticker,
        investment_type,
        shares,
        current_price,
        account_id,
        category_id,
        risk_level,
        accounts:account_id (name, type),
        categories:category_id (name, color)
      `)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching investments for allocation:", error)
      throw new Error("Failed to fetch portfolio allocation")
    }

    // Calculate current value for each investment
    const investmentsWithValue = investments.map((investment) => ({
      ...investment,
      current_value: investment.shares * investment.current_price,
    }))

    // Calculate total portfolio value
    const totalPortfolioValue = investmentsWithValue.reduce((sum, investment) => sum + investment.current_value, 0)

    // Calculate allocation percentages
    const investmentsWithAllocation = investmentsWithValue.map((investment) => ({
      ...investment,
      allocation_percentage: totalPortfolioValue > 0 ? (investment.current_value / totalPortfolioValue) * 100 : 0,
    }))

    // Group by investment type
    const allocationByType = investmentsWithAllocation.reduce((acc, investment) => {
      const type = investment.investment_type
      if (!acc[type]) {
        acc[type] = {
          type,
          value: 0,
          percentage: 0,
          investments: [],
        }
      }
      acc[type].value += investment.current_value
      acc[type].percentage = (acc[type].value / totalPortfolioValue) * 100
      acc[type].investments.push(investment)
      return acc
    }, {})

    // Group by account
    const allocationByAccount = investmentsWithAllocation.reduce((acc, investment) => {
      const accountName = investment.accounts?.name || "Unknown"
      const accountType = investment.accounts?.type || "Unknown"
      const key = `${accountName} (${accountType})`

      if (!acc[key]) {
        acc[key] = {
          name: accountName,
          type: accountType,
          value: 0,
          percentage: 0,
          investments: [],
        }
      }
      acc[key].value += investment.current_value
      acc[key].percentage = (acc[key].value / totalPortfolioValue) * 100
      acc[key].investments.push(investment)
      return acc
    }, {})

    // Group by risk level
    const allocationByRisk = investmentsWithAllocation.reduce((acc, investment) => {
      const risk = investment.risk_level || "medium"
      if (!acc[risk]) {
        acc[risk] = {
          risk,
          value: 0,
          percentage: 0,
          investments: [],
        }
      }
      acc[risk].value += investment.current_value
      acc[risk].percentage = (acc[risk].value / totalPortfolioValue) * 100
      acc[risk].investments.push(investment)
      return acc
    }, {})

    return {
      totalPortfolioValue,
      investments: investmentsWithAllocation,
      allocationByType: Object.values(allocationByType),
      allocationByAccount: Object.values(allocationByAccount),
      allocationByRisk: Object.values(allocationByRisk),
    }
  } catch (error) {
    console.error("Error in getPortfolioAllocation:", error)
    throw new Error("Failed to fetch portfolio allocation")
  }
}

// Get portfolio rebalancing recommendations
export async function getRebalancingRecommendations(targetAllocation?: Record<string, number>) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    // Get current allocation
    const { data: currentAllocation, error } = await supabase
      .from("portfolio_targets")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error fetching current allocation targets:", error)
      throw new Error("Failed to fetch rebalancing recommendations")
    }

    // Use provided target allocation or fallback to saved targets
    const targets = targetAllocation ||
      currentAllocation?.targets || {
        Stocks: 60,
        Bonds: 30,
        Cash: 5,
        Alternative: 5,
      }

    // Get current portfolio allocation
    const portfolio = await getPortfolioAllocation()

    // Calculate current allocation by type
    const currentAllocationByType = portfolio.allocationByType.reduce((acc, item) => {
      acc[item.type] = item.percentage
      return acc
    }, {})

    // Calculate differences between current and target
    const differences = {}
    let totalDifference = 0

    for (const type in targets) {
      const target = targets[type] || 0
      const current = currentAllocationByType[type] || 0
      differences[type] = {
        type,
        target,
        current,
        difference: current - target,
        investments: portfolio.allocationByType.find((a) => a.type === type)?.investments || [],
      }
      totalDifference += Math.abs(current - target)
    }

    // Generate recommendations
    const recommendations = []
    const threshold = 5 // Percentage threshold for rebalancing

    for (const type in differences) {
      const { difference, investments } = differences[type]

      if (Math.abs(difference) >= threshold) {
        if (difference > 0) {
          // Overweight - need to reduce
          recommendations.push({
            type,
            action: "reduce",
            amount: difference.toFixed(2),
            message: `Reduce ${type} by ${difference.toFixed(2)}%`,
            investments: investments.sort((a, b) => b.current_value - a.current_value).slice(0, 3),
          })
        } else {
          // Underweight - need to increase
          recommendations.push({
            type,
            action: "increase",
            amount: Math.abs(difference).toFixed(2),
            message: `Increase ${type} by ${Math.abs(difference).toFixed(2)}%`,
            suggestedInvestments: [], // This would be populated with suggested investments
          })
        }
      }
    }

    // Calculate dollar amounts to rebalance
    const rebalanceAmounts = {}
    for (const type in differences) {
      const { difference } = differences[type]
      rebalanceAmounts[type] = (difference / 100) * portfolio.totalPortfolioValue
    }

    return {
      currentAllocation: currentAllocationByType,
      targetAllocation: targets,
      differences,
      recommendations,
      rebalanceAmounts,
      totalDifference,
      needsRebalancing: totalDifference >= threshold,
      portfolioValue: portfolio.totalPortfolioValue,
    }
  } catch (error) {
    console.error("Error in getRebalancingRecommendations:", error)
    throw new Error("Failed to fetch rebalancing recommendations")
  }
}

// Save target allocation
export async function saveTargetAllocation(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    // Parse target allocation from form data
    const targets = {}
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("target_")) {
        const type = key.replace("target_", "")
        targets[type] = Number.parseFloat(value as string) || 0
      }
    }

    // Check if targets already exist
    const { data: existingTargets, error: checkError } = await supabase
      .from("portfolio_targets")
      .select("id")
      .eq("user_id", user.id)

    if (checkError) {
      console.error("Error checking existing targets:", checkError)
      throw new Error("Failed to save target allocation")
    }

    let result

    if (existingTargets && existingTargets.length > 0) {
      // Update existing targets
      const { data, error } = await supabase
        .from("portfolio_targets")
        .update({
          targets,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()

      if (error) {
        console.error("Error updating target allocation:", error)
        throw new Error("Failed to save target allocation")
      }

      result = data
    } else {
      // Create new targets
      const { data, error } = await supabase
        .from("portfolio_targets")
        .insert({
          user_id: user.id,
          targets,
        })
        .select()

      if (error) {
        console.error("Error creating target allocation:", error)
        throw new Error("Failed to save target allocation")
      }

      result = data
    }

    revalidatePath("/investments/allocation")
    return result
  } catch (error) {
    console.error("Error in saveTargetAllocation:", error)
    throw new Error("Failed to save target allocation")
  }
}

// Get investment fee analysis
export async function getInvestmentFeeAnalysis() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    // Get all investments with expense ratios
    const { data: investments, error } = await supabase
      .from("investments")
      .select(`
        id,
        name,
        ticker,
        investment_type,
        shares,
        current_price,
        expense_ratio,
        accounts:account_id (name, type)
      `)
      .eq("user_id", user.id)
      .order("expense_ratio", { ascending: false })

    if (error) {
      console.error("Error fetching investments for fee analysis:", error)
      throw new Error("Failed to fetch investment fee analysis")
    }

    // Calculate current value and annual fees for each investment
    const investmentsWithFees = investments.map((investment) => {
      const currentValue = investment.shares * investment.current_price
      const annualFee = currentValue * (investment.expense_ratio / 100)

      return {
        ...investment,
        current_value: currentValue,
        annual_fee: annualFee,
        fee_percentage: investment.expense_ratio,
      }
    })

    // Calculate total portfolio value and fees
    const totalPortfolioValue = investmentsWithFees.reduce((sum, investment) => sum + investment.current_value, 0)

    const totalAnnualFees = investmentsWithFees.reduce((sum, investment) => sum + investment.annual_fee, 0)

    // Calculate weighted average expense ratio
    const weightedAverageExpenseRatio = totalPortfolioValue > 0 ? (totalAnnualFees / totalPortfolioValue) * 100 : 0

    // Find high-fee investments (above 0.5% expense ratio)
    const highFeeInvestments = investmentsWithFees.filter((investment) => investment.expense_ratio > 0.5)

    // Generate lower-cost alternatives (this would typically come from a database of alternatives)
    // For this example, we'll just simulate some alternatives
    const alternativesMap = {
      Stocks: [
        { name: "Vanguard Total Stock Market ETF", ticker: "VTI", expense_ratio: 0.03 },
        { name: "iShares Core S&P Total U.S. Stock Market ETF", ticker: "ITOT", expense_ratio: 0.03 },
        { name: "Schwab U.S. Broad Market ETF", ticker: "SCHB", expense_ratio: 0.03 },
      ],
      Bonds: [
        { name: "Vanguard Total Bond Market ETF", ticker: "BND", expense_ratio: 0.035 },
        { name: "iShares Core U.S. Aggregate Bond ETF", ticker: "AGG", expense_ratio: 0.04 },
        { name: "Schwab U.S. Aggregate Bond ETF", ticker: "SCHZ", expense_ratio: 0.04 },
      ],
      International: [
        { name: "Vanguard Total International Stock ETF", ticker: "VXUS", expense_ratio: 0.08 },
        { name: "iShares Core MSCI Total International Stock ETF", ticker: "IXUS", expense_ratio: 0.09 },
        { name: "Schwab International Equity ETF", ticker: "SCHF", expense_ratio: 0.06 },
      ],
    }

    // Add alternatives to high-fee investments
    const highFeeWithAlternatives = highFeeInvestments.map((investment) => {
      const type = investment.investment_type
      const alternatives = alternativesMap[type] || []

      // Calculate potential savings
      const potentialSavings = alternatives.map((alt) => {
        const newAnnualFee = investment.current_value * (alt.expense_ratio / 100)
        const savings = investment.annual_fee - newAnnualFee
        return {
          ...alt,
          potential_savings: savings,
          new_annual_fee: newAnnualFee,
          savings_percentage: ((investment.expense_ratio - alt.expense_ratio) / investment.expense_ratio) * 100,
        }
      })

      return {
        ...investment,
        alternatives: potentialSavings.sort((a, b) => b.potential_savings - a.potential_savings),
      }
    })

    // Calculate potential savings if all high-fee investments were replaced
    const maxPotentialSavings = highFeeWithAlternatives.reduce((sum, investment) => {
      const bestAlternative = investment.alternatives[0]
      return bestAlternative ? sum + bestAlternative.potential_savings : sum
    }, 0)

    // Calculate 10-year impact of fees
    const tenYearImpact = totalAnnualFees * 10

    return {
      investments: investmentsWithFees,
      totalPortfolioValue,
      totalAnnualFees,
      weightedAverageExpenseRatio,
      highFeeInvestments: highFeeWithAlternatives,
      maxPotentialSavings,
      tenYearImpact,
    }
  } catch (error) {
    console.error("Error in getInvestmentFeeAnalysis:", error)
    throw new Error("Failed to fetch investment fee analysis")
  }
}

// Get portfolio correlation data
export async function getPortfolioCorrelation() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    // Get all investments
    const { data: investments, error } = await supabase
      .from("investments")
      .select(`
        id,
        name,
        ticker,
        investment_type
      `)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching investments for correlation:", error)
      throw new Error("Failed to fetch portfolio correlation")
    }

    // For a real application, you would fetch historical price data for each investment
    // and calculate actual correlations. For this example, we'll simulate correlation data.

    // Create a matrix of correlations
    const correlationMatrix = []
    const investmentCount = investments.length

    for (let i = 0; i < investmentCount; i++) {
      const row = []
      for (let j = 0; j < investmentCount; j++) {
        if (i === j) {
          // Perfect correlation with self
          row.push(1)
        } else {
          // Generate a realistic correlation based on investment types
          const inv1 = investments[i]
          const inv2 = investments[j]

          if (inv1.investment_type === inv2.investment_type) {
            // Same type - higher correlation (0.7 to 0.9)
            row.push(0.7 + Math.random() * 0.2)
          } else if (
            (inv1.investment_type === "Stocks" && inv2.investment_type === "Bonds") ||
            (inv1.investment_type === "Bonds" && inv2.investment_type === "Stocks")
          ) {
            // Stocks and bonds - negative or low correlation (-0.3 to 0.3)
            row.push(-0.3 + Math.random() * 0.6)
          } else {
            // Other combinations - moderate correlation (0.2 to 0.6)
            row.push(0.2 + Math.random() * 0.4)
          }
        }
      }
      correlationMatrix.push(row)
    }

    // Calculate average correlation for each investment
    const averageCorrelations = investments.map((investment, index) => {
      const correlations = correlationMatrix[index].filter((_, i) => i !== index) // Exclude self-correlation
      const avgCorrelation = correlations.reduce((sum, val) => sum + val, 0) / (correlations.length || 1)
      return {
        ...investment,
        average_correlation: avgCorrelation,
      }
    })

    // Calculate portfolio diversification score (lower average correlation is better)
    const portfolioDiversificationScore =
      averageCorrelations.reduce((sum, inv) => sum + inv.average_correlation, 0) / (averageCorrelations.length || 1)

    // Invert the score so higher is better (1 - avg correlation)
    const diversificationScore = 1 - portfolioDiversificationScore

    return {
      investments,
      correlationMatrix,
      averageCorrelations,
      diversificationScore,
    }
  } catch (error) {
    console.error("Error in getPortfolioCorrelation:", error)
    throw new Error("Failed to fetch portfolio correlation")
  }
}

// Get risk-adjusted returns
export async function getRiskAdjustedReturns() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    // Get all investments
    const { data: investments, error } = await supabase
      .from("investments")
      .select(`
        id,
        name,
        ticker,
        investment_type,
        shares,
        current_price,
        purchase_price,
        purchase_date
      `)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching investments for risk-adjusted returns:", error)
      throw new Error("Failed to fetch risk-adjusted returns")
    }

    // Get historical data for each investment
    const investmentsWithMetrics = await Promise.all(
      investments.map(async (investment) => {
        // For a real application, you would fetch actual historical data
        // For this example, we'll simulate returns and volatility

        // Calculate simple return
        const currentValue = investment.shares * investment.current_price
        const costBasis = investment.shares * investment.purchase_price
        const totalReturn = currentValue - costBasis
        const percentReturn = (totalReturn / costBasis) * 100

        // Calculate days held
        const purchaseDate = new Date(investment.purchase_date)
        const currentDate = new Date()
        const daysHeld = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))

        // Calculate annualized return
        const yearsHeld = daysHeld / 365
        const annualizedReturn =
          yearsHeld > 0 ? (Math.pow(1 + percentReturn / 100, 1 / yearsHeld) - 1) * 100 : percentReturn

        // Simulate volatility (standard deviation of returns)
        // Higher for stocks, lower for bonds and cash
        let volatility
        switch (investment.investment_type) {
          case "Stocks":
            volatility = 15 + Math.random() * 10 // 15-25%
            break
          case "Bonds":
            volatility = 5 + Math.random() * 5 // 5-10%
            break
          case "Cash":
            volatility = 0.5 + Math.random() * 1 // 0.5-1.5%
            break
          default:
            volatility = 10 + Math.random() * 10 // 10-20%
        }

        // Calculate Sharpe Ratio (assuming risk-free rate of 2%)
        const riskFreeRate = 2
        const sharpeRatio = (annualizedReturn - riskFreeRate) / volatility

        // Calculate Sortino Ratio (downside deviation)
        // For simplicity, we'll estimate downside deviation as 60% of total volatility
        const downsideDeviation = volatility * 0.6
        const sortinoRatio = (annualizedReturn - riskFreeRate) / downsideDeviation

        // Calculate maximum drawdown (simulated)
        const maxDrawdown = -(volatility * 0.8) // Estimate max drawdown as 80% of volatility

        return {
          ...investment,
          current_value: currentValue,
          cost_basis: costBasis,
          total_return: totalReturn,
          percent_return: percentReturn,
          days_held: daysHeld,
          years_held: yearsHeld,
          annualized_return: annualizedReturn,
          volatility,
          sharpe_ratio: sharpeRatio,
          sortino_ratio: sortinoRatio,
          max_drawdown: maxDrawdown,
        }
      }),
    )

    // Calculate portfolio-level metrics
    const totalValue = investmentsWithMetrics.reduce((sum, inv) => sum + inv.current_value, 0)
    const totalCostBasis = investmentsWithMetrics.reduce((sum, inv) => sum + inv.cost_basis, 0)

    // Calculate weighted metrics
    const weightedMetrics = investmentsWithMetrics.reduce(
      (acc, inv) => {
        const weight = inv.current_value / totalValue
        return {
          annualized_return: acc.annualized_return + inv.annualized_return * weight,
          volatility: acc.volatility + inv.volatility * weight,
          sharpe_ratio: acc.sharpe_ratio + inv.sharpe_ratio * weight,
          sortino_ratio: acc.sortino_ratio + inv.sortino_ratio * weight,
        }
      },
      { annualized_return: 0, volatility: 0, sharpe_ratio: 0, sortino_ratio: 0 },
    )

    // Calculate portfolio return
    const portfolioReturn = ((totalValue - totalCostBasis) / totalCostBasis) * 100

    return {
      investments: investmentsWithMetrics,
      portfolioMetrics: {
        total_value: totalValue,
        total_cost_basis: totalCostBasis,
        portfolio_return: portfolioReturn,
        ...weightedMetrics,
      },
    }
  } catch (error) {
    console.error("Error in getRiskAdjustedReturns:", error)
    throw new Error("Failed to fetch risk-adjusted returns")
  }
}

// Get ESG investment screening
export async function getESGInvestmentScreening() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClient()

    // Get all investments with ESG scores
    const { data: investments, error } = await supabase
      .from("investments")
      .select(`
        id,
        name,
        ticker,
        investment_type,
        shares,
        current_price,
        esg_score
      `)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error fetching investments for ESG screening:", error)
      throw new Error("Failed to fetch ESG investment screening")
    }

    // Calculate current value for each investment
    const investmentsWithValue = investments.map((investment) => ({
      ...investment,
      current_value: investment.shares * investment.current_price,
    }))

    // Calculate total portfolio value
    const totalPortfolioValue = investmentsWithValue.reduce((sum, investment) => sum + investment.current_value, 0)

    // Group investments by ESG score
    const esgGroups = {
      high: { investments: [], value: 0, percentage: 0 },
      medium: { investments: [], value: 0, percentage: 0 },
      low: { investments: [], value: 0, percentage: 0 },
      unknown: { investments: [], value: 0, percentage: 0 },
    }

    investmentsWithValue.forEach((investment) => {
      let group
      if (investment.esg_score === null) {
        group = "unknown"
      } else if (investment.esg_score >= 70) {
        group = "high"
      } else if (investment.esg_score >= 40) {
        group = "medium"
      } else {
        group = "low"
      }

      esgGroups[group].investments.push(investment)
      esgGroups[group].value += investment.current_value
    })

    // Calculate percentages
    for (const group in esgGroups) {
      esgGroups[group].percentage = (esgGroups[group].value / totalPortfolioValue) * 100
    }

    // Calculate overall ESG score (weighted average)
    let weightedEsgScore = 0
    let totalWeightedValue = 0

    investmentsWithValue.forEach((investment) => {
      if (investment.esg_score !== null) {
        weightedEsgScore += investment.esg_score * investment.current_value
        totalWeightedValue += investment.current_value
      }
    })

    const overallEsgScore = totalWeightedValue > 0 ? weightedEsgScore / totalWeightedValue : null

    // Generate ESG improvement recommendations
    const recommendations = []

    // Recommend replacing low ESG investments
    if (esgGroups.low.investments.length > 0) {
      recommendations.push({
        type: "replace_low_esg",
        title: "Replace Low ESG Investments",
        description: "Consider replacing these investments with higher ESG alternatives in the same category.",
        investments: esgGroups.low.investments.sort((a, b) => a.esg_score - b.esg_score).slice(0, 3),
      })
    }

    // Recommend adding high ESG investments if portfolio has low overall score
    if (overallEsgScore !== null && overallEsgScore < 60) {
      recommendations.push({
        type: "add_high_esg",
        title: "Add High ESG Investments",
        description: "Consider adding these high ESG investments to improve your portfolio's sustainability profile.",
        suggestions: [
          { name: "iShares ESG Aware MSCI USA ETF", ticker: "ESGU", esg_score: 85, investment_type: "Stocks" },
          { name: "Vanguard ESG U.S. Stock ETF", ticker: "ESGV", esg_score: 82, investment_type: "Stocks" },
          { name: "iShares Global Clean Energy ETF", ticker: "ICLN", esg_score: 90, investment_type: "Stocks" },
        ],
      })
    }

    // Recommend researching unknown ESG investments
    if (esgGroups.unknown.investments.length > 0) {
      recommendations.push({
        type: "research_unknown",
        title: "Research Unknown ESG Investments",
        description: "These investments don't have ESG scores. Consider researching their ESG profiles.",
        investments: esgGroups.unknown.investments.sort((a, b) => b.current_value - a.current_value).slice(0, 5),
      })
    }

    return {
      investments: investmentsWithValue,
      esgGroups,
      overallEsgScore,
      recommendations,
      totalPortfolioValue,
    }
  } catch (error) {
    console.error("Error in getESGInvestmentScreening:", error)
    throw new Error("Failed to fetch ESG investment screening")
  }
}

