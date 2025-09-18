import Link from "next/link"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listAdminUsers } from "@/lib/admin/users"

function csvExportHref(search: string, role: string, status?: string) {
  const params = new URLSearchParams()
  if (search) params.set("q", search)
  if (role && role !== "all") params.set("role", role)
  if (status) params.set("status", status)
  return `/api/admin/users/export?${params.toString()}`
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const params = searchParams ? await searchParams : {}
  const query = typeof params.q === "string" ? params.q : ""
  const roleParam = typeof params.role === "string" ? params.role : "all"
  const statusParam = typeof params.status === "string" ? params.status : undefined

  const users = await listAdminUsers({
    search: query,
    role: roleParam === "admin" || roleParam === "student" ? (roleParam as "admin" | "student" | "all") : "all",
    status: statusParam,
  })

  return (
    <div className="space-y-6">
      <DashboardBreadcrumbs segments={[{ label: "Admin" }, { label: "Users" }]} />
      <div className="flex flex-col gap-4 rounded-xl border bg-card/60 p-4 md:flex-row md:items-end md:justify-between">
        <form className="grid gap-3 md:grid-cols-[200px_160px_160px_auto] md:items-end" method="GET">
          <div className="flex flex-col gap-1">
            <Label htmlFor="search">Search</Label>
            <Input id="search" name="q" placeholder="Email or name" defaultValue={query} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              defaultValue={roleParam}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="status">Subscription</Label>
            <select
              id="status"
              name="status"
              defaultValue={statusParam ?? "all"}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="trialing">Trialing</option>
              <option value="active">Active</option>
              <option value="past_due">Past due</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div className="flex gap-2 md:justify-end">
            <Button type="submit">Apply</Button>
            <Button asChild variant="outline">
              <Link href="/admin/users">Reset</Link>
            </Button>
          </div>
        </form>
        <Button asChild variant="outline">
          <Link href={csvExportHref(query, roleParam, statusParam)}>Export CSV</Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[22%]">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No users found. Adjust filters or try another search query.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">{user.fullName ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="uppercase">{user.role}</TableCell>
                  <TableCell>{user.enrollmentCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.subscriptionStatus ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/users/${user.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
