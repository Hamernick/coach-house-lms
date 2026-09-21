import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { DocumentsPreview } from "./documents-preview"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"

export default async function DocumentsBannerVisualRegressionPage() {
  if (!canAccessVisualRegressionRoute(await headers())) {
    notFound()
  }

  return (
    <main className="bg-background text-foreground flex min-h-screen items-start p-3 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <DocumentsPreview />
      </div>
    </main>
  )
}
