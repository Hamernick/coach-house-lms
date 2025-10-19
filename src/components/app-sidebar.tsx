"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { Icon } from "@tabler/icons-react"
import {
  IconBuilding,
  IconHelp,
  IconLayoutDashboard,
  IconMessageCircle,
  IconNotebook,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  GraduationCap,
  ChevronRight,
  MoreVertical,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import type { SidebarClass } from "@/lib/academy"
import { CreateEntityPopover } from "@/components/admin/create-entity-popover"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteClassAction, setClassPublishedAction } from "@/app/(admin)/admin/classes/actions"
import { deleteModuleAction } from "@/app/(admin)/admin/classes/[id]/actions"

function buildMainNav(isAdmin: boolean): { title: string; href: string; icon?: Icon }[] {
  const items: { title: string; href: string; icon?: Icon }[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: IconLayoutDashboard,
    },
  ]

  if (!isAdmin) {
    items.push(
      {
        title: "My Organization",
        href: "/my-organization",
        icon: IconBuilding,
      },
      {
        title: "People",
        href: "/people",
        icon: IconUsers,
      },
    )
  }

  return items
}

const RESOURCE_NAV = [
  {
    name: "Knowledge base",
    url: "https://coach-house.gitbook.io/coach-house",
    icon: IconNotebook,
    external: true,
  },
  {
    name: "Community",
    url: "/community",
    icon: IconMessageCircle,
  },
]

const ACCORDION_EASING: [number, number, number, number] = [0.4, 0, 0.2, 1]

const LIST_VARIANTS = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2, ease: ACCORDION_EASING },
      opacity: { duration: 0.18, ease: ACCORDION_EASING },
    },
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.32, ease: ACCORDION_EASING },
      opacity: { duration: 0.25, ease: ACCORDION_EASING },
      when: "beforeChildren" as const,
      staggerChildren: 0.045,
    },
  },
}

const LIST_ITEM_VARIANTS = {
  collapsed: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: ACCORDION_EASING },
  },
  open: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: ACCORDION_EASING,
      delay: index * 0.045,
    },
  }),
}

const SUPPORT_EMAIL = "contact@coachhousesolutions.org"

const SECONDARY_NAV = [
  {
    title: "Support",
    url: `mailto:${SUPPORT_EMAIL}`,
    icon: IconHelp,
  },
]

function computeActiveOpenMap(pathname: string, classes?: SidebarClass[] | null) {
  const map: Record<string, boolean> = {}
  if (!classes) return map
  for (const cls of classes) {
    const classHref = `/class/${cls.slug}`
    const isClassActive = pathname === classHref
    const moduleActive = cls.modules.some((m) => pathname === `/class/${cls.slug}/module/${m.index}`)
    if (isClassActive || moduleActive) {
      map[cls.slug] = true
    }
  }
  return map
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    name?: string | null
    email?: string | null
    avatar?: string | null
  }
  isAdmin?: boolean
  classes?: SidebarClass[]
}

export function AppSidebar({ user, isAdmin = false, classes, ...props }: AppSidebarProps) {
  const resolvedUser = {
    name: user?.name ?? null,
    email: user?.email ?? null,
    avatar: user?.avatar ?? null,
  }
  const pathname = usePathname()
  const router = useRouter()
  const activeOpenMap = React.useMemo(() => computeActiveOpenMap(pathname, classes), [pathname, classes])

  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(activeOpenMap)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem('academyOpenMap')
      if (!saved) return
      const parsed = JSON.parse(saved) as Record<string, boolean>
      setOpenMap((prev) => {
        let changed = false
        const next = { ...prev }
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'boolean' && next[key] !== value) {
            next[key] = value
            changed = true
          }
        }
        for (const [slug, shouldOpen] of Object.entries(activeOpenMap)) {
          if (shouldOpen && !next[slug]) {
            next[slug] = true
            changed = true
          }
        }
        return changed ? next : prev
      })
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    setOpenMap((prev) => {
      let changed = false
      const next = { ...prev }
      for (const [slug, shouldOpen] of Object.entries(activeOpenMap)) {
        if (shouldOpen && !next[slug]) {
          next[slug] = true
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [activeOpenMap])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try { window.localStorage.setItem('academyOpenMap', JSON.stringify(openMap)) } catch {}
  }, [openMap])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2 data-[slot=sidebar-menu-button]:!h-10 data-[slot=sidebar-menu-button]:!items-center data-[slot=sidebar-menu-button]:!rounded-lg"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <span className="relative flex h-8 w-8 items-center justify-center">
                  <Image
                    src="/coach-house-logo-light.png"
                    alt="Coach House logo"
                    width={32}
                    height={32}
                    className="block dark:hidden"
                    priority
                  />
                  <Image
                    src="/coach-house-logo-dark.png"
                    alt="Coach House logo"
                    width={32}
                    height={32}
                    className="hidden dark:block"
                    priority
                  />
                </span>
                <span className="text-base font-semibold tracking-tight">Coach House</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={buildMainNav(isAdmin)} label="Platform" />
        {/* Academy: DB-backed classes and modules */}
        {(() => {
          const tree = Array.isArray(classes) ? classes : []
          if (tree.length === 0) return null

          const publishedClasses = tree.filter((c) => c.published)
          const draftClasses = isAdmin ? tree.filter((c) => !c.published) : []

          type Node = {
            key: string
            title: string
            href: string
            children: Array<{ id: string; title: string; href: string }>
          }

          const nodes: Node[] = publishedClasses.map((c) => ({
            key: c.slug,
            title: c.title,
            href: `/class/${c.slug}`,
            children: c.modules
              .filter((m) => m.published)
              .map((m) => ({
                id: m.id,
                title: `Module ${m.index}`,
                href: `/class/${c.slug}/module/${m.index}`,
              })),
          }))

          const TopItem = ({ node }: { node: Node }) => {
            const isActive = pathname === node.href
            const isOpen = Boolean(openMap[node.key])
            return (
              <SidebarMenuItem key={node.key}>
                <div className="flex items-center gap-1.5">
                  {node.children ? (
                    <SidebarMenuAction
                      title={isOpen ? 'Collapse' : 'Expand'}
                      className="static order-first flex size-7 shrink-0 items-center justify-center rounded-md border border-transparent hover:border-border hover:bg-sidebar-accent"
                      onClick={(e) => {
                        e.preventDefault()
                        const map = { ...openMap, [node.key]: !isOpen }
                        setOpenMap(map)
                      }}
                    >
                      <motion.span
                        initial={false}
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.18, ease: "easeInOut" }}
                        className="flex items-center justify-center"
                      >
                        <ChevronRight className="size-4" />
                      </motion.span>
                    </SidebarMenuAction>
                  ) : null}
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="flex-1 rounded-md px-2 py-2 hover:bg-sidebar-accent"
                  >
                    <Link
                      href={node.href}
                      prefetch
                      onMouseEnter={() => router.prefetch(node.href)}
                      onClick={() => {
                        if (node.children && !openMap[node.key]) {
                          const map = { ...openMap, [node.key]: true }
                          setOpenMap(map)
                          try { window.localStorage.setItem('academyOpenMap', JSON.stringify(map)) } catch {}
                        }
                      }}
                      className="flex w-full items-center justify-between gap-2 text-left text-sm leading-snug transition-colors"
                    >
                      <span className="flex-1 truncate break-words text-pretty">{node.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </div>
                <AnimatePresence initial={false} mode="wait">
                  {node.children && isOpen ? (
                    <motion.div
                      key={`${node.key}-modules`}
                      variants={LIST_VARIANTS}
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      style={{ overflow: "hidden" }}
                    >
                    <SidebarMenuSub className="relative pl-3 lg:pl-4">
                        {node.children.map((c, index) => {
                          const active = pathname === c.href
                          return (
                            <SidebarMenuSubItem key={c.id} className="overflow-hidden">
                              <motion.div
                                variants={LIST_ITEM_VARIANTS}
                                custom={index}
                                className="w-full"
                              >
                                <SidebarMenuSubButton
                                  asChild
                                  size="sm"
                                  isActive={active}
                                  className="relative transition-colors duration-200 rounded-md h-auto min-h-9 py-2 whitespace-normal break-words overflow-visible hover:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-foreground"
                                >
                                  <Link
                                    href={c.href}
                                    prefetch
                                    className="relative block w-full whitespace-normal break-words overflow-visible text-muted-foreground leading-snug hover:text-foreground max-w-[calc(100%-2.5rem)]"
                                    onMouseEnter={() => router.prefetch(c.href)}
                                  >
                                    {c.title}
                                  </Link>
                                </SidebarMenuSubButton>
                              </motion.div>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </SidebarMenuItem>
            )
          }

          return (
            <>
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center gap-2 text-xs font-semibold tracking-wider mb-2 md:mb-3">
                  <GraduationCap className="size-4" />
                  ACADEMY
                  {isAdmin ? (
                    <div className="ml-auto inline-flex items-center gap-1">
                      <CreateEntityPopover classes={tree.map((c) => ({ id: c.id, title: c.title }))} />
                    </div>
                  ) : null}
                </SidebarGroupLabel>
                {publishedClasses.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    No published classes yet. Publish a class to make it visible to learners.
                  </div>
                ) : (
                  <SidebarMenu>
                    {nodes.map((node) => (
                      <TopItem key={node.key} node={node} />
                    ))}
                  </SidebarMenu>
                )}
              </SidebarGroup>

              {isAdmin && draftClasses.length > 0 ? (
                <SidebarGroup className="mt-6">
                  <SidebarGroupLabel className="flex items-center gap-2 text-xs font-semibold tracking-wider mb-2 md:mb-3">
                    <GraduationCap className="size-4" />
                    UNPUBLISHED
                  </SidebarGroupLabel>
                  <SidebarMenu>
                    {draftClasses.map((klass) => {
                      const unpublishedModules = klass.modules.filter((mod) => !mod.published)
                      const nodeKey = klass.slug || klass.id
                      const isOpen = Boolean(openMap[nodeKey])
                      const toggle = () => {
                        const map = { ...openMap, [nodeKey]: !isOpen }
                        setOpenMap(map)
                        try {
                          window.localStorage.setItem("academyOpenMap", JSON.stringify(map))
                        } catch {}
                      }
                      return (
                    <SidebarMenuItem key={klass.id}>
                      <div className="flex items-center gap-2">
                        <SidebarMenuAction
                          title={isOpen ? "Collapse" : "Expand"}
                          className="static order-first flex size-7 shrink-0 items-center justify-center rounded-md border border-transparent hover:border-border hover:bg-sidebar-accent"
                          onClick={(event) => {
                            event.preventDefault()
                            if (unpublishedModules.length > 0) toggle()
                          }}
                        >
                          <motion.span
                            initial={false}
                            animate={{ rotate: unpublishedModules.length > 0 && isOpen ? 90 : 0 }}
                            transition={{ duration: 0.18, ease: "easeInOut" }}
                            className={cn("flex items-center justify-center", unpublishedModules.length === 0 && "opacity-40")}
                          >
                            <ChevronRight className="size-4" />
                          </motion.span>
                        </SidebarMenuAction>
                        <ClassDraftActions classId={klass.id} />
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === `/class/${klass.slug}`}
                          className="flex-1 rounded-md px-2 py-2 text-left hover:bg-sidebar-accent"
                        >
                          <Link
                            href={`/class/${klass.slug}`}
                            prefetch
                            onMouseEnter={() => router.prefetch(`/class/${klass.slug}`)}
                            className="flex w-full items-center justify-between gap-2 text-sm font-medium leading-tight"
                          >
                            <span className="flex-1 truncate break-words text-pretty">
                              {klass.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </div>
                      <AnimatePresence initial={false} mode="wait">
                        {unpublishedModules.length > 0 && isOpen ? (
                          <motion.div
                            key={`${klass.id}-draft-modules`}
                            variants={LIST_VARIANTS}
                            initial="collapsed"
                            animate="open"
                            exit="collapsed"
                            style={{ overflow: "hidden" }}
                          >
                            <SidebarMenuSub className="mt-2 pl-3">
                              {unpublishedModules.map((mod, index) => (
                                <SidebarMenuSubItem key={mod.id} className="overflow-hidden">
                                  <motion.div
                                    variants={LIST_ITEM_VARIANTS}
                                    custom={index}
                                    className="flex w-full items-center gap-2"
                                  >
                                    <ModuleDraftActions moduleId={mod.id} classId={klass.id} />
                                    <SidebarMenuSubButton
                                      asChild
                                      size="sm"
                                      className="h-auto flex-1 rounded-md px-2 py-1 text-left whitespace-normal data-[active=true]:font-semibold data-[active=true]:text-foreground"
                                      isActive={pathname === `/class/${klass.slug}/module/${mod.index}`}
                                    >
                                      <Link
                                        href={`/class/${klass.slug}/module/${mod.index}`}
                                        prefetch
                                        onMouseEnter={() => router.prefetch(`/class/${klass.slug}/module/${mod.index}`)}
                                        className="relative block text-sm leading-tight break-words"
                                      >
                                        Module {mod.index}: {mod.title}
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </motion.div>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          ) : null}
            </>
          )
        })()}
        {!isAdmin ? (
          <div className="mt-auto flex flex-col gap-6 pb-2">
            <NavDocuments items={RESOURCE_NAV} label="Resources" />
            <NavSecondary items={SECONDARY_NAV} />
          </div>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={resolvedUser} isAdmin={isAdmin} />
      </SidebarFooter>
    </Sidebar>
  )
}

function ClassDraftActions({ classId }: { classId: string }) {
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-foreground flex items-center justify-center"
          disabled={pending}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <MoreVertical className="size-4" />}
          <span className="sr-only">Class actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Class actions</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            startTransition(async () => {
              await setClassPublishedAction(classId, true)
              router.refresh()
            })
          }}
        >
          Publish class
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/classes/${classId}`}>Edit class</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={(event) => {
            event.preventDefault()
            if (!confirm("Delete this class and all modules?")) return
            const fd = new FormData()
            fd.append("classId", classId)
            startTransition(async () => {
              await deleteClassAction(fd)
              router.refresh()
            })
          }}
        >
          Delete class
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ModuleDraftActions({ moduleId, classId }: { moduleId: string; classId: string }) {
  const [pending, startTransition] = React.useTransition()
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-foreground flex items-center justify-center"
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
            const fd = new FormData()
            fd.append("moduleId", moduleId)
            fd.append("classId", classId)
            startTransition(async () => {
              await deleteModuleAction(fd)
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
