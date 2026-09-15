import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { canAccessVisualRegressionRoute } from "@/lib/visual-regression-access"
import { MobileExperienceFixture } from "./fixture"

export default async function MobileExperienceVisualPage() {
  if (!canAccessVisualRegressionRoute(await headers())) notFound()
  return <MobileExperienceFixture />
}
