"use client"

import { useState } from "react"
import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import HeartIcon from "lucide-react/dist/esm/icons/heart"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"
import WifiIcon from "lucide-react/dist/esm/icons/wifi"

import { ShareButton } from "@/components/shared/share-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PUBLIC_MAP_GROUP_LABELS } from "@/lib/public-map/groups"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

import {
  SOCIAL_ICON_MAP,
  type OrganizationDetailActionLink,
  type OrganizationDetailSocialLink,
} from "./organization-detail-helpers"
import {
  PublicMapOrganizationAdminActions,
  type PublicMapOrganizationCurationAction,
} from "./organization-detail-admin-actions"
import {
  PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_PILL_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME,
} from "./sidebar-theme"

type DetailPanelChromeProps = {
  canManageResourceMap?: boolean
  organizationCurationAction?: PublicMapOrganizationCurationAction
  organization: PublicMapOrganization
  favorites: string[]
  onBack: () => void
  onToggleFavorite: (organizationId: string) => void
}

type DetailIdentityProps = {
  organization: PublicMapOrganization
  profileImageSrc: string | null
  profileInitials: string
  location: string
}

type DetailAboutProps = {
  aboutCopy: string
  aboutExpanded: boolean
  aboutNeedsToggle: boolean
  onToggle: () => void
}

export function OrganizationDetailPanelChrome({
  canManageResourceMap = false,
  organizationCurationAction,
  organization,
  favorites,
  onBack,
  onToggleFavorite,
}: DetailPanelChromeProps) {
  const shareUrl = organization.publicSlug
    ? `/find/${encodeURIComponent(organization.publicSlug)}`
    : undefined
  const isFavorite = favorites.includes(organization.id)
  const favoriteLabel = isFavorite
    ? `Remove ${organization.name} from favorites`
    : `Add ${organization.name} to favorites`

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className={cn(
            "h-8 w-8 rounded-full",
            PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
          )}
          aria-label="Back to search"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        </Button>
        <p className="text-foreground text-sm font-medium">Organization</p>
      </div>
      <div className="flex items-center gap-1.5">
        {canManageResourceMap && organizationCurationAction ? (
          <PublicMapOrganizationAdminActions
            curationAction={organizationCurationAction}
            organization={organization}
            onComplete={onBack}
          />
        ) : null}
        {shareUrl ? (
          <ShareButton
            url={shareUrl}
            title={organization.name}
            iconOnly
            buttonVariant="ghost"
            buttonSize="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
            )}
          />
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-full",
            PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME,
            isFavorite
              ? "border-sky-400/55 bg-sky-500/12 text-sky-600 hover:bg-sky-500/18 dark:border-sky-400/45 dark:bg-sky-400/14 dark:text-sky-300 dark:hover:bg-sky-400/20"
              : "text-muted-foreground"
          )}
          onClick={() => onToggleFavorite(organization.id)}
          aria-label={favoriteLabel}
          aria-pressed={isFavorite}
          title={favoriteLabel}
        >
          <HeartIcon
            className={cn("h-4 w-4", isFavorite && "fill-current")}
            aria-hidden
          />
        </Button>
      </div>
    </div>
  )
}

export function OrganizationDetailIdentitySection({
  organization,
  profileImageSrc,
  profileInitials,
  location,
}: DetailIdentityProps) {
  return (
    <div>
      <div className="mb-2 flex justify-center">
        <Avatar className="border-border/70 bg-muted/25 size-20 rounded-2xl border shadow-sm">
          <AvatarImage
            src={profileImageSrc ?? undefined}
            alt={`${organization.name} profile`}
            className="object-cover"
          />
          <AvatarFallback className="bg-muted/45 text-foreground rounded-2xl text-sm font-semibold">
            {profileInitials}
          </AvatarFallback>
        </Avatar>
      </div>
      <p className="text-2xl leading-tight font-semibold">
        {organization.name}
      </p>
      {organization.tagline ? (
        <p className="text-muted-foreground mt-1 text-sm">
          {organization.tagline}
        </p>
      ) : null}
      {location ? (
        <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-xs">
          <MapPinIcon className="h-3.5 w-3.5" aria-hidden />
          {location}
        </p>
      ) : null}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px]",
            PUBLIC_MAP_SIDEBAR_PILL_CLASSNAME
          )}
        >
          {PUBLIC_MAP_GROUP_LABELS[organization.primaryGroup]}
        </span>
        {organization.isOnlineOnly ? (
          <span className="border-primary/45 bg-primary/10 text-primary inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]">
            <WifiIcon className="mr-1 h-3 w-3" aria-hidden />
            Online resource
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function OrganizationDetailActionLinks({
  actionLinks,
}: {
  actionLinks: OrganizationDetailActionLink[]
}) {
  const [copyingActionKey, setCopyingActionKey] = useState<string | null>(null)

  if (actionLinks.length === 0) return null

  async function handleCopyAction(
    action: Extract<OrganizationDetailActionLink, { kind: "copy" }>
  ) {
    try {
      setCopyingActionKey(action.key)
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(action.value)
        toast.success("Phone number copied", {
          description: action.value,
        })
        return
      }
      if (typeof window !== "undefined") {
        window.prompt("Copy this number:", action.value)
      }
    } catch {
      toast.error("Couldn't copy phone number")
    } finally {
      setCopyingActionKey(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actionLinks.map((action) => {
        const Icon = action.icon

        if (action.kind === "copy") {
          return (
            <Button
              key={action.key}
              type="button"
              variant="ghost"
              onClick={() => void handleCopyAction(action)}
              disabled={copyingActionKey === action.key}
              className={cn(
                "h-16 rounded-xl px-2 text-[11px]",
                PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
              )}
            >
              <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-center">
                <Icon className="h-4.5 w-4.5" aria-hidden />
                <span>{action.label}</span>
              </span>
            </Button>
          )
        }

        return (
          <Button
            key={action.key}
            asChild
            variant="ghost"
            className={cn(
              "h-16 rounded-xl px-2 text-[11px]",
              PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
            )}
          >
            <a
              href={action.href}
              target={action.external ? "_blank" : undefined}
              rel={action.external ? "noreferrer" : undefined}
              className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-center"
            >
              <Icon className="h-4.5 w-4.5" aria-hidden />
              <span>{action.label}</span>
            </a>
          </Button>
        )
      })}
    </div>
  )
}

export function OrganizationDetailAboutSection({
  aboutCopy,
  aboutExpanded,
  aboutNeedsToggle,
  onToggle,
}: DetailAboutProps) {
  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">About</p>
      <p className="text-muted-foreground mt-1 text-sm">
        {aboutCopy}
        {aboutNeedsToggle ? (
          <>
            {" "}
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-primary h-auto px-0 py-0 text-xs"
              onClick={onToggle}
            >
              {aboutExpanded ? "View less" : "View more"}
            </Button>
          </>
        ) : null}
      </p>
    </section>
  )
}

export function OrganizationDetailSocialsSection({
  socials,
}: {
  socials: OrganizationDetailSocialLink[]
}) {
  if (socials.length === 0) return null

  return (
    <section className={cn("p-2.5", PUBLIC_MAP_SIDEBAR_SECTION_CLASSNAME)}>
      <p className="text-sm font-medium">Socials</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {socials.map((social) => {
          const Icon = SOCIAL_ICON_MAP[social.key]

          return (
            <Button
              key={social.label}
              asChild
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-lg",
                PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
              )}
            >
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${social.label}`}
                title={social.label}
              >
                <Icon className="h-4.5 w-4.5" aria-hidden />
              </a>
            </Button>
          )
        })}
      </div>
    </section>
  )
}
