import { Buffer } from "node:buffer"

import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { getAdminUserDetail } from "@/lib/admin/users"
import {
  changeUserRoleAction,
  generateMagicLinkAction,
  revokeSessionsAction,
} from "../actions"

function decodeMagicLink(encoded?: string | string[]) {
  if (!encoded || typeof encoded !== "string") {
    return null
  }

  try {
    return Buffer.from(encoded, "base64url").toString("utf8")
  } catch {
    return null
  }
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>
export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: SearchParams
}) {
  const { id } = await params
  const detail = await getAdminUserDetail(id)
  if (!detail) {
    notFound()
  }

  const paramsMap = searchParams ? await searchParams : {}
  const magicLink = decodeMagicLink(paramsMap.magic)

  return (
    <div className="space-y-6">

      <div className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>User profile</CardTitle>
            <CardDescription>Manage role and account-level actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{detail.fullName ?? "—"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{detail.email}</p>
            </div>
            <div className="space-y-3">
              <form action={changeUserRoleAction} className="flex items-end gap-3">
                <input type="hidden" name="userId" value={detail.id} />
                <div className="space-y-1">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    name="role"
                    defaultValue={detail.role}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" size="sm">
                  Update role
                </Button>
              </form>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={revokeSessionsAction} className="inline-flex">
                <input type="hidden" name="userId" value={detail.id} />
                <Button type="submit" variant="outline" size="sm">
                  Revoke sessions
                </Button>
              </form>
              <form action={generateMagicLinkAction} className="inline-flex">
                <input type="hidden" name="userId" value={detail.id} />
                <input type="hidden" name="email" value={detail.email} />
                <Button type="submit" variant="outline" size="sm">
                  Generate magic link
                </Button>
              </form>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Account created: {new Date(detail.createdAt).toLocaleString()}</p>
              <p>Last sign-in: {detail.lastSignInAt ? new Date(detail.lastSignInAt).toLocaleString() : "—"}</p>
            </div>
            {magicLink ? (
              <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/10 p-3">
                <p className="text-sm font-medium text-primary">Magic link (copy & send to user)</p>
                <Textarea readOnly className="text-xs" defaultValue={magicLink} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Latest subscription state synced from Stripe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {detail.subscription ? (
                <>
                  <p className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium capitalize">{detail.subscription.status.replace(/_/g, " ")}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span>{detail.subscription.planName ?? "—"}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current period</span>
                    <span>
                      {detail.subscription.currentPeriodEnd
                        ? new Date(detail.subscription.currentPeriodEnd).toLocaleString()
                        : "—"}
                    </span>
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No subscription on file.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle>Enrollments</CardTitle>
              <CardDescription>Classes the user currently has access to.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">The user is not enrolled in any classes yet.</p>
              ) : (
                <ul className="space-y-3">
                  {detail.enrollments.map((enrollment) => (
                    <li
                      key={enrollment.id}
                      className="flex items-center justify-between rounded-lg border bg-background/40 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{enrollment.classTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()} · Status: {enrollment.status}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/class/${enrollment.classSlug || enrollment.classId}/module/1`}
                          target="_blank"
                          rel="noopener"
                        >
                          Preview
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle>Recent module progress</CardTitle>
              <CardDescription>Latest activity with statuses and completion timestamps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.moduleProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">No progress recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {detail.moduleProgress.map((entry) => (
                    <li key={`${entry.moduleId}-${entry.status}`} className="rounded-lg border bg-background/40 px-3 py-2">
                      <p className="text-sm font-medium">{entry.moduleTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        Status: {entry.status.replace(/_/g, " ")}
                        {entry.completedAt ? ` · Completed ${new Date(entry.completedAt).toLocaleString()}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
