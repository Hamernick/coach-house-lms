import { notFound } from "next/navigation"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getClassById } from "@/lib/classes"
import { requireAdmin } from "@/lib/admin/auth"

import { ClassPublishedToggle } from "../_components/class-published-toggle"

import type { Database } from "@/lib/supabase/types"
import {
  createModuleAction,
  updateClassDetailsAction,
} from "./actions"
import { ModuleListManager } from "./_components/module-list-manager"
import { EnrollmentsManager } from "./_components/enrollments-manager"

type ClassDetailRecord = Database["public"]["Tables"]["classes"]["Row"] & {
  modules?: {
    id: string
    title: string
    slug: string
    idx: number
    published: boolean
  }[] | null
}

export default async function AdminClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const classData = (await getClassById(id)) as ClassDetailRecord | null

  if (!classData) {
    notFound()
  }

  const modules = (classData.modules ?? []).map((module) => ({
    id: module.id,
    title: module.title,
    slug: module.slug,
    idx: module.idx,
    published: module.published,
  }))

  // Fetch enrollments for this class
  const { supabase } = await requireAdmin()
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("user_id, created_at, profiles ( full_name )")
    .eq("class_id", classData.id)
    .order("created_at", { ascending: false })

  const people = ((enrollments ?? []) as Array<{
    user_id: string
    created_at: string
    profiles: { full_name: string | null } | null
  }>).map((row) => ({
    userId: row.user_id,
    name: row.profiles?.full_name ?? null,
    enrolledAt: row.created_at,
  }))

  return (
    <div className="space-y-6">
      <DashboardBreadcrumbs
        segments={[
          { label: "Admin", href: "/admin/classes" },
          { label: classData.title },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>Class details</CardTitle>
            <CardDescription>Update metadata and publication state.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateClassDetailsAction} className="space-y-4">
              <input type="hidden" name="classId" value={classData.id} />
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={classData.title} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={classData.slug} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={classData.description ?? ""}
                  className="min-h-32"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripeProductId">Stripe product ID</Label>
                <Input
                  id="stripeProductId"
                  name="stripeProductId"
                  defaultValue={classData.stripe_product_id ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripePriceId">Stripe price ID</Label>
                <Input
                  id="stripePriceId"
                  name="stripePriceId"
                  defaultValue={classData.stripe_price_id ?? ""}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Published</p>
                  <p className="text-xs text-muted-foreground">
                    Toggle visibility for students. Draft classes stay hidden.
                  </p>
                </div>
                <ClassPublishedToggle classId={classData.id} published={classData.published} />
              </div>
              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>
        <Card className="bg-card/60">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Modules</CardTitle>
              <CardDescription>Reorder modules or manage publication status.</CardDescription>
            </div>
            <form action={createModuleAction}>
              <input type="hidden" name="classId" value={classData.id} />
              <Button type="submit">Add module</Button>
            </form>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No modules yet. Create one to start building your class.
              </p>
            ) : (
              <ModuleListManager classId={classData.id} modules={modules} />
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/60">
          <CardHeader>
            <CardTitle>People</CardTitle>
            <CardDescription>Enroll existing users or invite by email.</CardDescription>
          </CardHeader>
          <CardContent>
            <EnrollmentsManager classId={classData.id} people={people} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
