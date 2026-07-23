import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { DocumentsBanner } from "@/components/organization/org-profile-card/tabs/documents-tab/components/documents-banner"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"

export default async function DocumentsBannerVisualRegressionPage() {
  if (!canAccessVisualRegressionRoute(await headers())) {
    notFound()
  }

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center px-6 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <DocumentsBanner hasRoadmapDocuments canEdit={false} />
      </div>
    </main>
  )
}
