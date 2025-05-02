"use client"

import { useEffect, useRef } from "react"
import { getGoals, type Goal } from "@/app/actions/goals"
import { useQuery } from "@tanstack/react-query"

export function PriorityMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Fetch goals data
  const { data } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { goals } = await getGoals()
      return goals || []
    },
  })

  useEffect(() => {
    if (!canvasRef.current || !data) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    ctx.scale(dpr, dpr)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw quadrants
    const width = rect.width
    const height = rect.height
    const midX = width / 2
    const midY = height / 2

    // Draw axes
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 2

    // Horizontal axis
    ctx.beginPath()
    ctx.moveTo(0, midY)
    ctx.lineTo(width, midY)
    ctx.stroke()

    // Vertical axis
    ctx.beginPath()
    ctx.moveTo(midX, 0)
    ctx.lineTo(midX, height)
    ctx.stroke()

    // Draw quadrant labels
    ctx.font = "14px sans-serif"
    ctx.fillStyle = "#6b7280"
    ctx.textAlign = "center"

    // Top-right: Important & Urgent
    ctx.fillText("Important & Urgent", midX + width / 4, 20)

    // Top-left: Important & Not Urgent
    ctx.fillText("Important & Not Urgent", midX - width / 4, 20)

    // Bottom-right: Not Important & Urgent
    ctx.fillText("Not Important & Urgent", midX + width / 4, height - 10)

    // Bottom-left: Not Important & Not Urgent
    ctx.fillText("Not Important & Not Urgent", midX - width / 4, height - 10)

    // Draw goals as circles
    data.forEach((goal: Goal) => {
      // Calculate position based on priority and target date
      let urgency = 0.5
      let importance = 0.5

      // Calculate urgency based on end_date (target date)
      if (goal.end_date) {
        const now = new Date()
        const targetDate = new Date(goal.end_date)
        const timeUntilTarget = targetDate.getTime() - now.getTime()
        const maxTimeFrame = 1000 * 60 * 60 * 24 * 365 // 1 year in ms
        urgency = timeUntilTarget < 0 ? 1 : 1 - Math.min(1, timeUntilTarget / maxTimeFrame)
      }

      // Calculate importance based on priority (1=high, 2=medium, 3=low)
      if (typeof goal.priority === 'number') {
        // Convert numeric priority to importance value (inverse relationship)
        // Priority 1 (high) = 0.8 importance, Priority 3 (low) = 0.2 importance
        importance = 1 - ((goal.priority - 1) / 4) // Maps 1->0.8, 2->0.5, 3->0.2
      } else {
        // Fallback if priority is not a number
        importance = 0.5
      }

      // Calculate position
      const x = midX + (urgency - 0.5) * width
      const y = midY - (importance - 0.5) * height

      // Calculate size based on target amount
      const maxAmount = Math.max(...data.map((g: Goal) => g.target_amount))
      const minSize = 10
      const maxSize = 30
      const size = minSize + (goal.target_amount / maxAmount) * (maxSize - minSize)

      // Calculate color based on progress
      const progress = goal.target_amount > 0 ? (goal.current_amount || 0) / goal.target_amount : 0
      const r = Math.floor(255 * (1 - progress))
      const g = Math.floor(255 * progress)
      const b = 100

      // Draw circle
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`
      ctx.fill()
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 1)`
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw goal name
      ctx.font = "12px sans-serif"
      ctx.fillStyle = "#1f2937"
      ctx.textAlign = "center"
      ctx.fillText(goal.name.length > 15 ? goal.name.substring(0, 15) + "..." : goal.name, x, y + size + 15)
    })
  }, [data])

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

