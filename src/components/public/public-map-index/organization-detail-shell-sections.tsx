"use client"

import ArrowLeftIcon from "lucide-react/dist/esm/icons/arrow-left"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"
import WifiIcon from "lucide-react/dist/esm/icons/wifi"
import XIcon from "lucide-react/dist/esm/icons/x"

import { ShareButton } from "@/components/shared/share-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PUBLIC_MAP_GROUP_LABELS } from "@/lib/public-map/groups"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import {
  SOCIAL_ICON_MAP,
  type OrganizationDetailActionLink,
  type OrganizationDetailSocialLink,
} from "./organization-detail-helpers"

type DetailPanelChromeProps = {
  organization: PublicMapOrganization
  onBack: () => void
  onHidePanel: () => void
}

type DetailIdentityProps = {
  organization: PublicMapOrganization
  profileImageSrc: string | null
  profileInitials: string
  location: string
  hasBrandKitDownload: boolean
}

type DetailAboutProps = {
  aboutCopy: string
  aboutExpanded: boolean
  aboutNeedsToggle: boolean
  onToggle: () => void
}

export function OrganizationDetailPanelChrome({
  organization,
  onBack,
  onHidePanel,
}: DetailPanelChromeProps) {
  const shareUrl =
    organization.publicSlug ? `/find/${encodeURIComponent(organization.publicSlug)}` : undefined

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 rounded-full border border-border/70 bg-background/85 text-foreground hover:bg-muted"
          aria-label="Back to search"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        </Button>
        <p className="text-sm font-medium text-foreground">Organization</p>
      </div>
      <div className="flex items-center gap-1.5">
        {shareUrl ? (
          <ShareButton
            url={shareUrl}
            title={organization.name}
            iconOnly
            buttonVariant="ghost"
            buttonSize="icon"
            className="h-8 w-8 rounded-full border border-border/70 bg-background/85 text-foreground hover:bg-muted"
          />
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onHidePanel}
          className="h-8 w-8 rounded-full border border-border/70 bg-background/85 text-foreground hover:bg-muted"
          aria-label="Hide organization panel"
        >
          <XIcon className="h-4 w-4" aria-hidden />
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
  hasBrandKitDownload,
}: DetailIdentityProps) {
  return (
    <div>
      <div className="mb-2 flex justify-center">
        <Avatar className="size-20 rounded-2xl border border-border/70 bg-muted/25 shadow-sm">
          <AvatarImage
            src={profileImageSrc ?? undefined}
            alt={`${organization.name} profile`}
            className="object-cover"
          />
          <AvatarFallback className="rounded-2xl bg-muted/45 text-sm font-semibold text-foreground">
            {profileInitials}
          </AvatarFallback>
        </Avatar>
      </div>
      <p className="text-2xl font-semibold leading-tight">{organization.name}</p>
      {organization.tagline ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {organization.tagline}
        </p>
      ) : null}
      {location ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPinIcon className="h-3.5 w-3.5" aria-hidden />
          {location}
        </p>
      ) : null}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-2 py-0.5 text-[10px] text-foreground">
          {PUBLIC_MAP_GROUP_LABELS[organization.primaryGroup]}
        </span>
        {organization.isOnlineOnly ? (
          <span className="inline-flex items-center rounded-full border border-primary/45 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
            <WifiIcon className="mr-1 h-3 w-3" aria-hidden />
            Online resource
          </span>
        ) : null}
        {hasBrandKitDownload ? (
          <span className="inline-flex items-center rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5 text-[10px] text-foreground">
            Brand kit available
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
  if (actionLinks.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actionLinks.map((action) => {
        const Icon = action.icon

        return (
          <Button
            key={action.key}
            asChild
            variant="ghost"
            className="h-20 rounded-xl border border-border/70 bg-background/85 px-2 text-[11px] text-foreground hover:bg-muted"
          >
            <a
              href={action.href}
              target={action.external ? "_blank" : undefined}
              rel={action.external ? "noreferrer" : undefined}
              className="flex h-full w-full flex-col items-center justify-center gap-1 text-center"
            >
              <Icon className="h-5 w-5" aria-hidden />
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
    <section className="rounded-xl border border-border/70 bg-background/70 p-2.5">
      <p className="text-sm font-medium">About</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {aboutCopy}
        {aboutNeedsToggle ? (
          <>
            {" "}
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto px-0 py-0 text-xs text-primary"
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
    <section className="rounded-xl border border-border/70 bg-background/70 p-2.5">
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
              className="h-9 w-9 rounded-lg border border-border/70 bg-background/80 text-foreground hover:bg-muted"
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
