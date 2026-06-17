import { redirect } from "next/navigation"
import { WORKSPACE_ROADMAP_PATH } from "@/lib/workspace/routes"

export const dynamic = "force-dynamic"

export default function MyOrganizationRoadmapPage() {
  redirect(WORKSPACE_ROADMAP_PATH)
}
