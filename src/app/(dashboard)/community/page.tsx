import { CommunityJoinCards } from "@/components/community/community-join-cards"
import { requireServerSession } from "@/lib/auth"
import { publicSharingEnabled } from "@/lib/feature-flags"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function CommunityPage() {
  if (!publicSharingEnabled) {
    await requireServerSession("/community")
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center py-6 sm:py-10">
      <div className="w-full space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Community</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Join the Coach House communities</h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Choose the space that fits your workflow. Discord is best for async threads and announcements, and WhatsApp is best for quick mobile coordination.
          </p>
        </div>

        <CommunityJoinCards
          className="mx-auto max-w-2xl text-left"
          title="Community invites"
          description="Open either link to join the conversation."
          showHeader={false}
        />
      </div>
    </div>
  )
}
