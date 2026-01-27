"use client"

import { useMemo, useState, useEffect } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"

import { CATEGORIES, ITEMS, type MarketplaceCategory } from "@/lib/marketplace/data"

function isMarketplaceCategory(value: string | null): value is MarketplaceCategory {
  return Boolean(value && CATEGORIES.some((category) => category.value === value))
}

function MarketCard({
  id,
  name,
  description,
  url,
  byline,
  image,
}: {
  id: string
  name: string
  description: string
  url: string
  byline?: string
  image?: string
}) {
  const fallbackBanner = `/marketplace/banners/${id}.svg`
  const [bannerSrc, setBannerSrc] = useState(image ?? fallbackBanner)
  const [imgOk, setImgOk] = useState(false)

  useEffect(() => {
    setBannerSrc(image ?? fallbackBanner)
    setImgOk(false)
  }, [image, fallbackBanner])

  return (
    <Item asChild className="flex-col items-stretch rounded-xl">
      <a href={url} target="_blank" rel="noreferrer">
        <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-muted/40">
          <div className="relative aspect-[16/9] w-full">
            <div
              className={`absolute inset-0 flex items-center justify-center text-2xl font-semibold text-muted-foreground transition-opacity ${
                imgOk ? "opacity-0" : "opacity-100"
              }`}
            >
              {name.slice(0, 1)}
            </div>
            <Image
              src={bannerSrc}
              alt=""
              fill
              sizes="(min-width: 640px) 420px, 90vw"
              unoptimized
              onLoadingComplete={() => setImgOk(true)}
              onError={() => {
                if (bannerSrc !== fallbackBanner) {
                  setBannerSrc(fallbackBanner)
                }
                setImgOk(false)
              }}
              className="absolute inset-0 h-full w-full object-contain p-6 transition-opacity"
              style={{ opacity: imgOk ? 1 : 0 }}
            />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ItemContent>
            <ItemTitle className="text-base leading-6">{name}</ItemTitle>
            <ItemDescription className="line-clamp-2">{description}</ItemDescription>
            {byline ? <p className="mt-1 text-[11px] text-muted-foreground">{byline}</p> : null}
          </ItemContent>
          <ItemActions>
            <ExternalLinkIcon className="size-4 text-muted-foreground group-hover:text-foreground" aria-hidden />
          </ItemActions>
        </div>
      </a>
    </Item>
  )
}

export function MarketplaceClient() {
  const searchParams = useSearchParams()
  const paramQuery = searchParams.get("q") ?? ""
  const paramCategory = searchParams.get("category")
  const initialCategory = isMarketplaceCategory(paramCategory) ? paramCategory : "top-picks"

  const [query, setQuery] = useState(paramQuery)
  const [tab, setTab] = useState<MarketplaceCategory>(initialCategory)
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const nextQuery = paramQuery
    const nextCategory = isMarketplaceCategory(paramCategory) ? paramCategory : "top-picks"
    setQuery(nextQuery)
    setTab(nextCategory)
  }, [paramQuery, paramCategory])

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handleChange = () => setReduceMotion(media.matches)
    handleChange()
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange)
      return () => media.removeEventListener("change", handleChange)
    }
    media.addListener(handleChange)
    return () => media.removeListener(handleChange)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ITEMS.filter((item) =>
      (tab === "top-picks" ? true : item.category.includes(tab)) &&
      (q.length === 0 || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)),
    )
  }, [query, tab])

  const featured = filtered.slice(0, 3)
  const remaining = filtered.slice(3)

  useEffect(() => {
    setFeaturedIndex(0)
  }, [query, tab])

  useEffect(() => {
    if (featuredIndex >= featured.length) {
      setFeaturedIndex(0)
    }
  }, [featuredIndex, featured.length])

  useEffect(() => {
    if (featured.length <= 1 || reduceMotion) return
    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % featured.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [featured.length, reduceMotion])

  const activeFeatured = featured[featuredIndex]

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,200px)]">
        <div className="space-y-2">
          <Label htmlFor="marketplace-search" className="text-xs uppercase tracking-wide text-muted-foreground">
            Search
          </Label>
          <Input
            id="marketplace-search"
            data-tour="marketplace-search"
            placeholder="Search resources"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            className="h-10"
            aria-label="Search marketplace"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="marketplace-category" className="text-xs uppercase tracking-wide text-muted-foreground">
            Category
          </Label>
          <Select value={tab} onValueChange={(v) => setTab(v as MarketplaceCategory)}>
            <SelectTrigger
              id="marketplace-category"
              data-tour="marketplace-categories"
              className="h-10 w-full"
            >
              <SelectValue placeholder="Choose category" />
            </SelectTrigger>
          <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Recommended</h2>
        <p className="text-sm text-muted-foreground">Curated top picks this week</p>
        {activeFeatured ? (
          <div className="space-y-3">
            <MarketCard {...activeFeatured} />
            {featured.length > 1 ? (
              <div className="flex items-center justify-center gap-2">
                {featured.map((item, index) => {
                  const isActive = index === featuredIndex
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Show recommendation ${index + 1} of ${featured.length}`}
                      aria-current={isActive ? "true" : undefined}
                      onClick={() => setFeaturedIndex(index)}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        isActive ? "bg-foreground" : "bg-muted-foreground/30"
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                    />
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {remaining.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold">All results</h3>
            <Badge variant="secondary" className="rounded-full">
              {remaining.length}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {remaining.map((item) => (
              <MarketCard key={item.id} {...item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
