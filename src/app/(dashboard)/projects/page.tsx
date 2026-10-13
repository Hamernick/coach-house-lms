import { redirect } from "next/navigation"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"

export default async function ProjectsPage() {
  const context = await resolveAuthenticatedAppContext()
  redirect(
    context.profileAudience.isAdmin ? "/organizations" : "/my-organization"
  )
}
