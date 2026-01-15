import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckboxField } from "@/components/form/checkbox-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requireServerSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const { supabase, session } = await requireServerSession("/onboarding")

  // If already completed, do not show onboarding
  const completed = Boolean((session.user.user_metadata as Record<string, unknown> | null)?.onboarding_completed)
  if (completed) {
    redirect("/my-organization")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, headline")
    .eq("id", session.user.id)
    .maybeSingle<{ full_name: string | null; headline: string | null }>()

  const metadata = session.user.user_metadata ?? {}

  const marketingOptIn = Boolean(metadata.marketing_opt_in ?? true)
  const newsletterOptIn = Boolean(metadata.newsletter_opt_in ?? true)

  return (
    <div className="flex flex-col gap-6">
      <section className="px-4 lg:px-6">
        <Card className="border bg-card/60">
          <CardHeader>
            <CardTitle>Welcome to Coach House</CardTitle>
            <CardDescription>Tell us a bit about you to personalize your experience.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={completeOnboarding} className="space-y-6">
              <input type="hidden" name="redirect" value="/my-organization" />
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" defaultValue={profile?.full_name ?? ""} placeholder="Your name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goals">Learning goals (optional)</Label>
                <Textarea id="goals" name="goals" defaultValue={profile?.headline ?? ""} placeholder="What would you like to achieve?" />
              </div>
              <div className="space-y-3">
                <CheckboxField
                  id="marketingOptIn"
                  name="marketingOptIn"
                  label="Product communication"
                  description="Get product updates, tips, and offers."
                  defaultChecked={marketingOptIn}
                />
                <CheckboxField
                  id="newsletterOptIn"
                  name="newsletterOptIn"
                  label="Weekly newsletter"
                  description="Curated learning resources and community news."
                  defaultChecked={newsletterOptIn}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">Finish</Button>
                <Button variant="ghost" type="submit" name="skip" value="1">
                  Skip
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

async function completeOnboarding(formData: FormData) {
  "use server"

  const { supabase, session } = await requireServerSession("/onboarding")

  const redirectTo = typeof formData.get("redirect") === "string" ? (formData.get("redirect") as string) : "/my-organization"
  const skipped = formData.get("skip") === "1"

  const fullName = formData.get("fullName")
  const goals = formData.get("goals")
  const marketingOptIn = formData.get("marketingOptIn") === "on"
  const newsletterOptIn = formData.get("newsletterOptIn") === "on"

  // Update profile (non-destructive)
  if (!skipped) {
    await supabase
      .from("profiles")
      .update({
        full_name: typeof fullName === "string" && fullName.trim().length > 0 ? fullName.trim() : null,
        headline: typeof goals === "string" && goals.trim().length > 0 ? goals.trim() : null,
      })
      .eq("id", session.user.id)
  }

  // Update auth metadata and mark completed
  await supabase.auth.updateUser({
    data: {
      marketing_opt_in: skipped ? true : marketingOptIn,
      newsletter_opt_in: skipped ? true : newsletterOptIn,
      onboarding_completed: true,
    },
  })

  revalidatePath("/my-organization")
  redirect(redirectTo)
}
