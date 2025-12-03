"use client"

import { useMemo, useTransition, type Dispatch, type SetStateAction } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import GraduationCap from "lucide-react/dist/esm/icons/graduation-cap"
import Layers from "lucide-react/dist/esm/icons/layers"
import Target from "lucide-react/dist/esm/icons/target"
import GitBranch from "lucide-react/dist/esm/icons/git-branch"
import Rocket from "lucide-react/dist/esm/icons/rocket"
import DotIcon from "lucide-react/dist/esm/icons/dot"
import Loader2 from "lucide-react/dist/esm/icons/loader-2"
import MoreVertical from "lucide-react/dist/esm/icons/more-vertical"

import { deleteClassAction, setClassPublishedAction } from "@/app/(admin)/admin/classes/actions"
import { deleteModuleAction } from "@/app/(admin)/admin/classes/[id]/actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { SidebarClass } from "@/lib/academy"

const CreateEntityPopover = dynamic(
  () => import("@/components/admin/create-entity-popover").then((mod) => mod.CreateEntityPopover),
  {
    ssr: false,
    loading: () => (
      <Button
        size="icon"
        variant="ghost"
        aria-label="Create"
        className="h-7 w-7 rounded-md border-0 bg-transparent"
        disabled
      >
        <Loader2 className="h-3 w-3 animate-spin" />
      </Button>
    ),
  },
)

function getClassIcon(slug: string) {
  if (slug === "strategic-foundations") return Layers
  if (slug === "mission-vision-values") return Target
  if (slug === "theory-of-change") return GitBranch
  if (slug === "piloting-programs") return Rocket
  return Layers
}

export type ClassesSectionProps = {
  classes?: SidebarClass[]
  isAdmin: boolean
  openMap: Record<string, boolean>
  setOpenMap: Dispatch<SetStateAction<Record<string, boolean>>>
}

export function ClassesSection({ classes = [], isAdmin, openMap, setOpenMap }: ClassesSectionProps) {
  const pathname = usePathname()
  const router = useRouter()

  const publishedClasses = useMemo(() => classes.filter((klass) => klass.published), [classes])
  const draftClasses = useMemo(() => (isAdmin ? classes.filter((klass) => !klass.published) : []), [classes, isAdmin])

  if (classes.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <GraduationCap className="size-4" />
        <span>Accelerator</span>
      </SidebarGroupLabel>
      {isAdmin ? (
        <SidebarGroupAction asChild>
          <CreateEntityPopover classes={classes.map((klass) => ({ id: klass.id, title: klass.title }))} />
        </SidebarGroupAction>
      ) : null}
      <SidebarGroupContent>
        {publishedClasses.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-xs text-muted-foreground">
            No published classes yet. Publish a class to make it visible to learners.
          </p>
        ) : (
          <ClassList
            classes={publishedClasses}
            pathname={pathname}
            routerPrefetch={router.prefetch.bind(router)}
            openMap={openMap}
            setOpenMap={setOpenMap}
            variant="published"
            isAdmin={isAdmin}
          />
        )}

        {isAdmin && draftClasses.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unpublished</p>
            <ClassList
              classes={draftClasses}
              pathname={pathname}
              routerPrefetch={router.prefetch.bind(router)}
              openMap={openMap}
              setOpenMap={setOpenMap}
              variant="draft"
              isAdmin={isAdmin}
            />
          </div>
        ) : null}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

type ClassListProps = {
  classes: SidebarClass[]
  pathname: string
  routerPrefetch: (href: string) => void
  openMap: Record<string, boolean>
  setOpenMap: Dispatch<SetStateAction<Record<string, boolean>>>
  variant: "published" | "draft"
  isAdmin: boolean
}

function ClassList({ classes, pathname, routerPrefetch, openMap, setOpenMap, variant, isAdmin }: ClassListProps) {
  return (
    <SidebarMenu>
      {classes.map((klass) => {
        const nodeKey = klass.slug || klass.id
        const modules = klass.modules.filter((module) => (variant === "published" ? module.published : !module.published))
        const isOpen = Boolean(openMap[nodeKey])
        const classHref = `/class/${klass.slug}`
        const isActive = pathname === classHref
        const isCurrentClass = isActive || pathname.startsWith(`${classHref}/`)
        const ClassIcon = getClassIcon(klass.slug)

        const toggleNode = () => {
          setOpenMap((previous) => ({
            ...previous,
            [nodeKey]: !previous[nodeKey],
          }))
        }

        return (
          <SidebarMenuItem key={klass.id} className="space-y-1">
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={klass.title}
              className="h-auto min-h-8 items-center pr-12 justify-start gap-2 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:min-h-0 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
            >
              <Link
                href={classHref}
                onMouseEnter={() => routerPrefetch(classHref)}
                title={klass.title}
                className="flex w-full items-center gap-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-0"
              >
                <ClassIcon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 break-words whitespace-normal! overflow-visible! text-clip! text-sm font-medium leading-tight text-pretty group-data-[collapsible=icon]:hidden">
                  {klass.title}
                </span>
              </Link>
            </SidebarMenuButton>
            {modules.length > 0 ? (
              <SidebarMenuAction
                type="button"
                onClick={toggleNode}
                aria-label={isOpen ? "Collapse modules" : "Expand modules"}
                className="right-2"
              >
                <ChevronRight
                  className={cn("size-4 transition-transform", isOpen && "rotate-90")}
                />
              </SidebarMenuAction>
            ) : null}
            {variant === "draft" && isAdmin ? <ClassDraftActions classId={klass.id} /> : null}
            {modules.length > 0 ? (
              <SidebarMenuSub
                data-open={isOpen ? "true" : "false"}
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-out",
                  isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0",
                )}
              >
                {modules.map((module) => {
                  const moduleHref = `/class/${klass.slug}/module/${module.index}`
                  const moduleActive = pathname === moduleHref

                  return (
                    <SidebarMenuSubItem key={module.id} className="flex w-full items-center gap-2">
                      {isAdmin ? <ModuleDraftActions moduleId={module.id} classId={klass.id} /> : null}
                      <SidebarMenuSubButton
                        asChild
                        isActive={moduleActive}
                        className="h-auto min-h-7 justify-start gap-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                      >
                        <Link
                          href={moduleHref}
                          onMouseEnter={() => routerPrefetch(moduleHref)}
                          title={module.title}
                          className="flex w-full items-center gap-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-0"
                        >
                          <DotIcon className="mt-0.5 size-3 shrink-0" />
                          <span className="min-w-0 flex-1 break-words whitespace-normal! overflow-visible! text-clip! text-sm leading-tight group-data-[collapsible=icon]:hidden">
                            {module.title}
                          </span>
                        </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
              </SidebarMenuSub>
            ) : null}
            {modules.length > 0 && isCurrentClass ? (
              <div className="hidden group-data-[collapsible=icon]:mt-1 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                <div className="relative flex flex-col items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div
                    aria-hidden
                    className="bg-sidebar-border/70 pointer-events-none absolute inset-y-1 left-1/2 w-px -translate-x-1/2"
                  />
                  {modules.map((module) => {
                    const moduleHref = `/class/${klass.slug}/module/${module.index}`
                    const moduleActive = pathname === moduleHref

                    return (
                      <SidebarMenuButton
                        key={`${klass.id}-${module.id}-collapsed-icon`}
                        asChild
                        size="sm"
                        isActive={moduleActive}
                        tooltip={module.title}
                        className="h-7 w-7 rounded-full p-0"
                      >
                        <Link
                          href={moduleHref}
                          onMouseEnter={() => routerPrefetch(moduleHref)}
                          title={module.title}
                          className="flex h-7 w-7 items-center justify-center"
                        >
                          <DotIcon className="size-3 shrink-0" />
                        </Link>
                      </SidebarMenuButton>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

function ClassDraftActions({ classId }: { classId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction showOnHover className="right-1">
          <MoreVertical className="size-4" />
          <span className="sr-only">Class actions</span>
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Class</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={async () => {
            const toastId = toast.loading("Publishing class…")
            try {
              await setClassPublishedAction(classId, true)
              toast.success("Class published", { id: toastId })
            } catch (error) {
              const message = error instanceof Error ? error.message : "Failed to update class"
              toast.error(message, { id: toastId })
            }
          }}
        >
          Publish class
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={async () => {
            if (!confirm("Delete class?")) return
            const toastId = toast.loading("Deleting class…")
            try {
              const formData = new FormData()
              formData.append("classId", classId)
              await deleteClassAction(formData)
              toast.success("Class deleted", { id: toastId })
            } catch (error) {
              const message = error instanceof Error ? error.message : "Failed to delete class"
              toast.error(message, { id: toastId })
            }
          }}
        >
          Delete class
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ModuleDraftActions({ moduleId, classId }: { moduleId: string; classId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="flex size-7 items-center justify-center text-muted-foreground transition hover:text-foreground"
          disabled={pending}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreVertical className="size-4" />}
          <span className="sr-only">Module actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Module actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/admin/modules/${moduleId}`}>Edit module</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(event) => {
            event.preventDefault()
            if (!confirm("Delete this module?")) return
            startTransition(async () => {
              const formData = new FormData()
              formData.append("moduleId", moduleId)
              formData.append("classId", classId)
              await deleteModuleAction(formData)
              router.refresh()
            })
          }}
        >
          Delete module
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
