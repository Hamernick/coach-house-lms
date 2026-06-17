import { redirect } from "next/navigation"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const context = await resolveAuthenticatedAppContext()
  redirect(
    context.profileAudience.isAdmin
      ? `/organizations/${id}`
      : "/my-organization"
  )
}
