import { inferProviderSlug } from "@/lib/lessons/providers"
import type { Database } from "@/lib/supabase"

import { type ModuleResource, type ModuleResourceProvider } from "./types"

export type ClassWithModules = Database["public"]["Tables"]["classes"]["Row"] & {
  modules: Array<
    Pick<
      Database["public"]["Tables"]["modules"]["Row"],
      | "id"
      | "idx"
      | "slug"
      | "title"
      | "description"
      | "is_published"
      | "video_url"
      | "content_md"
      | "duration_minutes"
      | "deck_path"
    >
  > | null
}

export function inferResourceProvider(rawUrl: string | null | undefined): ModuleResourceProvider {
  return inferProviderSlug(rawUrl) as ModuleResourceProvider
}

export function buildClassResourcesAndVideo(classRecord: ClassWithModules) {
  const classVideoUrl = (classRecord as { video_url?: string | null }).video_url ?? null
  const classResources: ModuleResource[] = []
  const linkPairs: Array<[string | null | undefined, string | null | undefined]> = [
    [
      (classRecord as { link1_title?: string | null }).link1_title,
      (classRecord as { link1_url?: string | null }).link1_url,
    ],
    [
      (classRecord as { link2_title?: string | null }).link2_title,
      (classRecord as { link2_url?: string | null }).link2_url,
    ],
    [
      (classRecord as { link3_title?: string | null }).link3_title,
      (classRecord as { link3_url?: string | null }).link3_url,
    ],
  ]

  for (const [titleRaw, urlRaw] of linkPairs) {
    const title = (titleRaw ?? "").trim()
    const url = (urlRaw ?? "").trim()
    if (!url) continue
    classResources.push({ label: title || url, url, provider: inferResourceProvider(url) })
  }

  return { classVideoUrl, classResources }
}

export function resolveClassPublished(classRecord: ClassWithModules) {
  return "is_published" in classRecord
    ? Boolean((classRecord as { is_published?: boolean | null }).is_published)
    : Boolean((classRecord as { published?: boolean | null }).published ?? true)
}

export function resolveClassSubtitle(classRecord: ClassWithModules) {
  return (classRecord as { subtitle?: string | null }).subtitle ?? null
}
