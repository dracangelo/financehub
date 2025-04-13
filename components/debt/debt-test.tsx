"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { toast } from "@/components/ui/use-toast"

export function DebtTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkDatabaseConnection = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Direct fetch from client to check if the table exists
      const response = await fetch("/api/test-debt-db", {
        method: "POST",
      })
      
      const data = await response.json()
      setResult(data)
      
      if (data.success) {
        toast({
          title: "Database Connection Successful",
          description: `Found debts table with ${data.rowCount || 0} rows`,
        })
      } else {
        setError(data.error || "Unknown error")
        toast({
          title: "Database Connection Failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error testing database:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      toast({
        title: "Test Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Database Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Button onClick={checkDatabaseConnection} disabled={loading}>
            {loading ? "Testing..." : "Test Database Connection"}
          </Button>
          
          {error && (
            <div className="p-4 bg-destructive/10 rounded-md text-destructive">
              <h3 className="font-semibold">Error:</h3>
              <pre className="mt-2 text-sm whitespace-pre-wrap">{error}</pre>
            </div>
          )}
          
          {result && !error && (
            <div className="p-4 bg-primary/10 rounded-md">
              <h3 className="font-semibold">Result:</h3>
              <pre className="mt-2 text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
