/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"
import { inferProviderSlug } from "@/lib/lessons/providers"
import type { ProviderSlug } from "@/lib/lessons/types"
import { toNumberOrNull, normalizeFormFieldTypeLegacy } from "@/lib/lessons/fields"
import { markdownToHtmlLite } from "@/lib/markdown/simple"

type ModuleContentRow = {
  resources: unknown
  video_url: string | null
} | null

type ModuleAssignmentRow = {
  schema: Record<string, unknown> | null
} | null

type ModuleRow = {
  id: string
  idx: number
  title: string | null
  description: string | null
  video_url: string | null
  content_md: string | null
  module_content: ModuleContentRow | ModuleContentRow[]
  module_assignments: ModuleAssignmentRow | ModuleAssignmentRow[]
}


export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id: classId } = await props.params
  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const admin = createSupabaseAdminClient()

  let classRow: { id: string; title: string; description: string | null; subtitle?: string | null; slug: string | null } | null = null
  {
    const { data, error } = await supabase
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .select("id, title, description, subtitle, video_url, link1_title, link1_url, link2_title, link2_url, link3_title, link3_url, slug")
      .eq("id", classId)
      .maybeSingle<{ id: string; title: string; description: string | null; subtitle?: string | null; slug: string | null }>()
    if (error) {
      if ((error as { code?: string }).code === "42703") {
        const { data: fallback, error: err2 } = await supabase
          .from("classes" satisfies keyof Database["public"]["Tables"])
          .select("id, title, description, slug")
          .eq("id", classId)
          .maybeSingle<{ id: string; title: string; description: string | null; slug: string | null }>()
        if (err2) return NextResponse.json({ error: err2.message }, { status: 500 })
        classRow = fallback as any
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      classRow = data
    }
  }

  let resolvedClass = classRow

  if (!resolvedClass) {
    const { data: adminClass, error: adminClassError } = await admin
      .from("classes" satisfies keyof Database["public"]["Tables"])
      .select("id, title, description, subtitle, video_url, link1_title, link1_url, link2_title, link2_url, link3_title, link3_url, slug")
      .eq("id", classId)
      .maybeSingle<{ id: string; title: string; description: string | null; subtitle?: string | null; slug: string | null }>()

    if (adminClassError) {
      if ((adminClassError as { code?: string }).code === "42703") {
        const { data: fallbackAdmin, error: adminErr2 } = await admin
          .from("classes" satisfies keyof Database["public"]["Tables"])
          .select("id, title, description, slug")
          .eq("id", classId)
          .maybeSingle<{ id: string; title: string; description: string | null; slug: string | null }>()
        if (adminErr2) return NextResponse.json({ error: adminErr2.message }, { status: 500 })
        resolvedClass = fallbackAdmin as any
      } else {
        return NextResponse.json({ error: adminClassError.message }, { status: 500 })
      }
    } else {
      resolvedClass = adminClass ?? null
    }
  }

  if (!resolvedClass) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 })
  }

  const { data: moduleRows, error: moduleError } = await admin
    .from("modules" satisfies keyof Database["public"]["Tables"])
    .select(
      "id, idx, title, description, video_url, content_md, module_content ( resources, video_url ), module_assignments ( schema )",
    )
    .eq("class_id", classId)
    .order("idx", { ascending: true })
    .returns<ModuleRow[]>()

  if (moduleError) {
    return NextResponse.json({ error: moduleError.message }, { status: 500 })
  }
  const resolvedModules = moduleRows ?? []

  const modulesPayload = (resolvedModules ?? []).map((module) => {
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
            const normalizedType = normalizeFormFieldTypeLegacy((field as any).type, (field as any).variant)
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

  const rc = resolvedClass as { subtitle?: string | null; video_url?: string | null; link1_title?: string | null; link1_url?: string | null; link2_title?: string | null; link2_url?: string | null; link3_title?: string | null; link3_url?: string | null }
  const linksArr: Array<{ title: string; url: string }> = []
  const pairs: Array<[string | null | undefined, string | null | undefined]> = [
    [rc.link1_title, rc.link1_url],
    [rc.link2_title, rc.link2_url],
    [rc.link3_title, rc.link3_url],
  ]
  for (const [t, u] of pairs) {
    const title = (t ?? '').trim()
    const url = (u ?? '').trim()
    if (!title && !url) continue
    linksArr.push({ title: title || url, url })
  }

  const payload = {
    title: resolvedClass.title,
    subtitle: rc.subtitle ?? resolvedClass.description ?? '',
    body: markdownToHtmlLite(resolvedClass.description ?? ''),
    videoUrl: (rc.video_url ?? '').trim(),
    links: linksArr,
    modules: modulesPayload,
  }

  return NextResponse.json({ payload })
}
 
