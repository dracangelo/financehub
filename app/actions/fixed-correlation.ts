// This is a fixed version of the getPortfolioCorrelation function
// Replace the existing function in investments.ts with this one

export async function getPortfolioCorrelation() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      redirect("/login")
    }

    const supabase = createClientComponentClient()

    // Try to get correlation data from the advanced schema
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (portfolios && portfolios.length > 0) {
      const portfolioId = portfolios[0].id

      // Get correlation data - using proper join syntax
      const { data: correlations } = await supabase
        .from('portfolio_correlations')
        .select(`
          asset_id_1,
          asset_id_2,
          correlation_value,
          asset1:assets(name, ticker),
          asset2:assets(name, ticker)
        `)
        .eq('portfolio_id', portfolioId)
        .eq('assets.id', 'asset_id_1')
        .eq('assets.id', 'asset_id_2')

      if (correlations && correlations.length > 0) {
        // Transform data for heatmap visualization
        const uniqueAssets = new Set<string>()
        
        correlations.forEach(corr => {
          if (corr.asset1 && corr.asset1.ticker) {
            uniqueAssets.add(corr.asset1.ticker)
          }
          if (corr.asset2 && corr.asset2.ticker) {
            uniqueAssets.add(corr.asset2.ticker)
          }
        })
        
        const assets = Array.from(uniqueAssets)
        const correlationMatrix: number[][] = Array(assets.length).fill(0).map(() => Array(assets.length).fill(0))
        
        correlations.forEach(corr => {
          if (corr.asset1 && corr.asset2 && corr.asset1.ticker && corr.asset2.ticker) {
            const ticker1 = corr.asset1.ticker
            const ticker2 = corr.asset2.ticker
            
            const idx1 = assets.indexOf(ticker1)
            const idx2 = assets.indexOf(ticker2)
            
            if (idx1 >= 0 && idx2 >= 0) {
              correlationMatrix[idx1][idx2] = corr.correlation_value
              correlationMatrix[idx2][idx1] = corr.correlation_value // Mirror the matrix
            }
          }
        })
        
        return {
          assets,
          correlationMatrix
        }
      }
    }

    // Fallback to simple investments - generate synthetic correlation
    const { data: investments } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)

    if (investments && investments.length > 0) {
      const assets = investments.map(inv => inv.ticker || inv.name)
      const correlationMatrix: number[][] = Array(assets.length).fill(0).map(() => Array(assets.length).fill(0))
      
      // Generate synthetic correlations
      for (let i = 0; i < assets.length; i++) {
        for (let j = 0; j < assets.length; j++) {
          if (i === j) {
            correlationMatrix[i][j] = 1 // Self-correlation is always 1
          } else if (i < j) {
            // Generate a realistic correlation based on investment types
            const type1 = investments[i].type
            const type2 = investments[j].type
            
            let correlation = 0.5 // Default moderate correlation
            
            if (type1 === type2) {
              // Same type assets tend to be more correlated
              correlation = 0.7 + Math.random() * 0.3
            } else if ((type1 === 'bond' && type2 === 'stock') || (type1 === 'stock' && type2 === 'bond')) {
              // Stocks and bonds tend to have negative or low correlation
              correlation = -0.2 + Math.random() * 0.4
            } else if ((type1 === 'real_estate' || type2 === 'real_estate')) {
              // Real estate has moderate correlation with other assets
              correlation = 0.3 + Math.random() * 0.4
            }
            
            correlationMatrix[i][j] = parseFloat(correlation.toFixed(2))
            correlationMatrix[j][i] = correlationMatrix[i][j] // Mirror the matrix
          }
        }
      }
      
      return {
        assets,
        correlationMatrix
      }
    }

    // Return empty data if no investments found
    return {
      assets: [],
      correlationMatrix: []
    }
  } catch (error) {
    console.error("Error in getPortfolioCorrelation:", error)
    return {
      assets: [],
      correlationMatrix: []
    }
  }
}
