import { redirect } from "next/navigation"

import { RoadmapEditor } from "@/components/roadmap/roadmap-editor"
import { RoadmapVisibilityToggle } from "@/components/roadmap/roadmap-visibility-toggle"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveRoadmapSections } from "@/lib/roadmap"
import { Button } from "@/components/ui/button"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import { publicSharingEnabled } from "@/lib/feature-flags"

export const dynamic = "force-dynamic"

export default async function StrategicRoadmapPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    redirect("/login?redirect=/strategic-roadmap")
  }

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("profile, public_slug, is_public_roadmap")
    .eq("user_id", user.id)
    .maybeSingle<{
      profile: Record<string, unknown> | null
      public_slug: string | null
      is_public_roadmap: boolean | null
    }>()

  const profile = (orgRow?.profile ?? {}) as Record<string, unknown>
  const sections = resolveRoadmapSections(profile).map((section) =>
    publicSharingEnabled ? section : { ...section, isPublic: false },
  )

  const publicSlug = orgRow?.public_slug ?? null
  const isPublic = publicSharingEnabled ? Boolean(orgRow?.is_public_roadmap) : false

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 pb-12 pt-6 lg:px-8">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Strategic roadmap
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Build the simplest possible narrative</h1>
          <p className="text-sm text-muted-foreground">
            Keep your roadmap terse. Each milestone opens as you progress through lessons—use it to capture the crisp version you would show a funder or partner.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <RoadmapVisibilityToggle initialPublic={isPublic} publicSlug={publicSlug} />
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <a href="/api/roadmap/docx">
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download .docx
            </a>
          </Button>
        </div>
      </header>
      <RoadmapEditor sections={sections} publicSlug={publicSlug} />
    </div>
  )
}
