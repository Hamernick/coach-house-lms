"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard error", error)
  }, [error])

  return (
    <div className="flex w-full flex-1 min-h-0 items-center justify-center overflow-hidden bg-background p-6 text-center text-foreground">
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-balance">We hit a snag loading your dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground text-balance">
            Try again in a moment or head back to Organization.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => reset()}>Retry</Button>
          <Button asChild variant="outline">
            <Link href="/organization">Organization</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
