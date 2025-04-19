import { NextRequest, NextResponse } from 'next/server'

// Finnhub API base URL
const FINNHUB_API_URL = 'https://finnhub.io/api/v1'

// Get stock quote data from Finnhub
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 })
    }
    
    const apiKey = process.env.FINNHUB_API_KEY
    
    if (!apiKey) {
      console.error('Finnhub API key not found in environment variables')
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
    }
    
    // Fetch quote data from Finnhub
    const response = await fetch(
      `${FINNHUB_API_URL}/quote?symbol=${symbol}&token=${apiKey}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching stock data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    )
  }
}

// Search for stocks by name or symbol
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }
    
    const apiKey = process.env.FINNHUB_API_KEY
    
    if (!apiKey) {
      console.error('Finnhub API key not found in environment variables')
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
    }
    
    // Search for symbols using Finnhub
    const response = await fetch(
      `${FINNHUB_API_URL}/search?q=${encodeURIComponent(query)}&token=${apiKey}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error searching stocks:', error)
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    )
  }
}
