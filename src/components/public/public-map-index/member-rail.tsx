"use client"

import type { ReactNode } from "react"

import BellIcon from "lucide-react/dist/esm/icons/bell"
import BookmarkIcon from "lucide-react/dist/esm/icons/bookmark"
import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCompactOrganizationLocation } from "@/lib/location/organization-location"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "CH"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
}

export type PublicMapJoinedOrganization = {
  id: string
  name: string
  tagline: string | null
  logoUrl: string | null
  publicSlug: string | null
  role: "owner" | "admin" | "staff" | "board" | "member"
  canOpenWorkspace: boolean
}

export type PublicMapBoardAlert = {
  id: string
  orgId: string
  orgName: string
  title: string
  startsAt: string
  href: string
}

type PublicMapMemberRailProps = {
  savedOrganizations: PublicMapOrganization[]
  recentOrganizations: PublicMapOrganization[]
  joinedOrganizations: PublicMapJoinedOrganization[]
  boardAlerts: PublicMapBoardAlert[]
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (organizationId: string) => void
}

export function PublicMapMemberRail({
  savedOrganizations,
  recentOrganizations,
  joinedOrganizations,
  boardAlerts,
  onSelectOrganization,
  onToggleFavorite,
}: PublicMapMemberRailProps) {
  return (
    <div className="flex min-h-full flex-col gap-3">
      <Tabs defaultValue="saved" className="flex min-h-full flex-col gap-3">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="joined">Joined</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-0">
          <PublicMapOrganizationsRailSection
            title="Saved organizations"
            icon={<BookmarkIcon className="h-4 w-4 text-muted-foreground" aria-hidden />}
            organizations={savedOrganizations}
            emptyTitle="No saved organizations yet"
            emptyDescription="Tap the heart on any organization to keep it here."
            onSelectOrganization={onSelectOrganization}
            onToggleFavorite={onToggleFavorite}
            removable
          />
        </TabsContent>

        <TabsContent value="recent" className="mt-0">
          <PublicMapOrganizationsRailSection
            title="Recently viewed"
            icon={<Clock3Icon className="h-4 w-4 text-muted-foreground" aria-hidden />}
            organizations={recentOrganizations}
            emptyTitle="No recent organizations yet"
            emptyDescription="Organizations you open from the map will show up here."
            onSelectOrganization={onSelectOrganization}
            onToggleFavorite={onToggleFavorite}
          />
        </TabsContent>

        <TabsContent value="joined" className="mt-0">
          <section className="rounded-2xl border border-border/70 bg-card/95">
            <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
              <Building2Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              <p className="truncate text-sm font-medium text-foreground">
                Joined organizations
              </p>
            </header>
            <div className="max-h-[52vh] overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
              {joinedOrganizations.length === 0 ? (
                <Empty
                  className="min-h-[220px] rounded-xl border border-border/70 bg-background/70"
                  title="No organizations joined yet"
                  description="Accepted invites and memberships will show up here."
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {joinedOrganizations.map((organization) => (
                    <article
                      key={organization.id}
                      className="rounded-xl border border-border/70 bg-background/75 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="size-10 rounded-xl border border-border/60">
                          <AvatarImage
                            src={organization.logoUrl ?? undefined}
                            alt={organization.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="rounded-xl bg-muted/45 text-[11px] font-semibold text-foreground">
                            {buildInitials(organization.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {organization.name}
                          </p>
                          {organization.tagline ? (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {organization.tagline}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="rounded-md border-border/70 bg-background/80 text-[10px]"
                            >
                              {organization.role}
                            </Badge>
                            {organization.canOpenWorkspace ? (
                              <Badge
                                variant="outline"
                                className="rounded-md border-primary/45 bg-primary/10 text-[10px] text-primary"
                              >
                                Workspace access
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          asChild
                          size="sm"
                          variant={organization.canOpenWorkspace ? "default" : "outline"}
                          className="h-8"
                        >
                          <a
                            href={
                              organization.canOpenWorkspace
                                ? "/workspace"
                                : organization.publicSlug
                                  ? `/find/${organization.publicSlug}`
                                  : "/find"
                            }
                          >
                            {organization.canOpenWorkspace
                              ? "Open workspace"
                              : "View organization"}
                          </a>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="alerts" className="mt-0">
          <section className="rounded-2xl border border-border/70 bg-card/95">
            <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
              <BellIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
              <p className="truncate text-sm font-medium text-foreground">
                Board alerts
              </p>
            </header>
            <div className="max-h-[52vh] overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
              {boardAlerts.length === 0 ? (
                <Empty
                  className="min-h-[220px] rounded-xl border border-border/70 bg-background/70"
                  title="No board alerts yet"
                  description="Upcoming board meetings and annual meetings will surface here."
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {boardAlerts.map((alert) => (
                    <article
                      key={alert.id}
                      className="rounded-xl border border-border/70 bg-background/75 p-3"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {alert.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {alert.orgName}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {new Intl.DateTimeFormat(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(new Date(alert.startsAt))}
                      </p>
                      <div className="mt-3 flex justify-end">
                        <Button asChild size="sm" variant="outline" className="h-8">
                          <a href={alert.href}>Open</a>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PublicMapOrganizationsRailSection({
  title,
  icon,
  organizations,
  emptyTitle,
  emptyDescription,
  onSelectOrganization,
  onToggleFavorite,
  removable = false,
}: {
  title: string
  icon: ReactNode
  organizations: PublicMapOrganization[]
  emptyTitle: string
  emptyDescription: string
  onSelectOrganization: (organizationId: string) => void
  onToggleFavorite: (organizationId: string) => void
  removable?: boolean
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/95">
      <header className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
        {icon}
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
      </header>

      <div className="max-h-[52vh] overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
        {organizations.length === 0 ? (
          <Empty
            className="min-h-[220px] rounded-xl border border-border/70 bg-background/70"
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <div className="space-y-2.5">
            {organizations.map((organization) => {
                const location = formatCompactOrganizationLocation({
                  city: organization.city,
                  state: organization.state,
                  country: organization.country,
                })
              return (
                <article
                  key={organization.id}
                  className="rounded-xl border border-border/70 bg-background/75 p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto min-w-0 flex-1 justify-start px-0 py-0 text-left font-normal text-foreground hover:bg-transparent hover:text-foreground"
                      onClick={() => onSelectOrganization(organization.id)}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {organization.name}
                        </p>
                        {organization.tagline ? (
                          <p className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground">
                            {organization.tagline}
                          </p>
                        ) : null}
                        {location ? (
                          <p className="mt-1 inline-flex max-w-full items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span className="truncate">{location}</span>
                          </p>
                        ) : null}
                      </div>
                    </Button>
                    {removable ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full border border-border/70 bg-background/85 px-2 text-xs"
                        onClick={() => onToggleFavorite(organization.id)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
