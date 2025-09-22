import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { IconCircle, IconCircleCheck, IconFileText, IconLock } from "@tabler/icons-react"

import { DashboardBreadcrumbs } from "@/components/dashboard/breadcrumbs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getClassModulesForUser, markModuleCompleted } from "@/lib/modules"
import { buildModuleStates, type ModuleState } from "@/lib/module-progress"
import { cn } from "@/lib/utils"

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

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    redirect("/auth/sign-in")
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

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <DashboardBreadcrumbs
        segments={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Classes", href: "/classes" },
          { label: classContext.classTitle, href: `/classes?focus=${classContext.classId}` },
          { label: `Module ${currentState.module.idx}` },
        ]}
      />
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
                {currentState.completed ? (
                  <span className="text-sm font-medium text-primary">Completed</span>
                ) : null}
              </CardTitle>
              <CardDescription>
                {currentState.module.description ?? "Work through the steps below to continue."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ModuleVideo videoUrl={currentState.module.videoUrl} title={currentState.module.title} />
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
              {currentState.module.contentMd ? (
                <article className="prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentState.module.contentMd}</ReactMarkdown>
                </article>
              ) : null}
              <Separator />
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

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    redirect("/auth/sign-in")
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

  if (typeof nextModuleIndex === "string" && nextModuleIndex.length > 0) {
    redirect(`/class/${classSlug}/module/${nextModuleIndex}`)
  }
}

function ModuleCompletionForm({
  moduleId,
  classSlug,
  currentIndex,
  nextModuleIndex,
  completed,
}: {
  moduleId: string
  classSlug: string
  currentIndex: number
  nextModuleIndex: number | null
  completed: boolean
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
      <Button type="submit" disabled={completed}>
        {completed ? "Module Completed" : "Mark Module Complete"}
      </Button>
    </form>
  )
}
