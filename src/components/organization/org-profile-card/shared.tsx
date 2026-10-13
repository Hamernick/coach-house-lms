"use client"

import { Children, useState, type ReactNode } from "react"
import type React from "react"
import Image from "next/image"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PROVIDER_ICON } from "@/components/shared/provider-icons"
import { normalizeExternalUrl } from "@/lib/organization/urls"
import { cn } from "@/lib/utils"

import { inferSocialSlug, normalizeToList, shortUrl } from "./utils"

export function ProfileField({ label, children }: { label: ReactNode; children: ReactNode }) {
  const childArray = Children.toArray(children).filter((child) => {
    if (child == null) return false
    if (typeof child === "string") return child.trim().length > 0
    return true
  })

  if (childArray.length === 0) return null

  return (
    <div className="grid content-start self-start gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export function FieldText({ text, multiline = false }: { text?: string | null; multiline?: boolean }) {
  const trimmed = typeof text === "string" ? text.trim() : ""
  const [expanded, setExpanded] = useState(false)
  const hasValue = trimmed.length > 0
  if (!hasValue) return null
  const maxCollapsedChars = multiline ? 280 : 140
  const isLong = trimmed.length > maxCollapsedChars
  const displayText = !expanded && isLong ? `${trimmed.slice(0, maxCollapsedChars).trimEnd()}…` : trimmed

  if (multiline) {
    return (
      <div className="space-y-1.5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{displayText}</p>
        {isLong ? (
          <button
            type="button"
            className="text-xs font-medium text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-sm">{displayText}</p>
      {isLong ? (
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground underline underline-offset-2 transition hover:text-foreground"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  )
}

export function FormRow({
  title,
  description,
  children,
  inset = true,
}: {
  title: string
  description?: string
  children: ReactNode
  inset?: boolean
}) {
  const insetClass = inset ? "px-6 md:px-0" : "px-0"
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(180px,240px)_minmax(0,1fr)] md:items-start md:gap-6">
      <div className={insetClass}>
        <h3 className="text-base font-medium leading-none">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className={cn("min-w-0", insetClass)}>{children}</div>
    </div>
  )
}

export function InputWithIcon({
  icon: Icon,
  inputProps,
}: {
  icon: React.ComponentType<{ className?: string }>
  inputProps: React.ComponentProps<typeof Input>
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <Input {...inputProps} className={cn("pl-9", inputProps.className)} />
    </div>
  )
}

export function BrandLink({ href }: { href: string }) {
  if (!href) return null
  const normalizedHref = normalizeExternalUrl(href) ?? href
  const imageBuckets = ["org-media", "program-media", "avatars"]
  const isImageUrl =
    /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(normalizedHref) ||
    (normalizedHref.includes("/storage/v1/object/public/") &&
      imageBuckets.some((bucket) => normalizedHref.includes(`/${bucket}/`)))
  const slug = inferSocialSlug(normalizedHref)
  const Icon = PROVIDER_ICON[slug] ?? PROVIDER_ICON.generic
  const displayUrl = shortUrl(normalizedHref)

  if (isImageUrl) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={normalizedHref}
          target="_blank"
          rel="noopener"
          className="relative h-20 w-20 overflow-hidden rounded-xl border border-border/60 bg-muted/30"
        >
          <Image
            src={normalizedHref}
            alt="Brand asset"
            fill
            sizes="80px"
            className="object-contain"
          />
        </a>
      </div>
    )
  }
  let host = displayUrl
  let path = ""
  try {
    const u = new URL(normalizedHref)
    host = u.hostname.replace(/^www\./, "")
    path = `${u.pathname}${u.search}`.replace(/\/$/, "")
  } catch {
    // fall back to shortUrl output
  }

  return (
    <a
      href={normalizedHref}
      target="_blank"
      rel="noopener"
      className="group inline-flex w-full items-center gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-foreground transition-colors hover:bg-muted/35"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{host}</span>
        <span className="block truncate text-xs text-muted-foreground">{path || "Open link"}</span>
      </span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
    </a>
  )
}

export function LinkText({ text }: { text?: string | null }) {
  if (!text) return null
  const value = text.trim()
  if (!value) return null
  const isUrl = /^https?:\/\//i.test(value)
  return isUrl ? (
    <a href={value} target="_blank" rel="noopener" className="text-sm underline underline-offset-2">
      {shortUrl(value)}
    </a>
  ) : (
    <span className="text-sm">{value}</span>
  )
}

export function TagList({ value }: { value?: string | null }) {
  const items = normalizeToList(value)
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => {
        const isUrl = /^https?:\/\//i.test(item)
        return isUrl ? (
          <a
            key={index}
            href={item}
            target="_blank"
            rel="noopener"
            className="rounded-md border bg-muted px-2 py-0.5 text-xs underline underline-offset-2"
          >
            {shortUrl(item)}
          </a>
        ) : (
          <span key={index} className="rounded-md border bg-muted px-2 py-0.5 text-xs">
            {item}
          </span>
        )
      })}
    </div>
  )
}

export function AddressDisplay({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null
  return (
    <div className="space-y-0.5 text-sm">
      {lines.map((line, idx) => (
        <p key={idx}>{line}</p>
      ))}
    </div>
  )
}
