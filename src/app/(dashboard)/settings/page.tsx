import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSupabaseServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/settings")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .maybeSingle<{ full_name: string | null }>()

  const metadata = session.user.user_metadata ?? {}
  const marketingOptIn = Boolean(metadata.marketing_opt_in ?? true)
  const newsletterOptIn = Boolean(metadata.newsletter_opt_in ?? true)

  const resolved = searchParams ? await searchParams : {}
  const status = typeof resolved.status === "string" ? resolved.status : null

  return (
    <div className="flex flex-col gap-6">
      <section className="px-4 lg:px-6">
        <DashboardBreadcrumbs
          segments={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings" },
          ]}
        />
      </section>
      <section className="space-y-4 px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-semibold">Profile settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account details and communication preferences.
          </p>
        </div>
        {status === "updated" ? (
          <p className="rounded-md border border-emerald-400 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
            Preferences updated successfully.
          </p>
        ) : null}
        <Card className="border bg-card/60">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Update how your name appears across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateAccountAction} className="space-y-4">
              <input type="hidden" name="redirect" value="/settings?status=updated" />
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={profile?.full_name ?? ""}
                  placeholder="Your name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={session.user.email ?? ""} disabled />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">
                  Save changes
                </Button>
                <Button variant="outline" type="button" asChild>
                  <a href="/update-password">Change password</a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="border bg-card/60">
          <CardHeader>
            <CardTitle>Communication preferences</CardTitle>
            <CardDescription>Choose the updates you’d like to receive from Coach House.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updatePreferencesAction} className="space-y-4">
              <input type="hidden" name="redirect" value="/settings?status=updated" />
              <div className="flex items-start gap-3 rounded-md border border-border/50 p-3">
                <Checkbox id="marketingOptIn" name="marketingOptIn" defaultChecked={marketingOptIn} />
                <div className="space-y-1">
                  <Label htmlFor="marketingOptIn" className="text-sm font-medium">
                    Product communication
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Keep me informed about product updates, tips, and offers.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-md border border-border/50 p-3">
                <Checkbox id="newsletterOptIn" name="newsletterOptIn" defaultChecked={newsletterOptIn} />
                <div className="space-y-1">
                  <Label htmlFor="newsletterOptIn" className="text-sm font-medium">
                    Weekly newsletter
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive curated learning resources and Coach House news.
                  </p>
                </div>
              </div>
              <Button type="submit">
                Save preferences
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

async function updateAccountAction(formData: FormData) {
  "use server"

  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/settings")
  }

  const fullName = formData.get("fullName")
  const redirectTo = typeof formData.get("redirect") === "string" ? (formData.get("redirect") as string) : "/settings"

  await supabase
    .from("profiles")
    .update({ full_name: typeof fullName === "string" && fullName.trim().length > 0 ? fullName.trim() : null })
    .eq("id", session.user.id)

  revalidatePath("/settings")
  redirect(redirectTo)
}

async function updatePreferencesAction(formData: FormData) {
  "use server"

  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/settings")
  }

  const redirectTo = typeof formData.get("redirect") === "string" ? (formData.get("redirect") as string) : "/settings"
  const marketingOptIn = formData.get("marketingOptIn") === "on"
  const newsletterOptIn = formData.get("newsletterOptIn") === "on"

  await supabase.auth.updateUser({
    data: {
      marketing_opt_in: marketingOptIn,
      newsletter_opt_in: newsletterOptIn,
    },
  })

  revalidatePath("/settings")
  redirect(redirectTo)
}
