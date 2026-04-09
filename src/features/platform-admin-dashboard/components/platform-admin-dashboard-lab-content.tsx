"use client"

import Link from "next/link"
import ArrowUpRightIcon from "lucide-react/dist/esm/icons/arrow-up-right"
import BadgeCheckIcon from "lucide-react/dist/esm/icons/badge-check"
import CircleDotIcon from "lucide-react/dist/esm/icons/circle-dot"
import SearchIcon from "lucide-react/dist/esm/icons/search"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { PlatformAdminDashboardProjectBoardView } from "./platform-admin-dashboard-project-board-view"
import { PlatformAdminDashboardProjectListView } from "./platform-admin-dashboard-project-list-view"
import { PlatformAdminDashboardProjectTimelineView } from "./platform-admin-dashboard-project-timeline-view"
import { PlatformAdminDashboardSectionPlaceholder } from "./platform-admin-dashboard-section-placeholder"
import { usePlatformAdminDashboardController } from "../hooks/use-platform-admin-dashboard-controller"
import {
  PLATFORM_ADMIN_DASHBOARD_LAB_PRIORITIES,
  PLATFORM_ADMIN_DASHBOARD_LAB_STATUSES,
} from "../lib/platform-admin-dashboard-lab"

type PlatformAdminDashboardLabContentProps = {
  controller: ReturnType<typeof usePlatformAdminDashboardController>
}

const VIEW_OPTIONS = [
  { id: "list", label: "List" },
  { id: "board", label: "Board" },
  { id: "timeline", label: "Timeline" },
] as const

export function PlatformAdminDashboardLabContent({
  controller,
}: PlatformAdminDashboardLabContentProps) {
  const showProjects = controller.state.section === "projects"

  return (
    <SidebarInset className="min-h-svh bg-transparent">
      <div className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_34%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(248,250,252,0.94))] px-3 py-3 text-foreground dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_30%),linear-gradient(180deg,rgba(3,7,18,0.98),rgba(2,6,23,0.96))]">
        <div className="flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-[28px] border border-border/70 bg-background/90 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur">
          <header className="space-y-5 border-b border-border/60 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <SidebarTrigger className="mt-1 rounded-xl" />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Staff-only</Badge>
                    <Badge variant="secondary">Mocked donor data</Badge>
                    <Badge variant="secondary">Commit {controller.state.sourceCommitShort}</Badge>
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                      {controller.state.sectionLabel}
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      Isolated import of Jason Uxui&apos;s project dashboard shell for
                      internal evaluation and gradual Coach House adaptation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" className="gap-2">
                  <Link
                    href={controller.sourceRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source repo
                    <ArrowUpRightIcon className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/internal">
                    <BadgeCheckIcon className="h-4 w-4" aria-hidden />
                    Internal tools
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full max-w-md">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={controller.state.query}
                  onChange={(event) =>
                    controller.replaceSearch({ query: event.currentTarget.value })
                  }
                  className="h-10 rounded-xl border-border/70 bg-background pl-9 shadow-none"
                  placeholder="Search projects, tags, assignees, tasks…"
                />
              </div>

              {showProjects ? (
                <div className="flex flex-wrap items-center gap-2">
                  {VIEW_OPTIONS.map((view) => (
                    <Button
                      key={view.id}
                      type="button"
                      variant={
                        controller.state.viewType === view.id ? "default" : "outline"
                      }
                      className="rounded-xl"
                      onClick={() => controller.replaceSearch({ view: view.id })}
                    >
                      {view.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>

            {showProjects ? (
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full">
                    Status
                  </Badge>
                  {PLATFORM_ADMIN_DASHBOARD_LAB_STATUSES.map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant={
                        controller.state.status === status ? "default" : "outline"
                      }
                      className="h-8 rounded-full px-3 text-xs capitalize"
                      onClick={() =>
                        controller.replaceSearch({
                          status:
                            controller.state.status === status ? null : status,
                        })
                      }
                    >
                      {status}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full">
                    Priority
                  </Badge>
                  {PLATFORM_ADMIN_DASHBOARD_LAB_PRIORITIES.map((priority) => (
                    <Button
                      key={priority}
                      type="button"
                      variant={
                        controller.state.priority === priority
                          ? "default"
                          : "outline"
                      }
                      className="h-8 rounded-full px-3 text-xs capitalize"
                      onClick={() =>
                        controller.replaceSearch({
                          priority:
                            controller.state.priority === priority
                              ? null
                              : priority,
                        })
                      }
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
            {showProjects ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {controller.state.summaries.map((summary) => (
                    <Card key={summary.label} className="border-border/70 bg-background/95">
                      <CardContent className="space-y-2 p-4">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {summary.label}
                        </p>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-semibold text-foreground">
                            {summary.value}
                          </span>
                          <CircleDotIcon
                            className={cn(
                              "mb-1 h-3.5 w-3.5 text-muted-foreground",
                              summary.tone === "accent" && "text-emerald-500",
                            )}
                            aria-hidden
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {controller.state.filteredProjects.length === 0 ? (
                  <PlatformAdminDashboardSectionPlaceholder sectionLabel="No matching projects" />
                ) : null}

                {controller.state.filteredProjects.length > 0 &&
                controller.state.viewType === "list" ? (
                  <PlatformAdminDashboardProjectListView
                    projects={controller.state.filteredProjects}
                  />
                ) : null}

                {controller.state.filteredProjects.length > 0 &&
                controller.state.viewType === "board" ? (
                  <PlatformAdminDashboardProjectBoardView
                    groupedProjects={controller.state.groupedProjects}
                  />
                ) : null}

                {controller.state.filteredProjects.length > 0 &&
                controller.state.viewType === "timeline" ? (
                  <PlatformAdminDashboardProjectTimelineView
                    projects={controller.state.filteredProjects}
                  />
                ) : null}
              </div>
            ) : (
              <PlatformAdminDashboardSectionPlaceholder
                sectionLabel={controller.state.sectionLabel}
              />
            )}
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
