"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("App route error", error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Our team has been notified. You can try again or return to the dashboard.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button onClick={() => reset()}>Try again</Button>
          <Button asChild variant="outline">
            <a href="/dashboard">Back to dashboard</a>
          </Button>
        </div>
      </body>
    </html>
  )
}
