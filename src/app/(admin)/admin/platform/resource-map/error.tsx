"use client"

import Link from "next/link"

import AlertTriangleIcon from "lucide-react/dist/esm/icons/alert-triangle"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function AdminPlatformResourceMapError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[60vh] w-full max-w-2xl items-center px-4 py-8 md:px-6"
    >
      <Alert variant="destructive">
        <AlertTriangleIcon aria-hidden />
        <AlertTitle>
          <h1>Resource Map Review Failed To Load</h1>
        </AlertTitle>
        <AlertDescription>
          <p>
            The review data could not be loaded. Retry the request or return to
            Platform without changing published resources.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 sm:h-9"
              onClick={reset}
            >
              Retry Loading Review
            </Button>
            <Button
              asChild
              type="button"
              variant="ghost"
              className="h-11 sm:h-9"
            >
              <Link href="/admin/platform">Return To Platform</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </main>
  )
}
