"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"
import { redirect } from "next/navigation"
import { getCurrentUser } from "./user"

export async function seedInvestmentData() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }
    
    const userId = user.id
    const supabase = await createServerSupabaseClient()

    // Check if user already has investment data
    const { count: investmentCount } = await supabase
      .from("investments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    const { count: portfolioCount } = await supabase
      .from("portfolios")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if ((investmentCount && investmentCount > 0) || (portfolioCount && portfolioCount > 0)) {
      return { success: true, message: "Investment data already exists for this user" }
    }

    // Create a benchmark
    const benchmarkId = uuidv4()
    await supabase.from("benchmarks").insert({
      id: benchmarkId,
      name: "S&P 500",
      description: "Standard & Poor's 500 Index"
    })

    // Create portfolio
    const portfolioId = uuidv4()
    await supabase.from("portfolios").insert({
      id: portfolioId,
      user_id: userId,
      name: "Main Investment Portfolio",
      benchmark_id: benchmarkId
    })

    // Create assets
    const assets = [
      { 
        name: "Apple Inc.", 
        ticker: "AAPL", 
        asset_type: "stock", 
        esg_score: 82, 
        sector: "Technology",
        is_dividend_paying: true
      },
      { 
        name: "Microsoft Corporation", 
        ticker: "MSFT", 
        asset_type: "stock", 
        esg_score: 85, 
        sector: "Technology",
        is_dividend_paying: true
      },
      { 
        name: "Vanguard Total Stock Market ETF", 
        ticker: "VTI", 
        asset_type: "etf", 
        esg_score: 75, 
        sector: "Diversified",
        is_dividend_paying: true
      },
      { 
        name: "Vanguard Total Bond Market ETF", 
        ticker: "BND", 
        asset_type: "etf", 
        esg_score: 70, 
        sector: "Fixed Income",
        is_dividend_paying: true
      },
      { 
        name: "Vanguard Real Estate ETF", 
        ticker: "VNQ", 
        asset_type: "etf", 
        esg_score: 68, 
        sector: "Real Estate",
        is_dividend_paying: true
      },
      { 
        name: "iShares ESG Aware MSCI USA ETF", 
        ticker: "ESGU", 
        asset_type: "etf", 
        esg_score: 90, 
        sector: "Sustainable Investing",
        is_dividend_paying: true
      },
      { 
        name: "Tesla, Inc.", 
        ticker: "TSLA", 
        asset_type: "stock", 
        esg_score: 65, 
        sector: "Automotive",
        is_dividend_paying: false
      },
      { 
        name: "Berkshire Hathaway Inc.", 
        ticker: "BRK.B", 
        asset_type: "stock", 
        esg_score: 60, 
        sector: "Financials",
        is_dividend_paying: false
      }
    ]

    const assetIds: Record<string, string> = {}

    for (const asset of assets) {
      const id = uuidv4()
      assetIds[asset.ticker] = id

      await supabase.from("assets").insert({
        id,
        name: asset.name,
        ticker: asset.ticker,
        asset_type: asset.asset_type,
        esg_score: asset.esg_score,
        sector: asset.sector,
        is_dividend_paying: asset.is_dividend_paying
      })
    }

    // Create holdings
    const holdings = [
      { ticker: "AAPL", quantity: 50, cost_basis: 150 },
      { ticker: "MSFT", quantity: 40, cost_basis: 280 },
      { ticker: "VTI", quantity: 100, cost_basis: 210 },
      { ticker: "BND", quantity: 200, cost_basis: 85 },
      { ticker: "VNQ", quantity: 75, cost_basis: 95 },
      { ticker: "ESGU", quantity: 60, cost_basis: 100 },
      { ticker: "TSLA", quantity: 15, cost_basis: 220 },
      { ticker: "BRK.B", quantity: 20, cost_basis: 300 }
    ]

    const holdingIds: Record<string, string> = {}
    const today = new Date()

    for (const holding of holdings) {
      const id = uuidv4()
      holdingIds[holding.ticker] = id

      await supabase.from("holdings").insert({
        id,
        portfolio_id: portfolioId,
        asset_id: assetIds[holding.ticker],
        quantity: holding.quantity,
        cost_basis: holding.cost_basis,
        acquisition_date: new Date(today.getFullYear() - 1, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0]
      })
    }

    // Create asset price history (last 12 months)
    for (const asset of assets) {
      const basePrice = asset.ticker === "AAPL" ? 170 : 
                        asset.ticker === "MSFT" ? 320 : 
                        asset.ticker === "VTI" ? 230 : 
                        asset.ticker === "BND" ? 80 : 
                        asset.ticker === "VNQ" ? 85 : 
                        asset.ticker === "ESGU" ? 105 : 
                        asset.ticker === "TSLA" ? 240 : 
                        asset.ticker === "BRK.B" ? 350 : 100
      
      const volatility = asset.ticker === "TSLA" ? 0.08 : 
                         asset.ticker === "AAPL" || asset.ticker === "MSFT" ? 0.05 : 
                         asset.ticker === "BRK.B" ? 0.04 : 
                         asset.ticker === "VNQ" ? 0.06 : 
                         asset.ticker === "BND" ? 0.02 : 0.03
      
      let currentPrice = basePrice
      let totalReturn = 0

      for (let i = 12; i >= 0; i--) {
        const priceDate = new Date(today.getFullYear(), today.getMonth() - i, 15)
        
        // Random price movement with trend
        const trend = Math.random() > 0.4 ? 1 : -1
        const movement = trend * volatility * basePrice * Math.random()
        currentPrice += movement
        
        // Ensure price doesn't go too low
        if (currentPrice < basePrice * 0.7) {
          currentPrice = basePrice * 0.7 + Math.random() * basePrice * 0.1
        }
        
        // Calculate return
        totalReturn = ((currentPrice - basePrice) / basePrice) * 100
        
        // Add dividend if applicable
        const dividendAmount = asset.is_dividend_paying && i % 3 === 0 ? basePrice * 0.005 : 0
        
        await supabase.from("asset_prices").insert({
          id: uuidv4(),
          asset_id: assetIds[asset.ticker],
          price_date: priceDate.toISOString().split('T')[0],
          closing_price: parseFloat(currentPrice.toFixed(2)),
          dividend_amount: parseFloat(dividendAmount.toFixed(2)),
          total_return: parseFloat(totalReturn.toFixed(2))
        })
      }
    }

    // Create transactions
    const transactionTypes = ['buy', 'sell', 'dividend_reinvest', 'rebalance']
    
    for (const holding of holdings) {
      // Generate 3-8 transactions per holding
      const numTransactions = Math.floor(Math.random() * 6) + 3
      
      for (let i = 0; i < numTransactions; i++) {
        const transactionDate = new Date(
          today.getFullYear() - (Math.random() > 0.7 ? 1 : 0), 
          today.getMonth() - Math.floor(Math.random() * 12), 
          Math.floor(Math.random() * 28) + 1
        )
        
        const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]
        const quantity = type === 'buy' || type === 'dividend_reinvest' ? 
                        Math.floor(Math.random() * 10) + 1 : 
                        Math.floor(Math.random() * 5) + 1
                        
        const price = holding.cost_basis * (0.9 + Math.random() * 0.2)
        const fee = Math.random() * 10
        
        await supabase.from("inv_transactions").insert({
          id: uuidv4(),
          holding_id: holdingIds[holding.ticker],
          type,
          quantity,
          price,
          fee,
          tax_impact: type === 'sell' ? price * quantity * 0.15 : 0,
          transaction_date: transactionDate.toISOString()
        })
      }
    }

    // Create portfolio correlations
    const assetTickers = Object.keys(assetIds)
    
    for (let i = 0; i < assetTickers.length; i++) {
      for (let j = i; j < assetTickers.length; j++) {
        const ticker1 = assetTickers[i]
        const ticker2 = assetTickers[j]
        
        // Self-correlation is always 1
        if (ticker1 === ticker2) {
          await supabase.from("portfolio_correlations").insert({
            id: uuidv4(),
            portfolio_id: portfolioId,
            asset_id_1: assetIds[ticker1],
            asset_id_2: assetIds[ticker2],
            correlation_value: 1
          })
          continue
        }
        
        // Generate realistic correlations
        let correlation = 0
        
        // Stocks tend to be more correlated with each other
        if (ticker1.match(/AAPL|MSFT|TSLA|BRK.B/) && ticker2.match(/AAPL|MSFT|TSLA|BRK.B/)) {
          correlation = 0.6 + Math.random() * 0.3
        } 
        // ETFs tend to be more correlated with stocks in their sector
        else if ((ticker1 === "VTI" && ticker2.match(/AAPL|MSFT|TSLA|BRK.B/)) || 
                 (ticker2 === "VTI" && ticker1.match(/AAPL|MSFT|TSLA|BRK.B/))) {
          correlation = 0.7 + Math.random() * 0.2
        }
        // Bonds tend to have negative or low correlation with stocks
        else if ((ticker1 === "BND" && ticker2.match(/AAPL|MSFT|TSLA|BRK.B/)) || 
                 (ticker2 === "BND" && ticker1.match(/AAPL|MSFT|TSLA|BRK.B/))) {
          correlation = -0.2 + Math.random() * 0.4
        }
        // Real estate has moderate correlation with stocks
        else if ((ticker1 === "VNQ" && ticker2.match(/AAPL|MSFT|TSLA|BRK.B/)) || 
                 (ticker2 === "VNQ" && ticker1.match(/AAPL|MSFT|TSLA|BRK.B/))) {
          correlation = 0.3 + Math.random() * 0.4
        }
        // ESG ETF correlation with stocks
        else if ((ticker1 === "ESGU" && ticker2.match(/AAPL|MSFT|TSLA/)) || 
                 (ticker2 === "ESGU" && ticker1.match(/AAPL|MSFT|TSLA/))) {
          correlation = 0.6 + Math.random() * 0.3
        }
        // Default correlation
        else {
          correlation = 0.2 + Math.random() * 0.4
        }
        
        await supabase.from("portfolio_correlations").insert({
          id: uuidv4(),
          portfolio_id: portfolioId,
          asset_id_1: assetIds[ticker1],
          asset_id_2: assetIds[ticker2],
          correlation_value: parseFloat(correlation.toFixed(2))
        })
      }
    }

    // Create efficient frontier points
    const riskLevels = [3, 5, 7, 9, 11, 13, 15, 17]
    
    for (const risk of riskLevels) {
      // Higher risk generally means higher expected return
      const expectedReturn = risk * 0.8 + Math.random() * 2
      
      // Create allocation based on risk level
      const allocation: Record<string, number> = {}
      
      if (risk <= 5) {
        // Conservative allocation
        allocation["BND"] = 60 - risk * 2
        allocation["VTI"] = 20 + risk * 2
        allocation["AAPL"] = 5
        allocation["MSFT"] = 5
        allocation["VNQ"] = 5
        allocation["ESGU"] = 5
        allocation["TSLA"] = 0
        allocation["BRK.B"] = 0
      } else if (risk <= 10) {
        // Moderate allocation
        allocation["BND"] = 50 - risk * 3
        allocation["VTI"] = 20 + risk * 2
        allocation["AAPL"] = 5 + risk * 0.5
        allocation["MSFT"] = 5 + risk * 0.5
        allocation["VNQ"] = 10
        allocation["ESGU"] = 10
        allocation["TSLA"] = 0
        allocation["BRK.B"] = risk - 5
      } else {
        // Aggressive allocation
        allocation["BND"] = 30 - risk
        allocation["VTI"] = 30
        allocation["AAPL"] = 10
        allocation["MSFT"] = 10
        allocation["VNQ"] = 5
        allocation["ESGU"] = 5
        allocation["TSLA"] = risk - 10
        allocation["BRK.B"] = 10
      }
      
      // Convert to JSON format
      const allocationJson: Record<string, number> = {}
      for (const [ticker, percentage] of Object.entries(allocation)) {
        allocationJson[ticker] = parseFloat(percentage.toFixed(1))
      }
      
      await supabase.from("efficient_frontier_points").insert({
        id: uuidv4(),
        portfolio_id: portfolioId,
        expected_return: parseFloat(expectedReturn.toFixed(2)),
        risk,
        allocation: allocationJson
      })
    }

    // Create performance attribution
    const factors = ["Sector", "Style", "Currency", "Selection", "Allocation"]
    const periods = ["Q1-2025", "Q2-2025", "Q3-2025", "Q4-2025"]
    
    for (const period of periods) {
      let totalContribution = 0
      
      for (let i = 0; i < factors.length - 1; i++) {
        const factor = factors[i]
        const contribution = (Math.random() * 2 - 0.5) * (factor === "Sector" ? 2 : 1)
        totalContribution += contribution
        
        await supabase.from("performance_attribution").insert({
          id: uuidv4(),
          portfolio_id: portfolioId,
          factor_name: factor,
          contribution: parseFloat(contribution.toFixed(2)),
          period
        })
      }
      
      // Last factor makes the total sum to a reasonable number
      const lastFactor = factors[factors.length - 1]
      const lastContribution = parseFloat((Math.random() * 2 - totalContribution).toFixed(2))
      
      await supabase.from("performance_attribution").insert({
        id: uuidv4(),
        portfolio_id: portfolioId,
        factor_name: lastFactor,
        contribution: lastContribution,
        period
      })
    }

    // Create investment fees
    for (const asset of assets) {
      const feeTypes = ["management_fee", "expense_ratio", "transaction_fee"]
      
      for (const feeType of feeTypes) {
        let feePercent = 0
        let suggestedAlternative = null
        
        if (feeType === "expense_ratio") {
          if (asset.asset_type === "etf") {
            feePercent = 0.03 + Math.random() * 0.3
            
            if (feePercent > 0.2) {
              suggestedAlternative = "Consider lower-cost ETF alternatives"
            }
          } else {
            continue // Stocks don't have expense ratios
          }
        } else if (feeType === "management_fee") {
          feePercent = 0.5 + Math.random() * 0.5
          
          if (feePercent > 0.8) {
            suggestedAlternative = "Consider self-directed investing to reduce fees"
          }
        } else if (feeType === "transaction_fee") {
          feePercent = Math.random() * 0.1
          
          if (feePercent > 0.05) {
            suggestedAlternative = "Consider a broker with lower transaction fees"
          }
        }
        
        await supabase.from("investment_fees").insert({
          id: uuidv4(),
          asset_id: assetIds[asset.ticker],
          fee_type: feeType,
          fee_percent: parseFloat(feePercent.toFixed(3)),
          suggested_alternative: suggestedAlternative
        })
      }
    }

    // Create market conditions
    const indicators = [
      "S&P 500 P/E Ratio", 
      "10-Year Treasury Yield", 
      "VIX Volatility Index", 
      "Unemployment Rate",
      "Inflation Rate"
    ]
    
    const indicatorValues = {
      "S&P 500 P/E Ratio": 22.5,
      "10-Year Treasury Yield": 3.8,
      "VIX Volatility Index": 18.2,
      "Unemployment Rate": 3.7,
      "Inflation Rate": 2.9
    }
    
    // Current values
    for (const indicator of indicators) {
      await supabase.from("market_conditions").insert({
        id: uuidv4(),
        indicator_name: indicator,
        value: indicatorValues[indicator as keyof typeof indicatorValues],
        recorded_at: new Date().toISOString()
      })
    }
    
    // Historical values (last 6 months)
    for (let i = 1; i <= 6; i++) {
      const historicalDate = new Date(today.getFullYear(), today.getMonth() - i, 15)
      
      for (const indicator of indicators) {
        const baseValue = indicatorValues[indicator as keyof typeof indicatorValues]
        const variance = baseValue * 0.1 * (Math.random() * 2 - 1)
        
        await supabase.from("market_conditions").insert({
          id: uuidv4(),
          indicator_name: indicator,
          value: parseFloat((baseValue + variance).toFixed(1)),
          recorded_at: historicalDate.toISOString()
        })
      }
    }

    // Create dashboard preferences
    await supabase.from("dashboard_preferences").insert({
      id: uuidv4(),
      user_id: userId,
      risk_display_mode: "advanced",
      preferred_view: "detailed",
      show_market_context: true
    })

    // Create investments in the simple investments table
    const investmentTypes = ["stock", "etf", "bond", "real_estate", "crypto", "cash"]
    const simpleInvestments = [
      { 
        name: "Apple Stock", 
        ticker: "AAPL", 
        type: "stock", 
        value: 8500, 
        cost_basis: 7500 
      },
      { 
        name: "Vanguard Total Stock Market", 
        ticker: "VTI", 
        type: "etf", 
        value: 23000, 
        cost_basis: 20000 
      },
      { 
        name: "US Treasury Bonds", 
        ticker: "GOVT", 
        type: "bond", 
        value: 15000, 
        cost_basis: 15500 
      },
      { 
        name: "Real Estate Investment Trust", 
        ticker: "VNQ", 
        type: "real_estate", 
        value: 7500, 
        cost_basis: 7000 
      },
      { 
        name: "Bitcoin", 
        ticker: "BTC", 
        type: "crypto", 
        value: 5000, 
        cost_basis: 4000 
      },
      { 
        name: "High-Yield Savings", 
        ticker: null, 
        type: "cash", 
        value: 10000, 
        cost_basis: 10000 
      }
    ]

    for (const inv of simpleInvestments) {
      await supabase.from("investments").insert({
        id: uuidv4(),
        user_id: userId,
        name: inv.name,
        ticker: inv.ticker,
        type: inv.type,
        value: inv.value,
        cost_basis: inv.cost_basis,
        allocation: 0, // Will be calculated later
        currency: "USD"
      })
    }

    // Create portfolio targets
    const targets = {
      "stock": 40,
      "etf": 25,
      "bond": 20,
      "real_estate": 5,
      "crypto": 5,
      "cash": 5
    }

    await supabase.from("portfolio_targets").insert({
      id: uuidv4(),
      user_id: userId,
      targets
    })

    return { success: true, message: "Investment data seeded successfully" }
  } catch (error) {
    console.error("Error seeding investment data:", error)
    return { success: false, message: `Error seeding investment data: ${error}` }
  }
}
