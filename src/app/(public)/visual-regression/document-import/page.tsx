import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"
import { DocumentImportFixture } from "./_components/document-import-fixture"
export default async function Page() {
  if (!canAccessVisualRegressionRoute(await headers())) notFound()
  return <DocumentImportFixture />
}
