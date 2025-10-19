import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function CommunityPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/community")
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 lg:px-6">
      <Card className="border-dashed border-border/70 bg-card/60">
        <CardHeader>
          <CardTitle>Community</CardTitle>
          <CardDescription>
            We&apos;re building a dedicated community experience to connect learners and mentors. Stay tuned for updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            In the meantime, you can reach out to our team via the knowledge base or contact support for any questions.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
