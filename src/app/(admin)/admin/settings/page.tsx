import { requireAdmin } from "@/lib/admin/auth"

export default async function AdminSettingsPage() {
  await requireAdmin()
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Admin Settings</h1>
      <p className="text-sm text-muted-foreground">Configuration options coming soon.</p>
    </div>
  )
}

