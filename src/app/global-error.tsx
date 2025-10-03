"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    console.error("Global fatal error", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
      <h1 className="text-2xl font-semibold">Unexpected error</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        We could not recover from an unexpected error. Please refresh the page or contact support.
      </p>
      <Link className="mt-4 text-sm text-primary underline" href="/">
        Go home
      </Link>
    </div>
  )
}
