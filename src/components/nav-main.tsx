"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import FileTextIcon from "lucide-react/dist/esm/icons/file-text"
import FolderIcon from "lucide-react/dist/esm/icons/folder"
import {
  resolvePrototypeLabSidebarActiveEntryId,
  resolvePrototypeLabSidebarOpenFolderIds,
  type PrototypeLabSidebarTreeFolderNode,
  type PrototypeLabSidebarTreeNode,
} from "@/features/prototype-lab"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
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
import { cn } from "@/lib/utils"

type NavMainItem = {
  title: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  tree?: PrototypeLabSidebarTreeNode[]
  locked?: boolean
  badge?: string
  upgradeHref?: string
  upgradeLabel?: string
}

function PrototypeTreeEntry({
  href,
  isActive,
  label,
}: {
  href: string
  isActive: boolean
  label: string
}) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={isActive}>
        <Link href={href} scroll={false}>
          <FileTextIcon className="size-3.5 shrink-0" aria-hidden />
          <span>{label}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

function PrototypeTreeFolder({
  activeEntryId,
  defaultOpenFolderIds,
  node,
}: {
  activeEntryId: string
  defaultOpenFolderIds: string[]
  node: PrototypeLabSidebarTreeFolderNode
}) {
  const [open, setOpen] = useState(defaultOpenFolderIds.includes(node.id))

  useEffect(() => {
    if (defaultOpenFolderIds.includes(node.id)) {
      setOpen(true)
    }
  }, [defaultOpenFolderIds, node.id])

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuSubItem>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-7 w-full min-w-0 items-center justify-start gap-2 rounded-md px-2 text-sm outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-inset"
          >
            <ChevronRightIcon
              className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-90")}
              aria-hidden
            />
            <FolderIcon className="size-4 shrink-0 text-amber-500" aria-hidden />
            <span className="truncate">{node.label}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-[accordion-down_160ms_ease-out] data-[state=closed]:animate-[accordion-up_140ms_ease-out] motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none">
          <SidebarMenuSub>
            {node.children.map((childNode) =>
              childNode.kind === "folder" ? (
                <PrototypeTreeFolder
                  key={childNode.id}
                  activeEntryId={activeEntryId}
                  defaultOpenFolderIds={defaultOpenFolderIds}
                  node={childNode}
                />
              ) : (
                <PrototypeTreeEntry
                  key={childNode.id}
                  href={childNode.href}
                  isActive={childNode.id === activeEntryId}
                  label={childNode.label}
                />
              ),
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  )
}

function NavMainTreeItem({
  activeEntryId,
  isActive,
  item,
  tourId,
}: {
  activeEntryId: string
  isActive: boolean
  item: NavMainItem
  tourId?: string
}) {
  const defaultOpenFolderIds = resolvePrototypeLabSidebarOpenFolderIds(activeEntryId)
  const [treeOpen, setTreeOpen] = useState(isActive)
  const previousIsActiveRef = useRef(isActive)
  const isTreeExpanded = isActive && treeOpen

  useEffect(() => {
    if (!previousIsActiveRef.current && isActive) {
      setTreeOpen(true)
    }
    previousIsActiveRef.current = isActive
  }, [isActive])

  return (
    <Collapsible open={isTreeExpanded} onOpenChange={setTreeOpen}>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={item.title}
          className="justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
        >
          <Link
            href={item.href ?? "#"}
            title={item.title}
            data-tour={tourId}
            className="flex w-full items-center gap-2"
          >
            {item.icon ? <item.icon className="size-4 shrink-0" /> : null}
            <span className="flex-1 min-w-0 truncate whitespace-nowrap leading-snug group-data-[collapsible=icon]:hidden">
              {item.title}
            </span>
            {item.href === "/roadmap" ? (
              <ArrowUpRightIcon
                className="ml-auto size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
                aria-hidden
              />
            ) : null}
          </Link>
        </SidebarMenuButton>
        <SidebarMenuAction asChild>
          <CollapsibleTrigger
            aria-label={isTreeExpanded ? `Collapse ${item.title}` : `Expand ${item.title}`}
            className="group-data-[collapsible=icon]:hidden"
          >
            {isTreeExpanded ? (
              <ChevronDownIcon className="size-3.5 text-muted-foreground" aria-hidden />
            ) : (
              <ChevronRightIcon className="size-3.5 text-muted-foreground" aria-hidden />
            )}
          </CollapsibleTrigger>
        </SidebarMenuAction>
        <CollapsibleContent className="overflow-hidden group-data-[collapsible=icon]:hidden data-[state=open]:animate-[accordion-down_160ms_ease-out] data-[state=closed]:animate-[accordion-up_140ms_ease-out] motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none">
          <SidebarMenuSub className="mt-1">
            {item.tree?.map((node) =>
              node.kind === "folder" ? (
                <PrototypeTreeFolder
                  key={node.id}
                  activeEntryId={activeEntryId}
                  defaultOpenFolderIds={defaultOpenFolderIds}
                  node={node}
                />
              ) : (
                <PrototypeTreeEntry
                  key={node.id}
                  href={node.href}
                  isActive={node.id === activeEntryId}
                  label={node.label}
                />
              ),
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain({
  items,
  label,
  className,
}: {
  items: NavMainItem[]
  label?: string
  className?: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isWorkspaceHref = (href: string) =>
    href === "/workspace" || href === "/organization" || href === "/organization/workspace"
  const matchesAliasWorkspacePath = (href: string, currentPath: string) => {
    if (!isWorkspaceHref(href)) return false
    return currentPath === "/organization" || currentPath.startsWith("/organization/workspace")
  }

  const activeHref = pathname
    ? items.reduce<string | null>((current, item) => {
        if (!item.href) return current
        const matches =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          matchesAliasWorkspacePath(item.href, pathname)
        if (!matches) return current
        if (!current || item.href.length > current.length) return item.href
        return current
      }, null)
    : null
  const prototypeActiveEntryId = resolvePrototypeLabSidebarActiveEntryId(
    searchParams.get("entry"),
  )

  return (
    <SidebarGroup className={cn("py-0", className)}>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = Boolean(item.href && item.href === activeHref)
            const isOrganizationItem = Boolean(item.href && isWorkspaceHref(item.href))
            const tourId =
              isOrganizationItem
                ? "nav-organization"
                : item.href === "/organization/documents"
                  ? "nav-documents"
                  : item.href === "/roadmap"
                  ? "nav-roadmap"
                  : undefined

            if (!item.href || item.locked) {
              return (
                <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className="justify-start gap-2 opacity-90 cursor-default hover:bg-transparent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                    <div aria-disabled className="flex w-full items-center gap-2">
                      {item.icon ? <item.icon className="size-4 shrink-0" /> : null}
                      <span className="flex-1 min-w-0 truncate whitespace-nowrap leading-snug group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                      <span className="ml-auto flex shrink-0 items-center gap-1.5 group-data-[collapsible=icon]:hidden">
                        {item.upgradeHref ? (
                          <Link
                            href={item.upgradeHref}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-medium text-foreground transition hover:bg-muted"
                          >
                            {item.upgradeLabel ?? item.badge ?? "Upgrade"}
                          </Link>
                        ) : item.badge ? (
                          <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {item.badge}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            if (item.tree?.length) {
              return (
                <NavMainTreeItem
                  key={item.title}
                  activeEntryId={prototypeActiveEntryId}
                  isActive={isActive}
                  item={item}
                  tourId={tourId}
                />
              )
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className="justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                >
                  <Link
                    href={item.href}
                    title={item.title}
                    data-tour={tourId}
                    className="flex w-full items-center gap-2"
                  >
                      {item.icon ? <item.icon className="size-4 shrink-0" /> : null}
                      <span className="flex-1 min-w-0 truncate whitespace-nowrap leading-snug group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                      <span className="ml-auto flex shrink-0 items-center gap-2 group-data-[collapsible=icon]:hidden">
                        {item.href === "/roadmap" ? (
                          <ArrowUpRightIcon className="size-3.5 text-muted-foreground" aria-hidden />
                        ) : null}
                      </span>
                    </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
