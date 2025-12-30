"use client"

import { useMemo, useState } from "react"
import Image from "next/image"

import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"

import { CATEGORIES, ITEMS, type MarketplaceCategory } from "./marketplace-data"

function MarketCard({
  name,
  description,
  url,
  byline,
  image,
}: {
  name: string
  description: string
  url: string
  byline?: string
  image?: string
}) {
  const [imgOk, setImgOk] = useState(false)

  return (
    <Item asChild>
      <a href={url} target="_blank" rel="noreferrer">
        <ItemMedia className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
          <span className="text-base font-semibold leading-none">{name.slice(0, 1)}</span>
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="48px"
              unoptimized
              onLoadingComplete={() => setImgOk(true)}
              onError={() => setImgOk(false)}
              className="absolute inset-0 h-full w-full object-cover transition-opacity"
              style={{ opacity: imgOk ? 1 : 0 }}
            />
          ) : null}
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="text-base leading-6">{name}</ItemTitle>
          <ItemDescription className="line-clamp-2">{description}</ItemDescription>
          {byline ? <p className="mt-1 text-[11px] text-muted-foreground">{byline}</p> : null}
        </ItemContent>
        <ItemActions>
          <ExternalLinkIcon className="size-4 text-muted-foreground group-hover:text-foreground" aria-hidden />
        </ItemActions>
      </a>
    </Item>
  )
}

export function MarketplaceClient() {
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<MarketplaceCategory>("top-picks")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ITEMS.filter((item) =>
      (tab === "top-picks" ? true : item.category.includes(tab)) &&
      (q.length === 0 || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)),
    )
  }, [query, tab])

  const featured = filtered.slice(0, 4)
  const remaining = filtered.slice(4)

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-2xl">
        <Input
          placeholder="Search resources"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          className="h-11"
          aria-label="Search marketplace"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as MarketplaceCategory)} className="w-full">
        <TabsList className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-1 rounded-none border-b bg-transparent p-0">
          {CATEGORIES.map((c) => (
            <TabsTrigger
              key={c.value}
              value={c.value}
              className="relative -mb-[1px] rounded-none border-b-0 bg-transparent px-2 pb-3 pt-2 text-xs font-medium text-muted-foreground shadow-none data-[state=active]:border-b-2 data-[state=active]:border-b-foreground data-[state=active]:text-foreground"
            >
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-2 space-y-8">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Recommended</h2>
            <p className="text-sm text-muted-foreground">Curated top picks this week</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {featured.map((item) => (
                <MarketCard key={item.id} {...item} />
              ))}
            </div>
          </section>

          {remaining.length > 0 ? (
            <section className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold">All results</h3>
                <Badge variant="secondary" className="rounded-full">
                  {remaining.length}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {remaining.map((item) => (
                  <MarketCard key={item.id} {...item} />
                ))}
              </div>
            </section>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
