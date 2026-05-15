import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/admin/auth"

export default async function AdminPlatformUserJourneysPage() {
  await requireAdmin()

  redirect("/admin/platform/prototypes?entry=user-journey-atlas")
}
