"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard error", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
      <div>
        <h1 className="text-2xl font-semibold">We hit a snag loading your dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Try again in a moment or head back to the dashboard overview.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => reset()}>Retry</Button>
        <Button asChild variant="outline">
          <a href="/dashboard">Dashboard</a>
        </Button>
      </div>
    </div>
  )
}
