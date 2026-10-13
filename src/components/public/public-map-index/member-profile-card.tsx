"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

export type PublicMapMemberProfile = {
  name: string | null
  email: string | null
  avatarUrl: string | null
  title: string | null
  company: string | null
  contact: string | null
  about: string | null
}

function buildInitials(name: string | null) {
  const normalized = name?.trim() ?? ""
  if (!normalized) return "CH"
  const parts = normalized.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
}

export function PublicMapMemberProfileCard({
  profile,
}: {
  profile: PublicMapMemberProfile
}) {
  const secondary = [profile.title, profile.company]
    .filter((entry) => Boolean(entry && entry.trim().length > 0))
    .join(" · ")

  return (
    <Card className="rounded-2xl border-border/70 bg-card/95">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-12 rounded-2xl border border-border/70">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.name ?? "Member"} className="object-cover" />
            <AvatarFallback className="rounded-2xl bg-muted/45 text-sm font-semibold text-foreground">
              {buildInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {profile.name?.trim() || "Your profile"}
            </p>
            {secondary ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {secondary}
              </p>
            ) : null}
            {profile.contact ? (
              <p className="mt-2 line-clamp-1 text-[11px] text-muted-foreground">
                {profile.contact}
              </p>
            ) : profile.email ? (
              <p className="mt-2 line-clamp-1 text-[11px] text-muted-foreground">
                {profile.email}
              </p>
            ) : null}
          </div>
        </div>
        {profile.about ? (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {profile.about}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
