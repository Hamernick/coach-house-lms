"use client"

import Link from "next/link"
import { useEffect } from "react"

import { reportPageHealthError } from "@/components/providers/page-health-reporter"

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    console.error("Global fatal error", error)
    reportPageHealthError({
      error,
      eventType: "global_error",
      source: "error_boundary",
    })
  }, [error])

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold">Unexpected error</h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        We could not recover from an unexpected error. Please refresh the page
        or contact support.
      </p>
      <Link className="text-primary mt-4 text-sm underline" href="/">
        Go home
      </Link>
    </div>
  )
}
