"use client"

import Link from "next/link"
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import type { TouchEvent } from "react"
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import ExternalLink from "lucide-react/dist/esm/icons/external-link"
import DownloadIcon from "lucide-react/dist/esm/icons/download"
import CheckCircle from "lucide-react/dist/esm/icons/check-circle"
import Clock3 from "lucide-react/dist/esm/icons/clock-3"
import CircleDot from "lucide-react/dist/esm/icons/circle-dot"
import Lock from "lucide-react/dist/esm/icons/lock"
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2"
import Play from "lucide-react/dist/esm/icons/play"
import VideoIcon from "lucide-react/dist/esm/icons/video"
import Pencil from "lucide-react/dist/esm/icons/pencil"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import FileText from "lucide-react/dist/esm/icons/file-text"
import BookOpen from "lucide-react/dist/esm/icons/book-open"
import X from "lucide-react/dist/esm/icons/x"
import dynamic from "next/dynamic"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { useRouter } from "next/navigation"
import { toast } from "@/lib/toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { ResourcesCard } from "./resources-card"
import type { ClassDef, Module } from "./types"
import type { LessonWizardPayload } from "@/lib/lessons/types"
import { createClassWizardAction, updateClassWizardAction } from "@/app/(admin)/admin/classes/actions"
import { deriveAssignmentInitialValues } from "./module-detail/assignment-form"
import {
  assignmentValuesEqual,
  buildAssignmentValues,
  getVideoEmbedUrl,
  type AssignmentValues,
} from "./module-detail/utils"

const AssignmentFormLazy = dynamic(
  () => import("./module-detail/assignment-form").then((mod) => mod.AssignmentForm),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading assignment…</span>
        </div>
      </div>
    ),
  },
)

const LessonCreationWizardLazy = dynamic(
  () =>
    import("@/components/admin/lesson-creation-wizard").then(
      (mod) => mod.LessonCreationWizard,
    ),
  {
    ssr: false,
    loading: () => (
      <Button disabled variant="secondary" className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading editor…
      </Button>
    ),
  },
)

const DEFAULT_DECK_URL = "/week-08.pdf"
const DECK_SWIPE_THRESHOLD = 45
const PDF_JS_SRC = "/vendor/pdfjs/pdf.min.js"
const PDF_JS_WORKER_SRC = "/vendor/pdfjs/pdf.worker.min.js"

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string }
      getDocument: (params: { url: string }) => { promise: Promise<any> }
    }
  }
}

let pdfJsLoaderPromise: Promise<any | null> | null = null

async function loadPdfJs() {
  if (typeof window === "undefined") {
    return null
  }
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_SRC
    return window.pdfjsLib
  }
  if (!pdfJsLoaderPromise) {
    pdfJsLoaderPromise = new Promise((resolve) => {
      const handleReady = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_SRC
          resolve(window.pdfjsLib)
        } else {
          pdfJsLoaderPromise = null
          resolve(null)
        }
      }

      const handleError = () => {
        pdfJsLoaderPromise = null
        resolve(null)
      }

      const existing = document.querySelector<HTMLScriptElement>(`script[src="${PDF_JS_SRC}"]`)
      if (existing) {
        existing.addEventListener("load", handleReady, { once: true })
        existing.addEventListener("error", handleError, { once: true })
        return
      }

      const script = document.createElement("script")
      script.src = PDF_JS_SRC
      // pdf.min.js references import.meta, so load it as an ES module to avoid syntax errors in classic scripts.
      script.type = "module"
      script.async = true
      script.addEventListener("load", handleReady, { once: true })
      script.addEventListener("error", handleError, { once: true })
      document.head.appendChild(script)
    })
  }
  return pdfJsLoaderPromise
}

export function ModuleDetail({
  c,
  m,
  isAdmin = false,
}: {
  c: ClassDef
  m: Module
  isAdmin?: boolean
}) {
  const router = useRouter()
  const assignmentFields = useMemo(() => m.assignment?.fields ?? [], [m.assignment?.fields])
  const completeOnSubmit = Boolean(m.assignment?.completeOnSubmit)
  const lockedForLearners = Boolean(m.locked)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardPayload, setWizardPayload] = useState<LessonWizardPayload | null>(null)
  const [wizardLoading, setWizardLoading] = useState(false)
  const [wizardError, setWizardError] = useState<string | null>(null)
  const [wizardFocusModuleId, setWizardFocusModuleId] = useState<string | null>(m.id)

  const progressStats = useMemo(() => {
    const total = c.modules.length
    const completed = c.modules.reduce((count, module) => {
      const status = module.assignmentSubmission?.status ?? null
      return status === "accepted" ? count + 1 : count
    }, 0)
    const currentIndex = c.modules.findIndex((module) => module.id === m.id)
    return {
      total,
      completed,
      currentIndex: currentIndex >= 0 ? currentIndex + 1 : null,
    }
  }, [c.modules, m.id])

  useEffect(() => {
    if (!wizardOpen) {
      setWizardFocusModuleId(m.id)
    }
  }, [m.id, wizardOpen])

  const loadWizardPayload = useCallback(
    async (focusModuleId: string | null) => {
      setWizardError(null)
      setWizardPayload(null)
      setWizardFocusModuleId(focusModuleId ?? m.id)
      setWizardOpen(true)
      setWizardLoading(true)
      let success = false
      try {
        const response = await fetch(`/api/admin/classes/${c.id}/wizard`, {
          cache: "no-store",
        })
        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.error ?? "Failed to load class data")
        }
        const data = (await response.json()) as { payload: LessonWizardPayload }
        setWizardPayload(data.payload)
        success = true
      } catch (err) {
        setWizardError(err instanceof Error ? err.message : "Failed to load class data")
      } finally {
        setWizardLoading(false)
      }
      return success
    },
    [c.id, m.id],
  )

  const handleCreateModule = useCallback(async () => {
    const toastId = toast.loading("Creating module…")
    setWizardError(null)
    setWizardLoading(true)
    try {
      const response = await fetch(`/api/admin/classes/${c.id}/modules`, { method: "POST" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Failed to create module")
      }
      const data = (await response.json()) as { moduleId?: string }
      if (!data?.moduleId) {
        throw new Error("Module id missing in response")
      }
      const ok = await loadWizardPayload(data.moduleId)
      if (ok) {
        toast.success("Module created", { id: toastId })
        router.refresh()
      } else {
        toast.error("Module created, but failed to open editor", { id: toastId })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create module"
      setWizardError(message)
      toast.error(message, { id: toastId })
      setWizardLoading(false)
    }
  }, [c.id, loadWizardPayload, router])

  const initialFormValues = useMemo(() => {
    return deriveAssignmentInitialValues(assignmentFields, m.assignmentSubmission)
  }, [assignmentFields, m.assignmentSubmission])

  const [formSeed, setFormSeed] = useState<AssignmentValues>(initialFormValues)
  useEffect(() => {
    setFormSeed((prev) =>
      assignmentValuesEqual(prev, initialFormValues) ? prev : initialFormValues,
    )
  }, [initialFormValues])

  const [submissionStatus, setSubmissionStatus] = useState<string | null>(
    m.assignmentSubmission?.status ?? null,
  )
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    m.assignmentSubmission?.updatedAt ?? null,
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [autoCompleteTriggered, setAutoCompleteTriggered] = useState(false)
  const [isSubmitting, startTransition] = useTransition()

  useEffect(() => {
    setSubmissionStatus(m.assignmentSubmission?.status ?? null)
    setLastSavedAt(m.assignmentSubmission?.updatedAt ?? null)
    setMessage(null)
    setError(null)
    setAutoCompleteTriggered(false)
  }, [m.assignmentSubmission?.status, m.assignmentSubmission?.updatedAt, m.id])

  const handleSubmit = useCallback(
    (values: AssignmentValues) => {
      if (assignmentFields.length === 0) return
      const fieldsSnapshot = assignmentFields
      setMessage(null)
      setError(null)

      startTransition(() => {
        ;(async () => {
          try {
            const response = await fetch(`/api/modules/${m.id}/assignment-submission`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answers: values }),
            })

            if (!response.ok) {
              let friendly = "Failed to submit assignment."
              try {
                const payload = await response.json()
                if (Array.isArray(payload?.missing) && payload.missing.length > 0) {
                  friendly = `Please complete: ${payload.missing.join(", ")}`
                } else if (typeof payload?.error === "string") {
                  friendly = payload.error
                }
              } catch {
                // ignore parse errors
              }
              setError(friendly)
              return
            }

            const data = (await response.json()) as {
              answers?: Record<string, unknown>
              status?: string | null
              updatedAt?: string | null
              completeOnSubmit?: boolean
            }

            const normalizedAnswers = buildAssignmentValues(
              fieldsSnapshot,
              data.answers ?? null,
            )
            setFormSeed(normalizedAnswers)

            const nextStatus = (data.status ?? "submitted") as string
            setSubmissionStatus(nextStatus)

            const savedAt = data.updatedAt ?? new Date().toISOString()
            setLastSavedAt(savedAt)

            const autoComplete = Boolean(data.completeOnSubmit)
            setMessage(
              autoComplete
                ? "Submission saved — this module is now marked complete."
                : "Submission saved.",
            )
            setAutoCompleteTriggered(autoComplete)
            setError(null)

            router.refresh()
          } catch (err) {
            console.error("Assignment submission failed", err)
            setError("Unable to submit assignment. Please try again.")
          }
        })()
      })
    },
    [assignmentFields, m.id, router],
  )

  const statusMeta = useMemo(() => {
    switch (submissionStatus) {
      case "accepted":
        return {
          label: "Accepted",
          variant: "default" as const,
          note: "Submission accepted.",
        }
      case "revise":
        return {
          label: "Needs revision",
          variant: "destructive" as const,
          note: "Updates requested — please revise and resubmit.",
        }
      case "submitted":
        return {
          label: "Submitted",
          variant: "secondary" as const,
          note: null,
        }
      default:
        return null
    }
  }, [submissionStatus])

  const FALLBACK_VIDEO_URL =
    "https://www.youtube.com/watch?v=Aq5WXmQQooo&list=RDAq5WXmQQooo&start_radio=1"
  const fallbackEmbedUrl = getVideoEmbedUrl(FALLBACK_VIDEO_URL)
  const embedUrl = getVideoEmbedUrl(m.videoUrl) ?? fallbackEmbedUrl
  const [videoProgress, setVideoProgress] = useState<
    "not_started" | "in_progress" | "complete"
  >("not_started")

  const lessonNotesContent = useMemo(() => {
    return m.contentMd ?? null
  }, [m.contentMd])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          {(() => {
            const parts: string[] = []
            if (progressStats.currentIndex != null && progressStats.total > 0) {
              parts.push(`Module ${progressStats.currentIndex} of ${progressStats.total}`)
            }
            if (progressStats.total > 0) {
              parts.push(`${progressStats.completed}/${progressStats.total} completed`)
            }
            return parts.length > 0 ? (
              <p className="text-sm text-muted-foreground">{parts.join(" · ")}</p>
            ) : null
          })()}
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {m.title}
          </h1>
          {m.subtitle ? (
            <p className="max-w-3xl text-base text-muted-foreground">{m.subtitle}</p>
          ) : null}
        </div>
        {isAdmin ? (
          <div className="flex flex-col items-end gap-2">
            {wizardError ? (
              <p className="text-xs text-rose-500">{wizardError}</p>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="min-h-9 gap-2 shrink-0"
              onClick={() => {
                void loadWizardPayload(m.id)
              }}
              disabled={wizardLoading}
            >
              {wizardLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Pencil className="h-4 w-4" aria-hidden />
              )}
              <span>{wizardLoading ? "Loading…" : "Edit module"}</span>
            </Button>
          </div>
        ) : null}
      </div>

      {isAdmin && lockedForLearners ? (
        <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100">
          <Lock className="h-4 w-4" />
          <AlertTitle>Locked for learners</AlertTitle>
          <AlertDescription>
            Learners will unlock this module after they complete the prior lessons. You can
            still preview all content.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-6 py-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <VideoIcon className="h-4 w-4" />
            <span>Lesson Video</span>
          </div>
        </div>
        <CardContent className="overflow-hidden rounded-b-2xl p-0">
          {embedUrl ? (
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={embedUrl}
                title="Lesson video"
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : m.videoUrl ? (
            <div className="flex flex-col items-center gap-3 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              <p>This video is hosted externally — open it in a new tab to watch.</p>
              <Button asChild size="sm">
                <a href={m.videoUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open video
                </a>
              </Button>
            </div>
          ) : (
            <div className="grid aspect-video place-items-center bg-muted">
              <Button
                variant="secondary"
                size="sm"
                className="pointer-events-none"
              >
                <Play className="mr-2 h-4 w-4" /> Video coming soon
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DeckViewer />

      {lessonNotesContent ? (
        <Card className="gap-0">
          <CardHeader className="gap-1 px-6 py-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {m.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              Additional context and instructions.
            </CardDescription>
          </CardHeader>
          <CardContent className="border-t border-border/60 px-6 py-3">
            <article className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {lessonNotesContent}
              </ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      ) : null}

      {Array.isArray(m.resources) && m.resources.length > 0 ? (
        <ResourcesCard resources={m.resources} />
      ) : null}

      {assignmentFields.length > 0 ? (
        (() => {
          const idx = c.modules.findIndex((x) => x.id === m.id)
          const next = idx >= 0 ? c.modules[idx + 1] : null
          const nextHref =
            next && c.slug ? `/class/${c.slug}/module/${idx + 2}` : null
          return (
            <section className="mt-8">
              <AssignmentFormLazy
                fields={assignmentFields}
                initialValues={formSeed}
                pending={isSubmitting}
                onSubmit={handleSubmit}
                statusLabel={statusMeta?.label ?? null}
                statusVariant={statusMeta?.variant ?? "outline"}
                statusNote={statusMeta?.note ?? null}
                helperText={message}
                errorMessage={error}
                updatedAt={lastSavedAt}
                completeOnSubmit={completeOnSubmit}
                moduleId={m.id}
                moduleTitle={m.title}
                classTitle={c.title}
                nextHref={nextHref}
                currentStep={idx}
                totalSteps={c.modules.length}
              />
            </section>
          )
        })()
      ) : null}

      {isAdmin ? (
        <LessonCreationWizardLazy
          open={wizardOpen}
          mode={wizardPayload ? "edit" : "create"}
          classId={c.id}
          initialPayload={wizardPayload}
          focusModuleId={wizardFocusModuleId ?? m.id}
          loading={wizardLoading}
          onCreateModule={handleCreateModule}
          onOpenChange={(value) => {
            setWizardOpen(value)
            if (!value) {
              setWizardPayload(null)
              setWizardError(null)
              setWizardFocusModuleId(m.id)
            }
          }}
          onSubmit={async (formData) => {
            const payloadRaw = formData.get("payload")
            const classIdValue = formData.get("classId") ?? c.id
            if (typeof payloadRaw !== "string" || typeof classIdValue !== "string") {
              return { error: "Invalid lesson payload" }
            }
            if (wizardPayload) {
              return updateClassWizardAction(classIdValue, payloadRaw)
            }
            return createClassWizardAction(formData)
          }}
        />
      ) : null}
    </div>
  )
}

function DeckViewer() {
  const [page, setPage] = useState(1)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [fullScreenOpen, setFullScreenOpen] = useState(false)
  const [loadingDoc, setLoadingDoc] = useState(true)
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supportsCanvas, setSupportsCanvas] = useState(true)
  const touchStart = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<any>(null)
  const renderTaskRef = useRef<any>(null)

  const clampPage = useCallback((value: number, max: number) => {
    return Math.max(1, Math.min(max, value))
  }, [])

  const effectiveMaxPage = pageCount ?? 1

  const navigate = useCallback(
    (delta: number) => {
      setPage((prev) => {
        const next = clampPage(prev + delta, effectiveMaxPage)
        return next === prev ? prev : next
      })
    },
    [clampPage, effectiveMaxPage],
  )

  useEffect(() => {
    setPage((prev) => clampPage(prev, effectiveMaxPage))
  }, [clampPage, effectiveMaxPage])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = (event.target as HTMLElement | null)?.closest(
        "input, textarea, [contenteditable=true]",
      )
      if (target) return
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        if (event.altKey) return
        const delta = event.key === "ArrowRight" ? 1 : -1
        event.preventDefault()
        navigate(delta)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [navigate])

  useEffect(() => {
    let cancelled = false
    const loadDocument = async () => {
      try {
        setLoadingDoc(true)
        setError(null)
        const pdfjsLib = await loadPdfJs()
        if (!pdfjsLib || cancelled) {
          setSupportsCanvas(false)
          return
        }
        const instance = await pdfjsLib.getDocument({ url: DEFAULT_DECK_URL }).promise
        if (cancelled) return
        pdfRef.current = instance
        setPageCount(instance.numPages ?? null)
        await renderPage()
      } catch (err) {
        console.error("Failed to load PDF deck", err)
        if (!cancelled) {
          setSupportsCanvas(false)
          setError("Unable to load deck preview")
        }
      } finally {
        if (!cancelled) {
          setLoadingDoc(false)
        }
      }
    }
    void loadDocument()
    return () => {
      cancelled = true
    }
  }, [])

  const renderPage = useCallback(async () => {
    if (!supportsCanvas) {
      return
    }
    const pdfDoc = pdfRef.current
    const canvas = canvasRef.current
    const container = viewportRef.current ?? containerRef.current
    if (!pdfDoc || !canvas || !container) {
      return
    }
    setIsRendering(true)
    let task: any | null = null
    try {
      const pdfPage = await pdfDoc.getPage(page)
      const baseViewport = pdfPage.getViewport({ scale: 1 })
      const targetHeight = container.clientHeight || baseViewport.height
      const targetWidth = container.clientWidth || baseViewport.width
      const coverScale = Math.max(
        targetHeight / baseViewport.height,
        targetWidth / baseViewport.width,
      )
      const scale = coverScale
      const viewport = pdfPage.getViewport({ scale })
      const context = canvas.getContext("2d")
      if (!context) {
        throw new Error("Canvas context unavailable")
      }
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      canvas.style.position = "absolute"
      canvas.style.top = "50%"
      canvas.style.left = "50%"
      canvas.style.transform = "translate(-50%, -50%)"
      canvas.style.borderRadius = "inherit"
      canvas.style.pointerEvents = "none"
      canvas.style.opacity = "1"
      canvas.style.transition = ""
      canvas.style.willChange = "auto"
      if (renderTaskRef.current?.cancel) {
        try {
          renderTaskRef.current.cancel()
        } catch {
          // ignore
        }
      }
      task = pdfPage.render({ canvasContext: context, viewport })
      renderTaskRef.current = task
      await task.promise
      setError(null)
    } catch (err: any) {
      if (err?.name === "RenderingCancelledException") {
        return
      }
      console.error("Failed to render slide", err)
      setError("Unable to render slide")
    } finally {
      if (renderTaskRef.current === task) {
        renderTaskRef.current = null
      }
      setIsRendering(false)
    }
  }, [page, supportsCanvas])

  useEffect(() => {
    if (!supportsCanvas || !pdfRef.current) {
      return
    }
    void renderPage()
  }, [renderPage, supportsCanvas, pageCount])

  const pageLabel = pageCount ? `${page}/${pageCount}` : `${page}/?`

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length > 0) {
      touchStart.current = event.touches[0].clientX
    }
  }, [])

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (touchStart.current === null || event.changedTouches.length === 0) {
        touchStart.current = null
        return
      }
      const delta = event.changedTouches[0].clientX - touchStart.current
      touchStart.current = null
      if (Math.abs(delta) < DECK_SWIPE_THRESHOLD) {
        return
      }
      if (delta > 0) {
        navigate(-1)
      } else {
        navigate(1)
      }
    },
    [navigate],
  )

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const handlePlayClick = useCallback(() => {
    const el = containerRef.current
    const request =
      el?.requestFullscreen ||
      (el as any)?.webkitRequestFullscreen ||
      (el as any)?.msRequestFullscreen
    if (request) {
      try {
        void request.call(el)
        return
      } catch {
        // fallback to dialog
      }
    }
    setFullScreenOpen(true)
  }, [])

  const ControlsOverlay = (
    <>
      <div className="pointer-events-none absolute bottom-3 right-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="inline-flex rounded-full bg-background/90 px-2 py-1 shadow-sm ring-1 ring-border/40">
          {pageLabel}
        </span>
      </div>

      <div className="pointer-events-none absolute left-1/2 bottom-4 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 shadow-sm ring-1 ring-border/40">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous slide"
            disabled={page === 1 || loadingDoc || isRendering}
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Play slideshow"
            onClick={handlePlayClick}
            className="h-9 w-9"
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next slide"
            disabled={page >= effectiveMaxPage || loadingDoc || isRendering}
            onClick={() => navigate(1)}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-background/90 px-2 py-1 shadow-sm ring-1 ring-border/40">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <a
              href={DEFAULT_DECK_URL}
              target="_blank"
              rel="noreferrer"
              download
              aria-label="Download PDF"
            >
              <DownloadIcon className="h-4 w-4" />
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="View full screen"
            className="h-8 w-8"
            onClick={() => setFullScreenOpen(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )

  const ViewerBody = (
    <div
      className="group relative w-full touch-pan-x overscroll-none overflow-hidden rounded-2xl border border-border/40 bg-card/80 shadow-sm"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      ref={containerRef}
    >
      <div
        className="relative w-full"
        ref={viewportRef}
        style={{ height: fullScreenOpen ? "75vh" : "min(540px,65vh)" }}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
        {(loadingDoc || isRendering) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/85 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Loading slide…
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-center text-sm text-muted-foreground">
            <p>{error}</p>
            <Button asChild size="sm">
              <a href={DEFAULT_DECK_URL} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Open PDF
              </a>
            </Button>
          </div>
        ) : null}
      </div>
      {ControlsOverlay}
    </div>
  )

  if (!supportsCanvas) {
    return (
      <>
        <div className="relative w-full overflow-hidden rounded-2xl border border-border/40 bg-card/80 shadow-sm">
          <iframe
            src={`${DEFAULT_DECK_URL}#toolbar=0&navpanes=0&page=${page}&view=FitH`}
            title="Slide deck"
            className="h-[min(540px,65vh)] w-full border-0 bg-white"
          />
          {ControlsOverlay}
        </div>
        <Dialog open={fullScreenOpen} onOpenChange={setFullScreenOpen}>
          <DialogContent className="max-w-6xl bg-[#121212] p-0 text-foreground">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="flex items-center gap-2 text-base font-semibold">
                <VideoIcon className="h-4 w-4" />
                <span>Presentation</span>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                  <a
                    href={DEFAULT_DECK_URL}
                    target="_blank"
                    rel="noreferrer"
                    download
                    aria-label="Download PDF"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Close preview"
                  onClick={() => setFullScreenOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="group relative overflow-hidden bg-card">
              <iframe
                src={`${DEFAULT_DECK_URL}#toolbar=0&navpanes=0&page=${page}&view=FitH`}
                title="Slide deck full view"
                className="h-[75vh] w-full border-0 bg-white"
              />
              <div className="pointer-events-none absolute bottom-4 right-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="inline-flex rounded-full bg-background/90 px-2 py-1 shadow-sm ring-1 ring-border/40">
                  {pageLabel}
                </span>
              </div>
              <div className="pointer-events-none absolute left-1/2 bottom-4 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 shadow-sm ring-1 ring-border/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Previous slide"
                    disabled={page === 1 || loadingDoc || isRendering}
                    onClick={() => navigate(-1)}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Next slide"
                    disabled={page >= effectiveMaxPage || loadingDoc || isRendering}
                    onClick={() => navigate(1)}
                    className="h-9 w-9"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      {!fullScreenOpen ? ViewerBody : null}
      <Dialog open={fullScreenOpen} onOpenChange={setFullScreenOpen}>
        <DialogContent className="max-w-6xl bg-[#121212] p-0 text-foreground">
          <DialogHeader className="sr-only">
            <DialogTitle>Slide deck</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2 text-base font-semibold">
              <VideoIcon className="h-4 w-4" />
              <span>Presentation</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                <a
                  href={DEFAULT_DECK_URL}
                  target="_blank"
                  rel="noreferrer"
                  download
                  aria-label="Download PDF"
                >
                  <DownloadIcon className="h-4 w-4" />
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                aria-label="Close preview"
                onClick={() => setFullScreenOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="group relative overflow-hidden bg-card">
            <iframe
              src={`${DEFAULT_DECK_URL}#toolbar=0&navpanes=0&page=${page}&view=FitH`}
              title="Slide deck full view"
              className="h-[75vh] w-full border-0 bg-white"
            />
            <div className="pointer-events-none absolute bottom-4 right-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="inline-flex rounded-full bg-background/90 px-2 py-1 shadow-sm ring-1 ring-border/40">
                {pageLabel}
              </span>
            </div>
            <div className="pointer-events-none absolute left-1/2 bottom-4 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 shadow-sm ring-1 ring-border/40">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Previous slide"
                  disabled={page === 1 || loadingDoc || isRendering}
                  onClick={() => navigate(-1)}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Next slide"
                  disabled={page >= effectiveMaxPage || loadingDoc || isRendering}
                  onClick={() => navigate(1)}
                  className="h-9 w-9"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card">
              <div className="relative flex">
                <div className="hidden w-40 shrink-0 overflow-auto border-r border-border/40 bg-muted/20 md:block">
                  <div className="divide-y divide-border/40">
                    {Array.from({ length: pageCount ?? 1 }).map((_, idx) => {
                      const pageNum = idx + 1
                      const isActive = pageNum === page
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-muted/60",
                            isActive && "bg-muted/80 font-semibold",
                          )}
                        >
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-background text-[11px] font-semibold ring-1 ring-border/50">
                            {pageNum}
                          </span>
                          <span className="truncate">Slide {pageNum}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex-1 p-4">{ViewerBody}</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function VideoProgressIndicator({
  progress,
}: {
  progress: "not_started" | "in_progress" | "complete"
}) {
  const colors =
    progress === "complete"
      ? {
          ring: "text-emerald-500",
          track: "bg-emerald-500/20",
          label: "text-emerald-500",
          icon: <CheckCircle className="h-4 w-4" />,
        }
      : progress === "in_progress"
        ? {
            ring: "text-amber-500",
            track: "bg-amber-500/20",
            label: "text-amber-500",
            icon: <Clock3 className="h-4 w-4" />,
          }
        : {
            ring: "text-sky-500",
            track: "bg-sky-500/20",
            label: "text-sky-500",
            icon: <CircleDot className="h-4 w-4" />,
          }

  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${colors.track}`}>
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full bg-card/90 text-[10px] font-semibold ${colors.ring}`}
        >
          {colors.icon}
        </div>
      </div>
      <span className={`capitalize ${colors.label}`}>
        {progress === "not_started"
          ? "Not started"
          : progress === "in_progress"
            ? "In progress"
            : "Complete"}
      </span>
    </div>
  )
}
