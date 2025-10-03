import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { IconCircle, IconCircleCheck, IconFileText, IconInfoCircle, IconLock } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase"
import { getClassModulesForUser, markModuleCompleted } from "@/lib/modules"
import { buildModuleStates, type ModuleState } from "@/lib/module-progress"
import { cn } from "@/lib/utils"
import { ModuleDetail as PrototypeModuleDetail } from "@/components/training/module-detail"

type ModuleParams = {
  slug: string
  index: string
}

export default async function ModulePage({
  params,
}: {
  params: Promise<ModuleParams>
}) {
  const { slug, index } = await params
  const moduleIndex = Number.parseInt(index, 10)
  if (!Number.isFinite(moduleIndex) || moduleIndex <= 0) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    redirect(`/login?redirect=/class/${slug}/module/${index}`)
  }

  const classContext = await getClassModulesForUser({
    classSlug: slug,
    userId: user.id,
  })

  if (classContext.modules.length === 0) {
    notFound()
  }

  const moduleStates = buildModuleStates(classContext.modules, classContext.progressMap)

  const currentState = moduleStates.find((state) => state.module.idx === moduleIndex)
  if (!currentState) {
    notFound()
  }

  const firstAvailable = moduleStates.find((state) => !state.locked) ?? currentState
  if (currentState.locked) {
    redirect(`/class/${slug}/module/${firstAvailable.module.idx}`)
  }

  const currentIndex = moduleStates.findIndex((state) => state.module.id === currentState.module.id)
  const previousState = currentIndex > 0 ? moduleStates[currentIndex - 1] : undefined
  const nextState = currentIndex >= 0 && currentIndex < moduleStates.length - 1 ? moduleStates[currentIndex + 1] : undefined

  // Assignment wiring
  let assignment: { schema: Record<string, unknown> | null; complete_on_submit: boolean } | null = null
  {
    const { data, error: aErr } = await supabase
      .from("module_assignments")
      .select("schema, complete_on_submit")
      .eq("module_id", currentState.module.id)
      .maybeSingle<{ schema: Record<string, unknown> | null; complete_on_submit: boolean }>()
    if (aErr) {
      if ((aErr as { code?: string }).code === "42P01" || (aErr as { code?: string }).code === "42703") {
        assignment = null
      } else {
        throw aErr
      }
    } else {
      assignment = data ?? null
    }
  }

  let existingSubmission: { answers: Record<string, unknown> | null; status: 'submitted'|'accepted'|'revise' } | null = null
  {
    const { data, error: sErr } = await supabase
      .from("assignment_submissions")
      .select("answers, status")
      .eq("module_id", currentState.module.id)
      .eq("user_id", user.id)
      .maybeSingle<{ answers: Record<string, unknown> | null; status: 'submitted'|'accepted'|'revise' }>()
    if (sErr) {
      if ((sErr as { code?: string }).code === "42P01" || (sErr as { code?: string }).code === "42703") {
        existingSubmission = null
      } else {
        throw sErr
      }
    } else {
      existingSubmission = data ?? null
    }
  }

  // Optional advanced content (resources/homework/interactions/transcript; video override)
  let content: {
    video_url: string | null
    transcript: string | null
    interactions: unknown[] | null
    resources: unknown[] | null
    homework: unknown[] | null
  } | null = null
  {
    const { data, error: cErr } = await supabase
      .from("module_content")
      .select("video_url, transcript, interactions, resources, homework")
      .eq("module_id", currentState.module.id)
      .maybeSingle<{
        video_url: string | null
        transcript: string | null
        interactions: unknown[] | null
        resources: unknown[] | null
        homework: unknown[] | null
      }>()
    if (cErr) {
      if ((cErr as { code?: string }).code === "42P01" || (cErr as { code?: string }).code === "42703") {
        content = null
      } else {
        throw cErr
      }
    } else {
      content = data ?? null
    }
  }

  // Pull existing interaction responses
  let existingInteractionAnswers: Record<string, unknown> = {}
  {
    const { data, error } = await supabase
      .from("module_progress")
      .select("notes")
      .eq("module_id", currentState.module.id)
      .eq("user_id", user.id)
      .maybeSingle<{ notes: Record<string, unknown> | null }>()
    if (!error && data?.notes && typeof data.notes === 'object') {
      const bucket = (data.notes as { interactions?: Record<string, unknown> } | null)?.interactions
      if (bucket && typeof bucket === 'object') {
        existingInteractionAnswers = bucket
      }
    }
  }

  const shouldRenderPrototype =
    !currentState.module.videoUrl &&
    !currentState.module.contentMd &&
    assignment == null

  if (shouldRenderPrototype) {
    const placeholderClass = {
      id: classContext.classId,
      title: classContext.classTitle,
      blurb: classContext.classDescription || "",
      slug,
      modules: classContext.modules.map((m) => ({ id: m.id, title: m.title, subtitle: m.description || undefined })),
    }
    const placeholderModule = { id: currentState.module.id, title: currentState.module.title, subtitle: currentState.module.description || undefined }
    return (
      <div className="px-4 lg:px-6">
        <PrototypeModuleDetail c={placeholderClass} m={placeholderModule} />
      </div>
    )
  }

  // Load profile to determine admin for toolbar
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>()

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {prof?.role === 'admin' ? (
        <div className="rounded-lg border bg-muted/20 p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium">Admin shortcuts</span>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline"><a href={`/admin/modules/${currentState.module.id}`}>Edit module</a></Button>
              <Button asChild size="sm" variant="outline"><a href={`/admin/classes/${classContext.classId}`}>Edit class</a></Button>
            </div>
          </div>
        </div>
      ) : null}
      
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <ModuleList
          slug={slug}
          items={moduleStates}
          currentModuleId={currentState.module.id}
        />
        <div className="space-y-6">
          <Card className="bg-card/60">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{currentState.module.title}</span>
                {existingSubmission?.status === 'revise' ? (
                  <span className="text-sm font-medium text-amber-500 flex items-center gap-1"><IconInfoCircle className="h-4 w-4" /> Needs revise</span>
                ) : currentState.completed ? (
                  <span className="text-sm font-medium text-primary">Completed</span>
                ) : null}
              </CardTitle>
              <CardDescription>
                {currentState.module.description ?? "Work through the steps below to continue."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ModuleVideo videoUrl={content?.video_url ?? currentState.module.videoUrl} title={currentState.module.title} />
              {currentState.module.hasDeck ? (
                <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <IconFileText aria-hidden className="mt-0.5 h-5 w-5 text-primary" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Slide deck</p>
                        <p className="text-sm text-muted-foreground">
                          Download the companion PDF deck to review lessons offline.
                        </p>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="sm:w-auto">
                      <a
                        href={`/api/modules/${currentState.module.id}/deck`}
                        rel="noopener"
                        target="_blank"
                      >
                        Download PDF
                      </a>
                    </Button>
                  </div>
                </div>
              ) : null}
              {(() => {
                const resources = (content?.resources as ResourceItem[] | null) ?? null
                if (!resources || resources.length === 0) return null
                return (
                <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <IconFileText aria-hidden className="mt-0.5 h-5 w-5 text-primary" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Resources</p>
                        <ul className="list-disc pl-5 text-sm">
                          {resources.map((r, i) => {
                            const label = typeof r.label === 'string' && r.label.trim().length > 0 ? r.label : `Resource ${i + 1}`
                            const url = typeof r.url === 'string' && r.url.length > 0 ? r.url : null
                            return (
                              <li key={i} className="mb-1">
                                {url ? (
                                  <a href={url} target="_blank" rel="noopener" className="underline underline-offset-2">{label}</a>
                                ) : (
                                  <span>{label}</span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                )
              })()}
              {currentState.module.contentMd ? (
                <article className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentState.module.contentMd}</ReactMarkdown>
                </article>
              ) : null}
              {content?.transcript ? (
                <details className="rounded-lg border bg-muted/10 p-4">
                  <summary className="cursor-pointer text-sm font-semibold">Transcript</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">{content.transcript}</pre>
                </details>
              ) : null}
              {(() => {
                const interactions = (content?.interactions as InteractionItem[] | null) ?? null
                if (!interactions || interactions.length === 0) return null
                const needsAnswer = (it: InteractionItem, idx: number) => {
                  const key = `i_${idx}`
                  const val = existingInteractionAnswers[key]
                  if (it.type === 'poll') return typeof val === 'number'
                  if (it.type === 'prompt') return typeof val === 'string' && (val as string).trim().length > 0
                  if (it.type === 'quiz') return typeof val === 'number'
                  if (it.type === 'activity') return Array.isArray(val) && (val as unknown[]).length > 0
                  return true
                }
                const allAnswered = interactions.every((it, idx) => needsAnswer(it, idx))
                return (
                 <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                   <div className="space-y-2">
                     <p className="text-sm font-semibold">Exercises</p>
                    <InteractionsForm
                      moduleId={currentState.module.id}
                      items={interactions}
                      existingAnswers={existingInteractionAnswers}
                    />
                    {!allAnswered ? (
                      <p className="text-xs text-amber-500">Complete the exercises above to enable completion.</p>
                    ) : null}
                  </div>
                </div>
                )
              })()}
              {(() => {
                const items = (content?.homework as HomeworkItem[] | null) ?? null
                if (!items || items.length === 0) return null
                return (
                <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Homework</p>
                    <ul className="space-y-2 text-sm">
                      {items.map((h, i) => {
                        const label = typeof h.label === 'string' && h.label.trim().length > 0 ? h.label : `Item ${i + 1}`
                        const instructions = typeof h.instructions === 'string' ? h.instructions : null
                        const uploadRequired = Boolean(h.upload_required)
                        return (
                          <li key={i} className="rounded-md border bg-background/40 p-3">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{label}</div>
                              {uploadRequired ? <span className="text-xs text-primary">Upload required</span> : null}
                            </div>
                            {instructions ? (
                              <div className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{instructions}</div>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
                )
              })()}
              <Separator />
              {assignment ? (
                <AssignmentForm
                  schema={assignment.schema}
                  moduleId={currentState.module.id}
                  classSlug={slug}
                  currentIndex={currentState.module.idx}
                  nextModuleIndex={nextState?.module.idx ?? null}
                  completed={currentState.completed}
                  completeOnSubmit={Boolean(assignment.complete_on_submit)}
                  existingAnswers={(existingSubmission?.answers as Record<string, unknown> | null) ?? null}
                  existingStatus={existingSubmission?.status ?? null}
                />
              ) : (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Reflection</h2>
                  <p className="text-sm text-muted-foreground">
                    Capture one takeaway before you continue to the next module.
                  </p>
                  <ModuleCompletionForm
                    moduleId={currentState.module.id}
                    classSlug={slug}
                    currentIndex={currentState.module.idx}
                    nextModuleIndex={nextState?.module.idx ?? null}
                    completed={currentState.completed}
                  />
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={!previousState}
            >
              <a
                href={previousState ? `/class/${slug}/module/${previousState.module.idx}` : "#"}
              >
                Previous
              </a>
            </Button>
            <Button
              size="sm"
              variant={nextState && !nextState.locked ? "default" : "outline"}
              asChild
              disabled={!nextState || nextState.locked}
            >
              <a href={nextState ? `/class/${slug}/module/${nextState.module.idx}` : "#"}>
                Next
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModuleList({
  items,
  currentModuleId,
  slug,
}: {
  items: ModuleState[]
  currentModuleId: string
  slug: string
}) {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="text-base">Modules</CardTitle>
        <CardDescription>Select an unlocked module to continue your journey.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => {
          const isActive = item.module.id === currentModuleId

          return (
            <ModuleListItem
              key={item.module.id}
              item={item}
              href={`/class/${slug}/module/${item.module.idx}`}
              active={isActive}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}

function ModuleListItem({
  item,
  href,
  active,
}: {
  item: ModuleState
  href: string
  active: boolean
}) {
  const Icon = item.completed ? IconCircleCheck : item.locked ? IconLock : IconCircle

  const className = cn(
    "flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition",
    item.locked
      ? "cursor-not-allowed border-border/70 bg-muted/30 text-muted-foreground"
      : "border-border hover:border-primary/70 hover:bg-primary/5",
    active ? "border-primary bg-primary/10" : undefined
  )

  const icon = (
    <Icon
      className={cn(
        "size-4",
        item.completed ? "text-primary" : item.locked ? "text-muted-foreground" : "text-primary/70"
      )}
    />
  )

  if (item.locked) {
    return (
      <div className={className} aria-disabled>
        <span className="flex flex-col">
          <span className="font-medium">Module {item.module.idx}</span>
          <span className="text-xs text-muted-foreground">{item.module.title}</span>
        </span>
        {icon}
      </div>
    )
  }

  return (
    <Link href={href} className={className} aria-current={active ? "page" : undefined}>
      <span className="flex flex-col">
        <span className="font-medium">Module {item.module.idx}</span>
        <span className="text-xs text-muted-foreground">{item.module.title}</span>
      </span>
      {icon}
    </Link>
  )
}

function ModuleVideo({ videoUrl, title }: { videoUrl: string | null; title: string }) {
  if (!videoUrl) {
    return null
  }

  const embedUrl = toEmbedUrl(videoUrl)
  if (!embedUrl) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </div>
  )
}

function toEmbedUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl)

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v")
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.slice(1)
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    return null
  } catch {
    return null
  }
}

// Content types for rendering advanced content safely
type ResourceItem = { label?: string; url?: string }
type InteractionItem = { type?: string; config?: Record<string, unknown> }
type HomeworkItem = { label?: string; instructions?: string; upload_required?: boolean }

function cfgStr(cfg: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!cfg) return undefined
  const v = cfg[key]
  return typeof v === 'string' ? v : undefined
}
function cfgNum(cfg: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!cfg) return fallback
  const v = cfg[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

async function completeModuleAction(formData: FormData) {
  "use server"

  const moduleId = formData.get("moduleId")
  const classSlug = formData.get("classSlug")
  const nextModuleIndex = formData.get("nextModuleIndex")
  const currentIndex = formData.get("currentIndex")
  const reflection = formData.get("reflection")

  if (typeof moduleId !== "string" || typeof classSlug !== "string") {
    return
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    const ci = typeof currentIndex === "string" && currentIndex.length > 0 ? currentIndex : ""
    redirect(`/login?redirect=/class/${classSlug}/module/${ci}`)
  }

  const notes =
    reflection && typeof reflection === "string" && reflection.trim().length > 0
      ? { reflection: reflection.trim() }
      : null

  await markModuleCompleted({ moduleId, userId: user.id, notes })

  if (typeof currentIndex === "string" && currentIndex.length > 0) {
    revalidatePath(`/class/${classSlug}/module/${currentIndex}`)
  }
  revalidatePath(`/class/${classSlug}`)
  // Ensure dashboard widgets (Next Up / Progress) reflect the change immediately
  revalidatePath(`/dashboard`)

  if (typeof nextModuleIndex === "string" && nextModuleIndex.length > 0) {
    redirect(`/class/${classSlug}/module/${nextModuleIndex}`)
  }
}

async function submitAssignmentAction(formData: FormData) {
  "use server"

  const moduleId = formData.get("moduleId")
  const classSlug = formData.get("classSlug")
  const nextModuleIndex = formData.get("nextModuleIndex")
  const currentIndex = formData.get("currentIndex")
  const completeOnSubmit = formData.get("completeOnSubmit") === "true"

  if (typeof moduleId !== "string" || typeof classSlug !== "string") {
    return
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) redirect(`/login?redirect=/class/${classSlug}/module/${currentIndex ?? ""}`)

  const answers: Database["public"]["Tables"]["assignment_submissions"]["Insert"]["answers"] = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("a_")) {
      const field = key.slice(2)
      answers[field] = typeof value === "string" ? value : String(value)
    }
  }

  await supabase
    .from("assignment_submissions" satisfies keyof Database["public"]["Tables"])
    .upsert({
      module_id: moduleId,
      user_id: user.id,
      answers,
      status: "submitted",
    })

  if (completeOnSubmit) {
    await markModuleCompleted({ moduleId, userId: user.id })
  }

  if (typeof currentIndex === "string" && currentIndex.length > 0) {
    revalidatePath(`/class/${classSlug}/module/${currentIndex}`)
  }
  revalidatePath(`/class/${classSlug}`)
  revalidatePath(`/dashboard`)

  if (completeOnSubmit && typeof nextModuleIndex === "string" && nextModuleIndex.length > 0) {
    redirect(`/class/${classSlug}/module/${nextModuleIndex}`)
  }
}

async function saveInteractionsAction(formData: FormData) {
  "use server"

  const moduleId = formData.get("moduleId")
  if (typeof moduleId !== "string") return

  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) return

  // Extract answers keyed by i_{idx}
  const answers: Record<string, unknown> = {}
  const itemsRaw = formData.get("items")
  let items: InteractionItem[] = []
  if (typeof itemsRaw === 'string') {
    try { items = JSON.parse(itemsRaw) as InteractionItem[] } catch {}
  }
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("i_")) continue
    if (typeof value === 'string') {
      if (value.startsWith('[') || value.startsWith('{')) {
        try { answers[key] = JSON.parse(value) } catch { answers[key] = value }
      } else if (/^\d+$/.test(value)) {
        answers[key] = Number.parseInt(value, 10)
      } else {
        answers[key] = value
      }
    }
  }

  // Merge into module_progress.notes.interactions
  const { data: row } = await supabase
    .from("module_progress")
    .select("notes")
    .eq("module_id", moduleId)
    .eq("user_id", user.id)
    .maybeSingle<{ notes: Record<string, unknown> | null }>()

  const existing = row?.notes && typeof row.notes === 'object' ? row.notes : {}
  const currentBucket = (existing as { interactions?: Record<string, unknown> }).interactions ?? {}
  const merged = { ...(existing as object), interactions: { ...currentBucket, ...answers } }

  const exists = Boolean(row)
  const upsertPayload: Database["public"]["Tables"]["module_progress"]["Insert"] = {
    user_id: user.id,
    module_id: moduleId,
    ...(exists ? {} : { status: "in_progress" as Database["public"]["Enums"]["module_progress_status"] }),
    notes: merged as unknown as Database["public"]["Tables"]["module_progress"]["Insert"]["notes"],
  }

  const { error } = await supabase
    .from("module_progress" satisfies keyof Database["public"]["Tables"])
    .upsert(upsertPayload)

  if (error) throw error

  // Map configured interaction answers into assignment_submissions.answers using optional org_key
  try {
    const map: Record<string, unknown> = {}
    items.forEach((it, idx) => {
      const cfg = (typeof it.config === 'object' && it.config) ? (it.config as Record<string, unknown>) : undefined
      const key = cfg && typeof cfg['org_key'] === 'string' ? (cfg['org_key'] as string) : null
      if (!key) return
      const aKey = `i_${idx}`
      const val = answers[aKey]
      if (typeof val === 'undefined') return
      map[key] = val
    })
    if (Object.keys(map).length > 0) {
      const { data: sub } = await supabase
        .from("assignment_submissions" satisfies keyof Database["public"]["Tables"])
        .select("answers")
        .eq("module_id", moduleId)
        .eq("user_id", user.id)
        .maybeSingle<{ answers: Record<string, unknown> | null }>()

      const existingAnswers = sub?.answers && typeof sub.answers === 'object' ? sub.answers : {}
      const mergedAnswers = { ...existingAnswers, ...map }

      await supabase
        .from("assignment_submissions" satisfies keyof Database["public"]["Tables"])
        .upsert({
          module_id: moduleId,
          user_id: user.id,
          answers: mergedAnswers as Database["public"]["Tables"]["assignment_submissions"]["Insert"]["answers"],
        })
    }
  } catch {
    // swallow non-critical mapping errors
  }

  revalidatePath("/dashboard")
  revalidatePath("/my-organization")
}

function ModuleCompletionForm({
  moduleId,
  classSlug,
  currentIndex,
  nextModuleIndex,
  completed,
  disabledReason,
}: {
  moduleId: string
  classSlug: string
  currentIndex: number
  nextModuleIndex: number | null
  completed: boolean
  disabledReason?: string | null
}) {
  return (
    <form action={completeModuleAction} className="space-y-3">
      <Textarea
        name="reflection"
        placeholder="What resonated with you?"
        className="min-h-24"
        defaultValue=""
        disabled={completed}
      />
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="classSlug" value={classSlug} />
      <input type="hidden" name="currentIndex" value={currentIndex} />
      <input type="hidden" name="nextModuleIndex" value={nextModuleIndex ?? ""} />
      <Button type="submit" disabled={completed || Boolean(disabledReason)}>
        {completed ? "Module Completed" : disabledReason ? "Complete exercises to continue" : "Mark Module Complete"}
      </Button>
    </form>
  )
}

function AssignmentForm({
  schema,
  moduleId,
  classSlug,
  currentIndex,
  nextModuleIndex,
  completed,
  completeOnSubmit,
  existingAnswers,
  existingStatus,
}: {
  schema: Record<string, unknown> | null
  moduleId: string
  classSlug: string
  currentIndex: number
  nextModuleIndex: number | null
  completed: boolean
  completeOnSubmit: boolean
  existingAnswers: Record<string, unknown> | null
  existingStatus: 'submitted' | 'accepted' | 'revise' | null
}) {
  type FieldDef = { name: string; label?: string; type?: string; options?: Array<{ label: string; value: string }> }
  const fields: Array<FieldDef> = Array.isArray((schema as Record<string, unknown> | null)?.fields)
    ? ((schema as unknown as { fields: FieldDef[] }).fields)
    : []

  if (fields.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Assignment</h2>
        <p className="text-sm text-muted-foreground">No inputs for this module.</p>
        <ModuleCompletionForm
          moduleId={moduleId}
          classSlug={classSlug}
          currentIndex={currentIndex}
          nextModuleIndex={nextModuleIndex}
          completed={completed}
        />
      </div>
    )
  }

  return (
    <form action={submitAssignmentAction} className="space-y-4">
      <h2 className="text-lg font-semibold">Assignment</h2>
      <p className="text-sm text-muted-foreground">Fill out the fields and submit to continue.</p>
      {fields.map((f) => {
        const key = f.name
        const label = f.label ?? key
        const type = f.type ?? "text"
        const defaultValue = (existingAnswers?.[key] as string | undefined) ?? ""
        if (type === "textarea") {
          return (
            <div className="space-y-1" key={key}>
              <label className="text-sm font-medium" htmlFor={`a_${key}`}>{label}</label>
              <Textarea id={`a_${key}`} name={`a_${key}`} defaultValue={defaultValue} className="min-h-24" />
            </div>
          )
        }
        if (type === "select" && Array.isArray(f.options)) {
          return (
            <div className="space-y-1" key={key}>
              <label className="text-sm font-medium" htmlFor={`a_${key}`}>{label}</label>
              <select id={`a_${key}`} name={`a_${key}`} defaultValue={defaultValue} className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )
        }
        return (
          <div className="space-y-1" key={key}>
            <label className="text-sm font-medium" htmlFor={`a_${key}`}>{label}</label>
            <input id={`a_${key}`} name={`a_${key}`} defaultValue={defaultValue} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
        )
      })}
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="classSlug" value={classSlug} />
      <input type="hidden" name="currentIndex" value={currentIndex} />
      <input type="hidden" name="nextModuleIndex" value={nextModuleIndex ?? ""} />
      <input type="hidden" name="completeOnSubmit" value={completeOnSubmit ? "true" : "false"} />
      <div className="flex items-center gap-2">
        {(() => {
          const disableSubmit = completed && completeOnSubmit && existingStatus !== 'revise'
          return (
          <Button type="submit" disabled={disableSubmit}>Submit</Button>
        )
      })()}
      {!completeOnSubmit ? (
          <Button type="submit" formAction={completeModuleAction} variant="outline" disabled={completed}>
            {completed ? "Module Completed" : "Mark Module Complete"}
          </Button>
        ) : null}
      </div>
    </form>
  )
}

function InteractionsForm({
  moduleId,
  items,
  existingAnswers,
}: {
  moduleId: string
  items: InteractionItem[]
  existingAnswers: Record<string, unknown>
}) {
  return (
    <form action={saveInteractionsAction} className="space-y-3">
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <ul className="space-y-2 text-sm">
        {items.map((it, i) => {
          const t = typeof it.type === 'string' && it.type.length > 0 ? it.type : 'interaction'
          const cfg = (typeof it.config === 'object' && it.config != null ? (it.config as Record<string, unknown>) : undefined)
          const key = `i_${i}`
          const prev = existingAnswers[key]
          if (t === 'poll') {
            const min = cfgNum(cfg, 'scale_min', 1)
            const max = cfgNum(cfg, 'scale_max', 5)
            const q = cfgStr(cfg, 'question') ?? 'Rate'
            return (
              <li key={key} className="rounded-md border bg-background/40 p-3">
                <div className="font-medium">{q}</div>
                <div className="mt-1 flex items-center gap-2">
                  <select name={key} defaultValue={typeof prev === 'number' ? String(prev) : ''} className="flex h-9 rounded-md border bg-background px-2 text-sm">
                    <option value="">Select</option>
                    {Array.from({ length: max - min + 1 }, (_, idx) => String(idx + min)).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </li>
            )
          }
          if (t === 'prompt') {
            const label = cfgStr(cfg, 'label') ?? 'Your response'
            return (
              <li key={key} className="rounded-md border bg-background/40 p-3">
                <div className="font-medium">{label}</div>
                <Textarea name={key} defaultValue={typeof prev === 'string' ? (prev as string) : ''} className="mt-2 min-h-20" />
              </li>
            )
          }
          if (t === 'quiz') {
            const q = cfgStr(cfg, 'question') ?? 'Choose one'
            const raw = cfg && 'options' in (cfg as object) ? (cfg as { options?: unknown }).options : undefined
            const opts: Array<{ label?: string }> = Array.isArray(raw) ? (raw as Array<{ label?: string }>) : []
            const def = typeof prev === 'number' ? String(prev) : ''
            return (
              <li key={key} className="rounded-md border bg-background/40 p-3">
                <div className="font-medium">{q}</div>
                <div className="mt-2 flex flex-col gap-2">
                  {opts.map((o, idx) => (
                    <label key={idx} className="inline-flex items-center gap-2 text-xs">
                      <input type="radio" name={key} value={String(idx)} defaultChecked={def === String(idx)} />
                      <span>{o?.label ?? `Option ${idx + 1}`}</span>
                    </label>
                  ))}
                </div>
              </li>
            )
          }
          if (t === 'activity') {
            const label = cfgStr(cfg, 'label') ?? 'Select one or more'
            const raw = cfg && 'options' in (cfg as object) ? (cfg as { options?: unknown }).options : undefined
            const opts: Array<{ label?: string; value?: string }> = Array.isArray(raw) ? (raw as Array<{ label?: string; value?: string }>) : []
            const def: string[] = Array.isArray(prev) ? (prev as string[]) : []
            return (
              <li key={key} className="rounded-md border bg-background/40 p-3">
                <div className="font-medium">{label}</div>
                <div className="mt-2 flex flex-col gap-2">
                  {opts.map((o, idx) => {
                    const v = o?.value ?? String(idx)
                    const checked = def.includes(v)
                    return (
                      <label key={v} className="inline-flex items-center gap-2 text-xs">
                        <input type="checkbox" name={key} value={v} defaultChecked={checked} />
                        <span>{o?.label ?? v}</span>
                      </label>
                    )
                  })}
                </div>
              </li>
            )
          }
          return (
            <li key={key} className="rounded-md border bg-background/40 p-3">
              <div className="text-xs text-muted-foreground">Unsupported exercise type</div>
            </li>
          )
        })}
      </ul>
      <div>
        <Button type="submit" size="sm">Save exercises</Button>
      </div>
    </form>
  )
}
