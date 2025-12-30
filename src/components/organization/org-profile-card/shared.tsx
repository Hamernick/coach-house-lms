"use client"

import { Children, type ReactNode } from "react"
import type React from "react"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Glimpse, GlimpseContent, GlimpseDescription, GlimpseTitle, GlimpseTrigger } from "@/components/kibo-ui/glimpse"
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
    <div className="grid gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export function FieldText({ text, multiline = false }: { text?: string | null; multiline?: boolean }) {
  const hasValue = Boolean(text && text.trim().length > 0)
  if (!hasValue) return null
  if (multiline) return <p className="whitespace-pre-wrap text-sm">{text}</p>
  return <p className="text-sm">{text}</p>
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
    <div className="grid gap-4 md:grid-cols-3">
      <div className={insetClass}>
        <h3 className="text-base font-medium leading-none">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className={cn("md:col-span-2", insetClass)}>{children}</div>
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
      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
        <Icon className="h-4 w-4 -translate-y-[2px] text-muted-foreground" />
      </span>
      <Input {...inputProps} className={cn("pl-7", inputProps.className)} />
    </div>
  )
}

export function BrandLink({ href }: { href: string }) {
  if (!href) return null
  const normalizedHref = normalizeExternalUrl(href) ?? href
  const slug = inferSocialSlug(normalizedHref)
  const Icon = PROVIDER_ICON[slug] ?? PROVIDER_ICON.generic
  const displayUrl = shortUrl(normalizedHref)
  return (
    <Glimpse>
      <GlimpseTrigger asChild>
        <a href={normalizedHref} target="_blank" rel="noopener" className="inline-flex items-center gap-2 underline underline-offset-2">
          <Icon className="h-4 w-4" />
          <span>{displayUrl}</span>
        </a>
      </GlimpseTrigger>
      <GlimpseContent className="w-80">
        <GlimpseTitle>{displayUrl}</GlimpseTitle>
        <GlimpseDescription>Opens in a new tab</GlimpseDescription>
      </GlimpseContent>
    </Glimpse>
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
