import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"

type ModuleContentRow = {
  resources: unknown
  video_url: string | null
} | null

type ModuleAssignmentRow = {
  schema: Record<string, unknown> | null
} | null

type ProviderSlug =
  | "youtube"
  | "google-drive"
  | "dropbox"
  | "loom"
  | "vimeo"
  | "notion"
  | "figma"
  | "generic"

const PROVIDER_PATTERNS: Array<{ slug: ProviderSlug; hosts: RegExp[] }> = [
  { slug: "youtube", hosts: [/youtube\.com$/, /youtu\.be$/] },
  { slug: "google-drive", hosts: [/drive\.google\.com$/, /docs\.google\.com$/] },
  { slug: "dropbox", hosts: [/dropbox\.com$/, /dropboxusercontent\.com$/] },
  { slug: "loom", hosts: [/loom\.com$/] },
  { slug: "vimeo", hosts: [/vimeo\.com$/] },
  { slug: "notion", hosts: [/notion\.so$/] },
  { slug: "figma", hosts: [/figma\.com$/] },
]

function inferProviderSlug(rawUrl: string | null | undefined): ProviderSlug {
  if (!rawUrl) return "generic"
  try {
    const host = new URL(rawUrl).hostname.toLowerCase()
    for (const pattern of PROVIDER_PATTERNS) {
      if (pattern.hosts.some((regex) => regex.test(host))) {
        return pattern.slug
      }
    }
  } catch {
    return "generic"
  }
  return "generic"
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function normalizeWizardFieldType(type: unknown, variant?: unknown): "short_text" | "long_text" | "select" | "multi_select" | "slider" | "subtitle" | "custom_program" {
  const raw = typeof type === 'string' ? type : ''
  switch (raw) {
    case 'short_text':
    case 'text':
      return 'short_text'
    case 'long_text':
    case 'textarea':
      return 'long_text'
    case 'select':
      return 'select'
    case 'multi_select':
      return 'multi_select'
    case 'slider':
      return 'slider'
    case 'custom_program':
    case 'program_builder':
      return 'custom_program'
    case 'display':
      return variant === 'subtitle' ? 'subtitle' : 'short_text'
    case 'subtitle':
      return 'subtitle'
    default:
      return 'short_text'
  }
}

function markdownToHtmlLite(markdown: string | null | undefined) {
  if (!markdown) {
    return ""
  }

  const paragraphs = markdown
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return markdown.replace(/\n/g, "<br />")
  }

  return paragraphs
    .map((paragraph) => {
      const normalized = paragraph
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
      return `<p>${normalized.replace(/\n/g, "<br />")}</p>`
    })
    .join("")
}

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id: classId } = await props.params
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { data: classRow, error: classError } = await supabase
    .from("classes" satisfies keyof Database["public"]["Tables"])
    .select("id, title, description, slug")
    .eq("id", classId)
    .maybeSingle<{ id: string; title: string; description: string | null; slug: string | null }>()

  if (classError) {
    return NextResponse.json({ error: classError.message }, { status: 500 })
  }

  if (!classRow) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 })
  }

  const { data: moduleRows, error: moduleError } = await supabase
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .select(
      "id, idx, title, description, video_url, content_md, module_content ( resources, video_url ), module_assignments ( schema )",
    )
    .eq("class_id", classId)
    .order("idx", { ascending: true })

  if (moduleError) {
    return NextResponse.json({ error: moduleError.message }, { status: 500 })
  }

  const modulesPayload = ((moduleRows ?? []) as Array<{
    id: string
    idx: number
    title: string | null
    description: string | null
    video_url: string | null
    content_md: string | null
    module_content: ModuleContentRow[] | ModuleContentRow
    module_assignments: ModuleAssignmentRow[] | ModuleAssignmentRow
  }>).map((module) => {
    const contentRowArray = Array.isArray(module.module_content) ? module.module_content : [module.module_content]
    const contentRow = contentRowArray.find(Boolean) ?? null
    const assignmentArray = Array.isArray(module.module_assignments) ? module.module_assignments : [module.module_assignments]
    const assignmentRow = assignmentArray.find(Boolean) ?? null

    const rawResources = Array.isArray(contentRow?.resources) ? (contentRow?.resources as Array<Record<string, unknown>>) : []
    const resources = rawResources
      .map((resource) => {
        if (!resource || typeof resource !== 'object') return null
        const label = typeof resource.label === 'string' ? resource.label : ''
        const url = typeof resource.url === 'string' ? resource.url : ''
        if (!label && !url) return null
        return {
          title: label || url,
          url,
          providerSlug: inferProviderSlug(url),
        }
      })
      .filter((value): value is { title: string; url: string; providerSlug: ProviderSlug } => Boolean(value))

    const schema = assignmentRow?.schema as { fields?: Array<Record<string, unknown>> } | null
    const formFields = Array.isArray(schema?.fields)
      ? schema!.fields!
          .map((field, index) => {
            if (!field) return null
            const normalizedType = normalizeWizardFieldType((field as any).type, (field as any).variant)
            const label = typeof field.label === 'string' ? field.label : normalizedType === 'subtitle' ? '' : `Field ${index + 1}`
            const placeholder = typeof (field as any).placeholder === 'string' ? (field as any).placeholder : ''
            const description = typeof (field as any).description === 'string' ? (field as any).description : ''
            const options = Array.isArray((field as any).options)
              ? (field as any).options.map((option: unknown) => String(option).trim()).filter(Boolean)
              : []
            const min = toNumberOrNull((field as any).min)
            const max = toNumberOrNull((field as any).max)
            const step = toNumberOrNull((field as any).step)
            const programTemplate = typeof (field as any).programTemplate === 'string' ? (field as any).programTemplate : ''

            return {
              label,
              type: normalizedType,
              required: normalizedType === 'subtitle' ? false : Boolean((field as any).required),
              placeholder: placeholder,
              description: description,
              options,
              min,
              max,
              step,
              programTemplate,
            }
          })
          .filter((value): value is {
            label: string
            type: "short_text" | "long_text" | "select" | "multi_select" | "slider" | "subtitle" | "custom_program"
            required: boolean
            placeholder: string
            description: string
            options: string[]
            min: number | null
            max: number | null
            step: number | null
            programTemplate: string
          } => Boolean(value))
      : []

    const moduleVideo = module.video_url ?? contentRow?.video_url ?? null

    return {
      moduleId: module.id,
      title: module.title ?? '',
      subtitle: module.description ?? '',
      body: markdownToHtmlLite(module.content_md),
      videoUrl: moduleVideo ?? '',
      resources,
      formFields,
    }
  })

  const payload = {
    title: classRow.title,
    subtitle: classRow.description ?? '',
    body: '',
    videoUrl: '',
    links: [] as Array<{ title: string; url: string }>,
    modules: modulesPayload,
  }

  return NextResponse.json({ payload })
}
