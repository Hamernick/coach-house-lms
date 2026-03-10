"use client"

import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right"
import BookOpenIcon from "lucide-react/dist/esm/icons/book-open"
import Building2Icon from "lucide-react/dist/esm/icons/building-2"
import CreditCardIcon from "lucide-react/dist/esm/icons/credit-card"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import HelpCircleIcon from "lucide-react/dist/esm/icons/help-circle"
import LayersIcon from "lucide-react/dist/esm/icons/layers"
import MapPinIcon from "lucide-react/dist/esm/icons/map-pin"
import RocketIcon from "lucide-react/dist/esm/icons/rocket"
import RouteIcon from "lucide-react/dist/esm/icons/route"
import ShieldIcon from "lucide-react/dist/esm/icons/shield"
import ShoppingBagIcon from "lucide-react/dist/esm/icons/shopping-bag"
import UsersIcon from "lucide-react/dist/esm/icons/users"

import type { SearchResult } from "@/lib/search/types"

export const SEARCH_MIN_WIDTH = 240

const GROUP_ORDER = [
  "Pages",
  "Accelerator",
  "Classes",
  "Modules",
  "Questions",
  "Programs",
  "My organization",
  "Roadmap",
  "Documents",
  "Community",
  "Marketplace",
  "Admin",
]

export function formatClassTitle(title: string) {
  const match = title.match(/^Session\s+[A-Za-z]\d+\s*[\u2013-]\s*(.+)$/i)
  if (match) return match[1].trim()
  return title
}

export function getInitials(label: string) {
  const words = label.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

export function getResultIcon(item: SearchResult) {
  const href = item.href
  const group = item.group.toLowerCase()

  if (group === "admin") return ShieldIcon
  if (group === "accelerator") return RocketIcon
  if (group === "classes") return BookOpenIcon
  if (group === "modules") return LayersIcon
  if (group === "questions") return HelpCircleIcon
  if (group === "documents") return FileTextIcon
  if (group === "roadmap") return RouteIcon
  if (group === "programs") return LayersIcon
  if (group === "community") return MapPinIcon
  if (group === "marketplace") return ShoppingBagIcon
  if (group === "my organization" || group === "organization") return Building2Icon

  if (href.startsWith("/billing")) return CreditCardIcon
  if (href.startsWith("/internal")) return ShieldIcon
  if (href.startsWith("/admin")) return ShieldIcon
  if (href.startsWith("/people")) return UsersIcon
  if (href.startsWith("/community")) return MapPinIcon
  if (href.startsWith("/marketplace")) return ShoppingBagIcon
  if (href.startsWith("/accelerator")) return RocketIcon
  if (href.startsWith("/roadmap")) return RouteIcon
  if (href.startsWith("/organization")) return Building2Icon

  return ArrowUpRight
}

export function groupSearchResults(items: SearchResult[]) {
  const map = new Map<string, SearchResult[]>()
  items.forEach((item) => {
    const list = map.get(item.group) ?? []
    list.push(item)
    map.set(item.group, list)
  })

  const entries = Array.from(map.entries())
  entries.sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a[0])
    const bi = GROUP_ORDER.indexOf(b[0])
    if (ai === -1 && bi === -1) return a[0].localeCompare(b[0])
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return entries
}
