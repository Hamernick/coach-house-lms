import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/auth"
import { listAdminUsers } from "@/lib/admin/users"

function csvEscape(value: string) {
  const needsQuotes = value.includes(",") || value.includes("\n") || value.includes("\"")
  const escaped = value.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

export async function GET(request: Request) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("q") ?? undefined
  const role = searchParams.get("role") ?? undefined
  const status = searchParams.get("status") ?? undefined

  const users = await listAdminUsers({
    search,
    role: role === "admin" || role === "member" ? (role as "admin" | "member" | "all") : "all",
    status: status && status !== "all" ? status : undefined,
  })

  const header = ["Full Name", "Email", "Role", "Enrollments", "Subscription Status", "Last Sign-In"].join(",")
  const rows = users.map((user) =>
    [
      csvEscape(user.fullName ?? ""),
      csvEscape(user.email),
      csvEscape(user.role),
      String(user.enrollmentCount),
      csvEscape(user.subscriptionStatus ?? ""),
      csvEscape(user.lastSignInAt ?? ""),
    ].join(",")
  )

  const csv = [header, ...rows].join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=admin-users.csv",
    },
  })
}
