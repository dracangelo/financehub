"use client"

import { Suspense, useEffect, useState } from "react"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { IncomeSourceForm } from "@/components/income/income-source-form"
import { getIncomeSourceById } from "@/app/actions/income-sources"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

interface EditIncomeSourcePageProps {
  params: {
    id: string
  }
}

export default function EditIncomeSourcePage({ params }: EditIncomeSourcePageProps) {
  const router = useRouter()
  const [incomeSource, setIncomeSource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchIncomeSource = async () => {
      try {
        setLoading(true)
        const { id } = params;
        if (!id) {
          router.push("/income")
          return
        }

        const source = await getIncomeSourceById(id)
        if (!source) {
          router.push("/income?error=source-not-found")
          return
        }

        setIncomeSource(source)
      } catch (err) {
        console.error("Error fetching income source:", err)
        setError("Failed to load income source. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchIncomeSource()
  }, [params, router])

  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/income">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Income Source</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading income source details</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/income">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Income Source</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!incomeSource) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/income">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Income Source Not Found</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p>The income source you are looking for could not be found.</p>
              <Button asChild>
                <Link href="/income">Return to Income Sources</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/income">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Income Source</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit {incomeSource.name}</CardTitle>
          <CardDescription>Update the details of this income source</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<FormSkeleton />}>
            <IncomeSourceForm incomeSource={incomeSource} isEditing />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-1/3" />
    </div>
  )
}
