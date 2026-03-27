"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const DEFAULT_DISCORD_INVITE_URL = "https://discord.gg/kDtqKspG"
const DEFAULT_WHATSAPP_INVITE_URL = "https://chat.whatsapp.com/LSLZR3IKS9lAbWDR3uPNLN"

function DiscordLogo({ className }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  )
}

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

type CommunityPlatformCard = {
  id: "discord" | "whatsapp"
  name: string
  description: string
  inviteUrl: string | null
  accentClass: string
  icon: ReactNode
}

const COMMUNITY_PLATFORM_CARDS: CommunityPlatformCard[] = [
  {
    id: "discord",
    name: "Discord",
    description: "Announcements, wins, Q&A, and async support with founders building in Coach House.",
    inviteUrl: (process.env.NEXT_PUBLIC_DISCORD_COMMUNITY_INVITE_URL ?? DEFAULT_DISCORD_INVITE_URL).trim() || null,
    accentClass:
      "border-[#5865F2]/30 bg-[#5865F2]/6 text-[#5865F2] dark:border-[#5865F2]/40 dark:bg-[#5865F2]/10",
    icon: <DiscordLogo className="h-6 w-6" />,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Fast mobile updates, lightweight coordination, and community touchpoints on the go.",
    inviteUrl: (process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_INVITE_URL ?? DEFAULT_WHATSAPP_INVITE_URL).trim() || null,
    accentClass:
      "border-[#25D366]/30 bg-[#25D366]/6 text-[#25D366] dark:border-[#25D366]/40 dark:bg-[#25D366]/10",
    icon: <WhatsAppLogo className="h-6 w-6" />,
  },
]

type CommunityJoinCardsProps = {
  compact?: boolean
  className?: string
  title?: string
  description?: string
  showHeader?: boolean
}

export function CommunityJoinCards({
  compact = false,
  className,
  title = "Join the community",
  description = "Connect with other nonprofit builders in our Discord and WhatsApp spaces.",
  showHeader = true,
}: CommunityJoinCardsProps) {
  return (
    <section className={cn("space-y-4", className)} aria-label="Community invites">
      {showHeader ? (
        <div className={cn("space-y-1", compact && "space-y-0.5")}>
          <h2 className={cn("text-lg font-semibold tracking-tight", compact ? "text-base" : "text-xl")}>{title}</h2>
          <p className={cn("text-sm text-muted-foreground", compact && "text-xs")}>{description}</p>
        </div>
      ) : null}

      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
        {COMMUNITY_PLATFORM_CARDS.map((platform) => {
          const isAvailable = Boolean(platform.inviteUrl)
          return (
            <Card
              key={platform.id}
              className={cn(
                "border-border/70 bg-card/70 shadow-none",
                compact ? "rounded-xl" : "rounded-2xl",
              )}
            >
              <CardHeader className={cn("pb-2", compact ? "px-4 pt-4" : "px-5 pt-5")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                          platform.accentClass,
                        )}
                        aria-hidden
                      >
                        {platform.icon}
                      </div>
                      <CardTitle className={cn("text-base font-semibold tracking-tight", compact && "text-sm")}>
                        {platform.name}
                      </CardTitle>
                    </div>
                    <CardDescription className={cn("leading-relaxed", compact && "text-xs")}>
                      {platform.description}
                    </CardDescription>
                  </div>
                  <Badge variant={isAvailable ? "secondary" : "outline"} className="shrink-0">
                    {isAvailable ? "Open" : "Link pending"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className={cn("pt-1", compact ? "px-4 pb-4" : "px-5 pb-5")}>
                {isAvailable ? (
                  <Button asChild className="w-full justify-center" variant="outline">
                    <Link
                      href={platform.inviteUrl as string}
                      target="_blank"
                      rel="noreferrer"
                      prefetch={false}
                    >
                      Join {platform.name}
                    </Link>
                  </Button>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-center text-xs text-muted-foreground">
                    Add `NEXT_PUBLIC_WHATSAPP_COMMUNITY_INVITE_URL` to enable this invite.
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
